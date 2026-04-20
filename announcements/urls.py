from django.urls import path
from .views import AnnouncementListCreateView, AnnouncementDetailView, MarkAnnouncementReadView

app_name = 'announcements'

urlpatterns = [
    path('', AnnouncementListCreateView.as_view(), name='announcement-list'),
    path('<int:pk>/', AnnouncementDetailView.as_view(), name='announcement-detail'),
    path('<int:pk>/read/', MarkAnnouncementReadView.as_view(), name='announcement-read'),
]
