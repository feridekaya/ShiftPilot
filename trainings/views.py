from django.db.models import Q
from rest_framework import generics, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from uuid import uuid4

from .models import Training
from .serializers import TrainingSerializer


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


class PdfUploadView(APIView):
    permission_classes = [IsAuthenticated, IsManagerOrSupervisorWriter]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'Dosya bulunamadı.'}, status=400)
        if file.content_type != 'application/pdf' and not file.name.lower().endswith('.pdf'):
            return Response({'error': 'Sadece PDF dosyası yüklenebilir.'}, status=400)
        if file.size > 20 * 1024 * 1024:
            return Response({'error': 'Dosya boyutu 20 MB\'ı geçemez.'}, status=400)

        key = f'trainings/{uuid4().hex}.pdf'
        default_storage.save(key, ContentFile(file.read()))

        # Build URL directly — avoid boto3 URL generation ambiguity
        from django.conf import settings as django_settings
        custom_domain = getattr(django_settings, 'AWS_S3_CUSTOM_DOMAIN', None)
        if custom_domain:
            url = f'https://{custom_domain}/{key}'
        else:
            url = default_storage.url(key)
            if not url.startswith('http'):
                url = request.build_absolute_uri(url)

        return Response({'url': url})


class TrainingListCreateView(generics.ListCreateAPIView):
    serializer_class = TrainingSerializer
    permission_classes = [IsManagerOrSupervisorWriter]

    def get_queryset(self):
        user = self.request.user
        qs = Training.objects.filter(tenant=user.tenant, is_active=True)
        if user.role == 'manager':
            return qs
        return scope_by_unit(qs, user).filter(visible_to__contains=user.role)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == 'supervisor':
            if not user.unit_id:
                raise ValidationError({'detail': 'Bir birime atanmamış şefler eğitim oluşturamaz.'})
            serializer.save(tenant=user.tenant, uploaded_by=user, unit_id=user.unit_id)
        else:
            serializer.save(tenant=user.tenant, uploaded_by=user)


class TrainingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TrainingSerializer
    permission_classes = [IsManagerOrSupervisorWriter]

    def get_queryset(self):
        user = self.request.user
        qs = Training.objects.filter(tenant=user.tenant)
        if user.role == 'manager':
            return qs
        return scope_by_unit(qs, user).filter(is_active=True, visible_to__contains=user.role)

    def perform_update(self, serializer):
        user = self.request.user
        if user.role == 'supervisor':
            serializer.save(unit_id=user.unit_id)
        else:
            serializer.save()

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
