export interface CalendarEventInput {
  titulo: string;
  descricao?: string;
  dataInicio: string;
  dataFim?: string;
  tipo?: string;
}

export interface CalendarEvent extends CalendarEventInput {
  id: string;
  createdByUserId?: string | null;
  createdByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}
