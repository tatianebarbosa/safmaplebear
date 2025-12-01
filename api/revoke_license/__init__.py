import azure.functions as func
import json
from ..shared.auth import verify_token, check_permission
from ..shared.service import data_service
from ..shared.model import LicenseAction

def main(req: func.HttpRequest) -> func.HttpResponse:
    """Revoke license endpoint - POST /api/licenses/revoke"""
    
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
        
        # Check permissions
        user_role = payload.get('role', '')
        if not check_permission(user_role, 'agente'):
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Permissão insuficiente"}),
                status_code=403,
                headers={"Content-Type": "application/json; charset=utf-8"}
            )
        
        # Parse request body
        try:
            body = req.get_json()
        except ValueError:
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Invalid JSON"}),
                status_code=400,
                headers={"Content-Type": "application/json; charset=utf-8"}
            )
        
        # Validate required fields
        school_id = body.get('schoolId', '').strip()
        user_email = body.get('userEmail', '').strip()
        motivo = body.get('motivo', '').strip()
        ticket = body.get('ticket', '').strip()
        
        if not all([school_id, user_email, motivo, ticket]):
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Todos os campos são obrigatórios"}),
                status_code=400,
                headers={"Content-Type": "application/json; charset=utf-8"}
            )
        
        # Create action object
        action = LicenseAction(
            school_id=school_id,
            user_email=user_email,
            motivo=motivo,
            ticket=ticket
        )
        
        # Perform action
        result = data_service.revoke_license(action, payload.get('sub', ''))
        
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