from django.urls import path
from .views import FeedbackListCreateView, FeedbackRespondView

app_name = 'feedback'

urlpatterns = [
    path('', FeedbackListCreateView.as_view(), name='feedback-list'),
    path('<int:pk>/respond/', FeedbackRespondView.as_view(), name='feedback-respond'),
]
