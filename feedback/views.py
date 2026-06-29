from django.utils import timezone
from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Feedback
from .serializers import FeedbackSerializer


class FeedbackListCreateView(generics.ListCreateAPIView):
    serializer_class = FeedbackSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ('manager', 'supervisor'):
            qs = Feedback.objects.select_related('user', 'responded_by').all()
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


class FeedbackRespondView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role not in ('manager', 'supervisor'):
            return Response({'detail': 'Yetkisiz.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            feedback = Feedback.objects.get(pk=pk)
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
