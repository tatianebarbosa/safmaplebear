import pytest
import json
import os
from unittest.mock import patch, MagicMock
from pathlib import Path

# Adiciona o diretório 'api' ao path para que as funções possam ser importadas
import sys
sys.path.append(str(Path(__file__).parent.parent / 'api'))

# Importa as funções a serem testadas
from canva_historico.__init__ import main as historico_main
from canva_registrar_alteracao.__init__ import main as registrar_main
from canva_reverter_alteracao.__init__ import main as reverter_main

# Importa utilitários de mock
from mock_utils import create_mock_http_request, assert_http_response

# Define o caminho do arquivo de histórico para os testes
TEST_HISTORY_PATH = Path(__file__).parent.parent / 'public' / 'data' / 'canva_history.json'

@pytest.fixture(scope="module", autouse=True)
def setup_teardown_history_file():
    """Fixture para garantir que o arquivo de histórico exista e seja limpo após os testes."""
    # Cria o diretório se não existir
    TEST_HISTORY_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    # Cria um arquivo de histórico inicial
    initial_data = [
        {
            "id": 1,
            "timestamp": "2025-11-10T00:00:00Z",
            "tipo": "Coleta Automática",
            "descricao": "Sincronização diária de dados do Canva",
            "usuario": "TimerSyncCanva",
            "status": "Sucesso",
            "metadados": {"periodo": "Últimos 30 dias", "usuarios_afetados": 824}
        }
    ]
    with open(TEST_HISTORY_PATH, 'w', encoding='utf-8') as f:
        json.dump(initial_data, f, ensure_ascii=False, indent=2)
    
    yield
    
    # Limpa o arquivo após os testes
    if TEST_HISTORY_PATH.exists():
        TEST_HISTORY_PATH.unlink()

# ==============================================================================
# Testes para GET /api/canva/historico
# ==============================================================================

def test_historico_get_success():
    """Testa a obtenção bem-sucedida do histórico."""
    req = create_mock_http_request(method='GET')
    response = historico_main(req)
    
    assert_http_response(response, 200)
    
    # Verifica se o corpo da resposta é uma lista com pelo menos 1 item
    body = json.loads(response.get_body().decode('utf-8'))
    assert isinstance(body, list)
    assert len(body) >= 1
    assert body[0]['id'] == 1

# ==============================================================================
# Testes para POST /api/canva/registrar-alteracao
# ==============================================================================

def test_registrar_alteracao_success():
    """Testa o registro bem-sucedido de uma nova alteração."""
    new_record_data = {
        "descricao": "Alteração de licença do usuário X",
        "usuario": "Admin Teste",
        "tipo": "Manual",
        "metadados": {"usuario_afetado": "x@maplebear.com.br"}
    }
    req = create_mock_http_request(method='POST', body=new_record_data)
    response = registrar_main(req)
    
    assert_http_response(response, 201)
    
    body = json.loads(response.get_body().decode('utf-8'))
    assert body['descricao'] == new_record_data['descricao']
    assert body['usuario'] == new_record_data['usuario']
    assert body['status'] == 'Registrado'
    
    # Verifica se o registro foi realmente adicionado ao arquivo
    with open(TEST_HISTORY_PATH, 'r', encoding='utf-8') as f:
        history = json.load(f)
    assert len(history) == 2 # O registro inicial + o novo
    assert history[-1]['descricao'] == new_record_data['descricao']

def test_registrar_alteracao_missing_fields():
    """Testa o registro com campos obrigatórios faltando."""
    req = create_mock_http_request(method='POST', body={"descricao": "apenas descricao"})
    response = registrar_main(req)
    
    assert_http_response(response, 400)
    body = json.loads(response.get_body().decode('utf-8'))
    assert body['error'] == 'Campos obrigatórios ausentes'

def test_registrar_alteracao_invalid_json():
    """Testa o registro com corpo da requisição inválido."""
    # Simula uma requisição sem corpo JSON
    req = create_mock_http_request(method='POST', body=None)
    response = registrar_main(req)
    
    assert_http_response(response, 400)
    body = json.loads(response.get_body().decode('utf-8'))
    assert body['error'] == 'Corpo da requisição inválido'

# ==============================================================================
# Testes para POST /api/canva/reverter-alteracao/{id}
# ==============================================================================

def test_reverter_alteracao_success():
    """Testa a reversão bem-sucedida de uma alteração."""
    # O registro com ID 1 é o inicial
    req = create_mock_http_request(method='POST', route_params={'id': '1'})
    response = reverter_main(req)
    
    assert_http_response(response, 200)
    
    body = json.loads(response.get_body().decode('utf-8'))
    assert body['id'] == 1
    assert body['status'] == 'Revertido'
    assert 'data_reversao' in body
    
    # Verifica se o status foi atualizado no arquivo
    with open(TEST_HISTORY_PATH, 'r', encoding='utf-8') as f:
        history = json.load(f)
    assert history[0]['status'] == 'Revertido'

def test_reverter_alteracao_not_found():
    """Testa a reversão de um ID que não existe."""
    req = create_mock_http_request(method='POST', route_params={'id': '999'})
    response = reverter_main(req)
    
    assert_http_response(response, 404)
    body = json.loads(response.get_body().decode('utf-8'))
    assert body['error'] == 'Registro não encontrado'

def test_reverter_alteracao_invalid_id():
    """Testa a reversão com um ID inválido."""
    req = create_mock_http_request(method='POST', route_params={'id': 'abc'})
    response = reverter_main(req)
    
    assert_http_response(response, 400)
    body = json.loads(response.get_body().decode('utf-8'))
    assert body['error'] == 'Parâmetro inválido'

def test_reverter_alteracao_missing_id():
    """Testa a reversão sem ID."""
    req = create_mock_http_request(method='POST', route_params={})
    response = reverter_main(req)
    
    assert_http_response(response, 400)
    body = json.loads(response.get_body().decode('utf-8'))
    assert body['error'] == 'Parâmetro ausente'
