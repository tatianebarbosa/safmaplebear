import { useState } from "react";
import { StatusJustificationDialog } from "@/components/tickets/StatusJustificationDialog";
import { useAuthStore } from "@/stores/authStore";
import { useTicketStore } from "@/stores/ticketStore";
import { Ticket, TicketStatus } from "@/types/tickets";

const statusesRequiringJustification: TicketStatus[] = ["Pendente", "Resolvido"];

export const requiresTicketJustification = (status: TicketStatus) =>
  statusesRequiringJustification.includes(status);

export const useTicketStatusJustification = () => {
  const { moveTicket, addNoteToTicket } = useTicketStore();
  const { currentUser } = useAuthStore();
  const [pendingChange, setPendingChange] = useState<{ ticket: Ticket; status: TicketStatus } | null>(null);

  const requestStatusChange = (ticket: Ticket, status: TicketStatus) => {
    if (ticket.status === status) return;

    if (requiresTicketJustification(status)) {
      setPendingChange({ ticket, status });
      return;
    }

    moveTicket(ticket.id, status);
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
