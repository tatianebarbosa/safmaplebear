"""
Canva Data Collector - Coletor Automático de Dados do Canva
============================================================

Este módulo implementa a coleta automática de dados do Relatório de Uso do Canva,
incluindo login, navegação, aplicação de filtros e extração de métricas detalhadas.

Autor: Sistema SAF Maple Bear
Data: 2025-11-13
"""

import logging
import asyncio
import json
import os
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict

try:
    from playwright.async_api import async_playwright, Page, Browser, TimeoutError as PlaywrightTimeoutError
except ImportError:
    logging.warning("Playwright não está instalado. Execute: pip install playwright && playwright install")
    async_playwright = None


@dataclass
class CanvaMetrics:
    """Estrutura de dados para métricas do Canva"""
    # Métricas principais
    designs_criados: int = 0
    designs_criados_crescimento: float = 0.0
    total_publicado: int = 0
    total_publicado_crescimento: float = 0.0
    total_compartilhado: int = 0
    total_compartilhado_crescimento: float = 0.0
    
    # Pessoas
    alunos: int = 0
    alunos_crescimento: float = 0.0
    professores: int = 0
    professores_crescimento: float = 0.0
    administradores: int = 0
    total_pessoas: int = 0
    
    # Modelos (tabela)
    modelos: List[Dict[str, Any]] = None
    
    # Metadados
    data_atualizacao: str = ""
    hora_atualizacao: str = ""
    timestamp: int = 0
    periodo_filtro: str = "Últimos 30 dias"
    
    def __post_init__(self):
        if self.modelos is None:
            self.modelos = []
        if not self.data_atualizacao:
            now = datetime.now()
            self.data_atualizacao = now.strftime("%d/%m/%Y")
            self.hora_atualizacao = now.strftime("%H:%M:%S")
            self.timestamp = int(now.timestamp() * 1000)
        # Calcula total de pessoas se não foi definido
        if self.total_pessoas == 0:
            self.total_pessoas = self.alunos + self.professores + self.administradores
    
    def to_dict(self) -> Dict:
        """Converte para dicionário"""
        return asdict(self)
    
    def to_json(self) -> str:
        """Converte para JSON"""
        return json.dumps(self.to_dict(), indent=2, ensure_ascii=False)


