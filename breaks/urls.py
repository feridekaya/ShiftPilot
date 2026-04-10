from django.urls import path
from .views import StartBreakView, EndBreakView, ActiveBreaksView, MyActiveBreakView, BreakListView

urlpatterns = [
    path('', BreakListView.as_view(), name='break-list'),
    path('start/', StartBreakView.as_view(), name='break-start'),
    path('end/', EndBreakView.as_view(), name='break-end'),
    path('active/', ActiveBreaksView.as_view(), name='break-active'),
    path('my-active/', MyActiveBreakView.as_view(), name='break-my-active'),
]
