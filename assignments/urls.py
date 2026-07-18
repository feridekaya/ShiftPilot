from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AssignmentViewSet, SubmissionViewSet, BusinessDateView, PerformanceView, AuditView, AssignmentSuggestView, PhotoUploadView, ActivityLogView

router = DefaultRouter()
router.register(r'submissions', SubmissionViewSet, basename='submission')
router.register(r'', AssignmentViewSet, basename='assignment')  # must be last

urlpatterns = [
    path('business-date/', BusinessDateView.as_view(), name='business-date'),
    path('performance/', PerformanceView.as_view(), name='performance'),
    path('audit/', AuditView.as_view(), name='audit'),
    path('activity/', ActivityLogView.as_view(), name='activity-log'),
    path('suggest/', AssignmentSuggestView.as_view(), name='assignment-suggest'),
    path('upload-photo/', PhotoUploadView.as_view(), name='photo-upload'),
    path('', include(router.urls)),
]
