import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Bell, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full h-11 w-11"
          aria-label="Notificacoes"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full bg-destructive px-1 text-[11px] font-semibold leading-5 text-white text-center">
              {Math.min(unreadCount, 9)}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" sideOffset={12} className="w-96 p-0 shadow-[0_18px_34px_-18px_rgba(30,32,36,0.45)]">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div>
            <p className="text-sm font-semibold text-foreground">Notificacoes</p>
            <p className="text-xs text-muted-foreground">Tickets com SLA em risco</p>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary border-none">
            {notifications.length ? `${notifications.length} ativas` : "Nenhuma"}
          </Badge>
        </div>

        <div className="max-h-80 overflow-y-auto divide-y">
          {notifications.length === 0 ? (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">
              Nenhum alerta no momento.
            </div>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="flex gap-3 px-4 py-3">
                <div
                  className={[
                    "mt-0.5 h-9 w-9 rounded-full inline-flex items-center justify-center",
                    notification.type === "overdue" ? "bg-destructive/10 text-destructive" : "bg-warning/15 text-warning",
                  ].join(" ")}
                >
                  {notification.type === "overdue" ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <AlertTriangle className="w-4 h-4" />
                  )}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                    <Badge
                      variant={notification.type === "overdue" ? "destructive" : "warning"}
                      size="sm"
                      className="uppercase"
                    >
                      {notification.type === "overdue" ? "Vencido" : "Critico"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground leading-snug">{notification.description}</p>
                  {notification.meta && (
                    <p className="text-xs text-muted-foreground">Responsavel: {notification.meta}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-4 py-3 border-t">
          <Button variant="ghost" size="sm" onClick={markAllAsRead} disabled={!unreadCount}>
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
