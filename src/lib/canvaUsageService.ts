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
const UPLOAD_HISTORY_KEY = 'canva_usage_upload_history_v1';

type UploadHistoryEntry = {
  id: string;
  type: ReportType;
  period: UsagePeriod;
  filename: string;
  uploadedAt: string;
};

const cleanupHeader = (header: string) =>
  header
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

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
  const normalizedEntries = Object.entries(row).map(([key, value]) => {
    const cleaned = cleanupHeader(key);
    return [cleaned, value] as const;
  });

  for (const candidate of candidates) {
    const normalized = cleanupHeader(candidate);
    const entry = normalizedEntries.find(
      ([key]) => key.includes(normalized) || normalized.includes(key)
    );
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

const loadUploadHistory = (): UploadHistoryEntry[] => {
  const storage = getStorage();
  if (!storage) return [];
  const raw = storage.getItem(UPLOAD_HISTORY_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as UploadHistoryEntry[];
  } catch {
    return [];
  }
};

const saveUploadHistory = (entries: UploadHistoryEntry[]) => {
  const storage = getStorage();
  if (!storage) return;
  const limited = entries.slice(0, 12);
  storage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(limited));
};

const recordHistoryEntries = (entries: UploadHistoryEntry[]) => {
  if (!entries.length) return;
  const current = loadUploadHistory();
  const merged = [...entries, ...current];
  const seen = new Set<string>();
  const deduped: UploadHistoryEntry[] = [];
  merged.forEach((entry) => {
    const key = `${entry.type}-${entry.period}-${entry.uploadedAt}-${entry.filename}`;
    if (seen.has(key)) return;
    seen.add(key);
    deduped.push(entry);
  });
  saveUploadHistory(deduped);
};

const archiveCurrentOverrides = (type: ReportType, periods: UsagePeriod[]) => {
  const snapshots: UploadHistoryEntry[] = [];
  periods.forEach((period) => {
    const existing = loadOverride(type, period);
    if (existing) {
      snapshots.push({
        id: `prev-${type}-${period}-${existing.uploadedAt ?? Date.now()}`,
        type,
        period,
        filename: existing.filename,
        uploadedAt: existing.uploadedAt ?? new Date().toISOString(),
      });
    }
  });
  recordHistoryEntries(snapshots);
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

const getLatestOverride = (type: ReportType): StoredOverride | null => {
  const overrides = ALL_PERIODS.map((p) => loadOverride(type, p)).filter(Boolean) as StoredOverride[];
  if (!overrides.length) return null;
  return overrides.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
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
  const memberOverride = loadOverride('members', period) ?? getLatestOverride('members');
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
    creators: Array<{ name: string; email: string; designs: number; published?: number; shared?: number; viewed?: number; schoolName?: string; schoolId?: string; cluster?: string }>;
  }>();

  const timeSeriesMap = new Map<string, number>();

  const periodFieldCandidates = ['ultima atividade', 'ltima atividade', 'last activity', 'periodo', 'period'];
  const schoolNameFieldCandidates = ['escola', 'school', 'organizacao', 'organization', 'instituicao', 'institution', 'campus', 'org name', 'organizational unit'];
  const schoolIdFieldCandidates = ['escola id', 'escolaid', 'school id', 'id escola', 'school'];
  const emailFieldCandidates = ['e-mail', 'email', 'usuario', 'user email', 'user'];
  const designsCreatedFields = ['designs criados', 'designs created', 'created designs', 'total designs'];
  const designsPublishedFields = ['designs publicados', 'designs published', 'publicado', 'publicados', 'published designs'];
  const linksSharedFields = ['links compartilhados', 'compartilhados', 'links shared', 'shared links', 'links compartilhado', 'shared'];
  const viewsFields = ['designs visualizados', 'visualizacoes', 'views', 'visualizações'];

  members.forEach((row) => {
    let email = findField(row, emailFieldCandidates);
    if (!email) {
      const emailCandidate = Object.values(row).find((value) => typeof value === 'string' && value.includes('@'));
      email = emailCandidate ?? '';
    }
    const designsCreated = parseNumber(findField(row, designsCreatedFields));
    const designsPublished = parseNumber(findField(row, designsPublishedFields));
    const shared = parseNumber(findField(row, linksSharedFields));
    const views = parseNumber(findField(row, viewsFields));
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
      name: findField(row, ['membro', 'member', 'nome', 'name', 'usuario']),
      email,
      designs: designsCreated,
      published: designsPublished,
      shared,
      viewed: views,
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
    topCreators: creators.sort((a, b) => b.designs - a.designs).slice(0, 50),
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
  const modelOverride = loadOverride('models', period) ?? getLatestOverride('models');
  const rows = await parseCsv(
    MODEL_FILE_MAP[period] ?? MODEL_FILE_MAP[DEFAULT_USAGE_PERIOD],
    modelOverride?.text
  );
  return rows
    .map((row) => ({
      modelName: findField(row, ['modelo', 'template', 'nome do modelo', 'nome do template']),
      owner: findField(row, ['titular', 'owner', 'proprietario']),
      uses: parseNumber(findField(row, ['usadas', 'usos', 'uses'])),
      published: parseNumber(findField(row, ['publicado', 'publicados', 'published'])),
      shared: parseNumber(findField(row, ['compartilhados', 'compartilhado', 'shared'])),
    }))
    .filter((model) => model.modelName)
    .sort((a, b) => b.uses - a.uses)
    .slice(0, 10);
};

export const uploadMemberReport = async (file: File, period: UsagePeriod | 'all' = 'all', rawText?: string) => {
  const text = rawText ?? await file.text();
  const uploadedAt = new Date().toISOString();
  const targets = period === 'all' ? ALL_PERIODS : [period];
  archiveCurrentOverrides('members', targets);
  recordHistoryEntries(
    targets.map((p) => ({
      id: `members-${p}-${uploadedAt}`,
      type: 'members',
      period: p,
      filename: file.name,
      uploadedAt,
    }))
  );
  targets.forEach((p) =>
    saveOverride('members', p, {
      text,
      filename: file.name,
      uploadedAt,
      period: p,
    })
  );
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('canva-upload-refresh'));
  }
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
  archiveCurrentOverrides('models', targets);
  recordHistoryEntries(
    targets.map((p) => ({
      id: `models-${p}-${uploadedAt}`,
      type: 'models',
      period: p,
      filename: file.name,
      uploadedAt,
    }))
  );
  targets.forEach((p) =>
    saveOverride('models', p, {
      text,
      filename: file.name,
      uploadedAt,
      period: p,
    })
  );
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('canva-upload-refresh'));
  }
};
