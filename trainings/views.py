from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from uuid import uuid4

from users.permissions import IsManager
from .models import Training
from .serializers import TrainingSerializer


class PdfUploadView(APIView):
    permission_classes = [IsAuthenticated, IsManager]
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

    def get_permissions(self):
        if self.request.method == 'POST':
            return [IsAuthenticated(), IsManager()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Training.objects.filter(is_active=True)
        if user.role == 'manager':
            return qs
        return qs.filter(visible_to__contains=user.role)

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)


class TrainingDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TrainingSerializer

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsAuthenticated(), IsManager()]
        return [IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        qs = Training.objects.all()
        if user.role == 'manager':
            return qs
        return qs.filter(is_active=True, visible_to__contains=user.role)

    def perform_destroy(self, instance):
        instance.is_active = False
        instance.save()
