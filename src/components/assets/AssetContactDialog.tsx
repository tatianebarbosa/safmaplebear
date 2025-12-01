import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import type { AssetStatus, AssetChannel, AssetOutcome, AssetTeam } from "@/types/assets";

type Mode = "create" | "edit";

type ContactFormValues = {
  assetType?: string;
  safOwner?: string;
  channel?: AssetChannel;
  status?: AssetStatus;
  outcome?: AssetOutcome;
  notes?: string;
  contactAt?: string;
  requesterTeam?: AssetTeam;
};

type AssetContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetName: string;
  schoolName: string;
  defaultSafOwner: string;
  mode: Mode;
  defaultValues?: ContactFormValues | null;
  onSave: (values: {
    assetType: string;
    safOwner: string;
    channel: AssetChannel;
    status: AssetStatus;
    outcome: AssetOutcome;
    notes?: string;
    contactAt: string;
    requesterTeam?: AssetTeam;
  }) => void;
};

// Dialog simplificado apenas para evitar quebra de build; pode ser substituído pelo componente completo posteriormente.
export function AssetContactDialog({
  open,
  onOpenChange,
  defaultSafOwner,
  mode,
  defaultValues,
  onSave,
}: AssetContactDialogProps) {
  const [owner, setOwner] = useState(defaultSafOwner);
  const [notes, setNotes] = useState(defaultValues?.notes ?? "");

  useEffect(() => {
    if (defaultValues?.safOwner) setOwner(defaultValues.safOwner);
  }, [defaultValues]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Editar contato" : "Novo contato"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Responsável SAF</Label>
            <Input value={owner} onChange={(e) => setOwner(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Notas</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                onSave({
                  assetType: defaultValues?.assetType || "Ativo",
                  safOwner: owner,
                  channel: (defaultValues?.channel as AssetChannel) || "E-mail",
                  status: (defaultValues?.status as AssetStatus) || "Em andamento",
                  outcome:
                    (defaultValues?.outcome as AssetOutcome) || "Contato realizado, pendente retorno da escola",
                  notes,
                  contactAt: defaultValues?.contactAt || new Date().toISOString(),
                  requesterTeam: defaultValues?.requesterTeam,
                })
              }
            >
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
