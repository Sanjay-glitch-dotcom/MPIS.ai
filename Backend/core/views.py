from rest_framework import viewsets, generics, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.views import APIView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework import serializers
from .models import MissingPerson, Sighting, Match, MissingPersonImage, CaseAssignment, InvestigationNote, TimelineEvent, Notification, AuditLog, PasswordResetOTP
from .serializers import RegisterSerializer, UserSerializer, MissingPersonSerializer, SightingSerializer, MatchSerializer, MissingPersonImageSerializer, CaseAssignmentSerializer, InvestigationNoteSerializer, TimelineEventSerializer, NotificationSerializer, AuditLogSerializer
from .utils import extract_face_embedding, cosine_similarity
from .permissions import IsOwnerOrAdmin
from django.core.mail import send_mail
import random

User = get_user_model()

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['force_password_change'] = self.user.force_password_change
        data['is_locked'] = self.user.is_locked
        if self.user.is_locked:
            reason = self.user.suspension_note if hasattr(self.user, 'suspension_note') and self.user.suspension_note else "No specific reason provided."
            error_msg = f"Your account has been locked. Please contact your supervising officer or system administrator for assistance.\n\nReason: {reason}"
            raise serializers.ValidationError(error_msg)
        elif not self.user.is_active:
            reason = self.user.suspension_note if hasattr(self.user, 'suspension_note') and self.user.suspension_note else "No specific reason provided."
            error_msg = f"Your account has been suspended. Please contact your supervising officer or system administrator for further information.\n\nReason: {reason}"
            raise serializers.ValidationError(error_msg)
        return data

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            user = User.objects.get(username=request.data.get('username'))
            user.activity_status = 'ONLINE'
            from django.utils import timezone
            user.last_active_time = timezone.now()
            user.save()
            from .models import UserSession
            UserSession.objects.create(user=user)
        return response

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = RegisterSerializer

from rest_framework.views import APIView

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.core.mail import send_mail
from .models import PasswordResetOTP
import random

class CurrentUserView(generics.RetrieveAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

from django.utils import timezone
from .models import UserSession, UserBreak

class LogoutView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        user.activity_status = 'OFFLINE'
        user.save()
        
        session = UserSession.objects.filter(user=user, logout_time__isnull=True).order_by('-login_time').first()
        if session:
            session.logout_time = timezone.now()
            session.save()
            
        active_break = UserBreak.objects.filter(user=user, end_time__isnull=True).first()
        if active_break:
            active_break.end_time = timezone.now()
            active_break.save()
            
        return Response({"message": "Successfully logged out."})

class PingView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        user.last_active_time = timezone.now()
        if user.activity_status == 'OFFLINE':
            user.activity_status = 'ONLINE'
            UserSession.objects.create(user=user)
        user.save()
        return Response({"status": "ok"})

class ToggleBreakView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        action = request.data.get('action')
        
        if action == 'start':
            user.activity_status = 'ON_BREAK'
            user.save()
            UserBreak.objects.create(user=user)
            return Response({"message": "Break started."})
        elif action == 'end':
            user.activity_status = 'ONLINE'
            user.save()
            active_break = UserBreak.objects.filter(user=user, end_time__isnull=True).first()
            if active_break:
                active_break.end_time = timezone.now()
                active_break.save()
            return Response({"message": "Break ended."})
            
        return Response({"error": "Invalid action"}, status=status.HTTP_400_BAD_REQUEST)

class RequestPasswordResetView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'message': 'If an account with that email exists, an OTP has been sent.'})
            
        otp_code = str(random.randint(100000, 999999))
        PasswordResetOTP.objects.filter(user=user, is_used=False).update(is_used=True)
        PasswordResetOTP.objects.create(user=user, otp_code=otp_code)
        
        send_mail(
            subject='MPIS Security Clearance Code',
            message=f'Your MPIS Security Key reset code is: {otp_code}\n\nThis code will expire in 10 minutes.\nIf you did not request this, please ignore this email.',
            from_email='security@mpis.local',
            recipient_list=[email],
            fail_silently=False,
        )
        return Response({'message': 'If an account with that email exists, an OTP has been sent.'})


