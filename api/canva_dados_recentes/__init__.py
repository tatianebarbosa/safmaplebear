"""
Azure Function - HTTP Trigger para obter dados recentes do Canva
Endpoint: GET /api/canva/dados-recentes
Retorna os dados mais recentes coletados do Canva a partir do arquivo integrado.
"""

import logging
import json
from pathlib import Path
import azure.functions as func


def main(req: func.HttpRequest) -> func.HttpResponse:
    """Retorna o JSON mais recente integrado do Canva."""
    logging.info("Requisição recebida para obter dados recentes do Canva")

    try:
        # Caminho para o arquivo de dados integrados
        data_file = Path(__file__).parent.parent.parent / "canva_data_integrated_latest.json"

        if not data_file.exists():
            # Tenta caminho alternativo (public/data)
            data_file = Path(__file__).parent.parent.parent / "public" / "data" / "canva_data_integrated_latest.json"

        if not data_file.exists():
            logging.warning("Arquivo de dados integrados não encontrado")
            return func.HttpResponse(
                json.dumps(
                    {
                        "error": "Dados não disponíveis",
                        "message": (
                            "Os dados do Canva ainda não foram coletados. "
                            "Use a coleta manual ou faça upload do canva_data_integrated_latest.json em public/data."
                        ),
                    },
                    ensure_ascii=False,
                ),
                status_code=404,
                mimetype="application/json; charset=utf-8",
            )

        with open(data_file, "r", encoding="utf-8") as f:
            data = json.load(f)

        logging.info(f'Dados retornados com sucesso. Período: {data.get("periodo_filtro", "N/A")}')

        return func.HttpResponse(
            json.dumps(data, ensure_ascii=False, indent=2),
            status_code=200,
            mimetype="application/json; charset=utf-8",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
            },
        )

    except json.JSONDecodeError as e:
        logging.error(f"Erro ao decodificar JSON: {str(e)}")
        return func.HttpResponse(
            json.dumps(
                {
                    "error": "Erro ao processar dados",
                    "message": "O arquivo de dados está corrompido.",
                },
                ensure_ascii=False,
            ),
            status_code=500,
            mimetype="application/json; charset=utf-8",
        )

    except Exception as e:  # pragma: no cover
        logging.error(f"Erro ao obter dados recentes: {str(e)}", exc_info=True)
        return func.HttpResponse(
            json.dumps(
                {
                    "error": "Erro interno",
                    "message": str(e),
                },
                ensure_ascii=False,
            ),
            status_code=500,
            mimetype="application/json; charset=utf-8",
        )
