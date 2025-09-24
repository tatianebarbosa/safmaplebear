from .secure_auth import secure_auth

# This file is now a wrapper for the secure_auth service
# All authentication logic should be handled by secure_auth.py

def authenticate_user(username: str, password: str):
    return secure_auth.authenticate_user(username, password)

def generate_token(username: str, user_info: dict):
    return secure_auth.generate_token(username, user_info)

def verify_token(token: str):
    return secure_auth.verify_token(token)

def check_permission(user_role: str, required_role: str):
    return secure_auth.check_permission(user_role, required_role)


