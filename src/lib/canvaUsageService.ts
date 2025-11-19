import Papa from 'papaparse';
import { CanvaUsageData, UsagePeriod } from '@/types/schoolLicense';

const LICENSE_FILE = '/data/licencas_canva.csv';

const MEMBER_FILE_MAP: Record<UsagePeriod, string> = {
  '30d': '/data/relatoriomembro canva18_11__30dias.csv',
  '3m': '/data/relatoriomembro canva18_11__3messes.csv',
  '6m': '/data/relatoriomembro canva18_11__6 messes.csv',
  '12m': '/data/12messesMembro.csv'
};

const MODEL_FILE_MAP: Record<UsagePeriod, string> = {
  '30d': '/data/modelos18_11__30dias.csv',
  '3m': '/data/modelos18_11__3messes.csv',
  '6m': '/data/modelos18_11__6 messes.csv',
  '12m': '/data/12messesModelo.csv'
};

const DEFAULT_USAGE_PERIOD: UsagePeriod = '30d';
const MIN_USAGE_YEAR = 2024;

const cleanupHeader = (header: string) => header.replace(/\s+/g, ' ').trim().toLowerCase();

const normalizeValue = (value?: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }
  return typeof value === 'string' ? value.trim() : String(value).trim();
};

const parseCsv = async (path: string): Promise<Record<string, string>[]> => {
  const response = await fetch(path);
  if (!response.ok) return [];
  const text = await response.text();
  const delimiter = text.includes(';') ? ';' : text.includes(',') ? ',' : ';';
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    delimiter,
  });
  return parsed.data.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [cleanupHeader(key), normalizeValue(value)])
    )
  );
};

const findField = (row: Record<string, string>, candidates: string[]) => {
  for (const candidate of candidates) {
    const normalized = candidate.toLowerCase();
    const entry = Object.entries(row).find(([key]) => key.includes(normalized));
    if (entry && entry[1]) return entry[1];
  }
  return '';
};

const parseNumber = (value: string | number | undefined | null) => {
  if (value === undefined || value === null) return 0;
  const normalized = String(value).replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return Number.isFinite(num) ? num : 0;
};

const extractYear = (label?: string) => {
  if (!label) return null;
  const match = label.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : null;
};

type LicenseInfo = { schoolId: string; schoolName: string; cluster?: string };

const loadLicenseMap = async () => {
  const rows = await parseCsv(LICENSE_FILE);
  const map = new Map<string, LicenseInfo>();
  rows.forEach((row) => {
    const email = findField(row, ['e-mail']);
    if (!email) return;
    map.set(email.toLowerCase(), {
      schoolId: findField(row, ['escola id', 'escolaid']) || 'unknown',
      schoolName: findField(row, ['escola', 'school']) || 'Sem Escola',
      cluster: findField(row, ['cluster']),
    });
  });
  return map;
};

export type ModelUsage = {
  modelName: string;
  owner: string;
  uses: number;
  published: number;
  shared: number;
};

export type TimeSeriesPoint = {
  period: string;
  designs: number;
};

export const loadUsageReport = async (period: UsagePeriod = DEFAULT_USAGE_PERIOD) => {
  const [members, licenseMap] = await Promise.all([
    parseCsv(MEMBER_FILE_MAP[period] ?? MEMBER_FILE_MAP[DEFAULT_USAGE_PERIOD]),
    loadLicenseMap(),
  ]);

  const schools = new Map<string, {
    info: LicenseInfo;
    stats: CanvaUsageData;
    creators: Array<{ name: string; email: string; designs: number }>;
  }>();

  const timeSeriesMap = new Map<string, number>();

  const periodFieldCandidates = ['última atividade', 'ultima atividade', '�ltima atividade', 'ǧltima atividade', 'gltima atividade'];

  members.forEach((row) => {
    const email = findField(row, ['e-mail']);
    const designsCreated = parseNumber(findField(row, ['designs criados', 'designs criados']));
    const designsPublished = parseNumber(findField(row, ['designs publicados']));
    const shared = parseNumber(findField(row, ['links compartilhados']));
    const views = parseNumber(findField(row, ['designs visualizados']));
    const periodLabel = findField(row, periodFieldCandidates);

    const license = licenseMap.get(email.toLowerCase());
    const schoolKey = license ? `${license.schoolId}__${license.schoolName}` : 'unknown__Sem Escola';
    const entry = schools.get(schoolKey) ?? {
      info: license ?? { schoolId: schoolKey.split('__')[0], schoolName: schoolKey.split('__')[1] },
      stats: {
        schoolId: license?.schoolId ?? schoolKey,
        schoolName: license?.schoolName ?? 'Sem Escola',
        cluster: license?.cluster ?? 'Sem cluster',
        designsCreated: 0,
        designsPublished: 0,
        designsShared: 0,
        designsViewed: 0,
        topCreators: [],
      },
      creators: [],
    };

    entry.stats.designsCreated += designsCreated;
    entry.stats.designsPublished += designsPublished;
    entry.stats.designsShared += shared;
    entry.stats.designsViewed += views;
    entry.creators.push({
      name: findField(row, ['membro', 'member']),
      email,
      designs: designsCreated,
    });

    if (periodLabel) {
      timeSeriesMap.set(periodLabel, (timeSeriesMap.get(periodLabel) ?? 0) + designsCreated);
    }

    schools.set(schoolKey, entry);
  });

  const usageData = Array.from(schools.values()).map(({ stats, creators }) => ({
    ...stats,
    topCreators: creators
      .sort((a, b) => b.designs - a.designs)
      .slice(0, 3),
  }));

  const timeSeries: TimeSeriesPoint[] = Array.from(timeSeriesMap.entries())
    .filter(([period]) => {
      const year = extractYear(period);
      return !year || year >= MIN_USAGE_YEAR;
    })
    .map(([period, designs]) => ({ period, designs }))
    .sort((a, b) => a.period.localeCompare(b.period, 'pt-BR'));

  return { usageData, timeSeries };
};

export const loadModelUsageRanking = async (period: UsagePeriod = DEFAULT_USAGE_PERIOD): Promise<ModelUsage[]> => {
  const rows = await parseCsv(MODEL_FILE_MAP[period] ?? MODEL_FILE_MAP[DEFAULT_USAGE_PERIOD]);
  return rows
    .map((row) => ({
      modelName: findField(row, ['modelo']),
      owner: findField(row, ['titular']),
      uses: parseNumber(findField(row, ['usadas'])),
      published: parseNumber(findField(row, ['publicado'])),
      shared: parseNumber(findField(row, ['compartilhados'])),
    }))
    .filter((model) => model.modelName)
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 10);
};
