// @ts-nocheck
import Papa from 'papaparse';

export interface KitMarca {
  nome: string;
  aplicado: string;
  criado: string;
  ultimaAtualizacao: string;
}

export interface CanvaData {
  totalPessoas: number;
  designsCriados: number;
  designsCriadosCrescimento: number;
  membrosAtivos: number;
  membrosAtivosCrescimento: number;
  totalPublicado: number;
  totalCompartilhado: number;
  totalPublicadoCrescimento?: number;
  totalCompartilhadoCrescimento?: number;
  administradores: number;
  alunos: number;
  professores: number;
  totalKits: number;
  kits?: KitMarca[];
  dataAtualizacao: string;
  horaAtualizacao: string;
  timestamp: number;
  mudancas?: {
    totalPessoas?: number;
    designsCriados?: number;
    membrosAtivos?: number;
    administradores?: number;
    professores?: number;
    alunos?: number;
  };
}

export interface CanvaHistorico {
  id: string;
  totalPessoas: number;
  designsCriados: number;
  membrosAtivos: number;
  totalPublicado: number;
  totalCompartilhado: number;
  administradores: number;
  alunos: number;
  professores: number;
  totalKits: number;
  dataAtualizacao: string;
  horaAtualizacao: string;
  timestamp: number;
  mudancas?: {
    totalPessoas?: number;
    designsCriados?: number;
    membrosAtivos?: number;
    administradores?: number;
    professores?: number;
    alunos?: number;
  };
  data?: Pick<CanvaData, 'totalPessoas' | 'designsCriados'>;
  usuarioAlteracao: string;
  descricaoAlteracao: string;
  uploadType?: 'members' | 'models';
}

type RawHistoryEntry = {
  id: number;
  timestamp: string;
  tipo: string;
  descricao: string;
  usuario: string;
  status: string;
  metadados?: {
    periodo?: string;
    usuarios_afetados?: number;
  };
};

