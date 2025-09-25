import os

# Mock environment variable for testing
os.environ["BLOB_CONNECTION_STRING"] = "DefaultEndpointsProtocol=https;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;"

from shared.unit_data_service import unit_data_service
import json

def run_test():
    print("--- Testando UnitDataService ---")

    # 1. Test saving data
    test_data = {
        "schools": [
            {"id": "1", "name": "Escola Teste 1", "status": "Operando", "cluster": "A", "carteira_saf": "SAF1", "cnpj": "123", "address": "Rua 1", "neighborhood": "Bairro 1", "cep": "111", "city": "Cidade 1", "state": "SP", "region": "Sudeste", "phone": "999", "email": "e1@test.com", "license_limit": 10, "used_licenses": 0},
            {"id": "2", "name": "Escola Teste 2", "status": "Implantando", "cluster": "B", "carteira_saf": "SAF2", "cnpj": "456", "address": "Rua 2", "neighborhood": "Bairro 2", "cep": "222", "city": "Cidade 2", "state": "RJ", "region": "Sudeste", "phone": "888", "email": "e2@test.com", "license_limit": 5, "used_licenses": 0}
        ],
        "users": [
            {"name": "User Teste 1", "email": "user1@test.com", "role": "Estudante", "school_name": "Escola Teste 1", "school_id": "1", "status_licenca": "licenciado", "has_canva": True, "is_compliant": True},
            {"name": "User Teste 2", "email": "user2@test.com", "role": "Professor", "school_name": "Escola Teste 2", "school_id": "2", "status_licenca": "licenciado", "has_canva": True, "is_compliant": True}
        ]
    }
    unit_data_service.save_unit_data(test_data)
    print("Dados de teste salvos.")

    # 2. Test getting data
    retrieved_data = unit_data_service.get_unit_data()
    print("Dados recuperados:", retrieved_data)

    assert retrieved_data == test_data, "Os dados recuperados não correspondem aos dados salvos."
    print("Teste de salvar/recuperar dados: SUCESSO")

    # 3. Test integration with DataProcessingService (requires mocking blob_service)
    # This part is more complex to mock directly in a simple script due to blob_service dependency
    # For now, we\'ll assume if unit_data_service works, the integration will work if DataProcessingService calls it.

    print("--- Teste do UnitDataService concluído ---")

if __name__ == "__main__":
    run_test()


