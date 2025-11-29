import json
from datetime import datetime, timezone
import azure.functions as func

try:
    # Preferir o servi�o dedicado para reuso e testes
    from ..shared.canva_overview_service import compute_overview, build_school_breakdown
except Exception:  # pragma: no cover - fallback em ambiente sem pacotes resolvidos
    compute_overview = None
    build_school_breakdown = None


def _error(message: str, status: int = 500) -> func.HttpResponse:
    return func.HttpResponse(
        json.dumps({"success": False, "message": message}, ensure_ascii=False),
        status_code=status,
        headers={"Content-Type": "application/json; charset=utf-8"},
    )


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    GET /api/canva/overview
    Retorna indicadores de licen�as Canva usando os arquivos locais (Franchising.csv e licencas_canva.csv).
    """
    if req.method not in ("GET", "OPTIONS"):
        return _error("Method not allowed", status=405)

    # Resposta para preflight
    if req.method == "OPTIONS":
        return func.HttpResponse(
            status_code=204,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        )

    if compute_overview is None:
        return _error("Servi�o de overview n�o carregado")

    try:
        license_limit_param = req.params.get("licenseLimit")
        license_limit = int(license_limit_param) if license_limit_param else None

        overview = compute_overview(license_limit=license_limit)
        breakdown = build_school_breakdown(license_limit=license_limit)

        payload = {
            "success": True,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "overview": overview,
            "schools": breakdown,
        }

        return func.HttpResponse(
            json.dumps(payload, ensure_ascii=False),
            status_code=200,
            headers={
                "Content-Type": "application/json; charset=utf-8",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization",
            },
        )
    except FileNotFoundError as exc:
        return _error(str(exc), status=404)
    except Exception as exc:  # pragma: no cover
        return _error(f"Erro interno: {exc}", status=500)
