from django.contrib import admin
from .models import Assignment, TaskSubmission


@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ('user', 'task', 'shift', 'date', 'status', 'assigned_by')
    list_filter = ('status', 'date', 'shift')
    search_fields = ('user__name', 'task__title')


@admin.register(TaskSubmission)
class TaskSubmissionAdmin(admin.ModelAdmin):
    list_display = ('assignment', 'approval_status', 'submitted_at', 'approved_by')
    list_filter = ('approval_status',)
