import Papa from 'papaparse';
import { CanvaUsageData, UsagePeriod } from '@/types/schoolLicense';

const LICENSE_FILE = '/data/licencas_canva.csv';

const MEMBER_FILE_MAP: Record<UsagePeriod, string> = {
  // 30d passa a usar o dump real mais recente enviado pelo time
  '30d': '/data/relatoriodeusosdemembros_23_11.csv',
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

type ReportType = 'members' | 'models';

type StoredOverride = {
  text: string;
  filename: string;
  uploadedAt: string;
  period: UsagePeriod;
};

const STORAGE_KEY = (type: ReportType, period: UsagePeriod) => `canva_override_${type}_${period}`;
const ALL_PERIODS = Object.keys(MEMBER_FILE_MAP) as UsagePeriod[];

const cleanupHeader = (header: string) => header.replace(/\s+/g, ' ').trim().toLowerCase();

const normalizeValue = (value?: unknown) => {
  if (value === null || value === undefined) {
    return '';
  }
  return typeof value === 'string' ? value.trim() : String(value).trim();
};

const parseCsvText = (text: string): Record<string, string>[] => {
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

const parseCsv = async (path: string, overrideText?: string): Promise<Record<string, string>[]> => {
  if (overrideText) {
    return parseCsvText(overrideText);
  }
  const response = await fetch(path);
  if (!response.ok) return [];
  const text = await response.text();
  return parseCsvText(text);
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

const getStorage = (): Storage | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage ?? null;
};

const saveOverride = (type: ReportType, period: UsagePeriod, payload: StoredOverride) => {
  const storage = getStorage();
  if (!storage) return;
  storage.setItem(STORAGE_KEY(type, period), JSON.stringify(payload));
};

const loadOverride = (type: ReportType, period: UsagePeriod): StoredOverride | null => {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(STORAGE_KEY(type, period));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredOverride;
  } catch {
    return null;
  }
};

export const getUploadInfo = (type: ReportType, period?: UsagePeriod) => {
  if (period) {
    const override = loadOverride(type, period);
    return override ? { filename: override.filename, uploadedAt: override.uploadedAt } : null;
  }
  const overrides = ALL_PERIODS.map((p) => loadOverride(type, p)).filter(Boolean) as StoredOverride[];
  if (!overrides.length) return null;
  const latest = overrides.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
  return { filename: latest.filename, uploadedAt: latest.uploadedAt };
};

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
  const memberOverride = loadOverride('members', period);
  const [members, licenseMap] = await Promise.all([
    parseCsv(
      MEMBER_FILE_MAP[period] ?? MEMBER_FILE_MAP[DEFAULT_USAGE_PERIOD],
      memberOverride?.text
    ),
    loadLicenseMap(),
  ]);

  const schools = new Map<string, {
    info: LicenseInfo;
    stats: CanvaUsageData;
    creators: Array<{ name: string; email: string; designs: number; schoolName?: string; schoolId?: string; cluster?: string }>;
  }>();

  const timeSeriesMap = new Map<string, number>();

  const periodFieldCandidates = ['ultima atividade', 'ultima atividade', 'ultima atividade', 'gltima atividade', 'gltima atividade'];
  const schoolNameFieldCandidates = ['escola', 'school', 'organizacao', 'organiza��o', 'organization', 'instituicao', 'institution', 'campus'];
  const schoolIdFieldCandidates = ['escola id', 'escolaid', 'school id'];

  members.forEach((row) => {
    const email = findField(row, ['e-mail']);
    const designsCreated = parseNumber(findField(row, ['designs criados', 'designs criados']));
    const designsPublished = parseNumber(findField(row, ['designs publicados']));
    const shared = parseNumber(findField(row, ['links compartilhados']));
    const views = parseNumber(findField(row, ['designs visualizados']));
    const periodLabel = findField(row, periodFieldCandidates);

    const license = licenseMap.get(email.toLowerCase());
    const fallbackSchoolName = findField(row, schoolNameFieldCandidates);
    const fallbackSchoolId = findField(row, schoolIdFieldCandidates) || (fallbackSchoolName ? fallbackSchoolName.toLowerCase() : '');
    const schoolName =
      (license?.schoolName && license.schoolName !== 'Sem Escola' ? license.schoolName : undefined) ||
      fallbackSchoolName ||
      'Sem Escola';
    const schoolId =
      (license?.schoolId && license.schoolId !== 'unknown' ? license.schoolId : undefined) ||
      fallbackSchoolId ||
      'unknown';
    const cluster = license?.cluster || findField(row, ['cluster']) || 'Sem cluster';

    const schoolKey = `${schoolId}__${schoolName}`;
    const entry = schools.get(schoolKey) ?? {
      info: license ?? { schoolId, schoolName, cluster },
      stats: {
        schoolId,
        schoolName,
        cluster,
        designsCreated: 0,
        designsPublished: 0,
        designsShared: 0,
        designsViewed: 0,
        topCreators: [],
      },
      creators: [],
    };

    entry.stats.schoolId = schoolId;
    entry.stats.schoolName = schoolName;
    entry.stats.cluster = cluster;

    entry.stats.designsCreated += designsCreated;
    entry.stats.designsPublished += designsPublished;
    entry.stats.designsShared += shared;
    entry.stats.designsViewed += views;
    entry.creators.push({
      name: findField(row, ['membro', 'member']),
      email,
      designs: designsCreated,
      schoolName,
      schoolId,
      cluster,
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
  const modelOverride = loadOverride('models', period);
  const rows = await parseCsv(
    MODEL_FILE_MAP[period] ?? MODEL_FILE_MAP[DEFAULT_USAGE_PERIOD],
    modelOverride?.text
  );
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

export const uploadMemberReport = async (file: File, period: UsagePeriod | 'all' = 'all', rawText?: string) => {
  const text = rawText ?? await file.text();
  const uploadedAt = new Date().toISOString();
  const targets = period === 'all' ? ALL_PERIODS : [period];
  targets.forEach((p) =>
    saveOverride('members', p, {
      text,
      filename: file.name,
      uploadedAt,
      period: p,
    })
  );
};

export const clearUploadOverrides = () => {
  const storage = getStorage();
  if (!storage) return;
  ALL_PERIODS.forEach((p) => {
    storage.removeItem(STORAGE_KEY('members', p));
    storage.removeItem(STORAGE_KEY('models', p));
  });
};

export const uploadModelReport = async (file: File, period: UsagePeriod | 'all' = 'all', rawText?: string) => {
  const text = rawText ?? await file.text();
  const uploadedAt = new Date().toISOString();
  const targets = period === 'all' ? ALL_PERIODS : [period];
  targets.forEach((p) =>
    saveOverride('models', p, {
      text,
      filename: file.name,
      uploadedAt,
      period: p,
    })
  );
};
