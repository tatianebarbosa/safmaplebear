import { Trophy, TrendingUp, Share, Eye, Palette } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserRanking } from "@/lib/canvaDataProcessor";

interface CanvaRankingsProps {
  rankings: {
    mostActive: UserRanking[];
    mostCreative: UserRanking[];
    mostShared: UserRanking[];
    mostViewed: UserRanking[];
  };
}

export const CanvaRankings = ({ rankings }: CanvaRankingsProps) => {
  const getRankingIcon = (category: UserRanking['category']) => {
    switch (category) {
      case 'most_active': return TrendingUp;
      case 'most_creative': return Palette;
      case 'most_shared': return Share;
      case 'most_viewed': return Eye;
      default: return Trophy;
    }
  };

  const getRankingTitle = (category: UserRanking['category']) => {
    switch (category) {
      case 'most_active': return 'Mais Ativos';
      case 'most_creative': return 'Mais Criativos';
      case 'most_shared': return 'Mais Compartilharam';
      case 'most_viewed': return 'Mais Visualizados';
      default: return 'Ranking';
    }
  };

  const getRankingDescription = (category: UserRanking['category']) => {
    switch (category) {
      case 'most_active': return 'Usuários com maior atividade geral';
      case 'most_creative': return 'Usuários que mais criaram designs';
      case 'most_shared': return 'Usuários que mais compartilharam';
      case 'most_viewed': return 'Usuários com designs mais visualizados';
      default: return 'Ranking de usuários';
    }
  };

  const getRankingColor = (rank: number) => {
    if (rank === 1) return 'text-yellow-600';
    if (rank === 2) return 'text-gray-500';
    if (rank === 3) return 'text-amber-600';
    return 'text-muted-foreground';
  };

  const getRankingBadge = (rank: number) => {
    if (rank === 1) return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">🏆 1º</Badge>;
    if (rank === 2) return <Badge variant="secondary" className="bg-gray-100 text-gray-800">🥈 2º</Badge>;
    if (rank === 3) return <Badge variant="outline" className="bg-amber-50 text-amber-800">🥉 3º</Badge>;
    return <Badge variant="outline">{rank}º</Badge>;
  };

  const RankingList = ({ rankingData, category }: { rankingData: UserRanking[], category: UserRanking['category'] }) => {
    const Icon = getRankingIcon(category);
    
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Icon className="h-4 w-4" />
            {getRankingTitle(category)}
          </CardTitle>
          <CardDescription className="text-xs">
            {getRankingDescription(category)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-3">
              {rankingData.map((ranking) => (
                <div key={ranking.user.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-3">
                    <div className={`text-lg font-bold ${getRankingColor(ranking.rank)}`}>
                      {getRankingBadge(ranking.rank)}
                    </div>
                    <div className="space-y-1">
                      <div className="font-medium text-sm">{ranking.user.name}</div>
                      <div className="text-xs text-muted-foreground">{ranking.user.email}</div>
                      <div className="text-xs text-muted-foreground">{ranking.user.school}</div>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className="text-lg font-bold text-primary">
                      {ranking.score.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {category === 'most_active' ? 'pontos' :
                       category === 'most_creative' ? 'designs' :
                       category === 'most_shared' ? 'shares' : 'visualizações'}
                    </div>
                    {!ranking.user.isCompliant && (
                      <Badge variant="destructive" className="text-xs">
                        Fora da política
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Rankings de Usuários
        </CardTitle>
        <CardDescription>
          Veja os usuários mais ativos e performáticos do Canva
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="active" className="text-xs">Mais Ativos</TabsTrigger>
            <TabsTrigger value="creative" className="text-xs">Criativos</TabsTrigger>
            <TabsTrigger value="shared" className="text-xs">Compartilham</TabsTrigger>
            <TabsTrigger value="viewed" className="text-xs">Visualizados</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <RankingList rankingData={rankings.mostActive} category="most_active" />
          </TabsContent>
          <TabsContent value="creative">
            <RankingList rankingData={rankings.mostCreative} category="most_creative" />
          </TabsContent>
          <TabsContent value="shared">
            <RankingList rankingData={rankings.mostShared} category="most_shared" />
          </TabsContent>
          <TabsContent value="viewed">
            <RankingList rankingData={rankings.mostViewed} category="most_viewed" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};