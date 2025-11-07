import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Building2,
  Download,
  Home
} from 'lucide-react';
import { toast } from 'sonner';
import StatsCard from '@/components/dashboard/StatsCard';
import { SchoolLicenseManagement } from './SchoolLicenseManagement';
// import { SchoolLicenseOverview } from './SchoolLicenseOverview'; // Não utilizado diretamente aqui
import { CanvaUsageDashboard } from './CanvaUsageDashboard';
import { CostManagementDashboard } from './CostManagementDashboard';
import { useSchoolLicenseStore } from '@/stores/schoolLicenseStore';
import { CanvaMetricsDisplay } from './CanvaMetricsDisplay';

const CanvaDashboard = () => {
  const navigate = useNavigate();
  const { 
    overviewData, 
    loading,
    loadOfficialData,
    getDomainCounts
  } = useSchoolLicenseStore();
  
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '3m' | '6m' | '12m'>('30d');

  useEffect(() => {
    loadOfficialData();
  }, [loadOfficialData]);

  const handleExportData = () => {
    if (!overviewData) return;
    
    const csvData = [
      ['Métrica', 'Valor'],
      ['Total de Usuários', overviewData.totalUsers.toString()],
      ['Usuários Conformes', overviewData.compliantUsers.toString()],
      ['Usuários Não Conformes', overviewData.nonCompliantUsers.toString()],
      ['Taxa de Conformidade', `${overviewData.complianceRate.toFixed(1)}%`],
      ['Total de Escolas', overviewData.totalSchools.toString()],
      ['Escolas com Usuários', overviewData.schoolsWithUsers.toString()],
    ].map(row => row.join(';')).join('\n');
    
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `canva-overview-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Dados exportados com sucesso');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!overviewData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Erro ao carregar dados do Canva.</p>
        <Button onClick={loadOfficialData} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
	    <div className="container mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <Home className="h-4 w-4" />
              Voltar ao Início
            </Button>
          </div>
	          <h1 className="text-3xl font-heading font-bold tracking-tight">Gestão Canva</h1>
          <p className="text-muted-foreground">
            Dados oficiais sincronizados • {overviewData.totalUsers} usuários ativos
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="12m">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportData} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
	      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <StatsCard
          title="Total de Usuários"
          value={overviewData.totalUsers.toString()}
          description={`${overviewData.schoolsWithUsers} escolas ativas`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Usuários Conformes"
          value={overviewData.compliantUsers.toString()}
          description={`${overviewData.complianceRate.toFixed(1)}% de conformidade`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatsCard
          title="Fora da Política"
          value={overviewData.nonCompliantUsers.toString()}
          description="Usuários com domínio não autorizado"
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={overviewData.nonCompliantUsers > 0 ? "destructive" : "default"}
        />
        <StatsCard
          title="Escolas Ativas"
          value={overviewData.totalSchools.toString()}
          description={`${overviewData.schoolsAtCapacity} em capacidade máxima`}
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Domínios Não Maple Bear"
          value={overviewData.nonMapleBearDomains.toString()}
          description={`${getDomainCounts().length} domínios diferentes`}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={overviewData.nonMapleBearDomains > 0 ? "destructive" : "default"}
        />
      </div>

      {/* Compliance Alert */}
      {overviewData.nonCompliantUsers > 0 && (
        <Card className="border-destructive/20 bg-destructive/5">
	          <CardHeader>
	            <div className="flex items-start gap-2">
	              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
	              <div className="space-y-1">
	                <CardTitle className="text-xl font-heading font-bold text-destructive">
	                  Alerta de Conformidade - Alto Risco
	                </CardTitle>
	                <CardDescription className="text-sm font-body">
	                  {overviewData.nonCompliantUsers} usuários com domínios não autorizados identificados
	                </CardDescription>
	              </div>
	            </div>
	          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {overviewData.topNonCompliantDomains.slice(0, 5).map(({ domain, count }) => (
                  <span key={domain} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-destructive text-destructive-foreground">
                    {domain} ({count})
                  </span>
                ))}
                {overviewData.topNonCompliantDomains.length > 5 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground">
                    +{overviewData.topNonCompliantDomains.length - 5} domínios
                  </span>
                )}
              </div>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => toast.info('Navegando para usuários não conformes')}
              >
                Ver Detalhes dos Usuários Não Conformes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
	        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="schools">Escolas</TabsTrigger>
          <TabsTrigger value="usage">Usos</TabsTrigger>
          <TabsTrigger value="costs">Custos</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <CanvaMetricsDisplay />
        </TabsContent>

        <TabsContent value="schools" className="space-y-6">
          <SchoolLicenseManagement />
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <CanvaUsageDashboard 
            onNavigateToUsers={() => {
              toast.info('Funcionalidade de usuários integrada na aba Escolas');
            }}
          />
        </TabsContent>

        <TabsContent value="costs" className="space-y-6">
          <CostManagementDashboard />
        </TabsContent>

        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Funcionalidades Avançadas</CardTitle>
              <CardDescription>
                Ferramentas para gestão avançada do Canva
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
	                <Card className="hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
	                  <CardHeader className="pb-3">
	                    <CardTitle className="text-base font-heading font-semibold">Sincronização de Dados</CardTitle>
	                  </CardHeader>
	                  <CardContent>
	                    <p className="text-sm text-muted-foreground mb-3 font-body">
	                      Dados atualizados automaticamente das planilhas oficiais
	                    </p>
	                    <div className="flex gap-2">
	                      <Button 
	                        size="sm" 
	                        onClick={loadOfficialData}
	                        disabled={loading}
	                      >
	                        {loading ? 'Carregando...' : 'Recarregar Dados'}
	                      </Button>
	                      <Button size="sm" variant="outline" onClick={handleExportData}>
	                        <Download className="h-3 w-3 mr-1" />
	                        Exportar
	                      </Button>
	                    </div>
	                  </CardContent>
	                </Card>
                
	                <Card className="hover:shadow-lg hover:shadow-primary/10 transition-all duration-300">
	                  <CardHeader className="pb-3">
	                    <CardTitle className="text-base font-heading font-semibold">Estatísticas Rápidas</CardTitle>
	                  </CardHeader>
	                  <CardContent>
	                    <div className="space-y-2 text-sm font-body">
	                      <div className="flex justify-between">
	                        <span>Taxa de Conformidade:</span>
	                        <span className="font-semibold text-primary">{overviewData.complianceRate.toFixed(1)}%</span>
	                      </div>
	                      <div className="flex justify-between">
	                        <span>Escolas com Usuários:</span>
	                        <span className="font-semibold text-primary">{overviewData.schoolsWithUsers}</span>
	                      </div>
	                      <div className="flex justify-between">
	                        <span>Principais Domínios:</span>
	                        <span className="font-semibold text-primary">{getDomainCounts().length}</span>
	                      </div>
	                    </div>
	                  </CardContent>
	                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CanvaDashboard;
