import { loadFranchisingSchools } from '@/lib/safDataService';
import { TEAM_MEMBERS } from '@/data/teamMembers';
import type { School as FranchisingSchool } from '@/types/safData';

export interface SchoolData {
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
  'Regio da Escola',
  'Telefone de Contato da Escola',
  'E-mail da Escola',
  'Razo Social',
  'Nome Fantasia',
  'Status CNPJ',
  'Status Visita Liderana',
  'Performance da Meta',
  'Atual Srie',
  'Avanando de Segmento',
  'Cluster',
  'Ticket Mdio',
  'Ultima Atualizacao',
  'Toddle'
];

const normalizeText = (value: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s.-]/gi, ' ')
    .toLowerCase()
    .trim();

const SCHOOL_STOP_WORDS = new Set([
  'quem',
  'qual',
  'quero',
  'saber',
  'time',
  'responsavel',
  'responsaveis',
  'carteira',
  'saf',
  'consultor',
  'consultora',
  'cluster',
  'escola',
  'unidade',
  'colegio',
  'maple',
  'bear',
  'da',
  'de',
  'do',
  'das',
  'dos',
  'qualquer',
  'queria'
]);

export type FieldIntent = {
  field: keyof SchoolData;
  label: string;
  keywords: string[];
};

const SCHOOL_FIELD_INTENTS: FieldIntent[] = [
  { field: 'E-mail da Escola', label: 'E-mail da escola', keywords: ['email', 'e-mail', 'contato'] },
  { field: 'CNPJ', label: 'CNPJ', keywords: ['cnpj'] },
  { field: 'Cluster', label: 'Cluster', keywords: ['cluster'] },
  { field: 'Carteira SAF', label: 'Responsavel SAF', keywords: ['carteira saf', 'responsavel saf', 'consultor saf'] },
  { field: 'Status da Escola', label: 'Status da escola', keywords: ['status da escola', 'status da unidade'] },
  { field: 'Telefone de Contato da Escola', label: 'Telefone', keywords: ['telefone', 'contato'] },
  { field: 'Razo Social', label: 'Razao social', keywords: ['razao social'] },
  { field: 'Nome Fantasia', label: 'Nome fantasia', keywords: ['nome fantasia'] },
  { field: 'Cidade da Escola', label: 'Cidade', keywords: ['cidade', 'municipio'] },
  { field: 'Estado da Escola', label: 'Estado', keywords: ['estado', 'uf'] },
  { field: 'Ticket Mdio', label: 'Ticket medio', keywords: ['ticket medio', 'ticket mdio'] },
];

const extractSchoolQuery = (message: string): string | null => {
  const nameMatch = message.match(
    /(?:escola|unidade|colegio|maple\s*bear)\s+([a-z0-9\s.-]+)/i
  );
  if (nameMatch?.[1]) {
    return nameMatch[1].trim();
  }

  const tokens = normalizeText(message)
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !SCHOOL_STOP_WORDS.has(token));

  if (!tokens.length) return null;

  return tokens.slice(-3).join(' ').trim();
};

const TEAM_MEMBER_ALIASES: Record<string, string> = {
  // normalized alias -> normalized full name
  "tatoane": "tatiane barbosa dos santos xavier",
  "tatiane": "tatiane barbosa dos santos xavier",
  "yasmin martins": "yasmin martins",
};

const matchTeamMemberByName = (name: string) => {
  const normalizedTarget = normalizeText(name);

  // Try explicit alias hits first
  const aliasTarget = TEAM_MEMBER_ALIASES[normalizedTarget];
  if (aliasTarget) {
    return TEAM_MEMBERS.find((member) => normalizeText(member.fullName) === aliasTarget);
  }

  return TEAM_MEMBERS.find((member) => {
    const normalizedFull = normalizeText(member.fullName);
    const normalizedFirst = normalizedFull.split(" ")[0] || normalizedFull;
    const normalizedUser = normalizeText(member.username);

    return (
      normalizedTarget.includes(normalizedFull) ||
      normalizedTarget.includes(normalizedUser) ||
      normalizedTarget.includes(normalizedFirst)
    );
  });
};

export const resolveFieldFromQuestion = (message: string): FieldIntent[] => {
  const normalized = normalizeText(message);
  return SCHOOL_FIELD_INTENTS.filter((intent) =>
    intent.keywords.some((kw) => normalized.includes(normalizeText(kw)))
  );
};

