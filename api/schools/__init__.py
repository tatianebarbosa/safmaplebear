import azure.functions as func
import json
from ..shared.auth import verify_token, check_permission
from ..shared.service import data_service

def main(req: func.HttpRequest) -> func.HttpResponse:
    """Schools endpoint - GET /api/schools"""
    
    if req.method != 'GET':
        return func.HttpResponse(
            json.dumps({"success": False, "message": "Method not allowed"}),
            status_code=405,
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
    
    try:
        # Verify authentication
        auth_header = req.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Token de autorização necessário"}),
                status_code=401,
                headers={"Content-Type": "application/json; charset=utf-8"}
            )
        
        token = auth_header[7:]  # Remove 'Bearer '
        payload = verify_token(token)
        if not payload:
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Token inválido ou expirado"}),
                status_code=401,
                headers={"Content-Type": "application/json; charset=utf-8"}
            )
        
        # Check permissions
        user_role = payload.get('role', '')
        if not check_permission(user_role, 'agente'):
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Permissão insuficiente"}),
                status_code=403,
                headers={"Content-Type": "application/json; charset=utf-8"}
            )
        
        # Get schools overview
        schools_overview = data_service.get_schools_overview()
        
        # Convert to dict format for JSON serialization
        schools_data = [school.to_dict() for school in schools_overview]
        
        return func.HttpResponse(
            json.dumps(schools_data, ensure_ascii=False),
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
            headers={"Content-Type": "application/json; charset=utf-8"}
        )