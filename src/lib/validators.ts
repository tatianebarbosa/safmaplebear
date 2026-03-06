/**
 * Utilitrios de validao para email, CPF, domínios e compliance
 * Centraliza lgica duplicada encontrada em mltiplos componentes
 */

// ============================================================================
// CONFIGURAES DE DOMNIOS
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
  'mbcentral.com.br',
  'seb.com.br',
  'sebsa.com.br'
] as const;

const MAPLEBEAR_CORE_DOMAINS = ['maplebear.com.br', 'mbcentral.com.br'] as const;

const domainMatches = (domain: string, allowed: string): boolean => {
  return domain === allowed || domain.endsWith(`.${allowed}`);
};

const isCorporateDomain = (domain: string): boolean => {
  return COMPLIANT_DOMAINS.some(compliantDomain => domainMatches(domain, compliantDomain));
};

const isMapleBearDomain = (domain: string): boolean => {
  if (!domain) return false;
  return (
    MAPLEBEAR_CORE_DOMAINS.some(base => domainMatches(domain, base)) ||
    domain.includes('maplebear') ||
    domain.includes('mbcentral')
  );
};

const hasMapleBearSchoolIdentifier = (localPart: string): boolean => {
  const normalized = (localPart || '').toLowerCase();
  return /(?:^|[.\\-_])(maplebear|mb)[a-z0-9]{2,}/.test(normalized);
};

// ============================================================================
// VALIDAO DE EMAIL
// ============================================================================

/**
 * Valida o formato de um endereo de email
 * @param email - Email a ser validado
 * @returns true se o email  vlido, false caso contrrio
 * @example validateEmail("usuário@exemplo.com") // true
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
 * Extrai o domínio de um endereo de email
 * @param email - Email do qual extrair o domínio
 * @returns Domnio do email ou string vazia se invlido
 * @example getEmailDomain("usuário@exemplo.com") // "exemplo.com"
 */
export function getEmailDomain(email: string): string {
  if (!email || typeof email !== 'string') {
    return '';
  }
  
  const parts = email.toLowerCase().trim().split('@');
  return parts.length === 2 ? parts[1] : '';
}

/**
 * Extrai o nome de usuário de um endereo de email
 * @param email - Email do qual extrair o nome
 * @returns Nome de usuário do email
 * @example getEmailUsername("usuário@exemplo.com") // "usuário"
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
 * @returns true se o domínio  permitido, false caso contrrio
 * @example isAllowedDomain("usuário@mbcentral.com.br") // true
 * @example isAllowedDomain("usuário@gmail.com") // false
 */
export function isAllowedDomain(email: string): boolean {
  if (!validateEmail(email)) {
    return false;
  }
  
  const domain = getEmailDomain(email);
  return ALLOWED_DOMAINS.some(allowedDomain => domainMatches(domain, allowedDomain));
}

/**
 * Verifica se um email est em compliance (domínios Maplebear/SEB)
 * @param email - Email a ser verificado
 * @returns true se o email est em compliance, false caso contrrio
 * @example isCompliantEmail("usuário@maplebear.com.br") // true
 * @example isCompliantEmail("usuário@gmail.com") // false
 */
export function isCompliantEmail(email: string): boolean {
  if (!validateEmail(email)) {
    return false;
  }
  
  const domain = getEmailDomain(email);
  const localPart = getEmailUsername(email);

  if (!isCorporateDomain(domain)) {
    return false;
  }

  if (isMapleBearDomain(domain)) {
    return hasMapleBearSchoolIdentifier(localPart);
  }

  return true;
}

/**
 * Retorna a razo pela qual um email no est em compliance
 * @param email - Email a ser verificado
 * @returns Mensagem descrevendo o problema de compliance
 * @example getNonComplianceReason("usuário@gmail.com") 
 * // "Domnio no autorizado: gmail.com"
 */
export function getNonComplianceReason(email: string): string {
  if (!email || typeof email !== 'string') {
    return 'Email nÃ£o fornecido';
  }
  
  if (!validateEmail(email)) {
    return 'Formato de email invÃ¡lido';
  }
  
  const domain = getEmailDomain(email);
  const localPart = getEmailUsername(email);
  
  if (!domain) {
    return 'Email invÃ¡lido';
  }
  
  if (!isCorporateDomain(domain)) {
    return `DomÃ­nio nÃ£o autorizado: ${domain}`;
  }

  if (isMapleBearDomain(domain) && !hasMapleBearSchoolIdentifier(localPart)) {
    return 'Email deve conter "maplebear" ou "mb" e o nome da escola (ex: mbmogidascruzes)';
  }
  
  if (isCompliantEmail(email)) {
    return 'Email em compliance';
  }
  
  return 'Email fora da polÃ­tica';
}

