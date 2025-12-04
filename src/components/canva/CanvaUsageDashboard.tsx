import { useEffect, useMemo, useState, useCallback, useRef, ChangeEvent } from "react";
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
import { Input } from "@/components/ui/input";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  ReferenceLine,
  AreaChart,
  Area,
} from "recharts";
import {
  Share2,
  Eye,
  Users,
  ExternalLink,
  Calendar,
  Building2,
  Upload,
  Search,
  Download,
  ArrowUpDown,
} from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import { UsageFilters, CanvaUsageData, UsagePeriod } from "@/types/schoolLicense";
import {
  loadUsageReport,
  loadModelUsageRanking,
  uploadMemberReport,
  uploadModelReport,
  getUploadInfo,
  getOverridesByPeriod,
  clearUploadOverrides,
  ModelUsage,
  TimeSeriesPoint,
} from "@/lib/canvaUsageService";
import { readFileAsUtf8 } from "@/lib/fileUtils";
import { filterRecentTimeSeries } from "@/lib/chartUtils";
import { toast } from "sonner";
import { useSchoolLicenseStore } from "@/stores/schoolLicenseStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { canvaCollector } from "@/lib/canvaDataCollector";

interface CanvaUsageDashboardProps {
  onNavigateToUsers: (searchEmail?: string) => void;
}

