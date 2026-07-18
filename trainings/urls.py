from django.urls import path
from .views import TrainingListCreateView, TrainingDetailView, PdfUploadView

urlpatterns = [
    path('upload-pdf/', PdfUploadView.as_view(), name='training-pdf-upload'),
    path('', TrainingListCreateView.as_view(), name='training-list'),
    path('<int:pk>/', TrainingDetailView.as_view(), name='training-detail'),
]
