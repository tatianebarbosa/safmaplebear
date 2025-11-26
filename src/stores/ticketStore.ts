import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Ticket, TicketStatus, Agente, TicketNote, TicketPriority } from "@/types/tickets";
import { addDays, subDays, format } from "date-fns";

interface TicketFilters {
  status?: TicketStatus;
  agente?: Agente;
  search?: string;
  priority?: TicketPriority;
}

interface TicketStore {
  tickets: Ticket[];
  filters: TicketFilters;
  dueLog: Record<string, string[]>;

  // Actions
  setTickets: (tickets: Ticket[]) => void;
  setFilters: (filters: TicketFilters) => void;
  createTicket: (ticket: Omit<Ticket, "createdAt" | "updatedAt" | "resolvedAt">) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  moveTicket: (id: string, newStatus: TicketStatus) => void;
  removeTicket: (id: string) => void;
  addNoteToTicket: (id: string, note: TicketNote) => void;

  // Computed
  getFilteredTickets: () => Ticket[];
  getCriticalTickets: () => Ticket[];
  getOverdueTickets: () => Ticket[];

  // Due notifications
  logDueNotification: (ticketId: string, type: string) => void;
  shouldNotify: (ticketId: string, type: string) => boolean;
}

const DEFAULT_SLA_DAYS = 3;

const agentEmails: Record<Agente, string> = {
  Joao: "joao@mbcentral.com.br",
  Ingrid: "ingrid@mbcentral.com.br",
  Rafha: "rafha@mbcentral.com.br",
  Rafhael: "rafhael@mbcentral.com.br",
  Tati: "tati@mbcentral.com.br",
  Tatiane: "tatiane@mbcentral.com.br",
  Jaque: "jaque@mbcentral.com.br",
  Jaqueline: "jaqueline@mbcentral.com.br",
  Jessika: "jessika@mbcentral.com.br",
  Yasmin: "yasmin@mbcentral.com.br",
  Fernanda: "fernanda@mbcentral.com.br",
};

const calculateCreatedAt = (diasAberto: number): string => {
  return subDays(new Date(), diasAberto).toISOString();
};

const calculateDueDate = (createdAt: string, slaDias?: number) => {
  const sla = slaDias ?? DEFAULT_SLA_DAYS;
  return addDays(new Date(createdAt), sla).toISOString();
};

const normalizeTicketId = (id: string) => (id.startsWith("#") ? id : `#${id}`);

type PendingSeedTicket = {
  id: string;
  agente: Agente;
  diasAberto: number;
  observacao?: string;
  slaDias?: number;
};

