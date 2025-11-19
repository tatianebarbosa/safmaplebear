# Secure Authentication and authorization
import jwt
import os
import hashlib
import secrets
import json
from datetime import datetime, timedelta
from typing import Optional, Dict, List

# --- Configurações ---
JWT_SECRET = os.environ.get('JWT_SECRET', secrets.token_urlsafe(32))
JWT_ALGORITHM = 'HS256'
TOKEN_EXPIRY_HOURS = 8
SALT_ROUNDS = 12
USER_DB_PATH = os.path.join(os.path.dirname(__file__), 'users.json')

ROLE_ALIASES = {
    'admin': 'Admin',
    'administrator': 'Admin',
    'administrador': 'Admin',
    'administradora': 'Admin',
    'agent': 'Agent',
    'agente': 'Agent',
    'user': 'Agent',
    'usuario': 'Agent',
    'coordinator': 'Coordinator',
    'coordenador': 'Coordinator',
    'coordenadora': 'Coordinator'
}

ROLE_HIERARCHY = {
    'Agent': 1,
    'Coordinator': 2,
    'Admin': 3
}

# --- Estrutura de Dados de Usuário ---
class User:
    def __init__(self, username, name, role, hashed_password, salt):
        self.username = username
        self.name = name
        self.role = role
        self.hashed_password = hashed_password
        self.salt = salt

    def to_dict(self):
        return {
            'username': self.username,
            'name': self.name,
            'role': self.role,
            'hashed_password': self.hashed_password,
            'salt': self.salt
        }

