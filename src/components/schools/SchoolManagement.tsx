import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import SchoolLicenseCard from "./SchoolLicenseCard";
import StatsCard from "@/components/dashboard/StatsCard";
import { School, Users, AlertTriangle, CheckCircle, Search, Filter, RefreshCw, LayoutGrid, Rows } from "lucide-react";
import { School as SchoolType, loadSchoolData, getSchoolStats, calculateLicenseStatus } from "@/lib/schoolDataProcessor";
import { useToast } from "@/hooks/use-toast";
import { MAX_LICENSES_PER_SCHOOL } from "@/config/licenseLimits";
import { cn } from "@/lib/utils";

const SchoolManagement = () => {
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<SchoolType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [licenseFilter, setLicenseFilter] = useState("all");
  const [sortOption, setSortOption] = useState("usage-desc");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [focusAtRisk, setFocusAtRisk] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSchools();
  }, []);

  useEffect(() => {
    filterSchools();
  }, [schools, searchTerm, statusFilter, licenseFilter, sortOption, focusAtRisk]);

  const loadSchools = async () => {
    setLoading(true);
    setError(null);
    try {
      const schoolData = await loadSchoolData();
      setSchools(schoolData);
      toast({
        title: "Dados carregados com sucesso!",
        description: `${schoolData.length} escolas carregadas.`,
      });
    } catch (err) {
      console.error('Erro ao carregar escolas:', err);
      setError("Não encontramos os arquivos CSV dentro de public/data. Confirme se escolas.csv e usuarios_updated.csv estão disponíveis e compartilham o mesmo separador ';'.");
      toast({
        title: "Erro ao carregar dados",
        description: "Verifique se os arquivos CSV estão disponíveis em public/data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setLicenseFilter("all");
    setFocusAtRisk(false);
  };

  const filterSchools = () => {
    let filtered = [...schools];

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(school =>
        school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        school.state.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status da escola
    if (statusFilter !== "all") {
      filtered = filtered.filter(school => school.status === statusFilter);
    }

    // Filtro por status de licenças
    if (licenseFilter !== "all") {
      filtered = filtered.filter(school => {
        const licenseStatus = calculateLicenseStatus(school);
        return licenseStatus.status === licenseFilter;
      });
    }

    if (focusAtRisk) {
      filtered = filtered.filter(school => {
        const licenseStatus = calculateLicenseStatus(school);
        return licenseStatus.status === "warning" || licenseStatus.status === "excess";
      });
    }

    filtered.sort((a, b) => {
      if (sortOption === "name-asc") {
        return a.name.localeCompare(b.name);
      }

      if (sortOption === "licenses-remaining") {
        const aStatus = calculateLicenseStatus(a);
        const bStatus = calculateLicenseStatus(b);
        const aRemaining = aStatus.total - aStatus.used;
        const bRemaining = bStatus.total - bStatus.used;
        return aRemaining - bRemaining;
      }

      const aStatus = calculateLicenseStatus(a);
      const bStatus = calculateLicenseStatus(b);
      return bStatus.percentage - aStatus.percentage;
    });

    setFilteredSchools(filtered);
  };

  const handleViewDetails = (school: SchoolType) => {
    console.log('Ver detalhes da escola:', school);
    toast({
      title: `Detalhes de ${school.name}`,
      description: `${school.users.length} usuários cadastrados`,
    });
  };

  const handleEditLicenses = (school: SchoolType) => {
    console.log('Editar licenças da escola:', school);
    toast({
      title: `Editar licenças`,
      description: `Configure as licenças para ${school.name}. Para salvar alterações, conecte ao Supabase.`,
      variant: "destructive",
    });
  };

  const stats = getSchoolStats(schools);
  const appliedFilters = [
    searchTerm.trim() ? `Busca: "${searchTerm.trim()}"` : null,
    statusFilter !== "all" ? `Status: ${statusFilter}` : null,
    licenseFilter !== "all" ? `Licenças: ${licenseFilter}` : null,
    focusAtRisk ? "Filtro rápido: risco ativo" : null,
  ].filter((value): value is string => Boolean(value));
  const hasFiltersApplied = appliedFilters.length > 0;
  const resultsLayoutClass =
    viewMode === "grid"
      ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      : "flex flex-col gap-4";
  const atRiskSchools = schools.filter((school) => {
    const status = calculateLicenseStatus(school).status;
    return status === "warning" || status === "excess";
  });
  const highlightedAtRisk = atRiskSchools.slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center space-y-4">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Carregando dados das escolas...</p>
        </div>
      </div>
    );
  }

  if (!loading && error && schools.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96 px-4">
        <Card className="w-full max-w-3xl border-destructive/20 bg-destructive/5">
          <CardContent className="space-y-6 py-8">
            <div className="flex flex-col items-center text-center gap-3">
              <Badge variant="destructive" className="uppercase tracking-wide">
                Falha no carregamento
              </Badge>
              <AlertTriangle className="w-10 h-10 text-destructive" />
              <div>
                <h2 className="text-2xl font-semibold text-foreground">
                  Não foi possível carregar as escolas
                </h2>
                <p className="text-muted-foreground mt-2">
                  {error}
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border/60 bg-background/80 p-4">
                <p className="text-sm font-semibold text-foreground mb-1">O que verificar</p>
                <p className="text-sm text-muted-foreground">
                  Confirme se os arquivos foram exportados com separador ';' e se estão na pasta <code>public/data</code>.
                </p>
              </div>
              <div className="rounded-lg border border-border/60 bg-background/80 p-4">
                <p className="text-sm font-semibold text-foreground mb-1">IDs consistentes</p>
                <p className="text-sm text-muted-foreground">
                  As colunas de ID devem estar iguais entre escolas.csv e usuarios_updated.csv para combinar os dados.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button onClick={loadSchools}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <School className="w-6 h-6 text-primary" />
          </div>
          Gerenciamento de Escolas
        </h1>
        <p className="text-muted-foreground">
          Controle de licenças Canva por escola - Atualmente {stats.totalLicenses} licenças distribuídas
        </p>
      </div>

      {error && schools.length > 0 && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
              <div>
                <p className="font-semibold text-foreground">Não foi possível atualizar os CSVs</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
            <div className="flex gap-2 md:ml-auto">
              <Button variant="outline" size="sm" onClick={() => setError(null)}>
                Ocultar aviso
              </Button>
              <Button size="sm" onClick={loadSchools}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total de Escolas"
          value={stats.totalSchools}
          icon={<School className="h-4 w-4" />}
          trend={{ value: 5.2, isPositive: true }}
        />
        <StatsCard
          title="Licenças Utilizadas"
          value={`${stats.usedLicenses}/${stats.totalLicenses}`}
          icon={<Users className="h-4 w-4" />}
          trend={{ value: Math.round(stats.utilizationRate), isPositive: stats.utilizationRate < 90 }}
        />
        <StatsCard
          title="Escolas com Excesso"
          value={stats.schoolsWithExcess}
          icon={<AlertTriangle className="h-4 w-4" />}
          className={stats.schoolsWithExcess > 0 ? "border-destructive/20 bg-destructive-bg/10" : ""}
        />
        <StatsCard
          title="Taxa de Utilização"
          value={`${Math.round(stats.utilizationRate)}%`}
          icon={<CheckCircle className="h-4 w-4" />}
          trend={{ value: 8.5, isPositive: stats.utilizationRate < 85 }}
        />
      </div>

      {/* Filters */}
      <Card className="card-maple">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar escola, cidade..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status da Escola" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="Ativa">Ativas</SelectItem>
                <SelectItem value="Implantando">Implantando</SelectItem>
                <SelectItem value="Inativa">Inativas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={licenseFilter} onValueChange={setLicenseFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status das Licenças" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="warning">Atenção</SelectItem>
                <SelectItem value="full">Completo</SelectItem>
                <SelectItem value="excess">Excesso</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortOption} onValueChange={setSortOption}>
              <SelectTrigger>
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="usage-desc">Maior utilização</SelectItem>
                <SelectItem value="name-asc">Nome (A-Z)</SelectItem>
                <SelectItem value="licenses-remaining">Menos licenças livres</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadSchools} disabled={loading} variant="outline" className="md:justify-self-end">
              {loading ? 'Carregando...' : 'Atualizar'}
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                size="sm"
                variant={focusAtRisk ? "secondary" : "outline"}
                className={cn("gap-2", focusAtRisk && "bg-warning/10 text-warning")}
                onClick={() => setFocusAtRisk((prev) => !prev)}
              >
                <AlertTriangle className="w-4 h-4" />
                {focusAtRisk ? "Filtro risco ativo" : "Mostrar escolas em risco"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={!hasFiltersApplied}
                onClick={handleClearFilters}
              >
                Limpar filtros
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground hidden md:inline">Visualização</span>
              <div className="inline-flex overflow-hidden rounded-md border border-border">
                <Button
                  type="button"
                  size="icon"
                  variant={viewMode === "grid" ? "secondary" : "ghost"}
                  className="rounded-none"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant={viewMode === "list" ? "secondary" : "ghost"}
                  className="rounded-none"
                  onClick={() => setViewMode("list")}
                >
                  <Rows className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {appliedFilters.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {appliedFilters.map((label) => (
                <Badge key={label} variant="outline" className="bg-muted/40 text-xs font-normal px-3 py-1 rounded-full">
                  {label}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schools Grid */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Escolas</h2>
            <p className="text-sm text-muted-foreground">
              Mostrando {filteredSchools.length} de {schools.length} escolas
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline" className="bg-muted/40">
              {`Padrão: ${MAX_LICENSES_PER_SCHOOL} licenças por escola`}
            </Badge>
            <span>
              {focusAtRisk ? "Filtro rápido: risco ativo" : "Dados sincronizados localmente"}
            </span>
          </div>
        </div>
        
        <div className={resultsLayoutClass}>
          {filteredSchools.map((school) => (
            <SchoolLicenseCard
              key={school.id}
              school={school}
              onViewDetails={handleViewDetails}
              onEditLicenses={handleEditLicenses}
            />
          ))}
        </div>

        {filteredSchools.length === 0 && !loading && (
          <Card className="p-10 text-center border border-dashed border-muted-foreground/40">
            <div className="flex flex-col items-center gap-3">
              <Badge
                variant="outline"
                className={cn(
                  "uppercase tracking-wide",
                  hasFiltersApplied
                    ? "border-amber-200 text-amber-700 bg-amber-50"
                    : "border-primary/30 text-primary bg-primary/5"
                )}
              >
                {hasFiltersApplied ? "Filtros ativos" : "Nenhum dado"}
              </Badge>
              <School className="w-12 h-12 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-foreground">
                {hasFiltersApplied ? "Nenhuma escola corresponde aos filtros" : "Ainda não existem escolas carregadas"}
              </h3>
              <p className="text-muted-foreground max-w-xl">
                {hasFiltersApplied
                  ? "Revise os termos de busca ou redefina os filtros para visualizar todo o catálogo."
                  : "Importe os CSVs mais recentes em public/data e clique em Recarregar dados para sincronizar."}
              </p>
            </div>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              {hasFiltersApplied && (
                <Button variant="outline" onClick={handleClearFilters}>
                  Limpar filtros
                </Button>
              )}
              <Button onClick={loadSchools}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Recarregar dados
              </Button>
            </div>
          </Card>
        )}
      </div>
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-amber-100">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Escolas em atenção</p>
              <p className="text-xs text-muted-foreground">
                {atRiskSchools.length} {atRiskSchools.length === 1 ? "escola" : "escolas"} com licenças próximas do limite.
              </p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            {highlightedAtRisk.length ? (
              highlightedAtRisk.map((school) => {
                const status = calculateLicenseStatus(school);
                return (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-foreground" key={school.id}>
                    <p className="font-semibold">{school.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {status.used}/{status.total} licenças ({Math.round(status.percentage)}%)
                    </p>
                  </div>
                );
              })
            ) : (
              <div className="col-span-3 text-sm text-muted-foreground">
                Nenhuma escola está em alerta agora. Continue observando o uso médio nas próximas atualizações.
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={() => setFocusAtRisk(true)} disabled={atRiskSchools.length === 0}>
              Ver escolas em risco
            </Button>
            <p className="text-xs text-muted-foreground">
              Use esse atalho para filtrar rapidamente apenas as escolas com status de alerta ou excesso.
            </p>
          </div>
        </CardContent>
      </Card>
      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-primary/10">
              <AlertTriangle className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Gerenciamento Completo de Licenças
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Para funcionalidades avançadas como edição de limites de licenças, 
                histórico de alterações e notificações automáticas, conecte seu projeto ao Supabase.
              </p>
              <Button size="sm" className="btn-maple">
                Conectar Supabase
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SchoolManagement;



