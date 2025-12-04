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
  Target
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { InvoiceDialog } from './InvoiceDialog';
import { toast } from "@/components/ui/sonner";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export const CostManagementDashboard = () => {
  const currentYear = new Date().getFullYear();
  const availableYears = Array.from(new Set([currentYear, 2026])).sort((a, b) => b - a);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  
  const { 
    invoices, 
    annualBudget,
    getCostAnalytics, 
    getBudgetAlerts,
    getMonthlySpending,
    setAnnualBudget 
  } = useInvoiceStore();

  const analytics = getCostAnalytics(selectedYear);
  const alerts = getBudgetAlerts();
  const monthlySpending = getMonthlySpending(selectedYear);

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
            {invoices
              .filter(inv => new Date(inv.date).getFullYear() === selectedYear)
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
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
                  <div className="text-right">
                    <div className="font-bold text-lg">{formatCurrency(invoice.amount)}</div>
                    <div className="text-sm text-muted-foreground">{invoice.currency}</div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Invoice Dialog */}
      <InvoiceDialog
        open={showInvoiceDialog}
        onOpenChange={setShowInvoiceDialog}
      />
    </div>
  );
};
