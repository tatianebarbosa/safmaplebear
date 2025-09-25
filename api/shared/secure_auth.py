# Secure Authentication and authorization
import jwt
import os
import hashlib
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, List
import json

# User whitelist with roles - moved to environment or config file in prUSERS_WHITELIST = {
    'tatiane.barbosa': {'name': 'Tatiane Barbosa dos Santos Xavier', 'role': 'agente'},
    'rafhael.nazeazeno': {'name': 'Rafhael Nazeazeno Pereira', 'role': 'agente'},
    'ingrid.vania': {'name': 'Ingrid Vania Mazzei de Oliveira', 'role': 'agente'},
    'joao.felipe': {'name': 'Joao Felipe Gutierrez de Freitas', 'role': 'agente'},
    'jaqueline.floriano': {'name': 'Jaqueline Floriano da Silva', 'role': 'agente'},
    'jessika.queiroz': {'name': 'Jessika Queiroz', 'role': 'agente'},
    'fernanda.louise': {'name': 'Fernanda Louise de Almeida Inacio', 'role': 'agente'},
    'ana.paula': {'name': 'ANA PAULA OLIVEIRA DE ANDRADE', 'role': 'coordenadora'},
}
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_urlsafe(32))
JWT_ALGORITHM = 'HS256'
TOKEN_EXPIRY_HOURS = 8
SALT_ROUNDS = 12

