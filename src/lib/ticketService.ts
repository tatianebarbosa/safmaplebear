import type { Ticket, TicketStatus, TicketPriority, Agente } from "@/types/tickets";

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

export async function fetchTicketsFromApi(endpoint?: string): Promise<Ticket[]> {
  const sources = [
    endpoint,
    import.meta.env.VITE_TICKETS_ENDPOINT,
    "/api/tickets",
    "/data/tickets.json",
  ].filter(Boolean) as string[];

  for (const url of sources) {
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      if (!response.ok) continue;

      const ct = response.headers.get("content-type") || "";
      if (!ct.toLowerCase().includes("application/json")) {
        continue;
      }

      const data = (await response.json()) as RemoteTicket[] | { tickets: RemoteTicket[] };
      const list = Array.isArray(data) ? data : data.tickets;
      if (!Array.isArray(list)) continue;
      return list.map(normalizeTicket);
    } catch (error) {
      console.error("Falha ao buscar tickets em", url, error);
    }
  }

  return [];
}
