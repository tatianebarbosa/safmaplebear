# Authentication and authorization
import jwt
import os
from datetime import datetime, timedelta
from typing import Optional, Dict

# User whitelist with roles
USERS = {
    'tatiane.barbosa': {'name': 'Tatiane Barbosa dos Santos Xavier', 'role': 'agente'},
    'rafhael.nazeazeno': {'name': 'Rafhael Nazeazeno Pereira', 'role': 'agente'},
    'ingrid.vania': {'name': 'Ingrid Vania Mazzei de Oliveira', 'role': 'agente'},
    'joao.felipe': {'name': 'Joao Felipe Gutierrez de Freitas', 'role': 'agente'},
    'jaqueline.floriano': {'name': 'Jaqueline Floriano da Silva', 'role': 'agente'},
    'jessika.queiroz': {'name': 'Jessika Queiroz', 'role': 'agente'},
    'fernanda.louise': {'name': 'Fernanda Louise de Almeida Inacio', 'role': 'agente'},
    'ana.paula': {'name': 'ANA PAULA OLIVEIRA DE ANDRADE', 'role': 'coordenadora'},
}

JWT_SECRET = os.environ.get('JWT_SECRET', 'fallback-secret-key')

def authenticate_user(username: str, password: str) -> Optional[Dict]:
    """Validate user credentials and return user info"""
    if username not in USERS:
        return None
    
    # Simple password check (in production, use proper hashing)
    if password != 'maplebear2025':  # Default password for demo
        return None
    
    return USERS[username]

def generate_token(username: str, user_info: Dict) -> str:
    """Generate JWT token"""
    payload = {
        'sub': username,
        'name': user_info['name'],
        'role': user_info['role'],
        'exp': datetime.utcnow() + timedelta(hours=8),
        'iat': datetime.utcnow()
    }
    
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def verify_token(token: str) -> Optional[Dict]:
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def check_permission(user_role: str, required_role: str) -> bool:
    """Check if user has required permissions"""
    if required_role == 'coordenadora':
        return user_role == 'coordenadora'
    
    # All authenticated users are at least 'agente'
    return user_role in ['agente', 'coordenadora']