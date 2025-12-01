import { ReactNode, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ticket, TicketStatus } from "@/types/tickets";
import { useTicketStore } from "@/stores/ticketStore";
import { useAuthStore } from "@/stores/authStore";
import { CalendarIcon, MessageSquare, User2, Clock3, Tag, Bell, Star, Shield, Pencil } from "lucide-react";
import { format } from "date-fns";
import { getAgentDisplayName } from "@/data/teamMembers";
import { useTicketStatusJustification } from "@/hooks/useTicketStatusJustification";

interface TicketDetailsDialogProps {
  open: boolean;
  ticket: Ticket | null;
  onOpenChange: (open: boolean) => void;
}

export const TicketDetailsDialog = ({ open, ticket, onOpenChange }: TicketDetailsDialogProps) => {
  const { addNoteToTicket, updateTicket, addHistoryEntry, revertHistoryEntry } = useTicketStore();
  const { currentUser, canManageTicket } = useAuthStore();
  const { requestStatusChange, justificationDialog } = useTicketStatusJustification();
  const [note, setNote] = useState("");
  const [form, setForm] = useState({
    status: ticket?.status || "Pendente",
    priority: ticket?.priority || "Media",
    agente: ticket?.agente || "",
    dueDate: ticket?.dueDate || "",
    slaDias: ticket?.slaDias?.toString() || "",
    observacao: ticket?.observacao || "",
  });

  const notes = useMemo(() => ticket?.notes || [], [ticket]);
  const historyEntries = useMemo(() => ticket?.history || [], [ticket]);
  // Permitir que qualquer usuário mova/edite; se necessário, ajuste aqui para futuras restrições
  const canEdit = !!ticket && !!currentUser;

  useEffect(() => {
    if (!ticket) return;
    setForm({
      status: ticket.status,
      priority: ticket.priority || "Media",
      agente: ticket.agente,
      dueDate: ticket.dueDate || "",
      slaDias: ticket.slaDias?.toString() || "",
      observacao: ticket.observacao || "",
    });
    setNote("");
  }, [ticket]);

  const hasChanges = useMemo(() => {
    if (!ticket) return false;
    return (
      form.status !== ticket.status ||
      (form.priority || "Media") !== (ticket.priority || "Media") ||
      form.agente !== ticket.agente ||
      (form.dueDate || "") !== (ticket.dueDate || "") ||
      (form.slaDias || "") !== (ticket.slaDias?.toString() || "") ||
      form.observacao !== ticket.observacao
    );
  }, [form, ticket]);

  const handleSave = () => {
    if (!ticket || !canEdit || !hasChanges) return;

    const updates: Partial<Ticket> = {
      priority: form.priority as any,
      agente: form.agente as any,
      dueDate: form.dueDate || undefined,
      slaDias: form.slaDias ? Number(form.slaDias) : undefined,
      observacao: form.observacao,
      status: form.status as TicketStatus,
    };

    const changes: string[] = [];
    const before: Partial<Ticket> = {};
    const after: Partial<Ticket> = {};
    if ((form.priority || "Media") !== (ticket.priority || "Media")) {
      changes.push(`Prioridade: ${ticket.priority || "N/A"} -> ${form.priority}`);
      before.priority = ticket.priority;
      after.priority = form.priority as any;
    }
    if (form.agente !== ticket.agente) {
      changes.push(`Responsavel: ${ticket.agente} -> ${form.agente}`);
      before.agente = ticket.agente;
      after.agente = form.agente as any;
    }
    if ((form.dueDate || "") !== (ticket.dueDate || "")) {
      changes.push(`Vencimento: ${ticket.dueDate || "Sem"} -> ${form.dueDate || "Sem"}`);
      before.dueDate = ticket.dueDate;
      after.dueDate = form.dueDate || undefined;
    }
    if ((form.slaDias || "") !== (ticket.slaDias?.toString() || "")) {
      changes.push(`SLA: ${ticket.slaDias ?? "-"} -> ${form.slaDias || "-"}`);
      before.slaDias = ticket.slaDias;
      after.slaDias = form.slaDias ? Number(form.slaDias) : undefined;
    }
    if (form.observacao !== ticket.observacao) {
      changes.push("Descricao editada");
      before.observacao = ticket.observacao;
      after.observacao = form.observacao;
    }
    if (form.status !== ticket.status) {
      changes.push(`Status: ${ticket.status} -> ${form.status}`);
      before.status = ticket.status;
      after.status = form.status as TicketStatus;
    }

    const historyAction = changes.join(" | ") || "Atualizacao no ticket";
    const registerHistory = () => {
      if (!changes.length) return;
      const timestamp = new Date().toISOString();
      addHistoryEntry(ticket.id, {
        id: `${ticket.id}-hist-${Date.now()}`,
        author: currentUser?.name || currentUser?.agente || "Usuario",
        action: historyAction,
        timestamp,
        before,
        after,
      });
    };

    const applyFieldUpdates = () => {
      if (!changes.length) return;

      updateTicket(ticket.id, updates);
      addNoteToTicket(ticket.id, {
        id: `${ticket.id}-change-${Date.now()}`,
        author: currentUser?.name || currentUser?.agente || "Usu?rio",
        content: `Atualizacoes: ${changes.join(" | ")}`,
        createdAt: new Date().toISOString(),
      });
      registerHistory();
    };

    if (form.status !== ticket.status) {
      requestStatusChange(ticket, form.status as TicketStatus, () => {
        applyFieldUpdates();
        registerHistory();
        addNoteToTicket(ticket.id, {
          id: `${ticket.id}-status-${Date.now()}`,
          author: currentUser?.name || currentUser?.agente || "Usu?rio",
          content: `Status alterado para ${form.status} por ${currentUser?.name || currentUser?.agente || "Usu?rio"}. Dono do ticket: ${ticket.agente}`,
          createdAt: new Date().toISOString(),
        });
      });
      return;
    }

    applyFieldUpdates();
  };

  const handleAddNote = () => {
    if (!ticket || !note.trim()) return;
    addNoteToTicket(ticket.id, {
      id: `${ticket.id}-${Date.now()}`,
      author: currentUser?.name || currentUser?.agente || "Usu?rio",
      content: note.trim(),
      createdAt: new Date().toISOString(),
    });
    setNote("");
  };

  const handleRevert = (entryId: string) => {
    if (!ticket) return;
    revertHistoryEntry(ticket.id, entryId, currentUser?.name || currentUser?.agente || "Usuario");
  };

  if (!ticket) return null;

  const createdLabel = ticket.createdAt ? format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm") : "-";
  const dueLabel = ticket.dueDate ? format(new Date(ticket.dueDate), "dd/MM/yyyy") : "Sem vencimento";
  const agentDisplay = getAgentDisplayName(form.agente || ticket.agente);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[96vw] max-h-[85vh] p-0 overflow-hidden border border-border/70 shadow-2xl flex flex-col">
        <DialogHeader className="border-b border-border/60 bg-muted/40 px-6 py-4">
          <DialogTitle className="flex items-center gap-3 text-xl sm:text-2xl">
            <Badge variant="secondary" className="font-mono text-base sm:text-lg px-3 py-2 rounded-full bg-muted text-foreground">
              {ticket.id}
            </Badge>
            <span className="leading-tight text-base sm:text-lg">
              {ticket.observacao.slice(0, 80) || "Ticket SAF"}
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Resumo do ticket, responsaveis e atividade recente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 px-6 py-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.9fr] gap-5">
            <div className="space-y-4">
              <div className="rounded-xl border bg-card p-4 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, status: value as any }))}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pendente">Pendente</SelectItem>
                        <SelectItem value="Em andamento">Em andamento</SelectItem>
                        <SelectItem value="Resolvido">Resolvido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Prioridade</Label>
                    <Select
                      value={form.priority}
                      onValueChange={(value) => setForm((prev) => ({ ...prev, priority: value as any }))}
                      disabled={!canEdit}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Media">Media</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Critica">Critica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Responsavel</Label>
                    <Input
                      value={form.agente}
                      onChange={(e) => setForm((prev) => ({ ...prev, agente: e.target.value as any }))}
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Vencimento</Label>
                    <Input
                      type="date"
                      value={form.dueDate ? form.dueDate.slice(0, 10) : ""}
                      onChange={(e) => setForm((prev) => ({ ...prev, dueDate: e.target.value }))}
                      disabled={!canEdit}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">SLA (dias)</Label>
                    <Input
                      type="number"
                      min={0}
                      value={form.slaDias}
                      onChange={(e) => setForm((prev) => ({ ...prev, slaDias: e.target.value }))}
                      disabled={!canEdit}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                  <span className="flex items-center gap-1">
                    <Clock3 className="h-4 w-4" /> Criado em <span className="font-medium text-foreground">{createdLabel}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="h-4 w-4" /> Criador <span className="font-medium text-foreground">{ticket.createdBy || "N/A"}</span>
                  </span>
                </div>
                <div className="flex justify-end">
                  <Button onClick={handleSave} disabled={!canEdit || !hasChanges} className="min-w-[180px]">
                    Salvar alteraes
                  </Button>
                </div>
              </div>

            <div className="space-y-2 rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Tag className="h-4 w-4" />
                Descrio
              </div>
                <Textarea
                  className="min-h-[120px]"
                  value={form.observacao}
                  onChange={(e) => setForm((prev) => ({ ...prev, observacao: e.target.value }))}
                  disabled={!canEdit}
                  placeholder="Atualize a descricao do ticket"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MessageSquare className="h-4 w-4" />
                  Atividade
                </div>
                <Badge variant="outline">{notes.length} registros</Badge>
              </div>
              <Separator />

              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {notes.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum comentario ainda.</p>
                )}
                {notes.map((n) => (
                  <div key={n.id} className="rounded-md border border-border/60 bg-background p-2">
                    <div className="flex items-center justify-between text-[12px] text-muted-foreground mb-1">
                      <span className="font-medium text-foreground">{n.author}</span>
                      <span>{format(new Date(n.createdAt), "dd/MM HH:mm")}</span>
                    </div>
                    <p className="text-sm">{n.content}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <Textarea
                  placeholder="Escreva um comentario"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  className="rounded-lg"
                />
                <Button onClick={handleAddNote} disabled={!note.trim()}>
                  Adicionar comentario
                </Button>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border/60 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Clock3 className="h-4 w-4" />
                  Historico de alteracoes
                </div>
                <Badge variant="outline">{historyEntries.length} registros</Badge>
              </div>
              <Separator />
              <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
                {historyEntries.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhuma alteracao registrada.</p>
                )}
                {historyEntries.map((h) => (
                  <div key={h.id} className="rounded-md border border-border/60 bg-background p-2">
                    <div className="flex items-center justify-between text-[12px] text-muted-foreground mb-1">
                      <span className="font-medium text-foreground">{h.author}</span>
                      <span>{format(new Date(h.timestamp), "dd/MM HH:mm")}</span>
                    </div>
                    <p className="text-sm mb-2">{h.action}</p>
                    <div className="flex items-center justify-end">
                      <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => handleRevert(h.id)}>
                        Reverter
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      </Dialog>
      {justificationDialog}
    </>
  );
};
