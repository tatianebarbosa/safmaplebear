import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTicketStore } from "@/stores/ticketStore";
import { useAuthStore } from "@/stores/authStore";
import { Ticket, TicketStatus, Agente, TicketPriority } from "@/types/tickets";
import { toast } from "sonner";
import { getAgentDisplayName } from "@/data/teamMembers";

interface TicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: Ticket | null;
}

const statusOptions: TicketStatus[] = ["Pendente", "Em andamento", "Resolvido"];
const priorityOptions: TicketPriority[] = ["Baixa", "Media", "Alta", "Critica"];

const canonicalAgentMap: Record<Agente, Agente> = {
  Tati: "Tatiane",
  Rafha: "Rafhael",
  Jaque: "Jaqueline",
  Joao: "Joao",
  Ingrid: "Ingrid",
  Rafhael: "Rafhael",
  Tatiane: "Tatiane",
  Jaqueline: "Jaqueline",
  Jessika: "Jessika",
  Yasmin: "Yasmin Martins",
  "Yasmin Martins": "Yasmin Martins",
  Fernanda: "Fernanda",
};

const normalizeAgent = (agent?: Agente): Agente =>
  agent ? canonicalAgentMap[agent] || agent : "Joao";

export const TicketDialog = ({ open, onOpenChange, ticket }: TicketDialogProps) => {
  const { createTicket, updateTicket } = useTicketStore();
  const { currentUser, isCoordinator, isAdmin, users } = useAuthStore();

  const agentes = useMemo<Agente[]>(() => {
    const mapped = (users || [])
      .filter((u) => !!u.agente)
      .map((u) => normalizeAgent(u.agente as Agente));
    const fallback: Agente[] = [
      "Joao",
      "Rafhael",
      "Ingrid",
      "Yasmin Martins",
      "Tatiane",
      "Jaqueline",
      "Jessika",
      "Fernanda",
    ];
    return Array.from(new Set((mapped.length ? mapped : fallback).map((a) => normalizeAgent(a))));
  }, [users]);

  const defaultAgente = normalizeAgent(
    (ticket?.agente || currentUser?.agente || (currentUser?.name as Agente) || agentes[0]) as Agente
  );
  const defaultCreatedBy = ticket?.createdBy || currentUser?.name || currentUser?.agente || "Usuario logado";
  const creationMoment = useMemo(() => (ticket?.createdAt ? new Date(ticket.createdAt) : new Date()), [ticket]);

  const [formData, setFormData] = useState({
    id: ticket?.id || "",
    agente: defaultAgente as Agente,
    createdBy: defaultCreatedBy,
    status: ticket?.status || ("Pendente" as TicketStatus),
    priority: ticket?.priority || ("Media" as TicketPriority),
    observacao: ticket?.observacao || "",
    dueDate: ticket?.dueDate ? new Date(ticket.dueDate) : (undefined as Date | undefined),
  });

  const isEditing = !!ticket;
  const isCreator = ticket ? ticket.createdBy === currentUser?.name || ticket.createdBy === currentUser?.agente : true;
  const canEditAgent = isAdmin() || isCoordinator();
  const canEditTicket = isAdmin() || isCoordinator() || isCreator;
  const isReadOnly = isEditing && !canEditTicket;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.id.trim() || !formData.observacao.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatorios");
      return;
    }

    if (isReadOnly) {
      toast.error("Voce nao pode editar este ticket. Apenas quem criou, coordenador ou admin podem editar.");
      return;
    }

    const ticketId = formData.id.startsWith("#") ? formData.id : `#${formData.id}`;

    const payload = {
      ...formData,
      id: ticketId,
      dueDate: formData.dueDate?.toISOString(),
      diasAberto: ticket?.diasAberto ?? 0,
      createdBy: formData.createdBy || currentUser?.name || currentUser?.agente || "Usuario logado",
      ...(ticket?.createdAt ? { createdAt: ticket.createdAt } : {}),
    } as Ticket;

    try {
      if (isEditing && ticket) {
        updateTicket(ticket.id, payload);
        toast.success("Ticket atualizado com sucesso");
      } else {
        createTicket(payload);
        toast.success("Ticket criado com sucesso");
      }
      onOpenChange(false);
      resetForm();
    } catch {
      toast.error("Erro ao salvar ticket");
    }
  };

  const resetForm = () => {
    setFormData({
      id: "",
      agente: normalizeAgent((currentUser?.agente as Agente) || "Joao"),
      createdBy: currentUser?.name || currentUser?.agente || "Usuario logado",
      status: "Pendente",
      priority: "Media",
      observacao: "",
      dueDate: undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Ticket" : "Novo Ticket"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-sm text-muted-foreground">
            <span>
              Criado por <span className="font-medium text-foreground">{formData.createdBy || "Usuario"}</span>
            </span>
            <span className="mx-2">•</span>
            <span className="font-medium text-foreground">{format(creationMoment, "dd/MM/yyyy HH:mm")}</span>
          </div>

          {isReadOnly && (
            <div className="rounded-md border border-border/60 bg-muted/50 p-3 text-xs text-muted-foreground">
              Somente quem criou o ticket, coordenador ou admin podem editar. Você pode registrar comentários pelo card.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id">ID do Ticket *</Label>
              <Input
                id="id"
                placeholder="#123456"
                value={formData.id}
                onChange={(e) => setFormData((prev) => ({ ...prev, id: e.target.value }))}
                required
                disabled={isReadOnly}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agente">Agente Responsavel *</Label>
              {canEditAgent && !isReadOnly ? (
                <Select
                  value={formData.agente}
                  onValueChange={(value: Agente) => setFormData((prev) => ({ ...prev, agente: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {agentes.map((agente) => (
                      <SelectItem key={agente} value={agente}>
                        {getAgentDisplayName(agente)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <>
                  <Input value={getAgentDisplayName(formData.agente)} disabled />
                  {!canEditAgent && (
                    <p className="text-xs text-muted-foreground">Assumido automaticamente pelo usuario logado.</p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: TicketStatus) => setFormData((prev) => ({ ...prev, status: value }))}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Prioridade</Label>
              <Select
                value={formData.priority}
                onValueChange={(value: TicketPriority) => setFormData((prev) => ({ ...prev, priority: value }))}
                disabled={isReadOnly}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a prioridade" />
                </SelectTrigger>
                <SelectContent>
                  {priorityOptions.map((prio) => (
                    <SelectItem key={prio} value={prio}>
                      {prio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn("w-full justify-start text-left font-normal", !formData.dueDate && "text-muted-foreground")}
                    disabled={isReadOnly}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? format(formData.dueDate, "dd/MM/yyyy") : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => setFormData((prev) => ({ ...prev, dueDate: date || undefined }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação *</Label>
            <Textarea
              id="observacao"
              placeholder="Descreva o problema ou situação..."
              value={formData.observacao}
              onChange={(e) => setFormData((prev) => ({ ...prev, observacao: e.target.value }))}
              rows={4}
              required
              disabled={isReadOnly}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isReadOnly}>
              {isEditing ? "Atualizar" : "Criar"} Ticket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

