"""
Azure Function - Timer Trigger para Sincronização Automática do Canva
======================================================================

Esta função é executada automaticamente a cada 24 horas para coletar
dados do Canva e atualizar o sistema.

Configuração: Cron '0 0 0 * * *' (meia-noite todos os dias)
"""

import logging
import azure.functions as func
import os
import json
import pandas as pd
from datetime import datetime
from shared.canva_collector import CanvaCollector
from shared.canva_data_processor import integrate_canva_data, load_schools_data
from io import StringIO


def main(mytimer: func.TimerRequest) -> None:
    """
    Função Timer Trigger para sincronizar dados do Canva automaticamente.
    Configurado para rodar a cada 24 horas (Cron: '0 0 0 * * *').
    
    Args:
        mytimer: Objeto de requisição do timer do Azure Functions
    """
    timestamp = datetime.now().isoformat()
    
    if mytimer.past_due:
        logging.warning(f'[{timestamp}] O timer foi atrasado!')
    
    logging.info(f'[{timestamp}] Iniciando a sincronização automática de dados do Canva.')
    
    try:
        # 1. Obter credenciais das variáveis de ambiente
        canva_email = os.environ.get('CANVA_EMAIL')
        canva_password = os.environ.get('CANVA_PASSWORD')
        
        if not canva_email or not canva_password:
            logging.error("Credenciais do Canva não encontradas nas variáveis de ambiente.")
            logging.error("Configure CANVA_EMAIL e CANVA_PASSWORD no local.settings.json ou Azure App Settings")
            return
        
        logging.info(f"Credenciais encontradas para: {canva_email}")
        
        # 2. Inicializar o coletor
        collector = CanvaCollector(canva_email, canva_password, headless=True)
        
        # 3. Executar a sincronização (versão bloqueante para Azure Functions)
        logging.info("Iniciando coleta de dados do Canva...")
        canva_metrics = collector.run_sync_blocking()
        
        # 4. Log dos dados coletados
        logging.info("Dados brutos do Canva coletados com sucesso.")
        logging.info(f"  - Total de usuários encontrados: {len(canva_metrics.get('usuarios', []))}")
        
        # 5. Processar e integrar os dados com a base de escolas
        logging.info("Iniciando processamento e alocação de usuários por escola...")
        
        # **Atenção:** O arquivo DadosEscolas.csv deve ser carregado de um local persistente
        # ou de um storage (Azure Blob, etc.). Para simulação, vamos assumir que o CSV
        # está disponível no diretório da função ou em um local acessível.
        # No ambiente real do Azure Functions, você precisará adaptar a leitura do CSV.
        
        # Para este exemplo, vamos ler o CSV que o usuário forneceu, assumindo que ele 
        # será o novo "master" de escolas.
        
        # Lendo o CSV da base de escolas (substitua pelo método de leitura real em produção)
        # Assumindo que o CSV está em um local conhecido ou será injetado no deploy.
        # Para fins de teste, vamos usar um caminho simulado.
        # **IMPORTANTE:** Em produção, o CSV deve ser lido de um local seguro e persistente.
        
        # Lógica para carregar o CSV (simulando a leitura do arquivo fornecido)
        try:
            # Tenta ler o arquivo DadosEscolas.csv que foi feito upload
            schools_csv_path = os.path.join(os.path.dirname(__file__), '..', '..', 'upload', 'DadosEscolas.csv')
            with open(schools_csv_path, 'r', encoding='utf-8') as f:
                schools_csv_content = f.read()
        except FileNotFoundError:
            logging.error(f"Arquivo DadosEscolas.csv não encontrado em {schools_csv_path}. Usando base de dados simulada.")
            # Se não encontrar, usa a base simulada do canva_data_processor para não quebrar o fluxo
            schools_csv_content = load_schools_data.__defaults__[0] 
        
        # Carrega e processa a base de escolas
        schools_df, domain_map_df = load_schools_data(schools_csv_content)
        
        # Integra os dados
        integrated_data = integrate_canva_data(canva_metrics, schools_df, domain_map_df)
        
        # 6. Log dos dados processados
        logging.info("Dados processados e alocados com sucesso.")
        logging.info(f"  - Total de escolas na base: {len(integrated_data.get('schools_allocation', []))}")
        logging.info(f"  - Usuários não alocados: {integrated_data.get('unallocated_users_count', 0)}")
        
        # 7. Salvar os dados (implementar conforme necessário)
        # O resultado final é o integrated_data, que contém as métricas e a alocação por escola.
        
        # Exemplo: Salvar em arquivo JSON (para desenvolvimento)
        output_file = "/tmp/canva_data_integrated_latest.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(integrated_data, f, indent=2, ensure_ascii=False)
        logging.info(f"Dados integrados salvos em: {output_file}")
        
        # TODO: Implementar salvamento no Cosmos DB ou outro storage
        # from shared.service import save_integrated_data
        # save_integrated_data(integrated_data)
        
        logging.info(f'[{timestamp}] Sincronização e processamento do Canva concluídos com sucesso.')
    
    except ImportError as e:
        logging.error(f"Erro de importação: {str(e)}")
        logging.error("Certifique-se de que o Playwright está instalado: pip install playwright && playwright install")
    
    except Exception as e:
        logging.error(f"Erro durante a sincronização do Canva: {str(e)}", exc_info=True)
        raise
    
    finally:
        logging.info(f'[{timestamp}] Sincronização automática finalizada.')
