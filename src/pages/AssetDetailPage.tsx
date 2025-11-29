import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AssetSchoolCard } from "@/components/assets/AssetSchoolCard";
import { useAssetStore } from "@/stores/assetStore";
import { loadSchoolData, type School } from "@/lib/schoolDataProcessor";
import { ArrowLeft, Filter, Search, Building, ListChecks } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AssetDetailPage = () => {
  const { assetId } = useParams<{ assetId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const assets = useAssetStore((state) => state.assets);
  const allContacts = useAssetStore((state) => state.contacts);

  const asset = assets.find((item) => item.id === assetId);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchSchools = async () => {
      setLoading(true);
      try {
        const data = await loadSchoolData();
        setSchools(data);
      } catch (error) {
        toast({
          title: "Erro ao carregar escolas",
          description: "Confirme os CSVs em public/data (escolas.csv e usuarios_updated.csv).",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSchools();
    // toast dependency removed to avoid rerun loop on changing reference
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const contactIndex = useMemo(() => {
    const map = new Map<string, { total: number; last?: string }>();
    const contacts = allContacts.filter((contact) => contact.assetId === (assetId || ""));
    contacts.forEach((contact) => {
      const current = map.get(contact.schoolId) || { total: 0, last: undefined };
      const last =
        !current.last || new Date(contact.contactAt) > new Date(current.last)
          ? contact.contactAt
          : current.last;
      map.set(contact.schoolId, { total: current.total + 1, last });
    });
    return map;
  }, [allContacts, assetId]);

  const assetContacts = useMemo(
    () => allContacts.filter((contact) => contact.assetId === (assetId || "")),
    [allContacts, assetId]
  );

  const filteredSchools = useMemo(() => {
    if (!search.trim()) return schools;
    const term = search.toLowerCase();
    return schools.filter(
      (school) =>
        school.name.toLowerCase().includes(term) ||
        school.city.toLowerCase().includes(term) ||
        school.cluster.toLowerCase().includes(term)
    );
  }, [schools, search]);

  if (!asset || !assetId) {
    return (
      <div className="layout-wide w-full py-8">
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-lg font-semibold">Ativo não encontrado</p>
            <p className="text-muted-foreground">Volte para a lista de ativos para selecionar um menu válido.</p>
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
              onClick={() => navigate("/saf/ativos")}
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para ativos
            </Button>
            <span>•</span>
            <span>Criado em {new Date(asset.createdAt).toLocaleDateString("pt-BR")}</span>
          </div>
          <h1 className="text-3xl font-bold">{asset.name}</h1>
          {asset.description && <p className="text-muted-foreground max-w-3xl">{asset.description}</p>}
        </div>
        <div className="flex items-center gap-3">
          <BadgePill label="Escolas" value={schools.length} icon={<Building className="w-4 h-4" />} />
          <BadgePill label="Registros" value={assetContacts.length} icon={<ListChecks className="w-4 h-4 text-muted-foreground" />} />
        </div>
      </div>

      <Card>
        <CardContent className="pt-6 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex-1 relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Busque por escola, cidade ou cluster"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Filter className="w-4 h-4" />
              {filteredSchools.length} escolas listadas
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredSchools.map((school) => {
            const summary = contactIndex.get(school.id) || { total: 0, last: undefined };
            return (
              <AssetSchoolCard
                key={school.id}
                school={school}
                totalContacts={summary.total}
                lastContactAt={summary.last}
                onManage={() => navigate(`/saf/ativos/${assetId}/escola/${school.id}`)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

const BadgePill = ({ label, value, icon }: { label: string; value: number; icon?: ReactNode }) => (
  <div className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm shadow-[var(--shadow-card)]">
    {icon}
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold text-primary">{value}</span>
  </div>
);

export default AssetDetailPage;
