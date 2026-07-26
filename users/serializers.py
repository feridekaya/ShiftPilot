from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from tasks.models import Unit
from tasks.serializers import UnitSerializer
from .models import User, Role


class RoleSerializer(serializers.ModelSerializer):
    unit = UnitSerializer(read_only=True)
    unit_id = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), source='unit', write_only=True, allow_null=True, required=False
    )

    class Meta:
        model = Role
        fields = ['id', 'name', 'base_role', 'unit', 'unit_id']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        tenant = getattr(getattr(self.context.get('request'), 'user', None), 'tenant', None)
        if tenant:
            self.fields['unit_id'].queryset = Unit.objects.filter(tenant=tenant)


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        try:
            data = super().validate(attrs)
        except Exception as exc:
            # If the credentials belong to an inactive user, give a clear message
            email = attrs.get(self.username_field, '')
            if email and User.objects.filter(email=email, is_active=False).exists():
                from rest_framework_simplejwt.exceptions import AuthenticationFailed
                raise AuthenticationFailed(
                    'Hesabınız askıya alındı. Yetkili ile iletişime geçin.'
                ) from exc
            raise
        data['id'] = self.user.id
        data['name'] = self.user.name
        data['role'] = self.user.role
        return data


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    unit = UnitSerializer(read_only=True)
    unit_id = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), source='unit', write_only=True, allow_null=True, required=False
    )
    job_role = RoleSerializer(read_only=True)
    job_role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), source='job_role', write_only=True, allow_null=True, required=False
    )

    class Meta:
        model = User
        fields = [
            'id', 'name', 'email', 'password', 'role', 'gender',
            'unit', 'unit_id', 'job_role', 'job_role_id', 'is_active', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        tenant = getattr(getattr(self.context.get('request'), 'user', None), 'tenant', None)
        if tenant:
            self.fields['unit_id'].queryset = Unit.objects.filter(tenant=tenant)
            self.fields['job_role_id'].queryset = Role.objects.filter(tenant=tenant)


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)
    unit_id = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), source='unit', write_only=True, allow_null=True, required=False
    )
    job_role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), source='job_role', write_only=True, allow_null=True, required=False
    )

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'password', 'role', 'gender', 'unit_id', 'job_role_id', 'is_active']
        read_only_fields = ['id']
        extra_kwargs = {'role': {'required': False}}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        tenant = getattr(getattr(self.context.get('request'), 'user', None), 'tenant', None)
        if tenant:
            self.fields['unit_id'].queryset = Unit.objects.filter(tenant=tenant)
            self.fields['job_role_id'].queryset = Role.objects.filter(tenant=tenant)

    def create(self, validated_data):
        job_role = validated_data.get('job_role')
        if job_role is not None:
            validated_data['role'] = job_role.base_role
            if job_role.unit_id:
                validated_data['unit'] = job_role.unit
        elif not validated_data.get('role'):
            raise serializers.ValidationError({'role': 'Rol veya Yetki belirtilmeli.'})
        return User.objects.create_user(**validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    unit_id = serializers.PrimaryKeyRelatedField(
        queryset=Unit.objects.all(), source='unit', write_only=True, allow_null=True, required=False
    )
    job_role_id = serializers.PrimaryKeyRelatedField(
        queryset=Role.objects.all(), source='job_role', write_only=True, allow_null=True, required=False
    )

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'password', 'role', 'gender', 'unit_id', 'job_role_id', 'is_active']
        read_only_fields = ['id']
        extra_kwargs = {'role': {'required': False}}

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        tenant = getattr(getattr(self.context.get('request'), 'user', None), 'tenant', None)
        if tenant:
            self.fields['unit_id'].queryset = Unit.objects.filter(tenant=tenant)
            self.fields['job_role_id'].queryset = Role.objects.filter(tenant=tenant)

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        job_role = validated_data.get('job_role')
        if job_role is not None:
            validated_data['role'] = job_role.base_role
            if job_role.unit_id:
                validated_data['unit'] = job_role.unit
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'password', 'role', 'gender']
        read_only_fields = ['id']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)
