import { generateCanvaOverview, processSchoolsWithUsers } from '@/lib/officialDataProcessor';
import type { CanvaOverviewData, ProcessedSchoolData } from '@/types/officialData';

const CANVA_HISTORY_PATH = '/data/canva_history.json';
const MAX_LICENSES_PER_SCHOOL = 2;

type NullableNumber = number | null | undefined;

export interface CanvaHistoryEntry {
  id: number;
  timestamp: string;
  tipo?: string;
  descricao?: string;
  usuario?: string;
  status?: string;
  metadados?: {
    periodo?: string;
    usuarios_afetados?: number;
  };
}

export interface DashboardBIContext {
  overview: CanvaOverviewData;
  schools: ProcessedSchoolData[];
  history: CanvaHistoryEntry[];
}

const normalizeText = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const formatNumber = (value: NullableNumber): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return '0';
  return value.toLocaleString('pt-BR');
};

const formatPercent = (value: NullableNumber): string => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'N/A';
  return `${value.toFixed(1).replace('.', ',')}%`;
};

const buildSchoolPanelUrl = (schoolId?: string, basePath?: string): string | null => {
  if (!schoolId || !basePath) return null;
  const normalizedBase = basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
  return `${normalizedBase}/${schoolId}`;
};

const formatDate = (value?: string): string => {
  if (!value) return 'Data n\u00E3o informada';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data n\u00E3o informada';
  return date.toLocaleDateString('pt-BR');
};

const getUsersAffected = (entry?: CanvaHistoryEntry): NullableNumber =>
  entry?.metadados?.usuarios_afetados;

const loadHistory = async (): Promise<CanvaHistoryEntry[]> => {
  try {
    const response = await fetch(CANVA_HISTORY_PATH, { cache: 'no-store' });
    if (!response.ok) return [];
    const payload = (await response.json()) as CanvaHistoryEntry[];
    return Array.isArray(payload) ? payload : [];
  } catch (error) {
    console.error('[dashboardInsights] Erro ao carregar canva_history.json', error);
    return [];
  }
};

let cachedContext: DashboardBIContext | null = null;
let contextPromise: Promise<DashboardBIContext | null> | null = null;

export const loadDashboardBIContext = async (): Promise<DashboardBIContext | null> => {
  if (cachedContext) {
    return cachedContext;
  }

  if (contextPromise) {
    return contextPromise;
  }

  contextPromise = (async () => {
    try {
      const [overview, schools, history] = await Promise.all([
        generateCanvaOverview(),
        processSchoolsWithUsers(),
        loadHistory(),
      ]);

      if (!overview || !schools?.length) {
        return null;
      }

      const sortedHistory = [...history].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      cachedContext = {
        overview,
        schools,
        history: sortedHistory,
      };

      return cachedContext;
    } catch (error) {
      console.error('[dashboardInsights] Erro ao montar contexto BI', error);
      return null;
    } finally {
      contextPromise = null;
    }
  })();

  return contextPromise;
};

const sanitizeText = (value: string): string =>
  normalizeText(value).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const levenshteinDistance = (a: string, b: string): number => {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array.from({ length: b.length + 1 }, () => 0)
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  return matrix[a.length][b.length];
};

const hasFuzzyMatch = (token: string, haystack: string[], tolerance = 1): boolean =>
  haystack.some((term) => levenshteinDistance(token, term) <= tolerance);

const KEYWORDS = [
  'canva',
  'licenca',
  'licencas',
  'licen\u00E7a',
  'licen\u00E7as',
  'dashboard',
  'relatorio',
  'relat\u00F3rio',
  'analise',
  'an\u00E1lise',
  'metric',
  'metrica',
  'm\u00E9trica',
  'usuario',
  'usu\u00E1rio',
  'cluster',
  'escola',
  'portal',
  'insight',
];

