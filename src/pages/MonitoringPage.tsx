import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  Clock, 
  Download,
  Tag,
  Search,
  MessageSquare
} from 'lucide-react';
import { useTicketStore } from '@/stores/ticketStore';
import { useAuthStore } from '@/stores/authStore';
import { format, differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { Ticket } from '@/types/tickets';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const MonitoringPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { tickets, updateTicket, getCriticalTickets, getOverdueTickets } = useTicketStore();
  const { hasRole } = useAuthStore();

  // Redirect if not authorized
  if (!hasRole('Coordinator')) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card>
          <CardContent className="py-16 text-center">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-orange-500" />
            <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">
              Apenas Coordenadores e Administradores podem acessar a Monitoria.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const criticalTickets = getCriticalTickets();
  const overdueTickets = getOverdueTickets();
  
  // Combine and filter tickets
  const monitoringTickets = [
    ...overdueTickets.map(t => ({ ...t, category: 'overdue' })),
    ...criticalTickets.filter(t => !overdueTickets.find(ot => ot.id === t.id))
      .map(t => ({ ...t, category: 'critical' }))
  ].filter(ticket => 
    !searchTerm || 
    ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.observacao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.agente.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCobrar = (ticket: Ticket) => {
    const today = format(new Date(), 'dd/MM/yyyy');
    const cobrancaTag = `Cobrado ${today}`;
    
    const existingTags = ticket.tags || [];
    if (existingTags.some(tag => tag.startsWith('Cobrado'))) {
      toast.info('Este ticket já foi cobrado hoje');
      return;
    }

    updateTicket(ticket.id, {
      tags: [...existingTags, cobrancaTag]
    });

    toast.success(`Cobrança registrada para ${ticket.agente} - ${ticket.id}`);
  };

  const exportToCSV = () => {
    const csvData = [
      ['ID', 'Agente', 'Dias Aberto', 'Status', 'Vencimento', 'Categoria', 'Observação'],
      ...monitoringTickets.map(ticket => [
        ticket.id,
        ticket.agente,
        ticket.diasAberto.toString(),
        ticket.status,
        ticket.dueDate ? format(new Date(ticket.dueDate), 'dd/MM/yyyy') : '',
        ticket.category === 'overdue' ? 'Vencido' : 'Crítico',
        ticket.observacao.replace(/,/g, ';') // Replace commas to avoid CSV issues
      ])
    ];

    const csvContent = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `monitoria-tickets-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }

    toast.success('Relatório exportado com sucesso');
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'overdue':
        return <Badge variant="destructive">Vencido</Badge>;
      case 'critical':
        return <Badge className="bg-orange-100 text-orange-800">Crítico</Badge>;
      default:
        return <Badge variant="outline">Normal</Badge>;
    }
  };

  const getDaysOverdue = (dueDate?: string) => {
    if (!dueDate) return 0;
    return Math.abs(differenceInDays(new Date(), new Date(dueDate)));
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-primary" />
            Monitoria SAF
          </h1>
          <p className="text-muted-foreground">
            Acompanhe tickets vencidos e críticos que precisam de atenção
          </p>
        </div>
        
        <Button onClick={exportToCSV} className="gap-2">
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Vencidos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{overdueTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              Passaram do prazo de vencimento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Críticos</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{criticalTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              Mais de 15 dias em aberto
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Monitoria</CardTitle>
            <Tag className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{monitoringTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              Tickets que precisam de atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tickets por ID, agente ou observação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tickets para Monitoria</CardTitle>
          <CardDescription>
            Tickets vencidos e críticos que precisam de acompanhamento
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {monitoringTickets.length === 0 ? (
            <div className="py-16 text-center">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum ticket para monitoria</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Nenhum ticket encontrado com os critérios de busca.' : 'Todos os tickets estão dentro do prazo normal!'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Agente</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Dias Aberto</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Observação</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="w-24">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monitoringTickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <span className="font-mono text-sm font-bold">{ticket.id}</span>
                    </TableCell>
                    
                    <TableCell>
                      <span className="font-medium">{ticket.agente}</span>
                    </TableCell>
                    
                    <TableCell>
                      {getCategoryBadge(ticket.category)}
                    </TableCell>
                    
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {ticket.diasAberto} dias
                      </Badge>
                    </TableCell>
                    
                    <TableCell>
                      {ticket.dueDate ? (
                        <div className="text-sm">
                          <div>{format(new Date(ticket.dueDate), 'dd/MM/yyyy')}</div>
                          {ticket.category === 'overdue' && (
                            <div className="text-xs text-red-600">
                              {getDaysOverdue(ticket.dueDate)} dias atrasado
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {ticket.observacao}
                      </p>
                    </TableCell>
                    
                    <TableCell>
                      {ticket.tags && ticket.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {ticket.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {ticket.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{ticket.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}
                    </TableCell>
                    
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCobrar(ticket)}
                        disabled={ticket.tags?.some(tag => tag.includes(format(new Date(), 'dd/MM/yyyy')))}
                      >
                        Cobrar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MonitoringPage;