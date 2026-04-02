from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsManager(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'manager')


class IsSupervisor(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == 'supervisor')


class IsManagerOrSupervisor(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ('manager', 'supervisor')
        )


class IsOwnerOrManager(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated)

    def has_object_permission(self, request, view, obj):
        if request.user.role == 'manager':
            return True
        return obj.user == request.user
