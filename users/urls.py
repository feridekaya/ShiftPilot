from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UserViewSet, StaffTeamViewSet

router = DefaultRouter()
router.register(r'teams', StaffTeamViewSet, basename='staffteam')
router.register(r'', UserViewSet, basename='user')

urlpatterns = [
    path('', include(router.urls)),
]
