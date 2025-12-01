/**
 * Exemplo de uso do apiClient para requisies HTTP
 *
 * Este arquivo demonstra como usar o novo cliente HTTP centralizado
 * em vez de fazer chamadas fetch diretas.
 */

import { apiGet, apiPost, apiPut, apiDelete } from "@/lib/apiClient";

// ========================================
// EXEMPLO 1: Fazer uma requisio GET
// ========================================

async function fetchUserData(userId: string) {
  const response = await apiGet(`/api/users/${userId}`);

  if (!response.ok) {
    console.error("Erro ao buscar usu?rio:", response.error);
    return null;
  }

  return response.data;
}

// ========================================
// EXEMPLO 2: Fazer uma requisio POST com retries automticos
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
    throw new Error(`Falha ao deletar usu?rio: ${response.error}`);
  }

  return true;
}

// ========================================
// BOAS PRTICAS
// ========================================

/**
 *  FAA:
 *
 * 1. Use o apiClient em vez de fetch direto
 * 2. Trate erros com tipos especficos (no use `any`)
 * 3. Use constantes para delays (DELAY_* do @/lib/constants)
 * 4. Remova console.log/error do cdigo de produo
 * 5. Use type safety com Zod ou interfaces TypeScript
 *
 *  NO FAA:
 *
 * 1. No faa fetch direto sem tratamento
 * 2. No use `any` para types de erro
 * 3. No use nmeros mgicos para delays
 * 4. No deixe console.log no cdigo produo
 * 5. No misture diferentes estilos de requisio
 */

export { fetchUserData, loginUser, updateSchool, deleteUser };
