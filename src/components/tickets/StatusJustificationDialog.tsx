import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { TicketStatus } from "@/types/tickets";

interface StatusJustificationDialogProps {
  open: boolean;
  status: TicketStatus;
  ticketId: string;
  onConfirm: (justification: string) => void;
  onCancel: () => void;
}

export const StatusJustificationDialog = ({
  open,
  status,
  ticketId,
  onConfirm,
  onCancel,
}: StatusJustificationDialogProps) => {
  const [justification, setJustification] = useState("");

  useEffect(() => {
    if (open) {
      setJustification("");
    }
  }, [open]);

  const handleConfirm = () => {
    const value = justification.trim();
    if (!value) return;
    onConfirm(value);
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Justificar mudanca de status</DialogTitle>
          <DialogDescription>
            Informe o motivo para mover o ticket {ticketId} para {status}. A justificativa e obrigatoria e sera registrada como nota.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="status-justification">Justificativa *</Label>
          <Textarea
            id="status-justification"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
            placeholder="Explique o motivo da mudanca..."
            rows={4}
          />
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={!justification.trim()}>
            Confirmar mudanca
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
