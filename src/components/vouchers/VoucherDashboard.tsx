import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/components/ui/sonner";
import {
  Ticket,
  School,
  TrendingUp,
  Download,
  FileText,
  Search,
  Plus,
  LayoutGrid,
  Clock3,
  Calendar as CalendarIcon,
  Table as TableIcon,
  Grid2x2,
  Minus,
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import {
  VoucherSchool,
  ExceptionVoucher,
  loadVoucherData,
  getVoucherStats,
  filterSchools,
  exportVoucherReport,
} from "@/lib/voucherDataProcessor";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TruncatedText } from "@/components/ui/truncated-text";

type CampaignKey = string;

type VoucherCampaign = {
  year: CampaignKey;
  name: string;
  goal?: string;
  createdAt: string;
  startDate?: string;
  endDate?: string;
};

const baseCampaignKeys: CampaignKey[] = ["2025", "2026", "piloto_welcome"];
const campaignLabels: Record<CampaignKey, string> = {
  piloto_welcome: "Piloto Welcome B&B",
};

const sortCampaigns = (keys: CampaignKey[]) => {
  return [...keys].sort((a, b) => {
    const numA = Number(a);
    const numB = Number(b);
    const aIsNum = !Number.isNaN(numA);
    const bIsNum = !Number.isNaN(numB);
    if (aIsNum && bIsNum) return numA - numB;
    if (aIsNum) return -1;
    if (bIsNum) return 1;
    return a.localeCompare(b);
  });
};

const getCampaignLabel = (id: CampaignKey) => campaignLabels[id] || `Campanha ${id}`;

