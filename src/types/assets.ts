export type AssetTeam =
  | "SAF"
  | "Marketing"
  | "Acadêmico"
  | "Implantação"
  | "RH"
  | "Eventos"
  | "Jurídico"
  | "Comercial"
  | "Expansão"
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
  | "Concluído"
  | "Não concluído (sem contato / escola indisponível)";

export type AssetOutcome =
  | "Contato realizado, alinhamento concluído"
  | "Contato realizado, pendente retorno da escola"
  | "Contato realizado, pendente ação interna"
  | "Não atendeu"
  | "Número incorreto"
  | "Reagendado";

export interface SafAsset {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
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
  "Acadêmico",
  "Implantação",
  "RH",
  "Eventos",
  "Jurídico",
  "Comercial",
  "Expansão",
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
  "Concluído",
  "Não concluído (sem contato / escola indisponível)",
];

export const ASSET_OUTCOMES: AssetOutcome[] = [
  "Contato realizado, alinhamento concluído",
  "Contato realizado, pendente retorno da escola",
  "Contato realizado, pendente ação interna",
  "Não atendeu",
  "Número incorreto",
  "Reagendado",
];
