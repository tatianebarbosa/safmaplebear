import DOMPurify from 'dompurify';

/**
 * Sanitiza HTML para prevenir XSS attacks
 * @param dirty - String HTML potencialmente perigosa
 * @returns String HTML sanitizada
 */
export const sanitizeHTML = (dirty: string): string => {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });
};

/**
 * Sanitiza input de texto removendo caracteres perigosos
 * @param input - String de entrada
 * @returns String sanitizada
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove tags HTML
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove caracteres de controle
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Trim e normaliza espaços
  sanitized = sanitized.trim().replace(/\s+/g, ' ');
  
  return sanitized;
};

/**
 * Sanitiza email
 * @param email - Email para sanitizar
 * @returns Email sanitizado ou string vazia se inválido
 */
export const sanitizeEmail = (email: string): string => {
  const sanitized = sanitizeInput(email).toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  return emailRegex.test(sanitized) ? sanitized : '';
};

/**
 * Sanitiza número de telefone
 * @param phone - Telefone para sanitizar
 * @returns Apenas dígitos
 */
export const sanitizePhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

/**
 * Sanitiza URL
 * @param url - URL para sanitizar
 * @returns URL sanitizada ou string vazia se inválida
 */
export const sanitizeURL = (url: string): string => {
  try {
    const sanitized = sanitizeInput(url);
    const urlObj = new URL(sanitized);
    
    // Apenas permite http e https
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return '';
    }
    
    return urlObj.toString();
  } catch {
    return '';
  }
};

/**
 * Sanitiza objeto recursivamente
 * @param obj - Objeto para sanitizar
 * @returns Objeto sanitizado
 */
export const sanitizeObject = <T extends Record<string, any>>(obj: T): T => {
  const sanitized = {} as T;
  
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeInput(value) as any;
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = sanitizeObject(value);
      } else if (Array.isArray(value)) {
        sanitized[key] = value.map((item: any) => 
          typeof item === 'string' ? sanitizeInput(item) : 
          typeof item === 'object' && item !== null ? sanitizeObject(item) : 
          item
        ) as any;
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
};

/**
 * Escapa caracteres especiais para uso em SQL (proteção adicional)
 * @param input - String de entrada
 * @returns String escapada
 */
export const escapeSQLInput = (input: string): string => {
  if (!input) return '';
  
  return input
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/\0/g, '\\0')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
};
