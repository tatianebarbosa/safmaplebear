import azure.functions as func
import json
import csv
from io import StringIO
from ..shared.auth import verify_token, check_permission
from ..shared.service import data_service

def main(req: func.HttpRequest) -> func.HttpResponse:
    """Audit log endpoint - GET /api/audit"""
    
    if req.method != 'GET':
        return func.HttpResponse(
            json.dumps({"success": False, "message": "Method not allowed"}),
            status_code=405,
            headers={"Content-Type": "application/json; charset=utf-8"}
        )
    
    try:
        # Verify authentication
        auth_header = req.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Token de autorização necessário"}),
                status_code=401,
                headers={"Content-Type": "application/json; charset=utf-8"}
            )
        
        token = auth_header[7:]  # Remove 'Bearer '
        payload = verify_token(token)
        if not payload:
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Token inválido ou expirado"}),
                status_code=401,
                headers={"Content-Type": "application/json; charset=utf-8"}
            )
        
        # Check permissions - only coordenadora can access audit logs
        user_role = payload.get('role', '')
        if not check_permission(user_role, 'coordenadora'):
            return func.HttpResponse(
                json.dumps({"success": False, "message": "Apenas coordenadoras podem acessar logs de auditoria"}),
                status_code=403,
                headers={"Content-Type": "application/json; charset=utf-8"}
            )
        
        # Get query parameters
        filters = {
            'start': req.params.get('start'),
            'end': req.params.get('end'),
            'schoolId': req.params.get('schoolId'),
            'action': req.params.get('action'),
            'actor': req.params.get('actor')
        }
        
        # Remove None values
        filters = {k: v for k, v in filters.items() if v}
        
        # Check if CSV export is requested
        export_format = req.params.get('export')
        
        # Get audit logs
        logs = data_service.get_audit_logs(filters)
        
        if export_format == 'csv':
            # Return CSV format
            output = StringIO()
            if logs:
                # Get headers from first log entry
                headers = ['Data/Hora', 'Ação', 'Escola ID', 'Escola', 'Usuário', 'Detalhes']
                writer = csv.writer(output)
                writer.writerow(headers)
                
                for log in logs:
                    row = [
                        log.get('ts', ''),
                        log.get('action', ''),
                        log.get('school_id', ''),
                        log.get('school_name', ''),
                        log.get('actor', ''),
                        json.dumps(log.get('payload', {}), ensure_ascii=False)
                    ]
                    writer.writerow(row)
            
            csv_content = output.getvalue()
            output.close()
            
            return func.HttpResponse(
                csv_content,
                status_code=200,
                headers={
                    "Content-Type": "text/csv; charset=utf-8",
                    "Content-Disposition": "attachment; filename=auditoria.csv",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                }
            )
        else:
            # Return JSON format
            return func.HttpResponse(
                json.dumps(logs, ensure_ascii=False),
                status_code=200,
                headers={
                    "Content-Type": "application/json; charset=utf-8",
                    "Access-Control-Allow-Origin": "*",
                    "Access-Control-Allow-Methods": "GET, OPTIONS",
                    "Access-Control-Allow-Headers": "Content-Type, Authorization"
                }
            )
        
    except Exception as e:
        return func.HttpResponse(
            json.dumps({"success": False, "message": f"Erro interno: {str(e)}"}),
            status_code=500,
            headers={"Content-Type": "application/json; charset=utf-8"}
        )