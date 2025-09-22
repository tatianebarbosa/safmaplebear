import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Share2, 
  Eye, 
  FileText,
  Users,
  ExternalLink
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import { UsageFilters, CanvaUsageData } from '@/types/schoolLicense';

interface CanvaUsageDashboardProps {
  onNavigateToUsers: () => void;
}

// Mock data - replace with real data later
const generateMockUsageData = (): CanvaUsageData[] => {
  const schools = [
    'Maple Bear Centro', 'Maple Bear Vila Nova', 'Maple Bear Santana',
    'Maple Bear Moema', 'Maple Bear Alphaville', 'Maple Bear Campinas',
    'Maple Bear Santos', 'Maple Bear São José', 'Maple Bear Ribeirão',
    'Maple Bear Sorocaba'
  ];

  return schools.map((schoolName, index) => ({
    schoolId: `school-${index + 1}`,
    schoolName,
    designsCreated: Math.floor(Math.random() * 500) + 100,
    designsPublished: Math.floor(Math.random() * 200) + 50,
    designsShared: Math.floor(Math.random() * 150) + 25,
    designsViewed: Math.floor(Math.random() * 1000) + 300,
    topCreators: Array.from({ length: 3 }, (_, i) => ({
      name: `Usuário ${i + 1}`,
      email: `usuario${i + 1}@maplebear.com.br`,
      designs: Math.floor(Math.random() * 50) + 10,
    }))
  }));
};

const generateMockTimeData = (period: string) => {
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  return Array.from({ length: days }, (_, i) => ({
    date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000)
      .toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    designs: Math.floor(Math.random() * 100) + 20,
  }));
};

export const CanvaUsageDashboard = ({ onNavigateToUsers }: CanvaUsageDashboardProps) => {
  const [filters, setFilters] = useState<UsageFilters>({
    period: '30d',
    cluster: undefined,
    school: undefined,
  });
  const [usageData, setUsageData] = useState<CanvaUsageData[]>([]);
  const [timeData, setTimeData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsageData();
  }, [filters]);

  const loadUsageData = async () => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockData = generateMockUsageData();
    const mockTimeData = generateMockTimeData(filters.period);
    
    setUsageData(mockData);
    setTimeData(mockTimeData);
    setLoading(false);
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '7d': return 'Últimos 7 dias';
      case '30d': return 'Últimos 30 dias';
      case '90d': return 'Últimos 90 dias';
      default: return period;
    }
  };

  // Calculate totals
  const totals = usageData.reduce(
    (acc, school) => ({
      designs: acc.designs + school.designsCreated,
      published: acc.published + school.designsPublished,
      shared: acc.shared + school.designsShared,
      viewed: acc.viewed + school.designsViewed,
    }),
    { designs: 0, published: 0, shared: 0, viewed: 0 }
  );

  // Get top 10 schools for chart
  const topSchools = usageData
    .sort((a, b) => b.designsCreated - a.designsCreated)
    .slice(0, 10);

  // Get top creators across all schools
  const allCreators = usageData
    .flatMap(school => 
      school.topCreators.map(creator => ({
        ...creator,
        schoolName: school.schoolName,
      }))
    )
    .sort((a, b) => b.designs - a.designs)
    .slice(0, 10);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Análise de Uso do Canva</h2>
          <p className="text-muted-foreground">
            Acompanhe o desempenho e engajamento das escolas
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período</label>
              <Select 
                value={filters.period} 
                onValueChange={(value: any) => setFilters(prev => ({ ...prev, period: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cluster</label>
              <Select 
                value={filters.cluster || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  cluster: value === 'all' ? undefined : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos os clusters" />
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Escola</label>
              <Select 
                value={filters.school || 'all'} 
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  school: value === 'all' ? undefined : value 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas as escolas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {usageData.map(school => (
                    <SelectItem key={school.schoolId} value={school.schoolName}>
                      {school.schoolName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Designs"
          value={totals.designs.toLocaleString()}
          description={`Criados • ${getPeriodLabel(filters.period)}`}
          icon={<FileText className="h-4 w-4" />}
        />
        <StatsCard
          title="Publicados"
          value={totals.published.toLocaleString()}
          description={`${((totals.published / totals.designs) * 100).toFixed(1)}% dos designs`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatsCard
          title="Compartilhados"
          value={totals.shared.toLocaleString()}
          description={`Links gerados`}
          icon={<Share2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Visualizações"
          value={totals.viewed.toLocaleString()}
          description={`Total de views`}
          icon={<Eye className="h-4 w-4" />}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Line Chart - Designs por dia */}
        <Card>
          <CardHeader>
            <CardTitle>Designs Criados por Dia</CardTitle>
            <CardDescription>
              Evolução temporal da criação de designs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  labelFormatter={(label) => `Data: ${label}`}
                  formatter={(value) => [value, 'Designs']}
                />
                <Line 
                  type="monotone" 
                  dataKey="designs" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar Chart - Top 10 escolas */}
        <Card>
          <CardHeader>
            <CardTitle>Top 10 Escolas Mais Ativas</CardTitle>
            <CardDescription>
              Ranking por designs criados no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSchools} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="schoolName" type="category" width={120} />
                <Tooltip 
                  formatter={(value) => [value, 'Designs']}
                />
                <Bar 
                  dataKey="designsCreated" 
                  fill="hsl(var(--primary))"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Creators Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Top Criadores</CardTitle>
            <CardDescription>
              Usuários mais ativos no período selecionado
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            onClick={onNavigateToUsers}
            className="gap-2"
          >
            <Users className="h-4 w-4" />
            Ver Usuários
            <ExternalLink className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          {allCreators.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum criador encontrado no período selecionado.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {allCreators.map((creator, index) => (
                <div key={`${creator.email}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="min-w-8 justify-center">
                      #{index + 1}
                    </Badge>
                    <div>
                      <div className="font-medium">{creator.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {creator.email} • {creator.schoolName}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{creator.designs}</div>
                    <div className="text-sm text-muted-foreground">designs</div>
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