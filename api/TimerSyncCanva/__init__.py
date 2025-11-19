"""
Azure Function - Timer Trigger para Sincronizacao Automatica do Canva
======================================================================

Esta funcao eh executada automaticamente a cada 24 horas para coletar
dados do Canva e atualizar o sistema.

Configuracao: Cron '0 0 0 * * *' (meia-noite todos os dias)
"""

import json
import logging
import os
from datetime import datetime
from pathlib import Path
from typing import Optional, Tuple

import azure.functions as func

from shared.canva_collector import CanvaCollector
from shared.canva_data_processor import (
    generate_markdown_report,
    integrate_canva_data,
    load_schools_data,
)

PROJECT_ROOT = Path(__file__).resolve().parents[2]
UPLOAD_DIR = PROJECT_ROOT / "upload"
DEFAULT_SCHOOLS_FILE = UPLOAD_DIR / "DadosEscolas.csv"
REPORT_FILE = PROJECT_ROOT / "CANVA_REPORT_LATEST.md"
INTEGRATED_DATA_FILE = PROJECT_ROOT / "canva_data_integrated_latest.json"
SCHOOLS_CSV_ENV = "SCHOOLS_CSV_PATH"


def _warn_if_timer_past_due(mytimer: Optional[func.TimerRequest], timestamp: str) -> None:
    """Registra um aviso se o timer do Azure Functions estiver atrasado."""
    if mytimer and getattr(mytimer, "past_due", False):
        logging.warning(f"[{timestamp}] O timer foi atrasado!")


def _get_canva_credentials() -> Tuple[str, str]:
    """Recupera as credenciais do Canva das variaveis de ambiente."""
    email = os.environ.get("CANVA_EMAIL")
    password = os.environ.get("CANVA_PASSWORD")

    if not email or not password:
        raise RuntimeError(
            "Credenciais do Canva nao encontradas. Configure CANVA_EMAIL e CANVA_PASSWORD "
            "no local.settings.json ou no Azure App Settings."
        )

    return email, password


def _load_schools_csv_content() -> Optional[str]:
    """Carrega o CSV com a base de escolas, permitindo override por variavel de ambiente."""
    env_path = os.environ.get(SCHOOLS_CSV_ENV)
    csv_path = Path(env_path).expanduser() if env_path else DEFAULT_SCHOOLS_FILE

    if env_path:
        logging.info(f"Usando caminho customizado para DadosEscolas.csv: {csv_path}")

    try:
        content = csv_path.read_text(encoding="utf-8")
        logging.info(f"Arquivo DadosEscolas.csv lido com sucesso de: {csv_path}")
        return content
    except FileNotFoundError:
        logging.warning(
            f"Arquivo DadosEscolas.csv nao encontrado em {csv_path}. "
            "O processador usara a base simulada."
        )
    except OSError as error:
        logging.error(f"Erro ao ler DadosEscolas.csv em {csv_path}: {error}")

    return None


def _persist_sync_outputs(integrated_data: dict, markdown_report: str) -> None:
    """Salva o relatorio Markdown e os dados integrados em disco."""
    try:
        REPORT_FILE.write_text(markdown_report, encoding="utf-8")
        logging.info(f"Relatorio Markdown salvo em: {REPORT_FILE}")

        with INTEGRATED_DATA_FILE.open("w", encoding="utf-8") as f_json:
            json.dump(integrated_data, f_json, indent=2, ensure_ascii=False)
        logging.info(f"Dados integrados (JSON) salvos em: {INTEGRATED_DATA_FILE}")
    except OSError as error:
        logging.error(f"Erro ao salvar a saida da sincronizacao: {error}")
        raise


def main(mytimer: func.TimerRequest) -> None:
    """
    Funcao Timer Trigger para sincronizar dados do Canva automaticamente.
    Configurado para rodar a cada 24 horas (Cron: '0 0 0 * * *').

    Args:
        mytimer: Objeto de requisicao do timer do Azure Functions
    """
    timestamp = datetime.now().isoformat()
    _warn_if_timer_past_due(mytimer, timestamp)

    logging.info(f"[{timestamp}] Iniciando a sincronizacao automatica de dados do Canva.")

    try:
        canva_email, canva_password = _get_canva_credentials()
        logging.info(f"Credenciais encontradas para: {canva_email}")

        collector = CanvaCollector(canva_email, canva_password, headless=True)

        logging.info("Iniciando coleta de dados do Canva...")
        canva_metrics = collector.run_sync_blocking()

        logging.info("Dados brutos do Canva coletados com sucesso.")
        logging.info(f"  - Total de usuarios encontrados: {len(canva_metrics.get('usuarios', []))}")

        logging.info("Iniciando processamento e alocacao de usuarios por escola...")
        schools_csv_content = _load_schools_csv_content()
        schools_df, domain_map_df = load_schools_data(schools_csv_content)

        integrated_data = integrate_canva_data(canva_metrics, schools_df, domain_map_df)

        logging.info("Dados processados e alocados com sucesso.")
        logging.info(f"  - Total de escolas na base: {len(integrated_data.get('schools_allocation', []))}")
        logging.info(f"  - Usuarios nao alocados: {integrated_data.get('unallocated_users_count', 0)}")

        logging.info("Gerando relatorio Markdown detalhado...")
        markdown_report = generate_markdown_report(integrated_data)

        _persist_sync_outputs(integrated_data, markdown_report)

        logging.info(f"[{timestamp}] Sincronizacao e processamento do Canva concluidos com sucesso.")
    except RuntimeError as error:
        logging.error(str(error))
        return
    except ImportError as error:
        logging.error(f"Erro de importacao: {error}")
        logging.error(
            "Certifique-se de que o Playwright esta instalado: pip install playwright && playwright install"
        )
    except Exception as error:
        logging.error(f"Erro durante a sincronizacao do Canva: {error}", exc_info=True)
        logging.error("Falha critica na sincronizacao. Notificacao de erro enviada.")
        raise
    finally:
        logging.info(f"[{timestamp}] Sincronizacao automatica finalizada.")
