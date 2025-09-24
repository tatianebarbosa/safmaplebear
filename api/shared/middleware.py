# Security middleware for SAF API
import functools
import time
from datetime import datetime, timedelta
from typing import Dict, Optional, Callable, Any
from .secure_auth import secure_auth
from .config import config

class SecurityMiddleware:
    """Security middleware for API endpoints"""
    
    def __init__(self):
        self.rate_limit_storage = {}  # In production, use Redis
        self.request_logs = []  # In production, use proper logging
    
    def rate_limit(self, max_requests: int = None, window_minutes: int = 1):
        """Rate limiting decorator"""
        if max_requests is None:
            max_requests = config.RATE_LIMIT_PER_MINUTE
            
        def decorator(func: Callable) -> Callable:
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                # Get client identifier (in real app, use IP or user ID)
                client_id = kwargs.get('client_id', 'default')
                current_time = datetime.now()
                
                # Clean old entries
                cutoff_time = current_time - timedelta(minutes=window_minutes)
                if client_id in self.rate_limit_storage:
                    self.rate_limit_storage[client_id] = [
                        req_time for req_time in self.rate_limit_storage[client_id]
                        if req_time > cutoff_time
                    ]
                else:
                    self.rate_limit_storage[client_id] = []
                
                # Check rate limit
                if len(self.rate_limit_storage[client_id]) >= max_requests:
                    return {
                        'error': 'rate_limit_exceeded',
                        'message': f'Muitas requisições. Limite: {max_requests} por {window_minutes} minuto(s)',
                        'retry_after': 60
                    }
                
                # Record request
                self.rate_limit_storage[client_id].append(current_time)
                
                return func(*args, **kwargs)
            return wrapper
        return decorator
    
    def require_auth(self, required_role: str = None):
        """Authentication decorator"""
        def decorator(func: Callable) -> Callable:
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                # Get token from request (in real app, from headers)
                token = kwargs.get('auth_token')
                
                if not token:
                    return {
                        'error': 'missing_token',
                        'message': 'Token de autenticação necessário'
                    }
                
                # Verify token
                payload = secure_auth.verify_token(token)
                
                if not payload or 'error' in payload:
                    return {
                        'error': 'invalid_token',
                        'message': 'Token inválido ou expirado'
                    }
                
                # Check role if required
                if required_role:
                    user_role = payload.get('role')
                    if not secure_auth.check_permission(user_role, required_role):
                        return {
                            'error': 'insufficient_permissions',
                            'message': f'Permissão {required_role} necessária'
                        }
                
                # Add user info to kwargs
                kwargs['current_user'] = payload
                
                return func(*args, **kwargs)
            return wrapper
        return decorator
    
    def log_request(self, func: Callable) -> Callable:
        """Request logging decorator"""
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            
            # Log request start
            log_entry = {
                'function': func.__name__,
                'timestamp': datetime.now().isoformat(),
                'args': str(args)[:100],  # Truncate for security
                'user': kwargs.get('current_user', {}).get('sub', 'anonymous')
            }
            
            try:
                result = func(*args, **kwargs)
                log_entry['status'] = 'success'
                log_entry['duration'] = time.time() - start_time
                
                return result
                
            except Exception as e:
                log_entry['status'] = 'error'
                log_entry['error'] = str(e)
                log_entry['duration'] = time.time() - start_time
                
                raise
            finally:
                self.request_logs.append(log_entry)
                
                # Keep only last 1000 logs in memory
                if len(self.request_logs) > 1000:
                    self.request_logs = self.request_logs[-1000:]
        
        return wrapper
    
    def validate_input(self, schema: Dict[str, Any]):
        """Input validation decorator"""
        def decorator(func: Callable) -> Callable:
            @functools.wraps(func)
            def wrapper(*args, **kwargs):
                # Get input data
                data = kwargs.get('data', {})
                
                # Validate required fields
                required_fields = schema.get('required', [])
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    return {
                        'error': 'validation_error',
                        'message': f'Campos obrigatórios ausentes: {", ".join(missing_fields)}'
                    }
                
                # Validate field types
                field_types = schema.get('types', {})
                for field, expected_type in field_types.items():
                    if field in data and not isinstance(data[field], expected_type):
                        return {
                            'error': 'validation_error',
                            'message': f'Campo {field} deve ser do tipo {expected_type.__name__}'
                        }
                
                # Validate field lengths
                max_lengths = schema.get('max_lengths', {})
                for field, max_length in max_lengths.items():
                    if field in data and len(str(data[field])) > max_length:
                        return {
                            'error': 'validation_error',
                            'message': f'Campo {field} excede o tamanho máximo de {max_length} caracteres'
                        }
                
                return func(*args, **kwargs)
            return wrapper
        return decorator
    
    def get_request_logs(self, limit: int = 100) -> list:
        """Get recent request logs"""
        return self.request_logs[-limit:]
    
    def get_rate_limit_status(self, client_id: str = 'default') -> Dict[str, Any]:
        """Get current rate limit status for client"""
        current_time = datetime.now()
        cutoff_time = current_time - timedelta(minutes=1)
        
        if client_id in self.rate_limit_storage:
            recent_requests = [
                req_time for req_time in self.rate_limit_storage[client_id]
                if req_time > cutoff_time
            ]
            remaining = max(0, config.RATE_LIMIT_PER_MINUTE - len(recent_requests))
        else:
            remaining = config.RATE_LIMIT_PER_MINUTE
        
        return {
            'limit': config.RATE_LIMIT_PER_MINUTE,
            'remaining': remaining,
            'reset_time': (current_time + timedelta(minutes=1)).isoformat()
        }

# Global middleware instance
security_middleware = SecurityMiddleware()

# Convenience decorators
rate_limit = security_middleware.rate_limit
require_auth = security_middleware.require_auth
log_request = security_middleware.log_request
validate_input = security_middleware.validate_input

