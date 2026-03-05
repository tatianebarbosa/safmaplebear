import { generateCanvaOverview, processSchoolsWithUsers } from '@/lib/officialDataProcessor';
import type { CanvaOverviewData, ProcessedSchoolData } from '@/types/officialData';

const MAX_LICENSES_PER_SCHOOL = 2;

type NullableNumber = number | null | undefined;

export interface DashboardBIContext {
  overview: CanvaOverviewData;
  schools: ProcessedSchoolData[];
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
  'licença',
  'licenças',
  'dashboard',
  'relatorio',
  'relatório',
  'analise',
  'análise',
  'metric',
  'metrica',
  'métrica',
  'usuario',
  'usuário',
  'cluster',
  'escola',
  'portal',
  'insight',
];

const extractSchoolTerm = (question: string): string | null => {
  const match = question.match(/(?:escola|unidade)\s+([a-zA-ZÀ-ÿ0-9\s\-]{3,80})/i);
  if (!match) return null;
  const cleaned = match[1].split(/[.,;!?]/)[0]?.trim() ?? '';
  return cleaned.length >= 3 ? cleaned : null;
};

const findSchoolInsight = (
  question: string,
  schools: ProcessedSchoolData[]
): ProcessedSchoolData | null => {
  if (!schools.length) return null;
  const sanitizedQuestion = sanitizeText(question);
  const explicitTerm = extractSchoolTerm(question);
  const normalizedTerm = explicitTerm ? sanitizeText(explicitTerm) : '';
  const genericTokens = new Set(['maple', 'bear', 'mb', 'escola', 'unidade', 'colegio']);
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
      const [overview, schools] = await Promise.all([
        generateCanvaOverview(),
        processSchoolsWithUsers(),
      ]);

      if (!overview || !schools?.length) {
        return null;
      }

      cachedContext = {
        overview,
        schools,
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

const buildTopSchoolSummary = (schools: ProcessedSchoolData[]): string => {
  if (!schools.length) return '';

  const validSchools = schools.filter((item) => item.school?.id !== 'no-school');
  const [topSchool] = validSchools.length ? validSchools : schools;

  if (!topSchool) return '';

  const { school, totalUsers, nonCompliantUsers, licenseStatus } = topSchool;
  return `Maior volume concentrado em ${school.name} com ${formatNumber(
    totalUsers
  )} usuários (${nonCompliantUsers} fora da política, status ${licenseStatus}).`;
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
  )} usuários fora da política (${formatNumber(riskSchool.totalUsers)} no total).`;
};

const buildDomainRisk = (overview: CanvaOverviewData): string => {
  const [topDomain] = overview.topNonCompliantDomains || [];
  if (!topDomain) return '';

  return `Domínio crítico: ${topDomain.domain} (${formatNumber(topDomain.count)} contas).`;
};

const buildMetricSuggestions = (overview: CanvaOverviewData): string => {
  const suggestions: string[] = [];

  suggestions.push(
    `Cruzar os ${formatNumber(
      overview.nonCompliantUsers
    )} usuários fora da política com clusters para priorizar tratativas.`
  );

  return suggestions.join(' ');
};

const buildVisualizationSuggestions = (schools: ProcessedSchoolData[]): string => {
  const suggestions: string[] = [];

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
    return 'Não encontrei essa informação na base local. No sistema SAF, você pode verificar isso na tela de Licenças Canva buscando o nome da escola.';
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

  const { overview, schools } = context;
  if (!overview || !schools.length) {
    return null;
  }

  const targetSchool = findSchoolInsight(question, schools);
  if (targetSchool) {
    return buildSchoolAnswer(targetSchool);
  }

  const topSchoolSummary = buildTopSchoolSummary(schools);
  const riskSummary = buildRiskSummary(schools);
  const domainSummary = buildDomainRisk(overview);

  const metricSuggestions = buildMetricSuggestions(overview);
  const visualizationSuggestions = buildVisualizationSuggestions(schools);

  const overviewLine = `Base atual traz ${formatNumber(overview.totalUsers)} usuários distribuídos em ${formatNumber(
    overview.totalSchools
  )} escolas, com conformidade em ${formatPercent(
    overview.complianceRate
  )}.`;

  const highlights = [topSchoolSummary, riskSummary, domainSummary]
    .filter(Boolean)
    .join(' ');

  const causesLine = topSchoolSummary || 'A dinâmica segue orientada por updates manuais de CSV e auditorias no painel.';
  const metricsLine = metricSuggestions;
  const visualizationLine =
    visualizationSuggestions ||
    'Usar ranking de escolas com mais licenças e comparativo por cluster para reduzir inconsistências.';

  return [
    `- **Visão geral do período:** ${overviewLine}`,
    `- **Destaques:** ${highlights || 'Sem variações relevantes registradas.'}`,
    `- **Possíveis causas:** ${causesLine}`,
    `- **Sugestões de métricas extras:** ${metricsLine}`,
    `- **Sugestões de melhoria de visualização:** ${visualizationLine}`,
  ].join('\n');
};
