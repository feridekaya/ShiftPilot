import datetime
from datetime import timedelta

from django.db.models import Avg, Count
from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Feedback
from .serializers import FeedbackSerializer

FEEDBACK_CUTOFF_HOUR = 5  # Store closes at 04:00; feedback day rolls over at 05:00


class FeedbackListCreateView(generics.ListCreateAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ('manager', 'supervisor'):
            qs = Feedback.objects.filter(user__tenant=user.tenant)
            if user.role == 'supervisor':
                qs = qs.filter(user__unit_id=user.unit_id) if user.unit_id else qs.none()
            qs = qs.select_related('user', 'responded_by')
            category = self.request.query_params.get('category')
            response_filter = self.request.query_params.get('response')
            if category:
                qs = qs.filter(category=category)
            if response_filter == 'pending':
                qs = qs.filter(response__isnull=True)
            elif response_filter in ('positive', 'negative'):
                qs = qs.filter(response=response_filter)
            return qs
        # Employee/supervisor sadece kendi feedbacklarini görür listede
        return Feedback.objects.filter(user=user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'manager':
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Müdürler feedback yazamaz.")
        serializer.save(user=user)


class FeedbackStatsView(APIView):
    """Aggregate customer rating + personnel feedback management stats for today/week/month/overall."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ('manager', 'supervisor'):
            return Response({'detail': 'Yetkisiz.'}, status=status.HTTP_403_FORBIDDEN)

        local_dt = timezone.localtime(timezone.now())
        if local_dt.hour < FEEDBACK_CUTOFF_HOUR:
            today_biz = (local_dt - timedelta(days=1)).date()
        else:
            today_biz = local_dt.date()

        def day_start(d):
            naive = datetime.datetime.combine(d, datetime.time(FEEDBACK_CUTOFF_HOUR, 0))
            return timezone.make_aware(naive)

        today_start = day_start(today_biz)
        today_end   = day_start(today_biz + timedelta(days=1))
        week_start  = day_start(today_biz - timedelta(days=today_biz.weekday()))
        month_start = day_start(today_biz.replace(day=1))

        def stats_for(qs):
            agg = qs.filter(customer_rating__isnull=False).aggregate(
                avg=Avg('customer_rating'), count=Count('id')
            )
            avg_val = agg['avg']
            return {
                'customer': {
                    'avg': round(float(avg_val), 2) if avg_val is not None else None,
                    'count': agg['count'],
                },
                'personnel': {
                    'positive': qs.filter(response='positive').count(),
                    'negative': qs.filter(response='negative').count(),
                    'pending':  qs.filter(response__isnull=True).count(),
                    'total':    qs.count(),
                },
            }

        all_fb = Feedback.objects.filter(user__tenant=request.user.tenant)
        if request.user.role == 'supervisor':
            all_fb = all_fb.filter(user__unit_id=request.user.unit_id) if request.user.unit_id else all_fb.none()
        return Response({
            'today':   stats_for(all_fb.filter(created_at__gte=today_start, created_at__lt=today_end)),
            'week':    stats_for(all_fb.filter(created_at__gte=week_start,  created_at__lt=today_end)),
            'month':   stats_for(all_fb.filter(created_at__gte=month_start, created_at__lt=today_end)),
            'overall': stats_for(all_fb),
        })


class FeedbackRespondView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role not in ('manager', 'supervisor'):
            return Response({'detail': 'Yetkisiz.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            fb_qs = Feedback.objects.filter(user__tenant=request.user.tenant)
            if request.user.role == 'supervisor':
                fb_qs = fb_qs.filter(user__unit_id=request.user.unit_id) if request.user.unit_id else fb_qs.none()
            feedback = fb_qs.get(pk=pk)
        except Feedback.DoesNotExist:
            return Response({'detail': 'Bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)

        resp = request.data.get('response')
        if resp not in ('positive', 'negative'):
            return Response({'detail': 'response alanı positive veya negative olmalı.'}, status=status.HTTP_400_BAD_REQUEST)

        feedback.response = resp
        feedback.response_note = request.data.get('response_note', '')
        feedback.responded_by = request.user
        feedback.responded_at = timezone.now()
        feedback.save()

        serializer = FeedbackSerializer(feedback, context={'request': request})
        return Response(serializer.data)
