import { useState } from 'react';
import { formatCurrency, formatDateBR, formatPercentage } from '@/lib/formatters';
import { downloadCSV } from '@/lib/fileUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  FileText,
  Plus,
  Download,
  Calendar,
  Target,
  Trash2,
  History
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { InvoiceDialog } from './InvoiceDialog';
import { toast } from "@/components/ui/sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CanvaInvoice } from '@/types/invoicing';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export const CostManagementDashboard = () => {
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(new Set([currentYear, 2026])).sort((a, b) => b - a);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [invoiceToDelete, setInvoiceToDelete] = useState<CanvaInvoice | null>(null);
  
  const { 
    invoices, 
    annualBudget,
    deletionHistory,
    getCostAnalytics, 
    getBudgetAlerts,
    getMonthlySpending,
    setAnnualBudget,
    removeInvoice 
  } = useInvoiceStore();

  const analytics = getCostAnalytics(selectedYear);
  const alerts = getBudgetAlerts();
  const monthlySpending = getMonthlySpending(selectedYear);
  const filteredInvoices = invoices
    .filter(inv => new Date(inv.date).getFullYear() === selectedYear)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const deletionHistoryForYear = deletionHistory
    .filter(entry => {
      const baseDate = entry.date ?? entry.deletedAt;
      return new Date(baseDate).getFullYear() === selectedYear;
    })
    .sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());

  const budgetUsagePercent = (analytics.totalYearCost / annualBudget) * 100;
  const remainingBudget = Math.max(0, annualBudget - analytics.totalYearCost);

  const handleExportInvoices = () => {
    const csvData = [
      ['Data', 'Numero', 'Descricao', 'Equipe', 'Valor', 'Status'],
      ...invoices.map(inv => [
        formatDateBR(inv.date),
        inv.invoiceNumber,
        inv.description,
        inv.team || 'N/A',
        formatCurrency(inv.amount),
        inv.status === 'paid' ? 'Pago' : 'Pendente'
      ])
    ];

    downloadCSV(csvData, `faturas-canva-${selectedYear}`);
    toast.success('Faturas exportadas com sucesso');
  };

  const handleDeleteInvoice = () => {
    if (!invoiceToDelete) return;
    removeInvoice(invoiceToDelete.id);
    toast.success('Fatura excluida e registrada no historico');
    setInvoiceToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestao de Custos Canva</h2>
          <p className="text-muted-foreground">
            Controle financeiro e analise de gastos com licencas
          </p>
        </div>
        <div className="flex gap-2">
          <Select 
            value={selectedYear.toString()} 
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowInvoiceDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nova Fatura
          </Button>
        </div>
      </div>

      {/* Budget Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <Card key={alert.id} className={`border-l-4 ${
              alert.severity === 'high' ? 'border-l-destructive bg-destructive/5' :
              alert.severity === 'medium' ? 'border-l-warning bg-warning/5' :
              'border-l-primary bg-primary/5'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${
                    alert.severity === 'high' ? 'text-destructive' :
                    alert.severity === 'medium' ? 'text-warning' :
                    'text-primary'
                  }`} />
                  <span className="font-medium">{alert.message}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Gasto Total"
          value={formatCurrency(analytics.totalYearCost)}
          description={`${selectedYear}  ${analytics.totalInvoices} faturas`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatsCard
          title="Media Mensal"
          value={formatCurrency(analytics.averageMonthly)}
          description="Gasto medio por mes"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatsCard
          title="Custo por Licen?a"
          value={formatCurrency(analytics.costPerLicense)}
          description="Baseado em licencas ativas"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatsCard
          title="Orcamento Utilizado"
          value={formatPercentage(budgetUsagePercent)}
          description={`${formatCurrency(remainingBudget)} restante`}
          icon={<Target className="h-4 w-4" />}
          variant={budgetUsagePercent > 100 ? "destructive" : "default"}
        />
        <StatsCard
          title="Orcamento Anual"
          value={formatCurrency(annualBudget)}
          description="Meta estabelecida"
          icon={<Target className="h-4 w-4" />}
        />
      </div>

      {/* Budget Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuracao de Orcamento</CardTitle>
          <CardDescription>Defina o orcamento anual para controle de gastos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="budget">Orcamento Anual (R$)</Label>
              <Input
                id="budget"
                type="number"
                value={annualBudget}
                onChange={(e) => setAnnualBudget(parseFloat(e.target.value) || 0)}
                placeholder="10000"
              />
            </div>
            <div className="pt-6">
              <Button onClick={() => toast.success('Orcamento atualizado')}>
                Salvar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Monthly Spending */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos Mensais</CardTitle>
            <CardDescription>Evolucao dos custos ao longo do ano</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [formatCurrency(Number(value)), 'Valor']}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Team Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Gastos por Equipe</CardTitle>
            <CardDescription>Distribuicao de custos entre equipes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.teamBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="amount"
                  label={({ team, percentage }) => `${team}: ${percentage.toFixed(1)}%`}
                >
                  {analytics.teamBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Faturas Canva</CardTitle>
            <CardDescription>Historico de pagamentos e pendencias</CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportInvoices}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhuma fatura registrada para este ano.</p>
            ) : (
              filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{invoice.description}</span>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                        {invoice.status === 'paid' ? 'Pago' : 'Pendente'}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {invoice.invoiceNumber}  {invoice.team}  {formatDateBR(invoice.date)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-bold text-lg">{formatCurrency(invoice.amount)}</div>
                      <div className="text-sm text-muted-foreground">{invoice.currency}</div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => setInvoiceToDelete(invoice)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Historico de exclusao</CardTitle>
            <CardDescription>Registro das faturas removidas para rastreabilidade</CardDescription>
          </div>
          <Badge variant="outline" className="gap-1">
            <History className="h-4 w-4" />
            {deletionHistoryForYear.length} registros
          </Badge>
        </CardHeader>
        <CardContent>
          {deletionHistoryForYear.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma exclusao registrada para {selectedYear}. Faturas removidas aparecerao aqui com valor e data.
            </p>
          ) : (
            <div className="space-y-3">
              {deletionHistoryForYear.slice(0, 10).map((entry) => (
                <div key={entry.id} className="rounded-lg border p-3 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <History className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{entry.description}</span>
                    <Badge variant="outline" className="text-[11px]">
                      {entry.status === 'paid' ? 'Pago' : 'Pendente'}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>Fatura {entry.invoiceNumber}</span>
                    {entry.team && <span>Equipe {entry.team}</span>}
                    <span>Data original {entry.date ? formatDateBR(entry.date) : 'n/d'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Excluida em {new Date(entry.deletedAt).toLocaleString('pt-BR')}
                    </span>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(entry.amount)}</div>
                      <div className="text-xs text-muted-foreground">{entry.currency}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!invoiceToDelete} onOpenChange={(open) => !open && setInvoiceToDelete(null)}>
        <AlertDialogContent className="rounded-xl border border-border/70 shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusao</AlertDialogTitle>
            <AlertDialogDescription>
              A fatura {invoiceToDelete?.invoiceNumber} sera removida da lista e registrada no historico. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:space-x-3 sm:justify-end gap-3">
            <AlertDialogCancel className="rounded-lg" onClick={() => setInvoiceToDelete(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="rounded-lg bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteInvoice}
            >
              Excluir fatura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Invoice Dialog */}
      <InvoiceDialog
        open={showInvoiceDialog}
        onOpenChange={setShowInvoiceDialog}
      />
    </div>
  );
};