// Fila pendente consolidada enviada pela equipe
const pendingSeedTickets: PendingSeedTicket[] = [
  { id: "#261509", agente: "Joao", diasAberto: 9, observacao: "cobrei time mkt novamente 28-10" },
  { id: "#262156", agente: "Joao", diasAberto: 4, observacao: "cobrei Joao teams mkt 28-10" },
  { id: "#262272", agente: "Joao", diasAberto: 3, observacao: "cobrei Isis teams 28-10" },
  { id: "#262862", agente: "Joao", diasAberto: 2, observacao: "cobrei Isis teams 28-10" },
  { id: "#262966", agente: "Joao", diasAberto: 1, observacao: "cobrei Teams Isis 28-10" },
  { id: "#265282", agente: "Joao", diasAberto: 1, observacao: "cobrado Leila teams 28-10" },
  { id: "#265162", agente: "Joao", diasAberto: 3, observacao: "cobrado chamado clickup 28-10" },
  { id: "#265014", agente: "Joao", diasAberto: 4, observacao: "cobrei chamado clickup 28-10" },
  {
    id: "#265475",
    agente: "Joao",
    diasAberto: 5,
    observacao: "cobrei Julio-Jaque, esta verificando com a LEX 28-10 // Cobrado Julio 05/11",
  },
  { id: "#266547", agente: "Ingrid", diasAberto: 34, observacao: "crm" },
  { id: "#266426", agente: "Joao", diasAberto: 35, observacao: "cobrei Leila Teams 28-10" },
  { id: "#267560", agente: "Rafhael", diasAberto: 25, observacao: "Aguardando retorno Visoni" },
  {
    id: "#267771",
    agente: "Yasmin",
    diasAberto: 21,
    observacao: "Julio e Gabriel ja retornaram e ja informei as escolas que foi resolvido, chamado aberto conexia 267722",
  },
  { id: "#267834", agente: "Tatiane", diasAberto: 21, observacao: "Aguardando retorno embalarte" },
  { id: "#267582", agente: "Joao", diasAberto: 22, observacao: "chamado aberto CRM 267582, aguardando retorno" },
  {
    id: "#267827",
    agente: "Joao",
    diasAberto: 22,
    observacao: "aguardando retorno Ana Flavia teams, esta em contato com a Sponte sobre o caso",
  },
  {
    id: "#267569",
    agente: "Joao",
    diasAberto: 22,
    observacao: "aguardando retorno email Voucher 10% e parcelamento 8x unidade Cascavel ticket #267569",
  },
  { id: "#267476", agente: "Joao", diasAberto: 26, observacao: "chamado aberto CRM 267476 sem retorno" },
  { id: "#267127", agente: "Joao", diasAberto: 27, observacao: "chamado aberto CRM 267127, aguardando retorno Isis" },
  { id: "#266617", agente: "Joao", diasAberto: 33, observacao: "chamado aberto CRM cobrando retorno Isis" },
  { id: "#266602", agente: "Joao", diasAberto: 33, observacao: "cobrado chamado CRM 265916" },
  { id: "#308727", agente: "Joao", diasAberto: 0, observacao: "" },
  { id: "#304959", agente: "Joao", diasAberto: 1, observacao: "" },
  { id: "#308212", agente: "Joao", diasAberto: 0, observacao: "" },
  { id: "#308228", agente: "Rafhael", diasAberto: 0, observacao: "" },
  { id: "#308216", agente: "Rafhael", diasAberto: 0, observacao: "" },
  { id: "#304967", agente: "Jaqueline", diasAberto: 1, observacao: "" },
  { id: "#304944", agente: "Jessika", diasAberto: 1, observacao: "" },
  { id: "#274664", agente: "Tatiane", diasAberto: 1, observacao: "" },
  { id: "#300244", agente: "Tatiane", diasAberto: 1, observacao: "" },
  { id: "#305672", agente: "Jaqueline", diasAberto: 1, observacao: "" },
  { id: "#292724", agente: "Joao", diasAberto: 6, observacao: "" },
  { id: "#304970", agente: "Joao", diasAberto: 1, observacao: "" },
  { id: "#304873", agente: "Jessika", diasAberto: 1, observacao: "" },
  { id: "#304949", agente: "Joao", diasAberto: 1, observacao: "" },
  { id: "#304879", agente: "Joao", diasAberto: 1, observacao: "" },
  { id: "#304951", agente: "Joao", diasAberto: 1, observacao: "" },
  { id: "#296495", agente: "Tatiane", diasAberto: 0, observacao: "" },
  { id: "#304922", agente: "Joao", diasAberto: 1, observacao: "" },
  { id: "#304926", agente: "Rafhael", diasAberto: 1, observacao: "" },
  { id: "#304905", agente: "Tatiane", diasAberto: 1, observacao: "" },
  { id: "#274678", agente: "Tatiane", diasAberto: 1, observacao: "" },
  { id: "#268155", agente: "Joao", diasAberto: 19, observacao: "" },
  { id: "#304888", agente: "Yasmin", diasAberto: 1, observacao: "" },
  { id: "#304878", agente: "Jessika", diasAberto: 1, observacao: "" },
  { id: "#289354", agente: "Joao", diasAberto: 8, observacao: "" },
  { id: "#304572", agente: "Tatiane", diasAberto: 6, observacao: "" },
  { id: "#304598", agente: "Joao", diasAberto: 6, observacao: "" },
  { id: "#274637", agente: "Joao", diasAberto: 6, observacao: "" },
  { id: "#289425", agente: "Joao", diasAberto: 7, observacao: "" },
  { id: "#302336", agente: "Tatiane", diasAberto: 6, observacao: "" },
  { id: "#302048", agente: "Joao", diasAberto: 7, observacao: "" },
  { id: "#299813", agente: "Rafhael", diasAberto: 7, observacao: "" },
  { id: "#299183", agente: "Joao", diasAberto: 7, observacao: "" },
  { id: "#267386", agente: "Joao", diasAberto: 7, observacao: "" },
  { id: "#291899", agente: "Tatiane", diasAberto: 7, observacao: "" },
  { id: "#293404", agente: "Joao", diasAberto: 8, observacao: "" },
  { id: "#289454", agente: "Joao", diasAberto: 8, observacao: "" },
  { id: "#290280", agente: "Joao", diasAberto: 8, observacao: "" },
  { id: "#289991", agente: "Jaqueline", diasAberto: 8, observacao: "" },
  { id: "#289605", agente: "Joao", diasAberto: 8, observacao: "" },
  { id: "#289435", agente: "Joao", diasAberto: 8, observacao: "" },
  { id: "#289444", agente: "Joao", diasAberto: 8, observacao: "" },
  { id: "#289338", agente: "Joao", diasAberto: 11, observacao: "" },
  { id: "#289193", agente: "Joao", diasAberto: 11, observacao: "" },
  { id: "#289325", agente: "Rafhael", diasAberto: 11, observacao: "" },
  { id: "#289329", agente: "Tatiane", diasAberto: 11, observacao: "" },
  { id: "#289114", agente: "Joao", diasAberto: 11, observacao: "" },
  { id: "#289111", agente: "Joao", diasAberto: 11, observacao: "" },
  { id: "#282670", agente: "Joao", diasAberto: 12, observacao: "" },
  { id: "#282900", agente: "Tatiane", diasAberto: 12, observacao: "" },
  { id: "#281857", agente: "Joao", diasAberto: 12, observacao: "" },
  { id: "#271625", agente: "Joao", diasAberto: 12, observacao: "" },
  { id: "#283793", agente: "Joao", diasAberto: 12, observacao: "" },
  { id: "#282905", agente: "Joao", diasAberto: 12, observacao: "" },
  { id: "#282875", agente: "Joao", diasAberto: 12, observacao: "" },
  { id: "#279416", agente: "Joao", diasAberto: 13, observacao: "" },
  { id: "#276323", agente: "Joao", diasAberto: 13, observacao: "" },
  { id: "#277156", agente: "Joao", diasAberto: 13, observacao: "" },
  { id: "#276338", agente: "Yasmin", diasAberto: 13, observacao: "" },
  { id: "#272751", agente: "Joao", diasAberto: 14, observacao: "" },
  { id: "#274674", agente: "Joao", diasAberto: 14, observacao: "" },
  { id: "#272748", agente: "Tatiane", diasAberto: 14, observacao: "" },
  { id: "#272771", agente: "Tatiane", diasAberto: 14, observacao: "" },
  { id: "#272765", agente: "Joao", diasAberto: 14, observacao: "" },
  { id: "#271954", agente: "Tatiane", diasAberto: 15, observacao: "" },
  { id: "#271496", agente: "Tatiane", diasAberto: 18, observacao: "" },
  { id: "#267874", agente: "Yasmin", diasAberto: 20, observacao: "" },
  { id: "#308916", agente: "Joao", diasAberto: 0, observacao: "" },
  { id: "#304935", agente: "Joao", diasAberto: 0, observacao: "" },
  { id: "#308900", agente: "Jessika", diasAberto: 0, observacao: "" },
  { id: "#308229", agente: "Jessika", diasAberto: 0, observacao: "" },
  { id: "#308225", agente: "Tatiane", diasAberto: 0, observacao: "" },
];

