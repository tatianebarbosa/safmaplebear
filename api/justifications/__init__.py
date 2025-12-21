import azure.functions as func
import json
import logging
from datetime import datetime
from typing import Optional
from ..shared.auth import verify_token, check_permission
from ..shared.db import get_session
from ..shared.db_models import Justification, School

# Configure logging
logger = logging.getLogger(__name__)

def main(req: func.HttpRequest) -> func.HttpResponse:
    """Justifications endpoint - GET/POST /api/justifications"""
    
    # Health check endpoint
    if req.params.get('health') == 'true':
        try:
            with get_session() as session:
                session.execute("SELECT 1")
            return func.HttpResponse(
                json.dumps({"status": "healthy", "database": "connected"}),
                status_code=200,
                headers={"Content-Type": "application/json"}
            )
        except Exception as e:
            logger.error(f"Health check failed: {str(e)}")
            return func.HttpResponse(
                json.dumps({"status": "unhealthy", "error": str(e)}),
                status_code=500,
                headers={"Content-Type": "application/json"}
            )
    
    # Handle CORS preflight
    if req.method == 'OPTIONS':
        return func.HttpResponse(
            "",
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            }
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
        
        if req.method == 'GET':
            return handle_get(req)
        elif req.method == 'POST':
            return handle_post(req, payload)
        else:
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Method not allowed"}),
                status_code=405,
                headers={"Content-Type": "application/json; charset=utf-8"}
            )
            
    except Exception as e:
        logger.error(f"Erro no endpoint de justificativas: {str(e)}", exc_info=True)
        return func.HttpResponse(
            json.dumps({"success": False, "message": f"Erro interno: {str(e)}"}),
            status_code=500,
            headers={"Content-Type": "application/json; charset=utf-8"}
        )


def handle_get(req: func.HttpRequest) -> func.HttpResponse:
    """Handle GET request - List justifications, optionally filtered by school_id"""
    try:
        school_id = req.params.get('school_id')
        
        with get_session() as session:
            query = session.query(Justification)
            
            if school_id:
                query = query.filter(Justification.school_id == school_id)
            
            # Order by timestamp descending (most recent first)
            query = query.order_by(Justification.timestamp.desc())
            
            justifications = query.all()
            
            # Convert to dict format
            justifications_data = [
                {
                    "id": j.id,
                    "schoolId": j.school_id,
                    "schoolName": j.school_name,
                    "oldUser": {
                        "name": j.old_user_name,
                        "email": j.old_user_email,
                        "role": j.old_user_role
                    },
                    "newUser": {
                        "name": j.new_user_name,
                        "email": j.new_user_email,
                        "role": j.new_user_role
                    },
                    "reason": j.reason,
                    "performedBy": j.performed_by,
                    "timestamp": j.timestamp.isoformat()
                }
                for j in justifications
            ]
            
            return func.HttpResponse(
                json.dumps({
                    "success": True,
                    "data": justifications_data
                }, ensure_ascii=False),
                status_code=200,
                headers={
                    "Content-Type": "application/json; charset=utf-8",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                }
            )
            
    except Exception as e:
        return func.HttpResponse(
            json.dumps({"success": False, "message": f"Erro ao buscar justificativas: {str(e)}"}),
            status_code=500,
            headers={"Content-Type": "application/json; charset=utf-8"}
        )


def handle_post(req: func.HttpRequest, payload: dict) -> func.HttpResponse:
    """Handle POST request - Create a new justification"""
    try:
        body = req.get_json()
        
        # Validate required fields
        required_fields = [
            'schoolId', 'schoolName', 'oldUser', 'newUser', 'reason', 'performedBy'
        ]
        
        for field in required_fields:
            if field not in body:
                return func.HttpResponse(
                    json.dumps({"success": False, "message": f"Campo obrigatório ausente: {field}"}),
                    status_code=400,
                    headers={"Content-Type": "application/json; charset=utf-8"}
                )
        
        # Validate user objects
        old_user = body['oldUser']
        new_user = body['newUser']
        
        for user_type, user_data in [('oldUser', old_user), ('newUser', new_user)]:
            for field in ['name', 'email', 'role']:
                if field not in user_data:
                    return func.HttpResponse(
                        json.dumps({"success": False, "message": f"Campo obrigatório ausente em {user_type}: {field}"}),
                        status_code=400,
                        headers={"Content-Type": "application/json; charset=utf-8"}
                    )
        
        with get_session() as session:
            # Verify school exists
            school = session.query(School).filter(School.id == body['schoolId']).first()
            if not school:
                return func.HttpResponse(
                    json.dumps({"success": False, "message": f"Escola não encontrada: {body['schoolId']}"}),
                    status_code=404,
                    headers={"Content-Type": "application/json; charset=utf-8"}
                )
            
            # Create new justification
            justification = Justification(
                school_id=body['schoolId'],
                school_name=body['schoolName'],
                old_user_name=old_user['name'],
                old_user_email=old_user['email'],
                old_user_role=old_user['role'],
                new_user_name=new_user['name'],
                new_user_email=new_user['email'],
                new_user_role=new_user['role'],
                reason=body['reason'],
                performed_by=body['performedBy']
            )
            
            session.add(justification)
            session.commit()
            session.refresh(justification)
            
            # Return created justification
            result = {
                "id": justification.id,
                "schoolId": justification.school_id,
                "schoolName": justification.school_name,
                "oldUser": {
                    "name": justification.old_user_name,
                    "email": justification.old_user_email,
                    "role": justification.old_user_role
                },
                "newUser": {
                    "name": justification.new_user_name,
                    "email": justification.new_user_email,
                    "role": justification.new_user_role
                },
                "reason": justification.reason,
                "performedBy": justification.performed_by,
                "timestamp": justification.timestamp.isoformat()
            }
            
            return func.HttpResponse(
                json.dumps({
                    "success": True,
                    "data": result
                }, ensure_ascii=False),
                status_code=201,
                headers={
                    "Content-Type": "application/json; charset=utf-8",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                }
            )
            
    except ValueError as e:
        return func.HttpResponse(
            json.dumps({"success": False, "message": "JSON inválido no corpo da requisição"}),
            status_code=400,
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
    except Exception as e:
        return func.HttpResponse(
            json.dumps({"success": False, "message": f"Erro ao criar justificativa: {str(e)}"}),
            status_code=500,
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
