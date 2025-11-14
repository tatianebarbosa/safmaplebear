"""
Azure Function - HTTP Trigger para coletar dados do Canva sob demanda
=====================================================================

Endpoint: POST /api/canva/coletar-dados
Executa a coleta de dados do Canva manualmente
"""

import logging
import json
import os
import azure.functions as func
from datetime import datetime


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Executa a coleta de dados do Canva sob demanda.
    
    Body (opcional):
    {
        "periodo_filtro": "Últimos 30 dias"
    }
    
    Returns:
        JSON com os dados coletados
    """
    logging.info('Requisição recebida para coletar dados do Canva')
    
    try:
        # Importa os módulos necessários
        from shared.canva_collector import CanvaCollector
        from shared.canva_data_processor import integrate_canva_data, load_schools_data
        
        # Obtém credenciais das variáveis de ambiente
        canva_email = os.environ.get('CANVA_EMAIL')
        canva_password = os.environ.get('CANVA_PASSWORD')
        
        if not canva_email or not canva_password:
            logging.error("Credenciais do Canva não encontradas nas variáveis de ambiente")
            return func.HttpResponse(
                json.dumps({
                    "error": "Configuração inválida",
                    "message": "Credenciais do Canva não configuradas. Configure CANVA_EMAIL e CANVA_PASSWORD."
                }, ensure_ascii=False),
                status_code=500,
                mimetype="application/json"
            )
        
        # Obtém o período do filtro (opcional)
        try:
            req_body = req.get_json()
            periodo_filtro = req_body.get('periodo_filtro', 'Últimos 30 dias')
        except ValueError:
            periodo_filtro = 'Últimos 30 dias'
        
        logging.info(f"Iniciando coleta de dados do Canva para o período: {periodo_filtro}")
        
        # Inicializa o coletor
        collector = CanvaCollector(canva_email, canva_password, headless=True, periodo_filtro=periodo_filtro)
        
        # Executa a coleta (versão bloqueante para Azure Functions)
        logging.info("Executando coleta de dados...")
        canva_metrics = collector.run_sync_blocking()
        
        logging.info(f"Coleta concluída. Total de usuários: {len(canva_metrics.get('usuarios', []))}")
        
        # Processa e integra os dados com a base de escolas
        # (Opcional: pode retornar apenas os dados brutos)
        try:
            # Carrega base de escolas
            schools_csv_path = os.path.join(os.path.dirname(__file__), '..', 'local_data', 'Franchising_oficial.xlsx')
            
            # Se não encontrar, tenta outro caminho
            if not os.path.exists(schools_csv_path):
                schools_csv_path = os.path.join(os.path.dirname(__file__), '..', '..', 'public', 'data', 'franchising_oficial.csv')
            
            if os.path.exists(schools_csv_path):
                with open(schools_csv_path, 'r', encoding='utf-8') as f:
                    schools_csv = f.read()
                
                schools_df, domain_map_df = load_schools_data(schools_csv)
                integrated_data = integrate_canva_data(canva_metrics, schools_df, domain_map_df)
                
                logging.info("Dados integrados com sucesso")
                response_data = integrated_data
            else:
                logging.warning("Base de escolas não encontrada. Retornando dados brutos.")
                response_data = canva_metrics
        
        except Exception as e:
            logging.warning(f"Erro ao integrar dados: {str(e)}. Retornando dados brutos.")
            response_data = canva_metrics
        
        # Adiciona metadados da coleta
        response_data['coleta_manual'] = True
        response_data['timestamp_coleta'] = datetime.now().isoformat()
        
        return func.HttpResponse(
            json.dumps(response_data, ensure_ascii=False, indent=2),
            status_code=200,
            mimetype="application/json",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        )
    
    except ImportError as e:
        logging.error(f'Erro ao importar módulos: {str(e)}')
        return func.HttpResponse(
            json.dumps({
                "error": "Erro de configuração",
                "message": f"Módulos necessários não encontrados: {str(e)}"
            }, ensure_ascii=False),
            status_code=500,
            mimetype="application/json"
        )
    
    except Exception as e:
        logging.error(f'Erro ao coletar dados do Canva: {str(e)}', exc_info=True)
        return func.HttpResponse(
            json.dumps({
                "error": "Erro na coleta",
                "message": str(e)
            }, ensure_ascii=False),
            status_code=500,
            mimetype="application/json"
        )
