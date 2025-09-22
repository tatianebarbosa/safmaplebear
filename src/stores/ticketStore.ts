import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Ticket, TicketStatus, Agente } from '@/types/tickets';
import { addDays, subDays, format } from 'date-fns';

interface TicketFilters {
  status?: TicketStatus;
  agente?: Agente;
  search?: string;
}

interface TicketStore {
  tickets: Ticket[];
  filters: TicketFilters;
  dueLog: Record<string, string[]>;
  
  // Actions
  setTickets: (tickets: Ticket[]) => void;
  setFilters: (filters: TicketFilters) => void;
  createTicket: (ticket: Omit<Ticket, 'createdAt' | 'updatedAt'>) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  moveTicket: (id: string, newStatus: TicketStatus) => void;
  removeTicket: (id: string) => void;
  
  // Computed
  getFilteredTickets: () => Ticket[];
  getCriticalTickets: () => Ticket[];
  getOverdueTickets: () => Ticket[];
  
  // Due notifications
  logDueNotification: (ticketId: string, type: string) => void;
  shouldNotify: (ticketId: string, type: string) => boolean;
}

// Calculate createdAt from diasAberto
const calculateCreatedAt = (diasAberto: number): string => {
  return subDays(new Date(), diasAberto).toISOString();
};

// Initial seed data
const seedTickets: Ticket[] = [
  {
    id: '#258209',
    agente: 'João',
    diasAberto: 22,
    status: 'Pendente',
    observacao: 'aguardando dados... PC do CRM',
    createdAt: calculateCreatedAt(22),
    updatedAt: new Date().toISOString(),
    dueDate: subDays(new Date(), 1).toISOString(), // ontem
    watchers: ['Coordinator', 'João']
  },
  {
    id: '#258809',
    agente: 'João',
    diasAberto: 17,
    status: 'Pendente',
    observacao: 'verificação Fernanda Edtech',
    createdAt: calculateCreatedAt(17),
    updatedAt: new Date().toISOString(),
    dueDate: addDays(new Date(), 1).toISOString(), // +1 dia
    watchers: ['Coordinator', 'João']
  },
  {
    id: '#259134',
    agente: 'Tati',
    diasAberto: 25,
    status: 'Pendente',
    observacao: 'tratativa com Iago',
    createdAt: calculateCreatedAt(25),
    updatedAt: new Date().toISOString(),
    dueDate: subDays(new Date(), 2).toISOString(), // -2 dias
    watchers: ['Coordinator', 'Tati']
  },
  {
    id: '#258993',
    agente: 'Ingrid',
    diasAberto: 20,
    status: 'Pendente',
    observacao: 'aguardando Eduardo',
    createdAt: calculateCreatedAt(20),
    updatedAt: new Date().toISOString(),
    dueDate: addDays(new Date(), 2).toISOString(), // +2 dias
    watchers: ['Coordinator', 'Ingrid']
  },
  {
    id: '#261211',
    agente: 'João',
    diasAberto: 1,
    status: 'Pendente',
    observacao: 'evidências recebidas',
    createdAt: calculateCreatedAt(1),
    updatedAt: new Date().toISOString(),
    dueDate: addDays(new Date(), 3).toISOString(), // +3 dias
    watchers: ['Coordinator', 'João']
  },
  {
    id: '#263147',
    agente: 'João',
    diasAberto: 1,
    status: 'Resolvido',
    observacao: 'resposta enviada',
    createdAt: calculateCreatedAt(1),
    updatedAt: new Date().toISOString(),
    dueDate: addDays(new Date(), 5).toISOString(), // +5 dias
    watchers: ['Coordinator', 'João']
  }
];

export const useTicketStore = create<TicketStore>()(
  persist(
    (set, get) => ({
      tickets: [],
      filters: {},
      dueLog: {},

      setTickets: (tickets) => set({ tickets }),

      setFilters: (filters) => set({ filters }),

      createTicket: (ticketData) => {
        const now = new Date().toISOString();
        const newTicket: Ticket = {
          ...ticketData,
          createdAt: now,
          updatedAt: now,
          diasAberto: 0,
          watchers: ticketData.watchers || ['Coordinator', ticketData.agente]
        };
        
        set((state) => ({
          tickets: [...state.tickets, newTicket]
        }));
      },

      updateTicket: (id, updates) => {
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === id
              ? { ...ticket, ...updates, updatedAt: new Date().toISOString() }
              : ticket
          )
        }));
      },

      moveTicket: (id, newStatus) => {
        set((state) => ({
          tickets: state.tickets.map((ticket) =>
            ticket.id === id
              ? { ...ticket, status: newStatus, updatedAt: new Date().toISOString() }
              : ticket
          )
        }));
      },

      removeTicket: (id) => {
        set((state) => ({
          tickets: state.tickets.filter((ticket) => ticket.id !== id)
        }));
      },

      getFilteredTickets: () => {
        const { tickets, filters } = get();
        return tickets.filter((ticket) => {
          if (filters.status && ticket.status !== filters.status) return false;
          if (filters.agente && ticket.agente !== filters.agente) return false;
          if (filters.search) {
            const search = filters.search.toLowerCase();
            return (
              ticket.id.toLowerCase().includes(search) ||
              ticket.observacao.toLowerCase().includes(search)
            );
          }
          return true;
        });
      },

      getCriticalTickets: () => {
        const { tickets } = get();
        return tickets.filter(ticket => ticket.diasAberto >= 15 && ticket.status !== 'Resolvido');
      },

      getOverdueTickets: () => {
        const { tickets } = get();
        const now = new Date();
        return tickets.filter(ticket => {
          if (!ticket.dueDate || ticket.status === 'Resolvido') return false;
          return new Date(ticket.dueDate) < now;
        });
      },

      logDueNotification: (ticketId, type) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const key = `${ticketId}:${today}:${type}`;
        
        set((state) => ({
          dueLog: {
            ...state.dueLog,
            [key]: [...(state.dueLog[key] || []), new Date().toISOString()]
          }
        }));
      },

      shouldNotify: (ticketId, type) => {
        const today = format(new Date(), 'yyyy-MM-dd');
        const key = `${ticketId}:${today}:${type}`;
        return !get().dueLog[key];
      }
    }),
    {
      name: 'saf-tickets-storage',
      onRehydrateStorage: () => (state) => {
        // Initialize with seed data if no tickets exist
        if (state && state.tickets.length === 0) {
          state.setTickets(seedTickets);
        }
      }
    }
  )
);