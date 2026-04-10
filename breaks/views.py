from rest_framework import status
from rest_framework.generics import GenericAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone

from users.permissions import IsManager, IsManagerOrSupervisor
from .models import Break
from .serializers import BreakSerializer
from assignments.utils import get_business_date


class StartBreakView(GenericAPIView):
    """Employee starts a break. Only one active break allowed at a time."""
    permission_classes = [IsAuthenticated]
    serializer_class = BreakSerializer

    def post(self, request):
        break_type = request.data.get('break_type')
        if break_type not in ('lunch', 'short'):
            return Response({'error': 'break_type must be lunch or short'}, status=status.HTTP_400_BAD_REQUEST)

        # Reject if already on break
        active = Break.objects.filter(user=request.user, ended_at__isnull=True).first()
        if active:
            return Response(
                {'error': 'Zaten aktif bir molasınız var.', 'break': BreakSerializer(active).data},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # One lunch break per business day
        if break_type == 'lunch':
            today = get_business_date()
            if Break.objects.filter(user=request.user, break_type='lunch', date=today).exists():
                return Response(
                    {'error': 'Bugün zaten yemek molası kullandınız.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        brk = Break.objects.create(
            user=request.user,
            break_type=break_type,
            date=get_business_date(),
            started_at=timezone.now(),
        )
        return Response(BreakSerializer(brk).data, status=status.HTTP_201_CREATED)


class EndBreakView(GenericAPIView):
    """Employee ends their active break."""
    permission_classes = [IsAuthenticated]
    serializer_class = BreakSerializer

    def post(self, request):
        active = Break.objects.filter(user=request.user, ended_at__isnull=True).first()
        if not active:
            return Response({'error': 'Aktif molasınız yok.'}, status=status.HTTP_400_BAD_REQUEST)

        active.ended_at = timezone.now()
        active.save(update_fields=['ended_at'])
        return Response(BreakSerializer(active).data)


class ActiveBreaksView(GenericAPIView):
    """Returns all currently active breaks (manager/supervisor only)."""
    permission_classes = [IsAuthenticated, IsManagerOrSupervisor]
    serializer_class = BreakSerializer

    def get(self, request):
        qs = Break.objects.filter(ended_at__isnull=True).select_related('user').order_by('started_at')
        return Response(BreakSerializer(qs, many=True).data)


class MyActiveBreakView(GenericAPIView):
    """Returns the current user's active break, if any."""
    permission_classes = [IsAuthenticated]
    serializer_class = BreakSerializer

    def get(self, request):
        active = Break.objects.filter(user=request.user, ended_at__isnull=True).first()
        if not active:
            return Response(None)
        return Response(BreakSerializer(active).data)


class BreakListView(GenericAPIView):
    """
    List breaks.
    - Employees see only their own.
    - Managers/supervisors see all, filterable by ?date= and ?user_id=.
    Also supports ?summary=1 to return per-user daily totals.
    """
    permission_classes = [IsAuthenticated]
    serializer_class = BreakSerializer

    def get(self, request):
        user = request.user
        qs = Break.objects.select_related('user').filter(ended_at__isnull=False)

        if user.role == 'employee':
            qs = qs.filter(user=user)
        else:
            uid = request.query_params.get('user_id')
            if uid:
                qs = qs.filter(user_id=uid)

        date_filter = request.query_params.get('date')
        if date_filter:
            qs = qs.filter(date=date_filter)
        date_from = request.query_params.get('date_from')
        if date_from:
            qs = qs.filter(date__gte=date_from)
        date_to = request.query_params.get('date_to')
        if date_to:
            qs = qs.filter(date__lte=date_to)

        # Summary mode: per-user daily totals
        if request.query_params.get('summary') == '1':
            from django.db.models import Sum, Count
            rows = (
                qs.values('user_id', 'user__name', 'user__role', 'date')
                .annotate(
                    total_seconds=Sum('ended_at') - Sum('started_at'),  # won't work directly
                    break_count=Count('id'),
                )
            )
            # Compute manually
            from collections import defaultdict
            buckets = defaultdict(lambda: {'user_id': 0, 'user_name': '', 'user_role': '', 'date': '', 'break_count': 0, 'total_minutes': 0.0, 'lunch_used': False, 'short_count': 0})
            for b in qs:
                key = (b.user_id, str(b.date))
                d = buckets[key]
                d['user_id'] = b.user_id
                d['user_name'] = b.user.name
                d['user_role'] = b.user.role
                d['date'] = str(b.date)
                d['break_count'] += 1
                d['total_minutes'] = round(d['total_minutes'] + b.duration_minutes, 1)
                if b.break_type == 'lunch':
                    d['lunch_used'] = True
                else:
                    d['short_count'] += 1
            return Response(sorted(buckets.values(), key=lambda x: (x['date'], x['user_name'])))

        return Response(BreakSerializer(qs.order_by('-started_at'), many=True).data)
