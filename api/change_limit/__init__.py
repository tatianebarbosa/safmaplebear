import azure.functions as func
import json
from ..shared.auth import verify_token, check_permission
from ..shared.service import data_service

def main(req: func.HttpRequest) -> func.HttpResponse:
    """Change school limit endpoint - POST /api/schools/{id}/limit"""
    
    if req.method != 'POST':
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
        
        # Check permissions - only coordenadora can change limits
        user_role = payload.get('role', '')
        if not check_permission(user_role, 'coordenadora'):
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Apenas coordenadoras podem alterar limites"}),
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
        
        # Parse request body
        try:
            body = req.get_json()
        except ValueError:
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Invalid JSON"}),
                status_code=400,
                headers={"Content-Type": "application/json"}
            )
        
        # Validate required fields
        new_limit = body.get('newLimit')
        motivo = body.get('motivo', '').strip()
        
        if new_limit is None or not motivo:
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Novo limite e motivo são obrigatórios"}),
                status_code=400,
                headers={"Content-Type": "application/json"}
            )
        
        try:
            new_limit = int(new_limit)
        except (ValueError, TypeError):
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Novo limite deve ser um número inteiro"}),
                status_code=400,
                headers={"Content-Type": "application/json"}
            )
        
        # Perform action
        result = data_service.change_school_limit(school_id, new_limit, motivo, payload.get('sub', ''))
        
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
            headers={"Content-Type": "application/json"}
        )