export const formatSingleFieldAnswer = (school: SchoolData, intent: FieldIntent): string => {
  const value = school[intent.field] ?? 'N/A';
  return `${intent.label}: ${value}`;
};

export const formatMultipleFieldAnswers = (
  school: SchoolData,
  intents: FieldIntent[]
): string => {
  const lines = intents.map((intent) => formatSingleFieldAnswer(school, intent));
  return lines.join(' | ');
};

export const formatSchoolHighlights = (school: SchoolData): string => {
  const highlights = [
    formatSingleFieldAnswer(school, { field: 'Carteira SAF', label: 'Responsavel SAF', keywords: [] }),
    formatSingleFieldAnswer(school, { field: 'Cluster', label: 'Cluster', keywords: [] }),
    formatSingleFieldAnswer(school, { field: 'E-mail da Escola', label: 'E-mail', keywords: [] }),
    formatSingleFieldAnswer(school, { field: 'CNPJ', label: 'CNPJ', keywords: [] }),
    formatSingleFieldAnswer(school, { field: 'Status da Escola', label: 'Status', keywords: [] }),
    formatSingleFieldAnswer(school, { field: 'Ticket Mdio', label: 'Ticket medio', keywords: [] }),
    formatSingleFieldAnswer(school, { field: 'Cidade da Escola', label: 'Cidade', keywords: [] }),
    formatSingleFieldAnswer(school, { field: 'Estado da Escola', label: 'UF', keywords: [] }),
  ].filter(Boolean);

  return `Resumo da escola ${school['Nome da Escola']}: ${highlights.join(' | ')}`;
};

export const formatTopSchoolsList = (
  schools: SchoolData[],
  label: string,
  limit = 5
): string => {
  if (!schools.length) return `Nenhuma escola encontrada para ${label}.`;

  const parseTicket = (v: any) => {
    if (!v) return 0;
    const num = Number(String(v).replace(/[^\d.,-]/g, '').replace(',', '.'));
    return Number.isFinite(num) ? num : 0;
  };

  const top = [...schools]
    .sort((a, b) => parseTicket(b['Ticket Mdio']) - parseTicket(a['Ticket Mdio']))
    .slice(0, limit);

  const lines = top.map((school) => {
    const ticket = school['Ticket Mdio'] || 'N/A';
    return `${school['Nome da Escola']} | Cluster: ${school['Cluster'] || 'N/A'} | Ticket mdio: ${ticket}`;
  });

  return `Top ${top.length} escolas em ${label} (ticket mdio): ${lines.join('; ')}`;
};

const normalizeLabel = (value?: string | null) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const resolveSafOwnerLabel = (raw: string | null | undefined): string => {
  if (!raw) return 'Sem carteira SAF';
  const matched = matchTeamMemberByName(raw);
  return matched?.fullName || raw.trim() || 'Sem carteira SAF';
};

export const summarizeSchoolsByCluster = async (): Promise<string> => {
  const data = await loadSchoolData();
  if (!data.length) return 'Nenhuma escola encontrada para gerar o resumo por cluster.';

  const grouped = data.reduce<Record<string, SchoolData[]>>((acc, school) => {
    const cluster = school['Cluster']?.trim() || 'Sem cluster';
    const key = cluster || 'Sem cluster';
    acc[key] = acc[key] || [];
    acc[key].push(school);
    return acc;
  }, {});

  const lines = Object.entries(grouped)
    .map(([cluster, schools]) => ({
      cluster,
      count: schools.length,
      examples: schools.slice(0, 8).map((s) => s['Nome da Escola']),
    }))
    .sort((a, b) => b.count - a.count || a.cluster.localeCompare(b.cluster))
    .map(
      ({ cluster, count, examples }) =>
        `- ${cluster}: ${count} escola${count > 1 ? 's' : ''}${
          examples.length ? ` (exemplos: ${examples.join('; ')}${count > examples.length ? ' ...' : ''})` : ''
        }`
    );

  return `Distribuicao por cluster (${data.length} escolas):\n${lines.join('\n')}`;
};

type AgentBreakdownOptions = {
  includeSchools?: boolean;
  agentFilter?: string;
};

