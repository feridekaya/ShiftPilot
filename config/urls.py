from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

from users.views import CustomTokenObtainPairView, RegisterView, MeView

urlpatterns = [
    path('admin/', admin.site.urls),
    # Auth
    path('api/auth/login', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/register', RegisterView.as_view(), name='register'),
    path('api/auth/me', MeView.as_view(), name='me'),
    # Resources
    path('api/users/', include('users.urls')),
    path('api/tasks/', include('tasks.urls')),
    path('api/assignments/', include('assignments.urls')),
]
