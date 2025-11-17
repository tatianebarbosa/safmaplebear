import azure.functions as func
import json
from ...shared.secure_auth import secure_auth, JWT_SECRET
from ...shared.auth_middleware import auth_middleware

def handle_get_users(req: func.HttpRequest) -> func.HttpResponse:
    """Retorna a lista de todos os usuários (GET /admin/users)"""
    users = secure_auth.get_all_users()
    return func.HttpResponse(
        json.dumps({"success": True, "users": users}, ensure_ascii=False),
        status_code=200,
        mimetype="application/json"
    )

def handle_create_user(req: func.HttpRequest) -> func.HttpResponse:
    """Cria um novo usuário (POST /admin/users)"""
    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({"success": False, "message": "Invalid JSON"}),
            status_code=400,
            mimetype="application/json"
        )
    
    username = body.get('username', '').strip().lower()
    name = body.get('name', '').strip()
    password = body.get('password', '')
    role = body.get('role', 'user').strip().lower()
    
    if not username or not name or not password:
        return func.HttpResponse(
            json.dumps({"success": False, "message": "Username, nome e senha são obrigatórios"}),
            status_code=400,
            mimetype="application/json"
        )

    if not secure_auth.validate_email_domain(username):
        return func.HttpResponse(
            json.dumps({"success": False, "message": "Domínio de email inválido"}),
            status_code=400,
            mimetype="application/json"
        )

    result = secure_auth.create_user(username, name, password, role)
    
    return func.HttpResponse(
        json.dumps(result, ensure_ascii=False),
        status_code=200 if result['success'] else 409, # 409 Conflict se usuário já existe
        mimetype="application/json"
    )

def handle_update_password(req: func.HttpRequest) -> func.HttpResponse:
    """Atualiza a senha de um usuário (PUT /admin/users/password)"""
    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({"success": False, "message": "Invalid JSON"}),
            status_code=400,
            mimetype="application/json"
        )
    
    username = body.get('username', '').strip().lower()
    new_password = body.get('new_password', '')
    
    if not username or not new_password:
        return func.HttpResponse(
            json.dumps({"success": False, "message": "Username e nova senha são obrigatórios"}),
            status_code=400,
            mimetype="application/json"
        )
        
    result = secure_auth.update_user_password(username, new_password)
    
    return func.HttpResponse(
        json.dumps(result, ensure_ascii=False),
        status_code=200 if result['success'] else 404,
        mimetype="application/json"
    )

def handle_update_role(req: func.HttpRequest) -> func.HttpResponse:
    """Atualiza o perfil de um usuário (PUT /admin/users/role)"""
    try:
        body = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({"success": False, "message": "Invalid JSON"}),
            status_code=400,
            mimetype="application/json"
        )
    
    username = body.get('username', '').strip().lower()
    new_role = body.get('new_role', '').strip().lower()
    
    if not username or not new_role:
        return func.HttpResponse(
            json.dumps({"success": False, "message": "Username e novo perfil são obrigatórios"}),
            status_code=400,
            mimetype="application/json"
        )
        
    result = secure_auth.update_user_role(username, new_role)
    
    return func.HttpResponse(
        json.dumps(result, ensure_ascii=False),
        status_code=200 if result['success'] else 400,
        mimetype="application/json"
    )

@auth_middleware(required_role='admin')
def main(req: func.HttpRequest, user_info: dict) -> func.HttpResponse:
    """Main entry point for user management API"""
    
    action = req.route_params.get('action')
    
    if req.method == 'GET':
        return handle_get_users(req)
    
    elif req.method == 'POST':
        return handle_create_user(req)
        
    elif req.method == 'PUT':
        if action == 'password':
            return handle_update_password(req)
        elif action == 'role':
            return handle_update_role(req)
        else:
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Ação de PUT inválida"}),
                status_code=400,
                mimetype="application/json"
            )
            
    return func.HttpResponse(
        json.dumps({"success": False, "message": "Método não permitido"}),
        status_code=405,
        mimetype="application/json"
    )
