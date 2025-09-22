import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Ticket, School, TrendingUp, Download, FileText, Search } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import { 
  VoucherSchool,
  ExceptionVoucher,
  loadVoucherData,
  getVoucherStats,
  filterSchools,
  exportVoucherReport
} from "@/lib/voucherDataProcessor";

const VoucherDashboard = () => {
  const [schools, setSchools] = useState<VoucherSchool[]>([]);
  const [exceptions, setExceptions] = useState<ExceptionVoucher[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<VoucherSchool[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [voucherEligible, setVoucherEligible] = useState<string>("all");
  const [voucherSent, setVoucherSent] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [schools, searchTerm, selectedCluster, selectedStatus, voucherEligible, voucherSent]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await loadVoucherData();
      setSchools(data.schools);
      setExceptions(data.exceptions);
      toast.success("Dados dos vouchers carregados!");
    } catch (error) {
      toast.error("Erro ao carregar dados dos vouchers");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const filters = {
      search: searchTerm,
      cluster: selectedCluster === "all" ? undefined : selectedCluster,
      status: selectedStatus === "all" ? undefined : selectedStatus,
      voucherEligible: voucherEligible === "true" ? true : voucherEligible === "false" ? false : undefined,
      voucherSent: voucherSent === "true" ? true : voucherSent === "false" ? false : undefined
    };

    const filtered = filterSchools(schools, filters);
    setFilteredSchools(filtered);
  };

  const getClusters = () => {
    const clusters = [...new Set(schools.map(s => s.cluster))].filter(Boolean);
    return clusters.sort();
  };

  const getStatuses = () => {
    const statuses = [...new Set(schools.map(s => s.status))].filter(Boolean);
    return statuses.sort();
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
          <h1 className="text-3xl font-bold">Dashboard de Vouchers</h1>
          <p className="text-muted-foreground">
            Gerenciamento e distribuição de vouchers Canva
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Relatório PDF
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
          title="Taxa de Elegibilidade"
          value={`${stats.eligibilityRate.toFixed(1)}%`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatsCard
          title="Exceções"
          value={stats.exceptionVouchers.toString()}
          icon={<FileText className="h-4 w-4" />}
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Buscar escola</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome, ID ou código do voucher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Button variant="outline" size="icon">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="min-w-[120px]">
                <Select value={selectedCluster} onValueChange={setSelectedCluster}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Cluster" />
                  </SelectTrigger>
                  <SelectContent>
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
                  <SelectContent>
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
                  <SelectContent>
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
                  <SelectContent>
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

      {/* Lista de Vouchers */}
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
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Cluster</p>
                  <p className="font-semibold">{school.cluster}</p>
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
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredSchools.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Ticket className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum voucher encontrado com os filtros aplicados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoucherDashboard;