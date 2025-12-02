export type AssetTeam =
  | "SAF"
  | "Marketing"
  | "Acadmico"
  | "Implantao"
  | "RH"
  | "Eventos"
  | "Jurdico"
  | "Comercial"
  | "Expanso"
  | "Financeiro"
  | "Outros";

export type AssetChannel =
  | "Ligação telefônica"
  | "E-mail"
  | "Mensagem no ticket"
  | "Mensagem no WhatsApp"
  | "News"
  | "Portal da escola"
  | "Outros";

export type AssetStatus =
  | "Pendente"
  | "Em andamento"
  | "Concludo"
  | "No concludo (sem contato / escola indispon?vel)";

export type AssetOutcome =
  | "Contato realizado, alinhamento concludo"
  | "Contato realizado, pendente retorno da escola"
  | "Contato realizado, pendente ao interna"
  | "No atendeu"
  | "Nmero incorreto"
  | "Reagendado";

export interface SafAsset {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  owners?: string[];
  requesterTeam?: AssetTeam;
  channel?: AssetChannel;
  assetType?: string;
}

export interface AssetContactRecord {
  id: string;
  assetId: string;
  assetName: string;
  schoolId: string;
  schoolName: string;
  assetType: string;
  requesterTeam: AssetTeam;
  safOwner: string;
  channel: AssetChannel;
  status: AssetStatus;
  outcome: AssetOutcome;
  notes?: string;
  contactAt: string;
}

export interface AssetContactFilters {
  status?: AssetStatus | "all";
  channel?: AssetChannel | "all";
  team?: AssetTeam | "all";
  startDate?: string;
  endDate?: string;
  search?: string;
}

export const ASSET_TEAMS: AssetTeam[] = [
  "SAF",
  "Marketing",
  "Acadmico",
  "Implantao",
  "RH",
  "Eventos",
  "Jurdico",
  "Comercial",
  "Expanso",
  "Financeiro",
  "Outros",
];

export const ASSET_CHANNELS: AssetChannel[] = [
  "Ligação telefônica",
  "E-mail",
  "Mensagem no ticket",
  "Mensagem no WhatsApp",
  "News",
  "Portal da escola",
  "Outros",
];

export const ASSET_STATUSES: AssetStatus[] = [
  "Pendente",
  "Em andamento",
  "Concludo",
  "No concludo (sem contato / escola indispon?vel)",
];

export const ASSET_OUTCOMES: AssetOutcome[] = [
  "Contato realizado, alinhamento concludo",
  "Contato realizado, pendente retorno da escola",
  "Contato realizado, pendente ao interna",
  "No atendeu",
  "Nmero incorreto",
  "Reagendado",
];
