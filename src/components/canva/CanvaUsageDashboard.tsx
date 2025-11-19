import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
  Share2,
  Eye,
  Users,
  ExternalLink,
  Calendar,
  Layers,
  Building2
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import { UsageFilters, CanvaUsageData } from '@/types/schoolLicense';
import { loadUsageReport, loadModelUsageRanking, ModelUsage, TimeSeriesPoint } from '@/lib/canvaUsageService';

interface CanvaUsageDashboardProps {
  onNavigateToUsers: () => void;
}

const periodLabel = (period: UsageFilters['period']) => {
  const labels: Record<UsageFilters['period'], string> = {
    '30d': 'Últimos 30 dias',
    '3m': 'Últimos 3 meses',
    '6m': 'Últimos 6 meses',
    '12m': 'Últimos 12 meses'
  };
  return labels[period] ?? period;
};

export const CanvaUsageDashboard = ({ onNavigateToUsers }: CanvaUsageDashboardProps) => {
  const [filters, setFilters] = useState<UsageFilters>({
    period: '12m',
    cluster: undefined,
    school: undefined,
  });
  const [usageData, setUsageData] = useState<CanvaUsageData[]>([]);
  const [timeData, setTimeData] = useState<TimeSeriesPoint[]>([]);
  const [modelRanking, setModelRanking] = useState<ModelUsage[]>([]);
  const clusterOptions = [
    { value: 'Implantação', label: 'Implantação' },
    { value: 'Alta Performance', label: 'Alta Performance' },
    { value: 'Potente', label: 'Potente' },
    { value: 'Desenvolvimento', label: 'Desenvolvimento' },
    { value: 'Alerta', label: 'Alerta' },
    { value: 'Outros', label: 'Outros/Implantação' }
  ];

  useEffect(() => {
    const load = async () => {
      const [{ usageData, timeSeries }, models] = await Promise.all([
        loadUsageReport(filters.period),
        loadModelUsageRanking(filters.period)
      ]);
      setUsageData(usageData);
      setTimeData(timeSeries);
      setModelRanking(models);
    };
    load();
  }, [filters.period]);

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
  const viewsPerDesign = totals.published ? totals.viewed / totals.published : 0;
  const designsPerSchool = filteredUsage.length ? totals.designs / filteredUsage.length : 0;

  const clusterBreakdown = useMemo(() => {
    const map = new Map<
      string,
      { cluster: string; schools: number; designs: number; published: number }
    >();
    filteredUsage.forEach((school) => {
      const key = school.cluster || 'Sem cluster';
      const entry = map.get(key) ?? { cluster: key, schools: 0, designs: 0, published: 0 };
      entry.schools += 1;
      entry.designs += school.designsCreated;
      entry.published += school.designsPublished;
      map.set(key, entry);
    });
    return Array.from(map.values()).sort((a, b) => b.designs - a.designs);
  }, [filteredUsage]);

  const topSchools = [...filteredUsage]
    .sort((a, b) => b.designsCreated - a.designsCreated)
    .slice(0, 10);

  const allCreators = filteredUsage
    .flatMap((school) =>
      school.topCreators.map((creator) => ({
        ...creator,
        schoolName: school.schoolName,
      }))
    )
    .sort((a, b) => b.designs - a.designs)
    .slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold">Análise de Uso do Canva</h2>
          <p className="text-sm text-muted-foreground">Acompanhe o desempenho e engajamento das escolas</p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Período de análise
            </Label>
            <Select
              value={filters.period}
              onValueChange={(value: UsageFilters['period']) => setFilters((prev) => ({ ...prev, period: value }))}
            >
              <SelectTrigger className="h-11 rounded-xl border border-border/50 bg-background text-sm font-medium">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="3m">Últimos 3 meses</SelectItem>
                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                <SelectItem value="12m">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Layers className="h-3.5 w-3.5" />
              Cluster
            </Label>
            <Select
              value={filters.cluster ?? 'all'}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, cluster: value === 'all' ? undefined : value }))}
            >
              <SelectTrigger className="h-11 rounded-xl border border-border/50 bg-background text-sm font-medium">
                <SelectValue placeholder="Selecione o cluster" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clusters</SelectItem>
                {clusterOptions.map((cluster) => (
                  <SelectItem key={cluster.value} value={cluster.value}>
                    {cluster.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              Escola
            </Label>
            <Select
              value={filters.school ?? 'all'}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, school: value === 'all' ? undefined : value }))}
            >
              <SelectTrigger className="h-11 rounded-xl border border-border/50 bg-background text-sm font-medium">
                <SelectValue placeholder="Todas as escolas" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">Todas as escolas</SelectItem>
                {schoolOptions.map((school) => (
                  <SelectItem key={school} value={school}>
                    {school}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <StatsCard title="Designs" value={totals.designs.toLocaleString()} description={periodLabel(filters.period)} icon={<Share2 className="h-4 w-4" />} />
        <StatsCard title="Publicados" value={totals.published.toLocaleString()} description="Designs publicados" icon={<Eye className="h-4 w-4" />} />
        <StatsCard title="Compartilhados" value={totals.shared.toLocaleString()} description="Links gerados" icon={<Share2 className="h-4 w-4" />} />
        <StatsCard title="Visualizações" value={totals.viewed.toLocaleString()} description="Total de views" icon={<Eye className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <StatsCard
          title="Taxa de Publicação"
          value={`${publicationRate.toFixed(1)}%`}
          description="Publicações vs designs criados"
          icon={<Share2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Taxa de Compartilhamento"
          value={`${shareRate.toFixed(1)}%`}
          description="Links vs publicações"
          icon={<ExternalLink className="h-4 w-4" />}
        />
        <StatsCard
          title="Views por Publicação"
          value={viewsPerDesign.toFixed(1)}
          description="Média de engajamento"
          icon={<Eye className="h-4 w-4" />}
        />
        <StatsCard
          title="Designs por Escola"
          value={designsPerSchool.toFixed(1)}
          description={`${filteredUsage.length} escolas filtradas`}
          icon={<Building2 className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl shadow-sm border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-medium">Designs Criados por Período</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Evolução temporal dos designs registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip
                  labelFormatter={(label) => `Período: ${label}`}
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

        <Card className="rounded-xl shadow-sm border-border/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl font-medium">Top 10 Escolas Mais Ativas</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Ranking por designs registrados no período
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topSchools}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="schoolName" type="category" width={140} />
                <Tooltip formatter={(value) => [value, 'Designs']} />
                <Bar
                  dataKey="designsCreated"
                  fill="hsl(var(--primary))"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-sm border-border/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl font-medium">Top Criadores</CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              Usuários mais ativos no período selecionado
            </CardDescription>
          </div>
          <Button variant="outline" onClick={onNavigateToUsers} className="gap-2">
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
                <div key={`${creator.email}-${index}`} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="min-w-8 justify-center text-xs font-medium">
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

      <Card className="rounded-xl shadow-sm border-border/40">
        <CardHeader>
          <CardTitle className="text-xl font-medium">Top Modelos Mais Utilizados</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Ranking das artes disponibilizadas pela equipe de marketing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {modelRanking.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Nenhum modelo registrado ainda.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {modelRanking.map((model, index) => (
                <div key={model.modelName} className="flex items-center justify-between p-3 border rounded-xl hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="min-w-8 justify-center text-xs font-medium">
                      #{index + 1}
                    </Badge>
                    <div>
                      <div className="font-medium">{model.modelName}</div>
                      <div className="text-sm text-muted-foreground">
                        {model.owner}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{model.uses}</div>
                    <div className="text-xs text-muted-foreground">usos</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-border/40">
        <CardHeader>
          <CardTitle className="text-xl font-medium">Distribuição por Cluster</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            Entenda onde o engajamento está concentrado
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clusterBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma escola disponível para os filtros escolhidos.</p>
          ) : (
            <div className="space-y-2">
              {clusterBreakdown.map((cluster) => (
                <div key={cluster.cluster} className="flex items-center justify-between rounded-xl border p-3 hover:bg-muted/40 transition-colors">
                  <div>
                    <p className="font-medium">{cluster.cluster}</p>
                    <p className="text-xs text-muted-foreground">{cluster.schools} escolas</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{cluster.designs.toLocaleString()} designs</p>
                    <p className="text-xs text-muted-foreground">{cluster.published.toLocaleString()} publicados</p>
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
