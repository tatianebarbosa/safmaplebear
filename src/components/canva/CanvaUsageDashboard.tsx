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
  CalendarRange,
  ChevronDown,
  Check,
  Loader2,
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
import { toast } from "@/components/ui/sonner";
import { useSchoolLicenseStore } from "@/stores/schoolLicenseStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { DateRange } from "react-day-picker";
import { canvaCollector } from "@/lib/canvaDataCollector";
import { differenceInCalendarDays, format } from "date-fns";

interface CanvaUsageDashboardProps {
  onNavigateToUsers: (searchEmail?: string) => void;
}

const periodLabel = (period: UsageFilters["period"]) => {
  const labels: Record<UsageFilters["period"], string> = {
    "7d": "Últimos 7 dias",
    "30d": "Últimos 30 dias",
    "3m": "Últimos 3 meses",
    "6m": "Últimos 6 meses",
    "12m": "Últimos 12 meses",
    nov2025: "Novembro 2025",
  };
  return labels[period] ?? period;
};

const chartStroke = "hsl(var(--border))";
const chartText = "hsl(var(--muted-foreground))";
const primaryColor = "hsl(var(--primary))";
const mascotLoadingStyles = `
@keyframes mascotRide {
  0% { transform: translateX(-14px) rotate(-1.5deg); }
  50% { transform: translateX(0) rotate(0deg); }
  100% { transform: translateX(14px) rotate(1.5deg); }
}

@keyframes mascotShadow {
  0% { transform: translateX(-14px) scaleX(0.88); opacity: 0.3; }
  50% { transform: translateX(0) scaleX(1); opacity: 0.45; }
  100% { transform: translateX(14px) scaleX(0.88); opacity: 0.3; }
}
`;

const calcRangeFromPeriod = (period: UsagePeriod): DateRange => {
  const today = new Date();
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = new Date(end);

  const setDaysAgo = (days: number) => {
    start.setDate(end.getDate() - (days - 1));
  };

  if (period === "7d") setDaysAgo(7);
  else if (period === "30d") setDaysAgo(30);
  else if (period === "3m") start.setMonth(end.getMonth() - 3);
  else if (period === "6m") start.setMonth(end.getMonth() - 6);
  else if (period === "12m") start.setMonth(end.getMonth() - 12);
  else if (period === "nov2025") {
    return {
      from: new Date(2025, 10, 1),
      to: new Date(2025, 10, 30),
    };
  }

  return { from: start, to: end };
};

const formatDate = (date?: Date) => (date ? format(date, "dd/MM/yyyy") : "");

const MascotLoading = () => (
  <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 px-4 text-center">
    <div className="relative h-48 w-48 sm:h-56 sm:w-56">
      <div
        className="absolute inset-x-6 bottom-6 h-3 rounded-full bg-primary/20 blur-[2px]"
        style={{ animation: "mascotShadow 1.6s ease-in-out infinite alternate" }}
      />
      <img
        src="/chinook-bike.png"
        alt="Mascote pedalando enquanto carregamos o painel"
        className="h-full w-full object-contain drop-shadow-lg"
        style={{ animation: "mascotRide 1.6s ease-in-out infinite alternate" }}
      />
    </div>
    <div className="space-y-1">
      <p className="text-base font-semibold text-foreground">Carregando painel do Canva...</p>
      <p className="text-sm text-muted-foreground">O mascote esta pedalando enquanto buscamos os dados.</p>
    </div>
  </div>
);

