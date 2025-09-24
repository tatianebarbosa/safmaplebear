import azure.functions as func
import json
from ..shared.auth import verify_token, check_permission
from ..shared.service import data_service

def main(req: func.HttpRequest) -> func.HttpResponse:
    """School users endpoint - GET /api/schools/{id}/users"""
    
    if req.method != 'GET':
        return func.HttpResponse(
            json.dumps({"success": False, "message": "Method not allowed"}),
            status_code=405,
            headers={"Content-Type": "application/json"}
        )
    
    try:
        # Verify authentication
        auth_header = req.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Token de autorização necessário"}),
                status_code=401,
                headers={"Content-Type": "application/json"}
            )
        
        token = auth_header[7:]  # Remove 'Bearer '
        payload = verify_token(token)
        if not payload:
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Token inválido ou expirado"}),
                status_code=401,
                headers={"Content-Type": "application/json"}
            )
        
        # Check permissions
        user_role = payload.get('role', '')
        if not check_permission(user_role, 'agente'):
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Permissão insuficiente"}),
                status_code=403,
                headers={"Content-Type": "application/json"}
            )
        
        # Get school ID from route params
        school_id = req.route_params.get('id')
        if not school_id:
            return func.HttpResponse(
                json.dumps({"success": False, "message": "ID da escola é obrigatório"}),
                status_code=400,
                headers={"Content-Type": "application/json"}
            )
        
        # Get school users
        users = data_service.get_school_users(school_id)
        
        # Convert to dict format for JSON serialization
        users_data = [user.to_dict() for user in users]
        
        return func.HttpResponse(
            json.dumps(users_data, ensure_ascii=False),
            status_code=200,
            headers={
                "Content-Type": "application/json; charset=utf-8",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
        )
        
    except Exception as e:
        return func.HttpResponse(
            json.dumps({"success": False, "message": f"Erro interno: {str(e)}"}),
            status_code=500,
            headers={"Content-Type": "application/json"}
        )