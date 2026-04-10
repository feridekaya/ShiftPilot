from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssignmentViewSet, SubmissionViewSet, BusinessDateView, PerformanceView, AuditView

router = DefaultRouter()
router.register(r'submissions', SubmissionViewSet, basename='submission')
router.register(r'', AssignmentViewSet, basename='assignment')  # must be last

urlpatterns = [
    path('business-date/', BusinessDateView.as_view(), name='business-date'),
    path('performance/', PerformanceView.as_view(), name='performance'),
    path('audit/', AuditView.as_view(), name='audit'),
    path('', include(router.urls)),
]
