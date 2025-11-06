import Papa from 'papaparse';

interface SchoolData {
  [key: string]: any;
}

let cachedSchoolData: SchoolData[] = [];
let dataLoaded = false;

/**
 * Carrega os dados das escolas do arquivo CSV
 */
export const loadSchoolData = async (): Promise<SchoolData[]> => {
  if (dataLoaded && cachedSchoolData.length > 0) {
    return cachedSchoolData;
  }

  try {
    const response = await fetch('/data/dados_escolas_unificados.csv');
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => {
          cachedSchoolData = results.data;
          dataLoaded = true;
          resolve(results.data);
        },
        error: (error: any) => {
          reject(new Error(`Erro ao processar CSV: ${error.message}`));
        }
      });
    });
  } catch (error) {
    throw new Error(`Erro ao carregar dados das escolas: ${error}`);
  }
};

/**
 * Busca uma escola por nome
 */
export const searchSchoolByName = async (schoolName: string): Promise<SchoolData | null> => {
  const data = await loadSchoolData();
  return data.find(school => 
    school['Nome da Escola']?.toLowerCase().includes(schoolName.toLowerCase())
  ) || null;
};

/**
 * Busca escolas por estado
 */
export const searchSchoolsByState = async (state: string): Promise<SchoolData[]> => {
  const data = await loadSchoolData();
  return data.filter(school => 
    school['Estado da Escola']?.toUpperCase() === state.toUpperCase()
  );
};

/**
 * Busca escolas por cluster
 */
export const searchSchoolsByCluster = async (cluster: string): Promise<SchoolData[]> => {
  const data = await loadSchoolData();
  return data.filter(school => 
    school['Cluster']?.toLowerCase() === cluster.toLowerCase()
  );
};

/**
 * Busca escolas por status
 */
export const searchSchoolsByStatus = async (status: string): Promise<SchoolData[]> => {
  const data = await loadSchoolData();
  return data.filter(school => 
    school['Status da Escola']?.toLowerCase() === status.toLowerCase()
  );
};

/**
 * Gera um contexto textual com todos os dados das escolas para a IA
 */
export const generateSchoolContext = async (): Promise<string> => {
  const data = await loadSchoolData();
  
  const columns = [
    'ID da Escola', 'Nome da Escola', 'Carteira SAF', 'Status da Escola',
    'Tipo de Escola', 'CNPJ', 'Logradouro Escola', 'Bairro Escola',
    'CEP Escola', 'Cidade da Escola', 'Estado da Escola', 'Região da Escola',
    'Telefone de Contato da Escola', 'E-mail da Escola', 'Razão Social',
    'Nome Fantasia', 'Status CNPJ', 'Status Visita Liderança',
    'Performance da Meta', 'Atual Série', 'Avançando de Segmento',
    'Cluster', 'Ticket Médio', 'Toddle'
  ];

  let context = "Dados Oficiais das Escolas Maple Bear (Unificados):\n\n";
  
  // Cria uma tabela Markdown com os dados
  context += "| " + columns.join(" | ") + " |\n";
  context += "| " + columns.map(() => "---").join(" | ") + " |\n";
  
  data.forEach(school => {
    const row = columns.map(col => {
      const value = school[col] ?? 'N/A';
      return String(value).replace(/\|/g, '\\|'); // Escapa pipes para não quebrar a tabela
    });
    context += "| " + row.join(" | ") + " |\n";
  });

  return context;
};

/**
 * Formata os dados de uma escola para exibição
 */
export const formatSchoolData = (school: SchoolData): string => {
  if (!school) return "Escola não encontrada.";
  
  const fields = [
    'ID da Escola', 'Nome da Escola', 'Carteira SAF', 'Status da Escola',
    'Tipo de Escola', 'CNPJ', 'Logradouro Escola', 'Bairro Escola',
    'CEP Escola', 'Cidade da Escola', 'Estado da Escola', 'Região da Escola',
    'Telefone de Contato da Escola', 'E-mail da Escola', 'Razão Social',
    'Nome Fantasia', 'Status CNPJ', 'Status Visita Liderança',
    'Performance da Meta', 'Atual Série', 'Avançando de Segmento',
    'Cluster', 'Ticket Médio', 'Toddle'
  ];

  let formatted = "**Detalhes da Escola:**\n\n";
  
  fields.forEach(field => {
    const value = school[field] ?? 'N/A';
    formatted += `- **${field}:** ${value}\n`;
  });

  return formatted;
};