const extractSchoolTerm = (question: string): string | null => {
  const match = question.match(/(?:escola|unidade)\s+([a-zA-ZÀ-ÿ0-9\s\-]{3,80})/i);
  if (!match) return null;
  const cleaned = match[1].split(/[\.,;!?]/)[0]?.trim() ?? '';
  return cleaned.length >= 3 ? cleaned : null;
};

const findSchoolInsight = (question: string, schools: ProcessedSchoolData[]): ProcessedSchoolData | null => {
  if (!schools.length) return null;
  const sanitizedQuestion = sanitizeText(question);
  const explicitTerm = extractSchoolTerm(question);
  const normalizedTerm = explicitTerm ? sanitizeText(explicitTerm) : '';
  const genericTokens = new Set(['maple', 'bear', 'mb', 'escola', 'unidade', 'colegio', 'colegio']);
  const minScore = normalizedTerm ? 0.8 : 0.5;

  const questionTokens = sanitizedQuestion
    .split(' ')
    .filter((token) => token.length > 2 && !genericTokens.has(token));

  let best: { data: ProcessedSchoolData; score: number } | null = null;

  const pool = normalizedTerm
    ? schools.filter((entry) => sanitizeText(entry.school?.name ?? '').includes(normalizedTerm))
    : schools;

  if (normalizedTerm && pool.length === 0) {
    return null;
  }

  for (const entry of pool) {
    const schoolName = entry.school?.name;
    if (!schoolName) continue;
    const normalizedName = sanitizeText(schoolName);
    if (!normalizedName) continue;

    const tokens = normalizedName
      .split(' ')
      .filter((token) => token.length > 2 && !genericTokens.has(token));

    if (!tokens.length) continue;

    const tokenMatches = tokens.filter(
      (token) => sanitizedQuestion.includes(token) || hasFuzzyMatch(token, questionTokens, 1)
    ).length;
    const specificMatches = tokens.filter(
      (token) => questionTokens.includes(token) || hasFuzzyMatch(token, questionTokens, 1)
    ).length;

    if (questionTokens.length && specificMatches === 0) {
      continue;
    }

    let score = tokens.length ? tokenMatches / tokens.length : 0;
    if (tokenMatches >= 2) {
      score += 0.3;
    }
    if (normalizedTerm && normalizedName.includes(normalizedTerm)) {
      score += 1.5;
    }
    if (sanitizedQuestion.includes(normalizedName)) {
      score += 2;
    }

    if (!best || score > best.score) {
      best = { data: entry, score };
    }
  }

  if (best && best.score >= minScore) {
    return best.data;
  }
  return null;
};

export const resolveSchoolPanelSource = (
  question: string,
  context: DashboardBIContext | null,
  panelBasePath?: string
):
  | {
      id: string;
      title: string;
      summary: string;
      url: string;
    }
  | null => {
  if (!context) return null;
  const targetSchool = findSchoolInsight(question, context.schools);
  if (!targetSchool) return null;

  const url = buildSchoolPanelUrl(targetSchool.school?.id, panelBasePath);
  if (!url) return null;

  return {
    id: targetSchool.school.id,
    title: `Abrir escola no Painel (ID: ${targetSchool.school.id})`,
    summary: targetSchool.school.name,
    url,
  };
};

const buildHistoryHighlights = (history: CanvaHistoryEntry[]) => {
  if (!history.length) return '';

  const [current, previous] = history;
  const currentUsers = getUsersAffected(current);
  const previousUsers = getUsersAffected(previous);
  const diff =
    typeof currentUsers === 'number' && typeof previousUsers === 'number'
      ? currentUsers - previousUsers
      : null;

  const periodLabel = current?.metadados?.periodo || 'per\u00EDodo informado';
  const baseSentence = `\u00DAltima sincroniza\u00E7\u00E3o em ${formatDate(
    current?.timestamp
  )} (${periodLabel}) tocou ${formatNumber(currentUsers)} contas.`;

  if (diff === null || diff === 0 || !previousUsers) {
    return baseSentence;
  }

  const diffLabel = diff > 0 ? `+${formatNumber(diff)}` : formatNumber(diff);
  return `${baseSentence} Diferen\u00E7a versus execu\u00E7\u00E3o anterior: ${diffLabel} usu\u00E1rios.`;
};

