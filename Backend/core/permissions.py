from rest_framework import permissions

class IsOwnerOrAdmin(permissions.BasePermission):
    """
    Object-level permission. 
    Admins can EDIT (PUT/PATCH).
    Only Owners can DELETE.
    """

    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True

        owner = getattr(obj, 'reported_by', None) or getattr(obj, 'reporter', None)

        if request.method == 'DELETE':
            return owner == request.user

        # For PUT/PATCH, allow owner or privileged roles
        privileged_roles = ['ADMIN', 'SUPERADMIN', 'SUB_ADMIN', 'POLICE', 'SUB_POLICE']
        if request.user.role in privileged_roles or owner == request.user:
            return True
            
        return False
