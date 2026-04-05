from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ZoneViewSet, ShiftViewSet, TaskViewSet, TaskScheduleViewSet, WorkScheduleViewSet

router = DefaultRouter()
router.register(r'zones', ZoneViewSet, basename='zone')
router.register(r'shifts', ShiftViewSet, basename='shift')
router.register(r'schedules', TaskScheduleViewSet, basename='taskschedule')
router.register(r'work-schedules', WorkScheduleViewSet, basename='workschedule')
router.register(r'', TaskViewSet, basename='task')  # must be last

urlpatterns = [
    path('', include(router.urls)),
]
