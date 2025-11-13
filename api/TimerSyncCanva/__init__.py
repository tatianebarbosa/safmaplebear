import logging
import azure.functions as func
import os
import json
from shared.canva_collector import CanvaCollector # Assumindo que a lógica de coleta está aqui

def main(mytimer: func.TimerRequest) -> None:
    """
    Função Timer Trigger para sincronizar dados do Canva automaticamente.
    Configurado para rodar a cada 24 horas (Cron: '0 0 0 * * *').
    """
    if mytimer.past_due:
        logging.info('O timer foi atrasado!')

    logging.info('Iniciando a sincronização automática de dados do Canva.')

    try:
        # 1. Obter credenciais do local.settings.json (ou variáveis de ambiente)
        canva_email = os.environ.get('CANVA_EMAIL')
        canva_password = os.environ.get('CANVA_PASSWORD')

        if not canva_email or not canva_password:
            logging.error("Credenciais do Canva não encontradas nas variáveis de ambiente.")
            return

        # 2. Inicializar o coletor e executar a sincronização
        collector = CanvaCollector(canva_email, canva_password)
        
        # Assumindo que o método run_sync() faz a coleta e salva no DB
        collector.run_sync() 

        logging.info('Sincronização do Canva concluída com sucesso.')

    except Exception as e:
        logging.error(f"Erro durante a sincronização do Canva: {e}")

    logging.info('Sincronização automática finalizada.')
