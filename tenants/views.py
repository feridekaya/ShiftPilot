from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from .serializers import TenantSerializer


class TenantMeView(RetrieveAPIView):
    """Returns the current user's tenant, including license usage."""
    serializer_class = TenantSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user.tenant