export const summarizeSchoolsBySafAgent = async (
  options: AgentBreakdownOptions = {}
): Promise<string> => {
  const { includeSchools = false, agentFilter } = options;
  const data = await loadSchoolData();
  if (!data.length) return 'Nenhuma escola encontrada para gerar o resumo por agente SAF.';

  const filterNormalized = agentFilter ? normalizeLabel(agentFilter) : null;

  const grouped = data.reduce<Record<string, SchoolData[]>>((acc, school) => {
    const rawOwner = school['Carteira SAF'] as string | undefined;
    const owner = resolveSafOwnerLabel(rawOwner);
    if (filterNormalized && !normalizeLabel(owner).includes(filterNormalized)) {
      return acc;
    }
    acc[owner] = acc[owner] || [];
    acc[owner].push(school);
    return acc;
  }, {});

  const entries = Object.entries(grouped).map(([owner, schools]) => {
    const clusters = new Set(
      schools.map((s) => (s['Cluster'] as string | undefined)?.trim() || 'Sem cluster')
    );
    const schoolList = includeSchools
      ? schools
          .map((s) => `${s['Nome da Escola']} (${s['Cluster'] || 'Sem cluster'})`)
          .join('; ')
      : '';

    return {
      owner,
      count: schools.length,
      clusters: Array.from(clusters).sort(),
      schoolList,
    };
  });

  if (!entries.length) {
    return 'Nenhuma escola encontrada para esse agente SAF.';
  }

  const lines = entries
    .sort((a, b) => b.count - a.count || a.owner.localeCompare(b.owner))
    .map(({ owner, count, clusters, schoolList }) => {
      const clusterLabel =
        clusters.length > 3
          ? `${clusters.slice(0, 3).join(', ')}...`
          : clusters.join(', ');
      const base = `- ${owner}: ${count} escola${count > 1 ? 's' : ''} (clusters: ${clusterLabel || 'N/A'})`;
      if (!includeSchools) return base;
      return `${base}\n  Escolas: ${schoolList}`;
    });

  return `Distribuicao por agente SAF (${data.length} escolas):\n${lines.join('\n')}`;
};

let cachedSchoolData: SchoolData[] = [];
let dataLoaded = false;
let schoolDataLastUpdated: string | null = null;

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
  'Regio da Escola': school.regiao,
  'Telefone de Contato da Escola': school.telefone || 'No informado',
  'E-mail da Escola': school.email || 'No informado',
  'Razo Social': school.razaoSocial,
  'Nome Fantasia': school.nomeFantasia,
  'Status CNPJ': school.statusCnpj,
  'Status Visita Liderana': school.statusVisitaLideranca || 'N/A',
  'Performance da Meta': school.performanceMeta || 'N/A',
  'Atual Srie': school.atualSerie || 'N/A',
  'Avanando de Segmento': school.avancandoSegmento || 'N/A',
  'Cluster': school.cluster,
  'Ticket Mdio': school.ticketMedio || 'N/A',
  'Ultima Atualizacao': school.ultimaAtualizacao || null,
  'Toddle': 'N/A'
});

export const loadSchoolData = async (): Promise<SchoolData[]> => {
  if (dataLoaded && cachedSchoolData.length > 0) {
    return cachedSchoolData;
  }

  try {
    const rawSchools = await loadFranchisingSchools();
    cachedSchoolData = rawSchools.map(buildSchoolRecord);
    const maxDate = rawSchools
      .map((school) => school.ultimaAtualizacao)
      .filter((d): d is string => !!d)
      .map((d) => new Date(d))
      .filter((d) => !Number.isNaN(d.getTime()))
      .sort((a, b) => b.getTime() - a.getTime())[0];

    schoolDataLastUpdated = maxDate
      ? maxDate.toLocaleDateString('pt-BR')
      : null;

    dataLoaded = true;
    return cachedSchoolData;
  } catch (error) {
    throw new Error(`Erro ao carregar dados das escolas: ${error}`);
  }
};

export const getSchoolDataLastUpdated = (): string | null => {
  return schoolDataLastUpdated;
};

export const searchSchoolByName = async (schoolName: string): Promise<SchoolData | null> => {
  const data = await loadSchoolData();
  return (
    data.find(school =>
      school['Nome da Escola']?.toLowerCase().includes(schoolName.toLowerCase())
    ) || null
  );
};

export const searchSchoolById = async (schoolId: number): Promise<SchoolData | null> => {
  const data = await loadSchoolData();
  return data.find((school) => Number(school['ID da Escola']) === schoolId) || null;
};

