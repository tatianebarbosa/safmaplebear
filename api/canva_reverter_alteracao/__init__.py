"""
Azure Function - HTTP Trigger para reverter uma alteração no Canva
==================================================================

Endpoint: POST /api/canva/reverter-alteracao/{id}
Marca uma alteração no histórico como revertida.
"""

import logging
import json
import os
from pathlib import Path
from datetime import datetime
import azure.functions as func


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Marca uma alteração no histórico como revertida.
    
    Parâmetros de Rota:
        id: ID do registro de alteração a ser revertido.
    
    Returns:
        JSON com o registro atualizado.
    """
    logging.info('Requisição recebida para reverter alteração do Canva')
    
    try:
        # Obtém o ID do registro da rota
        record_id_str = req.route_params.get('id')
        if not record_id_str:
            return func.HttpResponse(
                 json.dumps({
                    "error": "Parâmetro ausente",
                    "message": "O ID do registro de alteração é obrigatório."
                }, ensure_ascii=False),
                 status_code=400,
                 mimetype="application/json"
            )
        
        try:
            record_id = int(record_id_str)
        except ValueError:
            return func.HttpResponse(
                 json.dumps({
                    "error": "Parâmetro inválido",
                    "message": "O ID do registro deve ser um número inteiro."
                }, ensure_ascii=False),
                 status_code=400,
                 mimetype="application/json"
            )

        # Caminho para o arquivo de histórico
        history_file = Path(__file__).parent.parent.parent / 'public' / 'data' / 'canva_history.json'
        
        if not history_file.exists():
            return func.HttpResponse(
                 json.dumps({
                    "error": "Histórico não encontrado",
                    "message": "O arquivo de histórico não existe."
                }, ensure_ascii=False),
                 status_code=404,
                 mimetype="application/json"
            )
        
        # Lê o histórico existente
        with open(history_file, 'r', encoding='utf-8') as f:
            history_data = json.load(f)
        
        # Encontra o registro e o reverte
        found = False
        updated_record = None
        for record in history_data:
            if record.get('id') == record_id:
                record['status'] = "Revertido"
                record['data_reversao'] = datetime.now().isoformat() + 'Z'
                updated_record = record
                found = True
                break
        
        if not found:
            return func.HttpResponse(
                 json.dumps({
                    "error": "Registro não encontrado",
                    "message": f"Nenhum registro de alteração encontrado com o ID: {record_id}."
                }, ensure_ascii=False),
                 status_code=404,
                 mimetype="application/json"
            )
        
        # Salva o histórico atualizado
        with open(history_file, 'w', encoding='utf-8') as f:
            json.dump(history_data, f, ensure_ascii=False, indent=2)
        
        logging.info(f'Alteração revertida com sucesso. ID: {record_id}')
        
        return func.HttpResponse(
            json.dumps(updated_record, ensure_ascii=False, indent=2),
            status_code=200,
            mimetype="application/json",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        )
    
    except Exception as e:
        logging.error(f'Erro ao reverter alteração: {str(e)}', exc_info=True)
        return func.HttpResponse(
            json.dumps({
                "error": "Erro interno",
                "message": str(e)
            }, ensure_ascii=False),
            status_code=500,
            mimetype="application/json"
        )
