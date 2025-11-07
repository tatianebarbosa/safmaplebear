/**
 * Utilitários de autenticação e segurança
 */

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user_data';
const TOKEN_EXPIRY_KEY = 'token_expiry';

/**
 * Criptografa dados antes de armazenar (Base64 simples - para produção usar crypto real)
 */
const encrypt = (data: string): string => {
  try {
    return btoa(encodeURIComponent(data));
  } catch {
    return data;
  }
};

/**
 * Descriptografa dados
 */
const decrypt = (data: string): string => {
  try {
    return decodeURIComponent(atob(data));
  } catch {
    return data;
  }
};

/**
 * Salva token de autenticação de forma segura
 * @param token - Token JWT ou similar
 * @param expiresIn - Tempo de expiração em segundos (padrão: 24h)
 */
export const saveAuthToken = (token: string, expiresIn: number = 86400): void => {
  const encryptedToken = encrypt(token);
  const expiryTime = Date.now() + (expiresIn * 1000);
  
  sessionStorage.setItem(TOKEN_KEY, encryptedToken);
  sessionStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
};

/**
 * Recupera token de autenticação
 * @returns Token ou null se não existir ou expirado
 */
export const getAuthToken = (): string | null => {
  const encryptedToken = sessionStorage.getItem(TOKEN_KEY);
  const expiryTime = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!encryptedToken || !expiryTime) {
    return null;
  }
  
  // Verifica se token expirou
  if (Date.now() > parseInt(expiryTime, 10)) {
    clearAuthData();
    return null;
  }
  
  return decrypt(encryptedToken);
};

/**
 * Remove token de autenticação
 */
export const removeAuthToken = (): void => {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
};

/**
 * Salva dados do usuário de forma segura
 * @param userData - Dados do usuário (sem informações sensíveis)
 */
export const saveUserData = (userData: Record<string, any>): void => {
  const encryptedData = encrypt(JSON.stringify(userData));
  sessionStorage.setItem(USER_KEY, encryptedData);
};

/**
 * Recupera dados do usuário
 * @returns Dados do usuário ou null
 */
export const getUserData = (): Record<string, any> | null => {
  const encryptedData = sessionStorage.getItem(USER_KEY);
  
  if (!encryptedData) {
    return null;
  }
  
  try {
    const decryptedData = decrypt(encryptedData);
    return JSON.parse(decryptedData);
  } catch {
    return null;
  }
};

/**
 * Remove dados do usuário
 */
export const removeUserData = (): void => {
  sessionStorage.removeItem(USER_KEY);
};

/**
 * Limpa todos os dados de autenticação
 */
export const clearAuthData = (): void => {
  removeAuthToken();
  removeUserData();
  sessionStorage.clear();
};

/**
 * Verifica se usuário está autenticado
 * @returns true se autenticado e token válido
 */
export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  return token !== null;
};

/**
 * Verifica se token está próximo de expirar (menos de 5 minutos)
 * @returns true se token vai expirar em breve
 */
export const isTokenExpiringSoon = (): boolean => {
  const expiryTime = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  
  if (!expiryTime) {
    return true;
  }
  
  const timeUntilExpiry = parseInt(expiryTime, 10) - Date.now();
  const fiveMinutes = 5 * 60 * 1000;
  
  return timeUntilExpiry < fiveMinutes;
};

/**
 * Decodifica JWT token (sem validação de assinatura)
 * @param token - Token JWT
 * @returns Payload do token ou null
 */
export const decodeJWT = (token: string): Record<string, any> | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

/**
 * Verifica se usuário tem permissão específica
 * @param permission - Nome da permissão
 * @returns true se usuário tem a permissão
 */
export const hasPermission = (permission: string): boolean => {
  const userData = getUserData();
  
  if (!userData || !userData.permissions) {
    return false;
  }
  
  return userData.permissions.includes(permission);
};

/**
 * Verifica se usuário tem role específico
 * @param role - Nome do role
 * @returns true se usuário tem o role
 */
export const hasRole = (role: string): boolean => {
  const userData = getUserData();
  
  if (!userData || !userData.role) {
    return false;
  }
  
  return userData.role === role || userData.roles?.includes(role);
};

/**
 * Gera header de autorização para requisições
 * @returns Header Authorization ou null
 */
export const getAuthHeader = (): Record<string, string> | null => {
  const token = getAuthToken();
  
  if (!token) {
    return null;
  }
  
  return {
    'Authorization': `Bearer ${token}`,
  };
};

/**
 * Valida força de senha
 * @param password - Senha para validar
 * @returns Objeto com resultado e mensagem
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  message: string;
} => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  let message = '';
  
  if (password.length < minLength) {
    message = `Senha deve ter no mínimo ${minLength} caracteres`;
    return { isValid: false, strength, message };
  }
  
  const criteriasMet = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (criteriasMet < 2) {
    strength = 'weak';
    message = 'Senha fraca. Adicione letras maiúsculas, minúsculas, números e caracteres especiais';
    return { isValid: false, strength, message };
  } else if (criteriasMet === 2 || criteriasMet === 3) {
    strength = 'medium';
    message = 'Senha média. Considere adicionar mais variedade de caracteres';
    return { isValid: true, strength, message };
  } else {
    strength = 'strong';
    message = 'Senha forte';
    return { isValid: true, strength, message };
  }
};
