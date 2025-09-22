import { Building2, Users, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SchoolCanvaData } from "@/lib/canvaDataProcessor";

interface SchoolLicenseOverviewProps {
  schoolsData: SchoolCanvaData[];
  onSchoolClick: (school: SchoolCanvaData) => void;
}

export const SchoolLicenseOverview = ({ schoolsData, onSchoolClick }: SchoolLicenseOverviewProps) => {
  const getSchoolStatus = (school: SchoolCanvaData) => {
    if (school.usedLicenses > school.maxLicenses) {
      return { 
        status: 'Excesso', 
        color: 'destructive' as const, 
        icon: AlertCircle,
        description: `${school.usedLicenses - school.maxLicenses} licença(s) em excesso`
      };
    }
    if (school.usedLicenses === school.maxLicenses) {
      return { 
        status: 'Completo', 
        color: 'success' as const, 
        icon: CheckCircle,
        description: 'Utilizando todas as licenças'
      };
    }
    return { 
      status: 'Disponível', 
      color: 'secondary' as const, 
      icon: Clock,
      description: `${school.availableLicenses} licença(s) disponível(is)`
    };
  };

  const getPerformanceBadge = (performance: string) => {
    switch (performance) {
      case 'high': return <Badge variant="default">Alta Performance</Badge>;
      case 'medium': return <Badge variant="secondary">Média Performance</Badge>;
      default: return <Badge variant="outline">Baixa Performance</Badge>;
    }
  };

  const sortedSchools = [...schoolsData].sort((a, b) => {
    // Priorizar escolas com problemas de licença
    if (a.usedLicenses > a.maxLicenses && b.usedLicenses <= b.maxLicenses) return -1;
    if (b.usedLicenses > b.maxLicenses && a.usedLicenses <= a.maxLicenses) return 1;
    // Depois por atividade
    return b.totalActivity.designsCreated - a.totalActivity.designsCreated;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Gestão de Licenças por Escola
        </CardTitle>
        <CardDescription>
          Cada escola tem direito a 2 licenças do Canva. Monitore o uso e compliance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <div className="space-y-4">
            {sortedSchools.map((school) => {
              const schoolStatus = getSchoolStatus(school);
              const StatusIcon = schoolStatus.icon;
              
              return (
                <Card 
                  key={school.schoolId} 
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    school.usedLicenses > school.maxLicenses ? 'border-destructive/50' : ''
                  }`}
                  onClick={() => onSchoolClick(school)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <h3 className="font-medium text-sm leading-tight">
                            {school.schoolName}
                          </h3>
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 text-${schoolStatus.color}`} />
                            <span className={`text-xs text-${schoolStatus.color}`}>
                              {schoolStatus.description}
                            </span>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          {getPerformanceBadge(school.performance)}
                          <div className="text-xs text-muted-foreground">
                            {school.nonCompliantUsers.length > 0 && (
                              <Badge variant="outline" className="text-xs">
                                {school.nonCompliantUsers.length} não conforme(s)
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Licenças utilizadas</span>
                          <span className={school.usedLicenses > school.maxLicenses ? 'text-destructive font-medium' : ''}>
                            {school.usedLicenses}/{school.maxLicenses}
                          </span>
                        </div>
                        <Progress 
                          value={(school.usedLicenses / school.maxLicenses) * 100} 
                          className={`h-2 ${school.usedLicenses > school.maxLicenses ? 'bg-destructive/10' : ''}`}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3 text-muted-foreground" />
                            <span className="text-muted-foreground">Usuários:</span>
                            <span className="font-medium">{school.users.length}</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-muted-foreground">Designs criados:</div>
                          <div className="font-medium">{school.totalActivity.designsCreated}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};