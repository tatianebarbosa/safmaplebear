import Papa from 'papaparse';
import { getMaxLicensesPerSchool } from '@/config/licenseLimits';
import {
  School,
  LicenseUser,
  SchoolCanvaStats,
  SchoolCardView
} from '@/types/safData';

const FRANCHISING_CSV_PATH = '/data/Franchising.csv';
const LICENSE_CSV_PATHS = ['/data/usuarios_public.csv', '/data/licencas_canva.csv'];

const CSV_OPTIONS = {
  header: true,
  delimiter: ';',
  skipEmptyLines: true
};

const COMPLIANT_DOMAINS = [
  'maplebear.com.br',
  'co.maplebear.com.br',
  'mbcentral.com.br',
  'sebsa.com.br',
  'seb.com.br'
];

const MAPLE_BEAR_CORE_DOMAINS = ['maplebear.com.br', 'mbcentral.com.br'];

const domainMatches = (domain: string, allowed: string): boolean => {
  return domain === allowed || domain.endsWith(`.${allowed}`);
};

const isCorporateDomain = (domain: string): boolean => {
  return COMPLIANT_DOMAINS.some(valid => domainMatches(domain, valid));
};

const isMapleBearDomain = (domain: string): boolean => {
  if (!domain) return false;
  return (
    MAPLE_BEAR_CORE_DOMAINS.some(valid => domainMatches(domain, valid)) ||
    domain.includes('maplebear') ||
    domain.includes('mbcentral')
  );
};

const hasMapleBearSchoolIdentifier = (localPart: string): boolean => {
  const normalized = (localPart || '').toLowerCase();
  return /(?:^|[.\\-_])(maplebear|mb)[a-z0-9]{2,}/.test(normalized);
};

type CsvRecord = Record<string, string>;

const normalizeLabel = (value?: string | null): string => {
  if (!value) return '';
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
};

const normalizeKey = (value?: string | null): string => {
  return normalizeLabel(value).replace(/[^a-z0-9\s]/g, '');
};

const buildFieldMap = (fields: (string | undefined)[]): Map<string, string> => {
  const map = new Map<string, string>();
  fields.forEach(field => {
    if (field) {
      map.set(normalizeLabel(field), field);
    }
  });
  return map;
};

const getField = (record: CsvRecord, fieldMap: Map<string, string>, label: string): string => {
  const normalized = normalizeLabel(label);
  const key = fieldMap.get(normalized);
  return key ? (record[key] ?? '').trim() : '';
};

const optionalString = (value: string): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const parseNumber = (value: string): number | null => {
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = Number.parseFloat(cleaned);
  return !Number.isFinite(parsed) ? null : Math.round(parsed);
};

const parseDateTime = (value: string): Date | null => {
  if (!value) return null;
  const trimmed = value.trim();
  const brazilianMatch = trimmed.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/
  );
  if (brazilianMatch) {
    const [, day, month, year, hour = '0', minute = '0'] = brazilianMatch;
    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute)
    );
  }

  const iso = new Date(trimmed);
  return Number.isNaN(iso.getTime()) ? null : iso;
};

const CENTRAL_DOMAINS = [
  'maplebear.com.br',
  'mbcentral.com.br'
];

const CENTRAL_KEYWORDS = ['central', 'maps central', 'maple bear central'];

const CENTRAL_SCHOOL_PLACEHOLDER: School = {
  id: 0,
  nome: 'Maple Bear Central',
  carteiraSaf: 'Equipe Central',
  statusEscola: 'Operando',
  tipoEscola: 'Central Corporativa',
  cnpj: '',
  logradouro: 'Av. Central Maple Bear',
  bairro: 'Centro',
  cep: '',
  cidade: 'So Paulo',
  estado: 'SP',
  regiao: 'Sudeste',
  telefone: null,
  outroTelefone: null,
  email: null,
  razaoSocial: 'Maple Bear Educacao Global',
  nomeFantasia: 'Central Maple Bear',
  statusCnpj: '',
  cluster: 'Central',
  statusVisitaLideranca: null,
  performanceMeta: null,
  atualSerie: null,
  avancandoSegmento: null
};

const isCentralUser = (user: LicenseUser): boolean => {
  const normalizedName = normalizeKey(user.escolaNome);
  if (normalizedName) {
    if (CENTRAL_KEYWORDS.some(keyword => normalizedName.includes(keyword))) {
      return true;
    }
  }
  const domain = user.email.split('@')[1]?.toLowerCase() ?? '';
  return CENTRAL_DOMAINS.some(d => domain === d || domain.endsWith(`.${d}`));
};

const fetchCsvText = async (path: string): Promise<string> => {
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`Failed to load CSV from ${path}: ${response.status}`);
  }
  const text = await response.text();
  return text.replace(/^\uFEFF/, '');
};

