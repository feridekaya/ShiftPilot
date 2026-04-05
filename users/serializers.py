from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, StaffTeam


class StaffTeamSerializer(serializers.ModelSerializer):
    class Meta:
        model = StaffTeam
        fields = ['id', 'name']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['id'] = self.user.id
        data['name'] = self.user.name
        data['role'] = self.user.role
        return data


class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    team = StaffTeamSerializer(read_only=True)
    team_id = serializers.PrimaryKeyRelatedField(
        queryset=StaffTeam.objects.all(), source='team', allow_null=True, required=False
    )

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'password', 'role', 'gender', 'team', 'team_id', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'password', 'role', 'gender', 'is_active']
        read_only_fields = ['id']

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserUpdateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    team_id = serializers.PrimaryKeyRelatedField(
        queryset=StaffTeam.objects.all(), source='team', allow_null=True, required=False
    )

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'password', 'role', 'gender', 'team_id', 'is_active']
        read_only_fields = ['id']

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
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
