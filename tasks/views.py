from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from users.permissions import IsManager
from .models import Zone, Shift, Task, TaskSchedule
from .serializers import ZoneSerializer, ShiftSerializer, TaskSerializer, TaskScheduleSerializer


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
        return Task.objects.select_related('zone', 'created_by').all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class TaskScheduleViewSet(ReadOnlyOrManagerMixin, viewsets.ModelViewSet):
    queryset = TaskSchedule.objects.select_related('task').all()
    serializer_class = TaskScheduleSerializer
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']
