import type { Ticket, TicketStatus, TicketPriority, Agente } from "@/types/tickets";
import { apiCall, apiPost, apiPut } from "./apiClient";

type RemoteTicket = {
  id: string | number;
  agente?: string;
  responsavel?: string;
  diasAberto?: number | string;
  status?: TicketStatus | string;
  observacao?: string;
  createdAt?: string;
  updatedAt?: string;
  resolvedAt?: string | null;
  dueDate?: string;
  priority?: TicketPriority | string;
  slaDias?: number;
  assigneeEmail?: string;
  notes?: any[];
};

const normalizeId = (id: string | number) => {
  const text = String(id).trim();
  return text.startsWith("#") ? text : `#${text}`;
};

const toAgente = (value?: string): Agente => {
  const known: Record<string, Agente> = {
    joao: "Joao",
    ingrid: "Ingrid",
    rafha: "Rafha",
    rafhael: "Rafhael",
    tati: "Tati",
    tatiane: "Tatiane",
    jaque: "Jaque",
    jaqueline: "Jaqueline",
    jessika: "Jessika",
    yasmin: "Yasmin",
    fernanda: "Fernanda",
  };
  if (!value) return "Joao";
  const key = value.toLowerCase();
  return known[key] ?? "Joao";
};

const normalizeTicket = (remote: RemoteTicket): Ticket => {
  const now = new Date().toISOString();
  const status = (remote.status as TicketStatus) || "Pendente";
  const diasAberto = Number(remote.diasAberto ?? 0);
  const createdAt = remote.createdAt ?? now;
  const dueDate = remote.dueDate ?? null;
  const agente = toAgente(remote.agente || remote.responsavel);

  return {
    id: normalizeId(remote.id),
    agente,
    responsavel: remote.responsavel || remote.agente || agente,
    diasAberto: Number.isNaN(diasAberto) ? 0 : diasAberto,
    status: (["Pendente", "Em andamento", "Resolvido"] as string[]).includes(status)
      ? (status as TicketStatus)
      : "Pendente",
    observacao: remote.observacao?.trim() || "Sem observao registrada",
    createdBy: remote.responsavel || remote.agente || agente,
    createdAt,
    updatedAt: remote.updatedAt ?? now,
    resolvedAt: remote.resolvedAt ?? (status === "Resolvido" ? now : null),
    dueDate: dueDate ?? undefined,
    priority: remote.priority as TicketPriority,
    watchers: ["Coordinator", agente],
    slaDias: remote.slaDias,
    assigneeEmail: remote.assigneeEmail,
    notes: (remote.notes as any[]) || [],
  };
};

export async function fetchTicketsFromApi(): Promise<Ticket[]> {
  const url = "/api/tickets";
  try {
    const response = await apiCall<RemoteTicket[]>(url, { method: "GET" });
    if (response.ok && response.data) {
      return response.data.map(normalizeTicket);
    }
    console.error("Falha ao buscar tickets na API:", response.error);
    return [];
  } catch (error) {
    console.error("Erro de rede ao buscar tickets:", error);
    return [];
  }
}

export async function saveTicketToApi(ticket: Partial<Ticket>): Promise<Ticket | null> {
  const url = "/api/tickets";
  const method = ticket.id ? "PUT" : "POST";
  
  // O backend espera o ID para PUT, mas para POST o ID é gerado no frontend
  const body = {
    ...ticket,
    id: ticket.id || `#${Date.now()}`, // Garante um ID para POST
  };

  try {
    const response = await apiCall<RemoteTicket>(url, {
      method,
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    });

    if (response.ok && response.data) {
      return normalizeTicket(response.data);
    }
    console.error(`Falha ao salvar ticket (${method}) na API:`, response.error);
    return null;
  } catch (error) {
    console.error("Erro de rede ao salvar ticket:", error);
    return null;
  }
}

