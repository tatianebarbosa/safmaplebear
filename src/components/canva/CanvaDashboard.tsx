import React, { useState, useEffect } from 'react';
import { Plus, Download, FileText, Search, Filter, TrendingUp, Users, AlertTriangle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import StatsCard from '@/components/dashboard/StatsCard';
import { ComplianceAlert } from './ComplianceAlert';
import { SchoolLicenseOverview } from './SchoolLicenseOverview';
import { CanvaRankings } from './CanvaRankings';
import { LicenseManagement } from './LicenseManagement';
import { LicenseHistory } from './LicenseHistory';
import { CanvaInsights } from './CanvaInsights';
import { EnhancedSchoolManagement } from './EnhancedSchoolManagement';
import { SchoolLicenseManagement } from './SchoolLicenseManagement';
import { CanvaUsageDashboard } from './CanvaUsageDashboard';
import { 
  CanvaUser, 
  CanvaAnalytics,
  SchoolCanvaData,
  loadCanvaData, 
  generateCanvaAnalytics,
  generateSchoolCanvaData,
  generateUserRankings,
  filterCanvaUsers,
  exportCanvaData,
  saveLicenseAction,
  getLicenseHistory
} from '@/lib/canvaDataProcessor';

const CanvaDashboard = () => {
  const [users, setUsers] = useState<CanvaUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<CanvaUser[]>([]);
  const [analytics, setAnalytics] = useState<CanvaAnalytics | null>(null);
  const [schoolsData, setSchoolsData] = useState<SchoolCanvaData[]>([]);
  const [rankings, setRankings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'30d' | '3m' | '6m' | '12m'>('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<'all' | 'compliant' | 'non_compliant'>('all');
  const [selectedSchoolForManagement, setSelectedSchoolForManagement] = useState<SchoolCanvaData | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await loadCanvaData(selectedPeriod);
      const analyticsData = generateCanvaAnalytics(data);
      const schoolsCanvaData = generateSchoolCanvaData(data);
      const rankingsData = generateUserRankings(data);
      
      setUsers(data);
      setFilteredUsers(data);
      setAnalytics(analyticsData);
      setSchoolsData(schoolsCanvaData);
      setRankings(rankingsData);
    } catch (error) {
      toast.error('Erro ao carregar dados do Canva');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, selectedSchool, complianceFilter, users]);

  const applyFilters = () => {
    const filtered = filterCanvaUsers(users, {
      search: searchTerm,
      school: selectedSchool,
      compliance: complianceFilter
    });
    setFilteredUsers(filtered);
  };

  const handleExportData = () => {
    const csvData = exportCanvaData(filteredUsers);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `canva-usuarios-${selectedPeriod}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('Dados exportados com sucesso');
  };

  const handleViewNonCompliantDetails = () => {
    setComplianceFilter('non_compliant');
    toast.info('Filtro aplicado: exibindo apenas usuários fora da política');
  };

  const handleSchoolClick = (school: SchoolCanvaData) => {
    setSelectedSchool(school.schoolName);
    toast.info(`Filtro aplicado para escola: ${school.schoolName}`);
  };

  const getSchools = () => {
    return Array.from(new Set(users.map(u => u.school).filter(Boolean))).sort();
  };

  const getPeriodLabel = (period: string) => {
    switch (period) {
      case '30d': return 'Últimos 30 dias';
      case '3m': return 'Últimos 3 meses';
      case '6m': return 'Últimos 6 meses';
      case '12m': return 'Últimos 12 meses';
      default: return period;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Erro ao carregar dados do Canva.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão Canva</h1>
          <p className="text-muted-foreground">
            Controle de licenças, compliance e analytics do Canva
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="3m">Últimos 3 meses</SelectItem>
              <SelectItem value="6m">Últimos 6 meses</SelectItem>
              <SelectItem value="12m">Últimos 12 meses</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleExportData} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Usuários Ativos Canva"
          value="820"
          description={`${analytics.totalUsers} carregados • ${getPeriodLabel(selectedPeriod)}`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Usuários Conformes"
          value={analytics.compliantUsers.toString()}
          description={`${analytics.complianceRate.toFixed(1)}% de conformidade`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatsCard
          title="Fora da Política"
          value={analytics.nonCompliantUsers.toString()}
          description="Usuários com domínio não autorizado"
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={analytics.nonCompliantUsers > 0 ? "destructive" : "default"}
        />
        <StatsCard
          title="Escolas Ativas"
          value={analytics.totalSchools.toString()}
          description={`${analytics.schoolsAtCapacity} em capacidade máxima`}
          icon={<Building2 className="h-4 w-4" />}
        />
      </div>

      {/* Compliance Alert */}
      {analytics.nonCompliantUsers > 0 && (
        <ComplianceAlert
          nonCompliantUsers={users.filter(u => !u.isCompliant)}
          totalUsers={analytics.totalUsers}
          onViewDetails={handleViewNonCompliantDetails}
        />
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="management">Gerenciamento</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="schools">Escolas</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="rankings">Rankings</TabsTrigger>
          <TabsTrigger value="usage">Usos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <SchoolLicenseOverview 
              schoolsData={schoolsData.slice(0, 10)} 
              onSchoolClick={handleSchoolClick}
            />
            <Card>
              <CardHeader>
                <CardTitle>Atividade Total</CardTitle>
                <CardDescription>Resumo da atividade no período selecionado</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary">
                      {analytics.totalActivity.designsCreated.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Designs Criados</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary">
                      {analytics.totalActivity.designsPublished.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Designs Publicados</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary">
                      {analytics.totalActivity.sharedLinks.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Links Compartilhados</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-primary">
                      {analytics.totalActivity.designsViewed.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Visualizações</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="management" className="space-y-6">
          {selectedSchoolForManagement ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Gerenciar: {selectedSchoolForManagement.schoolName}
                </h3>
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedSchoolForManagement(null)}
                >
                  Voltar para Lista
                </Button>
              </div>
              <LicenseManagement 
                schoolsData={[selectedSchoolForManagement]}
                onUpdateLicenses={(schoolId, action, userId, justification, targetSchoolId) => {
                  // Save action to history
                  const actionRecord = {
                    id: Date.now().toString(),
                    schoolId,
                    schoolName: schoolsData.find(s => s.schoolId === schoolId)?.schoolName || 'Desconhecida',
                    action,
                    userId,
                    userName: userId ? schoolsData.flatMap(s => s.users).find(u => u.id === userId)?.name : undefined,
                    userEmail: userId ? schoolsData.flatMap(s => s.users).find(u => u.id === userId)?.email : undefined,
                    targetSchoolId,
                    targetSchoolName: targetSchoolId ? schoolsData.find(s => s.schoolId === targetSchoolId)?.schoolName : undefined,
                    justification: justification || '',
                    timestamp: new Date().toISOString(),
                    performedBy: 'Administrador' // Would be actual user in real app
                  };
                  
                  saveLicenseAction(actionRecord);
                  
                  // Reload data to reflect changes
                  loadData();
                  setSelectedSchoolForManagement(null);
                }}
              />
            </div>
          ) : (
            <LicenseManagement 
              schoolsData={schoolsData}
              onUpdateLicenses={(schoolId, action, userId, justification, targetSchoolId) => {
                // Save action to history
                const actionRecord = {
                  id: Date.now().toString(),
                  schoolId,
                  schoolName: schoolsData.find(s => s.schoolId === schoolId)?.schoolName || 'Desconhecida',
                  action,
                  userId,
                  userName: userId ? schoolsData.flatMap(s => s.users).find(u => u.id === userId)?.name : undefined,
                  userEmail: userId ? schoolsData.flatMap(s => s.users).find(u => u.id === userId)?.email : undefined,
                  targetSchoolId,
                  targetSchoolName: targetSchoolId ? schoolsData.find(s => s.schoolId === targetSchoolId)?.schoolName : undefined,
                  justification: justification || '',
                  timestamp: new Date().toISOString(),
                  performedBy: 'Administrador' // Would be actual user in real app
                };
                
                saveLicenseAction(actionRecord);
                
                // Reload data to reflect changes
                loadData();
              }}
            />
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <CanvaInsights 
            analytics={analytics}
            schoolsData={schoolsData}
          />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <LicenseHistory schoolsData={schoolsData} />
        </TabsContent>

        <TabsContent value="schools" className="space-y-6">
          <SchoolLicenseManagement />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filtros de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Buscar</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nome ou email"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Escola</label>
                  <Select value={selectedSchool} onValueChange={setSelectedSchool}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a escola" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as escolas</SelectItem>
                      {getSchools().map((school) => (
                        <SelectItem key={school} value={school}>
                          {school}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Conformidade</label>
                  <Select value={complianceFilter} onValueChange={(value: any) => setComplianceFilter(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Status de conformidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="compliant">Conformes</SelectItem>
                      <SelectItem value="non_compliant">Fora da política</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users List */}
          <Card>
            <CardHeader>
              <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
              <CardDescription>
                Lista de usuários do Canva - {getPeriodLabel(selectedPeriod)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Nenhum usuário encontrado com os filtros aplicados.</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredUsers.map((user) => (
                    <Card key={user.id} className={`p-4 ${!user.isCompliant ? 'border-destructive/20 bg-destructive/5' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{user.name}</h3>
                            <Badge variant={user.isCompliant ? "default" : "destructive"}>
                              {user.isCompliant ? 'Conforme' : 'Fora da política'}
                            </Badge>
                            <Badge variant="outline">{user.role}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <p className="text-sm text-muted-foreground">{user.school}</p>
                          {user.complianceIssue && (
                            <p className="text-xs text-destructive">{user.complianceIssue}</p>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">{user.designsCreated}</span> designs criados
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {user.designsPublished} publicados • {user.designsViewed} visualizações
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Última atividade: {user.lastActivity}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rankings" className="space-y-6">
          {rankings && <CanvaRankings rankings={rankings} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CanvaDashboard;