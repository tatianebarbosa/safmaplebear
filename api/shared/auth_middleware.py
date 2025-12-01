import azure.functions as func
import json
import jwt
from functools import wraps
from .secure_auth import secure_auth

def auth_middleware(required_role: str = None):
    """
    Middleware para autenticação e autorização de Azure Functions.
    Verifica o token JWT no cabeçalho Authorization e a permissão do usuário.
    """
    def decorator(func):
        @wraps(func)
        def wrapper(req: func.HttpRequest, *args, **kwargs) -> func.HttpResponse:
            # 1. Verificar cabeçalho Authorization
            auth_header = req.headers.get('Authorization')
            if not auth_header or not auth_header.startswith('Bearer '):
                return func.HttpResponse(
                    json.dumps({"success": False, "message": "Token de autenticação ausente ou inválido"}),
                    status_code=401,
                    mimetype="application/json; charset=utf-8"
                )

            token = auth_header.split(' ')[1]
            
            # 2. Verificar validade do token
            payload = secure_auth.verify_token(token)
            
            if not payload or 'error' in payload:
                status_code = 401
                message = payload.get('message', 'Token inválido ou expirado') if payload else 'Token inválido ou expirado'
                return func.HttpResponse(
                    json.dumps({"success": False, "message": message}),
                    status_code=status_code,
                    mimetype="application/json; charset=utf-8"
                )

            user_role = payload.get('role')
            
            # 3. Verificar permissão (Autorização)
            if required_role and not secure_auth.check_permission(user_role, required_role):
                return func.HttpResponse(
                    json.dumps({"success": False, "message": "Acesso negado. Permissão insuficiente."}),
                    status_code=403,
                    mimetype="application/json; charset=utf-8"
                )
            
            # 4. Adicionar informações do usuário ao contexto da função
            kwargs['user_info'] = payload
            
            # 5. Executar a função original
            return func(req, *args, **kwargs)
        return wrapper
    return decorator

# Adicionar o middleware ao login para proteger contra chamadas não-POST
def main_login(req: func.HttpRequest) -> func.HttpResponse:
    """Função de login original, sem middleware de autenticação"""
    # ... (código da função de login)
    pass
