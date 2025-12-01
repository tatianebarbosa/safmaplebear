import azure.functions as func
import json
from ..shared.auth import verify_token, check_permission
from ..shared.service import data_service

def main(req: func.HttpRequest) -> func.HttpResponse:
    """Admin reload data endpoint - POST /admin/reload-data"""
    
    if req.method != 'POST':
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
        
        # Check permissions - only coordenadora can reload data
        user_role = payload.get('role', '')
        if not check_permission(user_role, 'coordenadora'):
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Apenas coordenadoras podem recarregar dados"}),
                status_code=403,
                headers={"Content-Type": "application/json; charset=utf-8"}
            )
        
        # Perform data reload
        result = data_service.reload_data(payload.get('sub', ''))
        
        status_code = 200 if result.get('success') else 400
        
        return func.HttpResponse(
            json.dumps(result, ensure_ascii=False),
            status_code=status_code,
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
            headers={"Content-Type": "application/json; charset=utf-8"}
        )