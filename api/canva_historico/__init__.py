"""
Azure Function - HTTP Trigger para obter o histórico de alterações do Canva
==========================================================================

Endpoint: GET /api/canva/historico
Retorna o histórico de alterações e coletas de dados do Canva.
"""

import logging
import json
import os
from pathlib import Path
import azure.functions as func


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Retorna o histórico de alterações e coletas de dados do Canva.
    
    Returns:
        JSON com o histórico de alterações.
    """
    logging.info('Requisição recebida para obter histórico do Canva')
    
    try:
        # Caminho para o arquivo de histórico (simulado)
        # Em um ambiente real, isso seria um banco de dados ou um blob storage
        history_file = Path(__file__).parent.parent.parent / 'canva_history.json'
        
        if not history_file.exists():
            # Tenta caminho alternativo (public/data)
            history_file = Path(__file__).parent.parent.parent / 'public' / 'data' / 'canva_history.json'
        
        if not history_file.exists():
            # Cria um arquivo de histórico simulado se não existir
            simulated_history = [
                {
                    "id": 1,
                    "timestamp": "2025-11-10T00:00:00Z",
                    "tipo": "Coleta Automática",
                    "descricao": "Sincronização diária de dados do Canva",
                    "usuario": "Coleta manual",
                    "status": "Sucesso",
                    "metadados": {"periodo": "Últimos 30 dias", "usuarios_afetados": 824}
                },
                {
                    "id": 2,
                    "timestamp": "2025-11-13T20:26:00Z",
                    "tipo": "Coleta Manual",
                    "descricao": "Coleta de dados sob demanda via API",
                    "usuario": "API Call",
                    "status": "Sucesso",
                    "metadados": {"periodo": "Últimos 30 dias", "usuarios_afetados": 838}
                }
            ]
            
            with open(history_file, 'w', encoding='utf-8') as f:
                json.dump(simulated_history, f, ensure_ascii=False, indent=2)
        
        # Lê o arquivo de histórico
        with open(history_file, 'r', encoding='utf-8') as f:
            history_data = json.load(f)
        
        logging.info(f'Histórico retornado com sucesso. Total de registros: {len(history_data)}')
        
        return func.HttpResponse(
            json.dumps(history_data, ensure_ascii=False, indent=2),
            status_code=200,
            mimetype="application/json; charset=utf-8",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        )
    
    except Exception as e:
        logging.error(f'Erro ao obter histórico: {str(e)}', exc_info=True)
        return func.HttpResponse(
            json.dumps({
                "error": "Erro interno",
                "message": str(e)
            }, ensure_ascii=False),
            status_code=500,
            mimetype="application/json; charset=utf-8"
        )
