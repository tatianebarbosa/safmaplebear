/**
 * Exemplo de uso do apiClient para requisições HTTP
 *
 * Este arquivo demonstra como usar o novo cliente HTTP centralizado
 * em vez de fazer chamadas fetch diretas.
 */

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/apiClient";

// ========================================
// EXEMPLO 1: Fazer uma requisição GET
// ========================================

async function fetchUserData(userId: string) {
  const response = await apiGet(`/api/users/${userId}`);

  if (!response.ok) {
    console.error("Erro ao buscar usuário:", response.error);
    return null;
  }

  return response.data;
}

// ========================================
// EXEMPLO 2: Fazer uma requisição POST com retries automáticos
// ========================================

interface LoginRequest {
  username: string;
  password: string;
}

async function loginUser(credentials: LoginRequest) {
  const response = await apiPost<{ token: string }>(
    "/api/auth/login",
    credentials,
    {
      retries: 3, // Tenta 3 vezes em caso de erro
      timeout: 15000, // 15 segundos de timeout
    }
  );

  if (!response.ok) {
    throw new Error(`Login falhou: ${response.error}`);
  }

  return response.data?.token;
}

// ========================================
// EXEMPLO 3: Usar com tratamento de erro consistente
// ========================================

async function updateSchool(schoolId: string, data: unknown) {
  const response = await apiPut(`/api/schools/${schoolId}`, data);

  if (!response.ok) {
    console.error("Erro ao atualizar escola:", response.error);
    return { success: false, error: response.error };
  }

  return { success: true, data: response.data };
}

// ========================================
// EXEMPLO 4: Deletar recurso
// ========================================

async function deleteUser(userId: string) {
  const response = await apiDelete(`/api/users/${userId}`);

  if (!response.ok) {
    throw new Error(`Falha ao deletar usuário: ${response.error}`);
  }

  return true;
}

// ========================================
// BOAS PRÁTICAS
// ========================================

/**
 * ✅ FAÇA:
 *
 * 1. Use o apiClient em vez de fetch direto
 * 2. Trate erros com tipos específicos (não use `any`)
 * 3. Use constantes para delays (DELAY_* do @/lib/constants)
 * 4. Remova console.log/error do código de produção
 * 5. Use type safety com Zod ou interfaces TypeScript
 *
 * ❌ NÃO FAÇA:
 *
 * 1. Não faça fetch direto sem tratamento
 * 2. Não use `any` para types de erro
 * 3. Não use números mágicos para delays
 * 4. Não deixe console.log no código produção
 * 5. Não misture diferentes estilos de requisição
 */

export { fetchUserData, loginUser, updateSchool, deleteUser };
