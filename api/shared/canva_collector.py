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
        Realiza o login no Canva com tratamento avançado de erros.
        
        Returns:
            True se o login foi bem-sucedido, False caso contrário
            
        Raises:
            Exception: Se ocorrer um erro crítico durante o login
        """
        max_retries = 3
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                logging.info(f"Tentativa {retry_count + 1}/{max_retries}: Navegando para página de login...")
                
                # Navega para a página de login
                try:
                    await self.page.goto(self.CANVA_LOGIN_URL, wait_until='networkidle', timeout=self.TIMEOUT_NAVIGATION)
                except PlaywrightTimeoutError:
                    logging.warning("Timeout ao carregar página de login, tentando com wait_until='load'...")
                    await self.page.goto(self.CANVA_LOGIN_URL, wait_until='load', timeout=self.TIMEOUT_NAVIGATION)
                
                # Aguarda a página estar pronta
                await asyncio.sleep(2)
                
                # Verifica se já está logado
                current_url = self.page.url
                if 'canva.com' in current_url and 'login' not in current_url:
                    logging.info("Usuário já está logado!")
                    return True
                
                # Tenta encontrar e preencher o campo de email
                logging.info("Procurando campo de email...")
                email_selectors = [
                    'input[type="email"]',
                    'input[name="email"]',
                    'input[placeholder*="email" i]',
                    'input[id*="email" i]'
                ]
                
                email_field = None
                for selector in email_selectors:
                    try:
                        email_field = await self.page.wait_for_selector(selector, timeout=5000)
                        if email_field:
                            logging.info(f"Campo de email encontrado com seletor: {selector}")
                            break
                    except:
                        continue
                
                if not email_field:
                    raise Exception("Campo de email não encontrado na página")
                
                logging.info("Preenchendo email...")
                await email_field.fill(self.email)
                await asyncio.sleep(1)
                
                # Tenta encontrar e preencher o campo de senha
                logging.info("Procurando campo de senha...")
                password_selectors = [
                    'input[type="password"]',
                    'input[name="password"]',
                    'input[placeholder*="senha" i]',
                    'input[placeholder*="password" i]'
                ]
                
                password_field = None
                for selector in password_selectors:
                    try:
                        password_field = await self.page.wait_for_selector(selector, timeout=5000)
                        if password_field:
                            logging.info(f"Campo de senha encontrado com seletor: {selector}")
                            break
                    except:
                        continue
                
                if not password_field:
                    raise Exception("Campo de senha não encontrado na página")
                
                logging.info("Preenchendo senha...")
                await password_field.fill(self.password)
                await asyncio.sleep(1)
                
                # Tenta encontrar e clicar no botão de login
                logging.info("Procurando botão de login...")
                submit_selectors = [
                    'button[type="submit"]',
                    'button:has-text("Log in")',
                    'button:has-text("Entrar")',
                    'button:has-text("Login")',
                    'input[type="submit"]'
                ]
                
                submit_button = None
                for selector in submit_selectors:
                    try:
                        submit_button = await self.page.wait_for_selector(selector, timeout=5000)
                        if submit_button:
                            logging.info(f"Botão de login encontrado com seletor: {selector}")
                            break
                    except:
                        continue
                
                if not submit_button:
                    raise Exception("Botão de login não encontrado na página")
                
                logging.info("Clicando no botão de login...")
                await submit_button.click()
                
                # Aguarda a navegação após o login
                logging.info("Aguardando conclusão do login...")
                await asyncio.sleep(3)
                
                # Verifica se há solicitação de 2FA
                try:
                    two_fa_indicators = [
                        'text=two-factor',
                        'text=2FA',
                        'text=verification code',
                        'text=código de verificação',
                        'input[placeholder*="code" i]',
                        'input[placeholder*="código" i]'
                    ]
                    
                    for indicator in two_fa_indicators:
                        try:
                            element = await self.page.wait_for_selector(indicator, timeout=2000)
                            if element:
                                logging.error("Autenticação de dois fatores (2FA) detectada!")
                                logging.error("Por favor, desabilite 2FA temporariamente ou forneça o código manualmente.")
                                return False
                        except:
                            continue
                except:
                    pass
                
                # Verifica se há mensagem de erro
                try:
                    error_indicators = [
                        'text=incorrect',
                        'text=invalid',
                        'text=wrong',
                        'text=incorreto',
                        'text=inválido',
                        '[role="alert"]'
                    ]
                    
                    for indicator in error_indicators:
                        try:
                            element = await self.page.wait_for_selector(indicator, timeout=2000)
                            if element:
                                error_text = await element.inner_text()
                                logging.error(f"Erro de login detectado: {error_text}")
                                return False
                        except:
                            continue
                except:
                    pass
                
                # Verifica se o login foi bem-sucedido
                try:
                    await self.page.wait_for_url('**/home', timeout=self.TIMEOUT_LOGIN)
                    logging.info("✅ Login realizado com sucesso!")
                    return True
                except PlaywrightTimeoutError:
                    # Verifica URLs alternativas de sucesso
                    current_url = self.page.url
                    success_patterns = ['canva.com/home', 'canva.com/design', 'canva.com/folder']
                    
                    if any(pattern in current_url for pattern in success_patterns):
                        logging.info(f"✅ Login realizado com sucesso! URL atual: {current_url}")
                        return True
                    elif 'canva.com' in current_url and 'login' not in current_url:
                        logging.info(f"✅ Login realizado com sucesso (redirecionamento alternativo)! URL: {current_url}")
                        return True
                    else:
                        logging.warning(f"Login pode ter falhado. URL atual: {current_url}")
                        retry_count += 1
                        if retry_count < max_retries:
                            logging.info(f"Tentando novamente em 5 segundos...")
                            await asyncio.sleep(5)
                        continue
            
            except PlaywrightTimeoutError as e:
                logging.error(f"Timeout durante o login (tentativa {retry_count + 1}/{max_retries}): {str(e)}")
                retry_count += 1
                if retry_count < max_retries:
                    logging.info(f"Tentando novamente em 5 segundos...")
                    await asyncio.sleep(5)
                else:
                    logging.error("Número máximo de tentativas excedido.")
                    return False
            
            except Exception as e:
                logging.error(f"Erro durante o login (tentativa {retry_count + 1}/{max_retries}): {str(e)}")
                logging.error(f"Tipo do erro: {type(e).__name__}")
                import traceback
                logging.error(f"Traceback: {traceback.format_exc()}")
                retry_count += 1
                if retry_count < max_retries:
                    logging.info(f"Tentando novamente em 5 segundos...")
                    await asyncio.sleep(5)
                else:
                    logging.error("Número máximo de tentativas excedido.")
                    return False
        
        logging.error("Falha ao realizar login após todas as tentativas.")
        return False
    
    async def _apply_filter(self, filter_text: str = "Últimos 30 dias"):
        """
        Aplica o filtro de período no relatório com maior robustez.
        
        Args:
            filter_text: Texto do filtro a ser aplicado (ex: "Últimos 30 dias")
            
        Raises:
            Exception: Se o filtro não puder ser aplicado
        """
        try:
            logging.info(f"Aplicando filtro: {filter_text}...")
            
            # 1. Tenta encontrar o botão de filtro atual pelo texto (mais robusto)
            # Usa o texto do filtro atual como seletor inicial
            current_filter_text = await self.page.locator('button[aria-haspopup="menu"]').inner_text()
            if filter_text in current_filter_text:
                logging.info(f"Filtro '{filter_text}' já está aplicado.")
                return

            filter_button_selector = 'button[aria-haspopup="menu"]'
            
            try:
                # Tenta encontrar o botão que exibe o filtro atual
                await self.page.wait_for_selector(filter_button_selector, timeout=self.TIMEOUT_ELEMENT)
                await self.page.click(filter_button_selector)
            except PlaywrightTimeoutError:
                logging.error("Botão de filtro não encontrado.")
                raise Exception("Não foi possível encontrar o botão de filtro na página.")
            
            # 2. Aguarda o menu de opções aparecer
            await asyncio.sleep(1) # Pequena pausa para o menu renderizar
            
            # 3. Clica na opção desejada
            option_selector = f'[role="menuitem"]:has-text("{filter_text}")'
            
            try:
                await self.page.wait_for_selector(option_selector, timeout=self.TIMEOUT_ELEMENT)
                await self.page.click(option_selector)
            except PlaywrightTimeoutError:
                # Tenta seletor de texto simples
                await self.page.click(f'text="{filter_text}"', timeout=self.TIMEOUT_ELEMENT)
            
            # 4. Aguarda a página recarregar com os novos dados
            logging.info("Aguardando atualização dos dados...")
            # Espera por um indicador de carregamento ou por um tempo fixo
            await asyncio.sleep(5)
            
            logging.info(f"✅ Filtro '{filter_text}' aplicado com sucesso.")
        
        except Exception as e:
            logging.error(f"❌ Erro ao aplicar filtro '{filter_text}': {str(e)}")
            raise Exception(f"Falha ao aplicar filtro: {filter_text}")
    
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
            
            # Extrai o número principal (remove pontos de milhares e vírgulas)
            import re
            
            # Regex para encontrar o número principal (pode ter vírgula como separador decimal)
            # Tenta encontrar o número maior e mais proeminente (o valor da métrica)
            
            # 1. Limpa o texto para extração do valor
            # Remove o texto de crescimento para não confundir
            cleaned_text = re.sub(r'(\s*[\↑\↓]\s*[\d\.\,]+%)', '', parent_text)
            
            # Tenta encontrar o número principal, tratando separadores de milhar e decimal
            # Assume formato brasileiro/europeu (ponto para milhar, vírgula para decimal)
            
            # Remove separadores de milhar (ponto) e substitui vírgula por ponto decimal
            value_str = re.sub(r'\.', '', cleaned_text)
            value_str = re.sub(r',', '.', value_str)
            
            # Encontra o primeiro número inteiro ou decimal
            number_match = re.search(r'(\d+)', value_str)
            
            value = 0
            if number_match:
                try:
                    # Tenta converter para inteiro (a maioria das métricas do Canva é inteira)
                    value = int(number_match.group(1))
                except ValueError:
                    # Se falhar, tenta float (embora improvável para métricas principais)
                    try:
                        value = int(float(number_match.group(1)))
                    except:
                        logging.warning(f"Não foi possível converter o valor para '{label}'")
            
            # 2. Extrai a porcentagem de crescimento
            growth = 0.0
            growth_match = re.search(r'[\↑\↓]\s*([\d\.\,]+)%', parent_text)
            
            if growth_match:
                growth_str = growth_match.group(1).replace(',', '.')
                try:
                    growth = float(growth_str)
                except ValueError:
                    logging.warning(f"Não foi possível converter o crescimento para float em '{label}'")
            
            # 3. Verifica se é decrescimento
            if '↓' in parent_text:
                growth = -growth
            
            logging.info(f"✅ {label}: {value} ({'+' if growth >= 0 else ''}{growth}%)")
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
                    
                    // Verifica se a linha tem o número esperado de colunas (ajustar se necessário)
                    if (cells.length < 4) return null;
                    
                    // Assume a ordem: Nome, Tipo, Uso, Data
                    const nome = cells[0].innerText.trim();
                    const tipo = cells[1].innerText.trim();
                    
                    // Limpa o texto de uso (remove separadores de milhar e converte para inteiro)
                    const usoText = cells[2].innerText.trim().replace(/[\.\,]/g, '');
                    const uso = parseInt(usoText) || 0;
                    
                    const data = cells[3].innerText.trim();
                    
                    return {
                        nome: nome,
                        tipo: tipo,
                        uso: uso,
                        data: data
                    };
                }).filter(item => item !== null);
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
            
        Raises:
            Exception: Se houver falha na navegação ou extração.
        """
        try:
            logging.info("🧭 Navegando para o Relatório de Uso...")
            await self.page.goto(self.CANVA_REPORTS_URL, wait_until='networkidle', timeout=self.TIMEOUT_NAVIGATION)
            
            # Aguarda a página carregar completamente
            await asyncio.sleep(3)
            
            # Aplica o filtro configurado
            await self._apply_filter(self.periodo_filtro)
            
            # Extrai as métricas principais
            metrics = CanvaMetrics(periodo_filtro=self.periodo_filtro)
            
            logging.info("📊 Iniciando extração das métricas...")
            
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
            except Exception as e:
                logging.debug(f"Métrica 'Administradores' não encontrada ou erro: {e}")
                pass
            
            # Extrai dados da tabela de modelos
            metrics.modelos = await self._extract_table_data()
            
            # O cálculo de total_pessoas é feito no __post_init__ do CanvaMetrics
            
            logging.info("✅ Dados do relatório coletados com sucesso!")
            return metrics
        
        except Exception as e:
            logging.error(f"❌ Erro ao coletar dados do relatório: {type(e).__name__} - {str(e)}")
            raise
    
    async def run_sync(self) -> Dict[str, Any]:
        """
        Executa a sincronização completa:
        1. Inicializa o navegador
        2. Faz login no Canva
        3. Coleta os dados do Relatório de Uso
        4. Fecha o navegador
        
        Returns:
            Dicionário com os dados coletados
            
        Raises:
            Exception: Se ocorrer qualquer falha crítica durante a sincronização.
        """
        try:
            logging.info("🚀 Iniciando sincronização do Canva...")
            
            # 1. Inicializa o navegador
            await self._init_browser()
            
            # 2. Faz login
            login_success = await self._login()
            if not login_success:
                raise Exception("Falha no login do Canva. Verifique as credenciais e o 2FA.")
            
            # 3. Coleta os dados
            metrics = await self._collect_report_data()
            
            logging.info("✅ Sincronização concluída com sucesso!")
            logging.debug(f"Dados coletados:\n{metrics.to_json()}")
            
            return metrics.to_dict()
        
        except Exception as e:
            logging.error(f"❌ Erro crítico durante a sincronização: {type(e).__name__} - {str(e)}", exc_info=True)
            raise
        
        finally:
            # 4. Sempre fecha o navegador
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
