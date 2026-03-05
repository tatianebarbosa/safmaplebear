import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { canvaCollector, CanvaData } from "@/lib/canvaDataCollector";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  Users,
  Zap,
  School,
  Palette,
  Share2,
  Link,
  TrendingUp,
  Building2,
  Shield,
} from "lucide-react";
import { formatNumber } from "@/lib/formatters";
import StatsCard from "@/components/dashboard/StatsCard";
import { useSchoolLicenseStore } from "@/stores/schoolLicenseStore";
import { loadModelUsageRanking, loadUsageReport, type ModelUsage } from "@/lib/canvaUsageService";

export const CanvaMetricsDisplay = () => {
  const overviewData = useSchoolLicenseStore((state) => state.overviewData);
  const usageData = useSchoolLicenseStore((state) => state.usageData);
  const setUsageData = useSchoolLicenseStore((state) => state.setUsageData);
  const overviewSummary = overviewData;
  const [canvaData, setCanvaData] = useState<CanvaData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usageLoading, setUsageLoading] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [topModels, setTopModels] = useState<ModelUsage[]>([]);
  const usageLoadedRef = useRef(false);
  const modelsLoadedRef = useRef(false);

  const formatChangeDescription = (change?: number | null) => {
    if (!change) {
      return "Sem alteracao";
    }
    const absValue = formatNumber(Math.abs(change));
    return `${change > 0 ? "+" : "-"}${absValue} vs atualização anterior`;
  };

  const carregarDados = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dados = await canvaCollector.obterDadosRecentes();
      if (dados) {
        setCanvaData(dados);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useAutoRefresh({
    onRefresh: carregarDados,
    interval: 5 * 60 * 1000,
    enabled: true,
    immediate: true,
  });

  const uniqueDomains = useMemo(
    () => overviewSummary?.topNonCompliantDomains?.length ?? 0,
    [overviewSummary]
  );
  const impactedUsers = useMemo(
    () => overviewSummary?.nonMapleBearDomains ?? 0,
    [overviewSummary]
  );

  useEffect(() => {
    if (usageLoadedRef.current || usageLoading || usageData.length) return;
    usageLoadedRef.current = true;
    setUsageLoading(true);
    loadUsageReport()
      .then((result) => {
        if (result?.usageData?.length) {
          setUsageData(result.usageData);
        }
      })
      .finally(() => setUsageLoading(false));
  }, [setUsageData, usageData.length, usageLoading]);

  useEffect(() => {
    if (modelsLoadedRef.current || modelsLoading || topModels.length) return;
    modelsLoadedRef.current = true;
    setModelsLoading(true);
    loadModelUsageRanking()
      .then((models) => setTopModels(models ?? []))
      .finally(() => setModelsLoading(false));
  }, [modelsLoading, topModels.length]);

  const topSharedModel = useMemo(() => {
    if (!topModels.length) return null;
    const byShared = [...topModels].sort((a, b) => (b.shared ?? 0) - (a.shared ?? 0));
    return byShared[0];
  }, [topModels]);

  const topCreators = useMemo(() => {
    const creators = usageData.flatMap((entry) => entry.topCreators ?? []);
    return creators.sort((a, b) => (b.designs ?? 0) - (a.designs ?? 0)).slice(0, 3);
  }, [usageData]);

  const topCreatorNames = topCreators.map((creator) => creator.name || "Criador").join(", ");
  const topCreatorsTooltip = useMemo(() => {
    if (!topCreators.length) return undefined;
    return topCreators
      .map(
        (creator, idx) =>
          `${idx + 1}. ${creator.name || "Criador"} (${formatNumber(creator.designs ?? 0)} designs)`
      )
      .join(" · ");
  }, [topCreators]);

  return (
    <div className="space-y-6">
      {loading && (
        <div className="rounded-lg border bg-muted/40 p-3 text-sm text-muted-foreground">
          Atualizando dados do Canva...
        </div>
      )}

      {overviewSummary && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              Resumo Operacional
            </h3>
            <p className="text-xs text-muted-foreground">Baseado nos dados oficiais sincronizados</p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            <StatsCard
              title="Usuarios Conformes"
              value={overviewSummary.compliantUsers.toString()}
              description={`${overviewSummary.complianceRate.toFixed(1)}% de conformidade`}
              icon={<TrendingUp className="h-4 w-4" />}
              tooltip={topCreatorsTooltip}
            />
            <StatsCard
              title="Usuarios fora da politica"
              value={overviewSummary.nonCompliantUsers.toString()}
              description={`${uniqueDomains} dominios externos (${impactedUsers} usuarios)`}
              icon={<AlertTriangle className="h-4 w-4" />}
              variant={overviewSummary.nonCompliantUsers > 0 ? "destructive" : "default"}
              tooltip={topCreatorsTooltip}
            />
            <StatsCard
              title="Escolas com usuarios"
              value={overviewSummary.schoolsWithUsers.toString()}
              description={`de ${overviewSummary.totalSchools} escolas oficiais`}
              icon={<School className="h-4 w-4" />}
              tooltip={topCreatorsTooltip}
            />
            <StatsCard
              title="Escolas em capacidade"
              value={overviewSummary.schoolsAtCapacity.toString()}
              description="Planeje redistribuicoes quando necessario"
              icon={<Building2 className="h-4 w-4" />}
              variant={overviewSummary.schoolsAtCapacity > 0 ? "destructive" : "default"}
              tooltip={topCreatorsTooltip}
            />
          </div>
        </div>
      )}

      {canvaData && (
        <>
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

          {canvaData.totalKits > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Palette className="h-5 w-5 text-muted-foreground" />
                Kits de Marca
              </h3>
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <StatsCard
                      title="Kits de Marca"
                      value={formatNumber(canvaData.totalKits)}
                      description="Total de kits ativos"
                      icon={<Palette className="h-4 w-4" />}
                    />
                    <StatsCard
                      title="Total Compartilhado"
                      value={formatNumber(canvaData.totalCompartilhado)}
                      description="Itens compartilhados nos kits"
                      icon={<Share2 className="h-4 w-4" />}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CanvaMetricsDisplay;

