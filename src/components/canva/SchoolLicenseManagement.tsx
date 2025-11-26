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
import { Search, Download, X, AlertTriangle, Building2, Users } from "lucide-react";
import { SchoolLicenseCard } from "./SchoolLicenseCard";
import { useSchoolLicenseStore } from "@/stores/schoolLicenseStore";
import { School } from "@/types/schoolLicense";
import { toast } from "sonner";
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

  const normalizeValue = (value: string) =>
    value
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "");
  const normalizedSearch = normalizeValue(searchTerm.trim());

  const filteredSchools = useMemo(() => {
    const priorityRank = (school: School) => {
      const nameLower = (school.name || "").toLowerCase();
      if (school.id === "no-school" || nameLower.includes("sem escola")) return -2;
      if (school.id?.toLowerCase().includes("central") || nameLower.includes("central")) return -1;
      return 0;
    };

    const sorted = [...schools].sort((a, b) => {
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
  }, [schools, normalizedSearch, selectedSchool, clusterFilter, roleFilter, licenseFilter, getLicenseStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredSchools.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleSchools = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredSchools.slice(start, end);
  }, [filteredSchools, currentPage, pageSize]);

  const {
    totalSchools,
    activeSchools,
    totalLicenses,
    usedLicenses,
    exceedingSchools,
    nonCompliantUsers,
    nonMapleBearCount,
    domainCounts,
  } = useMemo(() => {
    const normalizeText = (value?: string) =>
      (value ?? "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "");

    const countedSchools = schools.filter((school) => {
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

    return {
      totalSchools: totalSchoolsAll,
      activeSchools: activeWithLicenses,
      totalLicenses: totalSchoolsAll * licenseLimit,
      usedLicenses: totals.usedLicenses,
      exceedingSchools: totals.exceedingSchools,
      nonCompliantUsers: totals.nonCompliantUsers,
      nonMapleBearCount: getNonMapleBearCount(),
      domainCounts: getDomainCounts(),
    };
  }, [schools, getLicenseStatus, getDomainCounts, getNonMapleBearCount, licenseLimit]);

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
    // Exporta sempre a visão filtrada mais recente
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
        "Licencas Totais",
        "Licencas Usadas",
        "Status Licencas",
        "Total Usuarios",
        "Usuarios Nao Conformes",
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

  const handleViewDetails = (school: School) => {
    toast.info(`Visualizando detalhes: ${school.name}`);
  };

  const handleManage = (school: School) => {
    toast.info(`Gerenciando escola: ${school.name}`);
  };

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
        />
        <StatsCard
          title="Licenças Utilizadas"
          value={`${usedLicenses}/${totalLicenses}`}
          description={
            totalLicenses > 0 ? `${((usedLicenses / totalLicenses) * 100).toFixed(1)}% ocupação` : "Sem dados de licença"
          }
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Escolas em Excesso"
          value={exceedingSchools.toString()}
          description="Licenças ultrapassadas"
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={exceedingSchools > 0 ? "destructive" : "default"}
        />
        <StatsCard
          title="Usuários Não Conformes"
          value={nonCompliantUsers.toString()}
          description="Fora da politica"
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={nonCompliantUsers > 0 ? "destructive" : "default"}
        />
        <StatsCard
          title="Domínios Não Maple Bear"
          value={nonMapleBearCount.toString()}
          description={`${domainCounts.slice(0, 2).map((d) => d.domain).join(", ")}`}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={nonMapleBearCount > 0 ? "destructive" : "default"}
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
                placeholder="Nome da escola, cluster, usuário, email ou perfil (estudante, professor, administrador)"
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
                <SelectItem value="Implantação">Implantação</SelectItem>
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
                <SelectValue placeholder="Status das Licenças" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Disponível">Disponível</SelectItem>
                <SelectItem value="Completo">Completa</SelectItem>
                <SelectItem value="Excedido">Excedida</SelectItem>
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
        <div className="flex justify-between items-center px-1 sm:px-2 py-4 text-sm text-muted-foreground">
          <Button
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-full px-4"
          >
            Anterior
          </Button>
          <span>
            {currentPage} / {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={currentPage === totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="rounded-full px-4"
          >
            Próxima
          </Button>
        </div>
      </div>

    </div>
  );
};
