from django.urls import path
from .views import DailyEmployeeListView, EmployeeEvaluationCreateView, EmployeeEvaluationDetailView

urlpatterns = [
    path('daily-employees/', DailyEmployeeListView.as_view(), name='evaluation-daily-employees'),
    path('', EmployeeEvaluationCreateView.as_view(), name='evaluation-create'),
    path('<int:pk>/', EmployeeEvaluationDetailView.as_view(), name='evaluation-detail'),
]
