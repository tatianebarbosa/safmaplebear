/**
 * Utilitários para geração e download de arquivos (CSV, JSON, etc)
 * Centraliza lógica duplicada encontrada em múltiplos componentes
 */

// ============================================================================
// CONVERSÃO DE DADOS
// ============================================================================

/**
 * Converte array bidimensional em string CSV
 * @param data - Array de arrays representando linhas e colunas
 * @param delimiter - Delimitador a ser usado (padrão: ponto-e-vírgula)
 * @returns String no formato CSV
 * @example 
 * arrayToCSV([['Nome', 'Idade'], ['João', '30'], ['Maria', '25']])
 * // "Nome;Idade\nJoão;30\nMaria;25"
 */
export function arrayToCSV(data: string[][], delimiter: string = ';'): string {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return '';
  }
  
  return data
    .map(row => row.map(cell => sanitizeCSVCell(cell)).join(delimiter))
    .join('\n');
}

/**
 * Sanitiza uma célula para uso em CSV
 * @param cell - Conteúdo da célula
 * @returns Célula sanitizada e escapada
 * @example sanitizeCSVCell('Texto, com vírgula') // '"Texto, com vírgula"'
 */
export function sanitizeCSVCell(cell: string | number | boolean): string {
  if (cell === null || cell === undefined) {
    return '';
  }
  
  const cellStr = String(cell);
  
  // Se contém vírgula, ponto-e-vírgula, aspas ou quebra de linha, envolve em aspas
  if (cellStr.includes(',') || cellStr.includes(';') || cellStr.includes('"') || cellStr.includes('\n')) {
    // Escapa aspas duplicando-as
    return `"${cellStr.replace(/"/g, '""')}"`;
  }
  
  return cellStr;
}

/**
 * Sanitiza texto para uso seguro em CSV (substitui vírgulas)
 * @param text - Texto a ser sanitizado
 * @returns Texto com vírgulas substituídas por ponto-e-vírgula
 * @example sanitizeForCSV("Texto, com vírgula") // "Texto; com vírgula"
 */
export function sanitizeForCSV(text: string): string {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  return text.replace(/,/g, ';');
}

// ============================================================================
// DOWNLOAD DE ARQUIVOS
// ============================================================================

/**
 * Faz download de um arquivo CSV
 * @param data - Array bidimensional com os dados
 * @param filename - Nome do arquivo (sem extensão)
 * @param delimiter - Delimitador do CSV (padrão: ponto-e-vírgula)
 * @example 
 * downloadCSV([['Nome', 'Email'], ['João', 'joao@email.com']], 'usuarios')
 */
export function downloadCSV(
  data: string[][], 
  filename: string, 
  delimiter: string = ';'
): void {
  const csvContent = arrayToCSV(data, delimiter);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Faz download de um arquivo JSON
 * @param data - Objeto ou array a ser exportado
 * @param filename - Nome do arquivo (sem extensão)
 * @param pretty - Se true, formata o JSON com indentação
 * @example 
 * downloadJSON({ name: 'João', age: 30 }, 'usuario')
 */
export function downloadJSON(
  data: any, 
  filename: string, 
  pretty: boolean = true
): void {
  const jsonContent = pretty 
    ? JSON.stringify(data, null, 2) 
    : JSON.stringify(data);
  
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `${filename}.json`);
}

/**
 * Faz download de um arquivo de texto
 * @param content - Conteúdo do arquivo
 * @param filename - Nome do arquivo com extensão
 * @param mimeType - Tipo MIME do arquivo (padrão: text/plain)
 * @example 
 * downloadTextFile('Conteúdo do arquivo', 'documento.txt')
 */
