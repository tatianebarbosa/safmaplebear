import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Calendar, School, TrendingUp, Download, FileText, Search, Gift } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import { 
  Voucher2026,
  loadVoucher2026Data,
  getVoucher2026Stats,
  filterVouchers2026,
  exportVoucher2026Report
} from "@/lib/voucher2026Processor";

const Voucher2026Dashboard = () => {
  const [vouchers, setVouchers] = useState<Voucher2026[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher2026[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [voucherEligible, setVoucherEligible] = useState<string>("all");
  const [voucherSent, setVoucherSent] = useState<string>("all");
  const [safConsultant, setSafConsultant] = useState<string>("all");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [vouchers, searchTerm, selectedCluster, selectedStatus, voucherEligible, voucherSent, safConsultant]);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await loadVoucher2026Data();
      setVouchers(data);
      toast.success("Dados dos vouchers 2026 carregados!");
    } catch (error) {
      toast.error("Erro ao carregar dados dos vouchers 2026");
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
      voucherSent: voucherSent === "true" ? true : voucherSent === "false" ? false : undefined,
      safConsultant: safConsultant === "all" ? undefined : safConsultant
    };

    const filtered = filterVouchers2026(vouchers, filters);
    setFilteredVouchers(filtered);
  };

  const getClusters = () => {
    const clusters = [...new Set(vouchers.map(v => v.cluster))].filter(Boolean);
    return clusters.sort();
  };

  const getStatuses = () => {
    const statuses = [...new Set(vouchers.map(v => v.status))].filter(Boolean);
    return statuses.sort();
  };

  const getSafConsultants = () => {
    const consultants = [...new Set(vouchers.map(v => v.safConsultant))].filter(Boolean);
    return consultants.sort();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'ativa': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'inativa': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'operando': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const stats = getVoucher2026Stats(vouchers);

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
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            Vouchers Campanha 2026
          </h1>
          <p className="text-muted-foreground">
            Gerenciamento da campanha de vouchers Canva 2026
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Relatório PDF
          </Button>
          <Button variant="outline" onClick={() => exportVoucher2026Report(filteredVouchers)}>
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
          title="Escolas Elegíveis"
          value={stats.eligibleSchools.toString()}
          trend={{ value: stats.deliveryRate, isPositive: stats.deliveryRate > 80 }}
          icon={<Gift className="h-4 w-4" />}
        />
        <StatsCard
          title="Taxa de Elegibilidade"
          value={`${stats.eligibilityRate}%`}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatsCard
          title="Vouchers Enviados"
          value={stats.sentVouchers.toString()}
          icon={<FileText className="h-4 w-4" />}
        />
      </div>

      {/* Filtros Simples */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Busca */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Buscar</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome, ID ou código do voucher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
                <Button variant="outline" size="icon">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Filtros em linha única */}
            <div className="flex flex-wrap gap-3">
              <Select value={selectedCluster} onValueChange={setSelectedCluster}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Cluster" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos clusters</SelectItem>
                  {getClusters().map((cluster) => (
                    <SelectItem key={cluster} value={cluster}>{cluster}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos status</SelectItem>
                  {getStatuses().map((status) => (
                    <SelectItem key={status} value={status}>{status}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={voucherEligible} onValueChange={setVoucherEligible}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Elegível" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Elegíveis</SelectItem>
                  <SelectItem value="false">Não Elegíveis</SelectItem>
                </SelectContent>
              </Select>

              <Select value={voucherSent} onValueChange={setVoucherSent}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Enviado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="true">Enviados</SelectItem>
                  <SelectItem value="false">Não Enviados</SelectItem>
                </SelectContent>
              </Select>

              <Select value={safConsultant} onValueChange={setSafConsultant}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Consultor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos consultores</SelectItem>
                  {getSafConsultants().map((consultant) => (
                    <SelectItem key={consultant} value={consultant}>{consultant}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Vouchers 2026 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredVouchers.map((voucher) => (
          <Card key={voucher.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight">{voucher.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">ID: {voucher.id}</p>
                </div>
                <Badge className={getStatusBadgeColor(voucher.status)}>
                  {voucher.status}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Cluster</p>
                  <p className="font-semibold">{voucher.cluster}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Qtd. Vouchers</p>
                  <p className="font-semibold">{voucher.voucherQuantity}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Vendas SLM 2025</p>
                  <p className="font-semibold">{voucher.slmSales2025}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Consultor SAF</p>
                  <p className="font-semibold text-xs">{voucher.safConsultant}</p>
                </div>
              </div>

              {voucher.voucherCode && (
                <div>
                  <p className="text-sm text-muted-foreground">Código do Voucher</p>
                  <code className="text-sm bg-muted px-2 py-1 rounded">{voucher.voucherCode}</code>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Badge variant={voucher.voucherEligible ? "default" : "secondary"}>
                  {voucher.voucherEligible ? "Elegível" : "Não Elegível"}
                </Badge>
                {voucher.voucherSent && (
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    Enviado
                  </Badge>
                )}
                {voucher.reason && (
                  <Badge variant="destructive">
                    {voucher.reason}
                  </Badge>
                )}
              </div>

              {voucher.observations && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  {voucher.observations}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredVouchers.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum voucher 2026 encontrado com os filtros aplicados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Voucher2026Dashboard;