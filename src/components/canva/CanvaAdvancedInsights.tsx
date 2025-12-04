import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import StatsCard from '@/components/dashboard/StatsCard';
import { loadUsageReport, loadModelUsageRanking, ModelUsage, TimeSeriesPoint } from '@/lib/canvaUsageService';
import { filterRecentTimeSeries } from '@/lib/chartUtils';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, ReferenceLine } from 'recharts';
import { AlertTriangle, Activity, Sparkles, Database } from 'lucide-react';

type HistoryEvent = {
  id: number;
  timestamp: string;
  tipo: string;
  descricao: string;
  usuario: string;
  status: string;
  metadados?: {
    periodo?: string;
    usuarios_afetados?: number;
  };
};

const numberFormatter = new Intl.NumberFormat('pt-BR');

export const CanvaAdvancedInsights = () => {
  const [loading, setLoading] = useState(true);
  const [timeData, setTimeData] = useState<TimeSeriesPoint[]>([]);
  const [modelRanking, setModelRanking] = useState<ModelUsage[]>([]);
  const [history, setHistory] = useState<HistoryEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ timeSeries }, models, historyData] = await Promise.all([
          loadUsageReport('12m'),
          loadModelUsageRanking('12m'),
          fetch('/data/canva_history.json').then((res) => res.json()),
        ]);
        const cleanedSeries = filterRecentTimeSeries(timeSeries);
        setTimeData(cleanedSeries);
        setModelRanking(models.slice(0, 5));
        setHistory(historyData ?? []);
      } catch (err) {
        setError('Nao foi possivel carregar os dados avancados no momento.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const timelineInsights = useMemo(() => {
    if (!timeData.length) {
      return {
        total: 0,
        average: 0,
        bestPeriod: null as TimeSeriesPoint | null,
        momentum: 0,
      };
    }
    const total = timeData.reduce((sum, point) => sum + point.designs, 0);
    const average = total / timeData.length;
    const bestPeriod = timeData.reduce((prev, current) => (current.designs > (prev?.designs ?? 0) ? current : prev), timeData[0]);
    const [last, previous] = timeData.slice(-2);
    const momentum = previous ? ((last.designs - previous.designs) / previous.designs) * 100 : 0;
    return { total, average, bestPeriod, momentum };
  }, [timeData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <p className="text-sm text-muted-foreground">Carregando analises avancadas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/30 bg-destructive/5">
        <CardHeader className="flex flex-row items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <div>
            <CardTitle className="text-base font-semibold text-destructive">Falha ao carregar dados</CardTitle>
            <CardDescription className="text-sm text-destructive/80">{error}</CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total no periodo"
          value={numberFormatter.format(timelineInsights.total)}
          description="Designs em 12 meses"
          icon={<Activity className="h-4 w-4" />}
        />
        <StatsCard
          title="Media mensal"
          value={timelineInsights.average.toFixed(0)}
          description="Designs / mes"
          icon={<Sparkles className="h-4 w-4" />}
        />
        <StatsCard
          title="Melhor periodo"
          value={timelineInsights.bestPeriod?.period ?? ''}
          description={`${numberFormatter.format(timelineInsights.bestPeriod?.designs ?? 0)} designs`}
          icon={<Database className="h-4 w-4" />}
        />
        <StatsCard
          title="Momentum"
          value={`${timelineInsights.momentum.toFixed(1)}%`}
          description="Variacao ultimo vs. anterior"
          icon={<Activity className="h-4 w-4" />}
          variant={timelineInsights.momentum >= 0 ? 'default' : 'destructive'}
        />
      </div>

      <Card className="rounded-xl shadow-sm border-border/40">
        <CardHeader>
          <CardTitle>Trend de Designs (12 meses)</CardTitle>
          <CardDescription>Use para prever picos e planejar campanhas</CardDescription>
        </CardHeader>
        <CardContent>
          {timeData.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem registros para gerar a serie historica.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={timeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value: number) => [numberFormatter.format(value), 'Designs']} />
                <ReferenceLine
                  y={timelineInsights.average}
                  stroke="hsl(var(--muted-foreground))"
                  strokeDasharray="4 4"
                  label={{ position: 'right', value: 'Media', fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                />
                <Line type="monotone" dataKey="designs" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl shadow-sm border-border/40">
          <CardHeader>
            <CardTitle>Historico de Coletas & Automacao</CardTitle>
            <CardDescription>Monitore quando os dados foram atualizados e por quem</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma coleta registrada.</p>
            ) : (
              history.map((event) => (
                <div key={event.id} className="rounded-xl border p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{new Date(event.timestamp).toLocaleString('pt-BR')}</span>
                    <span className="text-xs text-muted-foreground">{event.tipo}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{event.descricao}</p>
                  {event.metadados?.periodo && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Periodo: {event.metadados.periodo}  Usuarios: {event.metadados.usuarios_afetados}
                    </p>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border-border/40">
          <CardHeader>
            <CardTitle>Modelos Estrategicos</CardTitle>
            <CardDescription>Top 5 modelos que concentraram maior uso anual</CardDescription>
          </CardHeader>
          <CardContent>
            {modelRanking.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum modelo disponivel.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={modelRanking}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="modelName" tick={{ fontSize: 12 }} interval={0} height={80} angle={-25} textAnchor="end" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => [numberFormatter.format(value), 'Usos']} />
                  <Bar dataKey="uses" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl shadow-sm border-border/40">
        <CardHeader>
          <CardTitle>Recomendacoes Automatizadas</CardTitle>
          <CardDescription>Ideias praticas para o time SAF agir sobre os dados</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Reforcar campanhas nos clusters com menor participacao, usando o comparativo da distribuicao.</li>
            <li>Oferecer reconhecimento aos criadores e escolas com melhor momentum para manter o ritmo.</li>
            <li>Planejar novas artes com base nos modelos mais consumidos, garantindo variedade por cluster.</li>
            <li>Monitorar eventos do historico de coletas para identificar lacunas de atualizacao.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CanvaAdvancedInsights;
