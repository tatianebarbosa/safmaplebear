import Papa from "papaparse";

export type CanvaDataType = "models" | "creators" | "general";

export type CanvaYearlyRecord = {
  id: string;
  year: number;
  month: number | null;
  periodId?: string;
  templateId?: string;
  templateName?: string;
  creatorEmail?: string;
  creatorName?: string;
  schoolId?: string;
  schoolName?: string;
  cluster?: string;
  designsCreated: number;
  designsPublished: number;
  designsShared: number;
  dataImportacao: string;
  arquivoOrigem: string;
  dataType: CanvaDataType;
};

export type ColumnMapping = {
  year?: string;
  month?: string;
  periodId?: string;
  templateId?: string;
  templateName?: string;
  creatorName?: string;
  creatorEmail?: string;
  schoolId?: string;
  schoolName?: string;
  cluster?: string;
  designsCreated?: string;
  designsPublished?: string;
  designsShared?: string;
};

export type PeriodFilter =
  | { type: "year" }
  | { type: "h1" }
  | { type: "h2" }
  | { type: "custom"; startMonth: number; endMonth: number };

export type YearlyFilters = {
  baseYear: number;
  comparisonYear?: number | null;
  period: PeriodFilter;
  cluster?: string;
  school?: string;
  view: "models" | "creators" | "schools";
};

export type ImportOptions = {
  csvText: string;
  fileName: string;
  year: number;
  dataType: CanvaDataType;
  periodLabel: string;
  periodRange?: { startMonth: number; endMonth: number };
  replaceExisting?: boolean;
  columnMapping: ColumnMapping;
  saveMappingAsDefault?: boolean;
};

export type ImportResult = {
  inserted: number;
  replaced: number;
  headers: string[];
};

export type ImportHistoryEntry = {
  id: string;
  filename: string;
  uploadedAt: string;
  year: number;
  periodLabel: string;
  startMonth: number;
  endMonth: number;
  dataType: CanvaDataType;
  replaceExisting: boolean;
  rows: number;
  deletedAt?: string | null;
  deletedReason?: string | null;
};

export type YearlyDataset = {
  records: CanvaYearlyRecord[];
  history: ImportHistoryEntry[];
  defaultMapping?: ColumnMapping;
};

const STORAGE_KEY = "canva_yearly_usage_v1";
const HISTORY_KEY = "canva_yearly_history_v1";
const MAPPING_KEY = "canva_yearly_mapping_v1";

const hasWindow = typeof window !== "undefined";

