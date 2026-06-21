from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import MissingPerson, Sighting, Match, MissingPersonImage, CaseAssignment, InvestigationNote, TimelineEvent, Notification, AuditLog, PasswordResetRequest

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    active_break_start = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 'phone_number', 'force_password_change', 'activity_status', 'active_break_start')
        read_only_fields = ('id', 'role', 'force_password_change', 'activity_status', 'active_break_start')

    def get_active_break_start(self, obj):
        if obj.activity_status == 'ON_BREAK':
            active_break = obj.breaks.filter(end_time__isnull=True).order_by('-start_time').first()
            if active_break:
                return active_break.start_time.isoformat()
        return None

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'first_name', 'last_name', 'role', 'phone_number')

    def validate_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Security key must be at least 8 characters long.")
        if not any(char.isdigit() for char in value):
            raise serializers.ValidationError("Security key must include at least one numeric value.")
        if not any(not char.isalnum() for char in value):
            raise serializers.ValidationError("Security key must include at least one special character.")
        return value

    def create(self, validated_data):
        role = validated_data.get('role', 'CITIZEN')
        # Security: Prevent public registration of privileged accounts
        if role in ['POLICE', 'ADMIN', 'SUPERADMIN']:
            role = 'CITIZEN'

        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            role=role,
            phone_number=validated_data.get('phone_number', '')
        )
        return user

class MissingPersonImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = MissingPersonImage
        fields = '__all__'
        read_only_fields = ('face_embedding', 'created_at')

class MissingPersonSerializer(serializers.ModelSerializer):
    reported_by_name = serializers.SerializerMethodField()
    images = MissingPersonImageSerializer(many=True, read_only=True)

    class Meta:
        model = MissingPerson
        fields = '__all__'
        read_only_fields = ('reported_by', 'face_embedding')

    def get_reported_by_name(self, obj):
        return f"{obj.reported_by.first_name} {obj.reported_by.last_name}"

class CaseAssignmentSerializer(serializers.ModelSerializer):
    officer_name = serializers.SerializerMethodField()

    class Meta:
        model = CaseAssignment
        fields = '__all__'
        read_only_fields = ('assigned_by', 'assigned_at')

    def get_officer_name(self, obj):
        return f"{obj.officer.first_name} {obj.officer.last_name}"

class InvestigationNoteSerializer(serializers.ModelSerializer):
    officer_name = serializers.SerializerMethodField()

    class Meta:
        model = InvestigationNote
        fields = '__all__'
        read_only_fields = ('officer', 'created_at')

    def get_officer_name(self, obj):
        return f"{obj.officer.first_name} {obj.officer.last_name}"

class TimelineEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = TimelineEvent
        fields = '__all__'
        read_only_fields = ('timestamp',)

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('user', 'created_at')

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'

class PasswordResetRequestSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    
    class Meta:
        model = PasswordResetRequest
        fields = ['id', 'user', 'username', 'email', 'status', 'created_at', 'resolved_at']
        read_only_fields = ['user', 'status', 'resolved_at', 'resolved_by']
        read_only_fields = ('timestamp',)

class SightingSerializer(serializers.ModelSerializer):
    reporter_name = serializers.SerializerMethodField()

    class Meta:
        model = Sighting
        fields = '__all__'
        read_only_fields = ('reporter', 'face_embedding')

    def get_reporter_name(self, obj):
        return f"{obj.reporter.first_name} {obj.reporter.last_name}"

class MatchSerializer(serializers.ModelSerializer):
    missing_person_details = MissingPersonSerializer(source='missing_person', read_only=True)
    sighting_details = SightingSerializer(source='sighting', read_only=True)
    reviewed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Match
        fields = '__all__'
        read_only_fields = ('missing_person', 'sighting', 'similarity_score', 'created_at', 'review_timestamp')

    def get_reviewed_by_name(self, obj):
        if obj.reviewed_by:
            return f"{obj.reviewed_by.first_name} {obj.reviewed_by.last_name}"
        return None
