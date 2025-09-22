import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SchoolLicenseCard from "./SchoolLicenseCard";
import StatsCard from "@/components/dashboard/StatsCard";
import { School, Users, AlertTriangle, CheckCircle, Search, Filter } from "lucide-react";
import { School as SchoolType, loadSchoolData, getSchoolStats, calculateLicenseStatus } from "@/lib/schoolDataProcessor";
import { useToast } from "@/hooks/use-toast";

const SchoolManagement = () => {
  const [schools, setSchools] = useState<SchoolType[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<SchoolType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [licenseFilter, setLicenseFilter] = useState("all");
  const { toast } = useToast();

  useEffect(() => {
    loadSchools();
  }, []);

  useEffect(() => {
    filterSchools();
  }, [schools, searchTerm, statusFilter, licenseFilter]);

  const loadSchools = async () => {
    setLoading(true);
    try {
      const schoolData = await loadSchoolData();
      setSchools(schoolData);
      toast({
        title: "Dados carregados com sucesso!",
        description: `${schoolData.length} escolas carregadas.`,
      });
    } catch (error) {
      console.error('Erro ao carregar escolas:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Verifique se os arquivos CSV estão disponíveis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterSchools = () => {
    let filtered = schools;

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
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

            <Button onClick={loadSchools} disabled={loading}>
              {loading ? 'Carregando...' : 'Atualizar'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schools Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            Escolas ({filteredSchools.length})
          </h2>
          <div className="text-sm text-muted-foreground">
            Padrão: 2 licenças por escola
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <Card className="p-12 text-center">
            <School className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma escola encontrada
            </h3>
            <p className="text-muted-foreground">
              Tente ajustar os filtros ou verificar se os dados foram carregados corretamente.
            </p>
          </Card>
        )}
      </div>

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