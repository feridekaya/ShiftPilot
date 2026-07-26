from django.urls import path
from .views import TenantMeView

urlpatterns = [
    path('me/', TenantMeView.as_view(), name='tenant-me'),
]
