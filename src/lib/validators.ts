/**
 * Utilitários de validação para email, CPF, domínios e compliance
 * Centraliza lógica duplicada encontrada em múltiplos componentes
 */

// ============================================================================
// CONFIGURAÇÕES DE DOMÍNIOS
// ============================================================================

/**
 * Lista de domínios corporativos permitidos
 */
export const ALLOWED_DOMAINS = [
  'mbcentral.com.br',
  'seb.com.br',
  'sebsa.com.br',
  'maplebear.com.br'
] as const;

/**
 * Lista de domínios compliance para Canva
 */
export const COMPLIANT_DOMAINS = [
  'maplebear.com.br',
  'seb.com.br',
  'sebsa.com.br'
] as const;

// ============================================================================
// VALIDAÇÃO DE EMAIL
// ============================================================================

/**
 * Valida o formato de um endereço de email
 * @param email - Email a ser validado
 * @returns true se o email é válido, false caso contrário
 * @example validateEmail("usuario@exemplo.com") // true
 * @example validateEmail("email-invalido") // false
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Extrai o domínio de um endereço de email
 * @param email - Email do qual extrair o domínio
 * @returns Domínio do email ou string vazia se inválido
 * @example getEmailDomain("usuario@exemplo.com") // "exemplo.com"
 */
export function getEmailDomain(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  const parts = email.toLowerCase().trim().split('@');
  return parts.length === 2 ? parts[1] : '';
}

/**
 * Extrai o nome de usuário de um endereço de email
 * @param email - Email do qual extrair o nome
 * @returns Nome de usuário do email
 * @example getEmailUsername("usuario@exemplo.com") // "usuario"
 */
export function getEmailUsername(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  const parts = email.trim().split('@');
  return parts.length >= 1 ? parts[0] : '';
}

/**
 * Verifica se um email pertence a um domínio permitido
 * @param email - Email a ser verificado
 * @returns true se o domínio é permitido, false caso contrário
 * @example isAllowedDomain("usuario@mbcentral.com.br") // true
 * @example isAllowedDomain("usuario@gmail.com") // false
 */
export function isAllowedDomain(email: string): boolean {
  if (!validateEmail(email)) {
    return false;
  }
  
  const domain = getEmailDomain(email);
  return ALLOWED_DOMAINS.some(allowedDomain => domain === allowedDomain);
}

/**
 * Verifica se um email está em compliance (domínios Maplebear/SEB)
 * @param email - Email a ser verificado
 * @returns true se o email está em compliance, false caso contrário
 * @example isCompliantEmail("usuario@maplebear.com.br") // true
 * @example isCompliantEmail("usuario@gmail.com") // false
 */
export function isCompliantEmail(email: string): boolean {
  if (!validateEmail(email)) {
    return false;
  }
  
  const domain = getEmailDomain(email);
  return COMPLIANT_DOMAINS.some(compliantDomain => domain === compliantDomain);
}

/**
 * Retorna a razão pela qual um email não está em compliance
 * @param email - Email a ser verificado
 * @returns Mensagem descrevendo o problema de compliance
 * @example getNonComplianceReason("usuario@gmail.com") 
 * // "Domínio não autorizado: gmail.com"
 */
export function getNonComplianceReason(email: string): string {
  if (!email || typeof email !== 'string') {
    return 'Email não fornecido';
  }
  
  if (!validateEmail(email)) {
    return 'Formato de email inválido';
  }
  
  const domain = getEmailDomain(email);
  
  if (!domain) {
    return 'Email inválido';
  }
  
  if (isCompliantEmail(email)) {
    return 'Email em compliance';
  }
  
  return `Domínio não autorizado: ${domain}`;
}

/**
 * Verifica se um email pertence ao domínio Maplebear
 * @param email - Email a ser verificado
 * @returns true se o email é @maplebear.com.br
 * @example isMaplebearEmail("usuario@maplebear.com.br") // true
 */
export function isMaplebearEmail(email: string): boolean {
  const domain = getEmailDomain(email);
  return domain === 'maplebear.com.br';
}

/**
 * Verifica se um email pertence aos domínios SEB
 * @param email - Email a ser verificado
 * @returns true se o email é @seb.com.br ou @sebsa.com.br
 * @example isSEBEmail("usuario@seb.com.br") // true
 */
