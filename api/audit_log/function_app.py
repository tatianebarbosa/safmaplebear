import azure.functions as func
import json
import logging
from ..shared.db import SessionLocal
from ..shared.service import list_audit_logs, create_audit_log
from ..shared.db_models import AuditLog

# Configuração do logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def audit_log_to_dict(log: AuditLog):
    """Converte um objeto AuditLog em um dicionário serializável."""
    return {
        "id": log.id,
        "timestamp": log.timestamp.isoformat(),
        "action": log.action,
        "school_id": log.school_id,
        "actor": log.actor,
        "payload": log.payload,
    }

def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Função principal para o endpoint /api/audit_log.
    Suporta GET (listar) e POST (criar).
    """
    logger.info('Python HTTP trigger function processed a request for audit_log.')

    try:
        db = SessionLocal()
        
        if req.method == 'GET':
            # Listar logs de auditoria
            logs = list_audit_logs(db)
            response_data = [audit_log_to_dict(log) for log in logs]
            
            return func.HttpResponse(
                json.dumps(response_data),
                mimetype="application/json",
                status_code=200
            )

        elif req.method == 'POST':
            # Criar um novo log de auditoria
            try:
                req_body = req.get_json()
            except ValueError:
                return func.HttpResponse(
                     "Por favor, passe um JSON no corpo da requisição.",
                     status_code=400
                )

            action = req_body.get('action')
            school_id = req_body.get('school_id')
            actor = req_body.get('actor')
            payload = req_body.get('payload')

            if not action or not school_id or not actor:
                return func.HttpResponse(
                     "Por favor, passe 'action', 'school_id' e 'actor' no corpo da requisição.",
                     status_code=400
                )

            new_log = create_audit_log(db, action, school_id, actor, payload)
            
            return func.HttpResponse(
                json.dumps(audit_log_to_dict(new_log)),
                mimetype="application/json",
                status_code=201
            )

        else:
            return func.HttpResponse(
                 "Método não permitido.",
                 status_code=405
            )

    except Exception as e:
        logger.error(f"Erro no processamento da requisição: {e}")
        return func.HttpResponse(
             f"Erro interno do servidor: {e}",
             status_code=500
        )
    finally:
        if 'db' in locals() and db:
            db.close()
