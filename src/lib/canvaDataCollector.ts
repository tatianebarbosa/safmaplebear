// @ts-nocheck
import Papa from 'papaparse';
import { readFileAsUtf8 } from './fileUtils';

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

type StoredUpload = {
  data: CanvaData;
  filename: string;
  uploadedAt: string;
};

const UPLOAD_STORAGE_KEY = 'canva_upload_snapshot';

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

export class CanvaDataCollector {
  private async parseCsv(path: string, delimiter?: string): Promise<Array<Record<string, string>>> {
    const response = await fetch(path);
    if (!response.ok) {
      return [];
    }
    const text = await response.text();
    const detectedDelimiter =
      delimiter ??
      (text.includes('\t') ? '\t' : text.includes(';') ? ';' : text.includes(',') ? ',' : ';');
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

  private async parseCsvText(text: string, delimiter?: string): Promise<Array<Record<string, string>>> {
    const detectedDelimiter =
      delimiter ??
      (text.includes('\t') ? '\t' : text.includes(';') ? ';' : text.includes(',') ? ',' : ';');
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
    };
  }

  async summarizeCsvContent(text: string): Promise<CanvaData | null> {
    const rows = await this.parseCsvText(text);
    return this.buildCanvaData(rows);
  }

  async obterDadosRecentes(): Promise<CanvaData | null> {
    const uploaded = this.loadUploadSnapshot();
    if (uploaded?.data) {
      return uploaded.data;
    }

    const rows = await this.parseCsv('/data/relatorio_canva_30_dias.csv');
    return this.buildCanvaData(rows);
  }

  async aplicarUploadCsv(
    file: File,
    usuario: string = 'Upload local'
  ): Promise<{ data: CanvaData; previous?: CanvaData | null }> {
    const text = await readFileAsUtf8(file);
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
    });

    return { data, previous };
  }
}

export const canvaCollector = new CanvaDataCollector();