const VoucherDashboard = () => {
  const getStoredCampaignKeys = () => {
    if (typeof window === "undefined") return baseCampaignKeys;
    const saved = localStorage.getItem("voucherCampaigns");
    if (saved) {
      try {
        const parsed = (JSON.parse(saved) as (string | number)[]).map((v) => v.toString());
        const merged = Array.from(new Set([...baseCampaignKeys, ...parsed]));
        return sortCampaigns(merged);
      } catch {
        return baseCampaignKeys;
      }
    }
    return baseCampaignKeys;
  };

  const [schools, setSchools] = useState<VoucherSchool[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionVoucher[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<VoucherSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [voucherEligible, setVoucherEligible] = useState<string>("all");
  const [voucherSent, setVoucherSent] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [customAdjustments, setCustomAdjustments] = useState<Record<string, number>>({});
  const navigate = useNavigate();
  const location = useLocation();
  const isFigmaCapture = new URLSearchParams(location.search).get("figmaCapture") === "1";
  const queryYear = new URLSearchParams(location.search).get("year");
  const [activeCampaign, setActiveCampaign] = useState<string>(queryYear || "2025");
  const [campaigns, setCampaigns] = useState<CampaignKey[]>(() => getStoredCampaignKeys());
  const [campaignDetails, setCampaignDetails] = useState<Record<string, VoucherCampaign>>(() => {
    if (typeof window === "undefined") return {};
    const storedDetails = localStorage.getItem("voucherCampaignDetails");
    let parsed: Record<string, VoucherCampaign> = {};
    if (storedDetails) {
      try {
        parsed = JSON.parse(storedDetails) as Record<string, VoucherCampaign>;
      } catch {
        parsed = {};
      }
    }
    const years = getStoredCampaignKeys();
    const defaults = years.reduce((acc, year) => {
      acc[year] =
        parsed?.[year] ||
        ({
          year,
          name: getCampaignLabel(year),
          goal: "",
          createdAt: parsed?.[year]?.createdAt || new Date().toISOString(),
        } as VoucherCampaign);
      return acc;
    }, {} as Record<string, VoucherCampaign>);
    return { ...defaults, ...parsed };
  });
  const [campaignDialogOpen, setCampaignDialogOpen] = useState(false);
  const [campaignForm, setCampaignForm] = useState<{
    year: string;
    name: string;
    goal: string;
    startDate?: Date;
    endDate?: Date;
  }>({ year: queryYear || "2025", name: "", goal: "" });

  useEffect(() => {
    loadData(activeCampaign);
  }, [activeCampaign]);

  useEffect(() => {
    applyFilters();
  }, [schools, searchTerm, selectedCluster, selectedStatus, voucherEligible, voucherSent]);

  const loadData = async (campaignYear: string) => {
    try {
      setLoading(true);
      const data = await loadVoucherData(campaignYear);
      const storedAdjustments = getStoredAdjustments(campaignYear);
      setCustomAdjustments(storedAdjustments);
      const adjustedSchools = applyAdjustments(data.schools, storedAdjustments);
      setSchools(adjustedSchools);
      setExceptions(data.exceptions);
      if (!isFigmaCapture) {
        toast.success("Dados dos vouchers carregados!");
      }
    } catch (error) {
      if (!isFigmaCapture) {
        toast.error("Erro ao carregar dados dos vouchers");
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const filters = {
      search: searchTerm,
      cluster: selectedCluster === "all" ? undefined : selectedCluster,
      status: selectedStatus === "all" ? undefined : selectedStatus,
      voucherEligible: voucherEligible === "true" ? true : voucherEligible === "false" ? false : undefined,
      voucherSent: voucherSent === "true" ? true : voucherSent === "false" ? false : undefined,
    };

    const filtered = filterSchools(schools, filters);
    setFilteredSchools(filtered);
  };

  const getClusters = () => {
    const clusters = [...new Set(schools.map((s) => s.cluster))].filter(Boolean);
    return clusters.sort();
  };

  const getStatuses = () => {
    const statuses = [...new Set(schools.map((s) => s.status))].filter(Boolean);
    return statuses.sort();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "ativa":
        return "status-badge status-active";
      case "inativa":
        return "status-badge status-inactive";
      case "implantando":
        return "status-badge status-warning";
      default:
        return "status-badge border border-border text-muted-foreground";
    }
  };

  const stats = getVoucherStats(schools, exceptions);

  const persistCampaigns = (list: CampaignKey[]) => {
    setCampaigns(sortCampaigns(list));
    localStorage.setItem("voucherCampaigns", JSON.stringify(list));
  };

  const adjustmentsKey = (campaign: string) => `voucher_custom_qty_${campaign}`;
  const getStoredAdjustments = (campaign: string) => {
    if (typeof window === "undefined") return {};
    try {
      const stored = localStorage.getItem(adjustmentsKey(campaign));
      if (!stored) return {};
      return JSON.parse(stored) as Record<string, number>;
    } catch {
      return {};
    }
  };

  const persistAdjustments = (campaign: string, adjustments: Record<string, number>) => {
    setCustomAdjustments(adjustments);
    localStorage.setItem(adjustmentsKey(campaign), JSON.stringify(adjustments));
  };

  const applyAdjustments = (list: VoucherSchool[], adjustments: Record<string, number>) => {
    return list.map((school) =>
      adjustments[school.id] !== undefined
        ? { ...school, voucherQuantity: Math.max(0, adjustments[school.id]) }
        : school
    );
  };

  const persistCampaignDetails = (details: Record<string, VoucherCampaign>) => {
    setCampaignDetails(details);
    localStorage.setItem("voucherCampaignDetails", JSON.stringify(details));
  };

  const handleSelectCampaign = (year: CampaignKey) => {
    setActiveCampaign(year.toString());
    navigate(`${location.pathname}?year=${year}`);
  };

  const openCampaignDialog = () => {
    const currentDetail = campaignDetails[activeCampaign] || campaignDetails[Number(activeCampaign)];
    setCampaignForm({
      year: activeCampaign,
      name: currentDetail?.name || "",
      goal: currentDetail?.goal || "",
      startDate: currentDetail?.startDate ? new Date(currentDetail.startDate) : undefined,
      endDate: currentDetail?.endDate ? new Date(currentDetail.endDate) : undefined,
    });
    setCampaignDialogOpen(true);
  };

  const handleCreateCampaign = () => {
    const trimmedYear = campaignForm.year.trim();
    const numeric = parseInt(trimmedYear, 10);
    const isNumericYear = !Number.isNaN(numeric) && trimmedYear.length === 4;

    if (!isNumericYear && !trimmedYear) {
      toast.error("Informe um identificador ou ano para a campanha.");
      return;
    }

    if (campaignForm.startDate && campaignForm.endDate && campaignForm.startDate > campaignForm.endDate) {
      toast.error("A data inicial deve ser menor ou igual a data final.");
      return;
    }

    const key = (isNumericYear ? numeric.toString() : trimmedYear) as CampaignKey;
    const updatedCampaigns = campaigns.includes(key) ? campaigns : [...campaigns, key];
    persistCampaigns(updatedCampaigns);

    const detail: VoucherCampaign = {
      year: key,
      name: campaignForm.name.trim() || getCampaignLabel(key),
      goal: campaignForm.goal.trim(),
      createdAt: campaignDetails?.[key]?.createdAt || new Date().toISOString(),
      startDate: campaignForm.startDate ? campaignForm.startDate.toISOString() : campaignDetails?.[key]?.startDate,
      endDate: campaignForm.endDate ? campaignForm.endDate.toISOString() : campaignDetails?.[key]?.endDate,
    };

    const updatedDetails = { ...campaignDetails, [key]: detail };
    persistCampaignDetails(updatedDetails);
    handleSelectCampaign(key);
    toast.success("Campanha de voucher criada");
    setCampaignDialogOpen(false);
  };

  const handleQuantityChange = (schoolId: string, qty: number) => {
    const safeQty = Math.max(0, Math.floor(qty || 0));
    setSchools((prev) =>
      prev.map((s) => (s.id === schoolId ? { ...s, voucherQuantity: safeQty } : s))
    );
    const nextAdjustments = { ...customAdjustments, [schoolId]: safeQty };
    persistAdjustments(activeCampaign, nextAdjustments);
  };

  const handleQuantityDelta = (schoolId: string, delta: number) => {
    const current = schools.find((s) => s.id === schoolId)?.voucherQuantity ?? 0;
    handleQuantityChange(schoolId, current + delta);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCluster("all");
    setSelectedStatus("all");
    setVoucherEligible("all");
    setVoucherSent("all");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 min-h-[60vh] text-center" role="status" aria-live="polite">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" aria-hidden="true" />
        <p className="text-sm text-muted-foreground">Carregando dados dos vouchers...</p>
      </div>
    );
  }

  const lastCampaignYear = campaigns[campaigns.length - 1];
  const lastCampaign = campaignDetails?.[lastCampaignYear];

  return (
    <div className="layout-wide w-full py-8 space-y-8">
      <div className="rounded-2xl border bg-muted/40 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-primary">Campanhas de voucher</p>
            <h1 className="heading-responsive-1">Vouchers SAF</h1>
            <p className="text-muted-foreground max-w-2xl">
              Crie campanhas de voucher, selecione escolas e acompanhe entregas de cada iniciativa.
            </p>
          </div>
          <div className="flex w-full sm:w-auto">
            <Button
              className="bg-destructive text-white hover:bg-destructive/90 btn-touch"
              onClick={openCampaignDialog}
              aria-label="Abrir modal para criar nova campanha"
            >
              <Plus className="w-4 h-4 mr-2" />
              Criar campanha
            </Button>
          </div>
        </div>

        <div className="grid-responsive-3 mt-6">
          <Card className="border-dashed border-muted-foreground/20 shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Campanhas criadas</p>
                  <p className="text-3xl font-bold">{campaigns.length}</p>
                  <p className="text-sm text-muted-foreground">Campanhas disponiveis</p>
                </div>
                <LayoutGrid className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-dashed border-muted-foreground/20 shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Vouchers enviados</p>
                  <p className="text-3xl font-bold">{stats.sentVouchers}</p>
                  <p className="text-sm text-muted-foreground">Taxa de envio {stats.deliveryRate.toFixed(1)}%</p>
                </div>
                <Ticket className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-dashed border-muted-foreground/20 shadow-none">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                <p className="text-sm text-muted-foreground">Ultima campanha</p>
                  <p className="text-xl font-semibold">{lastCampaign?.name || getCampaignLabel(lastCampaignYear || "-")}</p>
                  <p className="text-sm text-muted-foreground">
                    {lastCampaign?.createdAt
                      ? new Date(lastCampaign.createdAt).toLocaleDateString()
                      : "Ainda nao registrada"}
                  </p>
                </div>
                <Clock3 className="w-5 h-5 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="filters-responsive mt-6">
          <div className="filter-item-responsive inline-flex rounded-md border bg-background p-1 w-fit overflow-x-auto">
            {campaigns.map((year) => (
              <Button
                key={year}
                variant={activeCampaign === year.toString() ? "secondary" : "ghost"}
                size="sm"
                className="rounded-sm btn-touch-sm"
                onClick={() => handleSelectCampaign(year)}
                aria-label={`Selecionar campanha ${getCampaignLabel(year)}`}
              >
                {getCampaignLabel(year)}
              </Button>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={openCampaignDialog}
            className="btn-touch-sm"
            aria-label="Abrir formulário para nova campanha"
          >
            + Nova campanha
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadData(activeCampaign)}
            className="btn-touch-sm"
            aria-label="Atualizar lista de dados da campanha selecionada"
          >
            Atualizar dados
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportVoucherReport(filteredSchools)}
            className="btn-touch-sm"
            aria-label="Exportar dados filtrados para CSV"
            disabled={filteredSchools.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <div className="filter-item-responsive ml-0 sm:ml-auto inline-flex rounded-md border bg-background p-1">
            <Button
              size="sm"
              variant={viewMode === "cards" ? "secondary" : "ghost"}
              className="rounded-sm btn-touch-sm"
              onClick={() => setViewMode("cards")}
              aria-label="Visualizar escolas em cartões"
            >
              <Grid2x2 className="w-4 h-4 mr-1" />
              Cards
            </Button>
            <Button
              size="sm"
              variant={viewMode === "table" ? "secondary" : "ghost"}
              className="rounded-sm btn-touch-sm"
              onClick={() => setViewMode("table")}
              aria-label="Visualizar escolas em tabela"
            >
              <TableIcon className="w-4 h-4 mr-1" />
              Planilha
            </Button>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <StatsCard
          title="Escolas"
          value={stats.totalSchools.toString()}
          trend={{ value: stats.eligibilityRate, isPositive: stats.eligibilityRate > 50 }}
          icon={<School className="h-4 w-4" />}
        />
        <StatsCard
          title="Vouchers"
          value={stats.totalVouchers.toString()}
          trend={{ value: stats.deliveryRate, isPositive: stats.deliveryRate > 80 }}
          icon={<Ticket className="h-4 w-4" />}
        />
        <StatsCard title="Elegibilidade" value={`${stats.eligibilityRate.toFixed(1)}%`} icon={<TrendingUp className="h-4 w-4" />} />
        <StatsCard title="Excecoes" value={stats.exceptionVouchers.toString()} icon={<FileText className="h-4 w-4" />} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="filters-responsive">
            <div className="space-y-2 filter-item-responsive">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome, ID ou codigo"
                  className="pl-9 w-full"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Filtrar escolas por nome, ID ou código"
                />
              </div>
            </div>
            <div className="space-y-2 filter-item-responsive">
              <Label htmlFor="cluster-filter">Cluster</Label>
              <Select value={selectedCluster} onValueChange={setSelectedCluster}>
                <SelectTrigger id="cluster-filter" className="w-full">
                  <SelectValue placeholder="Cluster" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos clusters</SelectItem>
                  {getClusters().map((cluster) => (
                    <SelectItem key={cluster} value={cluster}>
                      {cluster}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 filter-item-responsive">
              <Label htmlFor="status-filter">Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger id="status-filter" className="w-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  {getStatuses().map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 filter-item-responsive">
              <Label htmlFor="eligible-filter">Elegível</Label>
              <Select value={voucherEligible} onValueChange={setVoucherEligible}>
                <SelectTrigger id="eligible-filter" className="w-full">
                  <SelectValue placeholder="Elegível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Elegíveis</SelectItem>
                  <SelectItem value="false">Não Elegíveis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 filter-item-responsive">
              <Label htmlFor="sent-filter">Enviado</Label>
              <Select value={voucherSent} onValueChange={setVoucherSent}>
                <SelectTrigger id="sent-filter" className="w-full">
                  <SelectValue placeholder="Enviado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Enviados</SelectItem>
                  <SelectItem value="false">Não Enviados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Escolas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="btn-touch-sm"
              aria-label="Limpar filtros"
            >
              Limpar filtros
            </Button>
          </div>
          {viewMode === "cards" ? (
            <div className="grid-responsive-3">
              {filteredSchools.map((school) => (
                <Card key={school.id} className="shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg leading-snug">
                          <TruncatedText text={school.name} maxWidth="100%" showTooltip lines={2} />
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          <TruncatedText text={school.cluster || ""} maxWidth="200px" showTooltip />
                        </p>
                      </div>
                      <Badge className={getStatusBadgeClass(school.status)}>{school.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Elegível</span>
                      <Badge variant={school.voucherEligible ? "default" : "secondary"}>
                        {school.voucherEligible ? "Sim" : "Não"}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Quantidade</span>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="icon-btn-touch-sm"
                            onClick={() => handleQuantityDelta(school.id, -1)}
                            aria-label={`Diminuir quantidade de vouchers da escola ${school.name}`}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            type="number"
                            value={school.voucherQuantity}
                            onChange={(e) => handleQuantityChange(school.id, Number(e.target.value))}
                            className="w-20 h-9 text-center"
                            min={0}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="icon-btn-touch-sm"
                            onClick={() => handleQuantityDelta(school.id, 1)}
                            aria-label={`Aumentar quantidade de vouchers da escola ${school.name}`}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Código</span>
                      <span className="truncate">
                        <TruncatedText text={school.voucherCode} maxWidth="140px" />
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Enviado</span>
                      <Badge variant={school.voucherSent ? "default" : "secondary"}>
                        {school.voucherSent ? "Sim" : "Não"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      <TruncatedText
                        text={school.observations || "Sem observações"}
                        maxWidth="100%"
                        lines={3}
                        showTooltip
                      />
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="table-responsive">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Escola</TableHead>
                    <TableHead>Cluster</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead className="w-48 text-right">Qtd. Vouchers</TableHead>
                    <TableHead className="text-right">Elegível</TableHead>
                    <TableHead className="text-right">Enviado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchools.map((school) => (
                    <TableRow key={school.id}>
                      <TableCell>
                        <div className="font-medium">
                          <TruncatedText text={school.name} maxWidth="260px" lines={2} />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <TruncatedText text={`ID: ${school.id}`} maxWidth="120px" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <TruncatedText text={school.cluster} maxWidth="140px" />
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(school.status)}>{school.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <TruncatedText text={school.voucherCode} maxWidth="120px" />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="icon-btn-touch-sm"
                            onClick={() => handleQuantityDelta(school.id, -1)}
                            aria-label={`Diminuir quantidade de vouchers da escola ${school.name}`}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <Input
                            type="number"
                            value={school.voucherQuantity}
                            onChange={(e) => handleQuantityChange(school.id, Number(e.target.value))}
                            className="w-20 h-9 text-center"
                            min={0}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="icon-btn-touch-sm"
                            onClick={() => handleQuantityDelta(school.id, 1)}
                            aria-label={`Aumentar quantidade de vouchers da escola ${school.name}`}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={school.voucherEligible ? "default" : "secondary"}>
                          {school.voucherEligible ? "Sim" : "Não"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant={school.voucherSent ? "default" : "secondary"}>
                          {school.voucherSent ? "Sim" : "Não"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {filteredSchools.length === 0 && (
            <div className="text-center text-muted-foreground py-6 space-y-3">
              <p>Nenhum voucher encontrado para os filtros selecionados.</p>
              <Button variant="outline" onClick={handleClearFilters} className="btn-touch-sm">
                Limpar filtros
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={campaignDialogOpen} onOpenChange={setCampaignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar campanha de voucher</DialogTitle>
            <DialogDescription>Defina o ano, nome e objetivo da nova campanha.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="campaign-year">Ano da campanha</Label>
              <Input
                id="campaign-year"
                value={campaignForm.year}
                onChange={(e) => setCampaignForm((prev) => ({ ...prev, year: e.target.value }))}
                placeholder="2026"
                maxLength={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-name">Nome da campanha</Label>
              <Input
                id="campaign-name"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Campanha Canva"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="campaign-goal">Objetivo (opcional)</Label>
              <Textarea
                id="campaign-goal"
                value={campaignForm.goal}
                onChange={(e) => setCampaignForm((prev) => ({ ...prev, goal: e.target.value }))}
                placeholder="Ex: Distribuir vouchers para escolas elegiveis do cluster Nordeste."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data inicial (opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !campaignForm.startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {campaignForm.startDate ? format(campaignForm.startDate, "dd/MM/yyyy") : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={campaignForm.startDate}
                      onSelect={(date) => setCampaignForm((prev) => ({ ...prev, startDate: date || undefined }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Data final (opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !campaignForm.endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {campaignForm.endDate ? format(campaignForm.endDate, "dd/MM/yyyy") : "Selecionar data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={campaignForm.endDate}
                      onSelect={(date) => setCampaignForm((prev) => ({ ...prev, endDate: date || undefined }))}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCampaignDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateCampaign}>Salvar campanha</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VoucherDashboard;

