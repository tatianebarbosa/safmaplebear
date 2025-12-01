import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssetContactDialog } from "@/components/assets/AssetContactDialog";
import { useAssetStore } from "@/stores/assetStore";
import { useAuthStore } from "@/stores/authStore";
import {
  ASSET_CHANNELS,
  ASSET_STATUSES,
  type AssetChannel,
  type AssetOutcome,
  type AssetStatus,
  type AssetTeam,
} from "@/types/assets";
import { loadSchoolData, type School } from "@/lib/schoolDataProcessor";
import { ArrowLeft, Filter, Plus, Search, Clock3, ListChecks, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type Filters = {
  status: AssetStatus | "all";
  channel: AssetChannel | "all";
  startDate?: string;
  endDate?: string;
  search?: string;
};

const AssetSchoolPage = () => {
  const { assetId, schoolId } = useParams<{ assetId: string; schoolId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { currentUser } = useAuthStore();
  const { assets, contacts, addContact, updateContact } = useAssetStore();
  const asset = assets.find((item) => item.id === assetId);
  const [school, setSchool] = useState<School | null>(null);
  const [loadingSchool, setLoadingSchool] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    channel: "all",
    startDate: undefined,
    endDate: undefined,
    search: "",
  });

  const assetContacts = useMemo(
    () => contacts.filter((contact) => contact.assetId === assetId && contact.schoolId === schoolId),
    [contacts, assetId, schoolId]
  );

  useEffect(() => {
    const load = async () => {
      setLoadingSchool(true);
      try {
        const data = await loadSchoolData();
        const found = data.find((item) => item.id === schoolId) || null;
        setSchool(found);
      } catch (error) {
        toast({
          title: "Erro ao carregar escola",
          description: "Confirme se o CSV de escolas est dispon?vel em public/data.",
          variant: "destructive",
        });
      } finally {
        setLoadingSchool(false);
      }
    };
    load();
    // toast dependency removed to avoid rerun loop on changing reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const sortedRecords = useMemo(() => {
    const byDate = [...assetContacts].sort(
      (a, b) => new Date(b.contactAt).getTime() - new Date(a.contactAt).getTime()
    );

    return byDate.filter((record) => {
      if (filters.status !== "all" && record.status !== filters.status) return false;
      if (filters.channel !== "all" && record.channel !== filters.channel) return false;

      if (filters.startDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        if (new Date(record.contactAt) < start) return false;
      }

      if (filters.endDate) {
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        if (new Date(record.contactAt) > end) return false;
      }

      if (filters.search) {
        const term = filters.search.toLowerCase();
        const text = `${record.assetType} ${record.notes || ""} ${record.outcome}`.toLowerCase();
        if (!text.includes(term)) return false;
      }

      return true;
    });
  }, [assetContacts, filters]);

  const lastContact = sortedRecords[0]?.contactAt;

  const defaultSafOwner =
    asset?.owners?.[0] ||
    currentUser?.name ||
    currentUser?.email ||
    "Equipe SAF";

  const handleSaveRecord = (values: {
    assetType: string;
    safOwner: string;
    channel: AssetChannel;
    status: AssetStatus;
    outcome: AssetOutcome;
    notes?: string;
    contactAt: string;
    requesterTeam?: AssetTeam;
  }) => {
    if (!assetId || !schoolId || !school || !asset) return;
    const requesterTeam = values.requesterTeam || ("SAF" as AssetTeam);

    if (editingId) {
      updateContact(editingId, {
        ...values,
        schoolName: school.name,
        assetName: asset.name,
        requesterTeam,
      });
      toast({ title: "Registro atualizado", description: "As informaes do contato foram salvas." });
    } else {
      addContact({
        ...values,
        assetId,
        assetName: asset.name,
        schoolId,
        schoolName: school.name,
        requesterTeam,
      });
      toast({ title: "Registro criado", description: "Contato registrado neste ativo." });
    }
    setEditingId(null);
  };

  const handleEdit = (id: string) => {
    setEditingId(id);
    setShowDialog(true);
  };

  const clearFilters = () => {
    setFilters({
      status: "all",
      channel: "all",
      startDate: undefined,
      endDate: undefined,
      search: "",
    });
  };

  if (!asset || !assetId) {
    return (
      <div className="layout-wide w-full py-8">
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-lg font-semibold">Ativo no encontrado</p>
            <Button variant="outline" onClick={() => navigate("/saf/ativos")} className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar para Ativos
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="layout-wide w-full py-8 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Button
              variant="ghost"
              size="sm"
              className="px-0 gap-2"
              onClick={() => navigate(`/saf/ativos/${assetId}`)}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para escolas
            </Button>
            <span></span>
            <span>{asset.name}</span>
          </div>
          <h1 className="text-3xl font-bold">{school?.name || "Carregando escola..."}</h1>
          <p className="text-muted-foreground">
            Gerencie os registros de contato deste ativo para a escola selecionada.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => { setShowDialog(true); setEditingId(null); }} className="gap-2">
            <Plus className="w-4 h-4" />
            Novo registro de contato
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <ListChecks className="w-4 h-4 text-primary" />
              Registros neste ativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{assetContacts.length}</div>
            <p className="text-xs text-muted-foreground">Total de contatos realizados com esta escola</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock3 className="w-4 h-4 text-primary" />
              ltimo contato
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {lastContact ? new Date(lastContact).toLocaleString("pt-BR") : "Nenhum contato registrado"}
            </div>
            <p className="text-xs text-muted-foreground">Mantenha a linha do tempo atualizada</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              Responsveis do ativo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {asset?.owners?.length ? (
              <div className="flex flex-wrap gap-2">
                {asset.owners.map((owner) => (
                  <Badge key={owner} variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {owner}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="text-lg font-semibold">{defaultSafOwner}</div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Sugerido como respons?vel ao criar novos registros, mas pode ser ajustado em cada contato.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filtros (opcional)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select
              value={filters.status}
              onValueChange={(value: AssetStatus | "all") => setFilters((prev) => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {ASSET_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={filters.channel}
              onValueChange={(value: AssetChannel | "all") => setFilters((prev) => ({ ...prev, channel: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os canais</SelectItem>
                {ASSET_CHANNELS.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por texto / observao"
                value={filters.search}
                onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex gap-2 items-center">
              <Input
                type="date"
                value={filters.startDate || ""}
                onChange={(event) => setFilters((prev) => ({ ...prev, startDate: event.target.value }))}
              />
              <span className="text-muted-foreground text-sm">at</span>
              <Input
                type="date"
                value={filters.endDate || ""}
                onChange={(event) => setFilters((prev) => ({ ...prev, endDate: event.target.value }))}
              />
            </div>
            <div className="md:col-span-2 flex items-center justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Limpar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Linha do tempo de contatos</CardTitle>
        </CardHeader>
        <CardContent>
          {sortedRecords.length === 0 ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-lg font-semibold">Nenhum registro ainda</p>
              <p className="text-muted-foreground">
                Clique em &quot;Novo registro de contato&quot; para registrar a primeira interao deste ativo com a escola.
              </p>
              <Button onClick={() => { setShowDialog(true); setEditingId(null); }} className="gap-2">
                <Plus className="w-4 h-4" />
                Registrar contato
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data e horrio</TableHead>
                    <TableHead>Canal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Responsvel SAF</TableHead>
                    <TableHead>Aes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(record.contactAt).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>{record.channel}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.status}</Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="line-clamp-2">{record.outcome}</p>
                      </TableCell>
                      <TableCell>{record.safOwner}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(record.id)}>
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AssetContactDialog
        open={showDialog}
        onOpenChange={(open) => {
          setShowDialog(open);
          if (!open) setEditingId(null);
        }}
        assetName={asset.name}
        schoolName={school?.name || ""}
        defaultSafOwner={defaultSafOwner}
        mode={editingId ? "edit" : "create"}
        defaultValues={
          editingId
            ? assetContacts.find((contact) => contact.id === editingId)
            : {
                safOwner: defaultSafOwner,
                requesterTeam: "SAF",
              }
        }
        onSave={handleSaveRecord}
      />
    </div>
  );
};

export default AssetSchoolPage;
