import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Download,
  X,
  AlertTriangle,
  Building2,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { SchoolLicenseCard } from "./SchoolLicenseCard";
import { useSchoolLicenseStore } from "@/stores/schoolLicenseStore";
import { School } from "@/types/schoolLicense";
import { toast } from "@/components/ui/sonner";
import StatsCard from "@/components/dashboard/StatsCard";
import { useLicenseLimit } from "@/config/licenseLimits";
import { cn } from "@/lib/utils";

interface SchoolLicenseManagementProps {
  externalSearchTerm?: string;
  onExternalSearchConsumed?: () => void;
}

export const SchoolLicenseManagement = ({
  externalSearchTerm,
  onExternalSearchConsumed,
}: SchoolLicenseManagementProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");
  const [clusterFilter, setClusterFilter] = useState<string>("all");
  const [licenseFilter, setLicenseFilter] = useState<string>("all");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const pageSize = 24;
  const licenseLimit = useLicenseLimit();

  const {
    schools,
    getLicenseStatus,
    getNonMapleBearCount,
    getDomainCounts,
    officialData,
    overviewData,
  } = useSchoolLicenseStore();

  const normalizeKey = (value?: string | number | null) =>
    (value ?? "")
      .toString()
      .trim()
      .toLowerCase();

  const normalizeSchoolName = (value?: string) =>
    (value ?? "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/\s+/g, " ")
      .trim();

  const uniqueSchools = useMemo(() => {
    const officialIds = new Set(
      (officialData || []).map((item) => normalizeKey(item.school.id))
    );
    const officialNames = new Set(
      (officialData || []).map((item) => normalizeSchoolName(item.school.name))
    );
    const isAllowed = (school: School) => {
      const idKey = normalizeKey(school.id);
      const nameKey = normalizeSchoolName(school.name);
      if (idKey === "0" || idKey === "no-school" || nameKey.includes("central")) {
        return true;
      }
      if (officialIds.size > 0 || officialNames.size > 0) {
        if (idKey && officialIds.has(idKey)) return true;
        if (nameKey && officialNames.has(nameKey)) return true;
        return false;
      }
      return true;
    };

    const map = new Map<string, School>();
    schools.forEach((school) => {
      if (!isAllowed(school)) return;
      const key =
        normalizeSchoolName(school.name) ||
        normalizeKey(school.id) ||
        `idx-${map.size}`;
      if (!map.has(key)) {
        map.set(key, school);
      }
    });
    return Array.from(map.values());
  }, [schools, officialData]);

  const normalizeValue = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
  const normalizedSearch = normalizeValue(searchTerm.trim());
  const userMatches = useMemo(() => {
    if (!normalizedSearch) return [];
    const matches: Array<{
      schoolId: string;
      schoolName: string;
      cluster?: string;
      userName: string;
      email: string;
      role?: string;
      isCompliant?: boolean;
    }> = [];
    uniqueSchools.forEach((school) => {
      school.users.forEach((user) => {
        const nameNorm = normalizeValue(user.name);
        const emailNorm = normalizeValue(user.email);
        const roleNorm = normalizeValue(user.role);
        if (
          nameNorm.includes(normalizedSearch) ||
          emailNorm.includes(normalizedSearch) ||
          roleNorm.includes(normalizedSearch)
        ) {
          matches.push({
            schoolId: school.id,
            schoolName: school.name,
            cluster: school.cluster,
            userName: user.name,
            email: user.email,
            role: user.role,
            isCompliant: user.isCompliant,
          });
        }
      });
    });
    return matches.slice(0, 12);
  }, [normalizedSearch, uniqueSchools]);

  const filteredSchools = useMemo(() => {
    const priorityRank = (school: School) => {
      const nameLower = (school.name || "").toLowerCase();
      if (school.id === "no-school" || nameLower.includes("sem escola")) return -2;
      if (school.id?.toLowerCase().includes("central") || nameLower.includes("central")) return -1;
      return 0;
    };

    const sorted = [...uniqueSchools].sort((a, b) => {
      const rankA = priorityRank(a);
      const rankB = priorityRank(b);
      if (rankA !== rankB) return rankA - rankB;

      const deltaA = Math.max(0, a.usedLicenses - a.totalLicenses);
      const deltaB = Math.max(0, b.usedLicenses - b.totalLicenses);
      if (deltaA !== deltaB) return deltaB - deltaA;
      return b.usedLicenses - a.usedLicenses;
    });

    return sorted.filter((school) => {
      const matchesSearch =
        !normalizedSearch ||
        normalizeValue(school.name).includes(normalizedSearch) ||
        normalizeValue(school.cluster).includes(normalizedSearch) ||
        school.users.some(
          (user) =>
            normalizeValue(user.name).includes(normalizedSearch) ||
            normalizeValue(user.email).includes(normalizedSearch) ||
            normalizeValue(user.role).includes(normalizedSearch)
        );

      const matchesSelectedSchool = !selectedSchool || school.id === selectedSchool;
      const matchesCluster =
        clusterFilter === "all" ||
        normalizeValue(school.cluster) === normalizeValue(clusterFilter);
      const matchesRole =
        roleFilter === "all" ||
        school.users.some((user) => normalizeValue(user.role) === normalizeValue(roleFilter));

      const schoolLicenseStatus = getLicenseStatus(school);
      const matchesLicense =
        licenseFilter === "all" ||
        normalizeValue(schoolLicenseStatus) === normalizeValue(licenseFilter);

      return matchesSearch && matchesSelectedSchool && matchesCluster && matchesRole && matchesLicense;
    });
  }, [uniqueSchools, normalizedSearch, selectedSchool, clusterFilter, roleFilter, licenseFilter, getLicenseStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredSchools.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const hasMultiplePages = totalPages > 1;
  const visibleSchools = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredSchools.slice(start, end);
  }, [filteredSchools, currentPage, pageSize]);
  const paginationProgress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  const clampPage = (value: number) =>
    Math.min(totalPages, Math.max(1, Number.isFinite(value) ? value : 1));

  const goToPage = (value: number) => {
    const next = clampPage(value);
    setPage(next);
    setPageInput(next.toString());
  };

  const handlePageInputChange = (value: string) => {
    const onlyDigits = value.replace(/[^0-9]/g, "");
    setPageInput(onlyDigits);
  };

  const handlePageSubmit = () => {
    const targetPage = clampPage(Number(pageInput) || 1);
    goToPage(targetPage);
  };

  const {
    totalSchools,
    activeSchools,
    totalLicenses,
    usedLicenses,
    exceedingSchools,
    nonCompliantUsers,
    nonMapleBearCount,
    domainCounts,
    unassignedUsers,
  } = useMemo(() => {
    const envTotalLicenses = Number(
      (import.meta.env as any)?.VITE_TOTAL_CANVA_LICENSES ??
        (import.meta.env as any)?.VITE_CANVA_TOTAL_LICENSES
    );
    const hasEnvTotal = Number.isFinite(envTotalLicenses) && envTotalLicenses > 0;

    const overviewTotalLicenses = (overviewData as any)?.totalLicenses as number | undefined;

    const normalizeText = (value?: string) =>
      (value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");

    const countedSchools = uniqueSchools.filter((school) => {
      const name = normalizeText(school.name);
      return school.id !== "no-school" && !name.includes("central");
    });

    const officialSchoolCount =
      overviewData?.totalSchools ??
      officialData?.filter((item) => item.school.id !== "no-school").length ??
      0;

    const totalSchoolsAll = officialSchoolCount || countedSchools.length;
    const activeWithLicenses = countedSchools.filter((s) => s.usedLicenses > 0).length;

    const totals = countedSchools.reduce(
      (acc, s) => {
        acc.usedLicenses += s.usedLicenses;
        acc.nonCompliantUsers += s.users.filter((u) => !u.isCompliant).length;
        if (s.usedLicenses > 0) acc.activeSchools += 1;
        if (getLicenseStatus(s) === "Excedido") acc.exceedingSchools += 1;
        return acc;
      },
      {
        usedLicenses: 0,
        nonCompliantUsers: 0,
        activeSchools: 0,
        exceedingSchools: 0,
      }
    );

    const noSchool = uniqueSchools.find(
      (school) => school.id === "no-school" || normalizeText(school.name).includes("sem escola")
    );
    const unassignedUsed = noSchool?.usedLicenses ?? noSchool?.users.length ?? 0;
    const unassignedNonCompliant =
      noSchool?.users.filter((u) => !u.isCompliant).length ?? 0;
    const unassignedTotalLicenses =
      noSchool && unassignedUsed > 0
        ? noSchool.totalLicenses || Math.max(unassignedUsed, 1)
        : 0;

    const computedUsedLicenses = overviewData?.usedLicenses ?? totals.usedLicenses + unassignedUsed;
    const computedTotalLicenses =
      overviewData?.totalLicenses ??
      totalSchoolsAll * licenseLimit + unassignedTotalLicenses;

    return {
      totalSchools: overviewData?.totalSchools ?? totalSchoolsAll,
      activeSchools: overviewData?.schoolsWithUsers ?? activeWithLicenses,
      totalLicenses: computedTotalLicenses,
      usedLicenses: computedUsedLicenses,
      exceedingSchools: overviewData?.schoolsAtCapacity ?? totals.exceedingSchools,
      nonCompliantUsers: overviewData?.nonCompliantUsers ?? totals.nonCompliantUsers + unassignedNonCompliant,
      nonMapleBearCount: getNonMapleBearCount(),
      domainCounts: getDomainCounts(),
      unassignedUsers: unassignedUsed,
    };
  }, [uniqueSchools, getLicenseStatus, getDomainCounts, getNonMapleBearCount, licenseLimit, overviewData, officialData]);

  const nonCompliantUsersAll = nonCompliantUsers;

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedSchool("");
    setClusterFilter("all");
    setLicenseFilter("all");
    setRoleFilter("all");
    setPage(1);
  };

  useEffect(() => {
    if (externalSearchTerm) {
      setSearchTerm(externalSearchTerm);
      setPage(1);
      onExternalSearchConsumed?.();
    }
  }, [externalSearchTerm, onExternalSearchConsumed]);

  const handleExport = () => {
    // Exporta sempre a viso filtrada mais recente
    const formatCell = (value: unknown) => {
      const raw = value ?? "";
      const str = typeof raw === "string" ? raw : String(raw);
      if (/[;"\n\r]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const csvData = [
      [
        "Escola",
        "Status",
        "Cluster",
        "Cidade",
        "LicenAas Totais",
        "LicenAas Usadas",
        "Status LicenAas",
        "Total UsuArios",
        "UsuArios NAo Conformes",
      ],
      ...filteredSchools.map((school) => [
        formatCell(school.name),
        formatCell(school.status ?? ""),
        formatCell(school.cluster ?? ""),
        formatCell(school.city ?? ""),
        formatCell(school.totalLicenses ?? 0),
        formatCell(school.usedLicenses ?? 0),
        formatCell(getLicenseStatus(school) ?? ""),
        formatCell(school.users.length ?? 0),
        formatCell(school.users.filter((u) => !u.isCompliant).length ?? 0),
      ]),
    ];

    const csvContent = csvData.map((row) => row.join(";")).join("\n");
    const bom = "\uFEFF"; // BOM para Excel/PT-BR ler UTF-8 sem acentos quebrados
    const blob = new Blob([bom + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "escolas-licencas.csv";
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Dados exportados com sucesso");
  };

  const handleViewDetails = (_school: School) => {};

  const handleManage = (_school: School) => {};

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-medium">Painel de escolas e licenças</h2>
          <p className="text-sm text-muted-foreground">Gerencie usuários, licenças e conformidade das escolas</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatsCard
          title="Total de Escolas"
          value={totalSchools.toString()}
          description={`${activeSchools} com licenças ativas`}
          icon={<Building2 className="h-4 w-4" />}
          tooltip="Numero de escolas oficiais carregadas; considera todas as escolas sincronizadas."
        />
        <StatsCard
          title="Licenças utilizadas"
          value={`${usedLicenses}/${totalLicenses}`}
          description={
            totalLicenses > 0 ? `${((usedLicenses / totalLicenses) * 100).toFixed(1)}% ocupação` : "Sem dados de licença"
          }
          icon={<Users className="h-4 w-4" />}
          tooltip="Soma de usuários licenciados em todas as escolas; percentual = usadas / total de licenças."
        />
        <StatsCard
          title="Licenças fora da política"
          value={nonCompliantUsersAll.toString()}
          description="E-mails não conformes"
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={nonCompliantUsersAll > 0 ? "destructive" : "default"}
          tooltip="Total de usuários com e-mail fora da política. E-mails válidos: domínios aprovados (mbcentral.com.br, sebsa.com.br, seb.com.br), qualquer endereço contendo 'maplebear', ou que tenha nome de escola/identificador iniciado por 'mb'."
        />
        <StatsCard
          title="Escolas em Excesso"
          value={exceedingSchools.toString()}
          description="licenças ultrapassadas"
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={exceedingSchools > 0 ? "destructive" : "default"}
          tooltip="Escolas acima do limite de licenças definido. Reveja estas unidades para redistribuir ou remover acessos."
        />
        <StatsCard
          title="Usuários sem escola"
          value={(unassignedUsers ?? 0).toString()}
          description="Licenças sem vínculo"
          icon={<Users className="h-4 w-4" />}
          tooltip="Licenças ativas sem vínculo a escola. Vincule ou remova para evitar consumo indevido."
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 pt-4 pb-2">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[320px] relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nome da escola, cluster, usuário, e-mail ou perfil (estudante, professor, administrador)"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="h-10 pl-10 pr-4 text-sm rounded-md"
              />
            </div>

            <Select
              value={clusterFilter}
              onValueChange={(value) => {
                setClusterFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-10 w-[150px] px-4 text-sm rounded-md justify-between"
                )}
              >
                <SelectValue placeholder="Cluster/Região" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Implantacao">Implantação</SelectItem>
                <SelectItem value="Alta Performance">Alta Performance</SelectItem>
                <SelectItem value="Potente">Potente</SelectItem>
                <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                <SelectItem value="Alerta">Alerta</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={licenseFilter}
              onValueChange={(value) => {
                setLicenseFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-10 w-[150px] px-4 text-sm rounded-md justify-between"
                )}
              >
                <SelectValue placeholder="Status das licenças" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Disponível">Disponível</SelectItem>
                <SelectItem value="Completo">Completo</SelectItem>
                <SelectItem value="Excedido">Excedido</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={roleFilter}
              onValueChange={(value) => {
                setRoleFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-10 w-[150px] px-4 text-sm rounded-md justify-between"
                )}
              >
                <SelectValue placeholder="Perfil do Usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os perfis</SelectItem>
                <SelectItem value="Estudante">Estudante</SelectItem>
                <SelectItem value="Professor">Professor</SelectItem>
                <SelectItem value="Administrador">Administrador</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="whitespace-nowrap h-10 text-sm px-4 rounded-md w-[150px]"
            >
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="gap-2 h-10 text-sm px-3 rounded-md w-[150px]"
            >
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {userMatches.length > 0 && (
        <Card className="border border-border/50 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Usuários encontrados</CardTitle>
              <p className="text-xs text-muted-foreground">
                Mostrando {userMatches.length} resultados pelo filtro atual
              </p>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {userMatches.map((match) => (
              <div
                key={`${match.email}-${match.schoolId}`}
                className="rounded-lg border border-border/60 bg-slate-50/70 p-3 shadow-inner"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-semibold text-foreground truncate">{match.userName}</div>
                  {!match.isCompliant && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/40">
                      Não conforme
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground truncate">{match.email}</div>
                <div className="text-xs text-foreground mt-1 flex flex-col gap-0.5">
                  <span className="font-medium truncate">{match.schoolName}</span>
                  <span className="text-muted-foreground">
                    {match.cluster || "Sem cluster"} {match.role ? `• ${match.role}` : ""}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs px-2"
                  onClick={() => {
                    setSelectedSchool(match.schoolId);
                    setPage(1);
                  }}
                >
                  Ir para escola
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 [grid-auto-rows:minmax(360px,1fr)]">
          {visibleSchools.map((school) => (
            <SchoolLicenseCard
              key={school.id}
              school={school}
              onViewDetails={handleViewDetails}
              onManage={handleManage}
            />
          ))}
        </div>
        {filteredSchools.length === 0 && (
          <div className="text-center py-10 text-sm text-muted-foreground">
            Nenhuma escola encontrada com os filtros aplicados.
          </div>
        )}
        {hasMultiplePages && (
          <div className="rounded-2xl border border-border/50 bg-gradient-to-r from-white via-slate-50 to-white shadow-sm px-3 py-4 sm:px-5">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-white px-3 py-2 shadow-sm">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-muted/70"
                  aria-label="Voltar página"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={pageInput}
                    onChange={(e) => handlePageInputChange(e.target.value)}
                    onBlur={handlePageSubmit}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handlePageSubmit();
                      }
                    }}
                    className="w-14 h-9 rounded-lg border border-border/70 bg-slate-50 text-center text-sm font-semibold tracking-tight px-2 py-1 appearance-none [appearance:textfield] [-moz-appearance:textfield] focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:border-transparent"
                  />
                  <span className="text-sm text-muted-foreground">/</span>
                  <span className="text-base font-semibold text-slate-900">{totalPages}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={currentPage === totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-muted/70"
                  aria-label="Avançar página"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="w-full max-w-md h-2 rounded-full bg-muted/70 overflow-hidden shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-amber-500 transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, paginationProgress)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