class CanvaCollector:
    """
    Classe responsável pela coleta automática de dados do Canva.
    Utiliza Playwright para automação de navegador.
    """
    
    # URLs do Canva
    CANVA_LOGIN_URL = "https://www.canva.com/login"
    CANVA_REPORTS_URL = "https://www.canva.com/settings/team-reports"
    CANVA_PEOPLE_URL = "https://www.canva.com/settings/people"
    
    # Timeouts (em milissegundos)
    TIMEOUT_NAVIGATION = 60000  # 60 segundos
    TIMEOUT_ELEMENT = 30000     # 30 segundos
    TIMEOUT_LOGIN = 90000       # 90 segundos (pode ter 2FA)
    
    # Filtros de período disponíveis no Canva
    FILTROS_PERIODO = [
        "12 meses",
        "6 meses",
        "3 meses",
        "Últimos 30 dias",
        "Últimos 14 dias",
        "Últimos 7 dias"
    ]
    
    def __init__(self, email: str, password: str, headless: bool = True, periodo_filtro: str = "Últimos 30 dias"):
        """
        Inicializa o coletor do Canva.
        
        Args:
            email: Email de login do Canva
            password: Senha de login do Canva
            headless: Se True, executa o navegador em modo headless (sem interface)
            periodo_filtro: Período do filtro ("12 meses", "6 meses", "3 meses", "Últimos 30 dias", "Últimos 14 dias", "Últimos 7 dias")
        """
        self.email = email
        self.password = password
        self.headless = headless
        self.periodo_filtro = periodo_filtro
        self.browser: Optional[Browser] = None
        self.page: Optional[Page] = None
        
        # Valida o filtro de período
        if periodo_filtro not in self.FILTROS_PERIODO:
            logging.warning(f"Filtro '{periodo_filtro}' não é válido. Usando 'Últimos 30 dias' como padrão.")
            self.periodo_filtro = "Últimos 30 dias"
        
        logging.info(f"CanvaCollector inicializado para o email: {email} com filtro: {self.periodo_filtro}")
    
    async def _init_browser(self):
        """Inicializa o navegador Playwright"""
        if async_playwright is None:
            raise ImportError(
                "Playwright não está instalado. "
                "Execute: pip install playwright && playwright install"
            )
        
        logging.info("Iniciando navegador...")
        playwright = await async_playwright().start()
        
        self.browser = await playwright.chromium.launch(
            headless=self.headless,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled'
            ]
        )
        
        # Cria contexto com user agent realista
        context = await self.browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport={'width': 1920, 'height': 1080},
            locale='pt-BR',
            timezone_id='America/Sao_Paulo'
        )
        
        self.page = await context.new_page()
        logging.info("Navegador iniciado com sucesso")
    
    async def _close_browser(self):
        """Fecha o navegador"""
        if self.browser:
            await self.browser.close()
            logging.info("Navegador fechado")
    
    async def _login(self) -> bool:
        """
        Realiza o login no Canva.
        
        Returns:
            True se o login foi bem-sucedido, False caso contrário
        """
        try:
            logging.info("Navegando para página de login...")
            await self.page.goto(self.CANVA_LOGIN_URL, wait_until='networkidle', timeout=self.TIMEOUT_NAVIGATION)
            
            # Aguarda e preenche o campo de email
            logging.info("Preenchendo email...")
            await self.page.wait_for_selector('input[type="email"]', timeout=self.TIMEOUT_ELEMENT)
            await self.page.fill('input[type="email"]', self.email)
            
            # Aguarda e preenche o campo de senha
            logging.info("Preenchendo senha...")
            await self.page.wait_for_selector('input[type="password"]', timeout=self.TIMEOUT_ELEMENT)
            await self.page.fill('input[type="password"]', self.password)
            
            # Clica no botão de login
            logging.info("Clicando no botão de login...")
            await self.page.click('button[type="submit"]')
            
            # Aguarda a navegação após o login
            logging.info("Aguardando conclusão do login...")
            try:
                await self.page.wait_for_url('**/home', timeout=self.TIMEOUT_LOGIN)
                logging.info("Login realizado com sucesso!")
                return True
            except PlaywrightTimeoutError:
                # Verifica se já está na página inicial (pode ter redirecionado)
                current_url = self.page.url
                if 'canva.com' in current_url and 'login' not in current_url:
                    logging.info("Login realizado com sucesso (redirecionamento alternativo)!")
                    return True
                else:
                    logging.error("Timeout ao aguardar conclusão do login. Pode ser necessário 2FA.")
                    return False
        
        except Exception as e:
            logging.error(f"Erro durante o login: {str(e)}")
            return False
    
    async def _apply_filter(self, filter_text: str = "Últimos 30 dias"):
        """
        Aplica o filtro de período no relatório.
        
        Args:
            filter_text: Texto do filtro a ser aplicado (ex: "Últimos 30 dias")
        """
        try:
            logging.info(f"Aplicando filtro: {filter_text}...")
            
            # Aguarda o dropdown de filtro estar visível (procura por qualquer botão de filtro)
            # Tenta diferentes seletores possíveis
            selectors = [
                'button:has-text("Últimos 30 dias")',
                'button:has-text("Últimos 14 dias")',
                'button:has-text("Últimos 7 dias")',
                'button:has-text("12 meses")',
                'button:has-text("6 meses")',
                'button:has-text("3 meses")',
                '[role="button"]:has-text("Últimos")',
                '[role="button"]:has-text("meses")'
            ]
            
            filter_button = None
            for selector in selectors:
                try:
                    filter_button = await self.page.wait_for_selector(selector, timeout=5000)
                    if filter_button:
                        logging.info(f"Botão de filtro encontrado com seletor: {selector}")
                        break
                except:
                    continue
            
            if not filter_button:
                logging.warning("Botão de filtro não encontrado, tentando localizar por texto genérico...")
                # Tenta clicar em qualquer elemento que contenha o texto do filtro atual
                await self.page.click('button[aria-haspopup="menu"]', timeout=self.TIMEOUT_ELEMENT)
            else:
                # Clica no dropdown
                await filter_button.click()
            
            # Aguarda o menu aparecer
            await asyncio.sleep(2)
            
            # Clica na opção desejada
            # Tenta diferentes formas de localizar a opção
            try:
                # Método 1: Texto exato
                await self.page.click(f'text="{filter_text}"', timeout=5000)
            except:
                try:
                    # Método 2: Contém texto
                    await self.page.click(f'text={filter_text}', timeout=5000)
                except:
                    # Método 3: Procura em itens de menu
                    await self.page.click(f'[role="menuitem"]:has-text("{filter_text}")', timeout=5000)
            
            # Aguarda a página recarregar com os novos dados
            logging.info("Aguardando atualização dos dados...")
            await asyncio.sleep(5)
            
            logging.info(f"Filtro '{filter_text}' aplicado com sucesso")
        
        except Exception as e:
            logging.warning(f"Erro ao aplicar filtro (pode já estar aplicado): {str(e)}")
    
    async def _extract_number_with_growth(self, page: Page, label: str) -> tuple[int, float]:
        """
        Extrai um número e sua porcentagem de crescimento.
        
        Args:
            page: Página do Playwright
            label: Label do elemento (ex: "Designs criados")
        
        Returns:
            Tupla (valor, crescimento_percentual)
        """
        try:
            # Procura pelo elemento que contém o label
            element = await page.query_selector(f'text="{label}"')
            if not element:
                logging.warning(f"Elemento '{label}' não encontrado")
                return 0, 0.0
            
            # Pega o container pai
            parent = await element.evaluate_handle('el => el.closest("div")')
            parent_text = await parent.inner_text()
            
            # Extrai o número principal (remove pontos de milhares)
            import re
            numbers = re.findall(r'(\d+(?:\.\d+)?)', parent_text.replace('.', ''))
            value = int(numbers[0]) if numbers else 0
            
            # Extrai a porcentagem de crescimento
            growth_match = re.search(r'↑\s*(\d+)%', parent_text)
            growth = float(growth_match.group(1)) if growth_match else 0.0
            
            # Verifica se é decrescimento
            if '↓' in parent_text:
                growth = -growth
            
            logging.info(f"{label}: {value} ({'+' if growth >= 0 else ''}{growth}%)")
            return value, growth
        
        except Exception as e:
            logging.error(f"Erro ao extrair '{label}': {str(e)}")
            return 0, 0.0
    
    async def _extract_table_data(self) -> List[Dict[str, Any]]:
        """
        Extrai os dados da tabela de modelos.
        
        Returns:
            Lista de dicionários com os dados da tabela
        """
        try:
            logging.info("Extraindo dados da tabela de modelos...")
            
            # Aguarda a tabela estar visível
            await self.page.wait_for_selector('table', timeout=self.TIMEOUT_ELEMENT)
            
            # Extrai os dados da tabela
            modelos = await self.page.evaluate('''() => {
                const rows = Array.from(document.querySelectorAll('table tbody tr'));
                return rows.map(row => {
                    const cells = Array.from(row.querySelectorAll('td'));
                    if (cells.length < 4) return null;
                    
                    return {
                        modelo: cells[0]?.textContent?.trim() || '',
                        titular: cells[1]?.textContent?.trim() || '',
                        usadas: parseInt(cells[2]?.textContent?.trim() || '0'),
                        publicado: parseInt(cells[3]?.textContent?.trim() || '0'),
                        compartilhado: parseInt(cells[4]?.textContent?.trim() || '0')
                    };
                }).filter(item => item !== null && item.modelo !== '');
            }''')
            
            logging.info(f"Extraídos {len(modelos)} modelos da tabela")
            return modelos
        
        except Exception as e:
            logging.error(f"Erro ao extrair dados da tabela: {str(e)}")
            return []
    
    async def _collect_report_data(self) -> CanvaMetrics:
        """
        Coleta os dados do Relatório de Uso.
        
        Returns:
            Objeto CanvaMetrics com os dados coletados
        """
        try:
            logging.info("Navegando para o Relatório de Uso...")
            await self.page.goto(self.CANVA_REPORTS_URL, wait_until='networkidle', timeout=self.TIMEOUT_NAVIGATION)
            
            # Aguarda a página carregar completamente
            await asyncio.sleep(3)
            
            # Aplica o filtro configurado
            await self._apply_filter(self.periodo_filtro)
            
            # Atualiza o período no objeto de métricas
            metrics.periodo_filtro = self.periodo_filtro
            
            # Extrai as métricas principais
            metrics = CanvaMetrics()
            metrics.periodo_filtro = self.periodo_filtro
            
            # Designs criados
            metrics.designs_criados, metrics.designs_criados_crescimento = \
                await self._extract_number_with_growth(self.page, "Designs criados")
            
            # Total publicado
            metrics.total_publicado, metrics.total_publicado_crescimento = \
                await self._extract_number_with_growth(self.page, "Total publicado")
            
            # Total compartilhado
            metrics.total_compartilhado, metrics.total_compartilhado_crescimento = \
                await self._extract_number_with_growth(self.page, "Total compartilhado")
            
            # Alunos
            metrics.alunos, metrics.alunos_crescimento = \
                await self._extract_number_with_growth(self.page, "Alunos")
            
            # Professores
            metrics.professores, metrics.professores_crescimento = \
                await self._extract_number_with_growth(self.page, "Professores")
            
            # Administradores (se disponível)
            try:
                metrics.administradores, _ = \
                    await self._extract_number_with_growth(self.page, "Administradores")
            except:
                pass
            
            # Extrai dados da tabela de modelos
            metrics.modelos = await self._extract_table_data()
            
            # Calcula total de pessoas
            metrics.total_pessoas = metrics.alunos + metrics.professores + metrics.administradores
            
            logging.info("Dados do relatório coletados com sucesso!")
            return metrics
        
        except Exception as e:
            logging.error(f"Erro ao coletar dados do relatório: {str(e)}")
            raise
    
    async def run_sync(self) -> Dict[str, Any]:
        """
        Executa o processo completo de sincronização:
        1. Inicializa o navegador
        2. Faz login no Canva
        3. Coleta os dados do Relatório de Uso
        4. Fecha o navegador
        
        Returns:
            Dicionário com os dados coletados
        """
        try:
            # Inicializa o navegador
            await self._init_browser()
            
            # Faz login
            login_success = await self._login()
            if not login_success:
                raise Exception("Falha no login do Canva")
            
            # Coleta os dados
            metrics = await self._collect_report_data()
            
            logging.info("Sincronização concluída com sucesso!")
            logging.info(f"Dados coletados:\n{metrics.to_json()}")
            
            return metrics.to_dict()
        
        except Exception as e:
            logging.error(f"Erro durante a sincronização: {str(e)}")
            raise
        
        finally:
            # Sempre fecha o navegador
            await self._close_browser()
    
    def run_sync_blocking(self) -> Dict[str, Any]:
        """
        Versão síncrona (bloqueante) do run_sync.
        Útil para chamadas de funções Azure que não suportam async.
        
        Returns:
            Dicionário com os dados coletados
        """
        return asyncio.run(self.run_sync())


