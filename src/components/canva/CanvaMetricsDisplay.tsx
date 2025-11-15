import React, { useState } from 'react';
import { canvaCollector, CanvaData, CanvaHistorico } from '@/lib/canvaDataCollector';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle, Clock, Download, RefreshCw, User, Users, Zap, Briefcase, GraduationCap, School, Palette, Share2, Link, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { formatNumber, formatDateBR } from '@/lib/formatters';
import { toast } from 'sonner';

/**
 * Componente para exibir todas as métricas do Canva de forma profissional
 */
export const CanvaMetricsDisplay: React.FC = () => {
  const [canvaData, setCanvaData] = useState<CanvaData | null>(null);
  const [historico, setHistorico] = useState<CanvaHistorico[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarDados = React.useCallback(async () => {
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

  const renderMetricCard = (
    title: string,
    value: number,
    icon: React.ReactNode,
    change?: number,
    variant: 'default' | 'destructive' | 'success' | 'warning' = 'default'
  ) => {
    const changeText = change !== undefined && change !== 0
      ? `${change > 0 ? '📈 +' : '📉 '}${formatNumber(Math.abs(change))}`
      : 'Sem alteração';

    const changeColor = change === undefined || change === 0
      ? 'text-muted-foreground'
      : change > 0
        ? 'text-green-600'
        : 'text-red-600';

    const iconColor = variant === 'destructive' ? 'text-red-500' :
                      variant === 'success' ? 'text-green-500' :
                      variant === 'warning' ? 'text-yellow-500' :
                      'text-primary';

    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <div className={iconColor}>{icon}</div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(value)}</div>
          <p className={`text-xs ${changeColor}`}>
            {changeText}
          </p>
        </CardContent>
      </Card>
    );
  };

  const renderHistoricoItem = (item: CanvaHistorico) => (
    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">Coletado em: {new Date(item.timestamp).toLocaleString('pt-BR')}</p>
          <p className="text-xs text-muted-foreground">Pessoas: {formatNumber(item.data.totalPessoas)} • Designs: {formatNumber(item.data.designsCriados)}</p>
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

  return (
    <div className="space-y-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Métricas Canva
            </CardTitle>
            <CardDescription>Acompanhamento em tempo real das atividades e licenças</CardDescription>
          </div>
          <Button onClick={coletarDadosAgora} disabled={loading} className="gap-2">
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? 'Coletando...' : 'Atualizar Agora'}
          </Button>
        </CardHeader>
      </Card>

      {error && (
        <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
          <p className="text-sm text-red-800">⚠️ {error}</p>
        </div>
      )}

      {canvaData && (
        <>
          {/* Seção de Pessoas e Licenças */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              Pessoas e Licenças
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {renderMetricCard(
                'Total de Pessoas',
                canvaData.totalPessoas,
                <User className="h-4 w-4" />,
                canvaData.mudancas?.totalPessoas
              )}
              {renderMetricCard(
                'Administradores',
                canvaData.administradores,
                <Briefcase className="h-4 w-4" />,
                canvaData.mudancas?.administradores
              )}
              {renderMetricCard(
                'Professores',
                canvaData.professores,
                <School className="h-4 w-4" />,
                canvaData.mudancas?.professores
              )}
              {renderMetricCard(
                'Alunos',
                canvaData.alunos,
                <GraduationCap className="h-4 w-4" />,
                canvaData.mudancas?.alunos
              )}
            </div>
          </div>

          {/* Seção de Atividades */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-muted-foreground" />
              Atividades
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {renderMetricCard(
                'Designs Criados',
                canvaData.designsCriados,
                <Palette className="h-4 w-4" />,
                canvaData.designsCriadosCrescimento,
                canvaData.designsCriadosCrescimento > 0 ? 'success' : 'default'
              )}
              {renderMetricCard(
                'Total Publicado',
                canvaData.totalPublicado,
                <Share2 className="h-4 w-4" />,
                canvaData.totalPublicadoCrescimento,
                canvaData.totalPublicadoCrescimento > 0 ? 'success' : 'default'
              )}
              {renderMetricCard(
                'Total Compartilhado',
                canvaData.totalCompartilhado,
                <Link className="h-4 w-4" />,
                canvaData.totalCompartilhadoCrescimento,
                canvaData.totalCompartilhadoCrescimento > 0 ? 'success' : 'default'
              )}
              {renderMetricCard(
                'Membros Ativos',
                canvaData.membrosAtivos,
                <Users className="h-4 w-4" />,
                canvaData.membrosAtivosCrescimento,
                canvaData.membrosAtivosCrescimento > 0 ? 'success' : 'default'
              )}
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