const randomId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `rec-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalizeHeader = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const parseNumber = (value: unknown) => {
  if (value === null || value === undefined) return 0;
  const normalized = String(value).replace(/\./g, "").replace(",", ".");
  const parsed = parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const monthFromLabel = (value?: string | number | null) => {
  if (value === null || value === undefined) return null;
  const raw = String(value).trim();

  // Date formats: yyyy-mm-dd or dd/mm/yyyy (pick the month part)
  const isoLike = raw.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (isoLike) {
    const month = Number(isoLike[2]);
    if (month >= 1 && month <= 12) return month;
  }

  const dayFirst = raw.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (dayFirst) {
    const first = Number(dayFirst[1]);
    const second = Number(dayFirst[2]);
    const month = second <= 12 ? second : first;
    if (month >= 1 && month <= 12) return month;
  }

  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric >= 1 && numeric <= 12) return numeric;

  const normalized = normalizeHeader(String(value));
  const matches = normalized.match(/\d{1,2}/g);
  if (matches) {
    for (const match of matches) {
      const candidate = Number(match);
      if (candidate >= 1 && candidate <= 12) return candidate;
    }
  }

  const monthNames: Record<string, number> = {
    jan: 1,
    janeiro: 1,
    fev: 2,
    fevereiro: 2,
    mar: 3,
    marco: 3,
    abr: 4,
    abril: 4,
    mai: 5,
    maio: 5,
    jun: 6,
    junho: 6,
    jul: 7,
    julho: 7,
    ago: 8,
    agosto: 8,
    set: 9,
    setembro: 9,
    out: 10,
    outubro: 10,
    nov: 11,
    novembro: 11,
    dez: 12,
    dezembro: 12,
  };

  const entry = Object.entries(monthNames).find(([key]) => normalized.includes(key));
  return entry ? entry[1] : null;
};

const detectDelimiter = (text: string) => (text.includes(";") ? ";" : text.includes(",") ? "," : ";");

const parseCsvRows = (csvText: string) => {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    delimiter: detectDelimiter(csvText),
  });
  return parsed.data.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([key, value]) => [key, (value ?? "").toString().trim()])
    )
  );
};

export const extractCsvHeaders = (csvText: string): string[] => {
  const parsed = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
    delimiter: detectDelimiter(csvText),
    preview: 1,
  });
  return parsed.meta.fields ?? [];
};

const findValue = (row: Record<string, string>, mappingKey?: string) => {
  if (!mappingKey) return "";
  const normalizedTarget = normalizeHeader(mappingKey);
  const direct = row[mappingKey];
  if (direct !== undefined) return direct;
  const entry = Object.entries(row).find(([key]) => normalizeHeader(key) === normalizedTarget);
  return entry ? entry[1] : "";
};

const guessFromCandidates = (headers: string[], candidates: string[]) => {
  const normalizedHeaders = headers.map((h) => ({ original: h, normalized: normalizeHeader(h) }));
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeHeader(candidate);
    const match = normalizedHeaders.find(
      (header) =>
        header.normalized === normalizedCandidate ||
        header.normalized.includes(normalizedCandidate) ||
        normalizedCandidate.includes(header.normalized)
    );
    if (match) return match.original;
  }
  return undefined;
};

const DEFAULT_MAPPING: ColumnMapping = {
  templateName: "Modelo",
  templateId: "ID do modelo",
  creatorName: "Titular",
  creatorEmail: "E-mail",
  designsCreated: "Usadas",
  designsPublished: "Publicado",
  designsShared: "Compartilhados",
};

export const suggestMapping = (headers: string[], previous?: ColumnMapping): ColumnMapping => {
  const base = Object.keys(previous ?? {}).length ? (previous as ColumnMapping) : DEFAULT_MAPPING;
  const headerExists = (value?: string) => {
    if (!value) return false;
    const normalized = normalizeHeader(value);
    return headers.some((header) => normalizeHeader(header) === normalized);
  };
  const ensure = (key: keyof ColumnMapping, candidates: string[]) => {
    const current = base[key];
    if (current && headerExists(current)) return current;
    return guessFromCandidates(headers, candidates);
  };

  return {
    year: ensure("year", ["ano", "year"]),
    month: ensure("month", ["mes", "mês", "month", "periodo", "período"]),
    periodId: ensure("periodId", ["periodo id", "período id", "etiqueta", "period id"]),
    templateId: ensure("templateId", ["id modelo", "template id", "id template"]),
    templateName: ensure("templateName", ["modelo", "template", "nome do modelo", "layout"]),
    creatorName: ensure("creatorName", ["criador", "owner", "autor", "titular", "membro"]),
    creatorEmail: ensure("creatorEmail", ["email", "e-mail", "mail", "contato"]),
    schoolId: ensure("schoolId", ["escola id", "id escola", "school id"]),
    schoolName: ensure("schoolName", ["escola", "school", "campus", "organizacao"]),
    cluster: ensure("cluster", ["cluster", "grupo"]),
    designsCreated: ensure("designsCreated", ["designs criados", "usadas", "usos", "uses", "created"]),
    designsPublished: ensure("designsPublished", ["publicado", "publicados", "published"]),
    designsShared: ensure("designsShared", ["compartilhado", "compartilhados", "shared", "links"]),
  };
};

type SeedSeries = {
  id: string;
  year: number;
  monthly: number[];
  dataType: CanvaDataType;
  name?: string;
  email?: string;
  schoolId?: string;
  schoolName?: string;
  cluster?: string;
  templateId?: string;
  templateName?: string;
};

const buildYearlySeed = (): YearlyDataset => {
  const importedAt = "2025-12-02T00:00:00.000Z";
  const seedRecord = (params: {
    id: string;
    year: number;
    month: number;
    dataType: CanvaDataType;
    designsCreated: number;
    creatorName?: string;
    creatorEmail?: string;
    schoolId?: string;
    schoolName?: string;
    cluster?: string;
    templateId?: string;
    templateName?: string;
  }): CanvaYearlyRecord => ({
    id: params.id,
    year: params.year,
    month: params.month,
    periodId: `${params.year}-${String(params.month).padStart(2, "0")}-${params.dataType}`,
    templateId: params.templateId,
    templateName: params.templateName,
    creatorName: params.creatorName,
    creatorEmail: params.creatorEmail,
    schoolId: params.schoolId,
    schoolName: params.schoolName,
    cluster: params.cluster,
    designsCreated: params.designsCreated,
    designsPublished: Math.max(0, Math.round(params.designsCreated * 0.68)),
    designsShared: Math.max(0, Math.round(params.designsCreated * 0.52)),
    dataImportacao: importedAt,
    arquivoOrigem: "seed-dataset",
    dataType: params.dataType,
  });

  const creatorSeries: SeedSeries[] = [
    {
      id: "ana-lima-2025",
      year: 2025,
      dataType: "general",
      name: "Ana Lima",
      email: "ana.lima@maplebear.com",
      schoolId: "school-jardins",
      schoolName: "Maple Bear Jardins",
      cluster: "Sudeste",
      monthly: [18, 20, 22, 25, 24, 26, 28, 30, 32, 34, 36, 38],
    },
    {
      id: "bruno-costa-2025",
      year: 2025,
      dataType: "general",
      name: "Bruno Costa",
      email: "bruno.costa@maplebear.com",
      schoolId: "school-savassi",
      schoolName: "Maple Bear Savassi",
      cluster: "Sudeste",
      monthly: [15, 17, 19, 18, 20, 21, 23, 24, 25, 27, 29, 30],
    },
    {
      id: "carla-duarte-2025",
      year: 2025,
      dataType: "general",
      name: "Carla Duarte",
      email: "carla.duarte@maplebear.com",
      schoolId: "school-recife",
      schoolName: "Maple Bear Recife",
      cluster: "Nordeste",
      monthly: [12, 14, 15, 16, 18, 19, 20, 21, 22, 24, 26, 27],
    },
    {
      id: "diego-martins-2025",
      year: 2025,
      dataType: "general",
      name: "Diego Martins",
      email: "diego.martins@maplebear.com",
      schoolId: "school-campinas",
      schoolName: "Maple Bear Campinas",
      cluster: "Sudeste",
      monthly: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 22],
    },
    {
      id: "equipe-maple-2025",
      year: 2025,
      dataType: "general",
      name: "Equipe Maple",
      email: "time.canva@maplebear.com",
      schoolId: "school-central",
      schoolName: "Equipe Central",
      cluster: "Centro-Oeste",
      monthly: [8, 9, 10, 10, 11, 12, 13, 14, 15, 15, 16, 18],
    },
    {
      id: "ana-lima-2024",
      year: 2024,
      dataType: "general",
      name: "Ana Lima",
      email: "ana.lima@maplebear.com",
      schoolId: "school-jardins",
      schoolName: "Maple Bear Jardins",
      cluster: "Sudeste",
      monthly: [12, 13, 14, 15, 15, 16, 17, 18, 19, 20, 21, 22],
    },
    {
      id: "bruno-costa-2024",
      year: 2024,
      dataType: "general",
      name: "Bruno Costa",
      email: "bruno.costa@maplebear.com",
      schoolId: "school-savassi",
      schoolName: "Maple Bear Savassi",
      cluster: "Sudeste",
      monthly: [10, 11, 12, 12, 13, 14, 15, 15, 16, 17, 18, 18],
    },
    {
      id: "carla-duarte-2024",
      year: 2024,
      dataType: "general",
      name: "Carla Duarte",
      email: "carla.duarte@maplebear.com",
      schoolId: "school-recife",
      schoolName: "Maple Bear Recife",
      cluster: "Nordeste",
      monthly: [9, 9, 10, 11, 11, 12, 13, 13, 14, 15, 16, 17],
    },
    {
      id: "diego-martins-2024",
      year: 2024,
      dataType: "general",
      name: "Diego Martins",
      email: "diego.martins@maplebear.com",
      schoolId: "school-campinas",
      schoolName: "Maple Bear Campinas",
      cluster: "Sudeste",
      monthly: [8, 8, 9, 9, 10, 10, 11, 11, 12, 13, 13, 14],
    },
    {
      id: "equipe-maple-2024",
      year: 2024,
      dataType: "general",
      name: "Equipe Maple",
      email: "time.canva@maplebear.com",
      schoolId: "school-central",
      schoolName: "Equipe Central",
      cluster: "Centro-Oeste",
      monthly: [6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11],
    },
  ];

  const modelSeries: SeedSeries[] = [
    {
      id: "mdl-kit-aulas-2025",
      year: 2025,
      dataType: "models",
      templateId: "mdl-kit-aulas",
      templateName: "Kit Volta as Aulas",
      schoolId: "school-jardins",
      schoolName: "Maple Bear Jardins",
      cluster: "Sudeste",
      monthly: [12, 14, 15, 16, 16, 18, 18, 20, 22, 24, 26, 28],
    },
    {
      id: "mdl-reuniao-pais-2025",
      year: 2025,
      dataType: "models",
      templateId: "mdl-reuniao",
      templateName: "Convite Reuniao de Pais",
      schoolId: "school-recife",
      schoolName: "Maple Bear Recife",
      cluster: "Nordeste",
      monthly: [10, 11, 12, 12, 13, 13, 14, 14, 15, 16, 17, 18],
    },
    {
      id: "mdl-avaliacao-2025",
      year: 2025,
      dataType: "models",
      templateId: "mdl-avaliacao",
      templateName: "Ficha de Avaliacao",
      schoolId: "school-campinas",
      schoolName: "Maple Bear Campinas",
      cluster: "Sudeste",
      monthly: [8, 9, 9, 10, 10, 11, 12, 12, 13, 14, 15, 16],
    },
    {
      id: "mdl-social-2025",
      year: 2025,
      dataType: "models",
      templateId: "mdl-social",
      templateName: "Post Instagram Evento",
      schoolId: "school-savassi",
      schoolName: "Maple Bear Savassi",
      cluster: "Sudeste",
      monthly: [9, 10, 11, 11, 12, 12, 13, 14, 15, 16, 17, 18],
    },
    {
      id: "mdl-kit-aulas-2024",
      year: 2024,
      dataType: "models",
      templateId: "mdl-kit-aulas",
      templateName: "Kit Volta as Aulas",
      schoolId: "school-jardins",
      schoolName: "Maple Bear Jardins",
      cluster: "Sudeste",
      monthly: [8, 9, 10, 10, 10, 11, 12, 12, 13, 14, 15, 16],
    },
    {
      id: "mdl-reuniao-pais-2024",
      year: 2024,
      dataType: "models",
      templateId: "mdl-reuniao",
      templateName: "Convite Reuniao de Pais",
      schoolId: "school-recife",
      schoolName: "Maple Bear Recife",
      cluster: "Nordeste",
      monthly: [7, 8, 8, 9, 9, 9, 10, 10, 11, 12, 12, 13],
    },
    {
      id: "mdl-avaliacao-2024",
      year: 2024,
      dataType: "models",
      templateId: "mdl-avaliacao",
      templateName: "Ficha de Avaliacao",
      schoolId: "school-campinas",
      schoolName: "Maple Bear Campinas",
      cluster: "Sudeste",
      monthly: [6, 6, 7, 7, 8, 8, 8, 9, 9, 10, 10, 11],
    },
    {
      id: "mdl-social-2024",
      year: 2024,
      dataType: "models",
      templateId: "mdl-social",
      templateName: "Post Instagram Evento",
      schoolId: "school-savassi",
      schoolName: "Maple Bear Savassi",
      cluster: "Sudeste",
      monthly: [6, 7, 7, 8, 8, 9, 9, 9, 10, 10, 11, 12],
    },
  ];

  const records: CanvaYearlyRecord[] = [...creatorSeries, ...modelSeries].flatMap((serie) =>
    serie.monthly.map((designsCreated, index) =>
      seedRecord({
        id: `seed-${serie.id}-${serie.year}-${index + 1}`,
        year: serie.year,
        month: index + 1,
        dataType: serie.dataType,
        designsCreated,
        creatorName: serie.name,
        creatorEmail: serie.email,
        schoolId: serie.schoolId,
        schoolName: serie.schoolName,
        cluster: serie.cluster,
        templateId: serie.templateId,
        templateName: serie.templateName,
      })
    )
  );

  const countRows = (year: number, dataType: CanvaDataType) =>
    records.filter((record) => record.year === year && record.dataType === dataType).length;

  const history: ImportHistoryEntry[] = [
    {
      id: "seed-history-2025-general",
      filename: "seed_uso_geral_2025.csv",
      uploadedAt: importedAt,
      year: 2025,
      periodLabel: "Ano completo",
      startMonth: 1,
      endMonth: 12,
      dataType: "general",
      replaceExisting: true,
      rows: countRows(2025, "general"),
      deletedAt: null,
      deletedReason: null,
    },
    {
      id: "seed-history-2025-models",
      filename: "seed_modelos_2025.csv",
      uploadedAt: importedAt,
      year: 2025,
      periodLabel: "Ano completo",
      startMonth: 1,
      endMonth: 12,
      dataType: "models",
      replaceExisting: true,
      rows: countRows(2025, "models"),
      deletedAt: null,
      deletedReason: null,
    },
    {
      id: "seed-history-2024-general",
      filename: "seed_uso_geral_2024.csv",
      uploadedAt: importedAt,
      year: 2024,
      periodLabel: "Ano completo",
      startMonth: 1,
      endMonth: 12,
      dataType: "general",
      replaceExisting: true,
      rows: countRows(2024, "general"),
      deletedAt: null,
      deletedReason: null,
    },
    {
      id: "seed-history-2024-models",
      filename: "seed_modelos_2024.csv",
      uploadedAt: importedAt,
      year: 2024,
      periodLabel: "Ano completo",
      startMonth: 1,
      endMonth: 12,
      dataType: "models",
      replaceExisting: true,
      rows: countRows(2024, "models"),
      deletedAt: null,
      deletedReason: null,
    },
  ];

  return { records, history, defaultMapping: DEFAULT_MAPPING };
};

const YEARLY_SEED = buildYearlySeed();

const loadRecords = (): CanvaYearlyRecord[] => {
  if (!hasWindow) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CanvaYearlyRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("[canvaYearlyRepository] Falha ao ler registros, usando vazio", error);
    return [];
  }
};

const saveRecords = (records: CanvaYearlyRecord[]) => {
  if (!hasWindow) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.warn("[canvaYearlyRepository] Falha ao salvar registros", error);
  }
};

const loadHistory = (): ImportHistoryEntry[] => {
  if (!hasWindow) return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ImportHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn("[canvaYearlyRepository] Falha ao ler historico, usando vazio", error);
    return [];
  }
};

const saveHistory = (entries: ImportHistoryEntry[]) => {
  if (!hasWindow) return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, 24)));
  } catch (error) {
    console.warn("[canvaYearlyRepository] Falha ao salvar historico", error);
  }
};

export const getDeletedHistory = () => loadHistory().filter((h) => h.deletedAt);

export const deleteImportEntry = (id: string, reason: string) => {
  const history = loadHistory();
  const entry = history.find((h) => h.id === id);
  if (!entry) return { removed: 0 };

  const start = entry.startMonth ?? 1;
  const end = entry.endMonth ?? 12;

  const records = loadRecords();
  const filteredRecords = records.filter((record) => {
    if (record.dataType !== entry.dataType) return true;
    if (record.year !== entry.year) return true;
    const month = record.month ?? 0;
    if (month === 0) return !(start === 1 && end === 12);
    return !(month >= start && month <= end);
  });

  saveRecords(filteredRecords);

  const updatedHistory = history.map((h) =>
    h.id === id
      ? { ...h, deletedAt: new Date().toISOString(), deletedReason: reason }
      : h
  );
  saveHistory(updatedHistory);

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("canva-yearly-data-updated"));
  }

  return { removed: records.length - filteredRecords.length };
};

const loadDefaultMapping = (): ColumnMapping | undefined => {
  if (!hasWindow) return undefined;
  try {
    const raw = window.localStorage.getItem(MAPPING_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as ColumnMapping;
  } catch (error) {
    console.warn("[canvaYearlyRepository] Falha ao ler mapping", error);
    return undefined;
  }
};

const saveDefaultMapping = (mapping: ColumnMapping) => {
  if (!hasWindow) return;
  try {
    window.localStorage.setItem(MAPPING_KEY, JSON.stringify(mapping));
  } catch (error) {
    console.warn("[canvaYearlyRepository] Falha ao salvar mapping", error);
  }
};

const ensureSeededYearlyData = () => {
  if (!hasWindow) return;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const hasRecords =
      !!raw &&
      (() => {
        try {
          const parsed = JSON.parse(raw);
          return Array.isArray(parsed) && parsed.length > 0;
        } catch {
          return false;
        }
      })();

    if (hasRecords) return;

    saveRecords(YEARLY_SEED.records);
    saveHistory(YEARLY_SEED.history);
    if (YEARLY_SEED.defaultMapping) {
      saveDefaultMapping(YEARLY_SEED.defaultMapping);
    }
  } catch (error) {
    console.warn("[canvaYearlyRepository] Falha ao semear dados locais", error);
  }
};

const toRecord = (
  row: Record<string, string>,
  mapping: ColumnMapping,
  opts: {
    year: number;
    dataType: CanvaDataType;
    periodLabel: string;
    periodRange?: { startMonth: number; endMonth: number };
    fileName: string;
  }
): CanvaYearlyRecord => {
  const monthFromMap = findValue(row, mapping.month);
  const monthFromPeriod = findValue(row, mapping.periodId);
  const month =
    monthFromLabel(monthFromMap) ??
    monthFromLabel(monthFromPeriod) ??
    (opts.periodRange
      ? opts.periodRange.startMonth
      : null);

  const recordYear = parseInt(findValue(row, mapping.year), 10) || opts.year;

  return {
    id: randomId(),
    year: recordYear,
    month,
    periodId: findValue(row, mapping.periodId) || `${recordYear}-${month ?? "yy"}-${opts.dataType}`,
    templateId: findValue(row, mapping.templateId) || undefined,
    templateName: findValue(row, mapping.templateName) || undefined,
    creatorName: findValue(row, mapping.creatorName) || undefined,
    creatorEmail: findValue(row, mapping.creatorEmail) || undefined,
    schoolId: findValue(row, mapping.schoolId) || undefined,
    schoolName: findValue(row, mapping.schoolName) || undefined,
    cluster: findValue(row, mapping.cluster) || undefined,
    designsCreated: parseNumber(findValue(row, mapping.designsCreated)),
    designsPublished: parseNumber(findValue(row, mapping.designsPublished)),
    designsShared: parseNumber(findValue(row, mapping.designsShared)),
    dataImportacao: new Date().toISOString(),
    arquivoOrigem: opts.fileName,
    dataType: opts.dataType,
  };
};

export const importYearlyCsv = async (options: ImportOptions): Promise<ImportResult> => {
  const headers = extractCsvHeaders(options.csvText);
  const rows = parseCsvRows(options.csvText);
  const mapped = rows.map((row) => toRecord(row, options.columnMapping, options));

  const existing = loadRecords();
  let replaced = 0;

  const matchesPeriod = (record: CanvaYearlyRecord) => {
    if (record.year !== options.year) return false;
    if (record.dataType !== options.dataType) return false;
    if (!options.periodRange) return true;
    if (record.month === null) return true;
    return (
      record.month >= options.periodRange.startMonth &&
      record.month <= options.periodRange.endMonth
    );
  };

  let merged = existing;
  if (options.replaceExisting) {
    const before = merged.length;
    merged = merged.filter((record) => !matchesPeriod(record));
    replaced = before - merged.length;
  }

  const updatedRecords = [...mapped, ...merged];
  saveRecords(updatedRecords);

  const history = [
    {
      id: randomId(),
      filename: options.fileName,
      uploadedAt: new Date().toISOString(),
      year: options.year,
      periodLabel: options.periodLabel,
      startMonth: options.periodRange?.startMonth ?? 1,
      endMonth: options.periodRange?.endMonth ?? 12,
      dataType: options.dataType,
      replaceExisting: Boolean(options.replaceExisting),
      rows: mapped.length,
      deletedAt: null,
      deletedReason: null,
    },
    ...loadHistory(),
  ];
  saveHistory(history);

  if (options.saveMappingAsDefault) {
    saveDefaultMapping(options.columnMapping);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("canva-yearly-data-updated"));
  }

  return {
    inserted: mapped.length,
    replaced,
    headers,
  };
};

export const loadYearlyDataset = (): YearlyDataset => {
  if (!hasWindow) {
    return YEARLY_SEED;
  }

  ensureSeededYearlyData();

  const records = loadRecords();
  const history = loadHistory();
  const defaultMapping = loadDefaultMapping();

  if (!records.length) {
    return YEARLY_SEED;
  }

  return { records, history, defaultMapping };
};

const periodRangeFromFilter = (period: PeriodFilter): { startMonth: number; endMonth: number } => {
  if (period.type === "h1") return { startMonth: 1, endMonth: 6 };
  if (period.type === "h2") return { startMonth: 7, endMonth: 12 };
  if (period.type === "custom") return { startMonth: period.startMonth, endMonth: period.endMonth };
  return { startMonth: 1, endMonth: 12 };
};

const isWithinRange = (month: number | null, range: { startMonth: number; endMonth: number }) => {
  if (month === null) return range.startMonth === 1 && range.endMonth === 12;
  return month >= range.startMonth && month <= range.endMonth;
};

const viewTypesForFilter = (view: YearlyFilters["view"]): Set<CanvaDataType> => {
  if (view === "models") return new Set<CanvaDataType>(["models", "general"]);
  if (view === "creators") return new Set<CanvaDataType>(["creators", "general"]);
  return new Set<CanvaDataType>(["models", "creators", "general"]);
};

const normalizeText = (value?: string | null) =>
  (value ?? "")
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

const normalizeSchool = (value?: string | null) => normalizeText(value);
const normalizeCluster = (value?: string | null) => normalizeText(value);

const filterRecords = (
  records: CanvaYearlyRecord[],
  year: number,
  filters: YearlyFilters
): CanvaYearlyRecord[] => {
  const range = periodRangeFromFilter(filters.period);
  const allowedTypes = viewTypesForFilter(filters.view);
  const selectedSchool = filters.school ? normalizeSchool(filters.school) : null;
  const selectedCluster = filters.cluster ? normalizeCluster(filters.cluster) : null;
  return records.filter((record) => {
    if (record.year !== year) return false;
    if (!allowedTypes.has(record.dataType)) return false;
    if (
      selectedCluster &&
      normalizeCluster(record.cluster ?? "Sem cluster") !== selectedCluster
    )
      return false;
    if (
      selectedSchool &&
      normalizeSchool(record.schoolName ?? "Sem escola") !== selectedSchool
    )
      return false;
    return isWithinRange(record.month, range);
  });
};

const isDeletedCreator = (record: CanvaYearlyRecord) => {
  const name = (record.creatorName ?? "").toLowerCase();
  return (
    name.includes("usuario excluido") ||
    name.includes("usuário excluído") ||
    name.includes("user deleted") ||
    name.includes("deleted user")
  );
};

const sumTotals = (records: CanvaYearlyRecord[]) => {
  const aggregate = records.reduce(
    (acc, record) => {
      acc.created += record.designsCreated;
      acc.published += record.designsPublished;
      acc.shared += record.designsShared;
      return acc;
    },
    { created: 0, published: 0, shared: 0 }
  );
  const engagement = aggregate.published ? aggregate.shared / aggregate.published : 0;
  return { ...aggregate, engagement };
};

export type MonthlySeriesPoint = { month: number; label: string; base: number; comparison: number };
export type ComparisonRow = {
  name: string;
  secondary?: string;
  base: number;
  comparison: number;
  delta: number;
  deltaPct: number;
};

export type CreatorRankingRow = {
  name: string;
  email: string;
  base: number;
  comparison?: number;
  deltaPct?: number;
};

export type YearlyAnalytics = {
  baseTotals: ReturnType<typeof sumTotals>;
  comparisonTotals: ReturnType<typeof sumTotals>;
  monthlySeries: MonthlySeriesPoint[];
  topGrowthMonths: Array<MonthlySeriesPoint & { delta: number }>;
  modelsBase: Array<{ name: string; secondary?: string; value: number }>;
  modelsPrevious: Array<{ name: string; secondary?: string; value: number }>;
  modelsComparable: ComparisonRow[];
  modelsNew: Array<{ name: string; secondary?: string; value: number }>;
  modelsDiscontinued: Array<{ name: string; secondary?: string; value: number }>;
  topCreators: CreatorRankingRow[];
  topSchools: ComparisonRow[];
};

const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const groupComparison = (
  base: CanvaYearlyRecord[],
  comparison: CanvaYearlyRecord[],
  keySelector: (record: CanvaYearlyRecord) => string,
  nameSelector: (record: CanvaYearlyRecord) => { name: string; secondary?: string }
): ComparisonRow[] => {
  const baseMap = new Map<string, { total: number; sample?: CanvaYearlyRecord }>();
  base.forEach((record) => {
    const key = keySelector(record);
    if (!key) return;
    const current = baseMap.get(key) ?? { total: 0, sample: record };
    current.total += record.designsCreated;
    current.sample = current.sample ?? record;
    baseMap.set(key, current);
  });

  const comparisonMap = new Map<string, number>();
  comparison.forEach((record) => {
    const key = keySelector(record);
    if (!key) return;
    comparisonMap.set(key, (comparisonMap.get(key) ?? 0) + record.designsCreated);
  });

  const keys = new Set([...baseMap.keys(), ...comparisonMap.keys()]);
  const rows: ComparisonRow[] = [];
  keys.forEach((key) => {
    const baseEntry = baseMap.get(key);
    const comparisonEntry = comparisonMap.get(key) ?? 0;
    if (!baseEntry && !comparisonEntry) return;
    const identity = baseEntry?.sample ?? base.find((item) => keySelector(item) === key);
    const { name, secondary } = identity ? nameSelector(identity) : { name: key };
    const baseTotal = baseEntry?.total ?? 0;
    const delta = baseTotal - comparisonEntry;
    const deltaPct = comparisonEntry ? (delta / comparisonEntry) * 100 : 0;
    rows.push({
      name,
      secondary,
      base: baseTotal,
      comparison: comparisonEntry,
      delta,
      deltaPct,
    });
  });

  return rows.sort((a, b) => b.base - a.base);
};

const buildCreatorRanking = (
  base: CanvaYearlyRecord[],
  comparison: CanvaYearlyRecord[]
): CreatorRankingRow[] => {
  const baseMap = new Map<
    string,
    { base: number; name: string; email: string }
  >();

  base.forEach((record) => {
    const identity = record.creatorEmail || record.creatorName || "";
    const normalizedKey = normalizeHeader(identity);
    if (!normalizedKey) return;
    const current = baseMap.get(normalizedKey) ?? {
      base: 0,
      name: record.creatorName || record.creatorEmail || "Criador sem nome",
      email: record.creatorEmail || record.creatorName || "",
    };
    current.base += record.designsCreated;
    if (!current.name && record.creatorName) current.name = record.creatorName;
    if (!current.email && record.creatorEmail) current.email = record.creatorEmail;
    baseMap.set(normalizedKey, current);
  });

  const comparisonMap = new Map<string, number>();
  comparison.forEach((record) => {
    const identity = record.creatorEmail || record.creatorName || "";
    const normalizedKey = normalizeHeader(identity);
    if (!normalizedKey) return;
    comparisonMap.set(
      normalizedKey,
      (comparisonMap.get(normalizedKey) ?? 0) + record.designsCreated
    );
  });

  const rows: CreatorRankingRow[] = [];
  baseMap.forEach((entry, key) => {
    const comparisonTotal = comparisonMap.get(key);
    const deltaPct =
      typeof comparisonTotal === "number" && comparisonTotal > 0
        ? ((entry.base - comparisonTotal) / comparisonTotal) * 100
        : undefined;

    rows.push({
      name: entry.name,
      email: entry.email,
      base: entry.base,
      comparison: comparisonTotal,
      deltaPct,
    });
  });

  return rows.sort((a, b) => b.base - a.base);
};

export const computeYearlyAnalytics = (
  records: CanvaYearlyRecord[],
  filters: YearlyFilters
): YearlyAnalytics => {
  const range = periodRangeFromFilter(filters.period);
  const baseRecords = filterRecords(records, filters.baseYear, filters);
  const comparisonYear = filters.comparisonYear ?? null;
  const comparisonRecords = comparisonYear ? filterRecords(records, comparisonYear, filters) : [];

  const baseTotals = sumTotals(baseRecords);
  const comparisonTotals = sumTotals(comparisonRecords);

  const monthlySeries: MonthlySeriesPoint[] = monthLabels
    .map((label, index) => {
      const month = index + 1;
      if (!isWithinRange(month, range)) return null;
      const baseValue = baseRecords
        .filter((record) => record.month === month)
        .reduce((sum, record) => sum + record.designsCreated, 0);
      const comparisonValue = comparisonRecords
        .filter((record) => record.month === month)
        .reduce((sum, record) => sum + record.designsCreated, 0);
      return { month, label, base: baseValue, comparison: comparisonValue };
    })
    .filter(Boolean) as MonthlySeriesPoint[];

  const topGrowthMonths = monthlySeries
    .map((point) => ({ ...point, delta: point.base - point.comparison }))
    .filter((point) => point.delta !== 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 5);

  const baseModels = baseRecords.filter((r) => r.dataType === "models");
  const previousModels = comparisonRecords.filter((r) => r.dataType === "models");

  const keyForModel = (record: CanvaYearlyRecord) =>
    (record.templateId && record.templateId.trim()) ||
    (record.templateName && normalizeHeader(record.templateName)) ||
    "";

  const aggregateByKey = (models: CanvaYearlyRecord[]) => {
    const map = new Map<
      string,
      { total: number; name: string; secondary?: string }
    >();
    models.forEach((record) => {
      const key = keyForModel(record);
      if (!key) return;
      const current = map.get(key) ?? {
        total: 0,
        name: record.templateName ?? "Modelo sem nome",
        secondary: record.templateId ?? undefined,
      };
      current.total += record.designsCreated;
      if (!current.secondary && record.templateId) current.secondary = record.templateId;
      if (!current.name && record.templateName) current.name = record.templateName;
      map.set(key, current);
    });
    return map;
  };

  const baseMap = aggregateByKey(baseModels);
  const prevMap = aggregateByKey(previousModels);

  const comparableKeys = Array.from(baseMap.keys()).filter((key) => prevMap.has(key));
  const modelsComparable: ComparisonRow[] = comparableKeys.map((key) => {
    const base = baseMap.get(key)!;
    const prev = prevMap.get(key)!;
    const delta = base.total - prev.total;
    const deltaPct = prev.total ? (delta / prev.total) * 100 : 0;
    return {
      name: base.name,
      secondary: base.secondary,
      base: base.total,
      comparison: prev.total,
      delta,
      deltaPct,
    };
  });

  const modelsNew = Array.from(baseMap.entries())
    .filter(([key]) => !prevMap.has(key))
    .map(([, value]) => ({ name: value.name, secondary: value.secondary, value: value.total }));

  const modelsDiscontinued = Array.from(prevMap.entries())
    .filter(([key]) => !baseMap.has(key))
    .map(([, value]) => ({ name: value.name, secondary: value.secondary, value: value.total }));

  const modelsBase = Array.from(baseMap.values())
    .map((value) => ({ name: value.name, secondary: value.secondary, value: value.total }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);

  const modelsPrevious = Array.from(prevMap.values())
    .map((value) => ({ name: value.name, secondary: value.secondary, value: value.total }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 20);

  const comparableSorted = modelsComparable.sort((a, b) => b.base - a.base).slice(0, 20);

  const topCreators = buildCreatorRanking(
    baseRecords.filter((r) => (r.creatorEmail || r.creatorName) && !isDeletedCreator(r)),
    comparisonRecords.filter((r) => (r.creatorEmail || r.creatorName) && !isDeletedCreator(r))
  ).slice(0, 20);

  const topSchools = groupComparison(
    baseRecords,
    comparisonRecords,
    (record) => record.schoolName || "Sem escola",
    (record) => ({
      name: record.schoolName ?? "Sem escola",
      secondary: record.cluster,
    })
  ).slice(0, 10);

  return {
    baseTotals,
    comparisonTotals,
    monthlySeries,
    topGrowthMonths,
    modelsBase,
    modelsPrevious,
    modelsComparable: comparableSorted,
    modelsNew,
    modelsDiscontinued,
    topCreators,
    topSchools,
  };
};

export const listClusters = (records: CanvaYearlyRecord[]) => {
  const values = new Set<string>();
  records.forEach((record) => {
    if (record.cluster) values.add(record.cluster);
  });
  return Array.from(values).sort();
};

export const listSchools = (records: CanvaYearlyRecord[]) => {
  const values = new Set<string>();
  records.forEach((record) => {
    if (record.schoolName) values.add(record.schoolName);
  });
  return Array.from(values).sort();
};

export const listYears = (records: CanvaYearlyRecord[]) => {
  const values = new Set<number>();
  records.forEach((record) => values.add(record.year));
  const sorted = Array.from(values).sort((a, b) => b - a);
  if (sorted.length === 0) {
    const current = new Date().getFullYear();
    return [current, current - 1];
  }
  if (sorted.length === 1) {
    return [sorted[0], sorted[0] - 1];
  }
  return sorted;
};
