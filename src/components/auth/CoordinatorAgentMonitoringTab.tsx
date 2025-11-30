import { useEffect, useMemo, useState } from "react";
import { format, formatDistanceToNow, isAfter, isSameDay, subDays, subHours, differenceInMinutes } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useTicketStore } from "@/stores/ticketStore";
import { TEAM_MEMBERS, findTeamMemberForAgent, getAgentDisplayName, getCoordinatorMember } from "@/data/teamMembers";
import type { TeamMember } from "@/data/teamMembers";
import type { Agente, Ticket, TicketStatus } from "@/types/tickets";
import {
  Activity,
  AlertTriangle,
  BellRing,
  Clock,
  GaugeCircle,
  KanbanSquare,
  Send,
  UserCheck,
  Users,
  MessageCircle,
  PauseCircle,
} from "lucide-react";
import { TicketDetailsDialog } from "@/components/tickets/TicketDetailsDialog";
import { useAssetStore } from "@/stores/assetStore";
import { useNavigate } from "react-router-dom";

type TicketCategory = "Atrasado" | "Quase vencendo" | "Pausado" | "Resolvido" | "Normal";

type TicketFilterState = {
  status: TicketStatus | "all" | "Atrasado";
  agent: string;
  time: "all" | "24h" | "72h" | "7d";
  category: TicketCategory | "all";
  search: string;
};

const ALERT_PREFS_KEY = "saf_coord_alert_prefs_v1";

const normalize = (value?: string) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "")
    .toLowerCase();

const minutesToDueDate = (ticket: Ticket) =>
  ticket.dueDate ? differenceInMinutes(new Date(ticket.dueDate), new Date()) : Number.POSITIVE_INFINITY;

const isTicketOverdue = (ticket: Ticket) =>
  ticket.status !== "Resolvido" && ticket.dueDate ? isAfter(new Date(), new Date(ticket.dueDate)) : false;

const isTicketNearSla = (ticket: Ticket) => {
  if (!ticket.dueDate || ticket.status === "Resolvido") return false;
  const minutes = minutesToDueDate(ticket);
  return minutes >= 0 && minutes <= 60;
};

const classifyTicket = (ticket: Ticket): TicketCategory => {
  if (ticket.status === "Resolvido") return "Resolvido";
  if (isTicketOverdue(ticket)) return "Atrasado";
  if (isTicketNearSla(ticket)) return "Quase vencendo";
  if (ticket.tags?.some((tag) => tag.toLowerCase().includes("pausa"))) return "Pausado";
  return "Normal";
};

const formatLastAccess = (date: Date | null) => {
  if (!date || Number.isNaN(date.getTime())) return "Sem atividade recente";
  return formatDistanceToNow(date, { addSuffix: true, locale: ptBR }).replace("cerca de ", "");
};

const formatHours = (hours: number) => {
  if (hours < 1) return `${Math.max(1, Math.round(hours * 60))} min`;
  if (hours < 48) return `${Math.round(hours)} h`;
  return `${Math.round(hours / 24)} d`;
};

const buildAgentKey = (member: TeamMember) => normalize(member.fullName || member.username);