const buildTopSchoolSummary = (schools: ProcessedSchoolData[]): string => {
  if (!schools.length) return '';

  const validSchools = schools.filter((item) => item.school?.id !== 'no-school');
  const [topSchool] = validSchools.length ? validSchools : schools;

  if (!topSchool) return '';

  const { school, totalUsers, nonCompliantUsers, licenseStatus } = topSchool;
  return `Maior volume concentrado em ${school.name} com ${formatNumber(
    totalUsers
  )} usu\u00E1rios (${nonCompliantUsers} fora da pol\u00EDtica, status ${licenseStatus}).`;
};

const buildRiskSummary = (schools: ProcessedSchoolData[]): string => {
  const sortedByRisk = [...schools]
    .filter((item) => item.school?.id !== 'no-school')
    .sort((a, b) => b.nonCompliantUsers - a.nonCompliantUsers);

  const riskSchool = sortedByRisk[0];
  if (!riskSchool || riskSchool.nonCompliantUsers === 0) {
    return '';
  }

  return `${riskSchool.school.name} concentra ${formatNumber(
    riskSchool.nonCompliantUsers
  )} usu\u00E1rios fora da pol\u00EDtica (${formatNumber(riskSchool.totalUsers)} no total).`;
};

const buildDomainRisk = (overview: CanvaOverviewData): string => {
  const [topDomain] = overview.topNonCompliantDomains || [];
  if (!topDomain) return '';

  return `Dom\u00EDnio cr\u00EDtico: ${topDomain.domain} (${formatNumber(topDomain.count)} contas).`;
};

const buildHistoryCauses = (history: CanvaHistoryEntry[]): string => {
  if (history.length < 2) {
    return '';
  }

  const causes: string[] = [];
  const first = history[0];
  const second = history[1];
  const third = history[2];

  const firstUsers = getUsersAffected(first);
  const secondUsers = getUsersAffected(second);
  const thirdUsers = getUsersAffected(third);

  if (
    typeof firstUsers === 'number' &&
    typeof secondUsers === 'number' &&
    first.tipo?.toLowerCase().includes('manual')
  ) {
    causes.push(
      `Coleta manual de ${formatDate(first.timestamp)} ampliou a base em ${formatNumber(
        firstUsers - secondUsers
      )} contas ao trocar para ${first.metadados?.periodo}.`
    );
  }

  if (
    typeof secondUsers === 'number' &&
    typeof thirdUsers === 'number' &&
    second.tipo?.toLowerCase().includes('manual')
  ) {
    causes.push(
      `A execu\u00E7\u00E3o de ${formatDate(second.timestamp)} (+${formatNumber(
        secondUsers - thirdUsers
      )}) indica ajustes sob demanda disparados via API.`
    );
  }

  return causes.join(' ');
};

const buildMetricSuggestions = (overview: CanvaOverviewData, history: CanvaHistoryEntry[]): string => {
  const suggestions: string[] = [];
  const [current, previous] = history;
  const currentUsers = getUsersAffected(current);
  const previousUsers = getUsersAffected(previous);

  if (typeof currentUsers === 'number' && typeof previousUsers === 'number') {
    suggestions.push(
      `Acompanhar crescimento entre ${formatNumber(previousUsers)} e ${formatNumber(
        currentUsers
      )} usu\u00E1rios para medir impacto das coletas manuais.`
    );
  }

  suggestions.push(
    `Cruzar os ${formatNumber(
      overview.nonCompliantUsers
    )} usu\u00E1rios fora da pol\u00EDtica com clusters para priorizar tratativas.`
  );

  return suggestions.join(' ');
};

