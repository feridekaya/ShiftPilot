from django.contrib import admin
from .models import Zone, Shift, Task, TaskSchedule


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    search_fields = ('name',)


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ('name', 'start_time', 'end_time')


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'zone', 'coefficient', 'requires_photo', 'created_by')
    list_filter = ('zone', 'requires_photo')
    search_fields = ('title',)


@admin.register(TaskSchedule)
class TaskScheduleAdmin(admin.ModelAdmin):
    list_display = ('task', 'frequency')
    list_filter = ('frequency',)
