import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Users, 
  MessageSquare, 
  Calendar,
  TrendingUp,
  Bell,
  FileText,
  Target,
  Activity
} from "lucide-react";
import { toast } from "sonner";

interface Ticket {
  id: string;
  quem: string;
  quando: string;
  dias: number;
  status: 'Pendente' | 'Resolvido';
  observacao: string;
}

interface Alert {
  id: string;
  type: 'warning' | 'info' | 'success';
  title: string;
  message: string;
  timestamp: Date;
  escola?: string;
}

const SAFControlCenter = () => {
  const [tickets] = useState<Ticket[]>([
    { id: '#258209', quem: 'João', quando: '22 dias', dias: 22, status: 'Pendente', observacao: 'aguardando dados, para Douglas colocar no dominio o PC do CRM' },
    { id: '#258809', quem: 'João', quando: '17 dias', dias: 17, status: 'Pendente', observacao: 'esse caso quem está verificando é Fernanda Inacio de Edtech' },
    { id: '#259134', quem: 'Tati', quando: '25 dias', dias: 25, status: 'Pendente', observacao: 'Ainda sendo tratado deste caso com o Iago' },
    { id: '#258993', quem: 'Ingrid', quando: '20 dias', dias: 20, status: 'Pendente', observacao: 'aguardando retorno do eduardo, há 20 dias pendente' },
    { id: '#261211', quem: 'João', quando: '1 dia', dias: 1, status: 'Pendente', observacao: 'recebemos evidencias hoje, enviado clickup toddle 261211' },
    { id: '#262226', quem: 'João', quando: '4 dias', dias: 4, status: 'Resolvido', observacao: 'enviado resposta, aguardando dados' },
  ]);

  const [alerts, setAlerts] = useState<Alert[]>([
    {
      id: '1',
      type: 'warning',
      title: 'Cobrança da Coordenadora',
      message: 'Verificar status do ticket #258993 - Ingrid está aguardando há 20 dias',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      escola: 'Escola Valinhos'
    },
    {
      id: '2',
      type: 'info',
      title: 'Visita Agendada',
      message: 'Rafael visitará a escola de São Paulo na segunda-feira',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
      escola: 'São Paulo'
    },
    {
      id: '3',
      type: 'warning',
      title: 'Tickets Críticos',
      message: '5 tickets pendentes há mais de 15 dias necessitam atenção urgente',
      timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000)
    }
  ]);

  const pendingTickets = tickets.filter(t => t.status === 'Pendente');
  const criticalTickets = pendingTickets.filter(t => t.dias > 15);
  const todayTasks = pendingTickets.filter(t => t.dias <= 2);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pendente': return 'destructive';
      case 'Resolvido': return 'default';
      default: return 'secondary';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimeAgo = (timestamp: Date) => {
    const hours = Math.floor((Date.now() - timestamp.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'agora mesmo';
    if (hours === 1) return 'há 1 hora';
    if (hours < 24) return `há ${hours} horas`;
    const days = Math.floor(hours / 24);
    return `há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  };

  const clearAlert = (alertId: string) => {
    setAlerts(alerts.filter(a => a.id !== alertId));
    toast.success("Alerta removido");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="h-8 w-8 text-primary" />
          Centro de Controle SAF
        </h1>
        <p className="text-muted-foreground">
          Visão geral dos seus atendimentos, monitorias e alertas importantes
        </p>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{pendingTickets.length}</div>
            <p className="text-xs text-muted-foreground">
              {criticalTickets.length} críticos ({'>'}15 dias)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas de Hoje</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{todayTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              Precisam atenção imediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">
              Requerem sua atenção
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {Math.round((tickets.filter(t => t.status === 'Resolvido').length / tickets.length) * 100)}%
            </div>
            <Progress value={Math.round((tickets.filter(t => t.status === 'Resolvido').length / tickets.length) * 100)} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticos */}
      {alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Alertas e Cobranças
            </CardTitle>
            <CardDescription>
              Situações que precisam da sua atenção imediata
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.map((alert) => (
              <div key={alert.id} className="flex items-start justify-between p-3 bg-white rounded-lg border">
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div>
                    <h4 className="font-medium text-sm">{alert.title}</h4>
                    <p className="text-sm text-muted-foreground">{alert.message}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {alert.escola && (
                        <Badge variant="outline" className="text-xs">
                          {alert.escola}
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {formatTimeAgo(alert.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => clearAlert(alert.id)}
                >
                  ×
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Tickets Críticos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-red-500" />
            Tickets Críticos ({'>'}15 dias)
          </CardTitle>
            <CardDescription>
              Tickets que precisam atenção urgente
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {criticalTickets.slice(0, 5).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{ticket.id}</span>
                    <Badge variant={getStatusColor(ticket.status) as any}>
                      {ticket.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">• {ticket.quem}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{ticket.observacao}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-red-600">{ticket.dias} dias</span>
                </div>
              </div>
            ))}
            {criticalTickets.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                🎉 Nenhum ticket crítico no momento!
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Ações de Hoje
            </CardTitle>
            <CardDescription>
              Tickets que precisam ser trabalhados hoje
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {todayTasks.map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium">{ticket.id}</span>
                    <Badge variant={getStatusColor(ticket.status) as any}>
                      {ticket.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">• {ticket.quem}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{ticket.observacao}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-medium text-blue-600">{ticket.quando}</span>
                </div>
              </div>
            ))}
            {todayTasks.length === 0 && (
              <p className="text-center text-muted-foreground py-4">
                ✅ Nenhuma tarefa urgente para hoje!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso rápido às principais funcionalidades do SAF
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto p-4">
              <MessageSquare className="h-6 w-6" />
              <span className="text-sm">Abrir Ticket</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto p-4">
              <Calendar className="h-6 w-6" />
              <span className="text-sm">Agendar Visita</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto p-4">
              <Users className="h-6 w-6" />
              <span className="text-sm">Ver Escolas</span>
            </Button>
            <Button variant="outline" className="flex flex-col items-center gap-2 h-auto p-4">
              <FileText className="h-6 w-6" />
              <span className="text-sm">Relatórios</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SAFControlCenter;
