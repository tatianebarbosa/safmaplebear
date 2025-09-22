import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
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
  Upload,
  Download,
  Calendar,
  Target
} from 'lucide-react';
import StatsCard from '@/components/dashboard/StatsCard';
import { useInvoiceStore } from '@/stores/invoiceStore';
import { InvoiceDialog } from './InvoiceDialog';
import { toast } from 'sonner';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

export const CostManagementDashboard = () => {
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  
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
      ['Data', 'Número', 'Descrição', 'Equipe', 'Valor', 'Status'],
      ...invoices.map(inv => [
        new Date(inv.date).toLocaleDateString('pt-BR'),
        inv.invoiceNumber,
        inv.description,
        inv.team || 'N/A',
        `R$ ${inv.amount.toFixed(2)}`,
        inv.status === 'paid' ? 'Pago' : 'Pendente'
      ])
    ];

    const csvContent = csvData.map(row => row.join(';')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `faturas-canva-${selectedYear}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Faturas exportadas com sucesso');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Custos Canva</h2>
          <p className="text-muted-foreground">
            Controle financeiro e análise de gastos com licenças
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
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2022">2022</SelectItem>
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
              alert.severity === 'high' ? 'border-l-red-500 bg-red-50' :
              alert.severity === 'medium' ? 'border-l-yellow-500 bg-yellow-50' :
              'border-l-blue-500 bg-blue-50'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className={`h-4 w-4 ${
                    alert.severity === 'high' ? 'text-red-600' :
                    alert.severity === 'medium' ? 'text-yellow-600' :
                    'text-blue-600'
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
          value={`R$ ${analytics.totalYearCost.toFixed(2)}`}
          description={`${selectedYear} • ${analytics.totalInvoices} faturas`}
          icon={<DollarSign className="h-4 w-4" />}
        />
        <StatsCard
          title="Média Mensal"
          value={`R$ ${analytics.averageMonthly.toFixed(2)}`}
          description="Gasto médio por mês"
          icon={<Calendar className="h-4 w-4" />}
        />
        <StatsCard
          title="Custo por Licença"
          value={`R$ ${analytics.costPerLicense.toFixed(2)}`}
          description="Baseado em licenças ativas"
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatsCard
          title="Orçamento Utilizado"
          value={`${budgetUsagePercent.toFixed(1)}%`}
          description={`R$ ${remainingBudget.toFixed(2)} restante`}
          icon={<Target className="h-4 w-4" />}
          variant={budgetUsagePercent > 100 ? "destructive" : "default"}
        />
        <StatsCard
          title="Orçamento Anual"
          value={`R$ ${annualBudget.toFixed(2)}`}
          description="Meta estabelecida"
          icon={<Target className="h-4 w-4" />}
        />
      </div>

      {/* Budget Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Orçamento</CardTitle>
          <CardDescription>Defina o orçamento anual para controle de gastos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="budget">Orçamento Anual (R$)</Label>
              <Input
                id="budget"
                type="number"
                value={annualBudget}
                onChange={(e) => setAnnualBudget(parseFloat(e.target.value) || 0)}
                placeholder="10000"
              />
            </div>
            <div className="pt-6">
              <Button onClick={() => toast.success('Orçamento atualizado')}>
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
            <CardDescription>Evolução dos custos ao longo do ano</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlySpending}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, 'Valor']}
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
            <CardDescription>Distribuição de custos entre equipes</CardDescription>
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
                  {analytics.teamBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `R$ ${Number(value).toFixed(2)}`} />
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
            <CardDescription>Histórico de pagamentos e pendências</CardDescription>
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
                      {invoice.invoiceNumber} • {invoice.team} • {new Date(invoice.date).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">R$ {invoice.amount.toFixed(2)}</div>
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