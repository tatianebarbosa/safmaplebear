import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { Plus, CalendarRange, Clock, User, Pencil, Trash2, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { NovoEventoModal } from "@/components/agenda/NovoEventoModal";
import { CalendarEvent, CalendarEventInput } from "@/types/events";
import { createEvent, deleteEvent, fetchEvents, updateEvent } from "@/services/eventService";

// Agenda mensal com lista de eventos do dia selecionado
const AgendaSafPage = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [visibleMonth, setVisibleMonth] = useState<Date>(startOfMonth(new Date()));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();
  const monthKey = format(visibleMonth, "yyyy-MM");

  const {
    data: monthEvents = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<CalendarEvent[]>({
    queryKey: ["agenda-events", monthKey],
    queryFn: () => fetchEvents(monthKey),
    staleTime: 1000 * 30,
  });

  const eventsOfDay = useMemo(() => {
    return monthEvents.filter((event) => {
      try {
        return isSameDay(parseISO(event.dataInicio), selectedDate);
      } catch (_e) {
        return false;
      }
    });
  }, [monthEvents, selectedDate]);

  const weeks = useMemo(() => {
    const start = startOfWeek(startOfMonth(visibleMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(visibleMonth), { weekStartsOn: 0 });
    const days: Date[] = [];
    let cursor = start;
    while (cursor <= end) {
      days.push(cursor);
      cursor = addDays(cursor, 1);
    }
    const chunked: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      chunked.push(days.slice(i, i + 7));
    }
    return chunked;
  }, [visibleMonth]);

  const handleSaveEvent = async (values: CalendarEventInput) => {
    setIsSubmitting(true);
    try {
      if (editingEvent) {
        await updateEvent(editingEvent.id, values);
        toast({ title: "Evento atualizado", description: "As informacoes foram salvas." });
      } else {
        await createEvent(values);
        toast({ title: "Evento criado", description: "A Agenda foi atualizada." });
      }
      setIsModalOpen(false);
      setEditingEvent(null);
      await refetch();
    } catch (error: any) {
      toast({
        title: "Falha ao salvar",
        description: error?.message || "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (eventId: string) => {
    setIsSubmitting(true);
    try {
      await deleteEvent(eventId);
      toast({ title: "Evento removido", description: "Ele nao sera mais exibido no calendario." });
      await refetch();
    } catch (error: any) {
      toast({
        title: "Erro ao remover",
        description: error?.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatHourRange = (event: CalendarEvent) => {
    try {
      const start = format(parseISO(event.dataInicio), "HH:mm");
      const end = event.dataFim ? format(parseISO(event.dataFim), "HH:mm") : null;
      return end ? `${start} - ${end}` : start;
    } catch (_e) {
      return "Horario indefinido";
    }
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return "-";
    try {
      return format(parseISO(value), "dd/MM/yyyy HH:mm");
    } catch (_e) {
      return "-";
    }
  };

  const formattedDay = format(selectedDate, "dd/MM/yyyy");

  const dayEvents = (day: Date) =>
    monthEvents.filter((event) => {
      try {
        return isSameDay(parseISO(event.dataInicio), day);
      } catch (_e) {
        return false;
      }
    });

  const formatHour = (value?: string | null) => {
    if (!value) return null;
    try {
      return format(parseISO(value), "HH:mm");
    } catch (_e) {
      return null;
    }
  };

  const dotTone = (tipo?: string | null) => {
    const lower = (tipo || "").toLowerCase();
    if (lower.includes("online") || lower.includes("web")) return "bg-red-600";
    if (lower.includes("presencial") || lower.includes("treina")) return "bg-orange-500";
    if (lower.includes("prazo") || lower.includes("venc")) return "bg-amber-600";
    return "bg-primary";
  };

  return (
    <div className="w-full py-10 space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <CalendarRange className="w-7 h-7 text-primary" />
            Agenda SAF
          </h1>
          <p className="text-muted-foreground">
            Clique em um dia para ver ou registrar os eventos daquela data.
          </p>
        </div>
        <Button onClick={() => { setEditingEvent(null); setIsModalOpen(true); }} className="gap-2">
          <Plus className="w-4 h-4" />
          Novo evento
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-8 w-full">
        <Card className="shadow-lg border rounded-3xl overflow-hidden">
          <CardHeader className="pb-2 border-b bg-muted/40">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Calendario</p>
                <CardTitle className="text-2xl capitalize">
                  {format(visibleMonth, "MMMM yyyy", { locale: ptBR })}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const today = new Date();
                    setVisibleMonth(startOfMonth(today));
                    setSelectedDate(today);
                  }}
                  className="gap-2"
                >
                  Hoje
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setVisibleMonth((m) => subMonths(m, 1))}
                  className="rounded-full"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setVisibleMonth((m) => addMonths(m, 1))}
                  className="rounded-full"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-3">
            <div className="grid grid-cols-7 text-center text-sm font-semibold text-muted-foreground mb-2">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((dow) => (
                <div key={dow} className="py-2">
                  {dow}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px rounded-2xl overflow-hidden border bg-slate-200 auto-rows-[130px]">
              {weeks.map((week, weekIdx) =>
                week.map((day) => {
                  const dayEventList = dayEvents(day);
                  const isCurrentMonth = isSameMonth(day, visibleMonth);
                  const isSelected = isSameDay(day, selectedDate);
                  const isCurrentDay = isToday(day);
                  return (
                    <button
                      key={`${weekIdx}-${day.toISOString()}`}
                      onClick={() => {
                        setSelectedDate(day);
                        if (!isCurrentMonth) {
                          setVisibleMonth(startOfMonth(day));
                        }
                      }}
                      className={[
                        "bg-white min-h-[120px] flex flex-col items-start px-3 py-3 text-left transition",
                        !isCurrentMonth ? "text-muted-foreground/60 bg-slate-50" : "",
                        isSelected ? "ring-2 ring-primary ring-offset-0 shadow-sm" : "",
                        "hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="flex items-center justify-between w-full text-sm font-semibold mb-2">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted text-base font-semibold">
                            {format(day, "d")}
                          </span>
                          {isCurrentDay && (
                            <span className="text-[11px] font-medium text-primary">Hoje</span>
                          )}
                        </div>
                        {dayEventList.length > 0 && (
                          <span className="text-[11px] text-primary font-medium px-2 py-1 rounded-full bg-primary/10">
                            {dayEventList.length} evento{dayEventList.length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-1 w-full">
                        {dayEventList.slice(0, 3).map((ev) => (
                          <div
                            key={ev.id}
                            className="flex items-center gap-2 truncate text-xs bg-primary/5 px-2 py-1 rounded-lg w-full"
                          >
                            <span className={`h-2 w-2 rounded-full ${dotTone(ev.tipo)}`} />
                            <span className="truncate flex-1">{ev.titulo}</span>
                            {formatHour(ev.dataInicio) && (
                              <span className="text-[11px] text-muted-foreground">
                                {formatHour(ev.dataInicio)}
                              </span>
                            )}
                          </div>
                        ))}
                        {dayEventList.length > 3 && (
                          <span className="text-[11px] text-primary">+{dayEventList.length - 3} eventos</span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-4 flex items-center justify-between">
              <span>{monthEvents.length} evento(s) no mes</span>
              <Button onClick={() => { setEditingEvent(null); setIsModalOpen(true); }} size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Novo evento
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="font-semibold text-sm text-foreground">Legenda:</span>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-red-600" /> Online
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-orange-500" /> Presencial/Treinamento
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-amber-600" /> Prazo/Vencimento
              </div>
              <div className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary" /> Outros
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border rounded-3xl">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-2xl">Eventos de {formattedDay}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {isLoading ? "Carregando..." : `${eventsOfDay.length} evento(s) para o dia`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {isFetching && <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />}
              <Button variant="outline" size="sm" className="gap-2" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
                Atualizar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <Button
                size="sm"
                className="gap-2"
                onClick={() => {
                  setEditingEvent(null);
                  setIsModalOpen(true);
                }}
              >
                <Plus className="w-4 h-4" />
                Novo evento
              </Button>
              <div className="text-xs text-muted-foreground">
                Clique em um card para editar ou remover.
              </div>
            </div>
            <Separator />
            {isLoading && <div className="text-muted-foreground text-sm">Carregando eventos...</div>}
            {!isLoading && eventsOfDay.length === 0 && (
              <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
                Nenhum evento cadastrado para este dia.
              </div>
            )}
            <div className="space-y-4">
              {eventsOfDay.map((event) => (
                <div
                  key={event.id}
                  className="rounded-2xl border bg-card p-5 shadow-md hover:shadow-lg transition flex flex-col gap-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold">
                        {event.titulo.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-lg leading-tight">{event.titulo}</p>
                        <p className="text-sm text-muted-foreground">{formatHourRange(event)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {event.tipo && <Badge variant="secondary">{event.tipo}</Badge>}
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          setEditingEvent(event);
                          setIsModalOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive gap-2"
                        onClick={() => handleDelete(event.id)}
                        disabled={isSubmitting}
                      >
                        <Trash2 className="w-4 h-4" />
                        Remover
                      </Button>
                    </div>
                  </div>

                  {event.descricao && <p className="text-sm text-muted-foreground">{event.descricao}</p>}

                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Criado em {formatDateTime(event.createdAt)}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Por {event.createdByName || event.createdByUserId || "N/A"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <NovoEventoModal
        open={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEvent(null);
        }}
        defaultDate={selectedDate}
        editingEvent={editingEvent}
        loading={isSubmitting}
        onSubmit={handleSaveEvent}
      />
    </div>
  );
};

export default AgendaSafPage;
