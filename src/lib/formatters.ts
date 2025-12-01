/**
 * Utilitrios de formatao para datas, moedas e nmeros
 * Centraliza lgica duplicada encontrada em mltiplos componentes
 */

// ============================================================================
// FORMATAO DE DATAS
// ============================================================================

/**
 * Formata uma data para o padro brasileiro (dd/MM/yyyy)
 * @param date - Data a ser formatada (Date, string ou timestamp)
 * @returns String formatada no padro brasileiro
 * @example formatDateBR(new Date()) // "14/11/2025"
 */
export function formatDateBR(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Data invlida';
  }
  
  return dateObj.toLocaleDateString('pt-BR');
}

/**
 * Formata uma data e hora para o padro brasileiro (dd/MM/yyyy HH:mm:ss)
 * @param date - Data a ser formatada (Date, string ou timestamp)
 * @returns String formatada com data e hora
 * @example formatDateTimeBR(new Date()) // "14/11/2025 15:30:45"
 */
export function formatDateTimeBR(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Data invlida';
  }
  
  return dateObj.toLocaleString('pt-BR');
}

/**
 * Formata uma data para o padro ISO (YYYY-MM-DD)
 * @param date - Data a ser formatada (Date, string ou timestamp)
 * @returns String formatada no padro ISO
 * @example formatDateISO(new Date()) // "2025-11-14"
 */
export function formatDateISO(date: Date | string | number = new Date()): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toISOString().split('T')[0];
}

/**
 * Formata uma data completa para ISO com timezone
 * @param date - Data a ser formatada (Date, string ou timestamp)
 * @returns String formatada no padro ISO completo
 * @example formatDateTimeISO(new Date()) // "2025-11-14T15:30:45.123Z"
 */
export function formatDateTimeISO(date: Date | string | number = new Date()): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toISOString();
}

/**
 * Formata uma data para uso em nomes de arquivo (YYYY-MM-DD)
 * @param date - Data a ser formatada (Date, string ou timestamp)
 * @returns String formatada para nome de arquivo
 * @example formatDateForFilename(new Date()) // "2025-11-14"
 */
export function formatDateForFilename(date: Date | string | number = new Date()): string {
  return formatDateISO(date);
}

/**
 * Formata uma data no formato curto (dd/MM)
 * @param date - Data a ser formatada (Date, string ou timestamp)
 * @returns String formatada no formato curto
 * @example formatDateShort(new Date()) // "14/11"
 */
export function formatDateShort(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Data invlida';
  }
  
  return dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

/**
 * Formata uma data e hora no formato curto (dd/MM/yyyy HH:mm)
 * @param date - Data a ser formatada (Date, string ou timestamp)
 * @returns String formatada no formato curto
 * @example formatDateTimeShort(new Date()) // "14/11/2025 15:30"
 */
export function formatDateTimeShort(date: Date | string | number): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' 
    ? new Date(date) 
    : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Data invlida';
  }
  
  return dateObj.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Cria uma data de expirao adicionando dias  data atual
 * @param days - Nmero de dias a adicionar
 * @returns String ISO da data de expirao
 * @example getExpiryDate(7) // Data daqui a 7 dias em formato ISO
 */
export function getExpiryDate(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

// ============================================================================
// FORMATAO DE MOEDA
// ============================================================================

/**
 * Formata um valor numrico para moeda brasileira (R$)
 * @param value - Valor numrico a ser formatado
 * @param decimals - Nmero de casas decimais (padro: 2)
 * @returns String formatada como moeda
 * @example formatCurrency(1234.56) // "R$ 1.234,56"
 */
export function formatCurrency(value: number, decimals: number = 2): string {
  if (isNaN(value)) {
    return 'R$ 0,00';
  }
  
  return `R$ ${value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`;
}

/**
 * Formata um valor numrico simples com casas decimais
 * @param value - Valor numrico a ser formatado
 * @param decimals - Nmero de casas decimais (padro: 2)
 * @returns String formatada com decimais
 * @example formatDecimal(1234.567, 2) // "1234.57"
 */
export function formatDecimal(value: number, decimals: number = 2): string {
  if (isNaN(value)) {
    return '0.00';
  }
  
  return value.toFixed(decimals);
}

/**
 * Formata um valor como percentual
 * @param value - Valor numrico (0-100)
 * @param decimals - Nmero de casas decimais (padro: 1)
 * @returns String formatada como percentual
 * @example formatPercentage(75.5) // "75,5%"
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (isNaN(value)) {
    return '0%';
  }
  
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}%`;
}

// ============================================================================
// FORMATAO DE NMEROS
// ============================================================================

/**
 * Formata um nmero com separadores de milhares
 * @param value - Valor numrico a ser formatado
 * @returns String formatada com separadores
 * @example formatNumber(1234567) // "1.234.567"
 */
export function formatNumber(value: number): string {
  if (isNaN(value)) {
    return '0';
  }
  
  return value.toLocaleString('pt-BR');
}

/**
 * Formata tamanho de arquivo em bytes para formato legvel
 * @param bytes - Tamanho em bytes
 * @param decimals - Nmero de casas decimais (padro: 2)
 * @returns String formatada com unidade apropriada
 * @example formatFileSize(1536000) // "1.46 MB"
 */
export function formatFileSize(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  if (isNaN(bytes)) return 'Tamanho invlido';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

// ============================================================================
// UTILITRIOS DE CONVERSO
// ============================================================================

/**
 * Converte string de moeda para nmero
 * @param currencyString - String de moeda (ex: "R$ 1.234,56")
 * @returns Valor numrico
 * @example parseCurrency("R$ 1.234,56") // 1234.56
 */
export function parseCurrency(currencyString: string): number {
  const cleaned = currencyString
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  
  return parseFloat(cleaned) || 0;
}

/**
 * Converte string de percentual para nmero
 * @param percentString - String de percentual (ex: "75,5%")
 * @returns Valor numrico
 * @example parsePercentage("75,5%") // 75.5
 */
export function parsePercentage(percentString: string): number {
  const cleaned = percentString
    .replace('%', '')
    .replace(',', '.');
  
  return parseFloat(cleaned) || 0;
}
