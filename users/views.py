from django.conf import settings
from rest_framework import generics, viewsets, status
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from tenants.models import Tenant
from .models import User, EmailVerificationToken, PasswordResetToken, Role
from .permissions import IsManager, IsManagerOrSupervisor
from .serializers import (
    CustomTokenObtainPairSerializer,
    RegisterSerializer,
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    RoleSerializer,
)
from .email_utils import send_verification_email, send_password_reset_email

DEFAULT_TRIAL_LICENSE_LIMIT = getattr(settings, 'DEFAULT_TRIAL_LICENSE_LIMIT', 5)

LICENSE_LIMIT_MESSAGE = (
    'Lisans limitine ulaşıldı. Paketinizdeki kullanıcı kotasını doldurdunuz. '
    'Ekibinize yeni personel eklemek için lisans limitinizi yükseltin.'
)


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    permission_classes = [AllowAny]
    serializer_class = RegisterSerializer

    def perform_create(self, serializer):
        is_public = not self.request.user or not self.request.user.is_authenticated
        if is_public:
            # Public registration: creates a brand-new business (tenant) with this
            # user as its first manager, and requires email verification.
            business_name = self.request.data.get('business_name', '').strip() or f"{serializer.validated_data.get('name', '')} İşletmesi"
            tenant = Tenant.objects.create(name=business_name, license_limit=DEFAULT_TRIAL_LICENSE_LIMIT)
            user = serializer.save(tenant=tenant, role='manager', is_active=False)
            token_obj = EmailVerificationToken.objects.create(user=user)
            try:
                send_verification_email(user, token_obj.token)
            except Exception:
                pass
        else:
            tenant = self.request.user.tenant
            is_active = serializer.validated_data.get('is_active', True)
            if is_active and not tenant.has_seat_available():
                raise ValidationError({'detail': LICENSE_LIMIT_MESSAGE})
            serializer.save(tenant=tenant)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        is_public = not request.user or not request.user.is_authenticated
        if is_public:
            return Response(
                {'detail': 'Hesabınız oluşturuldu. Lütfen e-posta adresinizi doğrulayın.'},
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token_str = request.data.get('token')
        if not token_str:
            return Response({'detail': 'Token gerekli.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token_obj = EmailVerificationToken.objects.select_related('user').get(token=token_str)
        except (EmailVerificationToken.DoesNotExist, ValueError):
            return Response({'detail': 'Geçersiz veya süresi dolmuş bağlantı.'}, status=status.HTTP_400_BAD_REQUEST)
        if not token_obj.is_valid():
            token_obj.delete()
            return Response({'detail': 'Doğrulama bağlantısının süresi dolmuş.'}, status=status.HTTP_400_BAD_REQUEST)
        user = token_obj.user
        user.is_active = True
        user.save()
        token_obj.delete()
        return Response({'detail': 'E-posta adresiniz doğrulandı. Giriş yapabilirsiniz.'})


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        try:
            user = User.objects.get(email=email, is_active=True)
        except User.DoesNotExist:
            return Response(
                {'detail': 'Bu e-posta adresiyle kayıtlı aktif bir hesap bulunamadı.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        PasswordResetToken.objects.filter(user=user, used=False).delete()
        token_obj = PasswordResetToken.objects.create(user=user)
        try:
            send_password_reset_email(user, token_obj.token)
        except Exception:
            token_obj.delete()
            return Response(
                {'detail': 'E-posta gönderilemedi. Lütfen daha sonra tekrar deneyin.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response({'detail': 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token_str = request.data.get('token')
        new_password = request.data.get('password', '')
        if not token_str or not new_password:
            return Response({'detail': 'Token ve yeni şifre gerekli.'}, status=status.HTTP_400_BAD_REQUEST)
        if len(new_password) < 6:
            return Response({'detail': 'Şifre en az 6 karakter olmalıdır.'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            token_obj = PasswordResetToken.objects.select_related('user').get(token=token_str)
        except (PasswordResetToken.DoesNotExist, ValueError):
            return Response({'detail': 'Geçersiz veya süresi dolmuş bağlantı.'}, status=status.HTTP_400_BAD_REQUEST)
        if not token_obj.is_valid():
            token_obj.delete()
            return Response({'detail': 'Sıfırlama bağlantısının süresi dolmuş. Yeniden talep edin.'}, status=status.HTTP_400_BAD_REQUEST)
        user = token_obj.user
        user.set_password(new_password)
        user.save()
        token_obj.used = True
        token_obj.save()
        return Response({'detail': 'Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz.'})


class MeView(generics.RetrieveUpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user


class LogoutView(APIView):
    """Invalidates the session. Active breaks are NOT ended on logout."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({'detail': 'logged out'}, status=status.HTTP_200_OK)


class UserViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        qs = User.objects.filter(tenant=self.request.user.tenant)
        if self.request.user.role == 'supervisor':
            if not self.request.user.unit_id:
                return qs.none()
            qs = qs.filter(unit_id=self.request.user.unit_id)
        return qs.order_by('name')

    def get_permissions(self):
        if self.request.method in ('GET', 'HEAD', 'OPTIONS'):
            return [IsAuthenticated(), IsManagerOrSupervisor()]
        return [IsAuthenticated(), IsManager()]
    http_method_names = ['get', 'post', 'put', 'delete', 'head', 'options']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        if self.action in ('update', 'partial_update'):
            return UserUpdateSerializer
        return UserSerializer

    def perform_create(self, serializer):
        tenant = self.request.user.tenant
        is_active = serializer.validated_data.get('is_active', True)
        if is_active and not tenant.has_seat_available():
            raise ValidationError({'detail': LICENSE_LIMIT_MESSAGE})
        serializer.save(tenant=tenant)

    def perform_update(self, serializer):
        instance = serializer.instance
        was_active = instance.is_active
        will_be_active = serializer.validated_data.get('is_active', was_active)
        if will_be_active and not was_active and not instance.tenant.has_seat_available():
            raise ValidationError({'detail': LICENSE_LIMIT_MESSAGE})
        serializer.save()


class RoleViewSet(viewsets.ModelViewSet):
    """Özelleştirilebilir Rol (iş unvanı) listesi — sadece yönetici yönetir."""
    serializer_class = RoleSerializer
    permission_classes = [IsAuthenticated, IsManager]
    http_method_names = ['get', 'post', 'put', 'delete', 'head', 'options']

    def get_queryset(self):
        return Role.objects.filter(tenant=self.request.user.tenant).order_by('name')

    def perform_create(self, serializer):
        serializer.save(tenant=self.request.user.tenant)
