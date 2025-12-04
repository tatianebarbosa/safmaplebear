import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { canvaCollector, CanvaData, CanvaHistorico } from "@/lib/canvaDataCollector";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Clock,
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
import { clearUploadOverrides } from "@/lib/canvaUsageService";
import { getAgentDisplayName } from "@/data/teamMembers";
import { useToast } from "@/hooks/use-toast";
import { loadModelUsageRanking, loadUsageReport, type ModelUsage } from "@/lib/canvaUsageService";

export const CanvaMetricsDisplay = () => {
  const overviewData = useSchoolLicenseStore((state) => state.overviewData);
  const usageData = useSchoolLicenseStore((state) => state.usageData);
  const setUsageData = useSchoolLicenseStore((state) => state.setUsageData);
  const { toast } = useToast();
  const overviewSummary = overviewData;
  const [canvaData, setCanvaData] = useState<CanvaData | null>(null);
  const [historico, setHistorico] = useState<CanvaHistorico[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [revertReason, setRevertReason] = useState("");
  const [pendingRevertId, setPendingRevertId] = useState<string | null>(null);
  const [reverting, setReverting] = useState(false);
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
    return `${change > 0 ? "+" : "-"}${absValue} vs ultima coleta`;
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

  const reverterAlteracao = async () => {
    if (!pendingRevertId) return;
    if (!revertReason.trim()) {
      toast({
        title: "Justificativa obrigatoria",
        description: "Explique por que deseja reverter este upload.",
        variant: "warning",
      });
      return;
    }
    setReverting(true);
    try {
      await canvaCollector.reverterAlteracao(pendingRevertId, revertReason.trim());
      clearUploadOverrides();
      await carregarDados();
      window.dispatchEvent(new CustomEvent("canva-upload-refresh"));
      toast({
        title: "Upload revertido com sucesso.",
        variant: "success",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao reverter alteracao");
      toast({
        title: "Erro ao reverter alteracao.",
        variant: "destructive",
      });
    } finally {
      setReverting(false);
      setRevertDialogOpen(false);
      setPendingRevertId(null);
      setRevertReason("");
    }
  };

  const formatActor = (actor?: string) => {
    if (!actor) return { label: "Desconhecido" };
    const trimmed = actor.trim();
    const email = /\S+@\S+\.\S+/.test(trimmed) ? trimmed : undefined;
    const base = trimmed.split("@")[0] || trimmed;
    const baseToken = base.split(/[.\s]/)[0] || base;
    const friendly =
      getAgentDisplayName(base) ||
      getAgentDisplayName(baseToken) ||
      (base ? base.charAt(0).toUpperCase() + base.slice(1) : undefined);
    return { label: friendly || trimmed, email };
  };

  const renderHistoricoItem = (item: CanvaHistorico) => {
    const isUpload = item.usuarioAlteracao?.toLowerCase().includes("upload") || item.descricaoAlteracao?.toLowerCase().includes("upload");
    const uploadLabel = item.descricaoAlteracao?.replace("Upload CSV:", "").trim();
    const uploadKind =
      item.uploadType === "members"
        ? "membros"
        : item.uploadType === "models"
        ? "modelos"
        : undefined;
    const snapshot = item.data ?? {
      totalPessoas: item.totalPessoas,
      designsCriados: item.designsCriados,
    };

    return (
      <div
        key={item.id}
        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">
              Coletado em: {new Date(item.timestamp).toLocaleString("pt-BR")}
            </p>
            <p className="text-xs text-muted-foreground">
              Pessoas: {formatNumber(snapshot.totalPessoas)}  Designs:{" "}
              {formatNumber(snapshot.designsCriados)}
            </p>
            <p className="text-xs text-muted-foreground">
              {(() => {
                const actor = formatActor(item.usuarioAlteracao);
                return `Por: ${actor.label}${actor.email ? ` (${actor.email})` : ""}${
                  item.descricaoAlteracao ? ` - ${item.descricaoAlteracao}` : ""
                }`;
              })()}
            </p>
            {isUpload && (
              <p className="text-xs text-muted-foreground">
                Origem: Upload CSV{uploadKind ? ` de ${uploadKind}` : ""} {uploadLabel ? `(${uploadLabel})` : ""}
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={() => {
            setPendingRevertId(item.id);
            setRevertReason("");
            setRevertDialogOpen(true);
          }}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Reverter
        </Button>
      </div>
    );
  };

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

  const usageTotals = useMemo(() => {
    if (!usageData.length) return null;
    return usageData.reduce(
      (acc, item) => {
        acc.designsCreated += item.designsCreated ?? 0;
        acc.designsPublished += item.designsPublished ?? 0;
        acc.designsShared += item.designsShared ?? 0;
        return acc;
      },
      { designsCreated: 0, designsPublished: 0, designsShared: 0 }
    );
  }, [usageData]);

  const shareRate = useMemo(() => {
    if (!usageTotals?.designsCreated) return null;
    return (usageTotals.designsShared / usageTotals.designsCreated) * 100;
  }, [usageTotals]);

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

      {(usageTotals || usageLoading) && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Share2 className="h-5 w-5 text-muted-foreground" />
              Uso do Canva
            </h3>
            <p className="text-xs text-muted-foreground">Cards resumidos com dados de uso e destaques</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatsCard
              title="Designs criados"
              value={usageTotals ? formatNumber(usageTotals.designsCreated) : "Carregando..."}
              description="Soma dos relatórios mais recentes"
              icon={<Palette className="h-4 w-4" />}
              tooltip={topCreatorsTooltip}
              className="min-h-[240px]"
            />
            <StatsCard
              title="Links compartilhados"
              value={usageTotals ? formatNumber(usageTotals.designsShared) : "Carregando..."}
              description={
                usageTotals && shareRate !== null
                  ? `${formatNumber(shareRate)}% em relacao aos criados`
                  : "Sem base para percentual"
              }
              icon={<Link className="h-4 w-4" />}
              tooltip={topCreatorsTooltip}
              className="min-h-[240px]"
            />
            <StatsCard
              title="Destaques de criadores"
              value={topCreators.length ? topCreators[0].name || "Top criador" : "Sem criadores"}
              description={
                topCreators.length
                  ? `Top 3: ${topCreatorNames}`
                  : "Nenhum criador disponivel nas coletas"
              }
              tooltip={
                topCreatorsTooltip
              }
              icon={<Users className="h-4 w-4" />}
              className="min-h-[240px]"
            />
            <StatsCard
              title="Arte mais compartilhada"
              value={
                modelsLoading
                  ? "Carregando..."
                  : topSharedModel?.modelName || "Sem dados de artes"
              }
              description={
                modelsLoading
                  ? ""
                  : topSharedModel
                  ? `${formatNumber(topSharedModel.shared ?? 0)} compartilhamentos`
                  : "Nenhum registro de compartilhamento"
              }
              icon={<Palette className="h-4 w-4" />}
              tooltip={topCreatorsTooltip}
              className="min-h-[240px]"
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

          {historico.length > 0 && (
            <Card className="border-border/70 shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <h3 className="text-lg font-semibold">Historico de coletas</h3>
                </div>
                <div className="space-y-2 max-h-[520px] overflow-y-auto rounded-xl border bg-muted/30 p-2 glass-scrollbar">
                  {historico.map((item) => renderHistoricoItem(item))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reverter upload</DialogTitle>
            <DialogDescription>
              Informe uma justificativa para reverter o snapshot e restaurar o estado anterior.
            </DialogDescription>
          </DialogHeader>
          <div className="modal__body space-y-3">
            <Input
              autoFocus
              placeholder="Ex.: CSV incorreto, data de coleta errada..."
              value={revertReason}
              onChange={(e) => setRevertReason(e.target.value)}
              disabled={reverting}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevertDialogOpen(false)} disabled={reverting}>
              Cancelar
            </Button>
            <Button onClick={reverterAlteracao} disabled={reverting}>
              {reverting ? "Revertendo..." : "Confirmar reversao"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CanvaMetricsDisplay;

