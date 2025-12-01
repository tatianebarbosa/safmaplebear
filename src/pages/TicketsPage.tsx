import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, BarChart3, Clock, CheckCircle, AlertTriangle, Table, Kanban } from "lucide-react";
import { useTicketStore } from "@/stores/ticketStore";
import { useAuthStore } from "@/stores/authStore";
import { TicketKanban } from "@/components/tickets/TicketKanban";
import { TicketTable } from "@/components/tickets/TicketTable";
import { TicketDialog } from "@/components/tickets/TicketDialog";
import { TicketDetailsDialog } from "@/components/tickets/TicketDetailsDialog";
import { TicketStatus, Agente } from "@/types/tickets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const agentes: Agente[] = [
  "Joao",
  "Rafhael",
  "Ingrid",
  "Yasmin",
  "Tatiane",
  "Jaqueline",
  "Jessika",
  "Rafha",
  "Tati",
  "Jaque",
  "Fernanda",
];

const TicketsPage = () => {
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);

  const { filters, setFilters, getFilteredTickets } = useTicketStore();
  const { hasRole } = useAuthStore();

  const filteredTickets = getFilteredTickets();

  const stats = {
    total: filteredTickets.length,
    pendente: filteredTickets.filter((t) => t.status === "Pendente").length,
    emAndamento: filteredTickets.filter((t) => t.status === "Em andamento").length,
    resolvido: filteredTickets.filter((t) => t.status === "Resolvido").length,
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) return;

      switch (e.key.toLowerCase()) {
        case "n":
          if (hasRole("Agent")) {
            setShowCreateDialog(true);
          }
          break;
        case "k":
          setView("kanban");
          break;
        case "t":
          setView("table");
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [hasRole]);

  return (
    <div className="layout-wide w-full py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tickets SAF</h1>
          <p className="text-muted-foreground">Gerencie seus tickets de atendimento</p>
        </div>

        {hasRole("Agent") && (
          <Button onClick={() => setShowCreateDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Novo Ticket
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendente</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendente}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <AlertTriangle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.emAndamento}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvido</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.resolvido}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por ID ou observacao..."
                value={filters.search || ""}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.status || "all"}
              onValueChange={(value) =>
                setFilters({ ...filters, status: value === "all" ? undefined : (value as TicketStatus) })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Pendente">Pendente</SelectItem>
                <SelectItem value="Em andamento">Em andamento</SelectItem>
                <SelectItem value="Resolvido">Resolvido</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.agente || "all"}
              onValueChange={(value) =>
                setFilters({ ...filters, agente: value === "all" ? undefined : (value as Agente) })
              }
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os agentes</SelectItem>
                {agentes.map((agente) => (
                  <SelectItem key={agente} value={agente}>
                    {agente}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Button
                variant={view === "kanban" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("kanban")}
                className="gap-2"
              >
                <Kanban className="h-4 w-4" />
                Kanban
              </Button>
              <Button
                variant={view === "table" ? "default" : "outline"}
                size="sm"
                onClick={() => setView("table")}
                className="gap-2"
              >
                <Table className="h-4 w-4" />
                Tabela
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="min-h-96">
        {view === "kanban" ? (
          <TicketKanban
            tickets={filteredTickets}
            onOpenDetails={(ticket) => {
              setSelectedTicket(ticket);
              setShowDetails(true);
            }}
          />
        ) : (
          <TicketTable
            tickets={filteredTickets}
            onOpenDetails={(ticket) => {
              setSelectedTicket(ticket);
              setShowDetails(true);
            }}
          />
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        <span className="font-medium">Atalhos:</span> N (novo)  K (kanban)  T (tabela)
      </div>

      <TicketDialog open={showCreateDialog} onOpenChange={setShowCreateDialog} />
      <TicketDetailsDialog
        open={showDetails}
        onOpenChange={(open) => {
          setShowDetails(open);
          if (!open) setSelectedTicket(null);
        }}
        ticket={selectedTicket}
      />
    </div>
  );
};

export default TicketsPage;
