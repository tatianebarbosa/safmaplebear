import sys
import os
import json

# Adicionar o diretório pai ao PATH para que as importações funcionem
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), ".")))

from shared.secure_auth import secure_auth
from shared.config import config

def run_tests():
    print("\n--- Testando SecureAuthService ---")

    # Teste 1: Login bem-sucedido
    print("\nTeste 1: Login bem-sucedido (admin@mbcentral.com.br, maplebear2025)")
    auth_result = secure_auth.authenticate_user("tatiane.barbosa", "maplebear2025")
    if auth_result.get("success"):
        print("  ✅ Login bem-sucedido!")
        user = auth_result["user"]
        token = secure_auth.generate_token(user["username"], user)
        print(f"  Usuário: {user['name']}, Função: {user['role']}")
        print(f"  Token JWT gerado: {token[:30]}...")
        
        # Teste 1.1: Verificação de token
        print("  Teste 1.1: Verificação de token")
        verified_payload = secure_auth.verify_token(token)
        if verified_payload and not verified_payload.get("error"):
            print(f"    ✅ Token verificado. Usuário: {verified_payload['sub']}")
        else:
            print(f"    ❌ Falha na verificação do token: {verified_payload.get('message') if verified_payload and isinstance(verified_payload, dict) else 'Erro desconhecido'}")
    else:
        print(f"  ❌ Falha no login: {auth_result.get('message')}")

    # Teste 2: Login com senha incorreta
    print("\nTeste 2: Login com senha incorreta")
    auth_result = secure_auth.authenticate_user("tatiane.barbosa", "senha_errada")
    if not auth_result.get("success"):
        print(f"  ✅ Falha no login esperada: {auth_result.get('message')}")
    else:
        print("  ❌ Login inesperado com senha incorreta.")

    # Teste 3: Login com usuário inexistente
    print("\nTeste 3: Login com usuário inexistente")
    auth_result = secure_auth.authenticate_user("usuario.inexistente", "qualquer_senha")
    if not auth_result.get("success"):
        print(f"  ✅ Falha no login esperada: {auth_result.get('message')}")
    else:
        print("  ❌ Login inesperado com usuário inexistente.")

    # Teste 4: Verificação de permissão
    print("\nTeste 4: Verificação de permissão")
    if secure_auth.check_permission("coordenadora", "agente"):
        print("  ✅ Coordenadora tem permissão de agente.")
    else:
        print("  ❌ Coordenadora não tem permissão de agente.")

    if not secure_auth.check_permission("agente", "coordenadora"):
        print("  ✅ Agente não tem permissão de coordenadora (esperado).")
    else:
        print("  ❌ Agente tem permissão de coordenadora (inesperado).")

    # Teste 5: Validação de domínio de e-mail
    print("\nTeste 5: Validação de domínio de e-mail")
    if secure_auth.validate_email_domain("teste@mbcentral.com.br"):
        print("  ✅ Domínio mbcentral.com.br é permitido.")
    else:
        print("  ❌ Domínio mbcentral.com.br não permitido.")

    if not secure_auth.validate_email_domain("teste@outrodominio.com"):
        print("  ✅ Domínio outrodominio.com não permitido (esperado).")
    else:
        print("  ❌ Domínio outrodominio.com permitido (inesperado).")

    print("\n--- Testes concluídos ---")

if __name__ == "__main__":
    run_tests()