/**
 * Verifica se um email pertence ao domínio Maplebear
 * @param email - Email a ser verificado
 * @returns true se o email  @maplebear.com.br
 * @example isMaplebearEmail("usuário@maplebear.com.br") // true
 */
export function isMaplebearEmail(email: string): boolean {
  const domain = getEmailDomain(email);
  return domainMatches(domain, 'maplebear.com.br');
}

/**
 * Verifica se um email pertence aos domínios SEB
 * @param email - Email a ser verificado
 * @returns true se o email  @seb.com.br ou @sebsa.com.br
 * @example isSEBEmail("usuário@seb.com.br") // true
 */
export function isSEBEmail(email: string): boolean {
  const domain = getEmailDomain(email);
  return domainMatches(domain, 'seb.com.br') || domainMatches(domain, 'sebsa.com.br');
}

// ============================================================================
// VALIDAO DE CPF
// ============================================================================

/**
 * Remove caracteres no numricos de uma string
 * @param value - String a ser limpa
 * @returns String contendo apenas nmeros
 * @example cleanNumericString("123.456.789-00") // "12345678900"
 */
export function cleanNumericString(value: string): string {
  if (!value || typeof value !== 'string') {
    return '';
  }
  
  return value.replace(/[^0-9]/g, '');
}

/**
 * Valida um nmero de CPF
 * @param cpf - CPF a ser validado (com ou sem formatao)
 * @returns true se o CPF  vlido, false caso contrrio
 * @example validateCPF("123.456.789-00") // false (CPF invlido)
 * @example validateCPF("12345678900") // false (CPF invlido)
 */
export function validateCPF(cpf: string): boolean {
  if (!cpf || typeof cpf !== 'string') {
    return false;
  }
  
  // Remove caracteres no numricos
  const cleanedCPF = cleanNumericString(cpf);
  
  // Verifica se tem 11 dgitos
  if (cleanedCPF.length !== 11) {
    return false;
  }
  
  // Verifica se todos os dgitos so iguais
  if (/^(\d)\1{10}$/.test(cleanedCPF)) {
    return false;
  }
  
  // Validao dos dgitos verificadores
  let sum = 0;
  let remainder;
  
  // Valida primeiro dgito
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanedCPF.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanedCPF.substring(9, 10))) return false;
  
  // Valida segundo dgito
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
 * Formata um CPF com mscara
 * @param cpf - CPF a ser formatado (apenas nmeros)
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
// VALIDAO DE CNPJ
// ============================================================================

/**
 * Valida um nmero de CNPJ
 * @param cnpj - CNPJ a ser validado (com ou sem formatao)
 * @returns true se o CNPJ  vlido, false caso contrrio
 * @example validateCNPJ("00.000.000/0000-00") // false (CNPJ invlido)
 */
export function validateCNPJ(cnpj: string): boolean {
  if (!cnpj || typeof cnpj !== 'string') {
    return false;
  }
  
  // Remove caracteres no numricos
  const cleanedCNPJ = cleanNumericString(cnpj);
  
  // Verifica se tem 14 dgitos
  if (cleanedCNPJ.length !== 14) {
    return false;
  }
  
  // Verifica se todos os dgitos so iguais
  if (/^(\d)\1{13}$/.test(cleanedCNPJ)) {
    return false;
  }
  
  // Validao dos dgitos verificadores
  let length = cleanedCNPJ.length - 2;
  let numbers = cleanedCNPJ.substring(0, length);
  const digits = cleanedCNPJ.substring(length);
  let sum = 0;
  let pos = length - 7;
  
  // Valida primeiro dgito
  for (let i = length; i >= 1; i--) {
    sum += parseInt(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }
  
  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;
  
  // Valida segundo dgito
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
 * Formata um CNPJ com mscara
 * @param cnpj - CNPJ a ser formatado (apenas nmeros)
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
// VALIDAO DE TELEFONE
// ============================================================================

/**
 * Valida um nmero de telefone brasileiro
 * @param phone - Telefone a ser validado
 * @returns true se o telefone  vlido, false caso contrrio
 * @example validatePhone("(11) 98765-4321") // true
 * @example validatePhone("11987654321") // true
 */
export function validatePhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') {
    return false;
  }
  
  const cleaned = cleanNumericString(phone);
  
  // Aceita telefones com 10 (fixo) ou 11 (celular) dgitos
  return cleaned.length === 10 || cleaned.length === 11;
}

/**
 * Formata um nmero de telefone brasileiro
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