const fetchCsvTextWithFallback = async (paths: string[]): Promise<{ text: string; path: string }> => {
  let lastError: Error | null = null;
  for (const path of paths) {
    try {
      const text = await fetchCsvText(path);
      return { text, path };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }
  throw lastError ?? new Error(`Failed to load CSV from ${paths.join(', ')}`);
};

export const isEmailCompliant = (email: string): boolean => {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) return false;

  const [localPart, domainRaw] = normalized.split('@');
  const domain = domainRaw ?? '';

  // Domnios corporativos aceitos
  const domainKeywords = ['maplebear', 'mbcentral', 'sebsa', 'seb'];
  if (domainKeywords.some((kw) => domain.includes(kw))) {
    return true;
  }

  // Domnios que comeam com mb + nome da escola (ex: mbmogidascruzes.com.br)
  if (/^mb[a-z0-9.-]{2,}$/.test(domain)) {
    return true;
  }

  // E-mails com identificador da escola no local part (ex: mbmogidascruzes@qualquerdominio)
  if (/^mb[a-z0-9._-]{2,}$/.test(localPart)) {
    return true;
  }

  return false;
};

export const loadFranchisingSchools = async (): Promise<School[]> => {
  const text = await fetchCsvText(FRANCHISING_CSV_PATH);
  const parsed = Papa.parse<CsvRecord>(text, CSV_OPTIONS);
  const fieldMap = buildFieldMap(parsed.meta.fields ?? []);

  return parsed.data
    .map(record => {
      const id = parseNumber(getField(record, fieldMap, 'ID da Escola'));
      if (id === null) return null;

      return {
        id,
        nome: getField(record, fieldMap, 'Nome da Escola') || '',
        carteiraSaf: getField(record, fieldMap, 'Carteira SAF') || '',
        statusEscola: getField(record, fieldMap, 'Status da Escola') || '',
        tipoEscola: getField(record, fieldMap, 'Tipo de Escola') || '',
        cnpj: getField(record, fieldMap, 'CNPJ') || '',
        logradouro: getField(record, fieldMap, 'Logradouro Escola') || '',
        bairro: getField(record, fieldMap, 'Bairro Escola') || '',
        cep: getField(record, fieldMap, 'CEP Escola') || '',
        cidade: getField(record, fieldMap, 'Cidade da Escola') || '',
        estado: getField(record, fieldMap, 'Estado da Escola') || '',
        regiao: getField(record, fieldMap, 'Regiao da Escola') || getField(record, fieldMap, 'Regio da Escola') || '',
        telefone: optionalString(getField(record, fieldMap, 'Telefone de Contato da Escola') || ''),
        outroTelefone: optionalString(getField(record, fieldMap, 'Outro Telefone') || ''),
        email: optionalString(getField(record, fieldMap, 'E-mail da Escola') || ''),
        razaoSocial: getField(record, fieldMap, 'Razao Social') || getField(record, fieldMap, 'Razo Social') || '',
        nomeFantasia: getField(record, fieldMap, 'Nome Fantasia') || '',
        statusCnpj: getField(record, fieldMap, 'Status CNPJ') || '',
        cluster: getField(record, fieldMap, 'Cluster') || '',
        statusVisitaLideranca: optionalString(getField(record, fieldMap, 'Status Visita Lideranca') || getField(record, fieldMap, 'Status Visita Liderana') || ''),
        performanceMeta: optionalString(getField(record, fieldMap, 'Performance da Meta') || ''),
        atualSerie: optionalString(getField(record, fieldMap, 'Atual Serie') || getField(record, fieldMap, 'Atual Srie') || ''),
        avancandoSegmento: optionalString(getField(record, fieldMap, 'Avancando de Segmento') || ''),
        ticketMedio: optionalString(
          getField(record, fieldMap, 'Ticket Medio') ||
            getField(record, fieldMap, 'Ticket Mdio') ||
            getField(record, fieldMap, 'Ticket Mdio') ||
            ''
        ),
        ultimaAtualizacao:
          parseDateTime(
            getField(record, fieldMap, 'Data de Modificacao') ||
              getField(record, fieldMap, 'Data de Modificao') ||
              getField(record, fieldMap, '(No Modificar) Data de Modificao') ||
              ''
          )?.toISOString() || null,
      };
    })
    .filter((school): school is NonNullable<typeof school> => school !== null);
};

