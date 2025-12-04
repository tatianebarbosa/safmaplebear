import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Ticket, TicketStatus, Agente } from "@/types/tickets";
import { useAuthStore } from "@/stores/authStore";
import { format, differenceInDays } from "date-fns";
import { Edit, CheckCircle, MoreVertical, MessageSquare } from "lucide-react";
import { getAgentDisplayName } from "@/data/teamMembers";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTicketStatusJustification } from "@/hooks/useTicketStatusJustification";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTicketStore } from "@/stores/ticketStore";

interface TicketTableProps {
  tickets: Ticket[];
  onOpenDetails: (ticket: Ticket) => void;
}

type EditableField = "agente" | "diasAberto" | "status" | "dueDate" | "observacao";

export const TicketTable = ({ tickets, onOpenDetails }: TicketTableProps) => {
  const { currentUser, isCoordinator, isAdmin } = useAuthStore();
  const { requestStatusChange, justificationDialog } = useTicketStatusJustification();
  const { updateTicket, moveTicket, addHistoryEntry, addNoteToTicket } = useTicketStore();
  const [inlineEdit, setInlineEdit] = useState<{
    ticket: Ticket;
    field: EditableField;
    value: string;
  } | null>(null);
  const [justification, setJustification] = useState("");

  const canEditTicket = (ticket: Ticket) => {
    const me = currentUser?.name || currentUser?.agente;
    return isAdmin() || isCoordinator() || (me ? ticket.createdBy === me : false);
  };

  const getSLABadge = (diasAberto: number) => {
    if (diasAberto >= 15) {
      return <Badge variant="destructive" className="text-xs">Crtico</Badge>;
    }
    if (diasAberto >= 8) {
      return <Badge variant="warning" className="text-xs">Ateno</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Normal</Badge>;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pendente':
        return (
          <Badge
            variant="outline"
            className="bg-muted text-foreground border-border px-3 py-1"
          >
            Pendente
          </Badge>
        );
      case 'Em andamento':
        return <Badge variant="info">Em andamento</Badge>;
      case 'Resolvido':
        return <Badge variant="success">Resolvido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDueDateInfo = (dueDate?: string) => {
    if (!dueDate) return { text: '-', variant: 'outline' as const };
    
    const now = new Date();
    const due = new Date(dueDate);
    const diffDays = differenceInDays(due, now);
    
    if (diffDays < 0) {
      return { 
        text: `Atrasado ${Math.abs(diffDays)}d`, 
        variant: 'destructive' as const 
      };
    }
    if (diffDays === 0) {
      return { 
        text: 'Vence hoje', 
        variant: 'default' as const 
      };
    }
    if (diffDays <= 3) {
      return { 
        text: `${diffDays}d`, 
        variant: 'secondary' as const 
      };
    }
    
    return { 
      text: format(due, 'dd/MM/yyyy'), 
      variant: 'outline' as const 
    };
  };

  const handleStatusChange = (ticket: Ticket, status: TicketStatus) => {
    if (!canEditTicket(ticket)) return;
    requestStatusChange(ticket, status);
  };

  const handleResolve = (ticket: Ticket) => {
    handleStatusChange(ticket, 'Resolvido');
  };

  const fieldLabels: Record<EditableField, string> = {
    agente: "Agente",
    diasAberto: "Dias",
    status: "Status",
    dueDate: "Vencimento",
    observacao: "Observacao",
  };
  const canonicalAgent = (agent: Agente): Agente => {
    if (agent === "Rafha") return "Rafhael";
    if (agent === "Tati") return "Tatiane";
    if (agent === "Jaque") return "Jaqueline";
    return agent;
  };
  const agentOptions: { value: Agente; label: string }[] = Array.from(
    new Set(
      ([
        "Joao",
        "Ingrid",
        "Rafha",
        "Rafhael",
        "Tati",
        "Tatiane",
        "Jaque",
        "Jaqueline",
        "Jessika",
        "Yasmin",
        "Fernanda",
      ] as Agente[]).map(canonicalAgent)
    )
  ).map((value) => ({
    value,
    label: getAgentDisplayName(value),
  }));

  const normalizeFieldValue = (ticket: Ticket, field: EditableField) => {
    switch (field) {
      case "agente":
        return canonicalAgent(ticket.agente as Agente);
      case "diasAberto":
        return ticket.diasAberto.toString();
      case "status":
        return ticket.status;
      case "dueDate":
        return ticket.dueDate ? ticket.dueDate.slice(0, 10) : "";
      case "observacao":
        return ticket.observacao || "";
      default:
        return "";
    }
  };

  const openInlineEdit = (ticket: Ticket, field: EditableField) => {
    if (!canEditTicket(ticket)) return;
    setInlineEdit({
      ticket,
      field,
      value: normalizeFieldValue(ticket, field),
    });
    setJustification("");
  };

  const closeInlineEdit = () => {
    setInlineEdit(null);
    setJustification("");
  };

  const inlineHasChange = inlineEdit
    ? (() => {
        const current = normalizeFieldValue(inlineEdit.ticket, inlineEdit.field);
        if (inlineEdit.field === "diasAberto") {
          return Number(current) !== Number(inlineEdit.value);
        }
        return current !== inlineEdit.value;
      })()
    : false;

  const inlineInvalidValue =
    inlineEdit?.field === "diasAberto" &&
    (inlineEdit.value.trim() === "" || Number.isNaN(Number(inlineEdit.value)));

  const handleInlineSave = () => {
    if (!inlineEdit || !inlineHasChange || inlineInvalidValue) return;
    const reason = justification.trim();
    if (!reason) return;

    const { ticket, field, value } = inlineEdit;
    const author = currentUser?.name || currentUser?.agente || "Sistema";
    const now = new Date().toISOString();

    const registerHistory = (action: string, before: Partial<Ticket>, after: Partial<Ticket>) => {
      addHistoryEntry(ticket.id, {
        id: `${ticket.id}-inline-${Date.now()}`,
        author,
        action: `${action} | Motivo: ${reason}`,
        timestamp: now,
        before,
        after,
      });
      addNoteToTicket(ticket.id, {
        id: `${ticket.id}-note-${Date.now()}`,
        author,
        content: `${action}. Motivo: ${reason}`,
        createdAt: now,
      });
    };

    switch (field) {
      case "status": {
        moveTicket(ticket.id, value as TicketStatus, { reason, author });
        break;
      }
      case "agente": {
        const beforeLabel = getAgentDisplayName(ticket.agente);
        const afterLabel = getAgentDisplayName(value);
        const canonical = canonicalAgent(value as Agente);
        updateTicket(ticket.id, { agente: canonical as any, responsavel: canonical as any });
        registerHistory(
          `Agente: ${beforeLabel} -> ${afterLabel}`,
          { agente: ticket.agente },
          { agente: canonical as any, responsavel: canonical as any }
        );
        break;
      }
      case "diasAberto": {
        const newDays = Number(value);
        updateTicket(ticket.id, { diasAberto: newDays });
        registerHistory(`Dias em aberto: ${ticket.diasAberto} -> ${newDays}`, { diasAberto: ticket.diasAberto }, { diasAberto: newDays });
        break;
      }
      case "dueDate": {
        if (value) {
          const parsed = new Date(`${value}T00:00:00`);
          if (Number.isNaN(parsed.getTime())) return;
          const iso = parsed.toISOString();
          updateTicket(ticket.id, { dueDate: iso });
          registerHistory(
            `Vencimento: ${ticket.dueDate ? ticket.dueDate.slice(0, 10) : "Sem"} -> ${value}`,
            { dueDate: ticket.dueDate },
            { dueDate: iso }
          );
        } else {
          updateTicket(ticket.id, { dueDate: undefined });
          registerHistory(
            `Vencimento: ${ticket.dueDate ? ticket.dueDate.slice(0, 10) : "Sem"} -> Sem`,
            { dueDate: ticket.dueDate },
            { dueDate: undefined }
          );
        }
        break;
      }
      case "observacao": {
        updateTicket(ticket.id, { observacao: value });
        registerHistory("Observacao atualizada", { observacao: ticket.observacao }, { observacao: value });
        break;
      }
      default:
        break;
    }

    closeInlineEdit();
  };

  const renderInlineInput = () => {
    if (!inlineEdit) return null;
    const handleValueChange = (value: string) =>
      setInlineEdit((prev) => (prev ? { ...prev, value } : prev));

    switch (inlineEdit.field) {
      case "status":
        return (
          <Select
            value={inlineEdit.value}
            onValueChange={(v) => handleValueChange(v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Em andamento">Em andamento</SelectItem>
              <SelectItem value="Resolvido">Resolvido</SelectItem>
            </SelectContent>
          </Select>
        );
      case "dueDate":
        return (
          <Input
            type="date"
            value={inlineEdit.value}
            onChange={(e) => handleValueChange(e.target.value)}
          />
        );
      case "diasAberto":
        return (
          <Input
            type="number"
            min={0}
            value={inlineEdit.value}
            onChange={(e) => handleValueChange(e.target.value)}
          />
        );
      case "observacao":
        return (
          <Textarea
            rows={4}
            value={inlineEdit.value}
            onChange={(e) => handleValueChange(e.target.value)}
          />
        );
      case "agente":
      default:
        return (
          <Select value={inlineEdit.value} onValueChange={(v) => handleValueChange(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {agentOptions.map((agent) => (
                <SelectItem key={agent.value} value={agent.value}>
                  {agent.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
    }
  };

  const canConfirmInline =
    !!inlineEdit &&
    inlineHasChange &&
    justification.trim().length > 0 &&
    !inlineInvalidValue;

  if (tickets.length === 0) {
    return (
      <>
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground">Nenhum ticket encontrado</p>
          </CardContent>
        </Card>
        {justificationDialog}
      </>
    );
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ticket</TableHead>
              <TableHead>Agente</TableHead>
              <TableHead>Dias</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead>Observao</TableHead>
              <TableHead>Atualizado</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => {
              const canEdit = canEditTicket(ticket);
              const dueDateInfo = getDueDateInfo(ticket.dueDate);
              
              return (
                <TableRow key={ticket.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold">
                        {ticket.id}
                      </span>
                      {getSLABadge(ticket.diasAberto)}
                    </div>
                  </TableCell>
                  
                  <TableCell
                    onDoubleClick={() => openInlineEdit(ticket, "agente")}
                    className="cursor-pointer"
                    title="Duplo clique para editar agente"
                  >
                    <span className="font-medium">{getAgentDisplayName(ticket.agente)}</span>
                  </TableCell>
                  
                  <TableCell
                    onDoubleClick={() => openInlineEdit(ticket, "diasAberto")}
                    className="cursor-pointer"
                    title="Duplo clique para editar dias em aberto"
                  >
                    <span className="text-sm">{ticket.diasAberto}</span>
                  </TableCell>
                  
                  <TableCell
                    onDoubleClick={() => openInlineEdit(ticket, "status")}
                    className="cursor-pointer"
                    title="Duplo clique para editar status"
                  >
                    {getStatusBadge(ticket.status)}
                  </TableCell>
                  
                  <TableCell
                    onDoubleClick={() => openInlineEdit(ticket, "dueDate")}
                    className="cursor-pointer"
                    title="Duplo clique para editar vencimento"
                  >
                    <Badge variant={dueDateInfo.variant} className="text-xs">
                      {dueDateInfo.text}
                    </Badge>
                  </TableCell>
                  
                  <TableCell
                    className="max-w-xs cursor-pointer"
                    onDoubleClick={() => openInlineEdit(ticket, "observacao")}
                    title="Duplo clique para editar observacao"
                  >
                    <p className="text-sm text-muted-foreground truncate">
                      {ticket.observacao}
                    </p>
                  </TableCell>
                  
                  <TableCell>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(ticket.updatedAt), 'dd/MM/yyyy HH:mm')}
                    </span>
                  </TableCell>
                  
                  <TableCell>
                    {canEdit && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onOpenDetails(ticket)}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Ver detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          {ticket.status !== 'Resolvido' && (
                            <DropdownMenuItem onClick={() => handleResolve(ticket)}>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Resolver
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        </CardContent>
      </Card>
      <Dialog open={!!inlineEdit} onOpenChange={(open) => !open && closeInlineEdit()}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>
              {inlineEdit ? `Editar ${fieldLabels[inlineEdit.field]}` : "Editar campo"}
            </DialogTitle>
            <DialogDescription>
              {inlineEdit ? `Ticket ${inlineEdit.ticket.id}. Informe o novo valor e a justificativa; tudo sera registrado.` : ""}
            </DialogDescription>
          </DialogHeader>

          {inlineEdit && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>{fieldLabels[inlineEdit.field]}</Label>
                {renderInlineInput()}
                {inlineInvalidValue && (
                  <p className="text-xs text-destructive">Informe um numero valido.</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Justificativa *</Label>
                <Textarea
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  rows={4}
                  placeholder="Explique o motivo da alteracao"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                A justificativa sera salva no historico e nas notas do ticket.
              </p>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeInlineEdit}>
              Cancelar
            </Button>
            <Button onClick={handleInlineSave} disabled={!canConfirmInline}>
              Salvar alteracao
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {justificationDialog}
    </>
  );
};
