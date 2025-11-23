import { useState, useCallback, useMemo, useRef, ChangeEvent } from "react";
import { canvaCollector, CanvaData, CanvaHistorico } from "@/lib/canvaDataCollector";
import { useAutoRefresh } from "@/hooks/useAutoRefresh";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  Upload,
} from "lucide-react";
import { formatNumber, formatDateBR } from "@/lib/formatters";
import { toast } from "sonner";
import StatsCard from "@/components/dashboard/StatsCard";
import { useSchoolLicenseStore } from "@/stores/schoolLicenseStore";
import { uploadMemberReport, uploadModelReport, getUploadInfo, clearUploadOverrides } from "@/lib/canvaUsageService";

export const CanvaMetricsDisplay = () => {
  const { overviewData } = useSchoolLicenseStore();
  const overviewSummary = overviewData;
  const [canvaData, setCanvaData] = useState<CanvaData | null>(null);
  const [historico, setHistorico] = useState<CanvaHistorico[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadingMembers, setUploadingMembers] = useState(false);
  const [uploadingModels, setUploadingModels] = useState(false);
  const [lastMemberUpload, setLastMemberUpload] = useState<string | null>(null);
  const [lastModelUpload, setLastModelUpload] = useState<string | null>(null);
  const memberFileRef = useRef<HTMLInputElement | null>(null);
  const modelFileRef = useRef<HTMLInputElement | null>(null);

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
      // Exibimos o ultimo upload registrado (replicado para todos os periodos)
      const memberInfo = getUploadInfo("members");
      const modelInfo = getUploadInfo("models");
      setLastMemberUpload(
        memberInfo ? `${memberInfo.filename} em ${new Date(memberInfo.uploadedAt).toLocaleString("pt-BR")}` : null
      );
      setLastModelUpload(
        modelInfo ? `${modelInfo.filename} em ${new Date(modelInfo.uploadedAt).toLocaleString("pt-BR")}` : null
      );
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

  const reverterAlteracao = async (historicoId: string) => {
    const reason = window.prompt("Informe uma justificativa para reverter o upload:", "");
    if (reason === null || reason.trim() === "") {
      toast.info("Reversao cancelada - justificativa obrigatoria.");
      return;
    }
    try {
      await canvaCollector.reverterAlteracao(historicoId, reason.trim());
      clearUploadOverrides();
      await carregarDados();
      window.dispatchEvent(new CustomEvent("canva-upload-refresh"));
      toast.success("Upload revertido com sucesso.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao reverter alteracao");
      toast.error("Erro ao reverter alteracao.");
    }
  };

  const handleMemberUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingMembers(true);
    try {
      const text = await file.text();
      await uploadMemberReport(file, "all", text);
      const summary = await canvaCollector.summarizeCsvContent(text);
      if (summary) {
        canvaCollector.registrarHistoricoUploadManual({
          filename: file.name,
          totalPessoas: summary.totalPessoas,
          designsCriados: summary.designsCriados,
        });
      }
      await carregarDados();
      window.dispatchEvent(new CustomEvent("canva-upload-refresh"));
      toast.success("Relatorio de membros atualizado (snapshot anterior preservado).");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao processar o CSV de membros.";
      setError(message);
      toast.error(message);
    } finally {
      setUploadingMembers(false);
      event.target.value = "";
    }
  };

  const handleModelUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingModels(true);
    try {
      const text = await file.text();
      await uploadModelReport(file, "all", text);
      const summary = await canvaCollector.summarizeCsvContent(text);
      if (summary) {
        canvaCollector.registrarHistoricoUploadManual({
          filename: file.name,
          totalPessoas: summary.totalPessoas,
          designsCriados: summary.designsCriados,
        });
      }
      await carregarDados();
      window.dispatchEvent(new CustomEvent("canva-upload-refresh"));
      toast.success("Relatorio de modelos atualizado (snapshot anterior preservado).");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Falha ao processar o CSV de modelos.";
      setError(message);
      toast.error(message);
    } finally {
      setUploadingModels(false);
      event.target.value = "";
    }
  };

  const renderHistoricoItem = (item: CanvaHistorico) => {
    const isUpload = item.usuarioAlteracao?.toLowerCase().includes("upload") || item.descricaoAlteracao?.toLowerCase().includes("upload");
    const uploadLabel = item.descricaoAlteracao?.replace("Upload CSV:", "").trim();
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
            {isUpload && (
              <p className="text-xs text-muted-foreground">
                Origem: Upload CSV {uploadLabel ? `(${uploadLabel})` : ""}
              </p>
            )}
          </div>
        </div>
        <Button onClick={() => reverterAlteracao(item.id)} variant="outline" size="sm" className="text-xs">
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
      {error && (
      <div className="flex items-center p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-destructive mr-3" />
        <p className="text-sm text-destructive">Erro: {error}</p>
      </div>
    )}

      <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Upload className="h-4 w-4 text-muted-foreground" />
            Atualizar relatorios (membros e modelos)
          </h3>
          <p className="text-xs text-muted-foreground">
            Envie os CSVs exportados do Canva (período 30 dias). Eles são aplicados em todas as visões (30d/3m/6m/12m) e o snapshot anterior é mantido para histórico.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={memberFileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleMemberUpload}
          />
          <input
            ref={modelFileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleModelUpload}
          />
          <Button onClick={() => memberFileRef.current?.click()} disabled={uploadingMembers} variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            {uploadingMembers ? "Enviando membros..." : "Subir membros CSV"}
          </Button>
          <Button onClick={() => modelFileRef.current?.click()} disabled={uploadingModels} variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            {uploadingModels ? "Enviando modelos..." : "Subir modelos CSV"}
          </Button>
        </div>
      </div>

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
            <div className="space-y-3">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Histórico de coletas
              </h3>
              <div className="space-y-2">
                {historico.map((item) => renderHistoricoItem(item))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CanvaMetricsDisplay;