export const CanvaUsageDashboard = ({
  onNavigateToUsers,
}: CanvaUsageDashboardProps) => {
  const { schools } = useSchoolLicenseStore();
  type MetricKey = "designsCreated" | "designsPublished" | "designsShared" | "designsViewed";
  type CreatorMetric = "designs" | "published" | "shared" | "viewed";
  type ModelSortKey = "modelName" | "owner" | "uses" | "published" | "shared";
  type MemberSortKey = "name" | "category" | "lastActivity" | "designs" | "published" | "shared" | "viewed";
  const [activeTab, setActiveTab] = useState<"models" | "members" | "kits">("models");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<string | "all">("all");
  const [filters, setFilters] = useState<UsageFilters>({
    period: "7d",
    cluster: undefined,
    school: undefined,
  });
  const periodPresets: Array<{ key: UsagePeriod; label: string; subtitle?: string }> = [
    { key: "12m", label: "12 meses", subtitle: "Últimos 12 meses" },
    { key: "6m", label: "6 meses", subtitle: "Últimos 6 meses" },
    { key: "3m", label: "3 meses", subtitle: "Últimos 3 meses" },
    { key: "30d", label: "Últimos 30 dias", subtitle: "Janela rolante" },
    { key: "7d", label: "Últimos 7 dias", subtitle: "7 dias corridos" },
    { key: "nov2025", label: "Novembro 2025", subtitle: "Recorte fixo" },
  ];
  const [periodPreset, setPeriodPreset] = useState<UsagePeriod>(filters.period);
  const [periodDropdownOpen, setPeriodDropdownOpen] = useState(false);
  const activeRange = useMemo(() => calcRangeFromPeriod(filters.period), [filters.period]);
  const [customRange, setCustomRange] = useState<DateRange | undefined>(activeRange);
  const [customRangeHint, setCustomRangeHint] = useState<string | null>(null);
  const currentPresetLabel =
    periodPresets.find((p) => p.key === periodPreset)?.label ?? periodLabel(filters.period);
  const [usageData, setUsageData] = useState<CanvaUsageData[]>([]);
  const [timeData, setTimeData] = useState<TimeSeriesPoint[]>([]);
  const [annualTimeData, setAnnualTimeData] = useState<TimeSeriesPoint[]>([]);
  const [modelRanking, setModelRanking] = useState<ModelUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [rankLimit, setRankLimit] = useState(3);
  const [schoolSort, setSchoolSort] = useState<MetricKey>("designsCreated");
  const [creatorSort, setCreatorSort] = useState<CreatorMetric>("designs");
  const [creatorCategory, setCreatorCategory] = useState<string>("all");
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
  const loadingRequestId = useRef(0);
  const hasLoadedOnce = useRef(false);
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
    { value: "Implantacao", label: "Implantação" },
    { value: "Alta Performance", label: "Alta Performance" },
    { value: "Potente", label: "Potente" },
    { value: "Desenvolvimento", label: "Desenvolvimento" },
    { value: "Alerta", label: "Alerta" },
    { value: "Outros/Implantacao", label: "Outros/Implantação" },
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
    const requestId = ++loadingRequestId.current;
    const isFirstLoad = !hasLoadedOnce.current;
    if (isFirstLoad) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const [{ usageData, timeSeries }, models] = await Promise.all([
        loadUsageReport(filters.period),
        loadModelUsageRanking(filters.period),
      ]);
      setUsageData(usageData);
      const cleanedSeries = filterRecentTimeSeries(timeSeries);
      setTimeData(cleanedSeries);
      setModelRanking(models);
      refreshUploadInfo();
    } catch (error) {
      console.error("Erro ao carregar os dados do Canva", error);
      toast.error("Nao foi possivel carregar os dados do Canva agora.");
    } finally {
      if (requestId === loadingRequestId.current) {
        setIsLoading(false);
        setIsRefreshing(false);
        hasLoadedOnce.current = true;
      }
    }
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
    setPeriodPreset(filters.period);
    setCustomRange(calcRangeFromPeriod(filters.period));
  }, [filters.period]);

  const applyPresetPeriod = (preset: UsagePeriod) => {
    setPeriodPreset(preset);
    setFilters((prev) => ({ ...prev, period: preset }));
    setCustomRange(calcRangeFromPeriod(preset));
    setCustomRangeHint(null);
    setPeriodDropdownOpen(false);
  };

  const applyCustomRange = () => {
    if (!customRange?.from || !customRange?.to) {
      setCustomRangeHint("Selecione datas de início e fim para aplicar.");
      return;
    }
    const diffDays = differenceInCalendarDays(customRange.to, customRange.from) + 1;
    const mappedPreset: UsagePeriod =
      diffDays <= 7 ? "7d" : diffDays <= 30 ? "30d" : diffDays <= 90 ? "3m" : diffDays <= 180 ? "6m" : "12m";
    setCustomRangeHint(`Aplicando ${periodLabel(mappedPreset)} (recorte mais próximo disponível).`);
    applyPresetPeriod(mappedPreset);
  };

  useEffect(() => {
    if (periodDropdownOpen) {
      setCustomRange(activeRange);
      setCustomRangeHint(null);
    }
  }, [periodDropdownOpen, activeRange]);

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
        console.error("Erro ao carregar a série anual do Canva", error);
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
  // Engajamento: visualizações por link compartilhado (evita diluir em todos publicados)
  const viewsPerDesign = totals.shared ? totals.viewed / totals.shared : 0;
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

  const creatorCategories = useMemo(() => {
    const unique = new Set<string>();
    creatorEntries.forEach((creator) => {
      const category = creator.role || creator.category;
      if (category) unique.add(category);
    });
    if (creatorEntries.some((creator) => !creator.role && !creator.category)) {
      unique.add("Sem categoria");
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [creatorEntries]);

  const filteredCreators = useMemo(
    () =>
      creatorEntries.filter((creator) => {
        if (creatorCategory === "all") return true;
        const category = creator.role || creator.category || "Sem categoria";
        return category === creatorCategory;
      }),
    [creatorCategory, creatorEntries]
  );

  useEffect(() => {
    if (creatorCategory !== "all" && !creatorCategories.includes(creatorCategory)) {
      setCreatorCategory("all");
    }
  }, [creatorCategories, creatorCategory]);

  const allCreators = useMemo(
    () =>
      filteredCreators
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
    [creatorSort, filteredCreators]
  );

  const rankedCreators = allCreators.slice(0, rankLimit);
  const missingSlots = Math.max(0, rankLimit - rankedCreators.length);

  const resolveSchoolInfo = (email?: string, fallbackName?: string, fallbackCluster?: string) => {
    if (!email) return { name: fallbackName ?? "Sem escola", cluster: fallbackCluster ?? "Sem cluster" };
    const info = schoolLookup.get(email.toLowerCase());
    return {
      name: info?.name ?? fallbackName ?? "Sem escola",
      cluster: info?.cluster ?? fallbackCluster ?? "Sem cluster",
    };
  };

  const handleCopyEmail = (email: string) => {
    if (!email) return;
    navigator.clipboard
      ?.writeText(email)
      .then(() => toast.success("E-mail copiado para comunicar o destaque."))
      .catch(() => toast.error("Não foi possível copiar o e-mail agora."));
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
        return String(aVal).localeCompare(String(bVal), "pt-BR") * direction;
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
    const getValue = (creator: (typeof filteredCreators)[number]) => {
      switch (memberSort) {
        case "name":
          return creator.name?.toLowerCase?.() ?? "";
        case "lastActivity":
          return parseActivityDate(creator.lastActivity) ?? 0;
        case "category":
          return (creator.role ?? creator.category ?? "").toLowerCase();
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
    return [...filteredCreators].sort((a, b) => {
      const aVal = getValue(a);
      const bVal = getValue(b);
      if (typeof aVal === "string" || typeof bVal === "string") {
        return String(aVal).localeCompare(String(bVal), "pt-BR") * direction;
      }
      return ((aVal as number) - (bVal as number)) * direction;
    });
  }, [filteredCreators, memberSort, memberSortDirection]);

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

  const uploadRowsTotals = useMemo(() => {
    const memberRows = memberOverrides.reduce((sum, o) => sum + (o.rows || 0), 0);
    const modelRows = modelOverrides.reduce((sum, o) => sum + (o.rows || 0), 0);
    return { members: memberRows, models: modelRows, total: memberRows + modelRows };
  }, [memberOverrides, modelOverrides]);

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
    <div className="relative">
      <style>{mascotLoadingStyles}</style>
      {isLoading ? (
        <MascotLoading />
      ) : (
        <div className="space-y-8">
      <Card className="rounded-2xl border-border/60 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl font-semibold">Uso do Canva</CardTitle>
              <CardDescription className="text-sm text-muted-foreground">
                Importe os CSVs exportados do Canva para atualizar modelos e pessoas todo mês.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary">Atualização mensal</Badge>
              {isRefreshing && (
                <Badge variant="outline" className="gap-1 text-xs">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Atualizando dados
                </Badge>
              )}
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground text-left">Período</p>
                <Popover open={periodDropdownOpen} onOpenChange={setPeriodDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button className="flex h-auto w-full min-w-[220px] items-center gap-3 rounded-2xl border border-border/60 bg-white px-3 py-2 text-left shadow-sm transition hover:border-primary/50 hover:shadow-md">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CalendarRange className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                          Período ativo
                        </p>
                        <p className="text-sm font-semibold leading-tight text-foreground">
                          {currentPresetLabel}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {`${formatDate(activeRange.from)} - ${formatDate(activeRange.to)}`}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    align="end"
                    className="w-[min(920px,calc(100vw-32px))] space-y-4 rounded-2xl border border-border/60 bg-white p-4 shadow-xl"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-foreground">Selecionar um intervalo de datas</p>
                        <p className="text-xs text-muted-foreground">
                          Ajuste o período para sincronizar cartões e gráficos do painel.
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Período ativo: {currentPresetLabel}
                      </Badge>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Períodos rápidos</p>
                          <div className="grid gap-2 rounded-xl border border-border/70 bg-muted/30 p-2">
                            {periodPresets
                              .filter((preset) => preset.key !== "nov2025")
                              .map((item) => {
                                const isActive = periodPreset === item.key;
                                return (
                                  <button
                                    key={item.key}
                                    type="button"
                                    onClick={() => applyPresetPeriod(item.key)}
                                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-left transition hover:bg-background ${
                                      isActive ? "border border-primary/40 bg-background font-semibold" : "border border-transparent text-muted-foreground"
                                    }`}
                                  >
                                    <div className="flex flex-col">
                                      <span>{item.label}</span>
                                      {item.subtitle && (
                                        <span className="text-[11px] text-muted-foreground">{item.subtitle}</span>
                                      )}
                                    </div>
                                    {isActive && <Check className="h-4 w-4 text-primary" />}
                                  </button>
                                );
                              })}
                          </div>
                        </div>

                        <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-3">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-foreground">Datas personalizadas</p>
                              <p className="text-xs text-muted-foreground">
                                Usamos o recorte disponível mais próximo (7d, 30d, 3m, 6m ou 12m).
                              </p>
                            </div>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Input
                              readOnly
                              value={customRange?.from ? format(customRange.from, "dd/MM/yyyy") : ""}
                              placeholder="dd/mm/aaaa"
                              className="bg-background"
                            />
                            <Input
                              readOnly
                              value={customRange?.to ? format(customRange.to, "dd/MM/yyyy") : ""}
                              placeholder="dd/mm/aaaa"
                              className="bg-background"
                            />
                          </div>
                          <div className="rounded-lg border bg-background p-3">
                            <DatePicker
                              mode="range"
                              selected={customRange}
                              onSelect={(range) => {
                                setCustomRange(range);
                                setCustomRangeHint(null);
                              }}
                              numberOfMonths={2}
                            />
                          </div>
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <p className="text-xs text-muted-foreground">
                              {customRangeHint ?? "Selecione um intervalo para aplicar."}
                            </p>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setCustomRange(undefined);
                                  setCustomRangeHint(null);
                                }}
                              >
                                Limpar
                              </Button>
                              <Button size="sm" onClick={applyCustomRange}>
                                Pronto
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Recorte especial</p>
                          {periodPresets
                            .filter((preset) => preset.key === "nov2025")
                            .map((item) => (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => applyPresetPeriod(item.key)}
                                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition hover:bg-background ${
                                  periodPreset === item.key ? "border-primary/40 bg-background font-semibold" : "border-border/60 text-muted-foreground"
                                }`}
                              >
                                <div className="flex flex-col">
                                  <span>{item.label}</span>
                                  {item.subtitle && (
                                    <span className="text-[11px] text-muted-foreground">{item.subtitle}</span>
                                  )}
                                </div>
                                {periodPreset === item.key && <Check className="h-4 w-4 text-primary" />}
                              </button>
                            ))}
                        </div>
                      </div>

                      <div className="space-y-3 rounded-xl border border-border/60 bg-muted/20 p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Resumo</p>
                        <div className="rounded-lg border bg-background p-3">
                          <p className="text-sm font-semibold text-foreground">{currentPresetLabel}</p>
                          <p className="text-xs text-muted-foreground">
                            {`${formatDate(activeRange.from)} - ${formatDate(activeRange.to)}`}
                          </p>
                        </div>
                        <div className="rounded-lg border bg-background p-3 text-xs text-muted-foreground">
                          Se você escolher um intervalo diferente, aplicaremos o recorte disponível mais próximo para manter os dados consistentes.
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-border/50 bg-gradient-to-r from-sky-50 to-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Designs criados</p>
                  <div className="text-3xl font-semibold">{totals.designs.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {designDelta >= 0 ? "+" : "-"} {Math.abs(designDeltaPct).toFixed(1)}% vs período anterior
                  </p>
                </div>
                <Badge variant="outline" className="rounded-full">
                  {periodLabel(filters.period)}
                </Badge>
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
              <TabsTrigger value="members" className="rounded-full px-3 py-1 text-sm">Criadores</TabsTrigger>
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
                  <label htmlFor="models-all">Aplicar em todos os períodos</label>
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
                Último upload de modelos: {lastModelUpload ?? "Nenhum"}
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
                  <label htmlFor="members-all">Aplicar em todos os períodos</label>
                </div>
                <Select value={memberUploadPeriod} onValueChange={(value: UsagePeriod) => setMemberUploadPeriod(value)}>
                  <SelectTrigger className="h-9 w-32">
                    <SelectValue placeholder="Período" />
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
                  {uploadingMembers ? "Importando..." : "Importar criadores CSV"}
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
                Último upload de criadores: {lastMemberUpload ?? "Nenhum"}
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
                    <p className="text-sm text-muted-foreground">Licenças em uso</p>
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
                  <CardTitle className="text-lg font-medium">Criadores importados</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Cabeçalho de filtros sempre visível para ordenar atividade e engajamento.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="overflow-x-auto rounded-lg border border-border/60 bg-card">
                    <table className="w-full min-w-[1024px] text-sm">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2 text-left font-medium text-foreground">Membro</th>
                          <th className="px-3 py-2 text-left font-medium">
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs font-medium text-foreground"
                              onClick={() => handleMemberSort("category")}
                            >
                              Categoria
                              <ArrowUpDown className={`h-3.5 w-3.5 ${memberSort === "category" ? "text-primary" : "text-muted-foreground"}`} />
                            </button>
                          </th>
                          <th className="px-3 py-2 text-left font-medium text-foreground">Escola</th>
                          <th className="px-3 py-2 text-left font-medium">
                            <button
                              type="button"
                              className="flex items-center gap-1 text-xs font-medium text-foreground"
                              onClick={() => handleMemberSort("lastActivity")}
                            >
                              Última atividade
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
                            <td colSpan={8} className="px-3 py-4 text-center text-sm text-muted-foreground">
                              Nenhum membro encontrado para os filtros atuais.
                            </td>
                          </tr>
                        ) : (
                          sortedMembers.slice(0, 25).map((creator, index) => (
                            <tr key={`${creator.email}-${index}`} className="border-t border-border/40">
                              <td className="px-3 py-2">
                                <div className="font-medium text-foreground">{creator.name || "Sem nome"}</div>
                                <div className="text-xs text-muted-foreground">{creator.email || "Sem e-mail"}</div>
                              </td>
                              <td className="px-3 py-2 text-sm text-foreground">
                                {creator.role || creator.category || "Sem categoria"}
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
                Kits de marca usam os mesmos uploads. Mantenha os CSVs atualizados para refletir compartilhamentos e publicações.
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
                    <p className="text-sm text-muted-foreground">Engajamento médio</p>
                    <div className="text-2xl font-semibold">{viewsPerDesign.toFixed(1)}x</div>
                  </CardContent>
                </Card>
                <Card className="border-border/60 shadow-sm">
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground">Uploads manuais</p>
                    <div className="text-2xl font-semibold">{uploadRowsTotals.total.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Membros: {uploadRowsTotals.members.toLocaleString()} | Modelos: {uploadRowsTotals.models.toLocaleString()}
                    </p>
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
          description={`${publicationRate.toFixed(1)}% taxa de publicação`}
          icon={<Share2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Compartilhado"
          value={totals.shared.toLocaleString()}
          description={`${shareRate.toFixed(1)}% dos publicados`}
          icon={<Share2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Engajamento médio"
          value={viewsPerDesign.toFixed(1)}
          description="Visualizações por link compartilhado"
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
            <CardTitle className="text-xl font-medium">Designs criados por período</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Evolução temporal dos designs registrados
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
                  labelFormatter={(label) => `Período: ${label}`}
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
              Ranking por designs registrados no período
            </CardDescription>
            <div className="flex gap-2 items-center">
              <Label className="text-xs text-muted-foreground">Ordenar por</Label>
              <Select value={schoolSort} onValueChange={(value: MetricKey) => setSchoolSort(value)}>
                <SelectTrigger className="h-9 w-48">
                  <SelectValue placeholder="Métrica" />
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
            Visão consolidada para acompanhar o ritmo geral ao longo do ano
          </CardDescription>
        </CardHeader>
        <CardContent>
          {annualTimeData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem dados anuais disponíveis.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={annualTimeData} margin={{ top: 16, right: 16, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="2 6" stroke={chartStroke} />
                <XAxis dataKey="period" tick={{ fill: chartText, fontSize: 12 }} />
                <YAxis tick={{ fill: chartText, fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  labelFormatter={(label) => `Período: ${label}`}
                  formatter={(value) => [value, "Designs"]}
                  contentStyle={{ borderRadius: 12, borderColor: "hsl(var(--border))" }}
                />
                <ReferenceLine
                  y={annualAverage}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  label={{ position: "right", value: "Média anual", fill: chartText, fontSize: 11 }}
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

      {activeTab === "members" && (
      <Card className="rounded-xl shadow-sm border-border/40">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle className="text-xl font-medium">Ranking de criadores</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Ranking priorizado para comunicados de reconhecimento (marketing central excluído). Use a categoria e as métricas dos CSVs importados para filtrar.
            </CardDescription>
            <p className="text-xs text-muted-foreground mt-1">
              Mostrando {rankedCreators.length} de {rankLimit} posições com os filtros atuais.
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
              <Label className="text-xs text-muted-foreground">Categoria</Label>
              <Select value={creatorCategory} onValueChange={(value) => setCreatorCategory(value)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {creatorCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Ordenar por</Label>
              <Select value={creatorSort} onValueChange={(value: CreatorMetric) => setCreatorSort(value)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Métrica" />
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
              Ver usuários
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {rankedCreators.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum criador encontrado no período selecionado.
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
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>Cluster: {schoolInfo.cluster}</span>
                          {creator.role && (
                            <Badge variant="outline" className="border-primary/30 bg-primary/5 text-[11px] font-semibold">
                              {creator.role}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 w-full md:w-auto md:items-end">
                      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4 md:w-[440px]">
                        <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-right">
                          <p className="text-[11px] uppercase text-muted-foreground">Criados</p>
                          <p className="font-semibold text-foreground">{Number(creator.designs ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-right">
                          <p className="text-[11px] uppercase text-muted-foreground">Publicados</p>
                          <p className="font-semibold text-foreground">{Number(creator.published ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-right">
                          <p className="text-[11px] uppercase text-muted-foreground">Links</p>
                          <p className="font-semibold text-foreground">{Number(creator.shared ?? 0).toLocaleString()}</p>
                        </div>
                        <div className="rounded-lg border border-border/60 bg-muted/40 px-3 py-2 text-right">
                          <p className="text-[11px] uppercase text-muted-foreground">Visualizacoes</p>
                          <p className="font-semibold text-foreground">{Number(creator.viewed ?? 0).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 md:justify-end">
                        <Button size="sm" variant="ghost" className="whitespace-nowrap" onClick={() => handleCopyEmail(creator.email)}>
                          Copiar e-mail
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
                          <div className="font-medium text-muted-foreground">Sem criador disponível</div>
                          <div className="text-sm text-muted-foreground">
                            Ajuste filtros ou período para preencher esta posição.
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
      )}

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
          <CardTitle className="text-xl font-medium">Distribuição por cluster</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Entenda onde o engajamento está concentrado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clusterBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma escola disponível para os filtros escolhidos.
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
      )}
    </div>
  );
};

export default CanvaUsageDashboard;
