import { type FormEvent, useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { X } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";

type AssetCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    description?: string;
    requesterTeam?: AssetTeam;
    channel?: AssetChannel;
    assetType?: string;
    owners?: string[];
  }) => void;
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
  const [owners, setOwners] = useState<string[]>([]);
  const [ownerInput, setOwnerInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();
  const authUsers = useAuthStore((state) => state.users);

  const ownerSuggestions = useMemo(
    () =>
      authUsers
        ?.filter((user) => (user.role || "").toLowerCase() !== "admin")
        .map((user) => ({
          name: user.name,
          email: user.email,
          searchText: `${user.name || ""} ${user.email || ""}`.trim(),
        }))
        .filter((user) => Boolean(user.name)) || [],
    [authUsers]
  );

  const filteredSuggestions = useMemo(() => {
    const query = ownerInput.trim().toLowerCase();
    if (query.length < 2) return [];
    return ownerSuggestions
      .filter(
        (user) =>
          !owners.some((owner) => owner.toLowerCase() === (user.name || "").toLowerCase()) &&
          user.searchText.toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [ownerInput, ownerSuggestions, owners]);

  useEffect(() => {
    if (!open) return;
    setName(initialAsset?.name || "");
    setDescription(initialAsset?.description || "");
    setRequesterTeam(initialAsset?.requesterTeam || "SAF");
    setChannel(initialAsset?.channel || ASSET_CHANNELS[0]);
    setAssetType(initialAsset?.assetType || "");
    setOwners(initialAsset?.owners || []);
    setOwnerInput("");
  }, [open, initialAsset]);

  const addOwnerValue = (value: string) => {
    const newOwner = value.trim();
    if (!newOwner) return;
    if (owners.length >= 3) {
      toast({
        title: "Limite de respons?veis",
        description: "Adicione no mximo 3 respons?veis pelo ativo.",
        variant: "destructive",
      });
      return;
    }
    const alreadyExists = owners.some((owner) => owner.toLowerCase() === newOwner.toLowerCase());
    if (alreadyExists) {
      toast({
        title: "Responsvel j adicionado",
        description: "Inclua somente nomes diferentes na lista.",
        variant: "destructive",
      });
      setOwnerInput("");
      return;
    }
    setOwners((prev) => [...prev, newOwner]);
    setOwnerInput("");
  };

  const addOwner = () => addOwnerValue(ownerInput);

  const removeOwner = (name: string) => {
    setOwners((prev) => prev.filter((owner) => owner !== name));
  };

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
      owners: owners.length ? owners : undefined,
    });
    setName("");
    setDescription("");
    setRequesterTeam("SAF");
    setChannel(ASSET_CHANNELS[0]);
    setAssetType("");
    setOwners([]);
    setOwnerInput("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Configurar ativo" : "Criar ativo"}</DialogTitle>
          <DialogDescription>
            {mode === "edit"
              ? "Atualize o nome e a descrio deste ativo."
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
            <Label htmlFor="asset-description">Descrio (opcional)</Label>
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
              placeholder="Ex.: alinhamento de campanha, suporte Canva, questo financeira"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="asset-owners">Responsveis pelo ativo</Label>
              <span className="text-xs text-muted-foreground">At 3 nomes</span>
            </div>
            <div className="flex gap-2 relative">
              <Input
                id="asset-owners"
                value={ownerInput}
                onChange={(event) => setOwnerInput(event.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addOwner();
                  }
                }}
                placeholder="Digite e pressione Enter para adicionar"
              />
              <Button type="button" variant="secondary" onClick={addOwner}>
                Adicionar
              </Button>
              {showSuggestions && filteredSuggestions.length > 0 && ownerInput.trim().length >= 2 && (
                <div className="absolute top-full mt-1 left-0 w-full max-h-60 overflow-auto rounded-xl border border-border/70 bg-popover shadow-lg z-50">
                  {filteredSuggestions.map((user) => (
                    <button
                      key={`${user.name}-${user.email || "no-email"}`}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
                      onClick={() => addOwnerValue(user.name)}
                    >
                      <div className="font-medium text-foreground">{user.name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {owners.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {owners.map((owner) => (
                  <Badge key={owner} variant="secondary" className="flex items-center gap-1">
                    {owner}
                    <button
                      type="button"
                      onClick={() => removeOwner(owner)}
                      className="leading-none text-muted-foreground hover:text-foreground"
                      aria-label={`Remover ${owner}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">{mode === "edit" ? "Salvar alteraes" : "Salvar ativo"}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
