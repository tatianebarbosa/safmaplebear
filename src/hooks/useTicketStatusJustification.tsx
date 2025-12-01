import { useState } from "react";
import { StatusJustificationDialog } from "@/components/tickets/StatusJustificationDialog";
import { useAuthStore } from "@/stores/authStore";
import { useTicketStore } from "@/stores/ticketStore";
import { Ticket, TicketStatus } from "@/types/tickets";

// Exigir justificativa apenas quando for marcar como resolvido
const statusesRequiringJustification: TicketStatus[] = ["Resolvido"];

export const requiresTicketJustification = (status: TicketStatus) =>
  statusesRequiringJustification.includes(status);

export const useTicketStatusJustification = () => {
  const { moveTicket, addNoteToTicket } = useTicketStore();
  const { currentUser } = useAuthStore();
  const [pendingChange, setPendingChange] = useState<{
    ticket: Ticket;
    status: TicketStatus;
    onAfterChange?: () => void;
  } | null>(null);

  const requestStatusChange = (ticket: Ticket, status: TicketStatus, onAfterChange?: () => void) => {
    if (ticket.status === status) {
      onAfterChange?.();
      return;
    }

    if (requiresTicketJustification(status)) {
      setPendingChange({ ticket, status, onAfterChange });
      return;
    }

    moveTicket(ticket.id, status);
    onAfterChange?.();
  };

  const handleConfirm = (justification: string) => {
    if (!pendingChange) return;

    const trimmedJustification = justification.trim();
    const noteTimestamp = new Date().toISOString();

    moveTicket(pendingChange.ticket.id, pendingChange.status);
    addNoteToTicket(pendingChange.ticket.id, {
      id: `${pendingChange.ticket.id}-${Date.now()}`,
      author: currentUser?.name || "Sistema",
      content: `Status alterado para ${pendingChange.status}. Motivo: ${trimmedJustification}`,
      createdAt: noteTimestamp,
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