# Função auxiliar para uso direto
async def collect_canva_data(email: str, password: str, headless: bool = True, periodo_filtro: str = "Últimos 30 dias") -> Dict[str, Any]:
    """
    Função auxiliar para coletar dados do Canva.
    
    Args:
        email: Email de login do Canva
        password: Senha de login do Canva
        headless: Se True, executa o navegador em modo headless
        periodo_filtro: Período do filtro ("12 meses", "6 meses", "3 meses", "Últimos 30 dias", "Últimos 14 dias", "Últimos 7 dias")
    
    Returns:
        Dicionário com os dados coletados
    """
    collector = CanvaCollector(email, password, headless, periodo_filtro)
    return await collector.run_sync()


def collect_canva_data_sync(email: str, password: str, headless: bool = True, periodo_filtro: str = "Últimos 30 dias") -> Dict[str, Any]:
    """
    Versão síncrona da função de coleta de dados.
    
    Args:
        email: Email de login do Canva
        password: Senha de login do Canva
        headless: Se True, executa o navegador em modo headless
        periodo_filtro: Período do filtro ("12 meses", "6 meses", "3 meses", "Últimos 30 dias", "Últimos 14 dias", "Últimos 7 dias")
    
    Returns:
        Dicionário com os dados coletados
    """
    return asyncio.run(collect_canva_data(email, password, headless, periodo_filtro))