export function downloadTextFile(
  content: string, 
  filename: string, 
  mimeType: string = 'text/plain'
): void {
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8;` });
  downloadBlob(blob, filename);
}

/**
 * Faz download de um Blob
 * @param blob - Blob a ser baixado
 * @param filename - Nome do arquivo com extensão
 * @example 
 * downloadBlob(new Blob(['conteúdo']), 'arquivo.txt')
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Limpa o URL temporário após um pequeno delay
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Faz download de um arquivo a partir de uma URL de dados (data URL)
 * @param dataUrl - URL de dados (data:...)
 * @param filename - Nome do arquivo com extensão
 * @example 
 * downloadFromDataURL('data:text/plain;base64,SGVsbG8=', 'arquivo.txt')
 */
export function downloadFromDataURL(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  
  link.href = dataUrl;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// ============================================================================
// UTILITÁRIOS DE NOME DE ARQUIVO
// ============================================================================

/**
 * Gera nome de arquivo com timestamp
 * @param prefix - Prefixo do nome do arquivo
 * @param extension - Extensão do arquivo (com ou sem ponto)
 * @returns Nome de arquivo com data
 * @example 
 * generateFilenameWithDate('relatorio', 'csv') 
 * // "relatorio-2025-11-14.csv"
 */
export function generateFilenameWithDate(prefix: string, extension: string): string {
  const date = new Date().toISOString().split('T')[0];
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return `${prefix}-${date}${ext}`;
}

/**
 * Gera nome de arquivo com timestamp completo
 * @param prefix - Prefixo do nome do arquivo
 * @param extension - Extensão do arquivo (com ou sem ponto)
 * @returns Nome de arquivo com data e hora
 * @example 
 * generateFilenameWithTimestamp('backup', 'json') 
 * // "backup-2025-11-14-153045.json"
 */
export function generateFilenameWithTimestamp(prefix: string, extension: string): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '');
  const ext = extension.startsWith('.') ? extension : `.${extension}`;
  return `${prefix}-${date}-${time}${ext}`;
}

/**
 * Sanitiza nome de arquivo removendo caracteres inválidos
 * @param filename - Nome do arquivo a ser sanitizado
 * @returns Nome de arquivo válido
 * @example 
 * sanitizeFilename('Relatório: 2025/11') 
 * // "Relatorio-2025-11"
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return 'arquivo';
  }
  
  return filename
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-zA-Z0-9-_\.]/g, '-') // Substitui caracteres inválidos por hífen
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens no início e fim
}

// ============================================================================
// LEITURA DE ARQUIVOS
// ============================================================================

/**
 * Lê arquivo como texto
 * @param file - Arquivo a ser lido
 * @returns Promise com o conteúdo do arquivo
 * @example 
 * const content = await readFileAsText(file);
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    
    reader.onerror = (e) => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * Lê arquivo como Data URL (base64)
 * @param file - Arquivo a ser lido
 * @returns Promise com a Data URL
 * @example 
 * const dataUrl = await readFileAsDataURL(file);
 */
export function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      resolve(e.target?.result as string);
    };
    
    reader.onerror = (e) => {
      reject(new Error('Erro ao ler arquivo'));
    };
    
    reader.readAsDataURL(file);
  });
}

/**
 * Lê arquivo CSV e converte para array bidimensional
 * @param file - Arquivo CSV a ser lido
 * @param delimiter - Delimitador usado no CSV (padrão: ponto-e-vírgula)
 * @returns Promise com array bidimensional
 * @example 
 * const data = await parseCSVFile(file);
 */
export async function parseCSVFile(
  file: File, 
  delimiter: string = ';'
): Promise<string[][]> {
  const content = await readFileAsText(file);
  
  return content
    .split('\n')
    .filter(line => line.trim())
    .map(line => line.split(delimiter).map(cell => cell.trim()));
}

// ============================================================================
// VALIDAÇÃO DE ARQUIVOS
// ============================================================================

/**
 * Valida tipo de arquivo
 * @param file - Arquivo a ser validado
 * @param allowedTypes - Array de tipos MIME permitidos
 * @returns true se o tipo é permitido
 * @example 
 * validateFileType(file, ['text/csv', 'application/csv'])
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Valida tamanho de arquivo
 * @param file - Arquivo a ser validado
 * @param maxSizeInMB - Tamanho máximo em MB
 * @returns true se o tamanho é permitido
 * @example 
 * validateFileSize(file, 5) // Máximo 5MB
 */
export function validateFileSize(file: File, maxSizeInMB: number): boolean {
  const maxSizeInBytes = maxSizeInMB * 1024 * 1024;
  return file.size <= maxSizeInBytes;
}

/**
 * Valida arquivo CSV
 * @param file - Arquivo a ser validado
 * @returns true se é um CSV válido
 * @example 
 * validateCSVFile(file)
 */
export function validateCSVFile(file: File): boolean {
  const validTypes = ['text/csv', 'application/csv', 'text/plain'];
  return validateFileType(file, validTypes) || file.name.endsWith('.csv');
}

/**
 * Valida arquivo JSON
 * @param file - Arquivo a ser validado
 * @returns true se é um JSON válido
 * @example 
 * validateJSONFile(file)
 */
export function validateJSONFile(file: File): boolean {
  const validTypes = ['application/json', 'text/json'];
  return validateFileType(file, validTypes) || file.name.endsWith('.json');
}
