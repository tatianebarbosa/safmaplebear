import os
import json
from azure.storage.blob import BlobServiceClient

class UnitDataService:
    def __init__(self, connection_string: str = None):
        self.connection_string = connection_string or os.environ.get("BLOB_CONNECTION_STRING")
        if not self.connection_string:
            raise ValueError("BLOB_CONNECTION_STRING não configurada.")
        self.container_name = "unit-data"
        self.blob_name = "units.json"
        self.blob_service_client = BlobServiceClient.from_connection_string(self.connection_string)
        self.container_client = self.blob_service_client.get_container_client(self.container_name)

    def _ensure_container_exists(self):
        try:
            self.container_client.create_container()
        except Exception as e:
            # Container already exists or other error
            pass

    def get_unit_data(self):
        self._ensure_container_exists()
        try:
            blob_client = self.container_client.get_blob_client(self.blob_name)
            download_stream = blob_client.download_blob()
            data = json.loads(download_stream.readall().decode("utf-8"))
            return data
        except Exception as e:
            print(f"Erro ao ler dados da unidade do Blob Storage: {e}")
            return {}

    def save_unit_data(self, data):
        self._ensure_container_exists()
        try:
            blob_client = self.container_client.get_blob_client(self.blob_name)
            blob_client.upload_blob(json.dumps(data).encode("utf-8"), overwrite=True)
            print("Dados da unidade salvos com sucesso no Blob Storage.")
        except Exception as e:
            print(f"Erro ao salvar dados da unidade no Blob Storage: {e}")

# A instância global será criada sem connection_string, esperando que ela venha do ambiente
unit_data_service = UnitDataService()


