import { TrendingUp, TrendingDown, Users, School, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CanvaAnalytics, SchoolCanvaData } from '@/lib/canvaDataProcessor';

interface CanvaInsightsProps {
  analytics: CanvaAnalytics;
  schoolsData: SchoolCanvaData[];
  previousPeriodData?: CanvaAnalytics;
}

export const CanvaInsights = ({ analytics, schoolsData, previousPeriodData }: CanvaInsightsProps) => {
  const totalLicenses = schoolsData.reduce((sum, school) => sum + school.maxLicenses, 0);
  const utilizationRate = totalLicenses > 0 ? (analytics.totalUsers / totalLicenses) * 100 : 0;
  
  const schoolsOverCapacity = schoolsData.filter(s => s.usedLicenses > s.maxLicenses);
  const highPerformanceSchools = schoolsData.filter(s => s.performance === 'high');
  const lowActivitySchools = schoolsData.filter(s => 
    s.totalActivity.designsCreated === 0 && s.users.length > 0
  );

  const getGrowthIndicator = (current: number, previous?: number) => {
    if (!previous) return null;
    const growth = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(growth).toFixed(1),
      positive: growth > 0,
      icon: growth > 0 ? TrendingUp : TrendingDown,
      color: growth > 0 ? 'text-success' : 'text-destructive'
    };
  };

  const insights = [
    {
      title: 'Taxa de Utilizao Global',
      value: `${utilizationRate.toFixed(1)}%`,
      description: `${analytics.totalUsers} usuários de ${totalLicenses} licenças dispon?veis`,
      status: utilizationRate > 90 ? 'warning' : utilizationRate > 70 ? 'success' : 'info',
      icon: Users
    },
    {
      title: 'Conformidade de Pol?tica',
      value: `${analytics.complianceRate.toFixed(1)}%`,
      description: `${analytics.nonCompliantUsers} usuários fora da pol?tica`,
      status: analytics.complianceRate > 95 ? 'success' : analytics.complianceRate > 80 ? 'warning' : 'danger',
      icon: analytics.complianceRate > 95 ? CheckCircle : AlertTriangle
    },
    {
      title: 'Escolas em Capacidade Mxima',
      value: analytics.schoolsAtCapacity.toString(),
      description: `${((analytics.schoolsAtCapacity / analytics.totalSchools) * 100).toFixed(1)}% das escolas`,
      status: analytics.schoolsAtCapacity > analytics.totalSchools * 0.8 ? 'warning' : 'info',
      icon: School
    }
  ];

  return (
    <div className="space-y-6">
      {/* Key Insights */}
      <div className="grid gap-4 md:grid-cols-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          const statusColors = {
            success: 'text-success border-success/20 bg-success/5',
            warning: 'text-warning border-warning/20 bg-warning/5',
            danger: 'text-destructive border-destructive/20 bg-destructive/5',
            info: 'text-primary border-primary/20 bg-primary/5'
          };
          
          return (
            <Card key={index} className={statusColors[insight.status as keyof typeof statusColors]}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Icon className="h-8 w-8" />
                  <div className="flex-1">
                    <div className="text-2xl font-bold">{insight.value}</div>
                    <div className="text-sm font-medium">{insight.title}</div>
                    <div className="text-xs opacity-80">{insight.description}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Critical Issues */}
      {(schoolsOverCapacity.length > 0 || analytics.nonCompliantUsers > 0 || lowActivitySchools.length > 0) && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Questes Crticas Identificadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {schoolsOverCapacity.length > 0 && (
              <div className="p-3 bg-background rounded border">
                <div className="font-medium text-sm mb-2">
                   {schoolsOverCapacity.length} escola(s) excederam limite de licenças
                </div>
                <div className="space-y-1">
                  {schoolsOverCapacity.slice(0, 3).map(school => (
                    <div key={school.schoolId} className="text-xs flex items-center gap-2">
                      <Badge variant="destructive" className="text-xs">
                        +{school.usedLicenses - school.maxLicenses}
                      </Badge>
                      <span>{school.schoolName}</span>
                    </div>
                  ))}
                  {schoolsOverCapacity.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{schoolsOverCapacity.length - 3} outras escolas
                    </div>
                  )}
                </div>
              </div>
            )}

            {analytics.nonCompliantUsers > 0 && (
              <div className="p-3 bg-background rounded border">
                <div className="font-medium text-sm">
                   {analytics.nonCompliantUsers} usuários com dom?nio no autorizado
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Domnios permitidos: @maplebear.com.br, @mbcentral.com.br, @sebsa.com.br, @seb.com.br
                </div>
              </div>
            )}

            {lowActivitySchools.length > 0 && (
              <div className="p-3 bg-background rounded border">
                <div className="font-medium text-sm">
                   {lowActivitySchools.length} escola(s) sem atividade registrada
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Escolas com usuários ativos mas sem designs criados
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Performance Analysis */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuio de Performance</CardTitle>
            <CardDescription>
              Classificao das escolas por nvel de atividade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['high', 'medium', 'low'].map(level => {
                const schools = schoolsData.filter(s => s.performance === level);
                const percentage = (schools.length / schoolsData.length) * 100;
                const labels = {
                  high: { label: 'Alta Performance', color: 'bg-success' },
                  medium: { label: 'Mdia Performance', color: 'bg-warning' },
                  low: { label: 'Baixa Performance', color: 'bg-destructive' }
                };
                const config = labels[level as keyof typeof labels];
                
                return (
                  <div key={level} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{config.label}</span>
                      <span>{schools.length} escolas ({percentage.toFixed(1)}%)</span>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Escolas por Atividade</CardTitle>
            <CardDescription>
              Escolas com maior engajamento no Canva
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {highPerformanceSchools.slice(0, 5).map((school, index) => (
                <div key={school.schoolId} className="flex items-center gap-3">
                  <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center text-xs">
                    {index + 1}
                  </Badge>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{school.schoolName}</div>
                    <div className="text-xs text-muted-foreground">
                      {school.totalActivity.designsCreated} designs  {school.users.length} usuários
                    </div>
                  </div>
                  <Badge variant="default" className="text-xs">
                    {school.performance === 'high' ? '' : ''} 
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo de Atividade</CardTitle>
          <CardDescription>
            Mtricas consolidadas de uso do Canva no perodo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {analytics.totalActivity.designsCreated.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Designs Criados</div>
              {previousPeriodData && (
                <div className="text-xs mt-1">
                  {getGrowthIndicator(
                    analytics.totalActivity.designsCreated,
                    previousPeriodData.totalActivity.designsCreated
                  ) && (
                    <span className={getGrowthIndicator(
                      analytics.totalActivity.designsCreated,
                      previousPeriodData.totalActivity.designsCreated
                    )?.color}>
                      {getGrowthIndicator(
                        analytics.totalActivity.designsCreated,
                        previousPeriodData.totalActivity.designsCreated
                      )?.positive ? '+' : '-'}
                      {getGrowthIndicator(
                        analytics.totalActivity.designsCreated,
                        previousPeriodData.totalActivity.designsCreated
                      )?.value}%
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {analytics.totalActivity.designsPublished.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Designs Publicados</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {analytics.totalActivity.sharedLinks.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Links Compartilhados</div>
            </div>
            
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">
                {analytics.totalActivity.designsViewed.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Visualizaes</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