export function isSEBEmail(email: string): boolean {
  const domain = getEmailDomain(email);
  return domain === 'seb.com.br' || domain === 'sebsa.com.br';
}

// ============================================================================
// VALIDAÇÃO DE CPF
// ============================================================================

/**
 * Remove caracteres não numéricos de uma string
 * @param value - String a ser limpa
 * @returns String contendo apenas números
 * @example cleanNumericString("123.456.789-00") // "12345678900"
 */
export function cleanNumericString(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }
  
  return value.replace(/[^0-9]/g, '');
}

/**
 * Valida um número de CPF
 * @param cpf - CPF a ser validado (com ou sem formatação)
 * @returns true se o CPF é válido, false caso contrário
 * @example validateCPF("123.456.789-00") // false (CPF inválido)
 * @example validateCPF("12345678900") // false (CPF inválido)
 */
export function validateCPF(cpf: string): boolean {
  if (!cpf || typeof cpf !== 'string') {
    return false;
  }
  
  // Remove caracteres não numéricos
  const cleanedCPF = cleanNumericString(cpf);
  
  // Verifica se tem 11 dígitos
  if (cleanedCPF.length !== 11) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanedCPF)) {
    return false;
  }
  
  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder;
  
  // Valida primeiro dígito
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanedCPF.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanedCPF.substring(9, 10))) return false;
  
  // Valida segundo dígito
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanedCPF.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanedCPF.substring(10, 11))) return false;
  
  return true;
}

/**
 * Formata um CPF com máscara
 * @param cpf - CPF a ser formatado (apenas números)
 * @returns CPF formatado (000.000.000-00)
 * @example formatCPF("12345678900") // "123.456.789-00"
 */
export function formatCPF(cpf: string): string {
  const cleaned = cleanNumericString(cpf);
  
  if (cleaned.length !== 11) {
    return cpf;
  }
  
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// ============================================================================
// VALIDAÇÃO DE CNPJ
// ============================================================================

/**
 * Valida um número de CNPJ
 * @param cnpj - CNPJ a ser validado (com ou sem formatação)
 * @returns true se o CNPJ é válido, false caso contrário
 * @example validateCNPJ("00.000.000/0000-00") // false (CNPJ inválido)
 */
export function validateCNPJ(cnpj: string): boolean {
  if (!cnpj || typeof cnpj !== 'string') {
    return false;
  }
  
  // Remove caracteres não numéricos
  const cleanedCNPJ = cleanNumericString(cnpj);
  
  // Verifica se tem 14 dígitos
  if (cleanedCNPJ.length !== 14) {
    return false;
  }
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cleanedCNPJ)) {
    return false;
  }
  
  // Validação dos dígitos verificadores
  let length = cleanedCNPJ.length - 2;
  let numbers = cleanedCNPJ.substring(0, length);
  const digits = cleanedCNPJ.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  // Valida primeiro dígito
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Valida segundo dígito
  length = length + 1;
  numbers = cleanedCNPJ.substring(0, length);
  sum = 0;
  pos = length - 7;
  
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(1))) return false;
  
  return true;
}

/**
 * Formata um CNPJ com máscara
 * @param cnpj - CNPJ a ser formatado (apenas números)
 * @returns CNPJ formatado (00.000.000/0000-00)
 * @example formatCNPJ("00000000000000") // "00.000.000/0000-00"
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cleanNumericString(cnpj);
  
  if (cleaned.length !== 14) {
    return cnpj;
  }
  
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

// ============================================================================
// VALIDAÇÃO DE TELEFONE
// ============================================================================

/**
 * Valida um número de telefone brasileiro
 * @param phone - Telefone a ser validado
 * @returns true se o telefone é válido, false caso contrário
 * @example validatePhone("(11) 98765-4321") // true
 * @example validatePhone("11987654321") // true
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  const cleaned = cleanNumericString(phone);
  
  // Aceita telefones com 10 (fixo) ou 11 (celular) dígitos
  return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Formata um número de telefone brasileiro
 * @param phone - Telefone a ser formatado
 * @returns Telefone formatado
 * @example formatPhone("11987654321") // "(11) 98765-4321"
 * @example formatPhone("1133334444") // "(11) 3333-4444"
 */
export function formatPhone(phone: string): string {
  const cleaned = cleanNumericString(phone);
  
  if (cleaned.length === 11) {
    // Celular: (00) 00000-0000
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    // Fixo: (00) 0000-0000
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}
