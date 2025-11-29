import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AssetCard } from "@/components/assets/AssetCard";
import { AssetCreateDialog } from "@/components/assets/AssetCreateDialog";
import { useAssetStore } from "@/stores/assetStore";
import { FolderPlus, Plus, ListChecks, FileClock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { SafAsset, AssetTeam, AssetChannel } from "@/types/assets";

const formatDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
};

const AssetsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { assets, contacts, addAsset, updateAsset } = useAssetStore();
  const [showCreate, setShowCreate] = useState(false);
  const [editingAsset, setEditingAsset] = useState<SafAsset | null>(null);

  const contactIndex = useMemo(() => {
    const map = new Map<string, { total: number; lastContactAt?: string }>();
    contacts.forEach((contact) => {
      const current = map.get(contact.assetId) || { total: 0, lastContactAt: undefined };
      const last =
        !current.lastContactAt || new Date(contact.contactAt) > new Date(current.lastContactAt)
          ? contact.contactAt
          : current.lastContactAt;
      map.set(contact.assetId, { total: current.total + 1, lastContactAt: last });
    });
    return map;
  }, [contacts]);

  const totalContacts = contacts.length;
  const lastContact = contacts.reduce<string | undefined>((latest, current) => {
    if (!latest) return current.contactAt;
    return new Date(current.contactAt) > new Date(latest) ? current.contactAt : latest;
  }, undefined);

  const handleCreateAsset = (data: { name: string; description?: string; requesterTeam?: AssetTeam; channel?: AssetChannel; assetType?: string }) => {
    const asset = addAsset(data);
    toast({
      title: "Ativo criado",
      description: "Agora inclua escolas e registre os contatos realizados.",
    });
    navigate(`/saf/ativos/${asset.id}`);
  };

  const handleUpdateAsset = (data: { name: string; description?: string; requesterTeam?: AssetTeam; channel?: AssetChannel; assetType?: string }) => {
    if (!editingAsset) return;
    updateAsset(editingAsset.id, data);
    toast({
      title: "Ativo atualizado",
      description: "Nome e descrição configurados.",
    });
    setEditingAsset(null);
  };

  return (
    <div className="layout-wide w-full py-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ativos SAF</h1>
          <p className="text-muted-foreground">
            Crie menus de ativos, selecione escolas e registre contatos feitos em cada iniciativa.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Criar ativo
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ativos criados</CardTitle>
            <FolderPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assets.length}</div>
            <p className="text-xs text-muted-foreground">Menus ativos disponíveis</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Registros de contato</CardTitle>
            <ListChecks className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalContacts}</div>
            <p className="text-xs text-muted-foreground">Ligações, e-mails e acompanhamentos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Último contato registrado</CardTitle>
            <FileClock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">{formatDate(lastContact) || "Ainda não registrado"}</div>
            <p className="text-xs text-muted-foreground">Atualize sempre ao falar com a escola</p>
          </CardContent>
        </Card>
      </div>

      {assets.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
            <div className="rounded-full bg-primary/10 p-3 text-primary">
              <FolderPlus className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-semibold">Nenhum ativo criado ainda</h2>
              <p className="text-muted-foreground max-w-xl">
                Cadastre um ativo para organizar campanhas ou iniciativas e acompanhar os contatos realizados com
                cada escola.
              </p>
            </div>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Criar novo ativo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {assets.map((asset) => {
            const summary = contactIndex.get(asset.id);
            return (
              <AssetCard
                key={asset.id}
                asset={asset}
                totalContacts={summary?.total || 0}
                lastContactAt={summary?.lastContactAt}
                onOpen={() => navigate(`/saf/ativos/${asset.id}`)}
                onConfigure={() => setEditingAsset(asset)}
              />
            );
          })}
        </div>
      )}

      <AssetCreateDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onSave={handleCreateAsset}
      />
      <AssetCreateDialog
        open={Boolean(editingAsset)}
        onOpenChange={(open) => !open && setEditingAsset(null)}
        onSave={handleUpdateAsset}
        initialAsset={editingAsset}
        mode="edit"
      />
    </div>
  );
};

export default AssetsPage;