export const searchSchoolByCnpj = async (cnpj: string): Promise<SchoolData | null> => {
  const digits = cnpj.replace(/\D/g, '');
  if (digits.length < 8) return null;
  const data = await loadSchoolData();
  return (
    data.find((school) => (school['CNPJ'] as string)?.replace(/\D/g, '') === digits) ||
    null
  );
};

export const searchSchoolByCityState = async (
  city: string,
  state?: string
): Promise<SchoolData | null> => {
  const data = await loadSchoolData();
  const normalizedCity = normalizeText(city);
  const normalizedState = state ? state.toUpperCase() : null;

  const candidates = data.filter((school) => {
    const schoolCity = normalizeText(school['Cidade da Escola'] || '');
    const schoolState = (school['Estado da Escola'] || '').toUpperCase();
    const cityMatches = schoolCity.includes(normalizedCity) || normalizedCity.includes(schoolCity);
    const stateMatches = normalizedState ? schoolState === normalizedState : true;
    return cityMatches && stateMatches;
  });

  if (!candidates.length) return null;
  if (candidates.length === 1) return candidates[0];
  return candidates.sort((a, b) => (a['Cluster'] || '').localeCompare(b['Cluster'] || ''))[0];
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

export const findSchoolFromMessage = async (
  message: string
): Promise<SchoolData | null> => {
  const normalized = normalizeText(message);

  // Direct CNPJ lookup
  const cnpjMatch = message.match(/\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/);
  if (cnpjMatch) {
    const schoolByCnpj = await searchSchoolByCnpj(cnpjMatch[0]);
    if (schoolByCnpj) return schoolByCnpj;
  }

  // ID lookup
  const idMatch = message.match(/id\s*(da\s*escola)?\s*(\d{2,4})/i);
  if (idMatch?.[2]) {
    const parsedId = Number(idMatch[2]);
    if (Number.isFinite(parsedId)) {
      const schoolById = await searchSchoolById(parsedId);
      if (schoolById) return schoolById;
    }
  }

  // City + State lookup (e.g., "Mogi das Cruzes SP" or "Mogi das Cruzes/SP")
  const cityStateMatch = message.match(/([a-z\s]+)[,\/-]\s*([a-z]{2})/i);
  if (cityStateMatch?.[1]) {
    const city = cityStateMatch[1].trim();
    const uf = cityStateMatch[2]?.trim().toUpperCase();
    const schoolByCity = await searchSchoolByCityState(city, uf);
    if (schoolByCity) return schoolByCity;
  }

  // Name-based lookup (exact/contains)
  const query = extractSchoolQuery(message) || normalized;
  const directMatch = query ? await searchSchoolByName(query) : null;
  if (directMatch) return directMatch;

  // Fuzzy scoring by token overlap
  const tokens = normalizeText(query).split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;

  const data = await loadSchoolData();
  let best: { school: SchoolData; score: number } | null = null;

  data.forEach((school) => {
    const normalizedName = normalizeText(school['Nome da Escola'] || '');
    const nameTokens = new Set(normalizedName.split(/\s+/).filter(Boolean));
    const score = tokens.reduce((acc, token) => {
      if (normalizedName.includes(token)) return acc + token.length * 2;
      if (nameTokens.has(token)) return acc + token.length;
      return acc;
    }, 0);

    if (score > 0 && (!best || score > best.score)) {
      best = { school, score };
    }
  });

  if (best && best.score >= 3) {
    return best.school;
  }

  return null;
};

export const buildSchoolSafSummary = (school: SchoolData): string => {
  const responsavel = (school['Carteira SAF'] as string) || 'N/A';
  const cluster = school['Cluster'] || 'N/A';

  const matchedMember = matchTeamMemberByName(responsavel);
  const responsibleLabel = matchedMember
    ? matchedMember.fullName
    : responsavel;

  const clusterLabel = cluster || 'N?o informado';

  return `Responsavel SAF: ${responsibleLabel}; Cluster: ${clusterLabel}`;
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
  if (!school) return 'Escola no encontrada.';

  let formatted = '**Detalhes da Escola:**\n\n';
  SCHOOL_FIELDS.forEach(field => {
    const value = school[field] ?? 'N/A';
    formatted += `- **${field}:** ${value}\n`;
  });

  return formatted;
};