const CoordinatorAgentMonitoringTab = () => {
  const tickets = useTicketStore((state) => state.tickets);
  const updateTicket = useTicketStore((state) => state.updateTicket);
  const moveTicket = useTicketStore((state) => state.moveTicket);
  const { assets, contacts } = useAssetStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [filters, setFilters] = useState<TicketFilterState>({
    status: "all",
    agent: "all",
    time: "all",
    category: "all",
    search: "",
  });
  const [messageTarget, setMessageTarget] = useState<{ agent?: string; ticketId?: string }>({});
  const [messageContent, setMessageContent] = useState("");
  const [historyAgent, setHistoryAgent] = useState<TeamMember | null>(null);
  const [alertPrefs, setAlertPrefs] = useState<{ panel: boolean; email: boolean; popup: boolean }>({
    panel: true,
    email: false,
    popup: true,
  });
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(ALERT_PREFS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setAlertPrefs((prev) => ({ ...prev, ...parsed }));
      } catch {
        // se o JSON estiver quebrado, só ignora para não travar a tela
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ALERT_PREFS_KEY, JSON.stringify(alertPrefs));
  }, [alertPrefs]);

  const coordinator = getCoordinatorMember();
  const agentMembers = useMemo(
    () => TEAM_MEMBERS.filter((member) => member.role === "agente"),
    []
  );

  const agentMetrics = useMemo(() => {
    const now = new Date();
    return agentMembers.map((member) => {
      const memberTickets = tickets.filter(
        (ticket) => getAgentDisplayName(ticket.agente) === member.fullName
      );

      const openTickets = memberTickets.filter((ticket) => ticket.status !== "Resolvido");
      const overdueTickets = openTickets.filter(isTicketOverdue);
      const warningTickets = openTickets.filter(isTicketNearSla);
      const slaHours =
        memberTickets.length > 0
          ? memberTickets.reduce((acc, ticket) => acc + (ticket.slaDias ?? 3) * 24, 0) /
            memberTickets.length
          : 72;

      const lastActivity = memberTickets.reduce<Date | null>((latest, ticket) => {
        const dates = [ticket.updatedAt, ticket.resolvedAt, ticket.createdAt].filter(Boolean) as string[];
        const ticketLast = dates.reduce<Date>((current, dateStr) => {
          const parsed = new Date(dateStr);
          return parsed > current ? parsed : current;
        }, new Date(0));
        if (!latest || ticketLast > latest) return ticketLast;
        return latest;
      }, null);

      const resolvedToday = memberTickets.filter(
        (ticket) => ticket.resolvedAt && isSameDay(new Date(ticket.resolvedAt), now)
      ).length;
      const touchedToday = memberTickets.filter((ticket) => isSameDay(new Date(ticket.updatedAt), now)).length;
      const activityScore = resolvedToday + touchedToday;

      const online =
        lastActivity && (isAfter(lastActivity, subHours(now, 3)) || isAfter(lastActivity, subDays(now, 1)));

      return {
        member,
        openTickets: openTickets.length,
        overdueTickets: overdueTickets.length,
        warningTickets: warningTickets.length,
        averageSlaHours: slaHours,
        lastActivity,
        online,
        performanceToday: activityScore,
      };
    });
  }, [agentMembers, tickets]);

  const filteredTickets = useMemo(() => {
    const now = new Date();
    const timeLimit =
      filters.time === "24h"
        ? subHours(now, 24)
        : filters.time === "72h"
        ? subHours(now, 72)
        : filters.time === "7d"
        ? subDays(now, 7)
        : null;

    return tickets
      .filter((ticket) => {
        if (filters.status === "Atrasado" && !isTicketOverdue(ticket)) return false;
        if (filters.status !== "all" && filters.status !== "Atrasado" && ticket.status !== filters.status)
          return false;

        if (filters.agent !== "all") {
          const member = findTeamMemberForAgent(ticket.agente);
          if (!member || buildAgentKey(member) !== filters.agent) return false;
        }

        if (filters.category !== "all" && classifyTicket(ticket) !== filters.category) return false;

        if (filters.search) {
          const query = filters.search.toLowerCase();
          if (
            !ticket.id.toLowerCase().includes(query) &&
            !ticket.observacao.toLowerCase().includes(query) &&
            !ticket.agente.toLowerCase().includes(query)
          ) {
            return false;
          }
        }

        if (timeLimit && (!ticket.createdAt || new Date(ticket.createdAt) < timeLimit)) return false;

        return true;
      })
      .map((ticket) => ({
        ...ticket,
        category: classifyTicket(ticket),
      }));
  }, [filters, tickets]);

  const kanbanBuckets = useMemo(() => {
    const buckets: Record<string, Ticket[]> = {
      backlog: [],
      progress: [],
      overdue: [],
      resolved: [],
    };

    filteredTickets.forEach((ticket) => {
      if (ticket.status === "Resolvido") {
        buckets.resolved.push(ticket);
      } else if (isTicketOverdue(ticket)) {
        buckets.overdue.push(ticket);
      } else if (ticket.status === "Em andamento") {
        buckets.progress.push(ticket);
      } else {
        buckets.backlog.push(ticket);
      }
    });

    return buckets;
  }, [filteredTickets]);

  const alerts = useMemo(() => {
    const items: { id: string; title: string; description: string; severity: "red" | "yellow" | "blue" }[] = [];

    filteredTickets
      .filter((ticket) => ticket.status !== "Resolvido" && isTicketOverdue(ticket))
      .forEach((ticket) => {
        items.push({
          id: `overdue-${ticket.id}`,
          title: `Ticket ${ticket.id} atrasado`,
          description: `SLA expirado com ${ticket.agente}`,
          severity: "red",
        });
      });

    filteredTickets
      .filter((ticket) => ticket.status !== "Resolvido" && isTicketNearSla(ticket))
      .forEach((ticket) => {
        items.push({
          id: `warning-${ticket.id}`,
          title: `Ticket ${ticket.id} quase vencendo`,
          description: `Menos de 1h para SLA com ${ticket.agente}`,
          severity: "yellow",
        });
      });

    agentMetrics
      .filter((metric) => !metric.online)
      .forEach((metric) => {
        items.push({
          id: `offline-${metric.member.username}`,
          title: `${metric.member.fullName} inativo`,
          description: "Sem atividade recente em tickets",
          severity: "blue",
        });
      });

    filteredTickets
      .filter((ticket) => !ticket.agente)
      .forEach((ticket) => {
        items.push({
          id: `no-agent-${ticket.id}`,
          title: `Ticket ${ticket.id} sem agente`,
          description: "Atribua um responsavel",
          severity: "yellow",
        });
      });

    return items.slice(0, 12);
  }, [agentMetrics, filteredTickets]);

  const assetSummaries = useMemo(() => {
    const map = assets.map((asset) => {
      const assetContacts = contacts.filter((contact) => contact.assetId === asset.id);
      const lastContact = assetContacts.reduce<string | null>((latest, contact) => {
        if (!latest) return contact.contactAt;
        return new Date(contact.contactAt) > new Date(latest) ? contact.contactAt : latest;
      }, null);
      return {
        asset,
        totalContacts: assetContacts.length,
        lastContact,
      };
    });
    const totalContacts = contacts.length;
    const lastContactOverall = contacts.reduce<string | null>((latest, contact) => {
      if (!latest) return contact.contactAt;
      return new Date(contact.contactAt) > new Date(latest) ? contact.contactAt : latest;
    }, null);
    return { map, totalContacts, lastContactOverall };
  }, [assets, contacts]);

  useEffect(() => {
    if (!alertPrefs.popup) return;
    alerts
      .filter((alert) => alert.severity === "red" || alert.severity === "yellow")
      .slice(0, 2)
      .forEach((alert) => {
        toast({
          title: alert.title,
          description: alert.description,
          variant: alert.severity === "red" ? "destructive" : "warning",
        });
      });
  }, [alerts, alertPrefs.popup, toast]);

  const totalOpenTickets = agentMetrics.reduce((acc, metric) => acc + metric.openTickets, 0);
  const totalOverdueTickets = agentMetrics.reduce((acc, metric) => acc + metric.overdueTickets, 0);
  const totalWarningTickets = agentMetrics.reduce((acc, metric) => acc + metric.warningTickets, 0);

  const handleReassign = (ticket: Ticket, newAgent: Agente) => {
    if (ticket.agente === newAgent) return;
    updateTicket(ticket.id, {
      agente: newAgent,
      watchers: ["Coordinator", newAgent],
    });
    toast({ title: "Ticket reatribuido", description: `${ticket.id} agora com ${newAgent}` });
  };

  const handleSendMessage = () => {
    if (!messageTarget.agent || !messageContent.trim()) {
      toast({ title: "Mensagem incompleta", description: "Informe o texto para enviar.", variant: "destructive" });
      return;
    }
    toast({
      title: "Mensagem enviada",
      description: `Enviada para ${messageTarget.agent}${messageTarget.ticketId ? ` sobre ${messageTarget.ticketId}` : ""}.`,
    });
    setMessageContent("");
    setMessageTarget({});
  };

  const handleTogglePause = (ticket: Ticket) => {
    const tags = new Set(ticket.tags ?? []);
    if (tags.has("Pausado")) {
      tags.delete("Pausado");
    } else {
      tags.add("Pausado");
    }
    updateTicket(ticket.id, { tags: Array.from(tags), status: ticket.status === "Resolvido" ? "Em andamento" : ticket.status });
    toast({
      title: tags.has("Pausado") ? "Ticket pausado" : "Ticket retomado",
      description: ticket.id,
    });
  };

  const handleTogglePriority = (ticket: Ticket) => {
    const nextPriority = ticket.priority === "Critica" ? "Media" : "Critica";
    updateTicket(ticket.id, { priority: nextPriority });
    toast({
      title: "Prioridade ajustada",
      description: `${ticket.id} marcado como ${nextPriority}`,
    });
  };

  const handleMove = (ticket: Ticket, status: TicketStatus) => {
    moveTicket(ticket.id, status);
    toast({ title: "Status atualizado", description: `${ticket.id} agora ${status}` });
  };

  const agentHistory = useMemo(() => {
    if (!historyAgent) return [];
    return tickets
      .filter((ticket) => getAgentDisplayName(ticket.agente) === historyAgent.fullName)
      .flatMap((ticket) => {
        const events = [] as { when?: string; label: string; status: string }[];
        events.push({ when: ticket.createdAt, label: `${ticket.id} criado`, status: ticket.status });
        if (ticket.updatedAt) events.push({ when: ticket.updatedAt, label: `${ticket.id} atualizado`, status: ticket.status });
        if (ticket.resolvedAt) events.push({ when: ticket.resolvedAt, label: `${ticket.id} resolvido`, status: "Resolvido" });
        return events;
      })
      .filter((event) => event.when)
      .sort((a, b) => new Date(b.when!).getTime() - new Date(a.when!).getTime())
      .slice(0, 30);
  }, [historyAgent, tickets]);

  const renderStatusBadge = (category: TicketCategory) => {
    if (category === "Atrasado") return <Badge variant="destructive">Atrasado</Badge>;
    if (category === "Quase vencendo") return <Badge className="bg-amber-100 text-amber-800">Quase vencendo</Badge>;
    if (category === "Pausado") return <Badge variant="outline">Pausado</Badge>;
    if (category === "Resolvido") return <Badge className="bg-green-100 text-green-800">Resolvido</Badge>;
    return <Badge variant="secondary">Normal</Badge>;
  };

  const renderSlaBadge = (ticket: Ticket) => {
    const category = classifyTicket(ticket);
    if (category === "Atrasado") return <Badge variant="destructive">SLA vencido</Badge>;
    if (category === "Quase vencendo") return <Badge className="bg-amber-100 text-amber-800">SLA {"<"} 1h</Badge>;
    return (
      <Badge variant="outline" className="text-xs">
        {ticket.slaDias ?? 3}d
      </Badge>
    );
  };

  const coordinatorName = coordinator?.fullName || "Coordenadora";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h3 className="text-2xl font-bold">Monitoria de Agentes</h3>
        <p className="text-muted-foreground">
          {coordinatorName}, acompanhe tickets, SLA e atividade dos agentes em tempo real.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Agentes ativos</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Users className="h-5 w-5 text-primary" />
              {agentMembers.length}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">
              {agentMetrics.filter((metric) => metric.online).length} online
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tickets em aberto</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Activity className="h-5 w-5 text-primary" />
              {totalOpenTickets}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Badge variant="outline">{totalWarningTickets} quase vencendo</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tickets atrasados</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl text-destructive">
              <AlertTriangle className="h-5 w-5" />
              {totalOverdueTickets}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Badge variant="destructive">{Math.max(totalOverdueTickets, 0)} em vermelho</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>SLAs medios</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <GaugeCircle className="h-5 w-5 text-primary" />
              {formatHours(
                agentMetrics.length
                  ? agentMetrics.reduce((acc, metric) => acc + metric.averageSlaHours, 0) / agentMetrics.length
                  : 72
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-2">
            <Badge variant="secondary">Janela media de SLA</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de agentes</CardTitle>
          <CardDescription>Login, status e desempenho diario</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ultimo acesso</TableHead>
                <TableHead>Abertos</TableHead>
                <TableHead className="text-red-600">Atrasados</TableHead>
                <TableHead>SLA medio</TableHead>
                <TableHead>Desempenho do dia</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agentMetrics.map((metric) => (
                <TableRow key={metric.member.username}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold">{metric.member.fullName}</span>
                      <span className="text-xs text-muted-foreground">{metric.member.username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={metric.online ? "default" : "secondary"}
                      className={metric.online ? "bg-green-500 text-white" : undefined}
                    >
                      {metric.online ? "Online" : "Offline"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatLastAccess(metric.lastActivity)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{metric.openTickets}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="destructive">{metric.overdueTickets}</Badge>
                  </TableCell>
                  <TableCell>{formatHours(metric.averageSlaHours)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{metric.performanceToday || 0} movimentos</Badge>
                      {metric.warningTickets > 0 && (
                        <Badge className="bg-amber-100 text-amber-800">
                          {metric.warningTickets} alerta
                          {metric.warningTickets > 1 ? "s" : ""}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => setHistoryAgent(metric.member)}>
                      <UserCheck className="h-4 w-4 mr-1" />
                      Historico
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

          <Card>
            <CardHeader>
              <CardTitle>Monitoramento de tickets</CardTitle>
              <CardDescription>Filtros por status, agente, SLA e categoria</CardDescription>
            </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="col-span-1 md:col-span-2">
              <Label className="text-sm">Buscar</Label>
              <Input
                placeholder="ID, agente ou texto..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div>
              <Label className="text-sm">Status</Label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters({ ...filters, status: value as TicketFilterState["status"] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Em andamento">Em atendimento</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                  <SelectItem value="Resolvido">Resolvido</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Agente</Label>
              <Select
                value={filters.agent}
                onValueChange={(value) => setFilters({ ...filters, agent: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Agente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {agentMembers.map((member) => (
                    <SelectItem key={member.username} value={buildAgentKey(member)}>
                      {member.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Tempo de criacao</Label>
              <Select
                value={filters.time}
                onValueChange={(value) => setFilters({ ...filters, time: value as TicketFilterState["time"] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Janela" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tudo</SelectItem>
                  <SelectItem value="24h">Ultimas 24h</SelectItem>
                  <SelectItem value="72h">Ultimas 72h</SelectItem>
                  <SelectItem value="7d">Ultimos 7 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm">Categoria</Label>
              <Select
                value={filters.category}
                onValueChange={(value) => setFilters({ ...filters, category: value as TicketCategory | "all" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Atrasado">Atrasados</SelectItem>
                  <SelectItem value="Quase vencendo">Quase vencendo</SelectItem>
                  <SelectItem value="Pausado">Em analise / pausado</SelectItem>
                  <SelectItem value="Normal">Normais</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Agente</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Ultimo movimento</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead className="w-[320px]">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-mono text-sm">
                      <Button variant="link" className="p-0 h-auto font-mono" onClick={() => { setSelectedTicket(ticket); setShowTicketDetails(true); }}>
                        {ticket.id}
                      </Button>
                    </TableCell>
                    <TableCell>{getAgentDisplayName(ticket.agente)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{ticket.status}</Badge>
                    </TableCell>
                    <TableCell>{renderSlaBadge(ticket)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {ticket.updatedAt ? formatDistanceToNow(new Date(ticket.updatedAt), { addSuffix: true, locale: ptBR }) : "-"}
                    </TableCell>
                    <TableCell>{renderStatusBadge(ticket.category as TicketCategory)}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Select
                          onValueChange={(value) => handleReassign(ticket, value as Agente)}
                          value={ticket.agente}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Reatribuir" />
                          </SelectTrigger>
                          <SelectContent>
                            {(Array.from(new Set(tickets.map((t) => t.agente))) as Agente[]).map((agent) => {
                              const label = getAgentDisplayName(agent);
                              return (
                                <SelectItem key={agent} value={agent}>
                                  {label}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setMessageTarget({ agent: ticket.agente, ticketId: ticket.id })}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Mensagem
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedTicket(ticket); setShowTicketDetails(true); }}>
                          <UserCheck className="h-4 w-4 mr-1" />
                          Detalhes
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleTogglePause(ticket)}>
                          <PauseCircle className="h-4 w-4 mr-1" />
                          Pausar
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleTogglePriority(ticket)}>
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Prioridade
                        </Button>
                        {ticket.status !== "Resolvido" ? (
                          <Button size="sm" variant="secondary" onClick={() => handleMove(ticket, "Resolvido")}>
                            <Send className="h-4 w-4 mr-1" />
                            Resolver
                          </Button>
                        ) : (
                          <Button size="sm" variant="outline" onClick={() => handleMove(ticket, "Em andamento")}>
                            <Clock className="h-4 w-4 mr-1" />
                            Reabrir
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KanbanSquare className="h-5 w-5 text-primary" />
              Mini Kanban
            </CardTitle>
            <CardDescription>A Fazer, Em Atendimento, Atrasados e Resolvidos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { key: "backlog", title: "A Fazer", color: "bg-muted" },
                { key: "progress", title: "Em Atendimento", color: "bg-blue-50" },
                { key: "overdue", title: "Atrasado", color: "bg-red-50" },
                { key: "resolved", title: "Resolvido", color: "bg-green-50" },
              ].map((column) => (
                <div key={column.key} className={`rounded-lg border p-3 ${column.color}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold">{column.title}</span>
                    <Badge variant="secondary">{kanbanBuckets[column.key]?.length || 0}</Badge>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-auto">
                    {(kanbanBuckets[column.key] || []).slice(0, 4).map((ticket) => (
                      <div
                        key={ticket.id}
                        className="rounded-md border bg-white/80 px-3 py-2 text-sm shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{ticket.id}</span>
                          {renderStatusBadge(classifyTicket(ticket))}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">{ticket.observacao}</p>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span>{ticket.agente}</span>
                          {ticket.dueDate && (
                            <span className="text-muted-foreground">
                              SLA {format(new Date(ticket.dueDate), "dd/MM")}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                    {(kanbanBuckets[column.key] || []).length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">Nenhum ticket aqui</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary" />
              Alertas automaticos
            </CardTitle>
            <CardDescription>Tickets vencidos, SLA critico e agentes inativos</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-semibold">Painel</p>
                  <p className="text-xs text-muted-foreground">Lista abaixo</p>
                </div>
                <Switch
                  checked={alertPrefs.panel}
                  onCheckedChange={(checked) => setAlertPrefs((prev) => ({ ...prev, panel: checked }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-semibold">E-mail</p>
                  <p className="text-xs text-muted-foreground">Opcional/simulado</p>
                </div>
                <Switch
                  checked={alertPrefs.email}
                  onCheckedChange={(checked) => setAlertPrefs((prev) => ({ ...prev, email: checked }))}
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <p className="text-sm font-semibold">Popup</p>
                  <p className="text-xs text-muted-foreground">Toast imediato</p>
                </div>
                <Switch
                  checked={alertPrefs.popup}
                  onCheckedChange={(checked) => setAlertPrefs((prev) => ({ ...prev, popup: checked }))}
                />
              </div>
            </div>

            {alertPrefs.panel && (
              <div className="space-y-2 max-h-72 overflow-auto">
                {alerts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum alerta ativo.</p>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-start gap-2 rounded-md border p-3 bg-muted/60"
                    >
                      <div
                        className={[
                          "mt-0.5 h-2 w-2 rounded-full",
                          alert.severity === "red"
                            ? "bg-destructive"
                            : alert.severity === "yellow"
                            ? "bg-amber-500"
                            : "bg-primary",
                        ].join(" ")}
                      />
                      <div>
                        <p className="text-sm font-semibold">{alert.title}</p>
                        <p className="text-xs text-muted-foreground">{alert.description}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KanbanSquare className="h-5 w-5 text-primary" />
            Monitoramento de Ativos
          </CardTitle>
          <CardDescription>Visão rápida de ativos SAF e registros de contato</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="rounded-lg border p-3 bg-muted/40">
              <p className="text-sm text-muted-foreground">Ativos</p>
              <p className="text-2xl font-semibold">{assets.length}</p>
            </div>
            <div className="rounded-lg border p-3 bg-muted/40">
              <p className="text-sm text-muted-foreground">Contatos registrados</p>
              <p className="text-2xl font-semibold">{assetSummaries.totalContacts}</p>
            </div>
            <div className="rounded-lg border p-3 bg-muted/40">
              <p className="text-sm text-muted-foreground">Último contato</p>
              <p className="text-lg font-semibold">
                {assetSummaries.lastContactOverall
                  ? format(new Date(assetSummaries.lastContactOverall), "dd/MM/yyyy HH:mm")
                  : "Sem registros"}
              </p>
            </div>
          </div>
          <div className="overflow-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ativo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Contatos</TableHead>
                  <TableHead>Último contato</TableHead>
                  <TableHead className="w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assetSummaries.map.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-6">
                      Nenhum ativo cadastrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  assetSummaries.map.map((item) => (
                    <TableRow key={item.asset.id}>
                      <TableCell className="font-semibold">{item.asset.name}</TableCell>
                      <TableCell>{item.asset.assetType || "-"}</TableCell>
                      <TableCell>{item.asset.requesterTeam || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.totalContacts}</Badge>
                      </TableCell>
                      <TableCell>
                        {item.lastContact ? format(new Date(item.lastContact), "dd/MM/yyyy HH:mm") : "Sem registros"}
                      </TableCell>
                      <TableCell>
                        <Button size="sm" variant="outline" onClick={() => navigate(`/saf/ativos/${item.asset.id}`)}>
                          Abrir ativo
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!messageTarget.agent} onOpenChange={(open) => !open && setMessageTarget({})}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mensagem direta</DialogTitle>
            <DialogDescription>
              Envie orientacoes ou cobrancas para o agente.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Para: <span className="font-semibold">{messageTarget.agent}</span>
              {messageTarget.ticketId && ` (Ticket ${messageTarget.ticketId})`}
            </p>
            <Textarea
              placeholder="Escreva a mensagem..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setMessageTarget({})}>
                Cancelar
              </Button>
              <Button onClick={handleSendMessage}>
                <Send className="h-4 w-4 mr-1" />
                Enviar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!historyAgent} onOpenChange={(open) => !open && setHistoryAgent(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historico de {historyAgent?.fullName}</DialogTitle>
            <DialogDescription>Movimentacoes recentes de tickets</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[420px] overflow-auto">
            {historyAgent === null || agentHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum historico recente.</p>
            ) : (
              agentHistory.map((event, index) => (
                <div key={`${event.when}-${index}`} className="flex items-start gap-2 border-b pb-2">
                  <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <div>
                    <p className="text-sm font-semibold">{event.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {event.when ? format(new Date(event.when), "dd/MM/yyyy HH:mm") : "-"} | {event.status}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <TicketDetailsDialog
        open={showTicketDetails}
        ticket={selectedTicket}
        onOpenChange={(open) => {
          setShowTicketDetails(open);
          if (!open) setSelectedTicket(null);
        }}
      />
    </div>
  );
};

export default CoordinatorAgentMonitoringTab;
