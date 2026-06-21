import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mpis_backend.settings')
django.setup()
from django.contrib.auth import authenticate
user = authenticate(username='superadmin', password='SuperPassword123!')
print('Authenticated user:', user)
if not user:
    from django.contrib.auth import get_user_model
    User = get_user_model()
    u = User.objects.filter(username='superadmin').first()
    print("User object:", u)
    if u:
        print("is_active:", u.is_active)
        print("check_password:", u.check_password('SuperPassword123!'))
