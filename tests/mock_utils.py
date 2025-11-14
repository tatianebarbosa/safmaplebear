import json
import azure.functions as func
from unittest.mock import MagicMock

def create_mock_http_request(method='GET', url='/api/test', body=None, route_params=None):
    """Cria um objeto MagicMock que simula um azure.functions.HttpRequest."""
    
    mock_req = MagicMock(spec=func.HttpRequest)
    mock_req.method = method
    mock_req.url = url
    mock_req.route_params = route_params if route_params is not None else {}

    if body is not None:
        mock_req.get_json.return_value = body
    else:
        # Simula o comportamento de get_json() quando não há corpo
        mock_req.get_json.side_effect = ValueError("No JSON body provided")

    return mock_req

def create_mock_context():
    """Cria um objeto MagicMock que simula um azure.functions.Context."""
    mock_context = MagicMock(spec=func.Context)
    mock_context.function_name = "TestFunction"
    mock_context.function_directory = "/home/ubuntu/safmaplebear/api/test_function"
    return mock_context

def assert_http_response(response, status_code, expected_body=None):
    """Verifica se a resposta HTTP da Azure Function está correta."""
    assert isinstance(response, func.HttpResponse)
    assert response.status_code == status_code
    
    if expected_body is not None:
        # Decodifica o corpo da resposta
        response_body = response.get_body().decode('utf-8')
        
        # Se o corpo esperado for um dicionário, compara os JSONs
        if isinstance(expected_body, dict):
            assert json.loads(response_body) == expected_body
        # Se for uma string, compara as strings
        else:
            assert response_body == expected_body
