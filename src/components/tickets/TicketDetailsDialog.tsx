import { ReactNode, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Ticket } from "@/types/tickets";
import { useTicketStore } from "@/stores/ticketStore";
import { useAuthStore } from "@/stores/authStore";
import { CalendarIcon, MessageSquare, User2, Clock3, Tag, Bell, Star, Shield } from "lucide-react";
import { format } from "date-fns";

interface TicketDetailsDialogProps {
  open: boolean;
  ticket: Ticket | null;
  onOpenChange: (open: boolean) => void;
}

const InfoRow = ({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: ReactNode;
}) => (
  <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3 py-2 text-sm">
    <div className="flex items-center gap-2 text-muted-foreground">
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
    <div className="font-medium text-foreground">{value}</div>
  </div>
);

export const TicketDetailsDialog = ({ open, ticket, onOpenChange }: TicketDetailsDialogProps) => {
  const { addNoteToTicket } = useTicketStore();
  const { currentUser } = useAuthStore();
  const [note, setNote] = useState("");

  const notes = useMemo(() => ticket?.notes || [], [ticket]);
  const handleAddNote = () => {
    if (!ticket || !note.trim()) return;
    addNoteToTicket(ticket.id, {
      id: `${ticket.id}-${Date.now()}`,
      author: currentUser?.name || currentUser?.agente || "Usuario",
      content: note.trim(),
      createdAt: new Date().toISOString(),
    });
    setNote("");
  };

  if (!ticket) return null;

  const createdLabel = ticket.createdAt ? format(new Date(ticket.createdAt), "dd/MM/yyyy HH:mm") : "-";
  const dueLabel = ticket.dueDate ? format(new Date(ticket.dueDate), "dd/MM/yyyy") : "Sem vencimento";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Badge variant="secondary" className="font-mono">
              {ticket.id}
            </Badge>
            <span>{ticket.observacao.slice(0, 60) || "Ticket SAF"}</span>
          </DialogTitle>
          <DialogDescription>Resumo do ticket, responsáveis e atividade recente.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{ticket.status}</Badge>
              {ticket.priority && <Badge variant="destructive">Prioridade {ticket.priority}</Badge>}
              <Badge variant="outline">Criado por {ticket.createdBy || "N/A"}</Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoRow icon={User2} label="Responsavel" value={ticket.agente} />
              <InfoRow icon={Shield} label="Criador" value={ticket.createdBy || "N/A"} />
              <InfoRow icon={Clock3} label="Criado em" value={createdLabel} />
              <InfoRow icon={CalendarIcon} label="Vencimento" value={dueLabel} />
              <InfoRow icon={Bell} label="Watchers" value={(ticket.watchers || []).join(", ") || "Nenhum"} />
              <InfoRow icon={Star} label="SLA (dias)" value={`${ticket.diasAberto ?? 0}`} />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Tag className="h-4 w-4" />
                Descrição
              </div>
              <div className="rounded-lg border border-dashed bg-muted/30 p-3 text-sm text-foreground">
                {ticket.observacao || "Sem descrição"}
              </div>
            </div>
          </div>

          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="h-4 w-4" />
              Atividade
            </div>
            <Separator />

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {notes.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
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
                placeholder="Escreva um comentário"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
              />
              <Button onClick={handleAddNote} disabled={!note.trim()}>
                Adicionar comentário
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
