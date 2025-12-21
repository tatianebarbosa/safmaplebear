import azure.functions as func
import json
from ..shared.db import SessionLocal
from ..shared.service import create_audit_log, list_audit_logs

def main(req: func.HttpRequest) -> func.HttpResponse:
    try:
        db = SessionLocal()
        
        if req.method == 'POST':
            try:
                req_body = req.get_json()
            except ValueError:
                return func.HttpResponse(
                     "Please pass a JSON in the request body",
                     status_code=400
                )
            
            action = req_body.get('action')
            school_id = req_body.get('school_id')
            actor = req_body.get('actor')
            payload = req_body.get('payload')

            if not all([action, school_id, actor, payload]):
                return func.HttpResponse(
                     "Please pass action, school_id, actor, and payload in the request body",
                     status_code=400
                )

            log = create_audit_log(db, action, school_id, actor, payload)
            
            return func.HttpResponse(
                json.dumps({"id": log.id, "message": "Audit log created successfully"}),
                mimetype="application/json",
                status_code=201
            )

        elif req.method == 'GET':
            # Implement list/filter logic
            logs = list_audit_logs(db)
            
            # Simple serialization for now
            serialized_logs = []
            for log in logs:
                serialized_logs.append({
                    "id": log.id,
                    "action": log.action,
                    "school_id": log.school_id,
                    "actor": log.actor,
                    "timestamp": log.timestamp.isoformat(),
                    "payload": log.payload
                })
            
            return func.HttpResponse(
                json.dumps(serialized_logs),
                mimetype="application/json",
                status_code=200
            )

        else:
            return func.HttpResponse(
                 "Method not allowed",
                 status_code=405
            )

    except Exception as e:
        return func.HttpResponse(
             f"An error occurred: {str(e)}",
             status_code=500
        )
