import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/ui/combobox";
import { toast } from "sonner";
import { School, Users, Search, Filter, FileText, Plus, Edit, MapPin, Ticket, Download, UserCheck } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import ExceptionVoucherDialog from "./ExceptionVoucherDialog";
import { generateVoucherReport, generateUserReport } from "@/lib/pdfGenerator";
import { loadSchoolData } from "@/lib/schoolDataProcessor";
import {
  VoucherSchool,
  ExceptionVoucher,
  VoucherJustification,
  loadVoucherData,
  getVoucherStats,
  filterSchools,
  searchVoucherByCode,
  exportVoucherReport
} from "@/lib/voucherDataProcessor";

const SchoolsDashboard = () => {
  const [schools, setSchools] = useState<VoucherSchool[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionVoucher[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<VoucherSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string>("");
  const [selectedCluster, setSelectedCluster] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [voucherEligible, setVoucherEligible] = useState<string>("all");
  const [voucherSent, setVoucherSent] = useState<string>("all");
  const [selectedSafConsultant, setSelectedSafConsultant] = useState<string>("all");
  const [currentSchool, setCurrentSchool] = useState<VoucherSchool | null>(null);
  const [showAddVoucher, setShowAddVoucher] = useState(false);
  const [showJustification, setShowJustification] = useState(false);
  const [justification, setJustification] = useState("");
  const [voucherAction, setVoucherAction] = useState<'add' | 'edit' | 'exception'>('add');
  const [showExceptionDialog, setShowExceptionDialog] = useState(false);
  const [totalUsers, setTotalUsers] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [schools, searchTerm, selectedSchool, selectedCluster, selectedStatus, voucherEligible, voucherSent, selectedSafConsultant]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [voucherData, schoolData] = await Promise.all([
        loadVoucherData(),
        loadSchoolData()
      ]);
      
      setSchools(voucherData.schools);
      setExceptions(voucherData.exceptions);
      
      // Calcular total de usuários dos dados reais
      const totalUsersCount = schoolData.reduce((sum, school) => sum + school.users.length, 0);
      setTotalUsers(totalUsersCount);
      
      toast.success("Dados carregados com sucesso!");
    } catch (error) {
      toast.error("Erro ao carregar dados dos vouchers");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = schools;
    
    // Se uma escola específica foi selecionada, mostrar apenas ela
    if (selectedSchool) {
      const school = schools.find(s => s.id === selectedSchool);
      filtered = school ? [school] : [];
    } else {
      // Aplicar filtros normais
      const filters = {
        search: searchTerm,
        cluster: selectedCluster === "all" ? undefined : selectedCluster,
        status: selectedStatus === "all" ? undefined : selectedStatus,
        voucherEligible: voucherEligible === "true" ? true : voucherEligible === "false" ? false : undefined,
        voucherSent: voucherSent === "true" ? true : voucherSent === "false" ? false : undefined,
        safConsultant: selectedSafConsultant === "all" ? undefined : selectedSafConsultant
      };

      filtered = filterSchools(schools, filters);
    }
    
    setFilteredSchools(filtered);
  };

  const handleVoucherSearch = () => {
    if (!searchTerm.trim()) {
      toast.error("Digite um código de voucher para buscar");
      return;
    }

    const result = searchVoucherByCode(searchTerm, schools, exceptions);
    
    if (result.found) {
      if (result.school) {
        toast.success(`Voucher encontrado na escola: ${result.school.name}`);
        setFilteredSchools([result.school]);
      } else if (result.exception) {
        toast.success(`Voucher de exceção encontrado: ${result.exception.unit}`);
      }
    } else {
      toast.error("Voucher não encontrado");
    }
  };

  const handleAddException = (school: VoucherSchool) => {
    setCurrentSchool(school);
    setShowExceptionDialog(true);
  };

  const handleSaveException = (exception: Partial<ExceptionVoucher>) => {
    // Salvar exceção no localStorage por enquanto
    const existingExceptions = JSON.parse(localStorage.getItem('voucherExceptions') || '[]');
    const newException = {
      ...exception,
      id: Date.now().toString(),
    };
    
    localStorage.setItem('voucherExceptions', JSON.stringify([...existingExceptions, newException]));
    setExceptions([...exceptions, newException as ExceptionVoucher]);
  };

  const generatePDFReport = () => {
    generateVoucherReport(filteredSchools, exceptions);
    toast.success("Relatório PDF gerado com sucesso!");
  };

  const generateUsersPDFReport = () => {
    loadSchoolData().then(schoolData => {
      generateUserReport(totalUsers, schoolData);
      toast.success("Relatório de usuários PDF gerado com sucesso!");
    });
  };

  const handleEditVoucher = (school: VoucherSchool) => {
    setCurrentSchool(school);
    setVoucherAction('edit');
    setShowJustification(true);
  };

  const submitJustification = () => {
    if (!justification.trim()) {
      toast.error("Justificativa é obrigatória");
      return;
    }

    if (!currentSchool) return;

    const newJustification: VoucherJustification = {
      id: Date.now().toString(),
      schoolId: currentSchool.id,
      action: voucherAction,
      justification,
      createdBy: "admin@mbcentral.com.br", // Pegar do contexto de auth
      createdAt: new Date().toISOString()
    };

    // Salvar no localStorage por enquanto
    const existingJustifications = JSON.parse(localStorage.getItem('voucherJustifications') || '[]');
    localStorage.setItem('voucherJustifications', JSON.stringify([...existingJustifications, newJustification]));

    toast.success(`${voucherAction === 'exception' ? 'Exceção adicionada' : 'Voucher editado'} com sucesso!`);
    setShowJustification(false);
    setJustification("");
    setCurrentSchool(null);
  };

  const getClusters = () => {
    const clusters = [...new Set(schools.map(s => s.cluster))].filter(Boolean);
    return clusters.sort();
  };

  const getStatuses = () => {
    const statuses = [...new Set(schools.map(s => s.status))].filter(Boolean);
    return statuses.sort();
  };

  const getSafConsultants = () => {
    return ['Tatiane', 'Rafhael', 'João', 'Ingrid', 'Ana Paula'];
  };

  const getSchoolOptions = () => {
    return schools.map(school => ({
      value: school.id,
      label: `${school.name} (ID: ${school.id})`
    }));
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativa': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inativa': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'implantando': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const stats = getVoucherStats(schools, exceptions);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Escolas</h1>
          <p className="text-muted-foreground">
            Gerenciamento de licenças Canva e vouchers por escola
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={generatePDFReport}>
            <FileText className="w-4 h-4 mr-2" />
            Relatório PDF
          </Button>
          <Button variant="outline" onClick={generateUsersPDFReport}>
            <Users className="w-4 h-4 mr-2" />
            Relatório Usuários
          </Button>
          <Button variant="outline" onClick={() => exportVoucherReport(filteredSchools, exceptions)}>
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={loadData}>
            Atualizar Dados
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Escolas"
          value={stats.totalSchools.toString()}
          trend={{ value: stats.eligibilityRate, isPositive: stats.eligibilityRate > 50 }}
          icon={<School className="h-4 w-4" />}
        />
        <StatsCard
          title="Vouchers Totais"
          value={stats.totalVouchers.toString()}
          trend={{ value: stats.deliveryRate, isPositive: stats.deliveryRate > 80 }}
          icon={<Ticket className="h-4 w-4" />}
        />
        <StatsCard
          title="Exceções"
          value={stats.exceptionVouchers.toString()}
          icon={<Plus className="h-4 w-4" />}
        />
        <StatsCard
          title="Total de Usuários"
          value={totalUsers.toString()}
          trend={{ value: totalUsers > 800 ? 2.5 : -1.2, isPositive: totalUsers > 800 }}
          icon={<Users className="h-4 w-4" />}
        />
      </div>

      {/* Busca e Filtros */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          {/* Linha de Busca */}
          <div className="mb-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Buscar escola por nome</Label>
                <Combobox
                  options={getSchoolOptions()}
                  value={selectedSchool}
                  onValueChange={(value) => {
                    setSelectedSchool(value);
                    setSearchTerm("");
                  }}
                  placeholder="Selecione uma escola..."
                  searchPlaceholder="Digite o nome da escola..."
                  emptyMessage="Nenhuma escola encontrada."
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ou buscar por texto</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Nome, ID ou código do voucher..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      if (e.target.value) setSelectedSchool("");
                    }}
                    className="h-9"
                  />
                  <Button onClick={handleVoucherSearch} size="sm" className="h-9 px-3 shrink-0">
                    <Search className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Linha de Filtros */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">Filtros</Label>
            <div className="flex flex-wrap gap-3">
              <div className="min-w-[140px]">
                <Select value={selectedSafConsultant} onValueChange={setSelectedSafConsultant}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Consultor" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md">
                    <SelectItem value="all">Todos consultores</SelectItem>
                    {getSafConsultants().map((consultant) => (
                      <SelectItem key={consultant} value={consultant}>{consultant}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[120px]">
                <Select value={selectedCluster} onValueChange={setSelectedCluster}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Cluster" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md">
                    <SelectItem value="all">Todos clusters</SelectItem>
                    {getClusters().map((cluster) => (
                      <SelectItem key={cluster} value={cluster}>{cluster}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[110px]">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md">
                    <SelectItem value="all">Todos status</SelectItem>
                    {getStatuses().map((status) => (
                      <SelectItem key={status} value={status}>{status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[120px]">
                <Select value={voucherEligible} onValueChange={setVoucherEligible}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Elegível" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Elegíveis</SelectItem>
                    <SelectItem value="false">Não Elegíveis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[120px]">
                <Select value={voucherSent} onValueChange={setVoucherSent}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Enviado" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border shadow-md">
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="true">Enviados</SelectItem>
                    <SelectItem value="false">Não Enviados</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Escolas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredSchools.map((school) => (
          <Card key={school.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight">{school.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">ID: {school.id}</p>
                </div>
                <Badge className={getStatusBadgeColor(school.status)}>
                  {school.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Cluster: {school.cluster}</span>
              </div>

              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Consultor: {school.safConsultant}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Vendas SLM 2025</p>
                  <p className="font-semibold">{school.slmSales}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Qtd. Vouchers</p>
                  <p className="font-semibold">{school.voucherQuantity}</p>
                </div>
              </div>

              {school.voucherCode && (
                <div>
                  <p className="text-sm text-muted-foreground">Código do Voucher</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{school.voucherCode}</code>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Badge variant={school.voucherEligible ? "default" : "secondary"}>
                  {school.voucherEligible ? "Elegível" : "Não Elegível"}
                </Badge>
                {school.voucherSent && (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Enviado
                  </Badge>
                )}
                {school.reason && (
                  <Badge variant="destructive">
                    {school.reason}
                  </Badge>
                )}
              </div>

              {school.observations && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  {school.observations}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEditVoucher(school)}
                  className="flex-1"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAddException(school)}
                  className="flex-1"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Exceção
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSchools.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <School className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma escola encontrada com os filtros aplicados.</p>
          </CardContent>
        </Card>
      )}

      <ExceptionVoucherDialog
        isOpen={showExceptionDialog}
        onClose={() => setShowExceptionDialog(false)}
        school={currentSchool}
        onSave={handleSaveException}
      />

      {/* Dialog de Justificativa (para edição) */}
      <Dialog open={showJustification} onOpenChange={setShowJustification}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {voucherAction === 'exception' ? 'Adicionar Exceção de Voucher' : 'Editar Voucher'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {currentSchool && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold">{currentSchool.name}</p>
                <p className="text-sm text-muted-foreground">ID: {currentSchool.id}</p>
              </div>
            )}
            
            <div>
              <Label htmlFor="justification">Justificativa *</Label>
              <Textarea
                id="justification"
                placeholder="Digite a justificativa para esta ação..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowJustification(false)}>
                Cancelar
              </Button>
              <Button onClick={submitJustification}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolsDashboard;