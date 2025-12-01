#!/usr/bin/env python3
"""
Mock Server para Desenvolvimento Local
Simula as respostas da API de autenticação
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import jwt
from datetime import datetime, timedelta

PORT = 8888
SECRET_KEY = 'dev-secret-key-2025'

# Credenciais válidas
VALID_CREDENTIALS = [
    {'username': 'admin', 'password': 'admin2025', 'role': 'admin'},
    {'username': 'saf@seb.com.br', 'password': 'saf2025', 'role': 'user'},
    {'username': 'coordenador@sebsa.com.br', 'password': 'coord2025', 'role': 'user'},
]


class AuthHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_POST(self):
        """Handle POST requests"""
        self.send_header('Access-Control-Allow-Origin', '*')
        
        if self.path == '/api/auth/login':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            
            try:
                data = json.loads(body)
                username = data.get('username', '').strip().lower()
                password = data.get('password', '')
                
                # Find matching user
                user = None
                for cred in VALID_CREDENTIALS:
                    if (cred['username'].lower() == username or 
                        cred['username'] == username) and cred['password'] == password:
                        user = cred
                        break
                
                if not user:
                    self.send_response(401)
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'success': False,
                        'message': 'Credenciais inválidas'
                    }).encode())
                    return
                
                # Generate JWT
                token = jwt.encode(
                    {
                        'id': user['username'],
                        'username': user['username'],
                        'role': user['role'],
                        'exp': datetime.utcnow() + timedelta(days=7)
                    },
                    SECRET_KEY,
                    algorithm='HS256'
                )
                
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'token': token,
                    'user': {
                        'id': user['username'],
                        'username': user['username'],
                        'role': user['role']
                    }
                }).encode())
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': False,
                    'message': 'Erro ao processar solicitação'
                }).encode())
        else:
            self.send_response(404)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'message': 'Rota não encontrada'
            }).encode())

    def log_message(self, format, *args):
        """Suppress default logging"""
        pass


if __name__ == '__main__':
    server = HTTPServer(('127.0.0.1', PORT), AuthHandler)
    print(f'🚀 Mock Server rodando em http://localhost:{PORT}')
    print('\n📚 Credenciais disponíveis:')
    print('  - admin / admin2025')
    print('  - saf@seb.com.br / saf2025')
    print('  - coordenador@sebsa.com.br / coord2025')
    print()
    server.serve_forever()
