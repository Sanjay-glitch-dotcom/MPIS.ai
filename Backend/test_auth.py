import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mpis_backend.settings')
django.setup()
from django.contrib.auth import get_user_model
User = get_user_model()
u = User.objects.filter(username='superadmin').first()
print('Valid:', u.check_password('SuperPassword123!'))
