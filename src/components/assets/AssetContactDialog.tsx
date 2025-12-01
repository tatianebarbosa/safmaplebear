import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ASSET_CHANNELS,
  ASSET_OUTCOMES,
  ASSET_STATUSES,
  AssetChannel,
  AssetOutcome,
  AssetStatus,
  type AssetTeam,
} from "@/types/assets";
import { useToast } from "@/hooks/use-toast";

type AssetContactDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assetName: string;
  schoolName: string;
  defaultValues?: Partial<{
    assetType: string;
    requesterTeam?: AssetTeam;
    safOwner: string;
    channel: AssetChannel;
    status: AssetStatus;
    outcome: AssetOutcome;
    notes: string;
    contactAt: string;
  }>;
  onSave: (values: {
    assetType: string;
    requesterTeam?: AssetTeam;
    safOwner: string;
    channel: AssetChannel;
    status: AssetStatus;
    outcome: AssetOutcome;
    notes?: string;
    contactAt: string;
  }) => void;
  mode?: "create" | "edit";
  defaultSafOwner?: string;
};

const DEFAULT_REQUESTER_TEAM: AssetTeam = "SAF";

const formatDateTimeLocal = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return "";
  const pad = (num: number) => String(num).padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export const AssetContactDialog = ({
  open,
  onOpenChange,
  assetName,
  schoolName,
  defaultValues,
  onSave,
  mode = "create",
  defaultSafOwner,
}: AssetContactDialogProps) => {
  const { toast } = useToast();
  const [assetType, setAssetType] = useState(defaultValues?.assetType || assetName);
  const [safOwner, setSafOwner] = useState(defaultValues?.safOwner || defaultSafOwner || "");
  const [channel, setChannel] = useState<AssetChannel>(defaultValues?.channel || ASSET_CHANNELS[0]);
  const [status, setStatus] = useState<AssetStatus>(defaultValues?.status || ASSET_STATUSES[0]);
  const [outcome, setOutcome] = useState<AssetOutcome>(defaultValues?.outcome || ASSET_OUTCOMES[0]);
  const [notes, setNotes] = useState(defaultValues?.notes || "");
  const [contactAt, setContactAt] = useState(formatDateTimeLocal(defaultValues?.contactAt));

  useEffect(() => {
    if (!open) return;
    setAssetType(defaultValues?.assetType || assetName);
    setSafOwner(defaultValues?.safOwner || defaultSafOwner || "");
    setChannel(defaultValues?.channel || ASSET_CHANNELS[0]);
    setStatus(defaultValues?.status || ASSET_STATUSES[0]);
    setOutcome(defaultValues?.outcome || ASSET_OUTCOMES[0]);
    setNotes(defaultValues?.notes || "");
    setContactAt(formatDateTimeLocal(defaultValues?.contactAt));
  }, [open, defaultValues, assetName, defaultSafOwner]);

  const handleSave = () => {
    if (!assetType.trim()) {
      toast({
        title: "Informe o tipo de ativo / motivo do contato",
        description: "Ex.: alinhamento de campanha, suporte Canva, questo financeira",
        variant: "destructive",
      });
      return;
    }
    const parsedDate = contactAt ? new Date(contactAt) : new Date();
    const contactDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    onSave({
      assetType: assetType.trim(),
      requesterTeam: DEFAULT_REQUESTER_TEAM,
      safOwner: safOwner.trim() || defaultSafOwner || "Equipe SAF",
      channel,
      status,
      outcome,
      notes: notes.trim() || undefined,
      contactAt: contactDate.toISOString(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Editar registro de contato" : "Novo registro de contato"}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Escola</Label>
            <Input value={schoolName} disabled />
          </div>
          <div className="space-y-2">
            <Label>Ativo</Label>
            <Input value={assetName} disabled />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="asset-type">Tipo de ativo (motivo do contato)</Label>
          <Input
            id="asset-type"
            value={assetType}
            onChange={(event) => setAssetType(event.target.value)}
            placeholder="Ex.: alinhamento de campanha, suporte Canva"
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Responsvel SAF</Label>
            <Input
              value={safOwner}
              onChange={(event) => setSafOwner(event.target.value)}
              placeholder="Quem conduziu o contato"
            />
          </div>

          <div className="space-y-2">
            <Label>Canal do ativo</Label>
            <Select value={channel} onValueChange={(value: AssetChannel) => setChannel(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o canal" />
              </SelectTrigger>
              <SelectContent>
                {ASSET_CHANNELS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Status do ativo</Label>
            <Select value={status} onValueChange={(value: AssetStatus) => setStatus(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                {ASSET_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Resultado do contato</Label>
            <Select value={outcome} onValueChange={(value: AssetOutcome) => setOutcome(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o resultado" />
              </SelectTrigger>
              <SelectContent>
                {ASSET_OUTCOMES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Observaes</Label>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Anote decises, pendncias, prximos passos ou links."
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Data e horrio do contato</Label>
          <Input
            type="datetime-local"
            value={contactAt}
            onChange={(event) => setContactAt(event.target.value)}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
            Cancelar
          </Button>
          <Button onClick={handleSave}>{mode === "edit" ? "Salvar alteraes" : "Salvar registro"}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
