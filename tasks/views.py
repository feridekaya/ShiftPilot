from datetime import date, timedelta

from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from users.permissions import IsManager
from .models import Zone, Shift, Task, TaskSchedule, WorkSchedule
from .serializers import ZoneSerializer, ShiftSerializer, TaskSerializer, TaskScheduleSerializer, WorkScheduleSerializer


class ReadOnlyOrManagerMixin:
    """Allow read for any authenticated user; write only for managers."""

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsManager()]


class ZoneViewSet(ReadOnlyOrManagerMixin, viewsets.ModelViewSet):
    queryset = Zone.objects.all().order_by('name')
    serializer_class = ZoneSerializer
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']


class ShiftViewSet(ReadOnlyOrManagerMixin, viewsets.ModelViewSet):
    queryset = Shift.objects.all().order_by('start_time')
    serializer_class = ShiftSerializer
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']


class TaskViewSet(ReadOnlyOrManagerMixin, viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    http_method_names = ['get', 'post', 'put', 'delete', 'head', 'options']

    def get_queryset(self):
        return Task.objects.select_related('zone', 'created_by').prefetch_related('permanent_assignees').all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TaskScheduleViewSet(ReadOnlyOrManagerMixin, viewsets.ModelViewSet):
    queryset = TaskSchedule.objects.select_related('task').all()
    serializer_class = TaskScheduleSerializer
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']


class WorkScheduleViewSet(viewsets.ModelViewSet):
    serializer_class = WorkScheduleSerializer
    http_method_names = ['get', 'post', 'put', 'delete', 'head', 'options']

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsAuthenticated()]
        return [IsAuthenticated(), IsManager()]

    def get_queryset(self):
        qs = WorkSchedule.objects.select_related('user')
        week_start = self.request.query_params.get('week_start')
        if week_start:
            try:
                start = date.fromisoformat(week_start)
                end = start + timedelta(days=6)
                qs = qs.filter(date__gte=start, date__lte=end)
            except ValueError:
                pass
        return qs.order_by('user__name', 'date')

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsManager])
    def bulk(self, request):
        """Create or update multiple schedule entries at once."""
        items = request.data if isinstance(request.data, list) else []
        results = []
        for item in items:
            uid = item.get('user_id')
            d = item.get('date')
            if not uid or not d:
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