class SecureAuthService:
    def __init__(self):
        self.failed_attempts = {}  # In production, use Redis or database
        self.max_attempts = 5
        self.lockout_time = 300  # 5 minutes
        
    def _hash_password(self, password: str, salt: str = None) -> tuple:
        """Hash password with salt using PBKDF2"""
        if salt is None:
            salt = secrets.token_hex(32)
        
        # Use PBKDF2 with SHA256
        hashed = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000  # iterations
        )
        
        return hashed.hex(), salt
    
    def _verify_password(self, password: str, hashed_password: str, salt: str) -> bool:
        """Verify password against hash"""
        test_hash, _ = self._hash_password(password, salt)
        return secrets.compare_digest(test_hash, hashed_password)
    
    def _is_account_locked(self, username: str) -> bool:
        """Check if account is locked due to failed attempts"""
        if username not in self.failed_attempts:
            return False
            
        attempts_data = self.failed_attempts[username]
        if attempts_data['count'] >= self.max_attempts:
            time_diff = datetime.now() - attempts_data['last_attempt']
            if time_diff.total_seconds() < self.lockout_time:
                return True
            else:
                # Reset after lockout period
                del self.failed_attempts[username]
                
        return False
    
    def _record_failed_attempt(self, username: str):
        """Record failed login attempt"""
        if username not in self.failed_attempts:
            self.failed_attempts[username] = {'count': 0, 'last_attempt': datetime.now()}
        
        self.failed_attempts[username]['count'] += 1
        self.failed_attempts[username]['last_attempt'] = datetime.now()
    
    def _clear_failed_attempts(self, username: str):
        """Clear failed attempts on successful login"""
        if username in self.failed_attempts:
            del self.failed_attempts[username]
    
    def authenticate_user(self, username: str, password: str) -> Optional[Dict]:
        """Validate user credentials and return user info"""
        # Check if account is locked
        if self._is_account_locked(username):
            return {
                'error': 'account_locked',
                'message': f'Conta bloqueada por {self.lockout_time // 60} minutos devido a muitas tentativas falhadas'
            }
        
        # Check if user exists in whitelist
        if username not in USERS_WHITELIST:
            self._record_failed_attempt(username)
            return {
                'error': 'invalid_credentials',
                'message': 'Credenciais inválidas'
            }
        
        # In production, get hashed password from secure storage
        # For now, we assume the password is provided by the user and verified against a secure storage.
        # For this example, we will assume a successful authentication if the username is in the whitelist and the password is 'maplebear2025'.
        # This is a temporary solution and should be replaced with a proper password hashing and storage mechanism.
        
        # For demonstration purposes, let's use a placeholder for password verification.
        # In a real application, you would retrieve the user's hashed password and salt from a database
        # and then use self._verify_password(password, stored_hash, salt) to check it.
        
        # Placeholder for password verification (replace with actual secure storage lookup)
        if password != 'maplebear2025':
            self._record_failed_attempt(username)
            return {
                'error': 'invalid_credentials',
                'message': 'Credenciais inválidas'
            }
        
        # Clear failed attempts on successful login
        self._clear_failed_attempts(username)
        
        user_info = USERS_WHITELIST[username].copy()
        user_info['username'] = username
        
        return {
            'success': True,
            'user': user_info
        }
    
    def generate_token(self, username: str, user_info: Dict) -> str:
        """Generate JWT token with enhanced security"""
        payload = {
            'sub': username,
            'name': user_info['name'],
            'role': user_info['role'],
            'exp': datetime.utcnow() + timedelta(hours=TOKEN_EXPIRY_HOURS),
            'iat': datetime.utcnow(),
            'jti': secrets.token_urlsafe(16),  # JWT ID for token revocation
            'iss': 'maple-bear-saf',  # Issuer
            'aud': 'saf-frontend'  # Audience
        }
        
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    def verify_token(self, token: str) -> Optional[Dict]:
        """Verify JWT token and return payload"""
        try:
            payload = jwt.decode(
                token, 
                JWT_SECRET, 
                algorithms=[JWT_ALGORITHM],
                audience='saf-frontend',
                issuer='maple-bear-saf'
            )
            
            # Additional validation
            if 'sub' not in payload or payload['sub'] not in USERS_WHITELIST:
                return None
                
            return payload
            
        except jwt.ExpiredSignatureError:
            return {'error': 'token_expired', 'message': 'Token expirado'}
        except jwt.InvalidTokenError:
            return {'error': 'invalid_token', 'message': 'Token inválido'}
    
    def refresh_token(self, token: str) -> Optional[str]:
        """Refresh JWT token if valid and not expired"""
        payload = self.verify_token(token)
        
        if not payload or 'error' in payload:
            return None
        
        # Generate new token
        user_info = USERS_WHITELIST[payload['sub']]
        return self.generate_token(payload['sub'], user_info)
    
    def check_permission(self, user_role: str, required_role: str) -> bool:
        """Check if user has required permissions"""
        role_hierarchy = {
            'agente': 1,
            'coordenadora': 2
        }
        
        user_level = role_hierarchy.get(user_role, 0)
        required_level = role_hierarchy.get(required_role, 0)
        
        return user_level >= required_level
    
    def get_user_info(self, username: str) -> Optional[Dict]:
        """Get user information from whitelist"""
        if username not in USERS_WHITELIST:
            return None
            
        user_info = USERS_WHITELIST[username].copy()
        user_info['username'] = username
        return user_info
    
    def validate_email_domain(self, email: str) -> bool:
        """Validate if email domain is allowed"""
        allowed_domains = ['@mbcentral.com.br', '@seb.com.br', '@sebsa.com.br']
        return any(domain in email.lower() for domain in allowed_domains)

# Global instance
secure_auth = SecureAuthService()

# Backward compatibility functions
def authenticate_user(username: str, password: str) -> Optional[Dict]:
    """Legacy function for backward compatibility"""
    result = secure_auth.authenticate_user(username, password)
    if result and result.get('success'):
        return result['user']
    return None

def generate_token(username: str, user_info: Dict) -> str:
    """Legacy function for backward compatibility"""
    return secure_auth.generate_token(username, user_info)

def verify_token(token: str) -> Optional[Dict]:
    """Legacy function for backward compatibility"""
    return secure_auth.verify_token(token)

def check_permission(user_role: str, required_role: str) -> bool:
    """Legacy function for backward compatibility"""
    return secure_auth.check_permission(user_role, required_role)

