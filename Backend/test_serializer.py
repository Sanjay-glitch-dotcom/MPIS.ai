import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'mpis_backend.settings')
django.setup()

from core.views import CustomTokenObtainPairSerializer

serializer = CustomTokenObtainPairSerializer(data={"username": "superadmin", "password": "SuperPassword123!"})
try:
    is_valid = serializer.is_valid()
    print("Is Valid:", is_valid)
    if not is_valid:
        print("Errors:", serializer.errors)
    else:
        print("Data:", serializer.validated_data)
except Exception as e:
    print("Exception thrown:", str(e))
