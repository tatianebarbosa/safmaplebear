import { useState } from "react";
import { StatusJustificationDialog } from "@/components/tickets/StatusJustificationDialog";
import { useAuthStore } from "@/stores/authStore";
import { useTicketStore } from "@/stores/ticketStore";
import { Ticket, TicketStatus } from "@/types/tickets";

// Exigir justificativa para qualquer mudanca de status via arrasto ou botoes
const statusesRequiringJustification: TicketStatus[] = [
  "Pendente",
  "Em andamento",
  "Resolvido",
];

export const requiresTicketJustification = (status: TicketStatus) =>
  statusesRequiringJustification.includes(status);

export const useTicketStatusJustification = () => {
  const { moveTicket } = useTicketStore();
  const { currentUser } = useAuthStore();
  const [pendingChange, setPendingChange] = useState<{
    ticket: Ticket;
    status: TicketStatus;
    author: string;
    onAfterChange?: () => void;
  } | null>(null);

  const requestStatusChange = (ticket: Ticket, status: TicketStatus, onAfterChange?: () => void) => {
    if (ticket.status === status) {
      onAfterChange?.();
      return;
    }

    const author = currentUser?.name || currentUser?.agente || "Sistema";

    if (requiresTicketJustification(status)) {
      setPendingChange({ ticket, status, author, onAfterChange });
      return;
    }

    moveTicket(ticket.id, status, { author });
    onAfterChange?.();
  };

  const handleConfirm = (justification: string) => {
    if (!pendingChange) return;

    const trimmedJustification = justification.trim();

    moveTicket(pendingChange.ticket.id, pendingChange.status, {
      reason: trimmedJustification,
      author: pendingChange.author,
    });
    pendingChange.onAfterChange?.();
    setPendingChange(null);
  };

  const handleCancel = () => setPendingChange(null);

  const justificationDialog = (
    <StatusJustificationDialog
      open={!!pendingChange}
      status={pendingChange?.status ?? "Pendente"}
      ticketId={pendingChange?.ticket.id ?? ""}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return {
    requestStatusChange,
    justificationDialog,
    pendingChange,
  };
};
