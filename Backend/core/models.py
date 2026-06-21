from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = (
        ('FAMILY', 'Family Member'),
        ('CITIZEN', 'Citizen'),
        ('POLICE', 'Police Officer'),
        ('SUB_POLICE', 'Sub Police Officer'),
        ('ADMIN', 'Administrator'),
        ('SUB_ADMIN', 'Sub Admin'),
        ('SUPERADMIN', 'Super Admin'),
    )
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='CITIZEN')
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    created_by = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subordinates')
    force_password_change = models.BooleanField(default=False)
    is_locked = models.BooleanField(default=False)
    suspension_note = models.TextField(blank=True, null=True)
    ACTIVITY_STATUS_CHOICES = (
        ('ONLINE', 'Online'),
        ('OFFLINE', 'Offline'),
        ('ON_BREAK', 'On Break'),
    )
    activity_status = models.CharField(max_length=20, choices=ACTIVITY_STATUS_CHOICES, default='OFFLINE')
    last_active_time = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"

class UserSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sessions')
    login_time = models.DateTimeField(auto_now_add=True)
    logout_time = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Session for {self.user.username} at {self.login_time}"

class UserBreak(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='breaks')
    start_time = models.DateTimeField(auto_now_add=True)
    end_time = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"Break for {self.user.username} starting {self.start_time}"


class PasswordResetOTP(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_used = models.BooleanField(default=False)

    def is_valid(self):
        from django.utils import timezone
        import datetime
        # OTP valid for 10 minutes
        return not self.is_used and timezone.now() < self.created_at + datetime.timedelta(minutes=10)

    def __str__(self):
        return f"OTP for {self.user.email}"

class PasswordResetRequest(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='password_reset_requests')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    resolved_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='resolved_resets')

    def __str__(self):
        return f"Reset Request for {self.user.username} - {self.status}"


class MissingPerson(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    age = models.IntegerField()
    gender = models.CharField(max_length=10, choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')])
    last_seen_location = models.CharField(max_length=255)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    last_seen_date = models.DateField()
    description = models.TextField()
    photo = models.ImageField(upload_to='missing_persons/')
    face_embedding = models.JSONField(blank=True, null=True) # Will store the embedding vector
    text_embedding = models.JSONField(blank=True, null=True) # NLP embedding of the description
    reported_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reported_missing_persons')
    created_at = models.DateTimeField(auto_now_add=True)
    STATUS_CHOICES = (
        ('ACTIVE', 'Active'),
        ('PROCESSING', 'Processing'),
        ('REPORTED', 'Reported'),
        ('UNDER_REVIEW', 'Under Review'),
        ('INVESTIGATING', 'Investigating'),
        ('POSSIBLE_MATCH', 'Possible Match Found'),
        ('VERIFIED', 'Verified'),
        ('FOUND', 'Found'),
        ('CLOSED', 'Closed'),
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='ACTIVE')

    def __str__(self):
        return f"{self.first_name} {self.last_name}"


class Sighting(models.Model):
    location = models.CharField(max_length=255)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    date = models.DateTimeField()
    description = models.TextField()
    photo = models.ImageField(upload_to='sightings/', blank=True, null=True)
    face_embedding = models.JSONField(blank=True, null=True)
    text_embedding = models.JSONField(blank=True, null=True) # NLP embedding of the description
    reporter = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reported_sightings')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Sighting at {self.location} on {self.date}"


class Match(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending Verification'),
        ('VERIFIED', 'Verified Match'),
        ('REJECTED', 'Rejected'),
    )
    missing_person = models.ForeignKey(MissingPerson, on_delete=models.CASCADE, related_name='matches')
    sighting = models.ForeignKey(Sighting, on_delete=models.CASCADE, related_name='matches')
    similarity_score = models.FloatField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    created_at = models.DateTimeField(auto_now_add=True)
    reviewed_by = models.ForeignKey(User, on_delete=models.SET_NULL, blank=True, null=True, related_name='reviewed_matches')
    review_timestamp = models.DateTimeField(blank=True, null=True)
    review_comments = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Match: {self.missing_person} & {self.sighting} (Score: {self.similarity_score})"

class MissingPersonImage(models.Model):
    missing_person = models.ForeignKey(MissingPerson, on_delete=models.CASCADE, related_name='images')
    photo = models.ImageField(upload_to='missing_persons/additional/')
    face_embedding = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class CaseAssignment(models.Model):
    missing_person = models.ForeignKey(MissingPerson, on_delete=models.CASCADE, related_name='assignments')
    officer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_cases')
    assigned_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    assigned_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='assignments_made')

class InvestigationNote(models.Model):
    missing_person = models.ForeignKey(MissingPerson, on_delete=models.CASCADE, related_name='notes')
    officer = models.ForeignKey(User, on_delete=models.CASCADE, related_name='investigation_notes')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

class TimelineEvent(models.Model):
    missing_person = models.ForeignKey(MissingPerson, on_delete=models.CASCADE, related_name='timeline')
    event_type = models.CharField(max_length=50)
    description = models.TextField()
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=100)
    object_type = models.CharField(max_length=100)
    object_id = models.IntegerField(null=True, blank=True)
    details = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"AuditLog: {self.action} on {self.object_type} (User: {self.user})"
