import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  User,
  AlertCircle,
  CheckCircle,
  XCircle,
  Plus,
  Search,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { normalizeTicketId } from "@/lib/stringUtils";

interface Ticket {
  id: string;
  numero: string;
  responsavel: string;
  diasPendente: number;
  status: "Pendente" | "Resolvido" | "Em Andamento";
  observacao: string;
  dataUltimaAtualizacao: Date;
  historico: Array<{
    data: Date;
    usuario: string;
    acao: string;
    detalhes: string;
  }>;
}

// Mock data baseado na planilha fornecida
const mockTickets: Ticket[] = [
  {
    id: "1",
    numero: "#258209",
    responsavel: "João",
    diasPendente: 22,
    status: "Pendente",
    observacao: "aguardando dados, para Douglas colocar no dominio o PC do CRM",
    dataUltimaAtualizacao: new Date("2024-08-31"),
    historico: [
      {
        data: new Date("2024-08-31"),
        usuario: "João",
        acao: "Criou ticket",
        detalhes: "Ticket criado para configuração CRM",
      },
    ],
  },
  {
    id: "2",
    numero: "#258809",
    responsavel: "João",
    diasPendente: 17,
    status: "Pendente",
    observacao: "esse caso quem está verificando é Fernanda Inacio de Edtech",
    dataUltimaAtualizacao: new Date("2024-09-05"),
    historico: [
      {
        data: new Date("2024-09-05"),
        usuario: "João",
        acao: "Atualização",
        detalhes: "Transferido para Fernanda Inacio de Edtech",
      },
    ],
  },
];

const MonitoringPortal = () => {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newTicket, setNewTicket] = useState({
    numero: "",
    responsavel: "",
    observacao: "",
    status: "Pendente" as const,
  });

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.responsavel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.observacao.toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === "all") return matchesSearch;
    return matchesSearch && ticket.status === statusFilter;
  });

  const handleCreateTicket = () => {
    const normalizedNumber = normalizeTicketId(newTicket.numero);

    if (normalizedNumber !== newTicket.numero) {
      setNewTicket((prev) => ({ ...prev, numero: normalizedNumber }));
    }

    if (!normalizedNumber || !newTicket.responsavel || !newTicket.observacao) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const ticket: Ticket = {
      id: Date.now().toString(),
      numero: normalizedNumber,
      responsavel: newTicket.responsavel,
      diasPendente: 0,
      status: newTicket.status,
      observacao: newTicket.observacao,
      dataUltimaAtualizacao: new Date(),
      historico: [
        {
          data: new Date(),
          usuario: "Sistema",
          acao: "Ticket criado",
          detalhes: `Ticket criado por Sistema`,
        },
      ],
    };

    setTickets([ticket, ...tickets]);
    setNewTicket({
      numero: "",
      responsavel: "",
      observacao: "",
      status: "Pendente",
    });
    setIsCreateDialogOpen(false);

    toast({
      title: "Sucesso",
      description: "Ticket criado com sucesso!",
    });
  };

  const handleUpdateTicketStatus = (
    ticketId: string,
    newStatus: Ticket["status"]
  ) => {
    setTickets(
      tickets.map((ticket) => {
        if (ticket.id === ticketId) {
          return {
            ...ticket,
            status: newStatus,
            dataUltimaAtualizacao: new Date(),
            historico: [
              ...ticket.historico,
              {
                data: new Date(),
                usuario: "Sistema",
                acao: "Status alterado",
                detalhes: `Status alterado para ${newStatus}`,
              },
            ],
          };
        }
        return ticket;
      })
    );

    toast({
      title: "Status Atualizado",
      description: `Ticket ${newStatus.toLowerCase()} com sucesso!`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <AlertCircle className="w-6 h-6 text-primary-dark" />
            </div>
            Portal de Monitoramento
          </h1>
          <p className="text-muted-foreground mt-2">
            Controle de atendimento e tickets do SAF
          </p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Ticket
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Criar Novo Ticket</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="numero">Número do Ticket*</Label>
                <Input
                  id="numero"
                  placeholder="#123456"
                  value={newTicket.numero}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, numero: normalizeTicketId(e.target.value) })
                  }
                />
              </div>
              <div>
                <Label htmlFor="responsavel">Responsável*</Label>
                <Select
                  value={newTicket.responsavel}
                  onValueChange={(value) =>
                    setNewTicket({ ...newTicket, responsavel: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="João">João</SelectItem>
                    <SelectItem value="Ingrid">Ingrid</SelectItem>
                    <SelectItem value="Tati">Tati</SelectItem>
                    <SelectItem value="Rafha">Rafha</SelectItem>
                    <SelectItem value="Jaque">Jaque</SelectItem>
                    <SelectItem value="Jessika">Jessika</SelectItem>
                    <SelectItem value="Fernanda">Fernanda</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="observacao">Observação*</Label>
                <Textarea
                  id="observacao"
                  placeholder="Descreva o problema ou solicitação..."
                  value={newTicket.observacao}
                  onChange={(e) =>
                    setNewTicket({ ...newTicket, observacao: e.target.value })
                  }
                />
              </div>
              <Button onClick={handleCreateTicket} className="w-full">
                Criar Ticket
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número, responsável ou observação"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
          <SelectTrigger>
            <SelectValue placeholder="Filtrar status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Pendente">Pendentes</SelectItem>
            <SelectItem value="Em Andamento">Em andamento</SelectItem>
            <SelectItem value="Resolvido">Resolvidos</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => setSearchTerm("")}>
            Limpar filtros
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">
                  {tickets.filter((t) => t.status === "Pendente").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Em Andamento</p>
                <p className="text-2xl font-bold">
                  {tickets.filter((t) => t.status === "Em Andamento").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Resolvidos</p>
                <p className="text-2xl font-bold">
                  {tickets.filter((t) => t.status === "Resolvido").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">
                  Críticos (20+ dias)
                </p>
                <p className="text-2xl font-bold">
                  {tickets.filter((t) => t.diasPendente >= 20).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets ({filteredTickets.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="border rounded-lg p-4 border-l-4 border-l-red-500"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{ticket.numero}</h3>
                      <Badge
                        variant={
                          ticket.status === "Pendente"
                            ? "destructive"
                            : ticket.status === "Resolvido"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {ticket.status}
                      </Badge>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <User className="w-4 h-4" />
                        {ticket.responsavel}
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {ticket.diasPendente} dias
                      </div>
                    </div>
                    <p className="text-muted-foreground">{ticket.observacao}</p>
                  </div>
                  <div className="flex gap-2">
                    {ticket.status === "Pendente" && (
                      <Button
                        size="sm"
                        onClick={() =>
                          handleUpdateTicketStatus(ticket.id, "Resolvido")
                        }
                      >
                        Resolver
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredTickets.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum ticket encontrado
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringPortal;