# Exemplo de uso
if __name__ == "__main__":
    # Configura logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )
    
    # Credenciais (em produção, usar variáveis de ambiente)
    CANVA_EMAIL = os.getenv("CANVA_EMAIL", "tatianebarbosa20166@gmail.com")
    CANVA_PASSWORD = os.getenv("CANVA_PASSWORD", "Tati2025@")
    
    # Executa a coleta para todos os períodos
    periodos = CanvaCollector.FILTROS_PERIODO
    
    print("\n" + "="*80)
    print("COLETOR DE DADOS DO CANVA - TESTE")
    print("="*80)
    print(f"\nPeríodos disponíveis: {', '.join(periodos)}\n")
    
    # Coleta dados para o período padrão (pode ser alterado)
    periodo_teste = os.getenv("CANVA_PERIODO", "Últimos 30 dias")
    
    try:
        print(f"Coletando dados para o período: {periodo_teste}...\n")
        data = collect_canva_data_sync(CANVA_EMAIL, CANVA_PASSWORD, headless=True, periodo_filtro=periodo_teste)
        
        print("\n" + "="*80)
        print(f"DADOS COLETADOS DO CANVA - {periodo_teste}")
        print("="*80)
        print(json.dumps(data, indent=2, ensure_ascii=False))
        
        print("\n" + "="*80)
        print("RESUMO")
        print("="*80)
        print(f"Período: {data.get('periodo_filtro', 'N/A')}")
        print(f"Designs criados: {data.get('designs_criados', 0)} ({data.get('designs_criados_crescimento', 0):+.1f}%)")
        print(f"Total publicado: {data.get('total_publicado', 0)} ({data.get('total_publicado_crescimento', 0):+.1f}%)")
        print(f"Total compartilhado: {data.get('total_compartilhado', 0)} ({data.get('total_compartilhado_crescimento', 0):+.1f}%)")
        print(f"Alunos: {data.get('alunos', 0)} ({data.get('alunos_crescimento', 0):+.1f}%)")
        print(f"Professores: {data.get('professores', 0)} ({data.get('professores_crescimento', 0):+.1f}%)")
        print(f"Total de pessoas: {data.get('total_pessoas', 0)}")
        print(f"Modelos coletados: {len(data.get('modelos', []))}")
        
    except Exception as e:
        logging.error(f"Erro ao executar coleta: {str(e)}")
