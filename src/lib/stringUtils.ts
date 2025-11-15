/**
 * Utilitários para manipulação de strings
 * Funções auxiliares para formatação, limpeza e transformação de texto
 */

// ============================================================================
// GERAÇÃO DE IDs
// ============================================================================

/**
 * Gera um ID único limpo (sem caracteres especiais)
 * @param prefix - Prefixo opcional para o ID
 * @returns ID único limpo
 * @example generateCleanId('user') // "user-abc123def456"
 */
export function generateCleanId(prefix?: string): string {
  const randomId = Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);
  
  const cleanId = randomId.replace(/[^a-z0-9]/g, '');
  
  return prefix ? `${prefix}-${cleanId}` : cleanId;
}

/**
 * Gera um ID baseado em timestamp
 * @param prefix - Prefixo opcional para o ID
 * @returns ID baseado em timestamp
 * @example generateTimestampId('ticket') // "ticket-1699999999999"
 */
export function generateTimestampId(prefix?: string): string {
  const timestamp = Date.now();
  return prefix ? `${prefix}-${timestamp}` : timestamp.toString();
}

/**
 * Gera um UUID v4 simplificado
 * @returns UUID v4 simplificado
 * @example generateUUID() // "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
 */
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================================
// FORMATAÇÃO DE TEXTO
// ============================================================================

/**
 * Converte texto para Title Case (primeira letra de cada palavra maiúscula)
 * @param text - Texto a ser convertido
 * @returns Texto em Title Case
 * @example toTitleCase("olá mundo") // "Olá Mundo"
 */
