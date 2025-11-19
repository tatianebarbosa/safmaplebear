import { generateCanvaOverview, processSchoolsWithUsers } from '@/lib/officialDataProcessor';
import type { CanvaOverviewData, ProcessedSchoolData } from '@/types/officialData';

const CANVA_HISTORY_PATH = '/data/canva_history.json';

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
  const minScore = normalizedTerm ? 0.7 : 0.5;
  let best: { data: ProcessedSchoolData; score: number } | null = null;

  for (const entry of schools) {
    const schoolName = entry.school?.name;
    if (!schoolName) continue;
    const normalizedName = sanitizeText(schoolName);
    if (!normalizedName) continue;

    const tokens = normalizedName.split(' ').filter((token) => token.length > 3);
    const tokenMatches = tokens.filter((token) => sanitizedQuestion.includes(token)).length;

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

const buildSchoolAnswer = (schoolData: ProcessedSchoolData, history: CanvaHistoryEntry[]): string => {
  const { school, totalUsers, estimatedLicenses, licenseStatus, nonCompliantUsers, compliantUsers } = schoolData;
  const usagePercent = estimatedLicenses
    ? (totalUsers / Math.max(estimatedLicenses, 1)) * 100
    : null;
  const complianceRate = totalUsers > 0 ? (compliantUsers / totalUsers) * 100 : null;
  const historySummary = buildHistoryHighlights(history) || 'Sem histórico recente registrado no canva_history.json.';

  const highlights = [
    `${formatNumber(totalUsers)} usuários ativos (${licenseStatus})`,
    `Ocupação estimada: ${formatPercent(usagePercent)}`,
    `Taxa de conformidade: ${formatPercent(complianceRate)}${nonCompliantUsers ? ` (${formatNumber(nonCompliantUsers)} fora da política)` : ''}`,
  ]
    .filter(Boolean)
    .join(' | ');

  const causes = nonCompliantUsers
    ? 'Usuários fora da política sugerem cadastros manuais com domínios externos ou contas sem revisão recente.'
    : 'Sem riscos aparentes; mantenha apenas o monitoramento das próximas matrículas.';

  const metricsLine = [
    `Comparar evolução semanal de usuários vs. limite (${formatNumber(estimatedLicenses)} licenças previstas).`,
    'Acompanhar conformidade segmentada por função (aluno x professor x administrador).',
  ].join(' ');

  const visualizationLine = [
    'Linha do tempo dedicada para a escola com checkpoints das últimas coletas.',
    'Gráfico circular de conformidade e ranking interno por função para priorizar ajustes.',
  ].join(' ');

  return [
    `- **Visão geral do período:** ${school.name} mantém ${formatNumber(
      totalUsers
    )} usuários vinculados (${licenseStatus}). ${historySummary}`,
    `- **Destaques:** ${highlights}`,
    `- **Possíveis causas:** ${causes}`,
    `- **Sugestões de métricas extras:** ${metricsLine}`,
    `- **Sugestões de melhoria de visualização:** ${visualizationLine}`,
  ].join('\n');
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
    return buildSchoolAnswer(targetSchool, history);
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
