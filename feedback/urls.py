from django.urls import path
from .views import FeedbackListCreateView, FeedbackRespondView, FeedbackStatsView

app_name = 'feedback'

urlpatterns = [
    path('', FeedbackListCreateView.as_view(), name='feedback-list'),
    path('stats/', FeedbackStatsView.as_view(), name='feedback-stats'),
    path('<int:pk>/respond/', FeedbackRespondView.as_view(), name='feedback-respond'),
]
