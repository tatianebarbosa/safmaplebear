export type TicketStatus = "Pendente" | "Em andamento" | "Resolvido";
export type Agente =
  | "Joao"
  | "Ingrid"
  | "Rafha"
  | "Rafhael"
  | "Tati"
  | "Tatiane"
  | "Jaque"
  | "Jaqueline"
  | "Jessika"
  | "Yasmin"
  | "Fernanda";
export type Role = "Agent" | "Coordinator" | "Admin";
export type TicketPriority = "Baixa" | "Media" | "Alta" | "Critica";

export interface TicketNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface TicketHistoryEntry {
  id: string;
  author: string;
  action: string;
  timestamp: string;
  before: Partial<Ticket>;
  after: Partial<Ticket>;
}

export interface Ticket {
  id: string; // "#258209"
  agente: Agente; // responsavel atual
  responsavel?: string; // nome exibido do responsavel (pode vir do backend)
  diasAberto: number; // p/ badge de SLA
  status: TicketStatus;
  observacao: string;
  createdBy?: string; // nome do usu?rio logado que criou
  createdAt: string; // ISO
  updatedAt: string; // ISO
  resolvedAt?: string | null; // ISO quando resolvido, null se aberto
  dueDate?: string; // ISO (vencimento)
  priority?: TicketPriority;
  watchers?: (Agente | "Coordinator" | "Admin")[]; // quem recebe alerta
  tags?: string[];
  slaDias?: number;
  assigneeEmail?: string;
  notes?: TicketNote[];
  history?: TicketHistoryEntry[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  agente?: Agente;
}

export interface SiteConfig {
  title: string;
  menus: {
    name: string;
    url: string;
  }[];
}
