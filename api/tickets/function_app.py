import azure.functions as func
import json
from typing import Dict, Any, List

from ..shared.service import DataProcessingService
from ..shared.secure_auth import authenticate_request
from ..shared.db_models import Ticket

service = DataProcessingService()

def ticket_to_dict(ticket: Ticket) -> Dict[str, Any]:
    """Converte o objeto Ticket do SQLAlchemy para um dicionário compatível com o frontend."""
    return {
        "id": ticket.id,
        "agente": ticket.agente,
        "status": ticket.status,
        "observacao": ticket.observacao,
        "createdAt": ticket.created_at.isoformat() if ticket.created_at else None,
        "updatedAt": ticket.updated_at.isoformat() if ticket.updated_at else None,
        "resolvedAt": ticket.resolved_at.isoformat() if ticket.resolved_at else None,
        "dueDate": ticket.due_date.isoformat() if ticket.due_date else None,
        "priority": ticket.priority,
        "slaDias": ticket.sla_dias,
        "assigneeEmail": ticket.assignee_email,
        "notes": ticket.notes,
        "history": ticket.history,
    }

def main(req: func.HttpRequest) -> func.HttpResponse:
    """Azure Function para gerenciar Tickets (GET, POST, PUT)."""
    
    # Autenticação e Autorização (simulada ou real, dependendo da implementação)
    # user = authenticate_request(req)
    # if not user:
    #     return func.HttpResponse("Unauthorized", status_code=401)

    try:
        if req.method == 'GET':
            tickets: List[Ticket] = service.list_tickets()
            return func.HttpResponse(
                json.dumps([ticket_to_dict(t) for t in tickets]),
                mimetype="application/json",
                status_code=200
            )

        elif req.method == 'POST':
            try:
                req_body = req.get_json()
            except ValueError:
                return func.HttpResponse(
                    "Please pass a JSON in the request body",
                    status_code=400
                )
            
            new_ticket = service.create_ticket(req_body)
            return func.HttpResponse(
                json.dumps(ticket_to_dict(new_ticket)),
                mimetype="application/json",
                status_code=201
            )

        elif req.method == 'PUT':
            try:
                req_body = req.get_json()
            except ValueError:
                return func.HttpResponse(
                    "Please pass a JSON in the request body",
                    status_code=400
                )
            
            ticket_id = req_body.get("id")
            if not ticket_id:
                return func.HttpResponse("Ticket ID is required for update", status_code=400)
            
            updated_ticket = service.update_ticket(ticket_id, req_body)
            
            if updated_ticket:
                return func.HttpResponse(
                    json.dumps(ticket_to_dict(updated_ticket)),
                    mimetype="application/json",
                    status_code=200
                )
            else:
                return func.HttpResponse("Ticket not found", status_code=404)

        else:
            return func.HttpResponse(
                "Method not allowed",
                status_code=405
            )

    except Exception as e:
        # Logar o erro para depuração
        print(f"Error processing request: {e}")
        return func.HttpResponse(
             f"Internal Server Error: {str(e)}",
             status_code=500
        )