class ConfirmPasswordResetView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').strip()
        otp_code = request.data.get('otp_code', '').strip()
        new_password = request.data.get('new_password')
        
        if not all([email, otp_code, new_password]):
            return Response({'error': 'Email, OTP, and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({'error': 'Invalid request.'}, status=status.HTTP_400_BAD_REQUEST)
            
        otp_record = PasswordResetOTP.objects.filter(user=user, otp_code=otp_code).order_by('-created_at').first()
        
        if not otp_record or not otp_record.is_valid():
            return Response({'error': 'Invalid or expired OTP code.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if len(new_password) < 8 or not any(char.isdigit() for char in new_password) or not any(not char.isalnum() for char in new_password):
            return Response({'error': 'New security key does not meet strength requirements.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.save()
        otp_record.is_used = True
        otp_record.save()
        return Response({'message': 'Security key reset successfully.'})

class ChangePasswordView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not user.check_password(current_password):
            return Response({'error': 'Incorrect current security key.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if len(new_password) < 8 or not any(char.isdigit() for char in new_password) or not any(not char.isalnum() for char in new_password):
            return Response({'error': 'New security key does not meet strength requirements.'}, status=status.HTTP_400_BAD_REQUEST)
            
        user.set_password(new_password)
        user.save()
        return Response({'message': 'Security key updated successfully.'})

class DeleteAccountView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        password = request.data.get('password')
        
        if not user.check_password(password):
            return Response({'error': 'Incorrect security key.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Soft delete
        user.is_active = False
        user.save()
        return Response({'message': 'Account deactivated successfully.'})

class UpdateProfileView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        
        if not current_password or not user.check_password(current_password):
            return Response({'error': 'Incorrect current security key.'}, status=status.HTTP_400_BAD_REQUEST)
            
        # Extract editable fields
        first_name = request.data.get('first_name')
        last_name = request.data.get('last_name')
        email = request.data.get('email')
        username = request.data.get('username')
        phone_number = request.data.get('phone_number')

        if first_name is not None:
            user.first_name = first_name
        if last_name is not None:
            user.last_name = last_name
        if email is not None:
            user.email = email
        if username is not None:
            user.username = username
        if phone_number is not None:
            user.phone_number = phone_number

        try:
            user.save()
            return Response({'message': 'Profile updated successfully.', 'user': UserSerializer(user).data})
        except Exception as e:
            return Response({'error': 'Failed to update profile. Username or email may already be taken.'}, status=status.HTTP_400_BAD_REQUEST)

class MissingPersonViewSet(viewsets.ModelViewSet):
    queryset = MissingPerson.objects.all().order_by('-created_at')
    serializer_class = MissingPersonSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly, IsOwnerOrAdmin)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def perform_create(self, serializer):
        instance = serializer.save(reported_by=self.request.user)
        # Create timeline event
        TimelineEvent.objects.create(missing_person=instance, event_type='Report Created', description='Missing person report filed.', user=self.request.user)
        
        from .utils import extract_text_embedding, calculate_composite_score
        
        # Extract text embedding
        if instance.description:
            text_embed = extract_text_embedding(instance.description)
            if text_embed:
                instance.text_embedding = text_embed
                instance.save(update_fields=['text_embedding'])

        # Extract face embedding
        if instance.photo:
            embedding = extract_face_embedding(instance.photo.path)
            if embedding:
                instance.face_embedding = embedding
                instance.save(update_fields=['face_embedding'])
                # Create the first MissingPersonImage
                MissingPersonImage.objects.create(missing_person=instance, photo=instance.photo, face_embedding=embedding)

        # Duplicate Case Detection
        missing_persons = MissingPerson.objects.exclude(id=instance.id).exclude(status__in=['FOUND', 'CLOSED'])
        best_duplicate_score = 0
        best_duplicate = None
        
        for mp in missing_persons:
            comp_score_data = calculate_composite_score(
                instance.face_embedding, mp.face_embedding,
                instance.text_embedding, mp.text_embedding,
                instance.latitude, instance.longitude,
                mp.latitude, mp.longitude
            )
            score = comp_score_data['final_score']
            if score > best_duplicate_score:
                best_duplicate_score = score
                best_duplicate = mp
                
        if best_duplicate_score > 0.85: # High threshold for duplicate detection
            TimelineEvent.objects.create(
                missing_person=instance, 
                event_type='Duplicate Flag', 
                description=f'Warning: Possible duplicate of {best_duplicate.first_name} {best_duplicate.last_name} (Score: {best_duplicate_score*100:.2f}%).'
            )
            # Send notification to admins
            officials = User.objects.filter(role__in=['ADMIN', 'SUPERADMIN'])
            for official in officials:
                Notification.objects.create(
                    user=official,
                    title='Duplicate Case Alert',
                    message=f'New report for {instance.first_name} {instance.last_name} might be a duplicate of {best_duplicate.first_name} {best_duplicate.last_name} ({best_duplicate_score*100:.0f}% match).'
                )

    from rest_framework.decorators import action
    
    @action(detail=True, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def detailed_overview(self, request, pk=None):
        mp = self.get_object()
        
        timeline_events = TimelineEvent.objects.filter(missing_person=mp).order_by('-timestamp')
        assignments = CaseAssignment.objects.filter(missing_person=mp, is_active=True).select_related('officer')
        
        matches = Match.objects.filter(missing_person=mp)
        matches_count = matches.count()
        sightings_count = matches.values('sighting').distinct().count()
        
        priority = "Critical" if mp.age < 18 else "High"
        
        last_event = timeline_events.first()
        last_updated = last_event.timestamp if last_event else mp.created_at
        last_updated_by = f"{last_event.user.first_name} {last_event.user.last_name}" if last_event and last_event.user else "System"

        data = {
            "case_details": {
                "id": mp.id,
                "first_name": mp.first_name,
                "last_name": mp.last_name,
                "status": mp.status,
                "priority": priority,
                "created_at": mp.created_at,
                "last_updated": last_updated,
                "last_updated_by": last_updated_by,
                "photo": request.build_absolute_uri(mp.photo.url) if mp.photo else None
            },
            "team": [
                {
                    "name": f"{a.officer.first_name} {a.officer.last_name}",
                    "role": a.officer.role,
                    "activity_status": a.officer.activity_status,
                    "last_active_time": a.officer.last_active_time,
                    "assigned_at": a.assigned_at
                } for a in assignments
            ],
            "timeline": [
                {
                    "id": t.id,
                    "event_type": t.event_type,
                    "description": t.description,
                    "timestamp": t.timestamp,
                    "user_name": f"{t.user.first_name} {t.user.last_name}" if t.user else "System"
                } for t in timeline_events
            ],
            "overview": {
                "sightings_count": sightings_count,
                "matches_count": matches_count,
            }
        }
        return Response(data)

    from rest_framework.decorators import action
    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny])
    def timeline(self, request, pk=None):
        missing_person = self.get_object()
        events = TimelineEvent.objects.filter(missing_person=missing_person).order_by('-timestamp')
        serializer = TimelineEventSerializer(events, many=True)
        return Response(serializer.data)

class SightingViewSet(viewsets.ModelViewSet):
    queryset = Sighting.objects.all().order_by('-created_at')
    serializer_class = SightingSerializer
    permission_classes = (permissions.IsAuthenticatedOrReadOnly, IsOwnerOrAdmin)
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def perform_create(self, serializer):
        instance = serializer.save(reporter=self.request.user)
        
        from .utils import extract_text_embedding, calculate_composite_score
        
        # Extract text embedding
        if instance.description:
            text_embed = extract_text_embedding(instance.description)
            if text_embed:
                instance.text_embedding = text_embed
                instance.save(update_fields=['text_embedding'])

        if instance.photo:
            embedding = extract_face_embedding(instance.photo.path)
            if embedding:
                instance.face_embedding = embedding
                instance.save(update_fields=['face_embedding'])
                
        # We now always compare, even if there is no photo, relying on text and geo
        missing_persons = MissingPerson.objects.exclude(status__in=['FOUND', 'CLOSED'])
        best_match = None
        best_score = 0
        best_breakdown = None

        for mp in missing_persons:
            # We compare against the main missing person embedding 
            # If they have multiple images, we could compare against all, but for composite we'll just use the main one
            comp_score_data = calculate_composite_score(
                instance.face_embedding, mp.face_embedding,
                instance.text_embedding, mp.text_embedding,
                instance.latitude, instance.longitude,
                mp.latitude, mp.longitude
            )
            sim_score = comp_score_data['final_score']
            if sim_score > best_score:
                best_score = sim_score
                best_match = mp
                best_breakdown = comp_score_data['breakdown']

        if best_score > 0.80:  # Threshold for match
            # Store the breakdown in review_comments or a new JSONField. For now, put it in review_comments
            breakdown_str = f"Face: {best_breakdown['face_score']*100:.1f}%, Text: {best_breakdown['text_score']*100:.1f}%, Geo: {best_breakdown['geo_score']*100:.1f}%"
            Match.objects.create(
                missing_person=best_match,
                sighting=instance,
                similarity_score=best_score,
                status='PENDING',
                review_comments=f"Automated Match Breakdown: {breakdown_str}"
            )
            best_match.status = 'POSSIBLE_MATCH'
            best_match.save()
            TimelineEvent.objects.create(missing_person=best_match, event_type='Match Generated', description=f'Potential match generated from sighting with {best_score*100:.2f}% confidence. ({breakdown_str})')
            
            # Notify Admins and Police
            officials = User.objects.filter(role__in=['ADMIN', 'POLICE', 'SUPERADMIN', 'SUB_ADMIN', 'SUB_POLICE'])
            for official in officials:
                Notification.objects.create(
                    user=official,
                    title='New Potential Match',
                    message=f'A high confidence ({best_score*100:.2f}%) match was found for {best_match.first_name} {best_match.last_name}.'
                )

class MatchViewSet(viewsets.ModelViewSet):
    queryset = Match.objects.all().order_by('-similarity_score')
    serializer_class = MatchSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        if user.role in ['ADMIN', 'SUPERADMIN', 'POLICE', 'SUB_ADMIN', 'SUB_POLICE']:
            return Match.objects.all().order_by('-created_at')
        elif user.role == 'FAMILY':
            # Family can only see matches for their reported missing persons
            return Match.objects.filter(missing_person__reported_by=user).order_by('-created_at')
        return Match.objects.none()

    def update(self, request, *args, **kwargs):
        # Allow officials to update status
        if request.user.role in ['FAMILY', 'CITIZEN']:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    from rest_framework.decorators import action
    from django.utils import timezone

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def review(self, request, pk=None):
        if request.user.role in ['FAMILY', 'CITIZEN']:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)

        match = self.get_object()
        decision = request.data.get('decision') # 'APPROVE', 'REJECT', 'INVESTIGATE'
        comments = request.data.get('comments', '')

        if decision == 'APPROVE':
            match.status = 'VERIFIED'
            match.missing_person.status = 'VERIFIED'
            match.missing_person.save()
            TimelineEvent.objects.create(missing_person=match.missing_person, event_type='Match Reviewed', description=f'Match approved by {request.user.first_name}. Comments: {comments}', user=request.user)
        elif decision == 'REJECT':
            match.status = 'REJECTED'
            TimelineEvent.objects.create(missing_person=match.missing_person, event_type='Match Reviewed', description=f'Match rejected by {request.user.first_name}. Comments: {comments}', user=request.user)
        elif decision == 'INVESTIGATE':
            match.status = 'PENDING'
            match.missing_person.status = 'INVESTIGATING'
            match.missing_person.save()
            TimelineEvent.objects.create(missing_person=match.missing_person, event_type='Match Reviewed', description=f'Match marked for further investigation by {request.user.first_name}. Comments: {comments}', user=request.user)
        else:
            return Response({'error': 'Invalid decision'}, status=status.HTTP_400_BAD_REQUEST)

        match.reviewed_by = request.user
        match.review_timestamp = timezone.now()
        match.review_comments = comments
        match.save()

        # Generate Audit Log
        AuditLog.objects.create(
            user=request.user,
            action='MATCH_REVIEW',
            object_type='Match',
            object_id=match.id,
            details={'decision': decision, 'comments': comments}
        )

        return Response({'message': 'Match reviewed successfully.', 'status': match.status})

import os
import uuid
import cv2
from django.core.files.base import ContentFile
from django.utils import timezone
from .utils import process_video_for_faces

class VideoAnalysisView(generics.CreateAPIView):
    permission_classes = (permissions.IsAuthenticated,)
    parser_classes = (MultiPartParser, FormParser)

    def post(self, request, *args, **kwargs):
        video_file = request.FILES.get('video')
        location = request.data.get('location', 'Unknown Location via Video')
        latitude = request.data.get('latitude')
        longitude = request.data.get('longitude')
        description = request.data.get('description', 'Auto-generated from CCTV/Video upload.')

        if not video_file:
            return Response({'error': 'Video file is required.'}, status=status.HTTP_400_BAD_REQUEST)

        # Save video temporarily to process
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp_videos')
        os.makedirs(temp_dir, exist_ok=True)
        temp_path = os.path.join(temp_dir, f"{uuid.uuid4()}_{video_file.name}")
        
        with open(temp_path, 'wb+') as f:
            for chunk in video_file.chunks():
                f.write(chunk)

        try:
            extracted_faces = process_video_for_faces(temp_path, max_frames_to_analyze=15)
            
            created_sightings = []
            matches_found = 0

            for face_data in extracted_faces:
                embedding = face_data['embedding']
                frame = face_data['frame']
                timestamp_sec = face_data['timestamp_sec']

                # Only proceed if we actually match someone to prevent spamming sightings for random people
                best_match = None
                best_score = 0
                missing_persons = MissingPerson.objects.exclude(status__in=['FOUND', 'CLOSED'])
                
                for mp in missing_persons:
                    for mp_image in mp.images.exclude(face_embedding__isnull=True):
                        sim_score = cosine_similarity(embedding, mp_image.face_embedding)
                        if sim_score > 0.80 and sim_score > best_score:
                            best_match = mp
                            best_score = sim_score
                
                if best_match:
                    # Save frame as JPEG
                    ret, buffer = cv2.imencode('.jpg', frame)
                    if ret:
                        file_name = f"sighting_{uuid.uuid4()}.jpg"
                        content_file = ContentFile(buffer.tobytes(), name=file_name)
                        
                        sighting_time = timezone.now() # Approximate sighting time
                        
                        sighting = Sighting.objects.create(
                            location=location,
                            latitude=latitude,
                            longitude=longitude,
                            date=sighting_time,
                            description=f"{description} (Match found at video timestamp: {timestamp_sec}s)",
                            photo=content_file,
                            face_embedding=embedding,
                            reporter=request.user
                        )
                        created_sightings.append(sighting)

                        Match.objects.create(
                            missing_person=best_match,
                            sighting=sighting,
                            similarity_score=best_score,
                            status='PENDING'
                        )
                        matches_found += 1

            return Response({
                'message': 'Video processed successfully.',
                'faces_analyzed': len(extracted_faces),
                'matches_found': matches_found,
                'sightings_created': len(created_sightings)
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

class AdminAnalyticsView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role not in ['ADMIN', 'SUPERADMIN']:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        return Response({
            'total_cases': MissingPerson.objects.count(),
            'active_cases': MissingPerson.objects.filter(status='ACTIVE').count(),
            'resolved_cases': MissingPerson.objects.filter(status='FOUND').count(),
            'total_sightings': Sighting.objects.count(),
            'pending_matches': Match.objects.filter(status='PENDING').count(),
            'verified_matches': Match.objects.filter(status='VERIFIED').count(),
            'total_citizens': User.objects.filter(role='CITIZEN', is_active=True).count(),
            'total_family': User.objects.filter(role='FAMILY', is_active=True).count(),
        })

class MissingPersonImageViewSet(viewsets.ModelViewSet):
    queryset = MissingPersonImage.objects.all()
    serializer_class = MissingPersonImageSerializer
    permission_classes = (permissions.IsAuthenticated,)

class CaseAssignmentViewSet(viewsets.ModelViewSet):
    queryset = CaseAssignment.objects.all()
    serializer_class = CaseAssignmentSerializer
    permission_classes = (permissions.IsAuthenticated,)

class InvestigationNoteViewSet(viewsets.ModelViewSet):
    serializer_class = InvestigationNoteSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = InvestigationNote.objects.all().order_by('-created_at')
        mp_id = self.request.query_params.get('missing_person')
        if mp_id:
            queryset = queryset.filter(missing_person_id=mp_id)
        return queryset

    def perform_create(self, serializer):
        serializer.save(officer=self.request.user)

class TimelineEventViewSet(viewsets.ModelViewSet):
    serializer_class = TimelineEventSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        queryset = TimelineEvent.objects.all().order_by('-timestamp')
        mp_id = self.request.query_params.get('missing_person')
        if mp_id:
            queryset = queryset.filter(missing_person_id=mp_id)
        return queryset

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).order_by('-created_at')

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = (permissions.IsAuthenticated,)

class UserManagementView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if request.user.role not in ['ADMIN', 'SUPERADMIN', 'POLICE']:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        if request.user.role == 'SUPERADMIN':
            users_qs = User.objects.filter(role__in=['POLICE', 'ADMIN', 'SUB_POLICE', 'SUB_ADMIN']).order_by('-date_joined')
        else:
            users_qs = User.objects.filter(created_by=request.user).order_by('-date_joined')
            
        from django.utils import timezone
        import datetime
        
        users_data = []
        today_start = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)
        
        for user in users_qs:
            latest_session = user.sessions.order_by('-login_time').first()
            login_time = latest_session.login_time if latest_session else None
            logout_time = latest_session.logout_time if latest_session else None
            
            todays_breaks = user.breaks.filter(start_time__gte=today_start)
            total_break_duration = datetime.timedelta(0)
            active_break_start = None
            for b in todays_breaks:
                end = b.end_time or timezone.now()
                total_break_duration += (end - b.start_time)
                if not b.end_time:
                    active_break_start = b.start_time
                    
            users_data.append({
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_active': user.is_active,
                'is_locked': user.is_locked,
                'date_joined': user.date_joined,
                'activity_status': user.activity_status,
                'last_active_time': user.last_active_time,
                'login_time': login_time,
                'logout_time': logout_time,
                'total_break_duration': total_break_duration.total_seconds() / 60,
                'active_break_start': active_break_start
            })
            
        return Response(users_data)

    def post(self, request):
        if request.user.role not in ['ADMIN', 'SUPERADMIN', 'POLICE']:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        role = request.data.get('role')
        
        if request.user.role == 'SUPERADMIN':
            if role not in ['POLICE', 'ADMIN']:
                return Response({'error': 'Super Admins can only create Admin and Police roles.'}, status=status.HTTP_400_BAD_REQUEST)
        elif request.user.role == 'ADMIN':
            if role != 'SUB_ADMIN':
                return Response({'error': 'Admins can only create Sub Admins.'}, status=status.HTTP_400_BAD_REQUEST)
            if User.objects.filter(created_by=request.user).count() >= 5:
                return Response({'error': 'Subordinate limit reached (max 5).'}, status=status.HTTP_400_BAD_REQUEST)
        elif request.user.role == 'POLICE':
            if role != 'SUB_POLICE':
                return Response({'error': 'Police can only create Sub Police.'}, status=status.HTTP_400_BAD_REQUEST)
            if User.objects.filter(created_by=request.user).count() >= 5:
                return Response({'error': 'Subordinate limit reached (max 5).'}, status=status.HTTP_400_BAD_REQUEST)

        username = request.data.get('username')
        email = request.data.get('email')
        password = request.data.get('password')
        first_name = request.data.get('first_name', '')
        last_name = request.data.get('last_name', '')


        if User.objects.filter(username=username).exists():
            return Response({'error': 'Username already taken.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if email and User.objects.filter(email=email).exists():
            return Response({'error': 'Email already registered.'}, status=status.HTTP_400_BAD_REQUEST)

        if len(password) < 8:
            return Response({'error': 'Password must be at least 8 characters long.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                role=role,
                first_name=first_name,
                last_name=last_name,
                created_by=request.user if request.user.role != 'SUPERADMIN' else None
            )
            
            AuditLog.objects.create(
                user=request.user,
                action='CREATE_OFFICIAL',
                object_type='User',
                object_id=user.id,
                details={'role': role, 'username': username}
            )
            
            return Response({'message': f'{role} account created successfully.'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class UserManagementDetailView(APIView):
    permission_classes = (permissions.IsAuthenticated,)

    def patch(self, request, pk):
        if request.user.role not in ['SUPERADMIN', 'ADMIN', 'POLICE']:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        password = request.data.get('password')
        if not password or not request.user.check_password(password):
            return Response({'error': 'Invalid password verification.'}, status=status.HTTP_403_FORBIDDEN)
                
        try:
            if request.user.role == 'SUPERADMIN':
                user = User.objects.get(pk=pk, role__in=['POLICE', 'ADMIN', 'SUPERADMIN', 'SUB_ADMIN', 'SUB_POLICE'])
            else:
                user = User.objects.get(pk=pk, created_by=request.user)
            
            # Prevent super admin from suspending themselves
            if user.id == request.user.id:
                return Response({'error': 'You cannot modify your own status here.'}, status=status.HTTP_400_BAD_REQUEST)
                
            action = request.data.get('action', 'toggle_active')
            suspension_note = request.data.get('suspension_note', '')
            
            if action == 'toggle_active':
                user.is_active = not user.is_active
                status_text = 'activated' if user.is_active else 'suspended'
                audit_action = 'ACCOUNT_ACTIVATED' if user.is_active else 'ACCOUNT_SUSPENDED'
                if user.is_active:
                    user.suspension_note = None
                else:
                    user.suspension_note = suspension_note if suspension_note else "No specific reason provided."
            elif action == 'toggle_lock':
                user.is_locked = not user.is_locked
                status_text = 'locked' if user.is_locked else 'unlocked'
                audit_action = 'ACCOUNT_LOCKED' if user.is_locked else 'ACCOUNT_UNLOCKED'
                if not user.is_locked:
                    user.suspension_note = None
                else:
                    user.suspension_note = suspension_note if suspension_note else "No specific reason provided."
            elif action == 'force_password_change':
                user.force_password_change = True
                status_text = 'flagged for password change'
                audit_action = 'ACCOUNT_FORCE_PASSWORD_CHANGE'
            else:
                return Response({'error': 'Invalid action.'}, status=status.HTTP_400_BAD_REQUEST)
                
            user.save()
            
            audit_details = {'username': user.username, 'new_status': status_text}
            if suspension_note and (action == 'toggle_active' and not user.is_active or action == 'toggle_lock' and user.is_locked):
                audit_details['suspension_note'] = suspension_note

            AuditLog.objects.create(
                user=request.user,
                action=audit_action,
                object_type='User',
                object_id=user.id,
                details=audit_details
            )
            
            return Response({'message': f'Account {status_text} successfully.'})
            
        except User.DoesNotExist:
            return Response({'error': 'User not found or you do not have permission.'}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, pk):
        if request.user.role not in ['SUPERADMIN', 'ADMIN', 'POLICE']:
            return Response({'error': 'You do not have permission to delete accounts.'}, status=status.HTTP_403_FORBIDDEN)
            
        password = request.data.get('password')
        if not password or not request.user.check_password(password):
            return Response({'error': 'Invalid password verification.'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            if request.user.role == 'SUPERADMIN':
                user = User.objects.get(pk=pk)
            else:
                user = User.objects.get(pk=pk, created_by=request.user)

            if user.id == request.user.id:
                return Response({'error': 'You cannot delete your own account.'}, status=status.HTTP_400_BAD_REQUEST)
            if user.role == 'SUPERADMIN':
                return Response({'error': 'Super Admin accounts cannot be deleted.'}, status=status.HTTP_400_BAD_REQUEST)
                
            username = user.username
            user.delete()
            
            AuditLog.objects.create(
                user=request.user,
                action='ACCOUNT_DELETED',
                object_type='User',
                object_id=pk,
                details={'username': username}
            )
            return Response({'message': 'Account permanently deleted.'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        if request.user.role not in ['SUPERADMIN', 'ADMIN', 'POLICE']:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        try:
            if request.user.role == 'SUPERADMIN':
                user = User.objects.get(pk=pk, role__in=['POLICE', 'ADMIN', 'SUPERADMIN', 'SUB_ADMIN', 'SUB_POLICE'])
            else:
                user = User.objects.get(pk=pk, created_by=request.user)
            
            email = request.data.get('email')
            role = request.data.get('role')
            first_name = request.data.get('first_name', '')
            last_name = request.data.get('last_name', '')

            if role and role not in ['POLICE', 'ADMIN', 'SUPERADMIN']:
                return Response({'error': 'Invalid role assignment.'}, status=status.HTTP_400_BAD_REQUEST)

            if email and email != user.email and User.objects.filter(email=email).exists():
                return Response({'error': 'Email already registered.'}, status=status.HTTP_400_BAD_REQUEST)

            user.email = email or user.email
            user.first_name = first_name
            user.last_name = last_name
            if role and user.id != request.user.id:  # Prevent changing own role just in case
                user.role = role
                
            user.save()

            AuditLog.objects.create(
                user=request.user,
                action='ACCOUNT_UPDATED',
                object_type='User',
                object_id=user.id,
                details={'username': user.username, 'updated_fields': 'Profile Details'}
            )
            return Response({'message': 'Account updated successfully.'}, status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response({'error': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

class ForcePasswordChangeView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        if not request.user.force_password_change:
            return Response({'error': 'No forced password change required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        new_password = request.data.get('new_password')
        if not new_password or len(new_password) < 8:
            return Response({'error': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
            
        request.user.set_password(new_password)
        request.user.force_password_change = False
        request.user.save()
        return Response({'message': 'Password updated successfully.'})

class AdminPasswordResetView(APIView):
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request, pk):
        if request.user.role not in ['SUPERADMIN', 'ADMIN', 'POLICE']:
            return Response({'detail': 'Not permitted'}, status=status.HTTP_403_FORBIDDEN)
            
        password = request.data.get('password')
        if not password or not request.user.check_password(password):
            return Response({'error': 'Invalid password verification.'}, status=status.HTTP_403_FORBIDDEN)
                
        try:
            if request.user.role == 'SUPERADMIN':
                # Super Admin can reset anyone
                user = User.objects.get(pk=pk)
            else:
                # Admin/Police can only reset their subordinates
                user = User.objects.get(pk=pk, created_by=request.user)
                
            new_password = request.data.get('new_password')
            if not new_password or len(new_password) < 8:
                return Response({'error': 'Password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)
                
            user.set_password(new_password)
            user.force_password_change = True
            user.save()
            
            AuditLog.objects.create(
                user=request.user,
                action='PASSWORD_RESET_ADMIN',
                object_type='User',
                object_id=user.id,
                details={'username': user.username}
            )
            return Response({'message': 'Password securely reset. User is forced to change it on next login.'})
            
        except User.DoesNotExist:
            return Response({'error': 'User not found or permission denied.'}, status=status.HTTP_404_NOT_FOUND)

from .models import PasswordResetRequest
from .serializers import PasswordResetRequestSerializer

class PasswordResetRequestViewSet(viewsets.ModelViewSet):
    serializer_class = PasswordResetRequestSerializer
    
    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        if self.request.user.role == 'SUPERADMIN':
            return PasswordResetRequest.objects.all().order_by('-created_at')
        return PasswordResetRequest.objects.filter(user=self.request.user).order_by('-created_at')
        
    def create(self, request, *args, **kwargs):
        username_or_email = request.data.get('username')
        if not username_or_email:
            return Response({'error': 'Agent ID or Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            from django.db.models import Q
            user = User.objects.get(Q(username=username_or_email) | Q(email=username_or_email))
            if user.role not in ['POLICE', 'ADMIN', 'SUB_POLICE', 'SUB_ADMIN']:
                return Response({'error': 'Only official personnel can request an admin reset.'}, status=status.HTTP_400_BAD_REQUEST)
                
            if PasswordResetRequest.objects.filter(user=user, status='PENDING').exists():
                return Response({'error': 'A pending reset request already exists.'}, status=status.HTTP_400_BAD_REQUEST)
                
            PasswordResetRequest.objects.create(user=user)
            return Response({'message': 'Password reset request sent to Super Admin.'}, status=status.HTTP_201_CREATED)
        except User.DoesNotExist:
            return Response({'message': 'If the account exists, a request has been sent to the Super Admin.'}, status=status.HTTP_201_CREATED)
        except User.MultipleObjectsReturned:
            user = User.objects.filter(Q(username=username_or_email) | Q(email=username_or_email)).first()
            if user.role not in ['POLICE', 'ADMIN', 'SUB_POLICE', 'SUB_ADMIN']:
                return Response({'error': 'Only official personnel can request an admin reset.'}, status=status.HTTP_400_BAD_REQUEST)
            if PasswordResetRequest.objects.filter(user=user, status='PENDING').exists():
                return Response({'error': 'A pending reset request already exists.'}, status=status.HTTP_400_BAD_REQUEST)
            PasswordResetRequest.objects.create(user=user)
            return Response({'message': 'Password reset request sent to Super Admin.'}, status=status.HTTP_201_CREATED)
        
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if request.user.role != 'SUPERADMIN':
            return Response({'error': 'Only Super Admins can approve.'}, status=status.HTTP_403_FORBIDDEN)
            
        superadmin_password = request.data.get('superadmin_password')
        if not request.user.check_password(superadmin_password):
            return Response({'error': 'Invalid Super Admin password verification.'}, status=status.HTTP_403_FORBIDDEN)
            
        reset_req = self.get_object()
        new_password = request.data.get('new_password')
        
        if not new_password or len(new_password) < 8:
            return Response({'error': 'Must provide a valid temporary password.'}, status=status.HTTP_400_BAD_REQUEST)
            
        target_user = reset_req.user
        target_user.set_password(new_password)
        target_user.force_password_change = True
        target_user.save()
        
        import django.utils.timezone as timezone
        reset_req.status = 'APPROVED'
        reset_req.resolved_at = timezone.now()
        reset_req.resolved_by = request.user
        reset_req.save()
        
        return Response({'message': 'Reset request approved. New password set.'})
