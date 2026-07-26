from django.contrib import admin
from .models import Zone, Shift, Task, TaskSchedule


@admin.register(Zone)
class ZoneAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant', 'description')
    list_filter = ('tenant',)
    search_fields = ('name',)


@admin.register(Shift)
class ShiftAdmin(admin.ModelAdmin):
    list_display = ('name', 'tenant', 'start_time', 'end_time')
    list_filter = ('tenant',)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('title', 'tenant', 'zone', 'coefficient', 'requires_photo', 'created_by')
    list_filter = ('tenant', 'zone', 'requires_photo')
    search_fields = ('title',)


@admin.register(TaskSchedule)
class TaskScheduleAdmin(admin.ModelAdmin):
    list_display = ('task', 'frequency')
    list_filter = ('frequency',)
