from django.urls import path
from .views import DailyEmployeeListView, EmployeeEvaluationCreateView, EmployeeEvaluationDetailView, EvaluationSummaryView

urlpatterns = [
    path('daily-employees/', DailyEmployeeListView.as_view(), name='evaluation-daily-employees'),
    path('summary/', EvaluationSummaryView.as_view(), name='evaluation-summary'),
    path('', EmployeeEvaluationCreateView.as_view(), name='evaluation-create'),
    path('<int:pk>/', EmployeeEvaluationDetailView.as_view(), name='evaluation-detail'),
]
