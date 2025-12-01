import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import RankingTable from "./RankingTable";
import StatsCard from "@/components/dashboard/StatsCard";
import {
  Trophy,
  Users,
  TrendingUp,
  Star,
  Upload,
  Calendar,
} from "lucide-react";
import {
  loadReportData,
  compareRankings,
  CanvaUserData,
  RankingComparison,
} from "@/lib/csvProcessor";
import { useToast } from "@/hooks/use-toast";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

const RankingDashboard = () => {
  const [currentPeriod, setCurrentPeriod] = useState<
    "30_dias" | "3_meses" | "6_meses" | "12_meses"
  >("30_dias");
  const [comparisonPeriod, setComparisonPeriod] = useState<
    "3_meses" | "6_meses" | "12_meses"
  >("3_meses");
  const [rankingData, setRankingData] = useState<RankingComparison | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const periodLabels = {
    "30_dias": "30 Dias",
    "3_meses": "3 Meses",
    "6_meses": "6 Meses",
    "12_meses": "12 Meses",
  };

  useEffect(() => {
    loadRankingData();
  }, [currentPeriod, comparisonPeriod]);

  const loadRankingData = async () => {
    setLoading(true);
    try {
      const [currentData, previousData] = await Promise.all([
        loadReportData(currentPeriod),
        loadReportData(comparisonPeriod),
      ]);

      const comparison = compareRankings(currentData, previousData);
      setRankingData(comparison);

      toast({
        title: "Dados carregados com sucesso!",
        description: `Ranking de ${periodLabels[currentPeriod]} vs ${periodLabels[comparisonPeriod]} atualizado.`,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      toast({
        title: "Erro ao carregar dados",
        description: `Verifique se os arquivos CSV esto dispon?veis. Detalhe: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    if (!rankingData) return null;

    const totalUsers = rankingData.current.length;
    const activeUsers = rankingData.current.filter((u) => u.score > 0).length;
    const topPerformers = rankingData.changes.filter(
      (c) => c.trend === "up"
    ).length;
    const newUsers = rankingData.changes.filter(
      (c) => c.trend === "new"
    ).length;

    return { totalUsers, activeUsers, topPerformers, newUsers };
  };

  const stats = getStats();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "text/csv") {
      // Aqui implementaramos o upload de novos CSVs
      toast({
        title: "Upload de arquivo",
        description:
          "Para persistir novos dados, conecte seu projeto ao Supabase.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-96">
        <LoadingSkeleton type="dashboard" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Trophy className="w-6 h-6 text-primary-dark" />
          </div>
          Ranking de Atividade Canva
        </h1>
        <p className="text-muted-foreground">
          Acompanhe o desempenho e evoluo dos usu?rios nas atividades do Canva
        </p>
      </div>

      {/* Controls */}
      <Card className="card-maple">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Configuraes de Perodo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Perodo Atual</label>
              <Select
                value={currentPeriod}
                onValueChange={(value: any) => setCurrentPeriod(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30_dias">ltimos 30 Dias</SelectItem>
                  <SelectItem value="3_meses">ltimos 3 Meses</SelectItem>
                  <SelectItem value="6_meses">ltimos 6 Meses</SelectItem>
                  <SelectItem value="12_meses">ltimos 12 Meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Comparar com</label>
              <Select
                value={comparisonPeriod}
                onValueChange={(value: any) => setComparisonPeriod(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3_meses">3 Meses</SelectItem>
                  <SelectItem value="6_meses">6 Meses</SelectItem>
                  <SelectItem value="12_meses">12 Meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={loadRankingData} disabled={loading}>
                {loading ? "Carregando..." : "Atualizar Ranking"}
              </Button>

              <Button variant="outline" className="relative">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <Upload className="w-4 h-4 mr-2" />
                Upload CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total de Usurios"
            value={stats.totalUsers}
            icon={<Users className="h-4 w-4" />}
          />
          <StatsCard
            title="Usurios Ativos"
            value={stats.activeUsers}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <StatsCard
            title="Em Crescimento"
            value={stats.topPerformers}
            icon={<Trophy className="h-4 w-4" />}
            className="priority-low"
          />
          <StatsCard
            title="Novos Usurios"
            value={stats.newUsers}
            icon={<Star className="h-4 w-4" />}
            className="priority-medium"
          />
        </div>
      )}

      {/* Ranking Table */}
      {rankingData && (
        <RankingTable changes={rankingData.changes} showComparison={true} />
      )}

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-2 rounded-full bg-primary/10">
              <Upload className="w-5 h-5 text-primary-dark" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Atualizaes Automticas
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Para manter os rankings sempre atualizados e armazenar o
                histrico de dados, conecte seu projeto ao Supabase. Isso
                permitir uploads automticos e comparaes histricas mais
                precisas.
              </p>
              <Button size="sm" className="btn-maple">
                Conectar Supabase
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingDashboard;
