import { useMemo, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend,
  BarChart,
  Bar,
  LabelList,
  AreaChart,
  Area,
} from "recharts";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { CalendarRange, Check, ChevronRight, PenSquare, UploadCloud, TrendingUp, Trash2 } from "lucide-react";
import {
  loadYearlyDataset,
  computeYearlyAnalytics,
  listYears,
  listClusters,
  listSchools,
  CanvaYearlyRecord,
  ImportHistoryEntry,
  YearlyFilters,
  extractCsvHeaders,
  suggestMapping,
  importYearlyCsv,
  deleteImportEntry,
} from "@/lib/canvaYearlyRepository";
import { useSchoolLicenseStore } from "@/stores/schoolLicenseStore";
import { readFileAsUtf8 } from "@/lib/fileUtils";
import { toast } from "@/components/ui/sonner";

const numberFormat = new Intl.NumberFormat("pt-BR");
const percent = (value: number) =>
  `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;

const chartColors = {
  primary: "hsl(var(--primary))",
  muted: "hsl(var(--muted-foreground))",
  accent: "hsl(var(--secondary))",
};
const lineColors = {
  createdBase: "hsl(var(--primary))",
  sharedBase: "#0ea5e9", // azul para diferenciar de created
  publishedBase: "#10b981", // verde
  createdComparison: "#94a3b8",
  sharedComparison: "#c084fc",
  publishedComparison: "#f97316",
};
const showLegacyCharts = false;
const monthLabels = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const periodRangeFromFilter = (period: YearlyFilters["period"]) => {
  if (period.type === "h1") return { startMonth: 1, endMonth: 6 };
  if (period.type === "h2") return { startMonth: 7, endMonth: 12 };
  if (period.type === "custom") return { startMonth: period.startMonth, endMonth: period.endMonth };
  return { startMonth: 1, endMonth: 12 };
};

const isWithinRange = (month: number | null, range: { startMonth: number; endMonth: number }) => {
  if (month === null) return range.startMonth === 1 && range.endMonth === 12;
  return month >= range.startMonth && month <= range.endMonth;
};

const allowedTypesForView = (view: YearlyFilters["view"]) => {
  if (view === "models") return new Set<CanvaYearlyRecord["dataType"]>(["models", "general"]);
  if (view === "creators") return new Set<CanvaYearlyRecord["dataType"]>(["creators", "general"]);
  return new Set<CanvaYearlyRecord["dataType"]>(["models", "creators", "general"]);
};

const normalizeValue = (value?: string | null) =>
  (value ?? "")
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

// Remove contas da comunicação central dos rankings de criadores
const shouldHideCreatorFromRanking = (name?: string | null) => {
  if (!name) return false;
  const normalized = name.toString().toLowerCase();
  return normalized.includes("maple bear") && normalized.includes("comunic");
};

const formatDeltaLabel = (delta: number | null, comparisonYear?: number | null) => {
  if (delta === null || comparisonYear === null || comparisonYear === undefined) return "Sem comparacao";
  if (!Number.isFinite(delta)) return "Sem base anterior";
  return `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}% vs ${comparisonYear}`;
};

const CanvaYearlyComparison = () => {
  const [dataset, setDataset] = useState(loadYearlyDataset());
  const [filters, setFilters] = useState<YearlyFilters | null>(null);
  const [view, setView] = useState<YearlyFilters["view"]>("models");
  const navigate = useNavigate();
  const location = useLocation();
  const [creatorRankLimit, setCreatorRankLimit] = useState<number | "all">(3); // Top 3 por padrÃ£o
  const [creatorCardLimit, setCreatorCardLimit] = useState<number | "all">(5);
  const [creatorView, setCreatorView] = useState<"list" | "chart">("list");
  const [creatorSort, setCreatorSort] = useState<"value" | "delta">("value");
  const [creatorDeltaFilter, setCreatorDeltaFilter] = useState<"all" | "positive" | "negative">("all");
  const [sharedLimit, setSharedLimit] = useState<number | "all">(5);
  const [sharedSearch, setSharedSearch] = useState("");
  const [sharedView, setSharedView] = useState<"list" | "chart">("list");
  const schools = useSchoolLicenseStore((state) => state.schools);
  const [importOpen, setImportOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<ImportHistoryEntry | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [importDataType, setImportDataType] = useState<CanvaYearlyRecord["dataType"]>("models");
  const [customStartDateFilter, setCustomStartDateFilter] = useState<string>("");
  const [customEndDateFilter, setCustomEndDateFilter] = useState<string>("");
  const [importStartDate, setImportStartDate] = useState<string>("");
  const [importEndDate, setImportEndDate] = useState<string>("");
  const [lastDaysPreset, setLastDaysPreset] = useState<7 | 14 | 30 | null>(null);
  const [periodDialogOpen, setPeriodDialogOpen] = useState(false);

  // Recarrega dados se outro upload atualizar o armazenamento local
  useEffect(() => {
    if (typeof window === "undefined") return;
    const refresh = () => {
      const data = loadYearlyDataset();
      setDataset(data);
      const years = listYears(data.records);
      setFilters((prev) => {
        const baseYear = prev?.baseYear && years.includes(prev.baseYear) ? prev.baseYear : years[0];
        const comparisonYear =
          prev?.comparisonYear && years.includes(prev.comparisonYear)
            ? prev.comparisonYear
            : years[1] ?? null;
        return prev
          ? { ...prev, baseYear, comparisonYear }
          : {
              baseYear,
              comparisonYear,
              period: { type: "year" as const },
              view: "models" as const,
            };
      });
    };

    window.addEventListener("canva-yearly-data-updated", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("canva-yearly-data-updated", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    const data = loadYearlyDataset();
    setDataset(data);

    const years = listYears(data.records);
    const baseYear = years[0];
    setFilters({
      baseYear,
      comparisonYear: null,
      period: { type: "year" },
      view: "models",
    });
  }, []);

  useEffect(() => {
    if (!filters) return;
    const baseYear = filters.baseYear;
    setImportStartDate(`${baseYear}-01-01`);
    setImportEndDate(`${baseYear}-12-31`);
    setCustomStartDateFilter(`${baseYear}-01-01`);
    setCustomEndDateFilter(`${baseYear}-12-31`);
    setLastDaysPreset(null);
  }, [filters?.baseYear]);

  // Garante que os filtros estejam sempre em anos existentes apos um novo upload
  useEffect(() => {
    const years = listYears(dataset.records);
    if (!years.length) return;
    setFilters((prev) => {
      if (!prev) return prev;
      const baseYear = years.includes(prev.baseYear) ? prev.baseYear : years[0];
      const comparisonYear =
        prev.comparisonYear && years.includes(prev.comparisonYear) ? prev.comparisonYear : null;
      return { ...prev, baseYear, comparisonYear };
    });
  }, [dataset.records]);

  const activeHistory = useMemo(
    () => dataset.history.filter((h) => !h.deletedAt),
    [dataset.history]
  );

  const uploadTimelineStacked = useMemo(() => {
    if (activeHistory.length === 0) return [];

    const bucketByDay = new Map<
      number,
      {
        timestamp: number;
        label: string;
        models: number;
        creators: number;
        general: number;
        total: number;
      }
    >();

    activeHistory.forEach((entry) => {
      const uploadedAt = new Date(entry.uploadedAt);
      const day = new Date(uploadedAt.getFullYear(), uploadedAt.getMonth(), uploadedAt.getDate());
      const key = day.getTime();

      const current =
        bucketByDay.get(key) ?? {
          timestamp: key,
          label: day.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }),
          models: 0,
          creators: 0,
          general: 0,
          total: 0,
        };

      const rows = entry.rows ?? 0;
      if (entry.dataType === "models") current.models += rows;
      else if (entry.dataType === "creators") current.creators += rows;
      else current.general += rows;
      current.total += rows;

      bucketByDay.set(key, current);
    });

    return Array.from(bucketByDay.values()).sort((a, b) => a.timestamp - b.timestamp);
  }, [activeHistory]);

  const formatDisplayDate = (value: string) => {
    if (!value) return "";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Gera data no formato yyyy-MM-dd sem risco de mudar o dia pelo fuso (evita toISOString).
  const toInputDate = (date?: Date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseInputDate = (value: string) => {
    if (!value) return undefined;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? undefined : parsed;
  };

  const customRange = useMemo<DateRange | undefined>(() => {
    const fromDate = parseInputDate(customStartDateFilter);
    const toDate = parseInputDate(customEndDateFilter);
    if (!fromDate && !toDate) return undefined;
    return { from: fromDate, to: toDate };
  }, [customStartDateFilter, customEndDateFilter]);

  const enrichedRecords: CanvaYearlyRecord[] = useMemo(() => {
    if (!schools?.length) return dataset.records;

    const emailToSchool = new Map<
      string,
      { schoolName: string; schoolId: string; cluster?: string }
    >();

    schools.forEach((school) => {
      school.users.forEach((user) => {
        const email = (user.email || "").toLowerCase();
        if (email && !emailToSchool.has(email)) {
          emailToSchool.set(email, {
            schoolName: school.name,
            schoolId: school.id,
            cluster: school.cluster,
          });
        }
      });
    });

    return dataset.records.map((record) => {
      if (record.schoolName && record.schoolId) return record;

      const email = (record.creatorEmail || "").toLowerCase();
      const match = emailToSchool.get(email);
      if (!match) return record;

      return {
        ...record,
        schoolName: record.schoolName ?? match.schoolName,
        schoolId: record.schoolId ?? match.schoolId,
        cluster: record.cluster ?? match.cluster,
      };
    });
  }, [dataset.records, schools]);

  const analytics = useMemo(
    () =>
      filters
        ? computeYearlyAnalytics(enrichedRecords, { ...filters, view })
        : null,
    [enrichedRecords, filters, view]
  );

  const creatorAnalytics = useMemo(
    () =>
      filters
        ? computeYearlyAnalytics(enrichedRecords, { ...filters, view: "creators" })
        : null,
    [enrichedRecords, filters]
  );

  const viewToPath = (v: YearlyFilters["view"]) => {
    if (v === "creators") return "/dashboard/canva/criadores";
    if (v === "schools") return "/dashboard/canva/usos/escolas";
    return "/dashboard/canva/modelos";
  };

  const pathToView = (path: string): YearlyFilters["view"] => {
    if (path.includes("/canva/criadores")) return "creators";
    if (path.includes("/canva/usos/escolas")) return "schools";
    if (path.includes("/canva/modelos")) return "models";
    if (path.includes("/canva/usos")) return "models";
    return view;
  };

  useEffect(() => {
    const resolved = pathToView(location.pathname);
    if (resolved !== view) {
      setView(resolved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handleViewChange = (v: YearlyFilters["view"]) => {
    setView(v);
    const target = viewToPath(v);
    if (location.pathname !== target) {
      navigate(target, { replace: true });
    }
  };

  const availableYears = useMemo(
    () => listYears(enrichedRecords),
    [enrichedRecords]
  );
  const clusterOptions = useMemo(
    () => listClusters(enrichedRecords),
    [enrichedRecords]
  );
  const schoolOptions = useMemo(
    () => listSchools(enrichedRecords),
    [enrichedRecords]
  );

  const creatorSchoolLookup = useMemo(() => {
    const map = new Map<string, { schoolName?: string; cluster?: string }>();

    enrichedRecords.forEach((record) => {
      const email = record.creatorEmail?.toLowerCase();
      if (!email) return;
      const current = map.get(email) ?? {};
      if (!current.schoolName && record.schoolName) current.schoolName = record.schoolName;
      if (!current.cluster && record.cluster) current.cluster = record.cluster;
      map.set(email, current);
    });

    schools.forEach((school) => {
      school.users?.forEach((user) => {
        const email = user.email?.toLowerCase();
        if (!email) return;
        const current = map.get(email) ?? {};
        if (!current.schoolName && school.name) current.schoolName = school.name;
        if (!current.cluster && school.cluster) current.cluster = school.cluster;
        map.set(email, current);
      });
    });

    return map;
  }, [enrichedRecords, schools]);

  const hasComparison = !!filters?.comparisonYear;

  const summaryCards = useMemo(() => {
    const source = view === "creators" ? creatorAnalytics : analytics;
    if (!source) return [];
    return [
      {
        key: "created",
        title: "Designs criados",
        value: source.baseTotals.created,
        prev: source.comparisonTotals.created,
      },
      {
        key: "published",
        title: "Publicados",
        value: source.baseTotals.published,
        prev: source.comparisonTotals.published,
      },
      {
        key: "shared",
        title: "Compartilhados",
        value: source.baseTotals.shared,
        prev: source.comparisonTotals.shared,
      },
      {
        key: "engagement",
        title: "Engajamento m?dio",
        value: source.baseTotals.engagement,
        prev: source.comparisonTotals.engagement,
        isRatio: true,
      },
    ] as const;
  }, [analytics, creatorAnalytics, view]);

  const schoolSeries = useMemo(() => analytics?.monthlySeries ?? [], [analytics]);

  // Lista completa de criadores
  const topCreatorsFull = useMemo(
    () =>
      creatorAnalytics
        ? ((creatorAnalytics as any).topCreators ?? [])
            .map((c: any) => {
              const email = (c.email || c.creatorEmail || "").toLowerCase();
              const schoolInfo = email ? creatorSchoolLookup.get(email) : undefined;
              return {
                name: c.name ?? c.creatorName ?? c.email,
                value: c.base ?? c.value,
                delta: c.deltaPct,
                email: c.email ?? c.creatorEmail,
                schoolName: c.schoolName ?? schoolInfo?.schoolName,
                cluster: c.cluster ?? schoolInfo?.cluster,
              };
            })
            .filter((creator: any) => !shouldHideCreatorFromRanking(creator.name))
        : [],
    [creatorAnalytics, creatorSchoolLookup]
  );

  const creatorHighlights = useMemo(() => {
    if (!creatorAnalytics) return null;
    const totalCreators = topCreatorsFull.length;
    const activeCreators = topCreatorsFull.filter((c) => (c.value ?? 0) > 0).length;
    const totalDesigns = creatorAnalytics.baseTotals.created;
    const avgDesigns = totalCreators ? totalDesigns / totalCreators : 0;
    const shareRate =
      creatorAnalytics.baseTotals.published > 0
        ? (creatorAnalytics.baseTotals.shared / creatorAnalytics.baseTotals.published) * 100
        : 0;
    return { totalCreators, activeCreators, totalDesigns, avgDesigns, shareRate };
  }, [creatorAnalytics, topCreatorsFull]);

  // Lista cortada pelo limite escolhido (3, 5, 10, 15 ou todos)
  const topCreatorsChart = useMemo(
    () => {
      const limit = creatorRankLimit === "all" ? topCreatorsFull.length : creatorRankLimit;
      return topCreatorsFull.slice(0, limit);
    },
    [topCreatorsFull, creatorRankLimit]
  );

  const handleYearChange = (
    key: "baseYear" | "comparisonYear",
    value: string
  ) =>
    setFilters((prev) =>
      prev ? { ...prev, [key]: Number(value) || null } : prev
    );

  const yAxisFormatter = (value: number) => numberFormat.format(value);

  const filteredRecords = useMemo(() => {
    if (!filters) return [];
    const allowed = allowedTypesForView(view);
    const range = periodRangeFromFilter(filters.period);
    return enrichedRecords.filter((record) => {
      if (record.year !== filters.baseYear) return false;
      if (!allowed.has(record.dataType)) return false;
      if (filters.cluster && normalizeValue(record.cluster ?? "Sem cluster") !== normalizeValue(filters.cluster)) return false;
      if (filters.school && normalizeValue(record.schoolName ?? "Sem escola") !== normalizeValue(filters.school)) return false;
      return isWithinRange(record.month, range);
    });
  }, [enrichedRecords, filters, view]);

  const comparisonFilteredRecords = useMemo(() => {
    if (!filters?.comparisonYear) return [];
    const allowed = allowedTypesForView(view);
    const range = periodRangeFromFilter(filters.period);
    return enrichedRecords.filter((record) => {
      if (record.year !== filters.comparisonYear) return false;
      if (!allowed.has(record.dataType)) return false;
      if (filters.cluster && normalizeValue(record.cluster ?? "Sem cluster") !== normalizeValue(filters.cluster)) return false;
      if (filters.school && normalizeValue(record.schoolName ?? "Sem escola") !== normalizeValue(filters.school)) return false;
      return isWithinRange(record.month, range);
    });
  }, [enrichedRecords, filters, view]);

  const hasComparisonYear = typeof filters?.comparisonYear === "number";
  const baseYearLabel = filters?.baseYear?.toString() ?? "Ano base";
  const comparisonYearLabel = hasComparisonYear ? filters!.comparisonYear!.toString() : "";

  const schoolLineSeries = useMemo(() => {
    if (!filters) return [];
    const periodRange = periodRangeFromFilter(filters.period);
    const monthsFromAnalytics =
      analytics?.monthlySeries?.map((item) => ({
        month: item.month,
        label: item.label,
        createdBase: item.base,
        createdComparison: item.comparison,
      })) ?? [];

    const baseMap = new Map<number, { created: number; shared: number; published: number }>();
    filteredRecords.forEach((record) => {
      const monthKey = record.month ?? periodRange.startMonth;
      const current = baseMap.get(monthKey) ?? { created: 0, shared: 0, published: 0 };
      current.created += record.designsCreated ?? 0;
      current.shared += record.designsShared ?? 0;
      current.published += record.designsPublished ?? 0;
      baseMap.set(monthKey, current);
    });

    const compMap = new Map<number, { created: number; shared: number; published: number }>();
    comparisonFilteredRecords.forEach((record) => {
      const monthKey = record.month ?? periodRange.startMonth;
      const current = compMap.get(monthKey) ?? { created: 0, shared: 0, published: 0 };
      current.created += record.designsCreated ?? 0;
      current.shared += record.designsShared ?? 0;
      current.published += record.designsPublished ?? 0;
      compMap.set(monthKey, current);
    });

    const monthsSet = new Set<number>();
    monthsFromAnalytics.forEach((m) => monthsSet.add(m.month));
    baseMap.forEach((_, month) => monthsSet.add(month));
    compMap.forEach((_, month) => monthsSet.add(month));

    const monthEntries = Array.from(monthsSet)
      .sort((a, b) => a - b)
      .map((month) => {
        const analyticsMonth = monthsFromAnalytics.find((m) => m.month === month);
        return {
          month,
          label: analyticsMonth?.label ?? monthLabels[month - 1] ?? String(month),
          createdBase: analyticsMonth?.createdBase ?? baseMap.get(month)?.created ?? 0,
          createdComparison: compMap.get(month)?.created ?? analyticsMonth?.createdComparison ?? 0,
        };
      });

    return monthEntries.map(({ month, label, createdBase, createdComparison }) => ({
      month,
      label,
      createdBase,
      sharedBase: baseMap.get(month)?.shared ?? 0,
      publishedBase: baseMap.get(month)?.published ?? 0,
      createdComparison,
      sharedComparison: compMap.get(month)?.shared ?? 0,
      publishedComparison: compMap.get(month)?.published ?? 0,
    }));
  }, [filters, analytics, filteredRecords, comparisonFilteredRecords]);

  const baseAllRecords = useMemo(() => {
    if (!filters) return [];
    const range = periodRangeFromFilter(filters.period);
    return enrichedRecords.filter(
      (record) =>
        record.year === filters.baseYear &&
        isWithinRange(record.month, range)
    );
  }, [enrichedRecords, filters]);

  const historyByMonth = useMemo(() => {
    const map = new Map<
      number,
      Map<number, { models: number; creators: number; general: number; total: number }>
    >();

    dataset.history
      .filter((entry) => !entry.deletedAt)
      .forEach((entry) => {
        const yearMap = map.get(entry.year) ?? new Map();
        const start = entry.startMonth ?? 1;
        const end = entry.endMonth ?? start ?? 12;
        for (let month = start; month <= end; month++) {
          const current =
            yearMap.get(month) ?? { models: 0, creators: 0, general: 0, total: 0 };
          if (entry.dataType === "models") current.models += entry.rows;
          else if (entry.dataType === "creators") current.creators += entry.rows;
          else current.general += entry.rows;
          current.total += entry.rows;
          yearMap.set(month, current);
        }
        map.set(entry.year, yearMap);
      });

    return map;
  }, [dataset.history]);

  const designsPerMonthData = useMemo(() => {
    if (!filters) return [];
    const range = periodRangeFromFilter(filters.period);
    const allowedHistory = allowedTypesForView(view);

    const baseByMonth = new Map<number, number>();
    filteredRecords.forEach((record) => {
      if (!record.month) return;
      baseByMonth.set(
        record.month,
        (baseByMonth.get(record.month) ?? 0) + (record.designsCreated ?? 0)
      );
    });

    const comparisonByMonth = new Map<number, number>();
    comparisonFilteredRecords.forEach((record) => {
      if (!record.month) return;
      comparisonByMonth.set(
        record.month,
        (comparisonByMonth.get(record.month) ?? 0) + (record.designsCreated ?? 0)
      );
    });

    const selectHistoryValue = (
      entry?: { models: number; creators: number; general: number; total: number }
    ) => {
      if (!entry) return 0;
      let total = 0;
      if (allowedHistory.has("models")) total += entry.models;
      if (allowedHistory.has("creators")) total += entry.creators;
      if (allowedHistory.has("general")) total += entry.general;
      return total || entry.total;
    };

    return monthLabels
      .map((label, idx) => {
        const month = idx + 1;
        if (!isWithinRange(month, range)) return null;

        const baseFromRecords = baseByMonth.get(month) ?? 0;
        const comparisonFromRecords = comparisonByMonth.get(month) ?? 0;
        const baseHistory = historyByMonth.get(filters.baseYear)?.get(month);
        const comparisonHistory = filters.comparisonYear
          ? historyByMonth.get(filters.comparisonYear)?.get(month)
          : undefined;

        const base = baseFromRecords > 0 ? baseFromRecords : selectHistoryValue(baseHistory);
        const comparison =
          comparisonFromRecords > 0
            ? comparisonFromRecords
            : selectHistoryValue(comparisonHistory);

        return { label, base, comparison };
      })
      .filter(Boolean) as Array<{ label: string; base: number; comparison: number }>;
  }, [filteredRecords, comparisonFilteredRecords, filters, historyByMonth, view]);

  const topSchoolsAll = useMemo(() => {
    const map = new Map<string, { name: string; value: number }>();
    baseAllRecords.forEach((record) => {
      const key = record.schoolName || "Sem escola";
      const current = map.get(key) ?? { name: key, value: 0 };
      current.value += record.designsCreated ?? 0;
      map.set(key, current);
    });
    return Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [baseAllRecords]);

  const topModelsAll = useMemo(() => {
    const map = new Map<string, { name: string; value: number }>();
    baseAllRecords
      .filter((r) => r.dataType === "models")
      .forEach((record) => {
        const key = record.templateName || "Modelo sem nome";
        const current = map.get(key) ?? { name: key, value: 0 };
        current.value += record.designsCreated ?? 0;
        map.set(key, current);
      });
    return Array.from(map.values()).sort((a, b) => b.value - a.value).slice(0, 10);
  }, [baseAllRecords]);

  const topSchoolsChart = useMemo(() => topSchoolsAll, [topSchoolsAll]);
  const topModelsChart = useMemo(() => topModelsAll, [topModelsAll]);

  const monthlyImportCounts = useMemo(() => {
    if (!filters) return [];
    const range = periodRangeFromFilter(filters.period);
    const baseHistory = historyByMonth.get(filters.baseYear) ?? new Map();

    return monthLabels
      .map((label, idx) => {
        const month = idx + 1;
        if (!isWithinRange(month, range)) return null;
        const entry = baseHistory.get(month) ?? { models: 0, creators: 0, general: 0, total: 0 };
        return { label, ...entry };
      })
      .filter(Boolean) as Array<{
      label: string;
      models: number;
      creators: number;
      general: number;
      total: number;
    }>;
  }, [filters, historyByMonth]);

  const topSharedTemplates = useMemo(() => {
    if (!baseAllRecords.length) return [];
    const allowed = new Set<CanvaYearlyRecord["dataType"]>(["models", "general"]);
    const map = new Map<string, { name: string; shared: number }>();

    baseAllRecords
      .filter((record) => allowed.has(record.dataType))
      .forEach((record) => {
        const key = record.templateName || record.templateId || "Modelo sem nome";
        const current = map.get(key) ?? { name: key, shared: 0 };
        current.shared += record.designsShared ?? 0;
        map.set(key, current);
      });

    const query = sharedSearch.trim().toLowerCase();
    return Array.from(map.values())
      .filter((item) => item.shared > 0)
      .filter((item) => (query ? item.name.toLowerCase().includes(query) : true))
      .sort((a, b) => b.shared - a.shared)
      .slice(0, sharedLimit === "all" ? map.size : sharedLimit);
  }, [baseAllRecords, sharedLimit, sharedSearch, view]);

  const topCreatorsCards = useMemo(() => {
    let items = [...topCreatorsFull];

    if (creatorDeltaFilter === "positive") {
      items = items.filter((c) => (c.delta ?? 0) > 0);
    } else if (creatorDeltaFilter === "negative") {
      items = items.filter((c) => (c.delta ?? 0) < 0);
    }

    items.sort((a, b) => {
      const aKey = creatorSort === "value" ? a.value ?? 0 : a.delta ?? -Infinity;
      const bKey = creatorSort === "value" ? b.value ?? 0 : b.delta ?? -Infinity;
      return bKey - aKey;
    });

    const limit = creatorCardLimit === "all" ? items.length : creatorCardLimit;
    return items.slice(0, limit);
  }, [creatorCardLimit, creatorDeltaFilter, creatorSort, topCreatorsFull]);

  const topCreatorsInsight = useMemo(() => {
    const totalDesigns = topCreatorsCards.reduce((sum, creator) => sum + (creator.value ?? 0), 0);
    const deltas = topCreatorsCards
      .map((creator) => creator.delta)
      .filter((delta): delta is number => typeof delta === "number" && Number.isFinite(delta));
    const avgDelta = deltas.length
      ? deltas.reduce((sum, delta) => sum + delta, 0) / deltas.length
      : null;
    const participation = creatorAnalytics?.baseTotals.created
      ? (totalDesigns / creatorAnalytics.baseTotals.created) * 100
      : 0;

    return { totalDesigns, avgDelta, participation };
  }, [creatorAnalytics?.baseTotals.created, topCreatorsCards]);

  const usageComparison = useMemo(() => {
    if (!analytics) return null;
    const { baseTotals, comparisonTotals } = analytics;
    const calcDelta = (base: number, prev: number | null) => {
      if (!prev) return null;
      if (prev === 0) return base > 0 ? Infinity : 0;
      return ((base - prev) / prev) * 100;
    };
    return {
      createdDelta: calcDelta(baseTotals.created, comparisonTotals.created),
      publishedDelta: calcDelta(baseTotals.published, comparisonTotals.published),
      sharedDelta: calcDelta(baseTotals.shared, comparisonTotals.shared),
      comparisonYear: filters?.comparisonYear,
    };
  }, [analytics, filters?.comparisonYear]);

  const sharedTotals = useMemo(() => {
    const allowed = new Set<CanvaYearlyRecord["dataType"]>(["models", "general"]);
    const filtered = baseAllRecords.filter((record) => allowed.has(record.dataType));
    const totalShared = filtered.reduce((sum, record) => sum + (record.designsShared ?? 0), 0);
    const topSharedTotal = topSharedTemplates.reduce((sum, template) => sum + template.shared, 0);
    return { totalShared, topSharedTotal };
  }, [baseAllRecords, topSharedTemplates]);

  const sharedChartData = useMemo(() => {
    const total = sharedTotals.totalShared || 1;
    return topSharedTemplates.map((item) => ({
      name: item.name,
      shared: item.shared,
      pct: (item.shared / total) * 100,
    }));
  }, [sharedTotals.totalShared, topSharedTemplates]);

  const isCreatorAll = creatorCardLimit === "all";
  const isSharedAll = sharedLimit === "all";
  const creatorsChartHeight = Math.max(320, Math.min(900, (topCreatorsCards.length || 1) * 42));
  const sharedChartHeight = Math.max(320, Math.min(900, (sharedChartData.length || 1) * 42));

  const appliedFiltersSummary = useMemo(() => {
    if (!filters) return null;
    const range = periodRangeFromFilter(filters.period);
    const customDatesLabel =
      filters.period.type === "custom" && customStartDateFilter && customEndDateFilter
        ? `${formatDisplayDate(customStartDateFilter)} a ${formatDisplayDate(customEndDateFilter)}`
        : null;
    return {
      periodLabel:
        filters.period.type === "year"
          ? "Ano completo"
          : filters.period.type === "custom"
          ? customDatesLabel ?? `Meses ${range.startMonth} a ${range.endMonth}`
          : filters.period.type.toUpperCase(),
      monthsLabel: customDatesLabel ?? `${range.startMonth} a ${range.endMonth}`,
      cluster: filters.cluster ?? "Todos",
      school: filters.school ?? "Todas",
      comparison: filters.comparisonYear ?? "Sem comparacao",
      view:
        view === "models"
          ? "Modelos"
          : view === "creators"
          ? "Criadores"
          : "Escolas",
    };
  }, [filters, view, customStartDateFilter, customEndDateFilter]);

  const applyCustomDatePeriod = (start: string, end: string) => {
    if (!filters) return false;
    if (!start || !end) return false;
    const startDate = new Date(start);
    const endDate = new Date(end);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return false;
    if (startDate > endDate) {
      toast.error("Data inicial maior que a final.");
      return false;
    }
    if (
      startDate.getFullYear() !== filters.baseYear ||
      endDate.getFullYear() !== filters.baseYear
    ) {
      return false;
    }
    const startMonth = startDate.getMonth() + 1;
    const endMonth = endDate.getMonth() + 1;
    setLastDaysPreset(null);
    setFilters((prev) =>
      prev
        ? {
            ...prev,
            period: {
              type: "custom",
              startMonth,
              endMonth,
            },
          }
        : prev
    );
    return true;
  };

  const setPeriodPreset = (type: "year" | "h1" | "h2") => {
    setFilters((prev) => (prev ? { ...prev, period: { type } } : prev));
    setLastDaysPreset(null);

    const baseYear = filters?.baseYear;
    if (!baseYear) return;
    if (type === "year") {
      setCustomStartDateFilter(`${baseYear}-01-01`);
      setCustomEndDateFilter(`${baseYear}-12-31`);
      return;
    }
    if (type === "h1") {
      setCustomStartDateFilter(`${baseYear}-01-01`);
      setCustomEndDateFilter(`${baseYear}-06-30`);
      return;
    }
    if (type === "h2") {
      setCustomStartDateFilter(`${baseYear}-07-01`);
      setCustomEndDateFilter(`${baseYear}-12-31`);
    }
  };

  const setPeriodLastDays = (days: 7 | 14 | 30) => {
    if (!filters) return;
    const baseYear = filters.baseYear;
    const today = new Date();
    const end =
      today.getFullYear() === baseYear
        ? new Date(`${baseYear}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}T00:00:00`)
        : new Date(`${baseYear}-12-31T00:00:00`);
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    if (start.getFullYear() !== baseYear) {
      start.setFullYear(baseYear, 0, 1);
    }
    const startStr = toInputDate(start);
    const endStr = toInputDate(end);
    setCustomStartDateFilter(startStr);
    setCustomEndDateFilter(endStr);
    applyCustomDatePeriod(startStr, endStr);
    setLastDaysPreset(days);
  };

  const handleCustomRangeSelect = (range?: DateRange) => {
    const start = range?.from ? toInputDate(range.from) : "";
    const end = range?.to ? toInputDate(range.to) : "";
    setLastDaysPreset(null);
    setCustomStartDateFilter(start);
    setCustomEndDateFilter(end);
    if (start && end) {
      applyCustomDatePeriod(start, end);
    }
  };

  const handleResetPeriod = () => {
    if (!filters) return;
    setPeriodPreset("year");
  };

  const handlePresetClick = (preset: "year" | "h1" | "h2") => {
    setPeriodPreset(preset);
    setPeriodDialogOpen(false);
  };

  const handleLastDaysClick = (days: 7 | 14 | 30) => {
    setPeriodLastDays(days);
    setPeriodDialogOpen(false);
  };

  const applyAndCloseCustomRange = () => {
    if (!customStartDateFilter || !customEndDateFilter) {
      toast.error("Informe data inicial e final.");
      return;
    }
    const success = applyCustomDatePeriod(customStartDateFilter, customEndDateFilter);
    if (success) setPeriodDialogOpen(false);
  };

  const setImportPresetDays = (days: number) => {
    if (!filters) return;
    const baseYear = filters.baseYear;
    const today = new Date();
    const end = new Date(
      today.getFullYear() === baseYear
        ? today
        : new Date(`${baseYear}-12-31T00:00:00`)
    );
    end.setHours(0, 0, 0, 0);
    const start = new Date(end);
    start.setDate(start.getDate() - (days - 1));
    if (start.getFullYear() !== baseYear) {
      start.setFullYear(baseYear, 0, 1);
    }
    setImportStartDate(toInputDate(start));
    setImportEndDate(toInputDate(end));
  };

  const handleImport = async () => {
    if (!filters) {
      toast.error("Defina um ano base antes de importar.");
      return;
    }
    if (!selectedFile) {
      toast.error("Selecione um arquivo CSV.");
      return;
    }
    const startDate = new Date(importStartDate);
    const endDate = new Date(importEndDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      toast.error("Informe datas validas.");
      return;
    }
    if (startDate > endDate) {
      toast.error("Data inicial maior que a final.");
      return;
    }
    if (
      startDate.getFullYear() !== filters.baseYear ||
      endDate.getFullYear() !== filters.baseYear
    ) {
      return;
    }
    setUploading(true);
    try {
      const text = await readFileAsUtf8(selectedFile);
      const headers = extractCsvHeaders(text);
      if (!headers.length) {
        toast.error("CSV vazio ou invalido.");
        return;
      }
      const mapping = suggestMapping(headers, dataset.defaultMapping);
      const startMonth = startDate.getMonth() + 1;
      const endMonth = endDate.getMonth() + 1;
      const periodRange = { startMonth, endMonth };
      const periodLabel = `${importStartDate} a ${importEndDate}`;
      await importYearlyCsv({
        csvText: text,
        fileName: selectedFile.name,
        year: filters.baseYear,
        dataType: importDataType,
        periodLabel,
        periodRange,
        replaceExisting: true,
        columnMapping: mapping,
        saveMappingAsDefault: true,
      });
      setDataset(loadYearlyDataset());
      toast.success("Importacao concluida.");
      setImportOpen(false);
      setSelectedFile(null);
      setImportStartDate(`${filters.baseYear}-01-01`);
      setImportEndDate(`${filters.baseYear}-12-31`);
    } catch (err) {
      console.error(err);
      toast.error("Falha ao importar CSV.");
    } finally {
      setUploading(false);
    }
  };

  const openDeleteDialog = (entry: ImportHistoryEntry) => {
    setEntryToDelete(entry);
    setDeleteReason("");
  };

  const closeDeleteDialog = () => {
    setEntryToDelete(null);
    setDeleteReason("");
  };

  const confirmDeleteHistoryEntry = () => {
    if (!entryToDelete) return;
    setDeleting(true);
    try {
      const reason = deleteReason.trim() || "Exclusao manual pelo usuario";
      const { removed } = deleteImportEntry(entryToDelete.id, reason);
      setDataset(loadYearlyDataset());
      toast.success(
        removed > 0
          ? `Upload removido e ${removed} linha(s) de metricas excluidas.`
          : "Upload removido do historico."
      );
      closeDeleteDialog();
    } catch (error) {
      console.error(error);
      toast.error("Falha ao excluir o upload.");
    } finally {
      setDeleting(false);
    }
  };

  if (!filters) return null;

  const baseYearStart = new Date(`${filters.baseYear}-01-01T00:00:00`);
  const baseYearEnd = new Date(`${filters.baseYear}-12-31T00:00:00`);

  const currentPeriodRange = periodRangeFromFilter(filters.period);
  const periodLabelText =
    filters.period.type === "year"
      ? "Ano completo"
      : filters.period.type === "h1"
      ? "1o semestre (jan-jun)"
      : filters.period.type === "h2"
      ? "2o semestre (jul-dez)"
      : customStartDateFilter && customEndDateFilter
      ? `${formatDisplayDate(customStartDateFilter)} a ${formatDisplayDate(customEndDateFilter)}`
      : `Meses ${currentPeriodRange.startMonth} a ${currentPeriodRange.endMonth}`;
  const activePeriodKey =
    lastDaysPreset === 30
      ? "30d"
      : lastDaysPreset === 14
      ? "14d"
      : lastDaysPreset === 7
      ? "7d"
      : filters.period.type === "year"
      ? "year"
      : filters.period.type === "h1"
      ? "h1"
      : filters.period.type === "h2"
      ? "h2"
      : "custom";

  return (
    <div className="space-y-3 pb-16 md:pb-20">
      {/* Filtros principais + aÃ§Ãµes */}
      <Card className="border-border/50 shadow-sm">
        <CardContent className="pt-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-lg font-semibold">Controles</div>
            <div className="flex flex-wrap gap-2">
              <button
                className="inline-flex items-center rounded-full bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:brightness-95 transition"
                onClick={() => {
                  setImportDataType(view === "creators" ? "creators" : "models");
                  setImportOpen(true);
                }}
              >
                Importar CSV
              </button>
              <button
                className="inline-flex items-center rounded-full border border-border px-3 py-2 text-sm font-semibold hover:bg-muted transition"
                onClick={() => setHistoryOpen(true)}
              >
                Ver histÃ³rico
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-4">
            {/* Ano base */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Ano base</p>
              <Select
                value={filters.baseYear.toString()}
                onValueChange={(v) => handleYearChange("baseYear", v)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((y) => (
                    <SelectItem key={y} value={y.toString()}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Comparar com</p>
              <Select
                value={filters.comparisonYear?.toString() ?? "none"}
                onValueChange={(v) => handleYearChange("comparisonYear", v)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Sem comparacao" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem comparacao</SelectItem>
                  {availableYears
                    .filter((y) => y !== filters.baseYear)
                    .map((y) => (
                      <SelectItem key={y} value={y.toString()}>
                        {y}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Cluster */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Cluster</p>
              <Select
                value={filters.cluster ?? "all"}
                onValueChange={(v) =>
                  setFilters((prev) =>
                    prev ? { ...prev, cluster: v === "all" ? undefined : v } : prev
                  )
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {clusterOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Escola */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Escola</p>
              <Select
                value={filters.school ?? "all"}
                onValueChange={(v) =>
                  setFilters((prev) =>
                    prev ? { ...prev, school: v === "all" ? undefined : v } : prev
                  )
                }
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {schoolOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-3">
            <Dialog open={periodDialogOpen} onOpenChange={setPeriodDialogOpen}>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Periodo</p>
                <DialogTrigger asChild>
                  <Button className="flex h-auto w-full min-w-[240px] items-center gap-3 rounded-2xl border border-border/70 bg-white px-3 py-2 text-left shadow-sm transition hover:border-primary/50 hover:shadow-md md:w-auto">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CalendarRange className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                        Filtro ativo
                      </p>
                      <p className="text-sm font-semibold leading-tight text-foreground">
                        {periodLabelText}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Ano base {filters.baseYear}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DialogTrigger>

                <DialogContent className="w-full max-w-3xl gap-0 overflow-hidden rounded-2xl border border-border/60 p-0 shadow-2xl">
                  <div className="flex items-center justify-between border-b border-border/70 bg-white/90 px-4 py-3 backdrop-blur-sm">
                    <div>
                      <DialogTitle className="text-lg font-semibold">
                        Selecionar um intervalo de datas
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                        Ajuste o periodo para sincronizar os cards e graficos do painel.
                      </DialogDescription>
                    </div>
                    <Badge variant="outline" className="rounded-full bg-primary/5 text-primary border-primary/30">
                      Ano base {filters.baseYear}
                    </Badge>
                  </div>

                  <div className="grid md:grid-cols-[210px_1fr]">
                    <div className="border-b border-border/60 bg-gradient-to-b from-muted/50 via-white to-muted/30 md:border-b-0 md:border-r">
                      <p className="px-4 pt-3 text-[11px] font-semibold uppercase text-muted-foreground">
                        Periodos rapidos
                      </p>
                      <div className="space-y-1.5 p-3">
                        {[
                          {
                            key: "year",
                            label: "Ano completo",
                            description: "Jan a Dez",
                            action: () => handlePresetClick("year"),
                          },
                          {
                            key: "h1",
                            label: "1o semestre",
                            description: "Jan a Jun",
                            action: () => handlePresetClick("h1"),
                          },
                          {
                            key: "h2",
                            label: "2o semestre",
                            description: "Jul a Dez",
                            action: () => handlePresetClick("h2"),
                          },
                          {
                            key: "30d",
                            label: "Ultimos 30 dias",
                            description: "Janela rolante",
                            action: () => handleLastDaysClick(30),
                          },
                          {
                            key: "14d",
                            label: "Ultimos 14 dias",
                            description: "2 semanas",
                            action: () => handleLastDaysClick(14),
                          },
                          {
                            key: "7d",
                            label: "Ultimos 7 dias",
                            description: "7 dias corridos",
                            action: () => handleLastDaysClick(7),
                          },
                          {
                            key: "custom",
                            label: "Datas personalizadas",
                            description:
                              customStartDateFilter && customEndDateFilter
                                ? `${formatDisplayDate(customStartDateFilter)} a ${formatDisplayDate(customEndDateFilter)}`
                                : "Escolha no calendario",
                            action: () => {
                              const start = customStartDateFilter || `${filters.baseYear}-01-01`;
                              const end = customEndDateFilter || `${filters.baseYear}-12-31`;
                              setLastDaysPreset(null);
                              setCustomStartDateFilter(start);
                              setCustomEndDateFilter(end);
                              applyCustomDatePeriod(start, end);
                            },
                          },
                        ].map((option) => (
                          <Button
                            key={option.key}
                            variant="ghost"
                            className={`group flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                              activePeriodKey === option.key
                                ? "border-primary/30 bg-white shadow-md ring-2 ring-primary/10"
                                : "border-transparent bg-white/50 hover:border-border/60 hover:bg-white"
                            }`}
                            onClick={option.action}
                          >
                            <div className="flex items-center gap-3">
                              <span
                                className={`flex h-7 w-7 items-center justify-center rounded-full border shadow-sm transition ${
                                  activePeriodKey === option.key
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border/70 bg-white text-muted-foreground"
                                }`}
                              >
                                {activePeriodKey === option.key && <Check className="h-3 w-3" />}
                              </span>
                              <div className="flex flex-col">
                                <span className="font-medium">{option.label}</span>
                                <span className="text-xs text-muted-foreground">{option.description}</span>
                              </div>
                            </div>
                            <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3 p-4">
                      <div className="rounded-xl border border-border/60 bg-white/70 p-3 shadow-sm">
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold uppercase text-muted-foreground">Iniciar</Label>
                            <Input
                              type="date"
                              value={customStartDateFilter}
                              onChange={(e) => {
                                const value = e.target.value;
                                setCustomStartDateFilter(value);
                                setLastDaysPreset(null);
                              }}
                              className="h-10 rounded-lg border-border/60 bg-background"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[11px] font-semibold uppercase text-muted-foreground">Finalizar</Label>
                            <Input
                              type="date"
                              value={customEndDateFilter}
                              onChange={(e) => {
                                const value = e.target.value;
                                setCustomEndDateFilter(value);
                                setLastDaysPreset(null);
                              }}
                              className="h-10 rounded-lg border-border/60 bg-background"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-white/80 p-3 shadow-sm">
                        <Calendar
                          mode="range"
                          numberOfMonths={2}
                          selected={customRange}
                          onSelect={handleCustomRangeSelect}
                          fromDate={baseYearStart}
                          toDate={baseYearEnd}
                          defaultMonth={parseInputDate(customStartDateFilter) ?? baseYearStart}
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-white/80 p-3 shadow-sm">
                        <Button variant="ghost" size="sm" onClick={handleResetPeriod}>
                          Limpar
                        </Button>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => setPeriodDialogOpen(false)}>
                            Cancelar
                          </Button>
                          <Button onClick={applyAndCloseCustomRange}>Aplicar</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </div>
            </Dialog>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <Tabs value={view} onValueChange={(v) => handleViewChange(v as YearlyFilters["view"])}>
              <TabsList>
                <TabsTrigger value="models">Modelos</TabsTrigger>
                <TabsTrigger value="creators">Criadores</TabsTrigger>
                <TabsTrigger value="schools">Escolas</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="text-xs text-muted-foreground">
              Periodo: {periodLabelText}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards resumo */}
      {analytics && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => {
            const delta =
              card.prev && card.prev !== 0
                ? ((card.value - card.prev) / card.prev) * 100
                : null;
            const positive = (delta ?? 0) >= 0;

            return (
              <Card
                key={card.key}
                className="border-border/60 shadow-sm hover:shadow-md transition-shadow"
              >
                <CardContent className="p-4 space-y-2">
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-semibold">
                      {card.isRatio
                        ? `${card.value.toFixed(2)}x`
                        : numberFormat.format(card.value)}
                    </span>
                    {delta !== null && (
                      <Badge
                        variant="outline"
                        className={
                          positive
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-red-200 bg-red-50 text-red-700"
                        }
                      >
                        {percent(delta)}
                      </Badge>
                    )}
              </div>
              <p className="text-xs text-muted-foreground">
                {filters.comparisonYear ? `vs ${filters.comparisonYear}` : ""}
              </p>
            </CardContent>
          </Card>
        );
      })}
        </div>
      )}

      {view === "creators" && (
      <div className="space-y-6 pb-8">
          {creatorHighlights && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Criadores importados</p>
                  <div className="text-2xl font-semibold">
                    {numberFormat.format(creatorHighlights.totalCreators)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {numberFormat.format(creatorHighlights.activeCreators)} ativos no período
                  </p>
                </CardContent>
              </Card>
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Designs (total)</p>
                  <div className="text-2xl font-semibold">
                    {numberFormat.format(creatorHighlights.totalDesigns)}
                  </div>
                  <p className="text-xs text-muted-foreground">Base oficial do período</p>
                </CardContent>
              </Card>
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Média por criador</p>
                  <div className="text-2xl font-semibold">
                    {creatorHighlights.avgDesigns.toFixed(1)}
                  </div>
                  <p className="text-xs text-muted-foreground">Distribuição dos designs</p>
                </CardContent>
              </Card>
              <Card className="border-border/60 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Taxa de compartilhamento</p>
                  <div className="text-2xl font-semibold">
                    {creatorHighlights.shareRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muted-foreground">Links sobre publicados</p>
                </CardContent>
              </Card>
            </div>
          )}

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Linha do tempo dos uploads</CardTitle>
              <CardDescription>
                Evolucao dos CSVs aplicados (templates, membros e base geral)
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[260px]">
              {uploadTimelineStacked.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum upload encontrado no historico.
                </p>
              ) : (
                <div className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={uploadTimelineStacked} margin={{ top: 8, right: 16, bottom: 8, left: -4 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tickFormatter={(value) => numberFormat.format(value as number)}
                        allowDecimals={false}
                        width={80}
                      />
                      <RechartsTooltip
                        formatter={(value, name) => [`${numberFormat.format(value as number)} linhas`, name as string]}
                        labelFormatter={(label) => `Upload em ${label}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="creators"
                        name="Membros"
                        stroke={chartColors.primary}
                        fill={chartColors.primary}
                        fillOpacity={0.18}
                        stackId="uploads"
                      />
                      <Area
                        type="monotone"
                        dataKey="models"
                        name="Templates"
                        stroke={chartColors.muted}
                        fill={chartColors.muted}
                        fillOpacity={0.14}
                        stackId="uploads"
                      />
                      <Area
                        type="monotone"
                        dataKey="general"
                        name="Base geral"
                        stroke={chartColors.accent}
                        fill={chartColors.accent}
                        fillOpacity={0.14}
                        stackId="uploads"
                      />
                      <Line
                        type="monotone"
                        dataKey="total"
                        name="Total"
                        stroke={chartColors.primary}
                        strokeWidth={3}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2 space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Top criadores</CardTitle>
                  <CardDescription>Ranking rapido em cards</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full border bg-muted/50 px-1 py-0.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={creatorView === "list" ? "default" : "ghost"}
                      className="h-8 px-3 rounded-full"
                      onClick={() => setCreatorView("list")}
                    >
                      Lista
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={creatorView === "chart" ? "default" : "ghost"}
                      className="h-8 px-3 rounded-full"
                      onClick={() => setCreatorView("chart")}
                    >
                      Grafico
                    </Button>
                  </div>
                  <Select
                    value={creatorCardLimit === "all" ? "all" : creatorCardLimit.toString()}
                    onValueChange={(v) => setCreatorCardLimit(v === "all" ? "all" : Number(v))}
                  >
                    <SelectTrigger className="h-8 w-[110px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">Top 3</SelectItem>
                      <SelectItem value="5">Top 5</SelectItem>
                      <SelectItem value="10">Top 10</SelectItem>
                      <SelectItem value="15">Top 15</SelectItem>
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={creatorSort}
                    onValueChange={(v) => setCreatorSort(v as "value" | "delta")}
                  >
                    <SelectTrigger className="h-8 w-[140px]">
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="value">Designs criados</SelectItem>
                      <SelectItem value="delta">VariaÃ§Ã£o %</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={creatorDeltaFilter}
                    onValueChange={(v) =>
                      setCreatorDeltaFilter(v as "all" | "positive" | "negative")
                    }
                  >
                    <SelectTrigger className="h-8 w-[150px]">
                      <SelectValue placeholder="Filtro de variaÃ§Ã£o" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="positive">Somente alta</SelectItem>
                      <SelectItem value="negative">Somente queda</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 text-xs text-muted-foreground">
                <div
                  className="flex flex-col rounded-md border border-dashed px-3 py-2 cursor-help"
                  title="Soma de designs criados pelos criadores exibidos no ranking atual."
                >
                  <span>Designs do topo</span>
                  <span className="text-base font-semibold text-foreground">
                    {numberFormat.format(topCreatorsInsight.totalDesigns)}
                  </span>
                </div>
                <div
                  className="flex flex-col rounded-md border border-dashed px-3 py-2 cursor-help"
                  title="Percentual que o ranking representa do total de designs criados no periodo."
                >
                  <span>Participacao no total</span>
                  <span className="text-base font-semibold text-foreground">
                    {topCreatorsInsight.participation.toFixed(1)}%
                  </span>
                </div>
                <div
                  className="flex flex-col rounded-md border border-dashed px-3 py-2 cursor-help"
                  title="Media das variacoes percentuais dos criadores listados versus o periodo de comparacao."
                >
                  <span>Variacao media</span>
                  <span
                    className={`text-base font-semibold ${
                      typeof topCreatorsInsight.avgDelta === "number"
                        ? topCreatorsInsight.avgDelta >= 0
                          ? "text-emerald-600"
                          : "text-red-600"
                        : "text-muted-foreground"
                    }`}
                  >
                    {typeof topCreatorsInsight.avgDelta === "number"
                      ? percent(topCreatorsInsight.avgDelta)
                      : "Sem comparacao"}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {topCreatorsCards.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum criador encontrado para o periodo filtrado.
                </p>
              ) : creatorView === "list" ? (
                <div className={`space-y-3 ${isCreatorAll ? "max-h-[360px] overflow-y-auto pr-1" : ""}`}>
                  {topCreatorsCards.map((creator, idx) => (
                    <div
                      key={`${creator.name}-${idx}`}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="h-7 w-7 justify-center rounded-full text-xs font-bold">
                          #{idx + 1}
                        </Badge>
                        <div className="flex flex-col">
                          <span className="font-medium leading-tight">
                            {creator.name || "Criador sem nome"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {numberFormat.format(creator.value ?? 0)} designs
                          </span>
                          <span className="text-[11px] text-muted-foreground">
                            Escola: {creator.schoolName ?? "Sem escola"}
                            {creator.cluster ? ` • ${creator.cluster}` : ""}
                          </span>
                        </div>
                      </div>
                      {typeof creator.delta === "number" && (
                        <span
                          className={`text-xs font-semibold cursor-help ${
                            creator.delta >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                          title={
                            filters?.comparisonYear
                              ? `VariaÇõÇœo dos designs desse criador versus ${filters.comparisonYear}.`
                              : "VariaÇõÇœo dos designs desse criador; defina um ano de comparaÇõÇœo para contextualizar."
                          }
                        >
                          {percent(creator.delta)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`pt-2 w-full overflow-auto ${isCreatorAll ? "max-h-[420px]" : "h-[360px]"}`}
                  style={{ minWidth: 0 }}
                >
                  <BarChart
                    key={`creators-chart-${filters.baseYear}-${creatorCardLimit}-${creatorSort}-${creatorDeltaFilter}-${topCreatorsCards.length}`}
                    width={900}
                    height={creatorsChartHeight}
                    data={topCreatorsCards}
                    layout="vertical"
                    margin={{ left: 140, right: 36, top: 12, bottom: 12 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal />
                    <XAxis type="number" tickFormatter={yAxisFormatter} />
                    <YAxis dataKey="name" type="category" width={260} tick={{ fontSize: 12 }} />
                    <RechartsTooltip
                      formatter={(v: number) => numberFormat.format(v)}
                      labelFormatter={(label) => `Criador: ${label}`}
                    />
                    <Legend />
                    <Bar
                      dataKey="value"
                      name="Designs criados"
                      fill={chartColors.primary}
                      radius={[8, 8, 8, 8]}
                      barSize={18}
                    >
                      <LabelList
                        dataKey="value"
                        position="right"
                        formatter={(v: number) => numberFormat.format(v)}
                        className="text-xs"
                      />
                    </Bar>
                  </BarChart>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {view === "models" && (
        <div className="space-y-6 pb-8">
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2 space-y-3">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Artes mais compartilhadas</CardTitle>
                  <CardDescription>Ranking por compartilhamentos</CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full border bg-muted/50 px-1 py-0.5">
                    <Button
                      type="button"
                      size="sm"
                      variant={sharedView === "list" ? "default" : "ghost"}
                      className="h-8 px-3 rounded-full"
                      onClick={() => setSharedView("list")}
                    >
                      Lista
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                    variant={sharedView === "chart" ? "default" : "ghost"}
                    className="h-8 px-3 rounded-full"
                    onClick={() => setSharedView("chart")}
                  >
                    Grafico
                  </Button>
                </div>
                  <Select
                    value={filters.baseYear.toString()}
                    onValueChange={(v) => handleYearChange("baseYear", v)}
                  >
                    <SelectTrigger className="h-8 w-[120px]">
                      <SelectValue placeholder="Ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableYears.map((y) => (
                        <SelectItem key={y} value={y.toString()}>
                          {y}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    placeholder="Buscar arte"
                    value={sharedSearch}
                    onChange={(e) => setSharedSearch(e.target.value)}
                    className="h-9 w-[180px]"
                  />
                  <Select
                    value={sharedLimit === "all" ? "all" : sharedLimit.toString()}
                    onValueChange={(v) => setSharedLimit(v === "all" ? "all" : Number(v))}
                  >
                    <SelectTrigger className="h-8 w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">Top 3</SelectItem>
                      <SelectItem value="5">Top 5</SelectItem>
                      <SelectItem value="10">Top 10</SelectItem>
                      <SelectItem value="15">Top 15</SelectItem>
                      <SelectItem value="all">Todos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 text-xs text-muted-foreground">
                <div
                  className="flex flex-col rounded-md border border-dashed px-3 py-2 cursor-help"
                  title="Total de compartilhamentos no periodo filtrado."
                >
                  <span>Compartilhamentos totais</span>
                  <span className="text-base font-semibold text-foreground">
                    {numberFormat.format(sharedTotals.totalShared)}
                  </span>
                </div>
                <div
                  className="flex flex-col rounded-md border border-dashed px-3 py-2 cursor-help"
                  title="Soma de compartilhamentos apenas dos itens exibidos no ranking."
                >
                  <span>Volume do ranking</span>
                  <span className="text-base font-semibold text-foreground">
                    {numberFormat.format(sharedTotals.topSharedTotal)}
                  </span>
                </div>
                <div
                  className="flex flex-col rounded-md border border-dashed px-3 py-2 cursor-help"
                  title="Percentual dos compartilhamentos do ranking em relacao ao total do periodo."
                >
                  <span>Participacao do ranking</span>
                  <span className="text-base font-semibold text-foreground">
                    {sharedTotals.totalShared
                      ? ((sharedTotals.topSharedTotal / sharedTotals.totalShared) * 100).toFixed(1)
                      : "0.0"}
                    %
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {sharedView !== "chart" && (
                <div className={`space-y-3 ${isSharedAll ? "max-h-[360px] overflow-y-auto pr-1" : ""}`}>
                  {topSharedTemplates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      Ainda sem compartilhamentos registrados no periodo.
                    </p>
                  ) : (
                    topSharedTemplates.map((template, idx) => {
                      const sharePct = sharedTotals.totalShared
                        ? (template.shared / sharedTotals.totalShared) * 100
                        : 0;
                      return (
                        <div
                          key={template.name}
                          className="flex items-center justify-between rounded-lg border px-3 py-2"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="h-7 w-7 justify-center rounded-full text-xs font-bold">
                              #{idx + 1}
                            </Badge>
                            <div className="flex flex-col">
                              <span className="font-medium leading-tight">
                                {template.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {numberFormat.format(template.shared)} compartilhamentos
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-semibold text-foreground">
                              {sharePct.toFixed(1)}%
                            </div>
                            <div className="text-[11px] text-muted-foreground">do total</div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {sharedView === "chart" && (
                <div
                  className={`pt-2 w-full overflow-auto ${isSharedAll ? "max-h-[420px]" : "h-[360px]"}`}
                  style={{ minWidth: 0 }}
                >
                  {sharedChartData.length === 0 ? (
                    <div className="text-sm text-muted-foreground text-center py-10">
                      Nenhum dado para exibir.
                    </div>
                  ) : (
                    <BarChart
                      key={`shared-chart-${filters.baseYear}-${sharedLimit}-${sharedSearch}-${sharedChartData.length}`}
                      width={900}
                      height={sharedChartHeight}
                      data={sharedChartData}
                      layout="vertical"
                      margin={{ left: 140, right: 48, top: 12, bottom: 12 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal />
                      <XAxis type="number" tickFormatter={yAxisFormatter} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={260}
                        tick={{ fontSize: 12 }}
                      />
                      <RechartsTooltip
                        formatter={(v: number, key) =>
                          key === "pct" ? `${(v as number).toFixed(1)}%` : numberFormat.format(v as number)
                        }
                        labelFormatter={(label, payload) => {
                          const pct = payload?.[0]?.payload?.pct;
                          return `${label} - ${pct?.toFixed(1) ?? "0.0"}% do total`;
                        }}
                      />
                      <Legend />
                      <Bar
                        dataKey="shared"
                        name="Compartilhamentos"
                        fill={chartColors.primary}
                        radius={[8, 8, 8, 8]}
                        barSize={18}
                      >
                        <LabelList
                          dataKey="shared"
                          position="right"
                          formatter={(v: number) => numberFormat.format(v)}
                          className="text-xs"
                        />
                      </Bar>
                    </BarChart>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {view === "schools" && analytics && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle>Linha do tempo da escola</CardTitle>
            <CardDescription>Evolução mensal de criados e compartilhados</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {schoolLineSeries.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum dado disponível para os filtros atuais.
              </p>
            ) : (
              <div className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={schoolLineSeries} margin={{ top: 12, right: 16, bottom: 8, left: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(v) => numberFormat.format(v)} allowDecimals={false} />
                    <RechartsTooltip
                      formatter={(v: number, name) => [numberFormat.format(v), name]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="createdBase"
                      name={`Criados (${baseYearLabel})`}
                      stroke={lineColors.createdBase}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="sharedBase"
                      name={`Compartilhados (${baseYearLabel})`}
                      stroke={lineColors.sharedBase}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="publishedBase"
                      name={`Publicados (${baseYearLabel})`}
                      stroke={lineColors.publishedBase}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                    {hasComparisonYear && (
                      <>
                        <Line
                          type="monotone"
                          dataKey="createdComparison"
                          name={`Criados (${comparisonYearLabel})`}
                          stroke={lineColors.createdComparison}
                          strokeWidth={2}
                          strokeDasharray="4 4"
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="sharedComparison"
                          name={`Compartilhados (${comparisonYearLabel})`}
                          stroke={lineColors.sharedComparison}
                          strokeWidth={2}
                          strokeDasharray="2 6"
                          dot={{ r: 3 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="publishedComparison"
                          name={`Publicados (${comparisonYearLabel})`}
                          stroke={lineColors.publishedComparison}
                          strokeWidth={2}
                          strokeDasharray="6 3"
                          dot={{ r: 3 }}
                        />
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SÃ©rie mensal base vs comparaÃ§Ã£o */}
      {showLegacyCharts && designsPerMonthData.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Designs por mes</CardTitle>
            <CardDescription>
              {filters.baseYear}
              {hasComparison ? ` vs ${filters.comparisonYear}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={designsPerMonthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={yAxisFormatter} />
                <RechartsTooltip
                  contentStyle={{
                    borderRadius: 8,
                    borderColor: "#e5e7eb",
                  }}
                  formatter={(v: number) => numberFormat.format(v)}
                  labelFormatter={(label) => `Mes: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="base"
                  name={`Ano base (${filters.baseYear})`}
                  stroke={chartColors.primary}
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
                {hasComparison && (
                  <Line
                    type="monotone"
                    dataKey="comparison"
                    name={`Ano comparacao (${filters.comparisonYear})`}
                    stroke={chartColors.muted}
                    strokeWidth={3}
                    strokeDasharray="5 5"
                    dot={{ r: 3 }}
                    activeDot={{ r: 6 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Rankings por aba */}
      {showLegacyCharts && analytics && view === "models" && (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Top escolas (para modelos) */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Top escolas mais ativas</CardTitle>
              <CardDescription>
                Ranking por designs criados no perÃ­odo selecionado
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
              {topSchoolsChart.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-10">
                  Nenhuma escola encontrada.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topSchoolsChart}
                    layout="vertical"
                    margin={{ left: 80, right: 24 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal />
                    <XAxis type="number" tickFormatter={yAxisFormatter} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={180}
                      tick={{ fontSize: 12 }}
                    />
                    <RechartsTooltip
                      formatter={(v: number) => numberFormat.format(v)}
                  labelFormatter={(label) => `Mes: ${label}`}
                    />
                    <Legend />
                    <Bar
                      dataKey="value"
                      name="Designs criados"
                      fill={chartColors.primary}
                      radius={[8, 8, 8, 8]}
                    >
                      <LabelList
                        dataKey="value"
                        position="right"
                        formatter={(v: number) => numberFormat.format(v)}
                        className="text-xs"
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Top modelos */}
          <Card className="border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle>Top modelos mais utilizados</CardTitle>
              <CardDescription>Artes mais usadas no perÃ­odo</CardDescription>
            </CardHeader>
            <CardContent className="h-[360px]">
              {topModelsChart.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-10">
                  Nenhum modelo encontrado.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topModelsChart}
                    margin={{ bottom: 60, left: 12, right: 12 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      interval={0}
                      angle={-18}
                      textAnchor="end"
                      height={70}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis tickFormatter={yAxisFormatter} />
                    <RechartsTooltip
                      formatter={(v: number) => numberFormat.format(v)}
                  labelFormatter={(label) => `Mes: ${label}`}
                    />
                    <Legend />
                    <Bar
                      dataKey="value"
                      name="Designs criados"
                      fill={chartColors.primary}
                      radius={[8, 8, 0, 0]}
                    >
                      <LabelList
                        dataKey="value"
                        position="top"
                        formatter={(v: number) => numberFormat.format(v)}
                        className="text-xs"
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {showLegacyCharts && topCreatorsChart.length > 0 && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Top criadores</CardTitle>
              <CardDescription>
                UsuÃ¡rios com mais designs criados no perÃ­odo selecionado
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Mostrar</span>
              <Select
                value={creatorRankLimit === "all" ? "all" : creatorRankLimit.toString()}
                onValueChange={(v) => setCreatorRankLimit(v === "all" ? "all" : Number(v))}
              >
                <SelectTrigger className="h-8 w-[90px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Top 3</SelectItem>
                  <SelectItem value="5">Top 5</SelectItem>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="15">Top 15</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topCreatorsChart}
                layout="vertical"
                margin={{ left: 80, right: 24 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal />
                <XAxis type="number" tickFormatter={yAxisFormatter} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={200}
                  tick={{ fontSize: 12 }}
                />
                <RechartsTooltip
                  formatter={(v: number) => numberFormat.format(v)}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  name="Designs criados"
                  fill={chartColors.primary}
                  radius={[8, 8, 8, 8]}
                >
                  <LabelList
                    dataKey="value"
                    position="right"
                    formatter={(v: number) => numberFormat.format(v)}
                    className="text-xs"
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {showLegacyCharts && analytics && view === "schools" && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Top escolas mais ativas</CardTitle>
            <CardDescription>
              Ranking por designs criados no perÃ­odo selecionado
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[360px]">
            {topSchoolsChart.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-10">
                Nenhuma escola encontrada.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topSchoolsChart}
                  layout="vertical"
                  margin={{ left: 80, right: 24 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal />
                  <XAxis type="number" tickFormatter={yAxisFormatter} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={180}
                    tick={{ fontSize: 12 }}
                  />
                  <RechartsTooltip
                    formatter={(v: number) => numberFormat.format(v)}
                  labelFormatter={(label) => `Mes: ${label}`}
                  />
                  <Legend />
                  <Bar
                    dataKey="value"
                    name="Designs criados"
                    fill={chartColors.primary}
                    radius={[8, 8, 8, 8]}
                  >
                    <LabelList
                      dataKey="value"
                      position="right"
                      formatter={(v: number) => numberFormat.format(v)}
                      className="text-xs"
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comparativo mensal de linhas importadas */}
      {showLegacyCharts && analytics && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle>Comparativo mensal (linhas importadas)</CardTitle>
            <CardDescription>Modelos x Criadores x Geral</CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyImportCounts}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis tickFormatter={yAxisFormatter} />
                <RechartsTooltip
                  formatter={(v: number) => numberFormat.format(v)}
                  labelFormatter={(label) => `Mes: ${label}`}
                />
                <Legend />
                <Bar
                  dataKey="models"
                  name="Modelos (linhas)"
                  stackId="a"
                  fill={chartColors.primary}
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="creators"
                  name="Criadores (linhas)"
                  stackId="a"
                  fill={chartColors.muted}
                />
                <Bar
                  dataKey="general"
                  name="Total (linhas)"
                  stackId="a"
                  fill={chartColors.accent}
                  radius={[0, 0, 8, 8]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar CSV</DialogTitle>
            <DialogDescription>Selecione o tipo de arquivo, envie o CSV e confirme a importacao.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Arquivo CSV</Label>
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
            />
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                {selectedFile.name} - {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Mapeamento sugerido sera aplicado automaticamente.
            </p>
          </div>
          <div className="space-y-1">
            <Label>Tipo de arquivo</Label>
            <Select
              value={importDataType}
              onValueChange={(value) => setImportDataType(value as CanvaYearlyRecord["dataType"])}
            >
              <SelectTrigger className="w-full rounded-full">
                <SelectValue placeholder="Selecione o tipo do CSV" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="models">Templates / modelos</SelectItem>
                <SelectItem value="creators">Membros</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Escolha se o CSV e de templates/modelos ou de membros.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setImportPresetDays(7)}
            >
              Ultimos 7 dias
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={() => setImportPresetDays(30)}
            >
              Ultimos 30 dias
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="start-date">Data inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start rounded-full text-left font-normal"
                    aria-label="Abrir calendÃ¡rio de data inicial"
                  >
                    {importStartDate ? formatDisplayDate(importStartDate) : "Escolha a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="p-2 w-[320px] max-w-[360px] overflow-visible rounded-xl border bg-popover shadow-lg"
                  align="start"
                  sideOffset={4}
                  collisionPadding={8}
                  avoidCollisions
                >
                  <Calendar
                    mode="single"
                    selected={importStartDate ? new Date(importStartDate) : undefined}
                    onSelect={(date) => setImportStartDate(toInputDate(date ?? undefined))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-1">
              <Label htmlFor="end-date">Data final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start rounded-full text-left font-normal"
                    aria-label="Abrir calendÃ¡rio de data final"
                  >
                    {importEndDate ? formatDisplayDate(importEndDate) : "Escolha a data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="p-2 w-[320px] max-w-[360px] overflow-visible rounded-xl border bg-popover shadow-lg"
                  align="start"
                  sideOffset={4}
                  collisionPadding={8}
                  avoidCollisions
                >
                  <Calendar
                    mode="single"
                    selected={importEndDate ? new Date(importEndDate) : undefined}
                    onSelect={(date) => setImportEndDate(toInputDate(date ?? undefined))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleImport} disabled={uploading || !selectedFile}>
              {uploading ? "Importando..." : "Importar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Historico de importacoes</DialogTitle>
            <DialogDescription>Uploads recentes.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[360px] overflow-y-auto space-y-2">
            {activeHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                Nenhum upload registrado.
              </p>
            ) : (
              activeHistory.map((entry) => {
                const dataTypeLabel =
                  entry.dataType === "models"
                    ? "templates"
                    : entry.dataType === "creators"
                    ? "membros"
                    : "geral";
                return (
                  <div
                    key={entry.id}
                    className="flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <div className="font-medium">{entry.filename}</div>
                        <Badge variant="secondary" className="capitalize">
                          {dataTypeLabel}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {entry.periodLabel} - {entry.year}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <div className="text-right text-xs text-muted-foreground">
                        <div>{new Date(entry.uploadedAt).toLocaleDateString("pt-BR")}</div>
                        <div>{entry.rows} linhas</div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive flex items-center gap-2"
                        onClick={() => openDeleteDialog(entry)}
                      >
                        <Trash2 className="h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHistoryOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(entryToDelete)}
        onOpenChange={(open) => {
          if (!open) closeDeleteDialog();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir upload e metricas?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa acao remove as metricas importadas para {entryToDelete?.year} ({entryToDelete?.periodLabel}) e
              marca o upload como removido no historico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Label>Motivo (opcional)</Label>
            <Input
              placeholder="Ex.: arquivo incorreto ou intervalo duplicado"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting} onClick={closeDeleteDialog}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction disabled={deleting} onClick={confirmDeleteHistoryEntry}>
              {deleting ? "Excluindo..." : "Excluir upload e metricas"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CanvaYearlyComparison;

