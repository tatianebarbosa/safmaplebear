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
from datetime import datetime
from shared.canva_collector import CanvaCollector


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
        logging.info("Iniciando coleta de dados...")
        data = collector.run_sync_blocking()
        
        # 4. Log dos dados coletados
        logging.info("Dados coletados com sucesso:")
        logging.info(f"  - Designs criados: {data.get('designs_criados', 0)} ({data.get('designs_criados_crescimento', 0)}%)")
        logging.info(f"  - Total publicado: {data.get('total_publicado', 0)} ({data.get('total_publicado_crescimento', 0)}%)")
        logging.info(f"  - Total compartilhado: {data.get('total_compartilhado', 0)} ({data.get('total_compartilhado_crescimento', 0)}%)")
        logging.info(f"  - Alunos: {data.get('alunos', 0)} ({data.get('alunos_crescimento', 0)}%)")
        logging.info(f"  - Professores: {data.get('professores', 0)} ({data.get('professores_crescimento', 0)}%)")
        logging.info(f"  - Total de pessoas: {data.get('total_pessoas', 0)}")
        logging.info(f"  - Modelos na tabela: {len(data.get('modelos', []))}")
        
        # 5. Salvar os dados (implementar conforme necessário)
        # Opções:
        # - Salvar em Cosmos DB
        # - Salvar em Azure Blob Storage
        # - Salvar em arquivo JSON local
        # - Enviar para API do sistema
        
        # Exemplo: Salvar em arquivo JSON (para desenvolvimento)
        output_file = "/tmp/canva_data_latest.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        logging.info(f"Dados salvos em: {output_file}")
        
        # TODO: Implementar salvamento no Cosmos DB ou outro storage
        # from shared.service import save_canva_data
        # save_canva_data(data)
        
        logging.info(f'[{timestamp}] Sincronização do Canva concluída com sucesso.')
    
    except ImportError as e:
        logging.error(f"Erro de importação: {str(e)}")
        logging.error("Certifique-se de que o Playwright está instalado: pip install playwright && playwright install")
    
    except Exception as e:
        logging.error(f"Erro durante a sincronização do Canva: {str(e)}", exc_info=True)
        raise
    
    finally:
        logging.info(f'[{timestamp}] Sincronização automática finalizada.')
