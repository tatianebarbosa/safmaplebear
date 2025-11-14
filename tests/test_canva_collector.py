import pytest
import asyncio
from unittest.mock import MagicMock, AsyncMock, patch
from playwright.async_api import TimeoutError as PlaywrightTimeoutError
from pathlib import Path

# Adiciona o diretório 'api' ao path para que as funções possam ser importadas
import sys
sys.path.append(str(Path(__file__).parent.parent / 'api'))

# Importa a classe a ser testada
from shared.canva_collector import CanvaCollector

# Mock para o Playwright
@pytest.fixture
def mock_playwright():
    """Mocka a inicialização do Playwright."""
    with patch('shared.canva_collector.async_playwright') as mock_async_playwright:
        # Configura o mock para retornar objetos que simulam o Playwright
        mock_page = AsyncMock(spec=MagicMock)
        mock_page.url = "https://www.canva.com/login" # URL inicial
        
        # Mocka o contexto do navegador
        mock_context = AsyncMock()
        mock_context.new_page = AsyncMock(return_value=mock_page)
        
        # Mocka o navegador
        mock_browser = AsyncMock()
        mock_browser.new_context = AsyncMock(return_value=mock_context)
        
        mock_chromium = MagicMock()
        mock_chromium.launch = AsyncMock(return_value=mock_browser)
        
        # Mocka o objeto retornado por async_playwright().start()
        mock_playwright_start = AsyncMock()
        mock_playwright_start.chromium = mock_chromium
        
        # Mocka async_playwright().start() para retornar o mock_playwright_start
        mock_async_playwright.return_value.start = AsyncMock(return_value=mock_playwright_start)
        
        yield mock_async_playwright

# Fixture para a instância do CanvaCollector
@pytest.fixture
def collector(mock_playwright):
    """Cria uma instância do CanvaCollector para testes."""
    return CanvaCollector(email="test@example.com", password="password123", headless=True)

# ==============================================================================
# Testes para _login (incluindo Retry Logic)
# ==============================================================================

@pytest.mark.asyncio
async def test_login_success(collector):
    """Testa o login bem-sucedido na primeira tentativa."""
    
    # Configura o mock da página para simular o fluxo de login
    # O objeto 'page' é criado dentro de _init_browser, então precisamos mockar o objeto que será atribuído a self.page
    mock_page = AsyncMock(spec_set=['goto', 'wait_for_url', 'wait_for_selector', 'url', 'click', 'fill', 'inner_text'])
    mock_page.goto = AsyncMock() # Adiciona o mock para goto
    mock_page.url = "https://www.canva.com/login" # URL inicial
    
    # Atribui o mock_page ao collector.page APÓS a chamada de _init_browser
    collector.page = mock_page
    
    # Simula a navegação para a página de sucesso após o clique final
    async def mock_wait_for_url(url_matcher, timeout):
        collector.page.url = "https://www.canva.com/home"
        # Simula o sucesso do login
        return True
    
    collector.page.wait_for_url.side_effect = mock_wait_for_url
    
    # Mocka os locators para simular o preenchimento e clique
    mock_email_field = AsyncMock()
    mock_password_field = AsyncMock()
    mock_submit_button = AsyncMock()
    
    # Mocka o wait_for_selector para retornar os elementos
    collector.page.wait_for_selector.side_effect = [
        mock_email_field,  # Encontra campo de email
        mock_password_field, # Encontra campo de senha
        mock_submit_button # Encontra botão de submit
    ]
    
    # Simula o login
    await collector._init_browser()
    result = await collector._login()
    
    assert result is True
    
    # Verifica se o login foi tentado apenas uma vez (sem retry)
    assert collector.page.goto.call_count == 1
    assert collector.page.wait_for_url.call_count == 1

