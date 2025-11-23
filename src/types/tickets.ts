export type TicketStatus = "Pendente" | "Em andamento" | "Resolvido";
export type Agente = "Tati" | "Rafha" | "Ingrid" | "Joao" | "Joǜo" | "Jaque" | "Jessika" | "Fernanda";
export type Role = "Agent" | "Coordinator" | "Admin";
export type TicketPriority = "Baixa" | "Media" | "Alta" | "Critica";

export interface TicketNote {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Ticket {
  id: string; // "#258209"
  agente: Agente; // responsavel atual
  diasAberto: number; // p/ badge de SLA
  status: TicketStatus;
  createdBy: string; // nome do usuario logado que criou
  observacao: string;
  createdAt: string; // ISO
  resolvedAt: string | null; // ISO quando resolvido, null se aberto
  updatedAt: string; // ISO
  dueDate?: string; // ISO (vencimento)
  priority?: TicketPriority;
  watchers?: (Agente | "Coordinator" | "Admin")[]; // quem recebe alerta
  tags?: string[];
  notes?: TicketNote[];
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
