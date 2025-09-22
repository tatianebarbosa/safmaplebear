import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { BarChart3, TrendingUp, Users, School, Target, Calendar, Download } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";

interface AnalyticsData {
  voucherUsage: {
    total: number;
    used: number;
    pending: number;
    rate: number;
  };
  canvaUsers: {
    total: number;
    active: number;
    byRole: { [role: string]: number };
  };
  schoolPerformance: {
    totalSchools: number;
    activeSchools: number;
    byCluster: { [cluster: string]: number };
  };
  trends: {
    period: string;
    voucherGrowth: number;
    userGrowth: number;
    schoolGrowth: number;
  };
}

const InsightsAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<string>("30d");
  const [selectedMetric, setSelectedMetric] = useState<string>("vouchers");

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Simular dados de analytics
      const mockData: AnalyticsData = {
        voucherUsage: {
          total: 1250,
          used: 892,
          pending: 358,
          rate: 71.4
        },
        canvaUsers: {
          total: 820,
          active: 734,
          byRole: {
            'Estudante': 650,
            'Professor': 120,
            'Coordenador': 35,
            'Administrador': 15
          }
        },
        schoolPerformance: {
          totalSchools: 156,
          activeSchools: 142,
          byCluster: {
            'São Paulo': 45,
            'Rio de Janeiro': 28,
            'Minas Gerais': 32,
            'Paraná': 22,
            'Santa Catarina': 18,
            'Outros': 11
          }
        },
        trends: {
          period: selectedPeriod,
          voucherGrowth: 12.5,
          userGrowth: 8.3,
          schoolGrowth: 4.2
        }
      };

      setAnalyticsData(mockData);
      toast.success("Dados de análise carregados!");
    } catch (error) {
      toast.error("Erro ao carregar dados de análise");
    } finally {
      setLoading(false);
    }
  };

  const generateReport = () => {
    toast.success("Relatório de insights gerado!");
  };

  if (loading || !analyticsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Insights e Análises</h1>
          <p className="text-muted-foreground">
            Análise detalhada de performance e tendências
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
              <SelectItem value="1y">1 ano</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={generateReport}>
            <Download className="w-4 h-4 mr-2" />
            Gerar Relatório
          </Button>
        </div>
      </div>

      {/* Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Taxa de Uso Vouchers"
          value={`${analyticsData.voucherUsage.rate}%`}
          trend={{ value: analyticsData.trends.voucherGrowth, isPositive: true }}
          icon={<Target className="h-4 w-4" />}
        />
        <StatsCard
          title="Usuários Ativos"
          value={analyticsData.canvaUsers.active.toString()}
          trend={{ value: analyticsData.trends.userGrowth, isPositive: true }}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Escolas Ativas"
          value={analyticsData.schoolPerformance.activeSchools.toString()}
          trend={{ value: analyticsData.trends.schoolGrowth, isPositive: true }}
          icon={<School className="h-4 w-4" />}
        />
        <StatsCard
          title="Crescimento Geral"
          value={`${((analyticsData.trends.voucherGrowth + analyticsData.trends.userGrowth + analyticsData.trends.schoolGrowth) / 3).toFixed(1)}%`}
          trend={{ value: 8.3, isPositive: true }}
          icon={<TrendingUp className="h-4 w-4" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Uso de Vouchers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Análise de Vouchers
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total de Vouchers</span>
                <Badge variant="outline">{analyticsData.voucherUsage.total}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Vouchers Utilizados</span>
                <Badge variant="default">{analyticsData.voucherUsage.used}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pendentes</span>
                <Badge variant="secondary">{analyticsData.voucherUsage.pending}</Badge>
              </div>
            </div>
            
            <div className="pt-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Taxa de Utilização</span>
                <span className="text-sm text-muted-foreground">{analyticsData.voucherUsage.rate}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-primary h-2 rounded-full" 
                  style={{ width: `${analyticsData.voucherUsage.rate}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Distribuição por Função */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Usuários por Função
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analyticsData.canvaUsers.byRole).map(([role, count]) => (
                <div key={role} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{role}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{count}</Badge>
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div 
                        className="bg-primary h-1 rounded-full" 
                        style={{ width: `${(count / analyticsData.canvaUsers.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance por Cluster */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Escolas por Cluster
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(analyticsData.schoolPerformance.byCluster).map(([cluster, count]) => (
                <div key={cluster} className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{cluster}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{count}</Badge>
                    <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-1">
                      <div 
                        className="bg-secondary h-1 rounded-full" 
                        style={{ width: `${(count / analyticsData.schoolPerformance.totalSchools) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tendências */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Tendências - {selectedPeriod === '7d' ? '7 dias' : selectedPeriod === '30d' ? '30 dias' : selectedPeriod === '90d' ? '90 dias' : '1 ano'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Crescimento Vouchers</span>
                <Badge variant={analyticsData.trends.voucherGrowth > 0 ? "default" : "destructive"}>
                  {analyticsData.trends.voucherGrowth > 0 ? '+' : ''}{analyticsData.trends.voucherGrowth}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Crescimento Usuários</span>
                <Badge variant={analyticsData.trends.userGrowth > 0 ? "default" : "destructive"}>
                  {analyticsData.trends.userGrowth > 0 ? '+' : ''}{analyticsData.trends.userGrowth}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Crescimento Escolas</span>
                <Badge variant={analyticsData.trends.schoolGrowth > 0 ? "default" : "destructive"}>
                  {analyticsData.trends.schoolGrowth > 0 ? '+' : ''}{analyticsData.trends.schoolGrowth}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Executivo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Vouchers</h4>
              <p className="text-sm text-muted-foreground">
                Taxa de utilização de {analyticsData.voucherUsage.rate}% demonstra boa adesão. 
                {analyticsData.voucherUsage.pending} vouchers ainda pendentes de uso.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Usuários</h4>
              <p className="text-sm text-muted-foreground">
                {((analyticsData.canvaUsers.active / analyticsData.canvaUsers.total) * 100).toFixed(1)}% dos usuários estão ativos. 
                Crescimento de {analyticsData.trends.userGrowth}% no período.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-primary">Escolas</h4>
              <p className="text-sm text-muted-foreground">
                {analyticsData.schoolPerformance.activeSchools} de {analyticsData.schoolPerformance.totalSchools} escolas ativas. 
                São Paulo lidera com {analyticsData.schoolPerformance.byCluster['São Paulo']} unidades.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InsightsAnalytics;