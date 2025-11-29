import { type FormEvent, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { SafAsset } from "@/types/assets";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ASSET_CHANNELS, ASSET_TEAMS, type AssetChannel, type AssetTeam } from "@/types/assets";

type AssetCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: { name: string; description?: string; requesterTeam?: AssetTeam; channel?: AssetChannel; assetType?: string }) => void;
  initialAsset?: SafAsset | null;
  mode?: "create" | "edit";
};

export const AssetCreateDialog = ({
  open,
  onOpenChange,
  onSave,
  initialAsset,
  mode = "create",
}: AssetCreateDialogProps) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [requesterTeam, setRequesterTeam] = useState<AssetTeam>("SAF");
  const [channel, setChannel] = useState<AssetChannel>(ASSET_CHANNELS[0]);
  const [assetType, setAssetType] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    setName(initialAsset?.name || "");
    setDescription(initialAsset?.description || "");
    setRequesterTeam(initialAsset?.requesterTeam || "SAF");
    setChannel(initialAsset?.channel || ASSET_CHANNELS[0]);
    setAssetType(initialAsset?.assetType || "");
  }, [open, initialAsset]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast({
        title: "Informe um nome para o ativo",
        description: "Ex.: Ativo Canva Novembro, Ativo Reajuste 2025, Ativo Licenças SLM+",
        variant: "destructive",
      });
      return;
    }

    onSave({
      name: trimmedName,
      description: description.trim() || undefined,
      requesterTeam,
      channel,
      assetType: assetType.trim() || undefined,
    });
    setName("");
    setDescription("");
    setRequesterTeam("SAF");
    setChannel(ASSET_CHANNELS[0]);
    setAssetType("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Configurar ativo" : "Criar ativo"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Atualize o nome e a descrição deste ativo."
              : "Monte um menu interno para acompanhar escolas e contatos desse ativo."}
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="asset-name">Nome do ativo</Label>
            <Input
              id="asset-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Ativo Canva Novembro"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="asset-description">Descrição (opcional)</Label>
            <Textarea
              id="asset-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Contexto ou objetivo do ativo"
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Time que solicitou o ativo</Label>
              <Select value={requesterTeam} onValueChange={(value: AssetTeam) => setRequesterTeam(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o time" />
                </SelectTrigger>
                <SelectContent>
                  {ASSET_TEAMS.map((team) => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

          <div className="space-y-2">
            <Label htmlFor="asset-type">Tipo de ativo (motivo do contato)</Label>
            <Input
              id="asset-type"
              value={assetType}
              onChange={(event) => setAssetType(event.target.value)}
              placeholder="Ex.: alinhamento de campanha, suporte Canva, questão financeira"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{mode === "edit" ? "Salvar alterações" : "Salvar ativo"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