const buildVisualizationSuggestions = (
  schools: ProcessedSchoolData[],
  history: CanvaHistoryEntry[]
): string => {
  const suggestions: string[] = [];

  if (history.length) {
    const timeline = history
      .slice(0, 3)
      .map(
        (item) =>
          `${formatDate(item.timestamp)} (${item.metadados?.periodo || 'per\u00EDodo'}) - ${formatNumber(
            getUsersAffected(item)
          )}`
      )
      .join(' / ');
    suggestions.push(`Linha do tempo destacando coletas: ${timeline}.`);
  }

  const topSchools = schools
    .filter((item) => item.school?.id !== 'no-school')
    .slice(0, 3)
    .map((school) => `${school.school.name} (${formatNumber(school.totalUsers)})`);

  if (topSchools.length) {
    suggestions.push(`Ranking/heatmap com top 3 escolas: ${topSchools.join(', ')}.`);
  }

  return suggestions.join(' ');
};

const buildSchoolAnswer = (schoolData: ProcessedSchoolData): string => {
  const { school, totalUsers } = schoolData;
  if (typeof totalUsers !== 'number') {
    return 'Não encontrei essa informação na base local. No sistema SAF, você pode verificar isso na tela de Licenças Canva pesquisando o nome da escola.';
  }

  const licenseLimit = MAX_LICENSES_PER_SCHOOL;
  const overLimit = Math.max(totalUsers - licenseLimit, 0);
  const limitNote =
    totalUsers > licenseLimit
      ? `Atenção: limite de ${licenseLimit} licenças por escola, excesso de ${formatNumber(overLimit)} usuários.`
      : `Dentro do limite de ${licenseLimit} licenças por escola.`;

  return `${school.name} está com ${formatNumber(totalUsers)} usuários ativos/vinculados. Licenças usadas: ${formatNumber(
    totalUsers
  )}. ${limitNote}`;
};

export const buildBIAnswer = (question: string, context: DashboardBIContext | null): string | null => {
  if (!context) return null;

  const normalizedQuestion = normalizeText(question);
  const isRelevant = KEYWORDS.some((keyword) => normalizedQuestion.includes(keyword));
  if (!isRelevant) return null;

  const { overview, schools, history } = context;
  if (!overview || !schools.length) {
    return null;
  }

  const targetSchool = findSchoolInsight(question, schools);
  if (targetSchool) {
    return buildSchoolAnswer(targetSchool);
  }

  const historySummary = buildHistoryHighlights(history);
  const topSchoolSummary = buildTopSchoolSummary(schools);
  const riskSummary = buildRiskSummary(schools);
  const domainSummary = buildDomainRisk(overview);

  const causes = buildHistoryCauses(history);
  const metricSuggestions = buildMetricSuggestions(overview, history);
  const visualizationSuggestions = buildVisualizationSuggestions(schools, history);

  const overviewLine = `Base atual traz ${formatNumber(overview.totalUsers)} usu\u00E1rios distribu\u00EDdos em ${formatNumber(
    overview.totalSchools
  )} escolas, com conformidade em ${formatPercent(
    overview.complianceRate
  )}. ${historySummary}`.trim();

  const highlights = [topSchoolSummary, riskSummary, domainSummary]
    .filter(Boolean)
    .join(' ');

  const causesLine = causes || 'Coletas recentes indicam ajustes pontuais solicitados pelo SAF.';
  const metricsLine = metricSuggestions;
  const visualizationLine =
    visualizationSuggestions ||
    'Adicionar linha do tempo das coletas recentes e ranking de escolas com mais licen\u00E7as.';

  return [
    `- **Vis\u00E3o geral do per\u00EDodo:** ${overviewLine}`,
    `- **Destaques:** ${highlights || 'Sem varia\u00E7\u00F5es relevantes registradas.'}`,
    `- **Poss\u00EDveis causas:** ${causesLine}`,
    `- **Sugest\u00F5es de m\u00E9tricas extras:** ${metricsLine}`,
    `- **Sugest\u00F5es de melhoria de visualiza\u00E7\u00E3o:** ${visualizationLine}`,
  ].join('\n');
};
