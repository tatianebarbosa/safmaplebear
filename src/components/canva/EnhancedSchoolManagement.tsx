import React, { useState, useMemo } from 'react';
import { Search, Filter, Users, AlertTriangle, Building2, MapPin, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { SchoolCanvaData, CanvaUser } from '@/lib/canvaDataProcessor';

interface EnhancedSchoolManagementProps {
  schoolsData: SchoolCanvaData[];
  onSchoolSelect: (school: SchoolCanvaData) => void;
  onManageSchool: (school: SchoolCanvaData) => void;
}

export const EnhancedSchoolManagement = ({ 
  schoolsData, 
  onSchoolSelect, 
  onManageSchool 
}: EnhancedSchoolManagementProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<string>('all');
  const [licenseFilter, setLicenseFilter] = useState<string>('all');
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);

  // Get unique clusters
  const clusters = useMemo(() => {
    const unique = Array.from(new Set(schoolsData.map(s => s.cluster).filter(Boolean))).sort();
    return unique;
  }, [schoolsData]);

  // Filter schools based on search and filters
  const filteredSchools = useMemo(() => {
    return schoolsData.filter(school => {
      // Search filter
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        if (!school.schoolName.toLowerCase().includes(search) &&
            !school.cluster?.toLowerCase().includes(search)) {
          return false;
        }
      }

      // Cluster filter
      if (selectedCluster !== 'all' && school.cluster !== selectedCluster) {
        return false;
      }

      // License filter
      if (licenseFilter !== 'all') {
        switch (licenseFilter) {
          case 'over_limit':
            return school.licenseStatus === 'over_limit';
          case 'needs_attention':
            return school.licenseStatus === 'needs_attention';
          case 'normal':
            return school.licenseStatus === 'normal';
          case 'has_issues':
            return school.hasLicenseIssues;
        }
      }

      return true;
    }).sort((a, b) => {
      // Priority: schools with issues first
      if (a.hasLicenseIssues && !b.hasLicenseIssues) return -1;
      if (b.hasLicenseIssues && !a.hasLicenseIssues) return 1;
      return b.usedLicenses - a.usedLicenses;
    });
  }, [schoolsData, searchTerm, selectedCluster, licenseFilter]);

  const getLicenseStatusBadge = (school: SchoolCanvaData) => {
    switch (school.licenseStatus) {
      case 'over_limit':
        return (
          <Badge variant="destructive">
            {school.usedLicenses - school.maxLicenses} em excesso
          </Badge>
        );
      case 'needs_attention':
        return (
          <Badge variant="outline" className="text-destructive border-destructive">
            {school.nonCompliantUsers.length} fora da política
          </Badge>
        );
      default:
        return school.usedLicenses === school.maxLicenses ? (
          <Badge variant="secondary">Capacidade máxima</Badge>
        ) : null;
    }
  };

  const toggleSchoolExpansion = (schoolId: string) => {
    setExpandedSchool(expandedSchool === schoolId ? null : schoolId);
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Escolas
          </CardTitle>
          <CardDescription>
            {filteredSchools.length} de {schoolsData.length} escolas exibidas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome da escola ou cluster"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cluster/Região</label>
              <Select value={selectedCluster} onValueChange={setSelectedCluster}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os clusters" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os clusters</SelectItem>
                  {clusters.map((cluster) => (
                    <SelectItem key={cluster} value={cluster}>
                      {cluster}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status das Licenças</label>
              <Select value={licenseFilter} onValueChange={setLicenseFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="has_issues">Com problemas</SelectItem>
                  <SelectItem value="over_limit">Acima do limite</SelectItem>
                  <SelectItem value="needs_attention">Requer atenção</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCluster('all');
                  setLicenseFilter('all');
                }}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schools List */}
      <div className="grid gap-4">
        {filteredSchools.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">
                Nenhuma escola encontrada com os filtros aplicados.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredSchools.map((school) => (
            <Card 
              key={school.schoolId}
              className={`transition-all duration-200 hover:shadow-md cursor-pointer ${
                school.hasLicenseIssues 
                  ? 'border-destructive/30 bg-destructive/5' 
                  : 'hover:border-primary/20'
              }`}
              onClick={() => onSchoolSelect(school)}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* School Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">{school.schoolName}</h3>
                        {getLicenseStatusBadge(school)}
                      </div>
                      
                      {school.cluster && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {school.cluster}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {school.usedLicenses}/{school.maxLicenses} licenças
                        </span>
                        <span>{school.users.length} usuários totais</span>
                        {school.nonCompliantUsers.length > 0 && (
                          <span className="text-destructive flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {school.nonCompliantUsers.length} fora da política
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSchoolExpansion(school.schoolId);
                        }}
                      >
                        {expandedSchool === school.schoolId ? 'Ocultar' : 'Ver'} Usuários
                      </Button>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onManageSchool(school);
                        }}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Gerenciar
                      </Button>
                    </div>
                  </div>

                  {/* License Usage Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uso de Licenças</span>
                      <span>{Math.round(school.utilizationRate)}%</span>
                    </div>
                    <Progress 
                      value={Math.min(school.utilizationRate, 100)} 
                      className={`h-2 ${
                        school.usedLicenses > school.maxLicenses 
                          ? '[&>div]:bg-destructive' 
                          : ''
                      }`}
                    />
                  </div>

                  {/* Activity Summary */}
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {school.totalActivity.designsCreated}
                      </div>
                      <div className="text-xs text-muted-foreground">Designs</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {school.totalActivity.designsPublished}
                      </div>
                      <div className="text-xs text-muted-foreground">Publicados</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {school.totalActivity.sharedLinks}
                      </div>
                      <div className="text-xs text-muted-foreground">Compartilhados</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">
                        {school.totalActivity.designsViewed}
                      </div>
                      <div className="text-xs text-muted-foreground">Visualizações</div>
                    </div>
                  </div>

                  {/* Expanded User List */}
                  {expandedSchool === school.schoolId && (
                    <>
                      <Separator />
                      <div className="space-y-3">
                        <h4 className="font-medium text-sm">
                          Usuários da Escola ({school.users.length})
                        </h4>
                        <div className="grid gap-2 max-h-64 overflow-y-auto">
                          {school.users.map((user, index) => (
                            <div 
                              key={index}
                              className={`flex items-center justify-between p-3 rounded border ${
                                !user.isCompliant ? 'border-destructive/20 bg-destructive/5' : 'bg-muted/20'
                              }`}
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">
                                    {user.name || user.email.split('@')[0]}
                                  </span>
                                  <Badge 
                                    variant={user.isCompliant ? "secondary" : "destructive"}
                                    className="text-xs"
                                  >
                                    {user.isCompliant ? 'Conforme' : 'Fora da política'}
                                  </Badge>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {user.email} • {user.role}
                                </div>
                                {user.complianceIssue && (
                                  <div className="text-xs text-destructive mt-1">
                                    {user.complianceIssue}
                                  </div>
                                )}
                              </div>
                              <div className="text-right text-sm">
                                <div>{user.designsCreated} designs</div>
                                <div className="text-xs text-muted-foreground">
                                  {user.designsPublished} publicados
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};