export const loadLicenseUsers = async (): Promise<LicenseUser[]> => {
  const { text, path: resolvedPath } = await fetchCsvTextWithFallback(LICENSE_CSV_PATHS);
  const lines = text
    .split(/\r?\n/)
    .map(line => line.replace(/"/g, '').trim())
    .filter(line => line.length > 0);

  if (lines.length <= 1) {
    return [];
  }

  const dataRows = lines.slice(1); // skip header

  const normalizedPath = resolvedPath.toLowerCase();
  if (import.meta.env?.DEV) {
    console.debug('[safDataService] Licencas carregadas de', normalizedPath);
  }

  return dataRows
    .map(line => {
      const cells = line.split(';').map(cell => cell.trim());
      const nameCell = (cells[0] ?? '').toLowerCase();
      const emailCell = (cells[1] ?? '').toLowerCase();
      if (nameCell.includes('nome') && emailCell.includes('e-mail')) {
        return null;
      }

      const email = cells[1] ?? '';
      if (!email) return null;

      const escolaIdRaw = cells[4] ?? '';
      return {
        nome: cells[0] ?? '',
        email,
        funcao: cells[2] ?? '',
        escolaNome: optionalString(cells[3] ?? '') ?? null,
        escolaId: parseNumber(escolaIdRaw) ?? null,
        statusLicenca: optionalString(cells[5] ?? '') || null,
        atualizadoEm: parseDateTime(cells[6] ?? '')
      };
    })
    .filter((user): user is LicenseUser => user !== null);
};

export const calculateSchoolCanvaStats = (
  schoolId: number | 'UNASSIGNED' | 'CENTRAL',
  schoolName: string,
  users: LicenseUser[],
  totalLicenses: number = getMaxLicensesPerSchool()
): SchoolCanvaStats => {
  const totalUsuarios = users.length;
  const foraDaPolitica = users.filter(user => !isEmailCompliant(user.email)).length;
  const basePercent = totalLicenses > 0 ? (totalUsuarios / totalLicenses) * 100 : 0;
  const usoPercentual = Number.isFinite(basePercent) ? Math.min(100, Math.round(basePercent)) : 0;

  return {
    schoolId,
    schoolName,
    totalUsuarios,
    foraDaPolitica,
    totalLicencas: totalLicenses,
    usoPercentual
  };
};

export const buildSchoolCardViews = (
  schools: School[],
  users: LicenseUser[]
): SchoolCardView[] => {
  const schoolsById = new Map<number, School>();
  schools.forEach(school => schoolsById.set(school.id, school));

  type GroupKey = number | 'CENTRAL' | 'UNASSIGNED';
  const usersBySchoolId = new Map<GroupKey, LicenseUser[]>();

  const pushUser = (key: GroupKey, user: LicenseUser) => {
    const bucket = usersBySchoolId.get(key) ?? [];
    bucket.push(user);
    usersBySchoolId.set(key, bucket);
  };

  users.forEach(user => {
    if (user.escolaId === 0 || isCentralUser(user)) {
      pushUser('CENTRAL', user);
      return;
    }

    if (user.escolaId !== null) {
      pushUser(user.escolaId, user);
      return;
    }

    pushUser('UNASSIGNED', user);
  });

  const viewCandidates: SchoolCardView[] = [];

  usersBySchoolId.forEach((groupUsers, key) => {
    if (!groupUsers.length) return;

    let school: School | null = null;
    let schoolId: number | 'CENTRAL' | 'UNASSIGNED' = key;
    let label = 'Usurios sem escola definida';
    let totalLicenses = key === 'CENTRAL' ? Math.max(getMaxLicensesPerSchool(), groupUsers.length) : getMaxLicensesPerSchool();

    if (key === 'CENTRAL') {
      school = CENTRAL_SCHOOL_PLACEHOLDER;
      label = CENTRAL_SCHOOL_PLACEHOLDER.nome;
      schoolId = CENTRAL_SCHOOL_PLACEHOLDER.id;
    } else if (key === 'UNASSIGNED') {
      school = null;
      schoolId = 'UNASSIGNED';
    } else {
      const candidate = schoolsById.get(key);
      if (candidate) {
        school = candidate;
        label = candidate.nome;
      } else {
        schoolId = 'UNASSIGNED';
        school = null;
      }
    }

    const stats = calculateSchoolCanvaStats(
      schoolId,
      label,
      groupUsers,
      totalLicenses
    );

    viewCandidates.push({
      school,
      canva: stats
    });
  });

  const sortedViews = [...viewCandidates].sort((a, b) => b.canva.totalUsuarios - a.canva.totalUsuarios);

  if (import.meta.env?.DEV) {
    console.debug('buildSchoolCardViews', {
      schools: schools.length,
      users: users.length,
      generated: sortedViews.length
    });
  }

  return sortedViews;
};

export const loadSchoolCardViews = async (): Promise<SchoolCardView[]> => {
  const [schools, users] = await Promise.all([
    loadFranchisingSchools(),
    loadLicenseUsers()
  ]);
  return buildSchoolCardViews(schools, users);
};
