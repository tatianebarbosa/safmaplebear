import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StatsCard from "./StatsCard";
import SchoolCard from "./SchoolCard";
import { School, Users, Zap, TrendingUp, Search, Filter } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

// Mock data
const mockStats = {
  totalSchools: 24,
  totalUsers: 1247,
  activeUsers: 892,
  utilizationRate: 71.5,
};

const mockSchools = [
  {
    id: "1",
    name: "Maple Bear Alphaville",
    location: "Barueri, SP",
    totalUsers: 85,
    activeUsers: 72,
    licenseStatus: "available" as const,
    priority: "high" as const,
  },
  {
    id: "2",
    name: "Maple Bear Vila Olímpia",
    location: "São Paulo, SP",
    totalUsers: 112,
    activeUsers: 95,
    licenseStatus: "complete" as const,
    priority: "medium" as const,
  },
  {
    id: "3",
    name: "Maple Bear Moema",
    location: "São Paulo, SP",
    totalUsers: 78,
    activeUsers: 82,
    licenseStatus: "excess" as const,
    priority: "high" as const,
  },
  {
    id: "4",
    name: "Maple Bear Pinheiros",
    location: "São Paulo, SP",
    totalUsers: 94,
    activeUsers: 67,
    licenseStatus: "available" as const,
    priority: "low" as const,
  },
];

const Dashboard = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");

  const filteredSchools = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return mockSchools.filter((school) => {
      const matchesSearch =
        school.name.toLowerCase().includes(normalizedSearch) ||
        school.location.toLowerCase().includes(normalizedSearch);

      if (activeFilter === "all") return matchesSearch;
      if (activeFilter === "high-priority")
        return matchesSearch && school.priority === "high";
      if (activeFilter === "excess")
        return matchesSearch && school.licenseStatus === "excess";
      if (activeFilter === "available")
        return matchesSearch && school.licenseStatus === "available";

      return matchesSearch;
    });
  }, [activeFilter, searchTerm]);

  const handleViewSchoolDetails = (schoolId: string) => {
    // Implementar navegação ou modal para detalhes da escola
    void schoolId; // Para evitar aviso de parâmetro não utilizado
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <TrendingUp className="w-6 h-6 text-primary-dark" />
          </div>
          Maple Bear SAF - Dashboard Principal
        </h1>
        <p className="text-muted-foreground">
          Visão geral das operações e performance das escolas
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Escolas"
          value={mockStats.totalSchools}
          icon={<School className="h-4 w-4" />}
          trend={{ value: 4.2, isPositive: true }}
        />
        <StatsCard
          title="Total de Usuários"
          value={mockStats.totalUsers.toLocaleString()}
          icon={<Users className="h-4 w-4" />}
          trend={{ value: 7.8, isPositive: true }}
        />
        <StatsCard
          title="Usuários Ativos"
          value={mockStats.activeUsers.toLocaleString()}
          icon={<Zap className="h-4 w-4" />}
          trend={{ value: 5.3, isPositive: true }}
        />
        <StatsCard
          title="Taxa de Utilização"
          value={`${mockStats.utilizationRate}%`}
          icon={<TrendingUp className="h-4 w-4" />}
          trend={{ value: -1.2, isPositive: false }}
        />
      </div>

      {/* Filters and Search */}
      <Card className="card-maple">
        <CardHeader className="pb-4 sm:pb-5">
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros e Busca
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 sm:space-y-6 p-6 sm:p-8 pt-0">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por escola ou localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={activeFilter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("all")}
            >
              Todas
            </Button>
            <Button
              variant={activeFilter === "high-priority" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("high-priority")}
            >
              Alta Prioridade 🔥
            </Button>
            <Button
              variant={activeFilter === "excess" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("excess")}
            >
              Excesso de Usuários
            </Button>
            <Button
              variant={activeFilter === "available" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter("available")}
            >
              Licenças Disponíveis
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schools Grid */}
      <div className="space-y-0">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Escolas ({filteredSchools.length})
          </h2>
          <div className="flex gap-2">
            <StatusBadge variant="available">Disponível</StatusBadge>
            <StatusBadge variant="complete">Completo</StatusBadge>
            <StatusBadge variant="excess">Excesso</StatusBadge>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 items-stretch">
          {filteredSchools.map((school) => (
            <div key={school.id} className="min-w-[260px] h-full">
              <SchoolCard
                school={school}
                onViewDetails={handleViewSchoolDetails}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
