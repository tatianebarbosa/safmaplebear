# Blob Storage utilities for CSV/JSON data persistence
import os
import json
import pandas as pd
from io import StringIO, BytesIO
from datetime import datetime
from typing import Dict, List, Optional, Any
from azure.storage.blob import BlobServiceClient, BlobClient

# Environment variables
BLOB_CONNECTION_STRING = os.environ.get('BLOB_CONNECTION_STRING', '')
CONTAINER_NAME = 'data'

class BlobStorageService:
    def __init__(self):
        self.blob_service_client = BlobServiceClient.from_connection_string(BLOB_CONNECTION_STRING) if BLOB_CONNECTION_STRING else None
    
    def _get_blob_client(self, blob_name: str) -> BlobClient:
        """Get blob client for a specific blob"""
        if not self.blob_service_client:
            raise Exception("Blob connection not configured")
        return self.blob_service_client.get_blob_client(container=CONTAINER_NAME, blob=blob_name)
    
    def read_excel_file(self, blob_name: str) -> pd.DataFrame:
        """Read Excel file from blob storage"""
        try:
            blob_client = self._get_blob_client(blob_name)
            blob_data = blob_client.download_blob().readall()
            
            # Read Excel file from bytes
            excel_file = BytesIO(blob_data)
            df = pd.read_excel(excel_file, engine='openpyxl')
            return df
            
        except Exception as e:
            # Fallback to local file for development
            local_path = f"local_data/{blob_name.replace('.xlsx', '_oficial.xlsx')}"
            if os.path.exists(local_path):
                return pd.read_excel(local_path)
            raise Exception(f"Erro ao ler arquivo {blob_name}: {str(e)}")
    
    def read_csv_file(self, blob_name: str, encoding='latin-1', delimiter=';') -> pd.DataFrame:
        """Read CSV file from blob storage"""
        try:
            blob_client = self._get_blob_client(blob_name)
            blob_data = blob_client.download_blob().readall()
            
            # Read CSV from bytes
            csv_content = blob_data.decode(encoding)
            df = pd.read_csv(StringIO(csv_content), delimiter=delimiter)
            return df
            
        except Exception as e:
            # Fallback to local file for development
            local_path = f"local_data/{blob_name}"
            if os.path.exists(local_path):
                return pd.read_csv(local_path, encoding=encoding, delimiter=delimiter)
            raise Exception(f"Erro ao ler arquivo {blob_name}: {str(e)}")
    
    def read_json_file(self, blob_name: str) -> Dict:
        """Read JSON file from blob storage"""
        try:
            blob_client = self._get_blob_client(blob_name)
            blob_data = blob_client.download_blob().readall()
            return json.loads(blob_data.decode('utf-8'))
            
        except Exception as e:
            # Return empty dict if file doesn't exist
            if "BlobNotFound" in str(e):
                return {}
            raise Exception(f"Erro ao ler JSON {blob_name}: {str(e)}")
    
    def write_json_file(self, blob_name: str, data: Dict):
        """Write JSON file to blob storage"""
        try:
            blob_client = self._get_blob_client(blob_name)
            json_data = json.dumps(data, ensure_ascii=False, indent=2)
            blob_client.upload_blob(json_data.encode('utf-8'), overwrite=True)
            
        except Exception as e:
            raise Exception(f"Erro ao escrever JSON {blob_name}: {str(e)}")
    
    def append_audit_log(self, log_entry: Dict):
        """Append audit log entry to monthly JSONL file"""
        try:
            # Format: audits/audit-YYYY-MM.jsonl
            now = datetime.utcnow()
            blob_name = f"audits/audit-{now.strftime('%Y-%m')}.jsonl"
            
            # Prepare log entry
            log_entry['ts'] = now.isoformat()
            log_line = json.dumps(log_entry, ensure_ascii=False) + '\n'
            
            # Try to get existing content
            existing_content = ""
            try:
                blob_client = self._get_blob_client(blob_name)
                existing_content = blob_client.download_blob().readall().decode('utf-8')
            except:
                pass  # File doesn't exist yet
            
            # Append new line
            new_content = existing_content + log_line
            
            # Upload updated content
            blob_client = self._get_blob_client(blob_name)
            blob_client.upload_blob(new_content.encode('utf-8'), overwrite=True)
            
        except Exception as e:
            print(f"Erro ao gravar auditoria: {str(e)}")  # Log but don't fail
    
    def read_audit_logs(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> List[Dict]:
        """Read audit logs from JSONL files"""
        try:
            logs = []
            
            # If no date range specified, get current month
            if not start_date:
                start_date = datetime.utcnow().strftime('%Y-%m-01')
            if not end_date:
                end_date = datetime.utcnow().strftime('%Y-%m-31')
            
            # Parse dates to determine which files to read
            start_dt = datetime.strptime(start_date[:7], '%Y-%m')
            end_dt = datetime.strptime(end_date[:7], '%Y-%m')
            
            # Read all relevant monthly files
            current_dt = start_dt
            while current_dt <= end_dt:
                blob_name = f"audits/audit-{current_dt.strftime('%Y-%m')}.jsonl"
                
                try:
                    blob_client = self._get_blob_client(blob_name)
                    content = blob_client.download_blob().readall().decode('utf-8')
                    
                    # Parse each line as JSON
                    for line in content.strip().split('\n'):
                        if line:
                            log_entry = json.loads(line)
                            # Filter by date range if specified
                            entry_date = log_entry.get('ts', '')[:10]
                            if start_date[:10] <= entry_date <= end_date[:10]:
                                logs.append(log_entry)
                                
                except Exception:
                    pass  # File might not exist for this month
                
                # Move to next month
                if current_dt.month == 12:
                    current_dt = current_dt.replace(year=current_dt.year + 1, month=1)
                else:
                    current_dt = current_dt.replace(month=current_dt.month + 1)
            
            # Sort by timestamp descending
            logs.sort(key=lambda x: x.get('ts', ''), reverse=True)
            return logs
            
        except Exception as e:
            print(f"Erro ao ler logs de auditoria: {str(e)}")
            return []

# Global instance
blob_service = BlobStorageService()