const parseNumber = (value?: string) => {
  if (!value) return 0;
  const normalized = value.replace(/\./g, '').replace(',', '.').trim();
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const mapRowValue = (row: Record<string, string>, key: string) => {
  const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
  const normalizedKey = normalize(key);
  if (row[key]) return row[key];
  const entry = Object.entries(row).find(([candidate]) => normalize(candidate) === normalizedKey);
  return entry ? entry[1] : '';
};

const UPLOAD_STORAGE_KEY = 'canva_upload_snapshot';
const UPLOAD_HISTORY_KEY = 'canva_upload_history';

type StoredUpload = {
  data: CanvaData;
  filename: string;
  uploadedAt: string;
  rawCsv?: string;
};

type UploadHistoryEntry = {
  id: string;
  filename: string;
  uploadedAt: string;
  totalPessoas: number;
  designsCriados: number;
  reverted?: boolean;
  revertedAt?: string;
  revertReason?: string;
  uploadType?: 'members' | 'models';
};

export class CanvaDataCollector {
  private async parseCsv(
    path: string,
    delimiter?: string
  ): Promise<Array<Record<string, string>>> {
    const response = await fetch(path);
    if (!response.ok) {
      return [];
    }
    const text = await response.text();
    const detectedDelimiter =
      delimiter ?? (text.includes(';') ? ';' : text.includes(',') ? ',' : ';');
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      delimiter: detectedDelimiter,
    });
    return parsed.data.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key.trim(), (value ?? '').trim()])
      )
    );
  }

  private async parseCsvText(
    text: string,
    delimiter?: string
  ): Promise<Array<Record<string, string>>> {
    const detectedDelimiter =
      delimiter ?? (text.includes(';') ? ';' : text.includes(',') ? ',' : ';');
    const parsed = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      delimiter: detectedDelimiter,
    });
    return parsed.data.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(([key, value]) => [key.trim(), (value ?? '').trim()])
      )
    );
  }

  private getStorage(): Storage | null {
    if (typeof window === 'undefined') return null;
    return window.localStorage ?? null;
  }

  private loadUploadSnapshot(): StoredUpload | null {
    const storage = this.getStorage();
    if (!storage) return null;
    const raw = storage.getItem(UPLOAD_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUpload;
    } catch (error) {
      console.warn('Falha ao ler snapshot local', error);
      return null;
    }
  }

  private saveUploadSnapshot(snapshot: StoredUpload) {
    const storage = this.getStorage();
    if (!storage) return;
    try {
      storage.setItem(UPLOAD_STORAGE_KEY, JSON.stringify(snapshot));
    } catch (error) {
      console.warn('Falha ao salvar snapshot local', error);
    }
  }

  private loadUploadHistory(): UploadHistoryEntry[] {
    const storage = this.getStorage();
    if (!storage) return [];
    const raw = storage.getItem(UPLOAD_HISTORY_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as UploadHistoryEntry[];
    } catch (error) {
      console.warn('Falha ao ler historico local', error);
      return [];
    }
  }

  private saveUploadHistory(history: UploadHistoryEntry[]) {
    const storage = this.getStorage();
    if (!storage) return;
    try {
      storage.setItem(UPLOAD_HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('Falha ao salvar historico local', error);
    }
  }

  private buildCanvaData(rows: Array<Record<string, string>>): CanvaData | null {
    if (!rows.length) return null;

    const totalPessoas = rows.length;
    const designsCriados = rows.reduce(
      (sum, row) => sum + parseNumber(mapRowValue(row, 'Designs criados')),
      0
    );
    const designsPublicados = rows.reduce(
      (sum, row) => sum + parseNumber(mapRowValue(row, 'Designs publicados')),
      0
    );
    const linksCompartilhados = rows.reduce(
      (sum, row) => sum + parseNumber(mapRowValue(row, 'Links compartilhados')),
      0
    );
    const roles = rows.reduce(
      (acc, row) => {
        const role = mapRowValue(row, 'Função').toLowerCase();
        if (role.includes('administrador')) acc.administradores += 1;
        else if (role.includes('professor')) acc.professores += 1;
        else acc.alunos += 1;
        return acc;
      },
      { administradores: 0, professores: 0, alunos: 0 }
    );

    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0];
    const formattedTime = now.toTimeString().split(' ')[0];

    return {
      totalPessoas,
      designsCriados,
      designsCriadosCrescimento: 0,
      membrosAtivos: totalPessoas,
      membrosAtivosCrescimento: 0,
      totalPublicado: designsPublicados,
      totalCompartilhado: linksCompartilhados,
      totalPublicadoCrescimento: 0,
      totalCompartilhadoCrescimento: 0,
      administradores: roles.administradores,
      alunos: roles.alunos,
      professores: roles.professores,
      totalKits: 0,
      kits: [],
      dataAtualizacao: formattedDate,
      horaAtualizacao: formattedTime,
      timestamp: now.getTime(),
      mudancas: {
        totalPessoas: 0,
        designsCriados: 0,
        membrosAtivos: 0,
        administradores: roles.administradores,
        professores: roles.professores,
        alunos: roles.alunos,
      },
      data: {
        totalPessoas,
        designsCriados,
      },
    };
  }

  private async fetchHistory(): Promise<RawHistoryEntry[]> {
    // Primeiro tenta um endpoint dinâmico (se existir) e depois faz fallback para o arquivo estático.
    try {
      const apiResponse = await fetch(`/api/canva/history?ts=${Date.now()}`, { cache: 'no-store' });
      if (apiResponse.ok) {
        return apiResponse.json();
      }
    } catch (error) {
      console.warn('Falha ao buscar histórico dinâmico, usando fallback estático.', error);
    }

    const cacheBuster = Date.now();
    const response = await fetch(`/data/canva_history.json?t=${cacheBuster}`, {
      cache: 'no-store',
    });
    if (!response.ok) return [];
    return response.json();
  }

  private async fetchRemoteUploadHistory(): Promise<UploadHistoryEntry[]> {
    try {
      const response = await fetch(`/api/canva/upload-history?ts=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) return [];
      return response.json();
    } catch (error) {
      console.warn('Falha ao buscar histórico de uploads compartilhado; usando apenas local.', error);
      return [];
    }
  }

  async coletarDadosCanva(periodoFiltro?: string): Promise<CanvaData | null> {
    return this.obterDadosRecentes();
  }

  async registrarAlteracao(
    descricao: string,
    usuario: string,
    tipo: string = 'Manual',
    metadados: any = {}
  ): Promise<any> {
    console.info('Simulação de registro de alteração:', {
      descricao,
      usuario,
      tipo,
      metadados,
    });
    return { success: true };
  }

  async reverterAlteracao(historicoId: string, reason?: string): Promise<void> {
    const history = this.loadUploadHistory();
    const idx = history.findIndex((h) => h.id === historicoId);
    if (idx === -1) {
      throw new Error('Apenas uploads manuais podem ser revertidos.');
    }
    const entry = history[idx];
    history[idx] = {
      ...entry,
      reverted: true,
      revertedAt: new Date().toISOString(),
      revertReason: reason ?? 'Sem justificativa informada',
    };
    this.saveUploadHistory(history);
  }

  async summarizeCsvContent(text: string): Promise<CanvaData | null> {
    const rows = await this.parseCsvText(text);
    return this.buildCanvaData(rows);
  }

  registrarHistoricoUploadManual(entry: { filename: string; totalPessoas: number; designsCriados: number; uploadedAt?: string; uploadType?: 'members' | 'models' }) {
    const history = this.loadUploadHistory();
    history.unshift({
      id: `upload-${Date.now()}`,
      filename: entry.filename,
      uploadedAt: entry.uploadedAt ?? new Date().toISOString(),
      totalPessoas: entry.totalPessoas,
      designsCriados: entry.designsCriados,
      uploadType: entry.uploadType,
    });
    this.saveUploadHistory(history);
  }

  async obterHistorico(): Promise<CanvaHistorico[]> {
    const raw = await this.fetchHistory();
    const remoteUploadHistory = await this.fetchRemoteUploadHistory();
    const localUploadHistory = this.loadUploadHistory();
    // Mescla remoto + local e remove duplicados por id (remoto prevalece)
    const mergedUploadHistoryMap = new Map<string, UploadHistoryEntry>();
    [...remoteUploadHistory, ...localUploadHistory].forEach((item) => {
      if (!mergedUploadHistoryMap.has(item.id)) {
        mergedUploadHistoryMap.set(item.id, item);
      }
    });
    const uploadHistory = Array.from(mergedUploadHistoryMap.values());

    const uploadEntries: CanvaHistorico[] = uploadHistory.map((upload) => {
      const date = new Date(upload.uploadedAt);
      const admins = Math.floor(upload.totalPessoas * 0.05);
      const professores = Math.floor(upload.totalPessoas * 0.12);
      const alunos = upload.totalPessoas - admins - professores;
      return {
        id: upload.id,
        totalPessoas: upload.totalPessoas,
        designsCriados: upload.designsCriados,
        membrosAtivos: upload.totalPessoas,
        totalPublicado: upload.designsCriados,
        totalCompartilhado: upload.designsCriados,
        administradores: admins,
        alunos,
        professores,
        totalKits: 0,
        dataAtualizacao: date.toISOString().split('T')[0],
        horaAtualizacao: date.toTimeString().split(' ')[0],
        timestamp: date.getTime(),
        mudancas: {
          totalPessoas: upload.totalPessoas,
          designsCriados: upload.designsCriados,
          membrosAtivos: upload.totalPessoas,
          administradores: admins,
          professores,
          alunos,
        },
        data: {
          totalPessoas: upload.totalPessoas,
          designsCriados: upload.designsCriados,
        },
        usuarioAlteracao: 'Upload manual',
        descricaoAlteracao: `Upload CSV${upload.uploadType === 'members' ? ' (membros)' : upload.uploadType === 'models' ? ' (modelos)' : ''}: ${upload.filename}`,
        uploadType: upload.uploadType,
      };
    });

    const historicoPadrao = raw.map((entry) => {
      const totalPessoas = entry.metadados?.usuarios_afetados ?? 0;
      const date = new Date(entry.timestamp);
      const admins = Math.floor(totalPessoas * 0.05);
      const professores = Math.floor(totalPessoas * 0.12);
      const alunos = totalPessoas - admins - professores;
      return {
        id: entry.id.toString(),
        totalPessoas,
        designsCriados: totalPessoas,
        membrosAtivos: totalPessoas,
        totalPublicado: totalPessoas,
        totalCompartilhado: totalPessoas,
        administradores: admins,
        alunos,
        professores,
        totalKits: 0,
        dataAtualizacao: date.toISOString().split('T')[0],
        horaAtualizacao: date.toISOString().split('T')[1].replace('Z', ''),
        timestamp: date.getTime(),
        mudancas: {
          totalPessoas,
          designsCriados: totalPessoas,
          membrosAtivos: totalPessoas,
          administradores: admins,
          professores,
          alunos,
        },
        data: {
          totalPessoas,
          designsCriados: totalPessoas,
        },
        usuarioAlteracao: entry.usuario,
        descricaoAlteracao: entry.descricao,
      };
    });

    return [...uploadEntries, ...historicoPadrao].sort((a, b) => b.timestamp - a.timestamp);
  }

  async obterDadosRecentes(): Promise<CanvaData | null> {
    const uploaded = this.loadUploadSnapshot();
    if (uploaded?.data) {
      return uploaded.data;
    }

    const rows = await this.parseCsv('/data/relatorio_canva_30_dias.csv');
    return this.buildCanvaData(rows);
  }

  async obterMetricasPorTipo(tipo: 'pessoas' | 'designs' | 'membros' | 'kits'): Promise<any> {
    if (tipo === 'pessoas') {
      const data = await this.obterDadosRecentes();
      return data
        ? { total: data.totalPessoas, ativos: data.membrosAtivos, administradores: data.administradores }
      : { total: 0, ativos: 0, administradores: 0 };
    }
    return {};
  }

  async aplicarUploadCsv(file: File, usuario: string = 'Upload local'): Promise<{ data: CanvaData; previous?: CanvaData | null }> {
    const text = await file.text();
    const rows = await this.parseCsvText(text);
    const data = this.buildCanvaData(rows);
    if (!data) {
      throw new Error('Arquivo CSV vazio ou inválido.');
    }

    const previousSnapshot = this.loadUploadSnapshot();
    const previous = previousSnapshot?.data ?? null;

    this.saveUploadSnapshot({
      data,
      filename: file.name,
      uploadedAt: new Date().toISOString(),
      rawCsv: text.slice(0, 1000),
    });

    const history = this.loadUploadHistory();
    history.unshift({
      id: `upload-${Date.now()}`,
      filename: file.name,
      uploadedAt: new Date().toISOString(),
      totalPessoas: data.totalPessoas,
      designsCriados: data.designsCriados,
    });
    this.saveUploadHistory(history);

    await this.registrarAlteracao('Upload manual de relatório CSV', usuario, 'Upload CSV', {
      filename: file.name,
      totalPessoas: data.totalPessoas,
      designsCriados: data.designsCriados,
    });

    return { data, previous };
  }

  obterUltimoUploadInfo(): { filename: string; uploadedAt: string } | null {
    const snapshot = this.loadUploadSnapshot();
    if (!snapshot) return null;
    return { filename: snapshot.filename, uploadedAt: snapshot.uploadedAt };
  }
}

export const canvaCollector = new CanvaDataCollector();
