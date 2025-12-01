import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/sonner";
import { Calendar, School, TrendingUp, Download, FileText, Search, Gift } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import { 
  Voucher2026,
  Voucher2026Exception,
  Voucher2026Installment,
  loadVoucher2026Data,
  getVoucher2026Stats,
  filterVouchers2026,
  exportVoucher2026Report
} from "@/lib/voucher2026Processor";

const Voucher2026Dashboard = () => {
  const [vouchers, setVouchers] = useState<Voucher2026[]>([]);
  const [filteredVouchers, setFilteredVouchers] = useState<Voucher2026[]>([]);
  const [exceptions, setExceptions] = useState<Voucher2026Exception[]>([]);
  const [installments, setInstallments] = useState<Voucher2026Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [voucherEligible, setVoucherEligible] = useState<string>("all");
  const [voucherSent, setVoucherSent] = useState<string>("all");
  const [safConsultant, setSafConsultant] = useState<string>("all");
  const [activeSection, setActiveSection] = useState<"vouchers" | "exceptions" | "installments">("vouchers");
  const navigate = useNavigate();
  const location = useLocation();
  const queryYear = new URLSearchParams(location.search).get("year");
  const [activeCampaign, setActiveCampaign] = useState<string>(queryYear || "2026");
  const [campaigns, setCampaigns] = useState<number[]>(() => {
    const saved = localStorage.getItem("voucherCampaigns");
    const base = [2025, 2026];
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as number[];
        return Array.from(new Set([...base, ...parsed])).sort();
      } catch {
        return base;
      }
    }
    return base;
  });

  useEffect(() => {
    loadData(activeCampaign);
  }, [activeCampaign]);

  useEffect(() => {
    applyFilters();
  }, [vouchers, searchTerm, selectedCluster, selectedStatus, voucherEligible, voucherSent, safConsultant]);

  const loadData = async (campaignYear: string) => {
    try {
      setLoading(true);
      const { vouchers: loadedVouchers, exceptions: loadedExceptions, installments: loadedInstallments } = await loadVoucher2026Data(campaignYear);
      setVouchers(loadedVouchers);
      setFilteredVouchers(loadedVouchers);
      setExceptions(loadedExceptions);
      setInstallments(loadedInstallments);
      toast.success(`Dados dos vouchers ${campaignYear} carregados!`);
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

  const persistCampaigns = (list: number[]) => {
    setCampaigns(list);
    localStorage.setItem("voucherCampaigns", JSON.stringify(list));
  };

  const handleSelectCampaign = (year: number) => {
    setActiveCampaign(year.toString());
    setActiveSection("vouchers");
    navigate(`${location.pathname}?year=${year}`);
  };

  const handleAddCampaign = () => {
    const input = prompt("Informe o ano da nova campanha (ex: 2027)");
    if (!input) return;
    const numeric = parseInt(input.trim(), 10);
    if (!numeric || input.trim().length !== 4) {
      toast.error("Digite um ano valido com 4 digitos.");
      return;
    }
    if (campaigns.includes(numeric)) {
      handleSelectCampaign(numeric);
      return;
    }
    const updated = [...campaigns, numeric].sort();
    persistCampaigns(updated);
    handleSelectCampaign(numeric);
  };

  const tabButtonClass = (isActive: boolean) =>
    [
      "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors border",
      isActive
        ? "bg-white text-primary border-primary/40 shadow-sm"
        : "bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:border-border",
    ].join(" ");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full pb-10">
      <div className="layout-wide w-full py-8 space-y-8">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Vouchers Campanha {activeCampaign}</h1>
                <p className="text-muted-foreground">Gerenciamento da campanha de vouchers Canva {activeCampaign}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Relatrio PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => exportVoucher2026Report(filteredVouchers)}>
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
              <Button size="sm" onClick={() => loadData(activeCampaign)}>Atualizar Dados</Button>
            </div>
          </div>

          <div className="rounded-lg border border-border/70 bg-card px-3 py-2 shadow-sm">
            <div className="flex items-center flex-wrap gap-2">
              {campaigns.map((year) => {
                const isActive = activeCampaign === year.toString() && activeSection === "vouchers";
                return (
                  <button
                    key={year}
                    className={tabButtonClass(isActive)}
                    onClick={() => {
                      setActiveSection("vouchers");
                      handleSelectCampaign(year);
                    }}
                    aria-pressed={isActive}
                  >
                    Campanha {year}
                  </button>
                );
              })}
              <span className="mx-1 h-6 w-px bg-border/70" aria-hidden />
              <button
                className={tabButtonClass(activeSection === "exceptions")}
                onClick={() => setActiveSection("exceptions")}
                aria-pressed={activeSection === "exceptions"}
              >
                Excecoes
              </button>
              <button
                className={tabButtonClass(activeSection === "installments")}
                onClick={() => setActiveSection("installments")}
                aria-pressed={activeSection === "installments"}
              >
                Parcelamento
              </button>
              <Button variant="ghost" size="sm" className="ml-auto" onClick={handleAddCampaign}>
                + Nova campanha
              </Button>
            </div>
          </div>
        </div>

        {activeSection === "vouchers" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatsCard
                title="Total de Escolas"
                value={stats.totalSchools.toString()}
                trend={{ value: stats.eligibilityRate, isPositive: stats.eligibilityRate > 50 }}
                icon={<School className="h-4 w-4" />}
              />
              <StatsCard
                title="Escolas Elegveis"
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

            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Buscar vouchers</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      placeholder="Nome, ID ou cdigo do voucher..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="h-10 sm:max-w-md"
                    />
                    <Button variant="outline" size="icon" className="h-10 w-10" onClick={applyFilters}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-muted-foreground">Filtros</Label>
                  <div className="flex flex-wrap gap-3">
                    <div className="min-w-[140px]">
                      <Select value={selectedCluster} onValueChange={setSelectedCluster}>
                        <SelectTrigger className="h-9 text-sm">
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

                    <div className="min-w-[130px]">
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger className="h-9 text-sm">
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
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Elegvel" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-md">
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="true">Elegveis</SelectItem>
                          <SelectItem value="false">No Elegveis</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="min-w-[120px]">
                      <Select value={voucherSent} onValueChange={setVoucherSent}>
                        <SelectTrigger className="h-9 text-sm">
                          <SelectValue placeholder="Enviado" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-md">
                          <SelectItem value="all">Todos</SelectItem>
                          <SelectItem value="true">Enviados</SelectItem>
                          <SelectItem value="false">No Enviados</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="min-w-[170px]">
                      <Select value={safConsultant} onValueChange={setSafConsultant}>
                        <SelectTrigger className="h-9 text-sm">
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
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
                        <p className="text-sm text-muted-foreground">Cdigo do Voucher</p>
                        <code className="text-sm bg-muted px-2 py-1 rounded">{voucher.voucherCode}</code>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Badge variant={voucher.voucherEligible ? "default" : "secondary"}>
                        {voucher.voucherEligible ? "Elegvel" : "No Elegvel"}
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
          </>
        )}

        {activeSection === "exceptions" && (
          <Card>
            <CardHeader>
              <CardTitle>Excecoes registradas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {exceptions.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma excecao carregada para esta campanha.</p>}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {exceptions.map((item) => (
                  <div key={`${item.unit}-${item.code}`} className="rounded-lg border border-border/70 bg-card p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{item.unit}</p>
                      <Badge variant="outline" className="text-xs">Uso: {item.usageCount}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">Responsavel: {item.financialResponsible || "N/A"}</p>
                    <p className="text-sm text-muted-foreground">Curso: {item.course || "-"}</p>
                    <p className="text-sm">
                      <span className="text-muted-foreground">Voucher:</span>{" "}
                      <code className="bg-muted px-2 py-0.5 rounded">{item.code}</code>
                    </p>
                    <p className="text-xs text-muted-foreground">Solicitado por: {item.requestedBy || "N/A"}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === "installments" && (
          <Card>
            <CardHeader>
              <CardTitle>Parcelamento (funcionarios / dependentes)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {installments.length === 0 && <p className="text-sm text-muted-foreground">Nenhum registro de parcelamento para esta campanha.</p>}
              {installments.length > 0 && (
                <div className="overflow-auto rounded-lg border border-border/70">
                  <table className="min-w-full text-sm">
                    <thead className="bg-muted/70 text-left">
                      <tr>
                        <th className="px-3 py-2 font-semibold">Funcionario</th>
                        <th className="px-3 py-2 font-semibold">CPF</th>
                        <th className="px-3 py-2 font-semibold">Escola</th>
                        <th className="px-3 py-2 font-semibold">Dependente</th>
                        <th className="px-3 py-2 font-semibold">Serie</th>
                      </tr>
                    </thead>
                    <tbody>
                      {installments.map((item, idx) => (
                        <tr key={`${item.employeeCpf}-${idx}`} className="border-t border-border/60">
                          <td className="px-3 py-2">{item.employeeName}</td>
                          <td className="px-3 py-2">{item.employeeCpf}</td>
                          <td className="px-3 py-2">{item.school}</td>
                          <td className="px-3 py-2">{item.childName}</td>
                          <td className="px-3 py-2">{item.series}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Voucher2026Dashboard;

