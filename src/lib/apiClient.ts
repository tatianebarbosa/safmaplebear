/**
 * Cliente HTTP centralizado para todas as requisições da aplicação
 * Fornece tratamento consistente de erros, headers e retry logic
 */

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

const DEFAULT_TIMEOUT = 10000; // 10 segundos
const DEFAULT_RETRIES = 2;

/**
 * Realiza requisição HTTP com tratamento de erro e retry automático
 */
export async function apiCall<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<ApiResponse<T>> {
  const {
    timeout = DEFAULT_TIMEOUT,
    retries = DEFAULT_RETRIES,
    ...fetchOptions
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        return {
          ok: false,
          status: response.status,
          error: errorText || `HTTP ${response.status}`,
        };
      }

      const data = await response.json();
      return {
        ok: true,
        status: response.status,
        data,
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Não faz retry em erros de rede de cliente ou últimas tentativas
      if (attempt === retries || error instanceof TypeError) {
        break;
      }

      // Aguarda antes de tentar novamente (exponential backoff)
      const delay = Math.pow(2, attempt) * 100;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  return {
    ok: false,
    status: 0,
    error: lastError?.message || "Erro desconhecido na requisição",
  };
}

/**
 * Wrapper para GET com logging opcional
 */
export async function apiGet<T = unknown>(
  url: string,
  options?: FetchOptions
): Promise<ApiResponse<T>> {
  return apiCall<T>(url, {
    ...options,
    method: "GET",
  });
}

/**
 * Wrapper para POST com logging opcional
 */
export async function apiPost<T = unknown>(
  url: string,
  body?: unknown,
  options?: FetchOptions
): Promise<ApiResponse<T>> {
  return apiCall<T>(url, {
    ...options,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Wrapper para PUT com logging opcional
 */
export async function apiPut<T = unknown>(
  url: string,
  body?: unknown,
  options?: FetchOptions
): Promise<ApiResponse<T>> {
  return apiCall<T>(url, {
    ...options,
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * Wrapper para DELETE com logging opcional
 */
export async function apiDelete<T = unknown>(
  url: string,
  options?: FetchOptions
): Promise<ApiResponse<T>> {
  return apiCall<T>(url, {
    ...options,
    method: "DELETE",
  });
}
