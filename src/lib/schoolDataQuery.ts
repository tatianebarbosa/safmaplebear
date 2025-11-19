import { loadFranchisingSchools } from '@/lib/safDataService';
import type { School as FranchisingSchool } from '@/types/safData';

interface SchoolData {
  [key: string]: any;
}

const SCHOOL_FIELDS = [
  'ID da Escola',
  'Nome da Escola',
  'Carteira SAF',
  'Status da Escola',
  'Tipo de Escola',
  'CNPJ',
  'Logradouro Escola',
  'Bairro Escola',
  'CEP Escola',
  'Cidade da Escola',
  'Estado da Escola',
  'Região da Escola',
  'Telefone de Contato da Escola',
  'E-mail da Escola',
  'Razão Social',
  'Nome Fantasia',
  'Status CNPJ',
  'Status Visita Liderança',
  'Performance da Meta',
  'Atual Série',
  'Avançando de Segmento',
  'Cluster',
  'Ticket Médio',
  'Toddle'
];

let cachedSchoolData: SchoolData[] = [];
let dataLoaded = false;

const buildSchoolRecord = (school: FranchisingSchool): SchoolData => ({
  'ID da Escola': school.id,
  'Nome da Escola': school.nome,
  'Carteira SAF': school.carteiraSaf,
  'Status da Escola': school.statusEscola,
  'Tipo de Escola': school.tipoEscola,
  'CNPJ': school.cnpj,
  'Logradouro Escola': school.logradouro,
  'Bairro Escola': school.bairro,
  'CEP Escola': school.cep,
  'Cidade da Escola': school.cidade,
  'Estado da Escola': school.estado,
  'Região da Escola': school.regiao,
  'Telefone de Contato da Escola': school.telefone || 'Não informado',
  'E-mail da Escola': school.email || 'Não informado',
  'Razão Social': school.razaoSocial,
  'Nome Fantasia': school.nomeFantasia,
  'Status CNPJ': school.statusCnpj,
  'Status Visita Liderança': school.statusVisitaLideranca || 'N/A',
  'Performance da Meta': school.performanceMeta || 'N/A',
  'Atual Série': school.atualSerie || 'N/A',
  'Avançando de Segmento': school.avancandoSegmento || 'N/A',
  'Cluster': school.cluster,
  'Ticket Médio': 'N/A',
  'Toddle': 'N/A'
});

export const loadSchoolData = async (): Promise<SchoolData[]> => {
  if (dataLoaded && cachedSchoolData.length > 0) {
    return cachedSchoolData;
  }

  try {
    const rawSchools = await loadFranchisingSchools();
    cachedSchoolData = rawSchools.map(buildSchoolRecord);
    dataLoaded = true;
    return cachedSchoolData;
  } catch (error) {
    throw new Error(`Erro ao carregar dados das escolas: ${error}`);
  }
};

export const searchSchoolByName = async (schoolName: string): Promise<SchoolData | null> => {
  const data = await loadSchoolData();
  return (
    data.find(school =>
      school['Nome da Escola']?.toLowerCase().includes(schoolName.toLowerCase())
    ) || null
  );
};

export const searchSchoolsByState = async (state: string): Promise<SchoolData[]> => {
  const data = await loadSchoolData();
  return data.filter(
    school => school['Estado da Escola']?.toUpperCase() === state.toUpperCase()
  );
};

export const searchSchoolsByCluster = async (cluster: string): Promise<SchoolData[]> => {
  const data = await loadSchoolData();
  return data.filter(
    school => school['Cluster']?.toLowerCase() === cluster.toLowerCase()
  );
};

export const searchSchoolsByStatus = async (status: string): Promise<SchoolData[]> => {
  const data = await loadSchoolData();
  return data.filter(
    school => school['Status da Escola']?.toLowerCase() === status.toLowerCase()
  );
};

export const generateSchoolContext = async (): Promise<string> => {
  const data = await loadSchoolData();

  let context = 'Dados Oficiais das Escolas Maple Bear (Unificados):\n\n';
  context += '| ' + SCHOOL_FIELDS.join(' | ') + ' |\n';
  context += '| ' + SCHOOL_FIELDS.map(() => '---').join(' | ') + ' |\n';

  data.forEach(school => {
    const row = SCHOOL_FIELDS.map(col => {
      const value = school[col] ?? 'N/A';
      return String(value).replace(/\|/g, '\\|');
    });
    context += '| ' + row.join(' | ') + ' |\n';
  });

  return context;
};

export const formatSchoolData = (school: SchoolData): string => {
  if (!school) return 'Escola não encontrada.';

  let formatted = '**Detalhes da Escola:**\n\n';
  SCHOOL_FIELDS.forEach(field => {
    const value = school[field] ?? 'N/A';
    formatted += `- **${field}:** ${value}\n`;
  });

  return formatted;
};
