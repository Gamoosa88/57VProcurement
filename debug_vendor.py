#!/usr/bin/env python3
"""
Debug script to check vendor user ID and fix demo contracts
"""

import requests
import json
from pathlib import Path

# Load backend URL from frontend .env
def load_backend_url():
    frontend_env_path = Path("/app/frontend/.env")
    if frontend_env_path.exists():
        with open(frontend_env_path, 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    return "http://localhost:8001"

BASE_URL = load_backend_url()
API_URL = f"{BASE_URL}/api"

# Login as demo vendor
demo_vendor_data = {
    "email": "vendor001@techcorp.sa",
    "password": "DemoVendor123!"
}

response = requests.post(f"{API_URL}/auth/login", json=demo_vendor_data)
if response.status_code == 200:
    token = response.json().get("token")
    
    # Get user info
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{API_URL}/auth/me", headers=headers)
    if response.status_code == 200:
        user_info = response.json()
        print(f"Demo vendor user ID: {user_info.get('id')}")
        print(f"Demo vendor email: {user_info.get('email')}")
        print(f"Demo vendor company: {user_info.get('company_name')}")
    else:
        print(f"Failed to get user info: {response.status_code}")
else:
    print(f"Failed to login: {response.status_code}")