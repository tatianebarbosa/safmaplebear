"""
Azure Function - HTTP Trigger para registrar uma alteração manual no Canva
=========================================================================

Endpoint: POST /api/canva/registrar-alteracao
Registra uma alteração manual no histórico.
"""

import logging
import json
import os
from pathlib import Path
from datetime import datetime
import azure.functions as func


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Registra uma alteração manual no histórico.
    
    Body (obrigatório):
    {
        "descricao": "Descrição da alteração",
        "usuario": "Nome do Usuário",
        "tipo": "Manual"
    }
    
    Returns:
        JSON com o registro criado.
    """
    logging.info('Requisição recebida para registrar alteração do Canva')
    
    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse(
             json.dumps({
                "error": "Corpo da requisição inválido",
                "message": "O corpo da requisição deve ser um JSON válido."
            }, ensure_ascii=False),
             status_code=400,
             mimetype="application/json"
        )

    descricao = req_body.get('descricao')
    usuario = req_body.get('usuario')
    tipo = req_body.get('tipo', 'Manual')
    
    if not descricao or not usuario:
        return func.HttpResponse(
             json.dumps({
                "error": "Campos obrigatórios ausentes",
                "message": "Os campos 'descricao' e 'usuario' são obrigatórios."
            }, ensure_ascii=False),
             status_code=400,
             mimetype="application/json"
        )

    try:
        # Caminho para o arquivo de histórico
        history_file = Path(__file__).parent.parent.parent / 'public' / 'data' / 'canva_history.json'
        
        # Lê o histórico existente ou inicializa
        if history_file.exists():
            with open(history_file, 'r', encoding='utf-8') as f:
                history_data = json.load(f)
        else:
            history_data = []
        
        # Cria o novo registro
        new_id = len(history_data) + 1
        new_record = {
            "id": new_id,
            "timestamp": datetime.now().isoformat() + 'Z',
            "tipo": tipo,
            "descricao": descricao,
            "usuario": usuario,
            "status": "Registrado",
            "metadados": req_body.get('metadados', {})
        }
        
        # Adiciona o novo registro e salva
        history_data.append(new_record)
        with open(history_file, 'w', encoding='utf-8') as f:
            json.dump(history_data, f, ensure_ascii=False, indent=2)
        
        logging.info(f'Alteração registrada com sucesso. ID: {new_id}')
        
        return func.HttpResponse(
            json.dumps(new_record, ensure_ascii=False, indent=2),
            status_code=201,
            mimetype="application/json",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        )
    
    except Exception as e:
        logging.error(f'Erro ao registrar alteração: {str(e)}', exc_info=True)
        return func.HttpResponse(
            json.dumps({
                "error": "Erro interno",
                "message": str(e)
            }, ensure_ascii=False),
            status_code=500,
            mimetype="application/json"
        )
