import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import RankingTable from "./RankingTable";
import StatsCard from "@/components/dashboard/StatsCard";
import { Trophy, Users, TrendingUp, Star, Upload, Calendar } from "lucide-react";
import { loadReportData, compareRankings, CanvaUserData, RankingComparison } from "@/lib/csvProcessor";
import { useToast } from "@/hooks/use-toast";

const RankingDashboard = () => {
  const [currentPeriod, setCurrentPeriod] = useState<'30_dias' | '3_meses' | '6_meses' | '12_meses'>('30_dias');
  const [comparisonPeriod, setComparisonPeriod] = useState<'3_meses' | '6_meses' | '12_meses'>('3_meses');
  const [rankingData, setRankingData] = useState<RankingComparison | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const periodLabels = {
    '30_dias': '30 Dias',
    '3_meses': '3 Meses',
    '6_meses': '6 Meses',
    '12_meses': '12 Meses'
  };

  useEffect(() => {
    loadRankingData();
  }, [currentPeriod, comparisonPeriod]);

  const loadRankingData = async () => {
    setLoading(true);
    try {
      const [currentData, previousData] = await Promise.all([
        loadReportData(currentPeriod),
        loadReportData(comparisonPeriod)
      ]);

      const comparison = compareRankings(currentData, previousData);
      setRankingData(comparison);
      
      toast({
        title: "Dados carregados com sucesso!",
        description: `Ranking de ${periodLabels[currentPeriod]} vs ${periodLabels[comparisonPeriod]} atualizado.`,
      });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: "Erro ao carregar dados",
        description: "Verifique se os arquivos CSV estão disponíveis.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStats = () => {
    if (!rankingData) return null;

    const totalUsers = rankingData.current.length;
    const activeUsers = rankingData.current.filter(u => u.score > 0).length;
    const topPerformers = rankingData.changes.filter(c => c.trend === 'up').length;
    const newUsers = rankingData.changes.filter(c => c.trend === 'new').length;

    return { totalUsers, activeUsers, topPerformers, newUsers };
  };

  const stats = getStats();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      // Aqui implementaríamos o upload de novos CSVs
      toast({
        title: "Upload de arquivo",
        description: "Para persistir novos dados, conecte seu projeto ao Supabase.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          Ranking de Atividade Canva
        </h1>
        <p className="text-muted-foreground">
          Acompanhe o desempenho e evolução dos usuários nas atividades do Canva
        </p>
      </div>

      {/* Controls */}
      <Card className="card-maple">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Configurações de Período
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período Atual</label>
              <Select value={currentPeriod} onValueChange={(value: any) => setCurrentPeriod(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30_dias">Últimos 30 Dias</SelectItem>
                  <SelectItem value="3_meses">Últimos 3 Meses</SelectItem>
                  <SelectItem value="6_meses">Últimos 6 Meses</SelectItem>
                  <SelectItem value="12_meses">Últimos 12 Meses</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Comparar com</label>
              <Select value={comparisonPeriod} onValueChange={(value: any) => setComparisonPeriod(value)}>
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
                {loading ? 'Carregando...' : 'Atualizar Ranking'}
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
            title="Total de Usuários"
            value={stats.totalUsers}
            icon={<Users className="h-4 w-4" />}
          />
          <StatsCard
            title="Usuários Ativos"
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
            title="Novos Usuários"
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
              <Upload className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-2">
                Atualizações Automáticas
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                Para manter os rankings sempre atualizados e armazenar o histórico de dados, 
                conecte seu projeto ao Supabase. Isso permitirá uploads automáticos e 
                comparações históricas mais precisas.
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