const periodLabel = (period: UsageFilters["period"]) => {
  const labels: Record<UsageFilters["period"], string> = {
    "7d": "Ultimos 7 dias",
    "30d": "Ultimos 30 dias",
    "3m": "Ultimos 3 meses",
    "6m": "Ultimos 6 meses",
    "12m": "Ultimos 12 meses",
    nov2025: "Novembro 2025",
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
  type ModelSortKey = "modelName" | "owner" | "uses" | "published" | "shared";
  type MemberSortKey = "name" | "lastActivity" | "designs" | "published" | "shared" | "viewed";
  const [activeTab, setActiveTab] = useState<"models" | "members" | "kits">("models");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<string | "all">("all");
  const [filters, setFilters] = useState<UsageFilters>({
    period: "7d",
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
  const [modelSort, setModelSort] = useState<ModelSortKey>("uses");
  const [modelSortDirection, setModelSortDirection] = useState<"asc" | "desc">("desc");
  const [memberSort, setMemberSort] = useState<MemberSortKey>("designs");
  const [memberSortDirection, setMemberSortDirection] = useState<"asc" | "desc">("desc");
  const [memberUploadPeriod, setMemberUploadPeriod] = useState<UsagePeriod>("7d");
  const [modelUploadPeriod, setModelUploadPeriod] = useState<UsagePeriod>("7d");
  const [applyMembersToAll, setApplyMembersToAll] = useState(false);
  const [applyModelsToAll, setApplyModelsToAll] = useState(false);
  const [memberDateRange, setMemberDateRange] = useState<DateRange | undefined>();
  const [modelDateRange, setModelDateRange] = useState<DateRange | undefined>();
  const [memberLabel, setMemberLabel] = useState("");
  const [modelLabel, setModelLabel] = useState("");
  const memberFileRef = useRef<HTMLInputElement | null>(null);
  const modelFileRef = useRef<HTMLInputElement | null>(null);
  const [uploadingMembers, setUploadingMembers] = useState(false);
  const [uploadingModels, setUploadingModels] = useState(false);
  const [lastMemberUpload, setLastMemberUpload] = useState<string | null>(null);
  const [lastModelUpload, setLastModelUpload] = useState<string | null>(null);
  const [memberOverrides, setMemberOverrides] = useState<
    Array<{ period: UsagePeriod; filename: string | null; uploadedAt: string | null; rows: number; label?: string | null }>
  >([]);
  const [modelOverrides, setModelOverrides] = useState<
    Array<{ period: UsagePeriod; filename: string | null; uploadedAt: string | null; rows: number; label?: string | null }>
  >([]);

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
    { value: "Implantacao", label: "Implantacao" },
    { value: "Alta Performance", label: "Alta Performance" },
    { value: "Potente", label: "Potente" },
    { value: "Desenvolvimento", label: "Desenvolvimento" },
    { value: "Alerta", label: "Alerta" },
    { value: "Outros/Implantacao", label: "Outros/Implantacao" },
  ];

  const refreshUploadInfo = useCallback(() => {
    const memberInfo = getUploadInfo("members");
    const modelInfo = getUploadInfo("models");
    setLastMemberUpload(
      memberInfo
        ? `${memberInfo.filename} em ${new Date(memberInfo.uploadedAt).toLocaleDateString("pt-BR")}${
            memberInfo.label ? ` - ${memberInfo.label}` : ""
          }`
        : null
    );
    setLastModelUpload(
      modelInfo
        ? `${modelInfo.filename} em ${new Date(modelInfo.uploadedAt).toLocaleDateString("pt-BR")}${
            modelInfo.label ? ` - ${modelInfo.label}` : ""
          }`
        : null
    );
    setMemberOverrides(getOverridesByPeriod("members"));
    setModelOverrides(getOverridesByPeriod("models"));
  }, []);

  const loadDashboardData = useCallback(async () => {
    const [{ usageData, timeSeries }, models] = await Promise.all([
      loadUsageReport(filters.period),
      loadModelUsageRanking(filters.period),
    ]);
    setUsageData(usageData);
    const cleanedSeries = filterRecentTimeSeries(timeSeries);
    setTimeData(cleanedSeries);
    setModelRanking(models);
    refreshUploadInfo();
  }, [filters.period, refreshUploadInfo]);

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

  const condensedTimeData = useMemo(() => timeData.slice(-12), [timeData]);
  const timeDomain = useMemo((): [number, number] => {
    if (!condensedTimeData.length) return [0, 10];
    const maxValue = Math.max(...condensedTimeData.map((point) => point.designs));
    return [0, Math.max(10, Math.ceil(maxValue * 1.1))];
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
    const map = new Map<string, { cluster: string; schools: number; designs: number; published: number }>();
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
    return sorted.slice(0, 10).map((school) => ({ ...school, metricValue: school[schoolSort] ?? 0 }));
  }, [filteredUsage, schoolSort]);

  const excludedEmails = new Set(["comunicacao@maplebear.com.br"]);

  const schoolLookup = useMemo(() => {
    const map = new Map<string, { name: string; cluster?: string; id?: string }>();
    schools.forEach((school) => {
      school.users.forEach((user) => {
        const email = user.email?.toLowerCase?.();
        if (!email) return;
        map.set(email, { name: school.name, cluster: school.cluster, id: school.id });
      });
    });
    return map;
  }, [schools]);

  const creatorEntries = useMemo(
    () =>
      filteredUsage
        .flatMap((school) =>
          school.topCreators.map((creator) => ({
            ...creator,
            schoolName: creator.schoolName ?? school.schoolName,
            schoolCluster: creator.cluster ?? school.cluster ?? "Sem cluster",
          }))
        )
        .filter((creator) => !excludedEmails.has(creator.email?.toLowerCase?.() ?? "")),
    [excludedEmails, filteredUsage]
  );

  const allCreators = useMemo(
    () =>
      creatorEntries
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
        .sort((a, b) => b.metricValue - a.metricValue),
    [creatorEntries, creatorSort]
  );

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
      .catch(() => toast.error("Nao foi possivel copiar o e-mail agora."));
  };

  const ownerOptions = useMemo(() => {
    const owners = new Set<string>();
    modelRanking.forEach((model) => {
      if (model.owner) owners.add(model.owner);
    });
    return Array.from(owners).sort();
  }, [modelRanking]);

  const filteredModels = useMemo(() => {
    return modelRanking.filter((model) => {
      const matchesOwner = selectedOwner === "all" || model.owner === selectedOwner;
      const matchesSearch =
        !searchTerm ||
        model.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.owner.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesOwner && matchesSearch;
    });
  }, [modelRanking, searchTerm, selectedOwner]);

  const sortedModels = useMemo(() => {
    const direction = modelSortDirection === "asc" ? 1 : -1;
    const getValue = (model: ModelUsage) => {
      switch (modelSort) {
        case "modelName":
          return model.modelName?.toLowerCase?.() ?? "";
        case "owner":
          return model.owner?.toLowerCase?.() ?? "";
        case "published":
          return model.published ?? 0;
        case "shared":
          return model.shared ?? 0;
        case "uses":
        default:
          return model.uses ?? 0;
      }
    };
    return [...filteredModels].sort((a, b) => {
      const aVal = getValue(a);
      const bVal = getValue(b);
      if (typeof aVal === "string" || typeof bVal === "string") {
        return (String(aVal)).localeCompare(String(bVal), "pt-BR") * direction;
      }
      return ((aVal as number) - (bVal as number)) * direction;
    });
  }, [filteredModels, modelSort, modelSortDirection]);

  const parseActivityDate = (value?: string | null) => {
    if (!value) return null;
    const direct = new Date(value);
    if (!Number.isNaN(direct.getTime())) return direct.getTime();
    const match = value.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
    if (match) {
      const day = Number(match[1]);
      const month = Number(match[2]) - 1;
      let year = Number(match[3]);
      if (year < 100) year += 2000;
      const parsed = new Date(year, month, day);
      if (!Number.isNaN(parsed.getTime())) return parsed.getTime();
    }
    return null;
  };

  const sortedMembers = useMemo(() => {
    const direction = memberSortDirection === "asc" ? 1 : -1;
    const getValue = (creator: (typeof creatorEntries)[number]) => {
      switch (memberSort) {
        case "name":
          return creator.name?.toLowerCase?.() ?? "";
        case "lastActivity":
          return parseActivityDate(creator.lastActivity) ?? 0;
        case "published":
          return creator.published ?? 0;
        case "shared":
          return creator.shared ?? 0;
        case "viewed":
          return creator.viewed ?? 0;
        case "designs":
        default:
          return creator.designs ?? 0;
      }
    };
    return [...creatorEntries].sort((a, b) => {
      const aVal = getValue(a);
      const bVal = getValue(b);
      if (typeof aVal === "string" || typeof bVal === "string") {
        return String(aVal).localeCompare(String(bVal), "pt-BR") * direction;
      }
      return ((aVal as number) - (bVal as number)) * direction;
    });
  }, [creatorEntries, memberSort, memberSortDirection]);

  const handleModelSort = (key: ModelSortKey) => {
    setModelSort((current) => {
      if (current === key) {
        setModelSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
        return current;
      }
      setModelSortDirection("desc");
      return key;
    });
  };

  const handleMemberSort = (key: MemberSortKey) => {
    setMemberSort((current) => {
      if (current === key) {
        setMemberSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
        return current;
      }
      setMemberSortDirection("desc");
      return key;
    });
  };

  const overrideCount = useMemo(() => {
    const memberCount = memberOverrides.filter((o) => o.filename).length;
    const modelCount = modelOverrides.filter((o) => o.filename).length;
    return memberCount + modelCount;
  }, [memberOverrides, modelOverrides]);

  const memberTotals = useMemo(() => {
    let admins = 0;
    let teachers = 0;
    let students = 0;
    let total = 0;
    schools.forEach((school) => {
      total += Number(school.usedLicenses ?? school.users?.length ?? 0);
      school.users?.forEach((user) => {
        if (user.role === "Administrador") admins += 1;
        if (user.role === "Professor") teachers += 1;
        if (user.role === "Estudante") students += 1;
      });
    });
    const computedTotal = total || admins + teachers + students;
    return { total: computedTotal, admins, teachers, students };
  }, [schools]);

  const latestDesigns =
    condensedTimeData.length > 0 ? condensedTimeData[condensedTimeData.length - 1].designs : totals.designs;
  const previousDesigns =
    condensedTimeData.length > 1 ? condensedTimeData[condensedTimeData.length - 2].designs : latestDesigns;
  const designDelta = latestDesigns - previousDesigns;
  const designDeltaPct = previousDesigns ? (designDelta / Math.max(previousDesigns, 1)) * 100 : 0;

  const formatRangeLabel = (range?: DateRange) => {
    if (!range?.from && !range?.to) return null;
    const fmt = (d: Date) => d.toLocaleDateString("pt-BR");
    if (range?.from && range?.to) return `${fmt(range.from)} a ${fmt(range.to)}`;
    if (range?.from) return fmt(range.from);
    if (range?.to) return fmt(range.to);
    return null;
  };

  const handleMemberUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingMembers(true);
    try {
      const text = await readFileAsUtf8(file);
      const label = memberLabel.trim() || formatRangeLabel(memberDateRange) || undefined;
      await uploadMemberReport(file, applyMembersToAll ? "all" : memberUploadPeriod, text, label);
      const summary = await canvaCollector.summarizeCsvContent(text);
      if (summary) {
        canvaCollector.registrarHistoricoUploadManual({
          filename: file.name,
          totalPessoas: summary.totalPessoas ?? 0,
          designsCriados: summary.designsCriados ?? 0,
          uploadType: "members",
        });
      }
      await loadDashboardData();
      toast.success("CSV de membros aplicado. Snapshot anterior preservado.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao processar o CSV de membros.";
      toast.error(message);
    } finally {
      setUploadingMembers(false);
      event.target.value = "";
    }
  };

  const handleModelUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingModels(true);
    try {
      const text = await readFileAsUtf8(file);
      const label = modelLabel.trim() || formatRangeLabel(modelDateRange) || undefined;
      await uploadModelReport(file, applyModelsToAll ? "all" : modelUploadPeriod, text, label);
      const summary = await canvaCollector.summarizeCsvContent(text);
      if (summary) {
        canvaCollector.registrarHistoricoUploadManual({
          filename: file.name,
          totalPessoas: summary.totalPessoas ?? 0,
          designsCriados: summary.designsCriados ?? 0,
          uploadType: "models",
        });
      }
      await loadDashboardData();
      toast.success("CSV de modelos aplicado. Snapshot anterior preservado.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao processar o CSV de modelos.";
      toast.error(message);
    } finally {
      setUploadingModels(false);
      event.target.value = "";
    }
  };

  const handleClearUploads = () => {
    clearUploadOverrides();
    refreshUploadInfo();
    loadDashboardData();
    toast.success("Uploads manuais removidos; voltamos aos arquivos base.");
  };

  const rankStyle = (position: number) => {
    if (position === 0) return "bg-amber-50 border-amber-200";
    if (position === 1) return "bg-slate-50 border-slate-200";
    if (position === 2) return "bg-orange-50 border-orange-200";
    return "bg-background border-border/80";
  };

  return (
    <div className="space-y-8">
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold">Uso do Canva</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Importe os CSVs exportados do Canva para atualizar modelos e pessoas todo mes.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">Atualizacao mensal</Badge>
              <Select
                value={filters.period}
                onValueChange={(value: UsageFilters["period"]) =>
                  setFilters((prev) => ({ ...prev, period: value }))
                }
              >
                <SelectTrigger className="h-10 w-44 rounded-full border-border/60 bg-background text-sm font-medium">
                  <SelectValue placeholder="Periodo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Ultimos 7 dias</SelectItem>
                  <SelectItem value="30d">Ultimos 30 dias</SelectItem>
                  <SelectItem value="3m">Ultimos 3 meses</SelectItem>
                  <SelectItem value="6m">Ultimos 6 meses</SelectItem>
                  <SelectItem value="12m">Ultimos 12 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border/50 bg-gradient-to-r from-sky-50 to-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Designs criados</p>
                  <div className="text-3xl font-semibold">{totals.designs.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {designDelta >= 0 ? "+" : "-"} {Math.abs(designDeltaPct).toFixed(1)}% vs periodo anterior
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full">{periodLabel(filters.period)}</Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="rounded-lg border bg-white/70 p-3">
                  <p className="text-foreground font-semibold">{totals.published.toLocaleString()}</p>
                  <span>Total publicado</span>
                </div>
                <div className="rounded-lg border bg-white/70 p-3">
                  <p className="text-foreground font-semibold">{totals.shared.toLocaleString()}</p>
                  <span>Total compartilhado</span>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-gradient-to-r from-purple-50 to-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Membros ativos</p>
                  <div className="text-3xl font-semibold">{memberTotals.total.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Snapshot baseado nos licenciados atuais
                  </p>
                </div>
                <div className="flex flex-col items-end text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" /> {schools.length} escolas
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="h-3.5 w-3.5" /> Engajamento {viewsPerDesign.toFixed(1)}x
                  </span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                <div className="rounded-lg border bg-white/70 p-3">
                  <p className="text-foreground font-semibold">{memberTotals.admins}</p>
                  <span>Administradores</span>
                </div>
                <div className="rounded-lg border bg-white/70 p-3">
                  <p className="text-foreground font-semibold">{memberTotals.teachers}</p>
                  <span>Professores</span>
                </div>
                <div className="rounded-lg border bg-white/70 p-3">
                  <p className="text-foreground font-semibold">{memberTotals.students}</p>
                  <span>Alunos</span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Cluster</Label>
              <Select
                value={filters.cluster ?? "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, cluster: value === "all" ? undefined : value }))
                }
              >
                <SelectTrigger className="h-10 rounded-lg border-border/60 bg-background text-sm font-medium">
                  <SelectValue placeholder="Todos os clusters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {clusterOptions.map((cluster) => (
                    <SelectItem key={cluster.value} value={cluster.value}>
                      {cluster.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Escola</Label>
              <Select
                value={filters.school ?? "all"}
                onValueChange={(value) =>
                  setFilters((prev) => ({ ...prev, school: value === "all" ? undefined : value }))
                }
              >
                <SelectTrigger className="h-10 rounded-lg border-border/60 bg-background text-sm font-medium">
                  <SelectValue placeholder="Todas as escolas" />
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
            <div className="flex justify-end">
              <Button variant="outline" className="w-full md:w-auto" onClick={loadDashboardData}>
                Recarregar dados
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="space-y-4">
            <TabsList className="w-fit rounded-full bg-muted/60 p-1">
              <TabsTrigger value="models" className="rounded-full px-3 py-1 text-sm">Modelos</TabsTrigger>
              <TabsTrigger value="members" className="rounded-full px-3 py-1 text-sm">Membros</TabsTrigger>
              <TabsTrigger value="kits" className="rounded-full px-3 py-1 text-sm">Kits de marca</TabsTrigger>
            </TabsList>

            <TabsContent value="models" className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-9 w-56"
                    placeholder="Busque um modelo"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={selectedOwner} onValueChange={(value) => setSelectedOwner(value as any)}>
                  <SelectTrigger className="w-44">
                    <SelectValue placeholder="Selecionar titular" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os titulares</SelectItem>
                    {ownerOptions.map((owner) => (
                      <SelectItem key={owner} value={owner}>
                        {owner}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatRangeLabel(modelDateRange) ?? "Intervalo"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <DatePicker mode="range" selected={modelDateRange} onSelect={setModelDateRange} numberOfMonths={2} />
                  </PopoverContent>
                </Popover>
                <Input
                  className="w-48"
                  placeholder="Etiqueta (ex: Dez/2024)"
                  value={modelLabel}
                  onChange={(e) => setModelLabel(e.target.value)}
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch id="models-all" checked={applyModelsToAll} onCheckedChange={setApplyModelsToAll} />
                  <label htmlFor="models-all">Aplicar em todos os periodos</label>
                </div>
                <Button onClick={() => modelFileRef.current?.click()} disabled={uploadingModels} className="gap-2">
                  <Upload className="h-4 w-4" />
                  {uploadingModels ? "Importando..." : "Importar modelos CSV"}
                </Button>
                <Button variant="ghost" onClick={handleClearUploads} disabled={!overrideCount} className="text-xs">
                  Remover todos {overrideCount ? `(${overrideCount})` : ""}
                </Button>
                <Button variant="outline" className="gap-2" asChild>
                  <a href="/data/template-novembro2025.csv" download>
                    <Download className="h-4 w-4" />
                    Baixar template
                  </a>
                </Button>
              </div>
              <input
                ref={modelFileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleModelUpload}
              />
              <p className="text-xs text-muted-foreground">
              Ultimo upload de modelos: {lastModelUpload ?? "Nenhum"}
              </p>
              {modelOverrides.some((o) => o.filename) && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {modelOverrides.map((o) => (
                    <div key={o.period} className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2 text-xs">
                      <span className="font-medium">{o.period}</span>
                      <span className="text-right text-muted-foreground">
                        {o.filename ? `${o.filename}${o.label ? ` - ${o.label}` : ""}` : "Sem upload"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
                <table className="w-full min-w-[720px] text-sm">
                  <thead className="bg-muted/40 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-foreground">Modelo</th>
                      <th className="px-3 py-2 text-left font-medium text-foreground">Titular</th>
                      <th className="px-3 py-2 text-left font-medium">
                        <button
                          type="button"
                          className="flex items-center gap-1 text-xs font-medium text-foreground"
                          onClick={() => handleModelSort("uses")}
                        >
                          Usadas
                          <ArrowUpDown className={`h-3.5 w-3.5 ${modelSort === "uses" ? "text-primary" : "text-muted-foreground"}`} />
                        </button>
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        <button
                          type="button"
                          className="flex items-center gap-1 text-xs font-medium text-foreground"
                          onClick={() => handleModelSort("published")}
                        >
                          Publicado
                          <ArrowUpDown className={`h-3.5 w-3.5 ${modelSort === "published" ? "text-primary" : "text-muted-foreground"}`} />
                        </button>
                      </th>
                      <th className="px-3 py-2 text-left font-medium">
                        <button
                          type="button"
                          className="flex items-center gap-1 text-xs font-medium text-foreground"
                          onClick={() => handleModelSort("shared")}
                        >
                          Compartilhado
                          <ArrowUpDown className={`h-3.5 w-3.5 ${modelSort === "shared" ? "text-primary" : "text-muted-foreground"}`} />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedModels.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-4 text-center text-muted-foreground text-sm">
                          Nenhum modelo encontrado para os filtros atuais.
                        </td>
                      </tr>
                    ) : (
                      sortedModels.map((model) => (
                        <tr key={`${model.modelName}-${model.owner}`} className="border-t border-border/40">
                          <td className="px-3 py-2">
                            <div className="font-medium text-foreground">{model.modelName}</div>
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{model.owner || "Sem titular"}</td>
                          <td className="px-3 py-2 font-semibold text-foreground">{Number(model.uses ?? 0).toLocaleString()}</td>
                          <td className="px-3 py-2">{Number(model.published ?? 0).toLocaleString()}</td>
                          <td className="px-3 py-2">{Number(model.shared ?? 0).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="members" className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Calendar className="h-4 w-4" />
                      {formatRangeLabel(memberDateRange) ?? "Intervalo"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <DatePicker mode="range" selected={memberDateRange} onSelect={setMemberDateRange} numberOfMonths={2} />
                  </PopoverContent>
                </Popover>
                <Input
                  className="w-48"
                  placeholder="Etiqueta (ex: Dez/2024)"
                  value={memberLabel}
                  onChange={(e) => setMemberLabel(e.target.value)}
                />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch id="members-all" checked={applyMembersToAll} onCheckedChange={setApplyMembersToAll} />
                  <label htmlFor="members-all">Aplicar em todos os periodos</label>
                </div>
                <Select value={memberUploadPeriod} onValueChange={(value: UsagePeriod) => setMemberUploadPeriod(value)}>
                  <SelectTrigger className="h-9 w-32">
                    <SelectValue placeholder="Periodo" />
                  </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 dias</SelectItem>
                  <SelectItem value="30d">30 dias</SelectItem>
                  <SelectItem value="3m">3 meses</SelectItem>
                  <SelectItem value="6m">6 meses</SelectItem>
                  <SelectItem value="12m">12 meses</SelectItem>
                </SelectContent>
                </Select>
                <Button onClick={() => memberFileRef.current?.click()} disabled={uploadingMembers} className="gap-2">
                  <Upload className="h-4 w-4" />
                  {uploadingMembers ? "Importando..." : "Importar membros CSV"}
                </Button>
              </div>
              <input
                ref={memberFileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={handleMemberUpload}
              />
              <p className="text-xs text-muted-foreground">
              Ultimo upload de membros: {lastMemberUpload ?? "Nenhum"}
              </p>
              {memberOverrides.some((o) => o.filename) && (
                <div className="grid gap-2 sm:grid-cols-2">
                  {memberOverrides.map((o) => (
                    <div key={o.period} className="flex items-center justify-between rounded-lg border border-dashed px-3 py-2 text-xs">
                      <span className="font-medium">{o.period}</span>
                      <span className="text-right text-muted-foreground">
                        {o.filename ? `${o.filename}${o.label ? ` - ${o.label}` : ""}` : "Sem upload"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-3">
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Licen?as em uso</p>
                    <div className="text-2xl font-semibold">{memberTotals.total.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Administradores</p>
                    <div className="text-2xl font-semibold">{memberTotals.admins}</div>
                  </CardContent>
                </Card>
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Professores</p>
                    <div className="text-2xl font-semibold">{memberTotals.teachers}</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-border/60 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-medium">Membros importados</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Cabecalho de filtros sempre visivel para ordenar atividade e engajamento.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
                    <table className="w-full min-w-[900px] text-sm">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-foreground">Membro</th>
                          <th className="px-3 py-2 text-left font-medium text-foreground">Escola</th>
                          <th className="px-3 py-2 text-left font-medium">
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs font-medium text-foreground"
                              onClick={() => handleMemberSort("lastActivity")}
                            >
                              Ultima atividade
                              <ArrowUpDown className={`h-3.5 w-3.5 ${memberSort === "lastActivity" ? "text-primary" : "text-muted-foreground"}`} />
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs font-medium text-foreground"
                              onClick={() => handleMemberSort("designs")}
                            >
                              Designs criados
                              <ArrowUpDown className={`h-3.5 w-3.5 ${memberSort === "designs" ? "text-primary" : "text-muted-foreground"}`} />
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs font-medium text-foreground"
                              onClick={() => handleMemberSort("published")}
                            >
                              Designs publicados
                              <ArrowUpDown className={`h-3.5 w-3.5 ${memberSort === "published" ? "text-primary" : "text-muted-foreground"}`} />
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs font-medium text-foreground"
                              onClick={() => handleMemberSort("shared")}
                            >
                              Links compartilhados
                              <ArrowUpDown className={`h-3.5 w-3.5 ${memberSort === "shared" ? "text-primary" : "text-muted-foreground"}`} />
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-medium">
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs font-medium text-foreground"
                              onClick={() => handleMemberSort("viewed")}
                            >
                              Designs visualizados
                              <ArrowUpDown className={`h-3.5 w-3.5 ${memberSort === "viewed" ? "text-primary" : "text-muted-foreground"}`} />
                            </button>
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedMembers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-3 py-4 text-center text-sm text-muted-foreground">
                              Nenhum membro encontrado para os filtros atuais.
                            </td>
                          </tr>
                        ) : (
                          sortedMembers.slice(0, 25).map((creator, index) => (
                            <tr key={`${creator.email}-${index}`} className="border-t border-border/40">
                              <td className="px-3 py-2">
                                <div className="font-medium text-foreground">{creator.name || "Sem nome"}</div>
                                <div className="text-xs text-muted-foreground">{creator.email || "Sem email"}</div>
                              </td>
                              <td className="px-3 py-2">
                                <div className="text-sm text-foreground">{creator.schoolName || "Sem escola"}</div>
                                <div className="text-xs text-muted-foreground">Cluster: {creator.schoolCluster ?? "Sem cluster"}</div>
                              </td>
                              <td className="px-3 py-2 text-sm text-muted-foreground">
                                {creator.lastActivity || "-"}
                              </td>
                              <td className="px-3 py-2 font-semibold text-foreground">{Number(creator.designs ?? 0).toLocaleString()}</td>
                              <td className="px-3 py-2">{Number(creator.published ?? 0).toLocaleString()}</td>
                              <td className="px-3 py-2">{Number(creator.shared ?? 0).toLocaleString()}</td>
                              <td className="px-3 py-2">{Number(creator.viewed ?? 0).toLocaleString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="kits" className="space-y-3">
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                Kits de marca usam os mesmos uploads. Mantenha os CSVs atualizados para refletir compartilhamentos e publicacoes.
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total publicado</p>
                    <div className="text-2xl font-semibold">{totals.published.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Total compartilhado</p>
                    <div className="text-2xl font-semibold">{totals.shared.toLocaleString()}</div>
                  </CardContent>
                </Card>
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Engajamento medio</p>
                    <div className="text-2xl font-semibold">{viewsPerDesign.toFixed(1)}x</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
            <CardTitle className="text-xl font-medium">Designs criados por periodo</CardTitle>
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
            <CardTitle className="text-xl font-medium">Top 10 escolas mais ativas</CardTitle>
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
            <CardTitle className="text-xl font-medium">Ranking de criadores</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Ranking priorizado para comunicados de reconhecimento (marketing central excluido)
            </CardDescription>
            <p className="text-xs text-muted-foreground mt-1">
              Mostrando {rankedCreators.length} de {rankLimit} posicoes com os filtros atuais.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 justify-end">
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
            <Button variant="outline" onClick={() => onNavigateToUsers()} className="gap-2">
              <Users className="h-4 w-4" />
              Ver usuarios
              <ExternalLink className="h-3 w-3" />
            </Button>
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
                    <Button size="sm" variant="ghost" className="whitespace-nowrap" onClick={() => handleCopyEmail(creator.email)}>
                      Copiar email
                    </Button>
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
                      <div className="flex items-center gap-1 text-sm text-muted-foreground"></div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">Aguardando dado</div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>

      {activeTab === "models" && (
        <Card className="rounded-xl shadow-sm border-border/40">
          <CardHeader>
            <CardTitle className="text-xl font-medium">Top modelos mais utilizados</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Ranking das artes disponibilizadas pela equipe de marketing
            </CardDescription>
          </CardHeader>
          <CardContent>
            {modelRanking.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">Nenhum modelo registrado ainda.</div>
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
      )}

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
