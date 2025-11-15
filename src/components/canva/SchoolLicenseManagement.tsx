import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Combobox } from '@/components/ui/combobox';
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  X,
  AlertTriangle,
  Building2,
  Users
} from 'lucide-react';
import { SchoolLicenseCard } from './SchoolLicenseCard';
import { ImportPreviewDialog } from './ImportPreviewDialog';
import { useSchoolLicenseStore } from '@/stores/schoolLicenseStore';
import { School, ClusterType, LicenseStatus } from '@/types/schoolLicense';
import { toast } from 'sonner';
import StatsCard from '@/components/dashboard/StatsCard';

export const SchoolLicenseManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [clusterFilter, setClusterFilter] = useState<string>('all');
  const [licenseFilter, setLicenseFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    schools, 
    getLicenseStatus,
    getNonMapleBearCount,
    getDomainCounts 
  } = useSchoolLicenseStore();

  // Criar opções para o combobox de escolas
  const schoolOptions = schools.map(school => ({
    value: school.id,
    label: school.name
  }));

  // Filter schools
  const filteredSchools = schools.filter(school => {
    const matchesSearch = !searchTerm || 
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.cluster.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.users.some(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesSelectedSchool = !selectedSchool || school.id === selectedSchool;
    
    const matchesCluster = clusterFilter === 'all' || school.cluster === clusterFilter;
    
    const matchesRole = roleFilter === 'all' || 
      school.users.some(user => user.role === roleFilter);
    
    const schoolLicenseStatus = getLicenseStatus(school);
    const matchesLicense = licenseFilter === 'all' || schoolLicenseStatus === licenseFilter;
    
    return matchesSearch && matchesSelectedSchool && matchesCluster && matchesRole && matchesLicense;
  });

  // Calculate stats
  const totalSchools = schools.length;
  const activeSchools = schools.filter(s => s.status === 'Ativa').length;
  const totalLicenses = schools.reduce((sum, s) => sum + s.totalLicenses, 0);
  const usedLicenses = schools.reduce((sum, s) => sum + s.usedLicenses, 0);
  const exceedingSchools = schools.filter(s => getLicenseStatus(s) === 'Excedido').length;
  const nonCompliantUsers = schools.reduce((sum, s) => sum + s.users.filter(u => !u.isCompliant).length, 0);
  const nonMapleBearCount = getNonMapleBearCount();
  const domainCounts = getDomainCounts();

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedSchool('');
    setClusterFilter('all');
    setLicenseFilter('all');
    setRoleFilter('all');
  };

  const handleExport = () => {
    const csvData = [
      ['Escola', 'Status', 'Cluster', 'Cidade', 'Licenças Totais', 'Licenças Usadas', 'Status Licenças', 'Total Usuários', 'Usuários Não Conformes'],
      ...filteredSchools.map(school => [
        school.name,
        school.status,
        school.cluster,
        school.city || '',
        school.totalLicenses,
        school.usedLicenses,
        getLicenseStatus(school),
        school.users.length,
        school.users.filter(u => !u.isCompliant).length
      ])
    ];

    const csvContent = csvData.map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'escolas-licencas.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Dados exportados com sucesso');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(';').map(h => h.toLowerCase().trim());
        
        const expectedHeaders = ['schoolid', 'name', 'email', 'role'];
        const hasRequiredHeaders = expectedHeaders.every(header => 
          headers.some(h => h.includes(header))
        );

        if (!hasRequiredHeaders) {
          toast.error('Formato inválido. Colunas necessárias: schoolId, name, email, role');
          return;
        }

        const data = lines.slice(1).map(line => {
          const values = line.split(';');
          return {
            schoolId: values[headers.indexOf('schoolid')] || values[0],
            name: values[headers.indexOf('name')] || values[1],
            email: values[headers.indexOf('email')] || values[2],
            role: values[headers.indexOf('role')] || values[3],
          };
        }).filter(row => row.schoolId && row.name && row.email);

        setImportData(data);
        setShowImportDialog(true);
      } catch (error) {
        toast.error('Erro ao processar arquivo CSV');
      }
    };
    reader.readAsText(file);
  };

  const handleViewDetails = (school: School) => {
    toast.info(`Visualizando detalhes: ${school.name}`);
  };

  const handleManage = (school: School) => {
    toast.info(`Gerenciando escola: ${school.name}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Licenças por Escola</h2>
          <p className="text-muted-foreground">
            Gerencie usuários, licenças e conformidade das escolas
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatsCard
          title="Total de Escolas"
          value={totalSchools.toString()}
          description={`${activeSchools} ativas`}
          icon={<Building2 className="h-4 w-4" />}
        />
        <StatsCard
          title="Licenças Utilizadas"
          value={`${usedLicenses}/${totalLicenses}`}
          description={`${((usedLicenses/totalLicenses)*100).toFixed(1)}% ocupação`}
          icon={<Users className="h-4 w-4" />}
        />
        <StatsCard
          title="Escolas em Excesso"
          value={exceedingSchools.toString()}
          description="Licenças ultrapassadas"
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={exceedingSchools > 0 ? "destructive" : "default"}
        />
        <StatsCard
          title="Usuários Não Conformes"
          value={nonCompliantUsers.toString()}
          description="Fora da política"
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={nonCompliantUsers > 0 ? "destructive" : "default"}
        />
        <StatsCard
          title="Domínios Não Maple Bear"
          value={nonMapleBearCount.toString()}
          description={`${domainCounts.slice(0, 2).map(d => d.domain).join(', ')}`}
          icon={<AlertTriangle className="h-4 w-4" />}
          variant={nonMapleBearCount > 0 ? "destructive" : "default"}
        />
      </div>

      {/* Domain Compliance Alert */}


      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Nome da escola, cluster, usuário, email ou perfil (estudante, professor, administrador)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Cluster Filter */}
            <Select value={clusterFilter} onValueChange={setClusterFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Cluster/Região" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Implantação">Implantação</SelectItem>
                <SelectItem value="Alta Performance">Alta Performance</SelectItem>
                <SelectItem value="Potente">Potente</SelectItem>
                <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                <SelectItem value="Alerta">Alerta</SelectItem>
              </SelectContent>
            </Select>

            {/* License Status Filter */}
            <Select value={licenseFilter} onValueChange={setLicenseFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Status das Licenças" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="Disponível">Liberada</SelectItem>
                <SelectItem value="Completo">Completa</SelectItem>
                <SelectItem value="Excedido">Excedida</SelectItem>
              </SelectContent>
            </Select>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="Perfil do Usuário" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Perfis</SelectItem>
                <SelectItem value="Estudante">Estudante</SelectItem>
                <SelectItem value="Professor">Professor</SelectItem>
                <SelectItem value="Administrador">Administrador</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            <Button variant="outline" onClick={handleClearFilters}>
              <X className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mt-4 justify-end">
            <Button variant="outline" onClick={handleExport} className="gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
              <Upload className="h-4 w-4" />
              Importar CSV
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
          </div>
        </CardContent>
      </Card>

      {/* Schools Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredSchools.map((school) => (
          <SchoolLicenseCard
            key={school.id}
            school={school}
            onViewDetails={handleViewDetails}
            onManage={handleManage}
          />
        ))}
      </div>

      {filteredSchools.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Nenhuma escola encontrada com os filtros aplicados.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Import Dialog */}
      <ImportPreviewDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        data={importData}
        onConfirm={(data) => {
          // Handle import logic here
          setShowImportDialog(false);
          setImportData([]);
          toast.success(`${data.length} usuários importados com sucesso`);
        }}
      />
    </div>
  );
};