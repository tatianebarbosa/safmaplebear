// Tipagens centrais para a Agenda SAF
export interface CalendarEvent {
  id: string;
  titulo: string;
  descricao?: string | null;
  dataInicio: string;
  dataFim?: string | null;
  tipo?: string | null;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
  updatedAt?: string | null;
}

export type CalendarEventInput = Pick<CalendarEvent, "titulo" | "descricao" | "dataInicio" | "dataFim" | "tipo">;
