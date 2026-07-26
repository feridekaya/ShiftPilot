from datetime import date, timedelta

from django.db.models import Q
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.permissions import IsManager, IsManagerOrSupervisor
from .models import Zone, Unit, Shift, Task, TaskSchedule, WorkSchedule
from .serializers import (
    ZoneSerializer, UnitSerializer, ShiftSerializer, TaskSerializer,
    TaskScheduleSerializer, WorkScheduleSerializer,
)


class ReadOnlyOrManagerMixin:
    """Allow read for any authenticated user; write for managers and supervisors."""

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsManagerOrSupervisor()]


class ZoneViewSet(ReadOnlyOrManagerMixin, viewsets.ModelViewSet):
    """Bölge: fiziksel konum (görev/atama etiketlemesi için). Yetkilendirmede kullanılmaz — tüm roller görebilir."""
    serializer_class = ZoneSerializer
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return Zone.objects.filter(tenant=self.request.user.tenant).order_by('name')

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class UnitViewSet(ReadOnlyOrManagerMixin, viewsets.ModelViewSet):
    """Birim: personelin bağlı olduğu ekip. Şef/personel sadece kendi birimini görür."""
    serializer_class = UnitSerializer
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = Unit.objects.filter(tenant=self.request.user.tenant)
        if self.request.user.role in ('supervisor', 'employee'):
            if not self.request.user.unit_id:
                return qs.none()
            qs = qs.filter(id=self.request.user.unit_id)
        return qs.order_by('name')

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class ShiftViewSet(ReadOnlyOrManagerMixin, viewsets.ModelViewSet):
    serializer_class = ShiftSerializer
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        return Shift.objects.filter(tenant=self.request.user.tenant).order_by('start_time')

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)


class TaskViewSet(ReadOnlyOrManagerMixin, viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = Task.objects.filter(tenant=self.request.user.tenant)
        if self.request.user.role in ('supervisor', 'employee'):
            if not self.request.user.unit_id:
                qs = qs.filter(unit__isnull=True)
            else:
                qs = qs.filter(Q(unit_id=self.request.user.unit_id) | Q(unit__isnull=True))
        return qs.select_related('zone', 'unit', 'created_by').prefetch_related('permanent_assignees')

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant, created_by=self.request.user)

    @action(detail=True, methods=['patch'], url_path='set-permanent-assignees',
            permission_classes=[IsAuthenticated, IsManagerOrSupervisor])
    def set_permanent_assignees(self, request, pk=None):
        """Set (replace) the full list of permanent assignees for a task."""
        from users.models import User as UserModel
        task = self.get_object()
        user_ids = request.data.get('user_ids', [])
        users = UserModel.objects.filter(id__in=user_ids, tenant=request.user.tenant)
        if request.user.role == 'supervisor':
            users = users.filter(unit_id=request.user.unit_id)
        task.permanent_assignees.set(users)
        return Response(TaskSerializer(task, context={'request': request}).data)


class TaskScheduleViewSet(ReadOnlyOrManagerMixin, viewsets.ModelViewSet):
    serializer_class = TaskScheduleSerializer
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

    def get_queryset(self):
        qs = TaskSchedule.objects.filter(task__tenant=self.request.user.tenant)
        if self.request.user.role in ('supervisor', 'employee'):
            if not self.request.user.unit_id:
                qs = qs.filter(task__unit__isnull=True)
            else:
                qs = qs.filter(Q(task__unit_id=self.request.user.unit_id) | Q(task__unit__isnull=True))
        return qs.select_related('task')


class WorkScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = WorkScheduleSerializer
    http_method_names = ['get', 'post', 'put', 'delete', 'head', 'options']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsManager()]

    def get_queryset(self):
        user = self.request.user
        qs = WorkSchedule.objects.filter(user__tenant=user.tenant)
        if user.role == 'supervisor':
            if not user.unit_id:
                qs = qs.none()
            else:
                qs = qs.filter(user__unit_id=user.unit_id)
        elif user.role == 'employee':
            qs = qs.filter(user=user)
        qs = qs.select_related('user')
        week_start = self.request.query_params.get('week_start')
        if week_start:
            try:
                start = date.fromisoformat(week_start)
                end = start + timedelta(days=6)
                qs = qs.filter(date__gte=start, date__lte=end)
            except ValueError:
                pass
        return qs.order_by('user__name', 'date')

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsManagerOrSupervisor])
    def bulk(self, request):
        """Create or update multiple schedule entries at once."""
        from users.models import User as UserModel
        items = request.data if isinstance(request.data, list) else []
        tenant_user_ids = set(
            UserModel.objects.filter(tenant=request.user.tenant).values_list('id', flat=True)
        )
        results = []
        for item in items:
            uid = item.get('user_id')
            d = item.get('date')
            if not uid or not d or uid not in tenant_user_ids:
                continue
            obj, _ = WorkSchedule.objects.update_or_create(
                user_id=uid,
                date=d,
                defaults={
                    'is_off': item.get('is_off', False),
                    'start_time': item.get('start_time') or None,
                    'end_time': item.get('end_time') or None,
                },
            )
            results.append(WorkScheduleSerializer(obj).data)
        return Response(results)
