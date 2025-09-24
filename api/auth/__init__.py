import azure.functions as func
import json
from ..shared.auth import authenticate_user, generate_token

def main(req: func.HttpRequest) -> func.HttpResponse:
    """Login endpoint - POST /auth/login"""
    
    if req.method != 'POST':
        return func.HttpResponse(
            json.dumps({"success": False, "message": "Method not allowed"}),
            status_code=405,
            headers={"Content-Type": "application/json"}
        )
    
    try:
        # Parse request body
        try:
            body = req.get_json()
        except ValueError:
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Invalid JSON"}),
                status_code=400,
                headers={"Content-Type": "application/json"}
            )
        
        username = body.get('username', '').strip().lower()
        password = body.get('password', '')
        
        if not username or not password:
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Username e password são obrigatórios"}),
                status_code=400,
                headers={"Content-Type": "application/json"}
            )
        
        # Authenticate user
        user_info = authenticate_user(username, password)
        if not user_info:
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Credenciais inválidas"}),
                status_code=401,
                headers={"Content-Type": "application/json"}
            )
        
        # Generate JWT token
        token = generate_token(username, user_info)
        
        # Return success response
        response_data = {
            "success": True,
            "message": "Login realizado com sucesso",
            "token": token,
            "user": {
                "username": username,
                "name": user_info['name'],
                "role": user_info['role']
            }
        }
        
        return func.HttpResponse(
            json.dumps(response_data, ensure_ascii=False),
            status_code=200,
            headers={
                "Content-Type": "application/json; charset=utf-8",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )
        
    except Exception as e:
        return func.HttpResponse(
            json.dumps({"success": False, "message": f"Erro interno: {str(e)}"}),
            status_code=500,
            headers={"Content-Type": "application/json"}
        )