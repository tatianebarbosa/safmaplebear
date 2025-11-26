export interface School {
  id: number;
  nome: string;
  carteiraSaf: string;
  statusEscola: string;
  tipoEscola: string;
  cnpj: string;

  logradouro: string;
  bairro: string;
  cep: string;
  cidade: string;
  estado: string;
  regiao: string;

  telefone: string | null;
  outroTelefone: string | null;
  email: string | null;

  razaoSocial: string;
  nomeFantasia: string;
  statusCnpj: string;

  cluster: string;
  statusVisitaLideranca: string | null;
  performanceMeta: string | null;
  atualSerie: string | null;
  avancandoSegmento: string | null;
  ticketMedio?: string | null;
  ultimaAtualizacao?: string | null;
}

export interface LicenseUser {
  nome: string;
  email: string;
  funcao: string;
  escolaNome: string | null;
  escolaId: number | null;
  statusLicenca: string | null;
  atualizadoEm: Date | null;
}

export interface SchoolCanvaStats {
  schoolId: number | 'UNASSIGNED' | 'CENTRAL';
  schoolName: string;
  totalUsuarios: number;
  foraDaPolitica: number;
  totalLicencas: number;
  usoPercentual: number;
}

export interface SchoolCardView {
  school: School | null;
  canva: SchoolCanvaStats;
}
