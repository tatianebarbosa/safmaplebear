export type TicketStatus = 'Pendente' | 'Em andamento' | 'Resolvido';
export type Agente = 'Tati' | 'Rafha' | 'Ingrid' | 'João' | 'Jaque' | 'Jessika' | 'Fernanda';
export type Role = 'Agent' | 'Coordinator' | 'Admin';

export interface Ticket {
  id: string;              // "#258209"
  agente: Agente;          // responsável atual
  diasAberto: number;      // p/ badge de SLA
  status: TicketStatus;
  observacao: string;
  createdAt: string;       // ISO
  updatedAt: string;       // ISO
  dueDate?: string;        // ISO (vencimento)
  watchers?: (Agente | 'Coordinator' | 'Admin')[]; // quem recebe alerta
  tags?: string[];
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