from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, CurrentUserView, MissingPersonViewSet, SightingViewSet, 
    MatchViewSet, VideoAnalysisView, ChangePasswordView, DeleteAccountView, 
    RequestPasswordResetView, ConfirmPasswordResetView, AdminAnalyticsView, 
    UpdateProfileView, MissingPersonImageViewSet, CaseAssignmentViewSet, 
    InvestigationNoteViewSet, TimelineEventViewSet, NotificationViewSet, 
    AuditLogViewSet, UserManagementView, UserManagementDetailView,
    CustomTokenObtainPairView, ForcePasswordChangeView, AdminPasswordResetView,
    PasswordResetRequestViewSet, LogoutView, PingView, ToggleBreakView
)

router = DefaultRouter()
router.register(r'missing-persons', MissingPersonViewSet, basename='missing-person')
router.register(r'sightings', SightingViewSet, basename='sighting')
router.register(r'matches', MatchViewSet, basename='match')
router.register(r'missing-person-images', MissingPersonImageViewSet, basename='missing-person-image')
router.register(r'case-assignments', CaseAssignmentViewSet, basename='case-assignment')
router.register(r'investigation-notes', InvestigationNoteViewSet, basename='investigation-note')
router.register(r'timeline', TimelineEventViewSet, basename='timeline-event')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'admin/password-requests', PasswordResetRequestViewSet, basename='password_requests')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', CurrentUserView.as_view(), name='auth_me'),
    path('auth/ping/', PingView.as_view(), name='auth_ping'),
    path('auth/break/', ToggleBreakView.as_view(), name='auth_break'),
    path('auth/change-password/', ChangePasswordView.as_view(), name='auth_change_password'),
    path('auth/update-profile/', UpdateProfileView.as_view(), name='auth_update_profile'),
    path('auth/delete-account/', DeleteAccountView.as_view(), name='auth_delete_account'),
    path('auth/forgot-password/request/', RequestPasswordResetView.as_view(), name='auth_forgot_request'),
    path('auth/forgot-password/confirm/', ConfirmPasswordResetView.as_view(), name='auth_forgot_confirm'),
    path('analyze-video/', VideoAnalysisView.as_view(), name='analyze_video'),
    path('admin/analytics/', AdminAnalyticsView.as_view(), name='admin_analytics'),
    path('admin/users/', UserManagementView.as_view(), name='admin_users'),
    path('admin/users/<int:pk>/', UserManagementDetailView.as_view(), name='admin_users_detail'),
    path('admin/users/<int:pk>/reset-password/', AdminPasswordResetView.as_view(), name='admin_password_reset'),
    path('auth/force-change-password/', ForcePasswordChangeView.as_view(), name='force_password_change'),
    path('', include(router.urls)),
]
