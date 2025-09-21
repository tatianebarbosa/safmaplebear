import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus, Star } from "lucide-react";
import { RankingChange } from "@/lib/csvProcessor";
import { cn } from "@/lib/utils";

interface RankingTableProps {
  changes: RankingChange[];
  showComparison?: boolean;
}

const RankingTable = ({ changes, showComparison = true }: RankingTableProps) => {
  const getTrendIcon = (trend: string, positionChange: number) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-success" />;
      case 'down':
        return <TrendingDown className="w-4 h-4 text-destructive" />;
      case 'same':
        return <Minus className="w-4 h-4 text-muted-foreground" />;
      case 'new':
        return <Star className="w-4 h-4 text-secondary" />;
      default:
        return null;
    }
  };

  const getPositionBadge = (position: number) => {
    if (position === 1) return <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">🥇 1º</Badge>;
    if (position === 2) return <Badge className="bg-gradient-to-r from-gray-300 to-gray-500 text-white">🥈 2º</Badge>;
    if (position === 3) return <Badge className="bg-gradient-to-r from-amber-600 to-amber-800 text-white">🥉 3º</Badge>;
    return <Badge variant="outline">{position}º</Badge>;
  };

  const getChangeText = (change: RankingChange) => {
    if (change.trend === 'new') return 'Novo';
    if (change.positionChange === 0) return 'Manteve';
    if (change.positionChange > 0) return `+${change.positionChange}`;
    return `${change.positionChange}`;
  };

  return (
    <Card className="card-maple">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Ranking de Atividade Canva
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-20">Posição</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Escola</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-center">Designs</TableHead>
              <TableHead className="text-center">Publicados</TableHead>
              <TableHead className="text-center">Visualizações</TableHead>
              {showComparison && <TableHead className="text-center">Evolução</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {changes.slice(0, 50).map((change, index) => (
              <TableRow 
                key={change.email}
                className={cn(
                  "animate-slide-up",
                  change.currentPosition <= 3 && "bg-gradient-to-r from-secondary/10 to-transparent"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <TableCell>
                  {getPositionBadge(change.currentPosition)}
                </TableCell>
                
                <TableCell>
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">
                      {change.membro}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {change.email}
                    </div>
                  </div>
                </TableCell>
                
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {change.escola || 'Não identificada'}
                  </Badge>
                </TableCell>
                
                <TableCell className="text-right">
                  <div className="space-y-1">
                    <div className="font-bold text-lg text-primary">
                      {change.currentScore.toLocaleString()}
                    </div>
                    {showComparison && change.previousScore && (
                      <div className={cn(
                        "text-xs font-medium",
                        change.scoreChange > 0 ? "text-success" : 
                        change.scoreChange < 0 ? "text-destructive" : "text-muted-foreground"
                      )}>
                        {change.scoreChange > 0 ? '+' : ''}{change.scoreChange}
                      </div>
                    )}
                  </div>
                </TableCell>
                
                <TableCell className="text-center">
                  <div className="font-medium">
                    {changes.find(c => c.email === change.email)?.currentScore ? 
                      Math.round(change.currentScore / 10) : 'N/A'}
                  </div>
                </TableCell>
                
                <TableCell className="text-center">
                  <div className="font-medium text-success">
                    {Math.round(change.currentScore / 15)}
                  </div>
                </TableCell>
                
                <TableCell className="text-center">
                  <div className="font-medium text-secondary">
                    {Math.round(change.currentScore * 2)}
                  </div>
                </TableCell>
                
                {showComparison && (
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      {getTrendIcon(change.trend, change.positionChange)}
                      <span className={cn(
                        "text-xs font-medium",
                        change.trend === 'up' ? "text-success" :
                        change.trend === 'down' ? "text-destructive" :
                        change.trend === 'new' ? "text-secondary" :
                        "text-muted-foreground"
                      )}>
                        {getChangeText(change)}
                      </span>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default RankingTable;