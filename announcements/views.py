from rest_framework import generics, status
from rest_framework.permissions import IsAuthenticated, BasePermission
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import Announcement, AnnouncementRead
from .serializers import AnnouncementSerializer


class IsManagerOrReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return bool(request.user and request.user.is_authenticated)
        return bool(request.user and request.user.is_authenticated and request.user.role == 'manager')

    def has_object_permission(self, request, view, obj):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.role == 'manager')


class AnnouncementListCreateView(generics.ListCreateAPIView):
    queryset = Announcement.objects.filter(is_active=True)
    serializer_class = AnnouncementSerializer
    permission_classes = [IsManagerOrReadOnly]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class AnnouncementDetailView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Announcement.objects.all()
    serializer_class = AnnouncementSerializer
    permission_classes = [IsManagerOrReadOnly]

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['request'] = self.request
        return ctx

    def perform_update(self, serializer):
        serializer.save()


class MarkAnnouncementReadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            announcement = Announcement.objects.get(pk=pk, is_active=True)
        except Announcement.DoesNotExist:
            return Response({'detail': 'Bulunamadı.'}, status=status.HTTP_404_NOT_FOUND)
        AnnouncementRead.objects.get_or_create(announcement=announcement, user=request.user)
        serializer = AnnouncementSerializer(announcement, context={'request': request})
        return Response(serializer.data)