@pytest.mark.asyncio
async def test_login_retry_success(collector):
    """Testa o login que falha na primeira tentativa (timeout) e tem sucesso na segunda."""
    
    # Configura o mock da página
    collector.page = AsyncMock(spec_set=['goto', 'wait_for_url', 'wait_for_selector', 'url', 'click', 'fill', 'inner_text'])
    collector.page.goto = AsyncMock() # Adiciona o mock para goto
    collector.page.url = "https://www.canva.com/login" # URL inicial
    
    # Simula a falha na primeira tentativa (TimeoutError) e sucesso na segunda
    collector.page.goto.side_effect = [
        PlaywrightTimeoutError("Timeout na primeira tentativa"), # 1ª tentativa falha
        None # 2ª tentativa (sucesso)
    ]
    
    # Simula a navegação para a página de sucesso após o clique final
    async def mock_wait_for_url_success(url_matcher, timeout):
        collector.page.url = "https://www.canva.com/home"
        return True
    
    collector.page.wait_for_url.side_effect = [
        PlaywrightTimeoutError("Timeout na primeira tentativa"), # Simula falha na 1ª tentativa
        mock_wait_for_url_success # Simula sucesso na 2ª tentativa
    ]
    
    # Mocka os locators para simular o preenchimento e clique
    mock_email_field = AsyncMock()
    mock_password_field = AsyncMock()
    mock_submit_button = AsyncMock()
    
    # Mocka o wait_for_selector para retornar os elementos
    collector.page.wait_for_selector.side_effect = [
        mock_email_field, mock_password_field, mock_submit_button, # 1ª tentativa
        mock_email_field, mock_password_field, mock_submit_button # 2ª tentativa
    ]
    
    # Simula o login
    await collector._init_browser()
    
    # O retry é gerenciado pelo decorator, então chamamos a função normalmente
    result = await collector._login()
    
    assert result is True
    
    # Verifica se o login foi tentado mais de uma vez
    # O goto é chamado dentro do try, então deve ser chamado 2 vezes
    assert collector.page.goto.call_count == 2

@pytest.mark.asyncio
async def test_login_failure_max_retries(collector):
    """Testa o login que falha após o número máximo de retries."""
    
    # Configura o mock da página
    collector.page = AsyncMock(spec_set=['goto', 'wait_for_url', 'wait_for_selector', 'url', 'click', 'fill', 'inner_text'])
    collector.page.goto = AsyncMock() # Adiciona o mock para goto
    collector.page.url = "https://www.canva.com/login" # URL inicial
    
    # Simula falha em todas as tentativas (3 vezes)
    collector.page.goto.side_effect = PlaywrightTimeoutError("Timeout em todas as tentativas")
    
    # Simula o login
    await collector._init_browser()
    
    # Espera que a exceção seja levantada após o max_retries
    with pytest.raises(PlaywrightTimeoutError):
        await collector._login()
    
    # Verifica se o login foi tentado o número máximo de vezes (3)
    assert collector.page.goto.call_count == 3

@pytest.mark.asyncio
async def test_login_failure_invalid_credentials(collector):
    """Testa o login que falha por credenciais inválidas (não deve fazer retry)."""
    
    # Configura o mock da página
    collector.page = AsyncMock(spec_set=['goto', 'wait_for_url', 'wait_for_selector', 'url', 'click', 'fill', 'inner_text'])
    collector.page.goto = AsyncMock() # Adiciona o mock para goto
    collector.page.url = "https://www.canva.com/login" # URL inicial
    
        # Simula a navegação para a página de login
    collector.page.goto.return_value = None
    
    # Simula a falha por credenciais inválidas (verificação dentro do _login)
    async def mock_wait_for_url_failure(url_matcher, timeout):
        # Simula que a URL permanece na página de login após o clique
        collector.page.url = "https://www.canva.com/login"
        raise Exception("Credenciais inválidas ou erro desconhecido na página de login.")
    
    collector.page.wait_for_url.side_effect = mock_wait_for_url_failure
    
    # Mocka os locators para simular o preenchimento e clique
    mock_email_field = AsyncMock()
    mock_password_field = AsyncMock()
    mock_submit_button = AsyncMock()
    
    # Mocka o wait_for_selector para retornar os elementos
    collector.page.wait_for_selector.side_effect = [
        mock_email_field, mock_password_field, mock_submit_button # 1ª tentativa
    ]
    
    # Simula o login
    await collector._init_browser()
    
    # Espera que a exceção seja levantada
    with pytest.raises(Exception) as excinfo:
        await collector._login()
    
    assert "Credenciais inválidas" in str(excinfo.value)
    
    # Verifica se o login foi tentado apenas uma vez
    assert collector.page.goto.call_count == 1
    
# ==============================================================================
# Testes para _init_browser e _close_browser
# ==============================================================================

@pytest.mark.asyncio
async def test_init_browser_success(collector):
    """Testa a inicialização bem-sucedida do navegador."""
    await collector._init_browser()
    
    assert collector.browser is not None
    assert collector.page is not None
    
    # Verifica se o playwright foi chamado
    assert collector.browser.new_context.call_count == 1
    assert collector.browser.new_context.return_value.new_page.call_count == 1

@pytest.mark.asyncio
async def test_close_browser_success(collector):
    """Testa o fechamento bem-sucedido do navegador."""
    await collector._init_browser()
    await collector._close_browser()
    
    # Verifica se o close foi chamado no browser
    assert collector.browser.close.call_count == 1

@pytest.mark.asyncio
async def test_close_browser_no_browser(collector):
    """Testa o fechamento quando o navegador não foi inicializado."""
    # Garante que não há exceção
    await collector._close_browser()
    # Não há como verificar o call_count do mock, mas garante que não quebra
    assert collector.browser is None