const seedTickets: Ticket[] = pendingSeedTickets.map((ticket) => {
  const createdAt = calculateCreatedAt(ticket.diasAberto);
  const dueDate = calculateDueDate(createdAt, ticket.slaDias);

  return {
    id: normalizeTicketId(ticket.id),
    agente: ticket.agente,
    diasAberto: ticket.diasAberto,
    status: "Pendente",
    observacao: ticket.observacao?.trim() || "Sem observacao registrada",
    createdAt,
    updatedAt: new Date().toISOString(),
    resolvedAt: null,
    createdBy: ticket.agente,
    priority: "Media",
    watchers: ["Coordinator", ticket.agente],
    slaDias: ticket.slaDias ?? DEFAULT_SLA_DAYS,
    dueDate,
    assigneeEmail: agentEmails[ticket.agente],
    notes: [],
  };
});

const mergeSeedTickets = (tickets: Ticket[]) => {
  const existingIds = new Set(tickets.map((ticket) => ticket.id));
  const merged = [...tickets];

  seedTickets.forEach((ticket) => {
    if (!existingIds.has(ticket.id)) {
      merged.push(ticket);
    }
  });

  return merged;
};

export const useTicketStore = create<TicketStore>()(
  persist(
    (set, get) => ({
      tickets: seedTickets,
      filters: {},
      dueLog: {},

      setTickets: (tickets) => set({ tickets }),

      setFilters: (filters) => set({ filters }),

      createTicket: (ticketData) => {
        const now = new Date().toISOString();
        const slaDias = ticketData.slaDias ?? DEFAULT_SLA_DAYS;
        const dueDate = ticketData.dueDate || calculateDueDate(now, slaDias);
        const newTicket: Ticket = {
          ...ticketData,
          id: normalizeTicketId(ticketData.id),
          createdBy: ticketData.createdBy || ticketData.agente,
          createdAt: now,
          resolvedAt: ticketData.status === "Resolvido" ? now : null,
          updatedAt: now,
          diasAberto: 0,
          priority: ticketData.priority || "Media",
          watchers: ticketData.watchers || ["Coordinator", ticketData.agente],
          slaDias,
          dueDate,
          assigneeEmail: agentEmails[ticketData.agente] || ticketData.assigneeEmail,
          notes: ticketData.notes || [],
        };

        set((state) => ({
          tickets: [...state.tickets, newTicket],
        }));
      },

      updateTicket: (id, updates) => {
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === id
              ? (() => {
                  const status = updates.status;
                  let resolvedAt = updates.resolvedAt ?? ticket.resolvedAt;
                  if (status === "Resolvido") {
                    resolvedAt = updates.resolvedAt ?? new Date().toISOString();
                  } else if (status) {
                    resolvedAt = null;
                  }

                  return {
                    ...ticket,
                    ...updates,
                    resolvedAt,
                    updatedAt: new Date().toISOString(),
                  };
                })()
              : ticket
          ),
        }));
      },

      moveTicket: (id, newStatus) => {
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === id
              ? {
                  ...ticket,
                  status: newStatus,
                  resolvedAt: newStatus === "Resolvido" ? new Date().toISOString() : null,
                  updatedAt: new Date().toISOString(),
                }
              : ticket
          ),
        }));
      },

      removeTicket: (id) => {
        set((state) => ({
          tickets: state.tickets.filter((ticket) => ticket.id !== id),
        }));
      },

      addNoteToTicket: (id, note) => {
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === id
              ? {
                  ...ticket,
                  notes: [note, ...(ticket.notes || [])],
                  updatedAt: new Date().toISOString(),
                }
              : ticket
          ),
        }));
      },

      getFilteredTickets: () => {
        const { tickets, filters } = get();
        return tickets.filter((ticket) => {
          if (filters.status && ticket.status !== filters.status) return false;
          if (filters.agente && ticket.agente !== filters.agente) return false;
          if (filters.priority && ticket.priority !== filters.priority) return false;
          if (filters.search) {
            const search = filters.search.toLowerCase();
            return ticket.id.toLowerCase().includes(search) || ticket.observacao.toLowerCase().includes(search);
          }
          return true;
        });
      },

      getCriticalTickets: () => {
        const { tickets } = get();
        return tickets.filter((ticket) => ticket.diasAberto >= 15 && ticket.status !== "Resolvido");
      },

      getOverdueTickets: () => {
        const { tickets } = get();
        const now = new Date();
        return tickets.filter((ticket) => {
          if (!ticket.dueDate || ticket.status === "Resolvido") return false;
          return new Date(ticket.dueDate) < now;
        });
      },

      logDueNotification: (ticketId, type) => {
        const today = format(new Date(), "yyyy-MM-dd");
        const key = `${ticketId}:${today}:${type}`;

        set((state) => ({
          dueLog: {
            ...state.dueLog,
            [key]: [...(state.dueLog[key] || []), new Date().toISOString()],
          },
        }));
      },

      shouldNotify: (ticketId, type) => {
        const today = format(new Date(), "yyyy-MM-dd");
        const key = `${ticketId}:${today}:${type}`;
        return !get().dueLog[key];
      },
    }),
    {
      name: "saf-tickets-storage",
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setTickets(mergeSeedTickets(state.tickets || []));
          state.setFilters({});
        }
      },
    }
  )
);
