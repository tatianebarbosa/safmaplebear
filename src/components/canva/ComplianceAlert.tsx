import { AlertTriangle, Shield, Users, School } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CanvaUser } from "@/lib/canvaDataProcessor";

interface ComplianceAlertProps {
  nonCompliantUsers: CanvaUser[];
  totalUsers: number;
  onViewDetails: () => void;
}

export const ComplianceAlert = ({ nonCompliantUsers, totalUsers, onViewDetails }: ComplianceAlertProps) => {
  const complianceRate = totalUsers > 0 ? ((totalUsers - nonCompliantUsers.length) / totalUsers) * 100 : 100;
  const isHighRisk = complianceRate < 80;
  const isMediumRisk = complianceRate < 90;

  const getRiskLevel = () => {
    if (isHighRisk) return { level: 'Alto Risco', color: 'destructive', icon: AlertTriangle };
    if (isMediumRisk) return { level: 'Médio Risco', color: 'warning', icon: Shield };
    return { level: 'Baixo Risco', color: 'success', icon: Shield };
  };

  const risk = getRiskLevel();
  const RiskIcon = risk.icon;

  if (nonCompliantUsers.length === 0) {
    return (
      <Card className="border-success/20 bg-success/5">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-success" />
            <CardTitle className="text-success">Política de Conformidade</CardTitle>
          </div>
          <CardDescription>Todos os usuários estão em conformidade com a política de domínio.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className={`border-${risk.color === 'destructive' ? 'destructive' : 'warning'}/20 bg-${risk.color === 'destructive' ? 'destructive' : 'warning'}/5`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RiskIcon className={`h-5 w-5 text-${risk.color === 'destructive' ? 'destructive' : 'warning'}`} />
            <CardTitle className={`text-${risk.color === 'destructive' ? 'destructive' : 'warning'}`}>
              Alerta de Conformidade - {risk.level}
            </CardTitle>
          </div>
          <Badge variant={risk.color === 'destructive' ? 'destructive' : 'secondary'}>
            {complianceRate.toFixed(1)}% conforme
          </Badge>
        </div>
        <CardDescription>
          {nonCompliantUsers.length} usuários estão usando domínios fora da política corporativa
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>{nonCompliantUsers.length}</strong> usuários não conformes
              </span>
            </div>
            <div className="flex items-center gap-2">
              <School className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>{new Set(nonCompliantUsers.map(u => u.school)).size}</strong> escolas afetadas
              </span>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-medium">Principais domínios não conformes:</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(
                nonCompliantUsers.reduce((acc, user) => {
                  const domain = user.email.split('@')[1];
                  acc[domain] = (acc[domain] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              )
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([domain, count]) => (
                  <Badge key={domain} variant="outline" className="text-xs">
                    {domain} ({count})
                  </Badge>
                ))}
            </div>
          </div>

          <Button onClick={onViewDetails} variant="outline" size="sm" className="w-full">
            Ver Detalhes dos Usuários Não Conformes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};