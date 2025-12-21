#!/bin/bash

# Script de teste para o endpoint de justificativas
# Substitua as variáveis abaixo com seus valores reais

API_BASE_URL="https://seu-dominio.netlify.app/.netlify/functions"
API_TOKEN="seu_token_aqui"

echo "=== Testando Endpoint de Justificativas ==="
echo ""

# Teste 1: GET - Listar todas as justificativas
echo "1. Testando GET /justifications (listar todas)"
curl -X GET "${API_BASE_URL}/justifications" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# Teste 2: GET - Filtrar por escola
echo "2. Testando GET /justifications?school_id=1 (filtrar por escola)"
curl -X GET "${API_BASE_URL}/justifications?school_id=1" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

# Teste 3: POST - Criar nova justificativa
echo "3. Testando POST /justifications (criar nova)"
curl -X POST "${API_BASE_URL}/justifications" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": "1",
    "schoolName": "Escola Teste",
    "oldUser": {
      "name": "João Silva",
      "email": "joao@teste.com",
      "role": "Estudante"
    },
    "newUser": {
      "name": "Maria Santos",
      "email": "maria@teste.com",
      "role": "Professor"
    },
    "reason": "Troca de função - Teste de API",
    "performedBy": "Admin Teste"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Teste 4: POST - Erro de validação (campo faltando)
echo "4. Testando POST /justifications (erro de validação)"
curl -X POST "${API_BASE_URL}/justifications" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "schoolId": "1",
    "schoolName": "Escola Teste"
  }' \
  -w "\nStatus: %{http_code}\n\n"

# Teste 5: GET sem autenticação (deve retornar 401)
echo "5. Testando GET sem autenticação (deve retornar 401)"
curl -X GET "${API_BASE_URL}/justifications" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n\n"

echo "=== Testes concluídos ==="
