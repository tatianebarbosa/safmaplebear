import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { useTicketStore } from "@/stores/ticketStore";
import type { Ticket } from "@/types/tickets";

type NotificationType = "overdue" | "critical";

type NotificationItem = {
  id: string;
  ticketId: string;
  title: string;
  description: string;
  type: NotificationType;
  meta?: string;
};

const buildNotifications = (tickets: Ticket[]): NotificationItem[] => {
  const now = new Date();
  const activeTickets = tickets.filter((ticket) => ticket.status !== "Resolvido");

  const overdue = activeTickets
    .filter((ticket) => ticket.dueDate && new Date(ticket.dueDate) < now)
    .sort((a, b) => new Date(a.dueDate ?? 0).getTime() - new Date(b.dueDate ?? 0).getTime());

  const critical = activeTickets
    .filter((ticket) => ticket.diasAberto >= 15)
    .sort((a, b) => b.diasAberto - a.diasAberto);

  const items: NotificationItem[] = [];

  overdue.slice(0, 5).forEach((ticket) => {
    const distance = ticket.dueDate
      ? formatDistanceToNow(new Date(ticket.dueDate), { addSuffix: true, locale: ptBR }).replace("cerca de ", "")
      : "SLA expirado";

    items.push({
      id: `overdue-${ticket.id}`,
      ticketId: ticket.id,
      title: `Ticket ${ticket.id} vencido`,
      description: `SLA expirou ${distance}`,
      type: "overdue",
      meta: ticket.agente,
    });
  });

  critical.forEach((ticket) => {
    // Evita duplicar notificacao quando o ticket ja esta vencido
    if (items.some((item) => item.ticketId === ticket.id)) return;

    items.push({
      id: `critical-${ticket.id}`,
      ticketId: ticket.id,
      title: `Ticket ${ticket.id} critico`,
      description: `${ticket.diasAberto} dias em aberto com ${ticket.agente}.`,
      type: "critical",
    });
  });

  return items.slice(0, 8);
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const tickets = useTicketStore((state) => state.tickets);
  const logDueNotification = useTicketStore((state) => state.logDueNotification);
  const shouldNotify = useTicketStore((state) => state.shouldNotify);
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const notifications = useMemo(() => buildNotifications(tickets), [tickets]);
  const unreadCount = notifications.filter((notification) => !readIds.has(notification.id)).length;
  const hasUnread = unreadCount > 0;
  const displayCount = unreadCount > 9 ? "9+" : `${unreadCount}`;

  useEffect(() => {
    // Mantem apenas IDs que ainda existem
    setReadIds((prev) => {
      const next = new Set<string>();
      notifications.forEach((notification) => {
        if (prev.has(notification.id)) {
          next.add(notification.id);
        }
      });
      return next;
    });
  }, [notifications]);

  useEffect(() => {
    notifications.forEach((notification) => {
      if (!shouldNotify(notification.ticketId, notification.type)) return;

      toast({
        title: notification.title,
        description: notification.description,
        variant: notification.type === "overdue" ? "destructive" : "warning",
      });
      logDueNotification(notification.ticketId, notification.type);
    });
  }, [notifications, shouldNotify, logDueNotification, toast]);

  const markAllAsRead = () => {
    setReadIds(new Set(notifications.map((notification) => notification.id)));
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      markAllAsRead();
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative flex h-11 w-11 items-center justify-center rounded-full bg-transparent text-foreground shadow-none transition-transform hover:-translate-y-0.5"
              aria-label={hasUnread ? `Notificacoes: ${displayCount} nao lidas` : "Notificacoes"}
            >
              <Bell className="w-5 h-5" />
              {hasUnread && (
                <span
                  aria-live="polite"
                  className="absolute top-0 right-0 inline-flex h-5 min-w-[1.35rem] -translate-y-1/3 translate-x-1/3 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-[1.1] font-bold text-white shadow-[0_4px_10px_rgba(204,19,22,0.35)]"
                >
                  {displayCount}
                </span>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8}>
          Notificações
        </TooltipContent>
      </Tooltip>
      <PopoverContent
        align="end"
        side="bottom"
        sideOffset={10}
        collisionPadding={16}
        className="flex flex-col w-[400px] max-w-[92vw] max-h-[65vh] overflow-hidden rounded-xl border border-border/70 bg-white p-0 shadow-[0_18px_34px_-18px_rgba(30,32,36,0.45)]"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/70 bg-white">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">Notificações</p>
            <p className="text-xs text-muted-foreground">Tickets com SLA em risco</p>
          </div>
          <Badge
            variant="destructive"
            size="xs"
            className="border-none bg-[#c1121f] text-white px-2.5 py-[3px] text-[11px] leading-[1.1] font-semibold uppercase tracking-wide"
          >
            {notifications.length ? `${notifications.length} ativas` : "Nenhuma"}
          </Badge>
        </div>

        <div
          className="max-h-[calc(65vh-110px)] overflow-y-auto px-3 py-3 space-y-3 pr-3"
          style={{ scrollbarWidth: "thin" }}
        >
          {notifications.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhum alerta no momento.
            </div>
          ) : (
            notifications.map((notification) => {
              const isOverdue = notification.type === "overdue";
              const statusLabel = isOverdue ? "VENCIDO" : "CRÍTICO";
              const statusClasses = isOverdue
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700";

              return (
                <article
                  key={notification.id}
                  className="group relative flex gap-3 rounded-xl border border-border/60 bg-white px-3.5 py-3 shadow-[0_10px_24px_-18px_rgba(0,0,0,0.28)] transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-18px_rgba(0,0,0,0.32)]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    {isOverdue ? <Clock className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-semibold leading-snug text-foreground">{notification.title}</p>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${statusClasses}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className="text-xs leading-snug text-muted-foreground">{notification.description}</p>
                    <p className="text-xs leading-snug text-muted-foreground">
                      Responsável: {notification.meta ?? "—"}
                    </p>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-border/70 bg-white">
          <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={!hasUnread}>
            Marcar como lidas
          </Button>
          <Button size="sm" variant="secondary" className="gap-2" onClick={() => navigate("/tickets")}>
            Abrir tickets
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;