export function toTitleCase(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Converte texto para camelCase
 * @param text - Texto a ser convertido
 * @returns Texto em camelCase
 * @example toCamelCase("olá mundo") // "oláMundo"
 */
export function toCamelCase(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}

/**
 * Converte texto para kebab-case
 * @param text - Texto a ser convertido
 * @returns Texto em kebab-case
 * @example toKebabCase("Olá Mundo") // "olá-mundo"
 */
export function toKebabCase(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Converte texto para snake_case
 * @param text - Texto a ser convertido
 * @returns Texto em snake_case
 * @example toSnakeCase("Olá Mundo") // "olá_mundo"
 */
export function toSnakeCase(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

// ============================================================================
// LIMPEZA E SANITIZAÇÃO
// ============================================================================

/**
 * Remove acentos de uma string
 * @param text - Texto a ser processado
 * @returns Texto sem acentos
 * @example removeAccents("São Paulo") // "Sao Paulo"
 */
export function removeAccents(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Remove espaços extras de uma string
 * @param text - Texto a ser processado
 * @returns Texto sem espaços extras
 * @example removeExtraSpaces("Olá    mundo  ") // "Olá mundo"
 */
export function removeExtraSpaces(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Remove caracteres especiais de uma string
 * @param text - Texto a ser processado
 * @param keepSpaces - Se true, mantém espaços
 * @returns Texto sem caracteres especiais
 * @example removeSpecialChars("Olá, mundo!") // "Olamundo"
 */
export function removeSpecialChars(text: string, keepSpaces: boolean = false): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  const pattern = keepSpaces ? /[^a-zA-Z0-9\s]/g : /[^a-zA-Z0-9]/g;
  return text.replace(pattern, '');
}

/**
 * Limpa e normaliza uma string
 * @param text - Texto a ser limpo
 * @returns Texto limpo e normalizado
 * @example cleanString("  Olá,   Mundo!  ") // "Olá, Mundo!"
 */
export function cleanString(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return removeExtraSpaces(text);
}

// ============================================================================
// TRUNCAMENTO E LIMITAÇÃO
// ============================================================================

/**
 * Trunca uma string adicionando reticências
 * @param text - Texto a ser truncado
 * @param maxLength - Comprimento máximo
 * @param ellipsis - String de reticências (padrão: "...")
 * @returns Texto truncado
 * @example truncate("Texto muito longo", 10) // "Texto m..."
 */
export function truncate(text: string, maxLength: number, ellipsis: string = '...'): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  return text.substring(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Trunca uma string em uma palavra completa
 * @param text - Texto a ser truncado
 * @param maxLength - Comprimento máximo
 * @param ellipsis - String de reticências (padrão: "...")
 * @returns Texto truncado em palavra completa
 * @example truncateWords("Texto muito longo aqui", 15) // "Texto muito..."
 */
export function truncateWords(text: string, maxLength: number, ellipsis: string = '...'): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  if (text.length <= maxLength) {
    return text;
  }
  
  const truncated = text.substring(0, maxLength - ellipsis.length);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + ellipsis;
  }
  
  return truncated + ellipsis;
}

// ============================================================================
// VALIDAÇÃO E VERIFICAÇÃO
// ============================================================================

/**
 * Verifica se uma string está vazia ou contém apenas espaços
 * @param text - Texto a ser verificado
 * @returns true se vazio
 * @example isEmpty("   ") // true
 */
export function isEmpty(text: string | null | undefined): boolean {
  return !text || text.trim().length === 0;
}

/**
 * Verifica se uma string contém apenas números
 * @param text - Texto a ser verificado
 * @returns true se contém apenas números
 * @example isNumeric("12345") // true
 */
export function isNumeric(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  return /^\d+$/.test(text);
}

/**
 * Verifica se uma string contém apenas letras
 * @param text - Texto a ser verificado
 * @returns true se contém apenas letras
 * @example isAlpha("Texto") // true
 */
export function isAlpha(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  return /^[a-zA-Z]+$/.test(text);
}

/**
 * Verifica se uma string contém apenas letras e números
 * @param text - Texto a ser verificado
 * @returns true se contém apenas letras e números
 * @example isAlphanumeric("Texto123") // true
 */
export function isAlphanumeric(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false;
  }
  
  return /^[a-zA-Z0-9]+$/.test(text);
}

// ============================================================================
// EXTRAÇÃO E PARSING
// ============================================================================

/**
 * Extrai números de uma string
 * @param text - Texto do qual extrair números
 * @returns Array de números encontrados
 * @example extractNumbers("Tenho 2 gatos e 3 cachorros") // [2, 3]
 */
export function extractNumbers(text: string): number[] {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const matches = text.match(/\d+/g);
  return matches ? matches.map(Number) : [];
}

/**
 * Extrai URLs de uma string
 * @param text - Texto do qual extrair URLs
 * @returns Array de URLs encontradas
 * @example extractURLs("Visite https://exemplo.com") // ["https://exemplo.com"]
 */
export function extractURLs(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = text.match(urlRegex);
  return matches || [];
}

/**
 * Extrai emails de uma string
 * @param text - Texto do qual extrair emails
 * @returns Array de emails encontrados
 * @example extractEmails("Contato: joao@email.com") // ["joao@email.com"]
 */
export function extractEmails(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const emailRegex = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
  const matches = text.match(emailRegex);
  return matches || [];
}

// ============================================================================
// COMPARAÇÃO E SIMILARIDADE
// ============================================================================

/**
 * Calcula a distância de Levenshtein entre duas strings
 * @param str1 - Primeira string
 * @param str2 - Segunda string
 * @returns Distância de Levenshtein
 * @example levenshteinDistance("kitten", "sitting") // 3
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];
  
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Calcula a similaridade entre duas strings (0-1)
 * @param str1 - Primeira string
 * @param str2 - Segunda string
 * @returns Valor de similaridade entre 0 e 1
 * @example stringSimilarity("hello", "hallo") // 0.8
 */
export function stringSimilarity(str1: string, str2: string): number {
  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  const maxLength = Math.max(str1.length, str2.length);
  
  if (maxLength === 0) return 1;
  
  return 1 - distance / maxLength;
}

// ============================================================================
// MÁSCARAS E FORMATAÇÃO ESPECIAL
// ============================================================================

/**
 * Aplica máscara a uma string
 * @param value - Valor a ser mascarado
 * @param mask - Máscara a ser aplicada (# = número, A = letra, * = qualquer)
 * @returns Valor mascarado
 * @example applyMask("12345678900", "###.###.###-##") // "123.456.789-00"
 */
export function applyMask(value: string, mask: string): string {
  if (!value || !mask) return value;
  
  let result = '';
  let valueIndex = 0;
  
  for (let i = 0; i < mask.length && valueIndex < value.length; i++) {
    const maskChar = mask[i];
    const valueChar = value[valueIndex];
    
    if (maskChar === '#') {
      if (/\d/.test(valueChar)) {
        result += valueChar;
        valueIndex++;
      } else {
        valueIndex++;
        i--;
      }
    } else if (maskChar === 'A') {
      if (/[a-zA-Z]/.test(valueChar)) {
        result += valueChar;
        valueIndex++;
      } else {
        valueIndex++;
        i--;
      }
    } else if (maskChar === '*') {
      result += valueChar;
      valueIndex++;
    } else {
      result += maskChar;
    }
  }
  
  return result;
}

/**
 * Pluraliza uma palavra baseado em quantidade
 * @param count - Quantidade
 * @param singular - Forma singular
 * @param plural - Forma plural (opcional, adiciona 's' por padrão)
 * @returns Palavra pluralizada
 * @example pluralize(1, "item") // "item"
 * @example pluralize(2, "item") // "itens"
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  if (count === 1) {
    return singular;
  }
  
  return plural || `${singular}s`;
}
