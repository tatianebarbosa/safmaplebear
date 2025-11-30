import { useEffect, useMemo, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  ReferenceLine,
} from "recharts";
import {
  Share2,
  Eye,
  Users,
  ExternalLink,
  Calendar,
  Layers,
  Building2,
  Activity,
  BarChart3,
  Trophy,
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import { UsageFilters, CanvaUsageData } from "@/types/schoolLicense";
import {
  loadUsageReport,
  loadModelUsageRanking,
  ModelUsage,
  TimeSeriesPoint,
} from "@/lib/canvaUsageService";
import { filterRecentTimeSeries } from "@/lib/chartUtils";
import { toast } from "@/components/ui/sonner";
import { useSchoolLicenseStore } from "@/stores/schoolLicenseStore";

interface CanvaUsageDashboardProps {
  onNavigateToUsers: (searchEmail?: string) => void;
}

const periodLabel = (period: UsageFilters["period"]) => {
  const labels: Record<UsageFilters["period"], string> = {
    "30d": "Ultimos 30 dias",
    "3m": "Ultimos 3 meses",
    "6m": "Ultimos 6 meses",
    "12m": "Ultimos 12 meses",
  };
  return labels[period] ?? period;
};

const chartStroke = "hsl(var(--border))";
const chartText = "hsl(var(--muted-foreground))";
const primaryColor = "hsl(var(--primary))";

export const CanvaUsageDashboard = ({
  onNavigateToUsers,
}: CanvaUsageDashboardProps) => {
  const { schools } = useSchoolLicenseStore();
  type MetricKey = "designsCreated" | "designsPublished" | "designsShared" | "designsViewed";
  type CreatorMetric = "designs" | "published" | "shared" | "viewed";
  const [filters, setFilters] = useState<UsageFilters>({
    period: "12m",
    cluster: undefined,
    school: undefined,
  });
  const [usageData, setUsageData] = useState<CanvaUsageData[]>([]);
  const [timeData, setTimeData] = useState<TimeSeriesPoint[]>([]);
  const [annualTimeData, setAnnualTimeData] = useState<TimeSeriesPoint[]>([]);
  const [modelRanking, setModelRanking] = useState<ModelUsage[]>([]);
  const [rankLimit, setRankLimit] = useState(3);
  const [schoolSort, setSchoolSort] = useState<MetricKey>("designsCreated");
  const [creatorSort, setCreatorSort] = useState<CreatorMetric>("designs");

  const metricLabels: Record<MetricKey, string> = {
    designsCreated: "Designs criados",
    designsPublished: "Designs publicados",
    designsShared: "Links compartilhados",
    designsViewed: "Designs visualizados",
  };
  const creatorMetricLabels: Record<CreatorMetric, string> = {
    designs: "Designs criados",
    published: "Designs publicados",
    shared: "Links compartilhados",
    viewed: "Designs visualizados",
  };

  const clusterOptions = [
    { value: "Implantação", label: "Implantação" },
    { value: "Alta Performance", label: "Alta Performance" },
    { value: "Potente", label: "Potente" },
    { value: "Desenvolvimento", label: "Desenvolvimento" },
    { value: "Alerta", label: "Alerta" },
    { value: "Outros/Implantação", label: "Outros/Implantação" },
  ];

  const loadDashboardData = useCallback(async () => {
    const [{ usageData, timeSeries }, models] = await Promise.all([
      loadUsageReport(filters.period),
      loadModelUsageRanking(filters.period),
    ]);
    setUsageData(usageData);
    const cleanedSeries = filterRecentTimeSeries(timeSeries);
    setTimeData(cleanedSeries);
    setModelRanking(models);
  }, [filters.period]);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useEffect(() => {
    const handler = () => loadDashboardData();
    window.addEventListener("canva-upload-refresh", handler);
    return () => window.removeEventListener("canva-upload-refresh", handler);
  }, [loadDashboardData]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadDashboardData();
      }
    };
    window.addEventListener("focus", loadDashboardData);
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      window.removeEventListener("focus", loadDashboardData);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [loadDashboardData]);

  useEffect(() => {
    const loadAnnualTrend = async () => {
      try {
        const { timeSeries } = await loadUsageReport("12m");
        const cleanedSeries = filterRecentTimeSeries(timeSeries);
        setAnnualTimeData(cleanedSeries);
      } catch (error) {
        console.error("Erro ao carregar a serie anual do Canva", error);
      }
    };
    loadAnnualTrend();
  }, []);

  const schoolOptions = useMemo(() => {
    const unique = new Set<string>();
    usageData.forEach((school) => unique.add(school.schoolName));
    return Array.from(unique).sort();
  }, [usageData]);

  useEffect(() => {
    if (filters.school && !schoolOptions.includes(filters.school)) {
      setFilters((prev) => ({ ...prev, school: undefined }));
    }
  }, [filters.school, schoolOptions]);

  const condensedTimeData = useMemo(() => {
    if (!timeData?.length) return [];
    const sanitized = timeData.map((point) => ({
      period: point.period,
      designs: Math.max(0, point.designs ?? 0),
    }));
    // Limita para os pontos mais recentes para evitar gráfico muito longo
    return sanitized.slice(-24);
  }, [timeData]);

  const timeDomain = useMemo<[number, number | "auto"]>(() => {
    const max = condensedTimeData.reduce((acc, point) => Math.max(acc, point.designs ?? 0), 0);
    return [0, max ? Math.ceil(max * 1.1) : "auto"];
  }, [condensedTimeData]);

  const averageDesigns =
    timeData.length > 0 ? timeData.reduce((sum, point) => sum + point.designs, 0) / timeData.length : 0;
  const annualAverage =
    annualTimeData.length > 0
      ? annualTimeData.reduce((sum, point) => sum + point.designs, 0) / annualTimeData.length
      : 0;

  const filteredUsage = useMemo(() => {
    return usageData.filter((school) => {
      const matchesCluster = !filters.cluster || school.cluster === filters.cluster;
      const matchesSchool = !filters.school || school.schoolName === filters.school;
      return matchesCluster && matchesSchool;
    });
  }, [usageData, filters.cluster, filters.school]);

  const totals = filteredUsage.reduce(
    (acc, school) => ({
      designs: acc.designs + school.designsCreated,
      published: acc.published + school.designsPublished,
      shared: acc.shared + school.designsShared,
      viewed: acc.viewed + school.designsViewed,
    }),
    { designs: 0, published: 0, shared: 0, viewed: 0 }
  );

  const publicationRate = totals.designs ? (totals.published / totals.designs) * 100 : 0;
  const shareRate = totals.published ? (totals.shared / totals.published) * 100 : 0;
  const viewsPerDesign = totals.published ? totals.viewed / totals.published : 0;
  const designsPerSchool = filteredUsage.length ? totals.designs / filteredUsage.length : 0;

  const clusterBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { cluster: string; schools: number; designs: number; published: number }
    >();
    filteredUsage.forEach((school) => {
      const key = school.cluster || "Sem cluster";
      const entry = map.get(key) ?? { cluster: key, schools: 0, designs: 0, published: 0 };
      entry.schools += 1;
      entry.designs += school.designsCreated;
      entry.published += school.designsPublished;
      map.set(key, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.designs - a.designs);
  }, [filteredUsage]);

  const topSchools = useMemo(() => {
    const sorted = [...filteredUsage].sort((a, b) => (b[schoolSort] ?? 0) - (a[schoolSort] ?? 0));
    return sorted
      .slice(0, 10)
      .map((school) => ({ ...school, metricValue: school[schoolSort] ?? 0 }));
  }, [filteredUsage, schoolSort]);

  const excludedEmails = new Set(["comunicacao@maplebear.com.br"]);

  const schoolLookup = useMemo(() => {
    const map = new Map<
      string,
      { name: string; cluster?: string; id?: string }
    >();
    schools.forEach((school) => {
      school.users.forEach((user) => {
        const email = user.email?.toLowerCase?.();
        if (!email) return;
        map.set(email, { name: school.name, cluster: school.cluster, id: school.id });
      });
    });
    return map;
  }, [schools]);

  const allCreators = filteredUsage
    .flatMap((school) =>
      school.topCreators.map((creator) => ({
        ...creator,
        schoolName: creator.schoolName ?? school.schoolName,
        schoolCluster: school.cluster ?? "Sem cluster",
      }))
    )
    .filter((creator) => !excludedEmails.has(creator.email?.toLowerCase?.() ?? ""))
    .map((creator) => ({
      ...creator,
      metricValue:
        creatorSort === "designs"
          ? creator.designs
          : creatorSort === "published"
          ? creator.published ?? 0
          : creatorSort === "shared"
          ? creator.shared ?? 0
          : creator.viewed ?? 0,
    }))
    .sort((a, b) => b.metricValue - a.metricValue);

  const rankedCreators = allCreators.slice(0, rankLimit);
  const missingSlots = Math.max(0, rankLimit - rankedCreators.length);

  const resolveSchoolInfo = (email?: string, fallbackName?: string, fallbackCluster?: string) => {
    if (!email) return { name: fallbackName ?? "Sem Escola", cluster: fallbackCluster ?? "Sem cluster" };
    const info = schoolLookup.get(email.toLowerCase());
    return {
      name: info?.name ?? fallbackName ?? "Sem Escola",
      cluster: info?.cluster ?? fallbackCluster ?? "Sem cluster",
    };
  };

  const handleCopyEmail = (email: string) => {
    if (!email) return;
    navigator.clipboard
      ?.writeText(email)
      .then(() => toast.success("Email copiado para comunicar o destaque."))
      .catch(() => toast.error("Nao foi possivel copiar o email agora."));
  };

  const rankStyle = (position: number) => {
    if (position === 0) return "bg-amber-50 border-amber-200";
    if (position === 1) return "bg-slate-50 border-slate-200";
    if (position === 2) return "bg-orange-50 border-orange-200";
    return "bg-background border-border/80";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Analise de Uso do Canva</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe o desempenho e engajamento das escolas
          </p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Periodo de analise
            </Label>
            <Select
              value={filters.period}
              onValueChange={(value: UsageFilters["period"]) =>
                setFilters((prev) => ({ ...prev, period: value }))
              }
            >
              <SelectTrigger className="h-11 rounded-xl border border-border/50 bg-background text-sm font-medium">
                <SelectValue placeholder="Selecione o periodo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Ultimos 30 dias</SelectItem>
                <SelectItem value="3m">Ultimos 3 meses</SelectItem>
                <SelectItem value="6m">Ultimos 6 meses</SelectItem>
                <SelectItem value="12m">Ultimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              Cluster
            </Label>
            <Select
              value={filters.cluster ?? "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, cluster: value === "all" ? undefined : value }))
              }
            >
              <SelectTrigger className="h-11 rounded-xl border border-border/50 bg-background text-sm font-medium">
                <SelectValue placeholder="Selecione o cluster" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clusters</SelectItem>
                {clusterOptions.map((cluster) => (
                  <SelectItem key={cluster.value} value={cluster.value}>
                    {cluster.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              Escola
            </Label>
            <Select
              value={filters.school ?? "all"}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, school: value === "all" ? undefined : value }))
              }
            >
              <SelectTrigger className="h-11 rounded-xl border border-border/50 bg-background text-sm font-medium">
                <SelectValue placeholder="Selecione a escola" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {schoolOptions.map((school) => (
                  <SelectItem key={school} value={school}>
                    {school}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" className="w-full" onClick={loadDashboardData}>
              Recarregar dados
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
        <StatsCard
          title="Designs criados"
          value={totals.designs.toLocaleString()}
          description={periodLabel(filters.period)}
          icon={<Share2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Publicado"
          value={totals.published.toLocaleString()}
          description={`${publicationRate.toFixed(1)}% taxa de publicacao`}
          icon={<Share2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Compartilhado"
          value={totals.shared.toLocaleString()}
          description={`${shareRate.toFixed(1)}% dos publicados`}
          icon={<Share2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Engajamento medio"
          value={viewsPerDesign.toFixed(1)}
          description="Media de engajamento"
          icon={<Eye className="h-4 w-4" />}
        />
        <StatsCard
          title="Designs por escola"
          value={designsPerSchool.toFixed(1)}
          description={`${filteredUsage.length} escolas filtradas`}
          icon={<Building2 className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-xl shadow-sm border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl font-medium">Designs criados por periodo</CardTitle>
          </div>
          <CardDescription className="text-sm text-muted-foreground">
            Evolucao temporal dos designs registrados
          </CardDescription>
        </CardHeader>
          <CardContent>
                        <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={condensedTimeData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="usageArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={primaryColor} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={primaryColor} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="2 6" stroke={chartStroke} />
                <XAxis dataKey="period" tick={{ fill: chartText, fontSize: 12 }} />
                <YAxis tick={{ fill: chartText, fontSize: 12 }} allowDecimals={false} domain={timeDomain} />
                <Tooltip
                  labelFormatter={(label) => `Periodo: ${label}`}
                  formatter={(value) => [value, "Designs"]}
                  contentStyle={{ borderRadius: 12, borderColor: "hsl(var(--border))" }}
                />
                <Area
                  type="monotone"
                  dataKey="designs"
                  stroke={primaryColor}
                  fill="url(#usageArea)"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5, strokeWidth: 0 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-border/40">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <CardTitle className="text-xl font-medium">Top 10 escolas mais ativas</CardTitle>
            </div>
            <CardDescription className="text-sm text-muted-foreground">
              Ranking por designs registrados no periodo
            </CardDescription>
            <div className="flex gap-2 items-center">
              <Label className="text-xs text-muted-foreground">Ordenar por</Label>
              <Select value={schoolSort} onValueChange={(value: MetricKey) => setSchoolSort(value)}>
                <SelectTrigger className="h-9 w-48">
                  <SelectValue placeholder="Metrica" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="designsCreated">Designs criados</SelectItem>
                  <SelectItem value="designsPublished">Designs publicados</SelectItem>
                  <SelectItem value="designsShared">Links compartilhados</SelectItem>
                  <SelectItem value="designsViewed">Designs visualizados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart
                data={topSchools}
                layout="vertical"
                margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
                barCategoryGap={8}
              >
                <CartesianGrid strokeDasharray="2 6" stroke={chartStroke} />
                <XAxis type="number" tick={{ fill: chartText, fontSize: 12 }} allowDecimals={false} />
                <YAxis
                  dataKey="schoolName"
                  type="category"
                  width={170}
                  tick={{ fill: chartText, fontSize: 12 }}
                />
                <Tooltip formatter={(value) => [value, metricLabels[schoolSort]]} contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="metricValue" fill={primaryColor} radius={[6, 6, 6, 6]} barSize={18}>
                  <LabelList dataKey="metricValue" position="right" fill="hsl(var(--foreground))" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-sm border-border/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl font-medium">Trend anual de designs (12 meses)</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Visao consolidada para acompanhar o ritmo geral ao longo do ano
          </CardDescription>
        </CardHeader>
        <CardContent>
          {annualTimeData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados anuais disponiveis.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={annualTimeData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="2 6" stroke={chartStroke} />
                <XAxis dataKey="period" tick={{ fill: chartText, fontSize: 12 }} />
                <YAxis tick={{ fill: chartText, fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(label) => `Periodo: ${label}`}
                  formatter={(value) => [value, "Designs"]}
                  contentStyle={{ borderRadius: 12, borderColor: "hsl(var(--border))" }}
                />
                <ReferenceLine
                  y={annualAverage}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  label={{ position: "right", value: "Media anual", fill: chartText, fontSize: 11 }}
                />
                <Line
                  type="monotone"
                  dataKey="designs"
                  stroke={primaryColor}
                  strokeWidth={3}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

        <Card className="rounded-xl shadow-sm border-border/40">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-medium">Ranking de criadores</CardTitle>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                Ranking priorizado para comunicados de reconhecimento (marketing central excluido)
              </CardDescription>
              <p className="text-xs text-muted-foreground mt-1">
                Mostrando {rankedCreators.length} de {rankLimit} posicoes com os filtros atuais.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 justify-end">
              <div className="flex items-center gap-2">
                <Label className="text-xs text-muted-foreground">Ordenar por</Label>
                <Select value={creatorSort} onValueChange={(value: CreatorMetric) => setCreatorSort(value)}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Metrica" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="designs">Designs criados</SelectItem>
                    <SelectItem value="published">Designs publicados</SelectItem>
                    <SelectItem value="shared">Links compartilhados</SelectItem>
                    <SelectItem value="viewed">Designs visualizados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Select value={String(rankLimit)} onValueChange={(value) => setRankLimit(Number(value))}>
                <SelectTrigger className="w-28">
                  <SelectValue placeholder="Top" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Top 3</SelectItem>
                  <SelectItem value="5">Top 5</SelectItem>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="20">Top 20</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
        <CardContent>
          {rankedCreators.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum criador encontrado no periodo selecionado.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {rankedCreators.map((creator, index) => {
                const schoolInfo = resolveSchoolInfo(creator.email, creator.schoolName, creator.schoolCluster);
                return (
                <div
                  key={`${creator.email}-${index}`}
                  className={`flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-3 border rounded-xl hover:shadow-sm transition-colors ${rankStyle(index)}`}
                >
                  <div className="flex flex-1 items-start gap-3">
                    <Badge variant="secondary" className="min-w-8 justify-center text-xs font-medium bg-red-500 text-white">
                      #{index + 1}
                    </Badge>
                    <div>
                      <div className="font-medium">{creator.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {creator.email} - {schoolInfo.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Cluster: {schoolInfo.cluster}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-right min-w-[96px] md:justify-end">
                    <div className="font-medium">{creator.designs}</div>
                    <div className="text-sm text-muted-foreground">designs</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      asChild
                      className="gap-1"
                    >
                      <a href={`mailto:${creator.email}?subject=Parabens pelo destaque no Canva`}>
                        Parabenizar
                      </a>
                    </Button>
                    <Button size="sm" variant="ghost" className="whitespace-nowrap" onClick={() => onNavigateToUsers(creator.email)}>
                      Ver escola
                    </Button>
                  </div>
                </div>
              );
              })}
              {missingSlots > 0 &&
                Array.from({ length: missingSlots }).map((_, idx) => {
                  const position = rankedCreators.length + idx + 1;
                  return (
                    <div
                      key={`placeholder-${idx}`}
                      className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-3 border border-dashed rounded-xl bg-muted/30 text-muted-foreground"
                    >
                      <div className="flex flex-1 items-start gap-3">
                        <Badge variant="secondary" className="min-w-8 justify-center text-xs font-medium">
                          #{position}
                        </Badge>
                        <div>
                          <div className="font-medium text-muted-foreground">Sem criador disponivel</div>
                          <div className="text-sm text-muted-foreground">
                            Ajuste filtros ou periodo para preencher esta posicao.
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">—</div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">Aguardando dado</div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-border/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-xl font-medium">Top modelos mais utilizados</CardTitle>
          </div>
          <CardDescription className="text-sm text-muted-foreground">
            Ranking das artes disponibilizadas pela equipe de marketing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {modelRanking.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Nenhum modelo registrado ainda.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={modelRanking} margin={{ top: 8, right: 16, left: 0, bottom: 40 }}>
                <CartesianGrid strokeDasharray="2 6" stroke={chartStroke} />
                <XAxis
                  dataKey="modelName"
                  tick={{ fontSize: 12, fill: chartText }}
                  interval={0}
                  height={80}
                  angle={-25}
                  textAnchor="end"
                />
                <YAxis tick={{ fill: chartText, fontSize: 12 }} allowDecimals={false} />
                <Tooltip formatter={(value: number) => [value, "Usos"]} contentStyle={{ borderRadius: 12 }} />
                <Bar dataKey="uses" fill={primaryColor} radius={[6, 6, 6, 6]}>
                  <LabelList dataKey="uses" position="top" fill="hsl(var(--foreground))" fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-border/40">
        <CardHeader>
          <CardTitle className="text-xl font-medium">Distribuicao por cluster</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Entenda onde o engajamento esta concentrado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clusterBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma escola disponivel para os filtros escolhidos.
            </p>
          ) : (
            <div className="space-y-2">
              {clusterBreakdown.map((cluster) => (
                <div
                  key={cluster.cluster}
                  className="flex items-center justify-between rounded-xl border p-3 hover:bg-muted/40 transition-colors"
                >
                  <div>
                    <p className="font-medium">{cluster.cluster}</p>
                    <p className="text-xs text-muted-foreground">{cluster.schools} escolas</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{cluster.designs.toLocaleString()} designs</p>
                    <p className="text-xs text-muted-foreground">
                      {cluster.published.toLocaleString()} publicados
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CanvaUsageDashboard;

