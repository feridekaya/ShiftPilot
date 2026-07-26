from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

from users.views import (
    CustomTokenObtainPairView, RegisterView, MeView, LogoutView,
    VerifyEmailView, PasswordResetRequestView, PasswordResetConfirmView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # Auth
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register/', RegisterView.as_view(), name='register'),
    path('api/auth/me/', MeView.as_view(), name='me'),
    path('api/auth/logout/', LogoutView.as_view(), name='logout'),
    path('api/auth/verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('api/auth/password-reset/', PasswordResetRequestView.as_view(), name='password_reset'),
    path('api/auth/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
    # Resources
    path('api/tenants/', include('tenants.urls')),
    path('api/users/', include('users.urls')),
    path('api/tasks/', include('tasks.urls')),
    path('api/assignments/', include('assignments.urls')),
    path('api/breaks/', include('breaks.urls')),
    path('api/announcements/', include('announcements.urls')),
    path('api/feedback/', include('feedback.urls')),
    path('api/trainings/', include('trainings.urls')),
    path('api/evaluations/', include('evaluations.urls')),
] + static(settings.MEDIA_URL, document_root=getattr(settings, 'MEDIA_ROOT', ''))