# --- Serviço de Autenticação e Gerenciamento de Usuários ---
class SecureAuthService:
    def __init__(self):
        self.failed_attempts = {}  # In production, use Redis or database
        self.max_attempts = 5
        self.lockout_time = 300  # 5 minutes
        self._load_users()
        
    def _load_users(self):
        """Carrega usuários do arquivo JSON (simulação de DB)"""
        if not os.path.exists(USER_DB_PATH):
            self.users = {}
            self._save_users()
            return

        try:
            with open(USER_DB_PATH, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.users = {
                    u['username']: User(**u) for u in data.values()
                }
        except Exception:
            self.users = {}
            self._save_users()

    def _save_users(self):
        """Salva usuários no arquivo JSON (simulação de DB)"""
        data = {u.username: u.to_dict() for u in self.users.values()}
        with open(USER_DB_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

    def _normalize_role(self, role: str) -> Optional[str]:
        """Mapeia aliases e normaliza o nome do perfil"""
        if not role:
            return None

        cleaned = role.strip()
        if not cleaned:
            return None

        canonical = ROLE_ALIASES.get(cleaned.lower())
        if canonical:
            return canonical

        if cleaned in ROLE_HIERARCHY:
            return cleaned

        return None

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

    # --- Lógica de Autenticação (Atualizada) ---
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
        username = username.lower()
        
        # Check if account is locked
        if self._is_account_locked(username):
            return {
                'success': False,
                'error': 'account_locked',
                'message': f'Conta bloqueada por {self.lockout_time // 60} minutos devido a muitas tentativas falhadas'
            }
        
        # Check if user exists
        user = self.users.get(username)
        if not user:
            self._record_failed_attempt(username)
            return {
                'success': False,
                'error': 'invalid_credentials',
                'message': 'Credenciais inválidas'
            }
        
        # Verify password using stored hash and salt
        if not self._verify_password(password, user.hashed_password, user.salt):
            self._record_failed_attempt(username)
            return {
                'success': False,
                'error': 'invalid_credentials',
                'message': 'Credenciais inválidas'
            }
        
        # Clear failed attempts on successful login
        self._clear_failed_attempts(username)
        
        user_role = self._normalize_role(user.role) or 'Agent'

        user_info = {
            'username': user.username,
            'name': user.name,
            'role': user_role
        }
        
        return {
            'success': True,
            'user': user_info
        }
    
    def generate_token(self, username: str, user_info: Dict) -> str:
        """Generate JWT token with enhanced security"""
        normalized_role = self._normalize_role(user_info.get('role')) or 'Agent'

        payload = {
            'sub': username,
            'name': user_info['name'],
            'role': normalized_role,
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
            
            # Additional validation: check if user still exists
            if 'sub' not in payload or payload['sub'] not in self.users:
                return None
                
            return payload
            
        except jwt.ExpiredSignatureError:
            return {'error': 'token_expired', 'message': 'Token expirado'}
        except jwt.InvalidTokenError:
            return {'error': 'invalid_token', 'message': 'Token inválido'}
    
    # --- Lógica de Gerenciamento de Usuários (Nova) ---
    def get_all_users(self) -> List[Dict]:
        """Retorna a lista de todos os usuários (sem hash/salt)"""
        return [{
            'username': u.username,
            'name': u.name,
            'role': self._normalize_role(u.role) or 'Agent'
        } for u in self.users.values()]

    def create_user(self, username: str, name: str, password: str, role: str) -> Dict:
        """Cria um novo usuário"""
        username = username.lower()
        if username in self.users:
            return {'success': False, 'message': 'Usuário já existe'}

        normalized_role = self._normalize_role(role)
        if not normalized_role:
            if role:
                return {'success': False, 'message': 'Perfil inválido'}
            normalized_role = 'Agent'
        
        hashed_password, salt = self._hash_password(password)
        
        new_user = User(username, name, normalized_role, hashed_password, salt)
        self.users[username] = new_user
        self._save_users()
        
        return {'success': True, 'message': 'Usuário criado com sucesso'}

    def update_user_password(self, username: str, new_password: str) -> Dict:
        """Atualiza a senha de um usuário"""
        username = username.lower()
        user = self.users.get(username)
        if not user:
            return {'success': False, 'message': 'Usuário não encontrado'}
        
        hashed_password, salt = self._hash_password(new_password)
        user.hashed_password = hashed_password
        user.salt = salt
        self._save_users()
        
        return {'success': True, 'message': 'Senha atualizada com sucesso'}

    def update_user_role(self, username: str, new_role: str) -> Dict:
        """Atualiza o perfil (role) de um usuário"""
        username = username.lower()
        user = self.users.get(username)
        if not user:
            return {'success': False, 'message': 'Usuário não encontrado'}
        
        normalized_role = self._normalize_role(new_role)
        if not normalized_role:
            return {'success': False, 'message': 'Perfil inválido'}

        user.role = normalized_role
        self._save_users()
        
        return {'success': True, 'message': 'Perfil atualizado com sucesso'}

    def delete_user(self, username: str) -> Dict:
        """Deleta um usuário"""
        username = username.lower()
        if username not in self.users:
            return {'success': False, 'message': 'Usuário não encontrado'}
        
        del self.users[username]
        self._save_users()
        
        return {'success': True, 'message': 'Usuário deletado com sucesso'}

    def check_permission(self, user_role: str, required_role: str) -> bool:
        """Check if user has required permissions"""
        normalized_user_role = self._normalize_role(user_role)
        normalized_required_role = self._normalize_role(required_role)

        if not normalized_user_role or not normalized_required_role:
            return False

        user_level = ROLE_HIERARCHY.get(normalized_user_role, 0)
        required_level = ROLE_HIERARCHY.get(normalized_required_role, 0)
        
        return user_level >= required_level
    
    def get_user_info(self, username: str) -> Optional[Dict]:
        """Get user information"""
        user = self.users.get(username.lower())
        if not user:
            return None
            
        user_info = {
            'username': user.username,
            'name': user.name,
            'role': self._normalize_role(user.role) or 'Agent'
        }
        return user_info
    
    def validate_email_domain(self, email: str) -> bool:
        """Validate if email domain is allowed"""
        allowed_domains = ['@mbcentral.com.br', '@seb.com.br', '@sebsa.com.br']
        return any(domain in email.lower() for domain in allowed_domains)

# Global instance
secure_auth = SecureAuthService()

# --- Funções de Compatibilidade (Atualizadas) ---
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
