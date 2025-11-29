import azure.functions as func
import json

from ..shared.auth import verify_token, check_permission
from ..shared.service import data_service, DEFAULT_MAX_LICENSE_LIMIT


def _cors_headers() -> dict:
    return {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }


def main(req: func.HttpRequest) -> func.HttpResponse:
    """Global license limit endpoint - GET/POST /api/license_limit"""
    if req.method == "OPTIONS":
        return func.HttpResponse("", status_code=200, headers=_cors_headers())

    if req.method not in ("GET", "POST"):
        return func.HttpResponse(
            json.dumps({"success": False, "message": "Method not allowed"}),
            status_code=405,
            headers=_cors_headers(),
        )

    # Authentication and authorization
    auth_header = req.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return func.HttpResponse(
            json.dumps({"success": False, "message": "Token de autorização necessário"}),
            status_code=401,
            headers=_cors_headers(),
        )

    token = auth_header[7:]
    payload = verify_token(token)
    if not payload:
        return func.HttpResponse(
            json.dumps({"success": False, "message": "Token inválido ou expirado"}),
            status_code=401,
            headers=_cors_headers(),
        )

    user_role = payload.get("role", "")
    if not check_permission(user_role, "coordenadora"):
        return func.HttpResponse(
            json.dumps({"success": False, "message": "Apenas coordenadoras podem alterar limites"}),
            status_code=403,
            headers=_cors_headers(),
        )

    try:
        if req.method == "GET":
            limit = data_service.get_global_license_limit()
            return func.HttpResponse(
                json.dumps(
                    {
                        "success": True,
                        "limit": limit,
                        "default": DEFAULT_MAX_LICENSE_LIMIT,
                    },
                    ensure_ascii=False,
                ),
                status_code=200,
                headers=_cors_headers(),
            )

        # POST flow
        try:
            body = req.get_json()
        except ValueError:
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Invalid JSON"}),
                status_code=400,
                headers=_cors_headers(),
            )

        new_limit = body.get("newLimit")
        motivo = str(body.get("motivo", "")).strip()

        if new_limit is None or not motivo:
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Novo limite e motivo são obrigatórios"}),
                status_code=400,
                headers=_cors_headers(),
            )

        try:
            new_limit = int(new_limit)
        except (ValueError, TypeError):
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Novo limite deve ser um número inteiro"}),
                status_code=400,
                headers=_cors_headers(),
            )

        result = data_service.set_global_license_limit(
            new_limit, motivo, payload.get("sub", "")
        )
        status_code = 200 if result.get("success") else 400

        return func.HttpResponse(
            json.dumps(result, ensure_ascii=False),
            status_code=status_code,
            headers=_cors_headers(),
        )

    except Exception as e:
        return func.HttpResponse(
            json.dumps({"success": False, "message": f"Erro interno: {str(e)}"}),
            status_code=500,
            headers=_cors_headers(),
        )
