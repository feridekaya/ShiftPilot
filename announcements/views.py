from django.db.models import Q
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Announcement, AnnouncementRead
from .serializers import AnnouncementSerializer


def scope_by_unit(qs, user):
    """Manager: no change. Supervisor/employee: own unit + tenant-wide (unit=null) items."""
    if user.role in ('supervisor', 'employee'):
        return qs.filter(Q(unit_id=user.unit_id) | Q(unit__isnull=True)) if user.unit_id else qs.filter(unit__isnull=True)
    return qs


class IsManagerOrSupervisorWriter(BasePermission):
    """Manager: full access. Supervisor: can write, but only within their own unit
    (enforced in perform_create / has_object_permission). Employee: read-only."""

    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return bool(request.user and request.user.is_authenticated)
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ('manager', 'supervisor')
        )

    def has_object_permission(self, request, view, obj):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        user = request.user
        if not (user and user.is_authenticated and user.role in ('manager', 'supervisor')):
            return False
        if user.role == 'supervisor':
            return user.unit_id is not None and obj.unit_id == user.unit_id
        return True


class AnnouncementListCreateView(generics.ListCreateAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsManagerOrSupervisorWriter]

    def get_queryset(self):
        user = self.request.user
        qs = Announcement.objects.filter(tenant=user.tenant, is_active=True)
        if user.role == 'manager':
            return qs  # managers see all they created / all
        qs = scope_by_unit(qs, user)
        # empty target_roles = everyone; otherwise check role is included
        return qs.filter(
            Q(target_roles=[]) | Q(target_roles__contains=user.role)
        )

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'supervisor':
            if not user.unit_id:
                raise ValidationError({'detail': 'Bir birime atanmamış şefler duyuru oluşturamaz.'})
            serializer.save(tenant=user.tenant, created_by=user, unit_id=user.unit_id)
        else:
            serializer.save(tenant=user.tenant, created_by=user)


class AnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = AnnouncementSerializer
    permission_classes = [IsManagerOrSupervisorWriter]

    def get_queryset(self):
        user = self.request.user
        qs = Announcement.objects.filter(tenant=user.tenant)
        if user.role == 'manager':
            return qs
        return scope_by_unit(qs, user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == 'supervisor':
            serializer.save(unit_id=user.unit_id)
        else:
            serializer.save()


class MarkAnnouncementReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            qs = Announcement.objects.filter(tenant=request.user.tenant, is_active=True)
            qs = scope_by_unit(qs, request.user)
            announcement = qs.get(pk=pk)
        except Announcement.DoesNotExist:
            return Response({'detail': 'Bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)
        AnnouncementRead.objects.get_or_create(announcement=announcement, user=request.user)
        serializer = AnnouncementSerializer(announcement, context={'request': request})
        return Response(serializer.data)
