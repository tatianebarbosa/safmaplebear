import { useState, useCallback, useMemo } from "react";
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
import { formatNumber, formatDateBR } from "@/lib/formatters";
import StatsCard from "@/components/dashboard/StatsCard";
import { useSchoolLicenseStore } from "@/stores/schoolLicenseStore";
import { clearUploadOverrides } from "@/lib/canvaUsageService";
import { getAgentDisplayName } from "@/data/teamMembers";
import { useToast } from "@/hooks/use-toast";

export const CanvaMetricsDisplay = () => {
  const { overviewData } = useSchoolLicenseStore();
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

  const formatChangeDescription = (change?: number | null) => {
    if (!change) {
      return "Sem alteração";
    }
    const absValue = formatNumber(Math.abs(change));
    return `${change > 0 ? "+" : "-"}${absValue} vs última coleta`;
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
              Pessoas: {formatNumber(snapshot.totalPessoas)} • Designs:{" "}
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
              variant={overviewSummary.nonCompliantUsers > 0 ? "destructive" : "default"}
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
              variant={overviewSummary.schoolsAtCapacity > 0 ? "destructive" : "default"}
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

