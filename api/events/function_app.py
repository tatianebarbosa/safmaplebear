import json
import azure.functions as func

from ..shared.auth_middleware import auth_middleware
from ..shared.events_service import event_service


def _build_headers() -> dict:
    return {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }


def _handle_options() -> func.HttpResponse:
    return func.HttpResponse(
        "", status_code=200, headers=_build_headers()
    )


def _get_events(req: func.HttpRequest) -> func.HttpResponse:
    month = (req.params.get("mes") or "").strip()
    day = (req.params.get("dia") or "").strip() or None
    if not month:
        return func.HttpResponse(
            json.dumps({"success": False, "message": "Parametro 'mes' e obrigatorio"}),
            status_code=400,
            headers=_build_headers(),
        )

    try:
        events = [ev.to_dict() for ev in event_service.list_events(month, day)]
        return func.HttpResponse(
            json.dumps({"success": True, "events": events}, ensure_ascii=False),
            status_code=200,
            headers=_build_headers(),
        )
    except ValueError as e:
        return func.HttpResponse(
            json.dumps({"success": False, "message": str(e)}),
            status_code=400,
            headers=_build_headers(),
        )
    except Exception as e:
        return func.HttpResponse(
            json.dumps({"success": False, "message": f"Erro interno: {e}"}),
            status_code=500,
            headers=_build_headers(),
        )


def _create_event(req: func.HttpRequest, user_info: dict) -> func.HttpResponse:
    try:
        payload = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({"success": False, "message": "JSON invalido"}),
            status_code=400,
            headers=_build_headers(),
        )

    try:
        created = event_service.create_event(payload, user_info)
        return func.HttpResponse(
            json.dumps({"success": True, "event": created.to_dict()}, ensure_ascii=False),
            status_code=201,
            headers=_build_headers(),
        )
    except ValueError as e:
        return func.HttpResponse(
            json.dumps({"success": False, "message": str(e)}),
            status_code=400,
            headers=_build_headers(),
        )
    except Exception as e:
        return func.HttpResponse(
            json.dumps({"success": False, "message": f"Erro interno: {e}"}),
            status_code=500,
            headers=_build_headers(),
        )


def _update_event(req: func.HttpRequest, event_id: str) -> func.HttpResponse:
    try:
        payload = req.get_json()
    except ValueError:
        return func.HttpResponse(
            json.dumps({"success": False, "message": "JSON invalido"}),
            status_code=400,
            headers=_build_headers(),
        )

    try:
        updated = event_service.update_event(event_id, payload)
        if not updated:
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Evento nao encontrado"}),
                status_code=404,
                headers=_build_headers(),
            )
        return func.HttpResponse(
            json.dumps({"success": True, "event": updated.to_dict()}, ensure_ascii=False),
            status_code=200,
            headers=_build_headers(),
        )
    except ValueError as e:
        return func.HttpResponse(
            json.dumps({"success": False, "message": str(e)}),
            status_code=400,
            headers=_build_headers(),
        )
    except Exception as e:
        return func.HttpResponse(
            json.dumps({"success": False, "message": f"Erro interno: {e}"}),
            status_code=500,
            headers=_build_headers(),
        )


def _delete_event(event_id: str) -> func.HttpResponse:
    try:
        removed = event_service.delete_event(event_id)
        if not removed:
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Evento nao encontrado"}),
                status_code=404,
                headers=_build_headers(),
            )
        return func.HttpResponse(
            json.dumps({"success": True}),
            status_code=200,
            headers=_build_headers(),
        )
    except Exception as e:
        return func.HttpResponse(
            json.dumps({"success": False, "message": f"Erro interno: {e}"}),
            status_code=500,
            headers=_build_headers(),
        )


@auth_middleware(required_role="agent")
def main(req: func.HttpRequest, user_info: dict) -> func.HttpResponse:
    if req.method == "OPTIONS":
        return _handle_options()

    if req.method == "GET":
        return _get_events(req)

    event_id = req.route_params.get("id")

    if req.method == "POST":
        return _create_event(req, user_info)
    if req.method == "PUT":
        if not event_id:
            return func.HttpResponse(
                json.dumps({"success": False, "message": "ID do evento obrigatorio"}),
                status_code=400,
                headers=_build_headers(),
            )
        return _update_event(req, event_id)
    if req.method == "DELETE":
        if not event_id:
            return func.HttpResponse(
                json.dumps({"success": False, "message": "ID do evento obrigatorio"}),
                status_code=400,
                headers=_build_headers(),
            )
        return _delete_event(event_id)

    return func.HttpResponse(
        json.dumps({"success": False, "message": "Metodo nao suportado"}),
        status_code=405,
        headers=_build_headers(),
    )
