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

const mapRowValue = (row: Record<string, string>, key: string) =>
  row[key] ?? row[key.replace('ç', 'c')] ?? row[key.replace('ã', 'a')] ?? '';

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

  private async fetchHistory(): Promise<RawHistoryEntry[]> {
    const response = await fetch('/data/canva_history.json');
    if (!response.ok) return [];
    return response.json();
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

  async reverterAlteracao(historicoId: string): Promise<void> {
    console.info('Simulação de reversão de histórico', historicoId);
  }

  async obterHistorico(): Promise<CanvaHistorico[]> {
    const raw = await this.fetchHistory();
    return raw.map((entry) => {
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
  }

  async obterDadosRecentes(): Promise<CanvaData | null> {
    const rows = await this.parseCsv('/data/relatorio_canva_30_dias.csv');
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
      dataAtualizacao: new Date().toISOString().split('T')[0],
      horaAtualizacao: new Date().toISOString().split('T')[1].replace('Z', ''),
      timestamp: Date.now(),
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

  async obterMetricasPorTipo(tipo: 'pessoas' | 'designs' | 'membros' | 'kits'): Promise<any> {
    if (tipo === 'pessoas') {
      const data = await this.obterDadosRecentes();
      return data
        ? { total: data.totalPessoas, ativos: data.membrosAtivos, administradores: data.administradores }
        : { total: 0, ativos: 0, administradores: 0 };
    }
    return {};
  }
}

export const canvaCollector = new CanvaDataCollector();
