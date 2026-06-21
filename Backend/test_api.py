import requests
import json

response = requests.post("http://localhost:8000/api/auth/login/", json={
    "username": "superadmin",
    "password": "SuperPassword123!"
})
print("Status:", response.status_code)
print("Response:", response.text)
