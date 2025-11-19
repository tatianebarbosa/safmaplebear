import { useState, useCallback } from 'react';
import { canvaCollector, CanvaData, CanvaHistorico } from '@/lib/canvaDataCollector';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, RefreshCw, Users, Zap, Briefcase, GraduationCap, School, Palette, Share2, Link, TrendingUp, Building2, Shield } from 'lucide-react';
import { formatNumber, formatDateBR } from '@/lib/formatters';
import { toast } from 'sonner';
import type { CanvaOverviewData } from '@/types/officialData';
import StatsCard from '@/components/dashboard/StatsCard';

/**
 * Componente para exibir todas as métricas do Canva de forma profissional
 */
type CanvaMetricsDisplayProps = {
  overviewSummary?: CanvaOverviewData | null;
};

export const CanvaMetricsDisplay = ({ overviewSummary }: CanvaMetricsDisplayProps) => {
  const [canvaData, setCanvaData] = useState<CanvaData | null>(null);
  const [historico, setHistorico] = useState<CanvaHistorico[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatChangeDescription = (change?: number | null) => {
    if (!change) {
      return 'Sem alteração';
    }
    const absValue = formatNumber(Math.abs(change));
    return `${change > 0 ? '+' : '-'}${absValue} vs última coleta`;
  };

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dados = await canvaCollector.obterDadosRecentes();
      if (dados) {
        setCanvaData(dados);
      }
      const hist = await canvaCollector.obterHistorico();
      setHistorico(hist);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh a cada 5 minutos
  useAutoRefresh({
    onRefresh: carregarDados,
    interval: 5 * 60 * 1000, // 5 minutos
    enabled: true,
    immediate: true
  });

  const coletarDadosAgora = async () => {
    setLoading(true);
    setError(null);
    try {
      const novosDados = await canvaCollector.coletarDadosCanva();
      setCanvaData(novosDados);
      // Recarrega o histórico
      const hist = await canvaCollector.obterHistorico();
      setHistorico(hist);
      toast.success('Dados do Canva atualizados com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao coletar dados');
      toast.error('Erro ao coletar dados do Canva.');
    } finally {
      setLoading(false);
    }
  };

  const reverterAlteracao = async (historicoId: string) => {
    try {
      await canvaCollector.reverterAlteracao(historicoId);
      // Recarrega os dados
      await carregarDados();
      toast.success('Alteração revertida com sucesso!');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reverter alteração');
      toast.error('Erro ao reverter alteração.');
    }
  };

  const renderHistoricoItem = (item: CanvaHistorico) => {
    const snapshot = item.data ?? {
      totalPessoas: item.totalPessoas,
      designsCriados: item.designsCriados
    };

    return (
      <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Coletado em: {new Date(item.timestamp).toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">Pessoas: {formatNumber(snapshot.totalPessoas)} • Designs: {formatNumber(snapshot.designsCriados)}</p>
          </div>
        </div>
        <Button 
          onClick={() => reverterAlteracao(item.id)} 
          variant="outline" 
          size="sm"
          className="text-xs"
        >
          Reverter
        </Button>
      </div>
    );
  };

  const uniqueDomains = overviewSummary?.topNonCompliantDomains?.length ?? 0;
  const impactedUsers = overviewSummary?.nonMapleBearDomains ?? 0;

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex items-center p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-destructive mr-3" />
          <p className="text-sm text-destructive">⚠️ {error}</p>
        </div>
      )}

      {overviewSummary && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              Resumo Operacional
            </h3>
            <p className="text-xs text-muted-foreground">
              Baseado nos dados oficiais sincronizados
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatsCard
              title="Usuários Conformes"
              value={overviewSummary.compliantUsers.toString()}
              description={`${overviewSummary.complianceRate.toFixed(1)}% de conformidade`}
              icon={<TrendingUp className="h-4 w-4" />}
            />
            <StatsCard
              title="Usuários fora da política"
              value={overviewSummary.nonCompliantUsers.toString()}
              description={`${uniqueDomains} domínios externos (${impactedUsers} usuários)`}
              icon={<AlertTriangle className="h-4 w-4" />}
              variant={overviewSummary.nonCompliantUsers > 0 ? 'destructive' : 'default'}
            />
            <StatsCard
              title="Escolas com usuários"
              value={overviewSummary.schoolsWithUsers.toString()}
              description={`de ${overviewSummary.totalSchools} escolas oficiais`}
              icon={<School className="h-4 w-4" />}
            />
            <StatsCard
              title="Escolas em capacidade"
              value={overviewSummary.schoolsAtCapacity.toString()}
              description="Planeje redistribuições quando necessário"
              icon={<Building2 className="h-4 w-4" />}
              variant={overviewSummary.schoolsAtCapacity > 0 ? 'destructive' : 'default'}
            />
          </div>
        </div>
      )}

      {canvaData && (
        <>
          {/* Seção de Atividades */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-muted-foreground" />
              Atividades
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Designs Criados"
                value={formatNumber(canvaData.designsCriados)}
                description={formatChangeDescription(canvaData.designsCriadosCrescimento)}
                icon={<Palette className="h-4 w-4" />}
              />
              <StatsCard
                title="Total Publicado"
                value={formatNumber(canvaData.totalPublicado)}
                description={formatChangeDescription(canvaData.totalPublicadoCrescimento ?? 0)}
                icon={<Share2 className="h-4 w-4" />}
              />
              <StatsCard
                title="Total Compartilhado"
                value={formatNumber(canvaData.totalCompartilhado)}
                description={formatChangeDescription(canvaData.totalCompartilhadoCrescimento ?? 0)}
                icon={<Link className="h-4 w-4" />}
              />
              <StatsCard
                title="Membros Ativos"
                value={formatNumber(canvaData.membrosAtivos)}
                description={formatChangeDescription(canvaData.membrosAtivosCrescimento)}
                icon={<Users className="h-4 w-4" />}
              />
            </div>
          </div>

          {/* Seção de Kits de Marca */}
          {canvaData.totalKits > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Palette className="h-5 w-5 text-muted-foreground" />
                Kits de Marca
              </h3>
              <Card>
                <CardContent className="p-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="p-2 text-left font-semibold">Kit de Marca</th>
                          <th className="p-2 text-left font-semibold">Aplicado</th>
                          <th className="p-2 text-left font-semibold">Criado</th>
                          <th className="p-2 text-left font-semibold">Última Atualização</th>
                        </tr>
                      </thead>
                      <tbody>
                        {canvaData.kits && canvaData.kits.map((kit, idx) => (
                          <tr key={idx} className="border-b last:border-b-0 hover:bg-muted/50">
                            <td className="p-2 font-medium">{kit.nome}</td>
                            <td className="p-2">{kit.aplicado}</td>
                            <td className="p-2">{formatDateBR(kit.criado)}</td>
                            <td className="p-2">{formatDateBR(kit.ultimaAtualizacao)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Histórico de Coletas */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Histórico de Coletas
            </h3>
            <Card>
              <CardContent className="p-4 space-y-2">
                {historico.map(renderHistoricoItem)}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
