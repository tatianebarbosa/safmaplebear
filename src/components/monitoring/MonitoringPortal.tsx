import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, TrendingUp, AlertCircle, CheckCircle, Clock, Star } from "lucide-react";
import { toast } from "sonner";

interface MonitoringRecord {
  id: string;
  school: string;
  date: string;
  type: 'conversation' | 'feedback' | 'improvement';
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  content: string;
  feedback?: string;
  createdBy: string;
}

const MonitoringPortal = () => {
  const [records, setRecords] = useState<MonitoringRecord[]>([
    {
      id: '1',
      school: 'Maple Bear São Paulo - Pacaembu II',
      date: '2024-09-20',
      type: 'conversation',
      status: 'pending',
      priority: 'medium',
      content: 'Conversa sobre implementação do Canva na unidade. Professores relataram dificuldades iniciais.',
      createdBy: 'admin@maplebear.com.br'
    },
    {
      id: '2',
      school: 'Maple Bear Rio Claro - Centro I',
      date: '2024-09-19',
      type: 'feedback',
      status: 'completed',
      priority: 'high',
      content: 'Necessário melhorar comunicação sobre licenças. Escola relatou confusão sobre quantas licenças disponíveis.',
      feedback: 'Enviado material explicativo e agendada reunião de esclarecimento.',
      createdBy: 'admin@maplebear.com.br'
    }
  ]);

  const [newRecord, setNewRecord] = useState({
    school: '',
    type: 'conversation' as MonitoringRecord['type'],
    priority: 'medium' as MonitoringRecord['priority'],
    content: ''
  });

  const [feedbackText, setFeedbackText] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);

  const addRecord = () => {
    if (!newRecord.content.trim()) {
      toast.error("Por favor, preencha o conteúdo da monitoria");
      return;
    }

    const record: MonitoringRecord = {
      id: Date.now().toString(),
      ...newRecord,
      date: new Date().toISOString().split('T')[0],
      status: 'pending',
      createdBy: 'admin@maplebear.com.br'
    };

    setRecords(prev => [record, ...prev]);
    setNewRecord({
      school: '',
      type: 'conversation',
      priority: 'medium',
      content: ''
    });
    
    toast.success("Registro de monitoria adicionado com sucesso!");
  };

  const addFeedback = (recordId: string) => {
    if (!feedbackText.trim()) {
      toast.error("Por favor, digite o feedback");
      return;
    }

    setRecords(prev => prev.map(record => 
      record.id === recordId 
        ? { ...record, feedback: feedbackText, status: 'completed' as const }
        : record
    ));

    setFeedbackText('');
    setSelectedRecord(null);
    toast.success("Feedback adicionado com sucesso!");
  };

  const getStatusIcon = (status: MonitoringRecord['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'in_progress':
        return <AlertCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: MonitoringRecord['priority']) => {
    switch (priority) {
      case 'low':
        return 'secondary';
      case 'medium':
        return 'outline';
      case 'high':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusColor = (status: MonitoringRecord['status']) => {
    switch (status) {
      case 'pending':
        return 'outline';
      case 'in_progress':
        return 'default';
      case 'completed':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getTypeIcon = (type: MonitoringRecord['type']) => {
    switch (type) {
      case 'conversation':
        return <MessageSquare className="h-4 w-4" />;
      case 'feedback':
        return <Star className="h-4 w-4" />;
      case 'improvement':
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portal de Monitoria</h1>
          <p className="text-muted-foreground">
            Acompanhe conversas e aplique feedback nas unidades
          </p>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="records">Registros</TabsTrigger>
          <TabsTrigger value="new">Nova Monitoria</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Registros</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{records.length}</div>
                <p className="text-xs text-muted-foreground">
                  Registros de monitoria
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {records.filter(r => r.status === 'pending').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Aguardando ação
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Concluídos</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {records.filter(r => r.status === 'completed').length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Com feedback aplicado
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <div className="space-y-4">
            {records.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(record.type)}
                      <CardTitle className="text-lg">{record.school}</CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={getPriorityColor(record.priority)}>
                        {record.priority}
                      </Badge>
                      <Badge variant={getStatusColor(record.status)}>
                        {getStatusIcon(record.status)}
                        {record.status}
                      </Badge>
                    </div>
                  </div>
                  <CardDescription>
                    {record.date} • Criado por {record.createdBy}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{record.content}</p>
                  
                  {record.feedback && (
                    <div className="p-3 bg-success-bg border border-success/20 rounded-lg">
                      <h4 className="font-medium text-success mb-2">Feedback Aplicado:</h4>
                      <p className="text-sm text-success">{record.feedback}</p>
                    </div>
                  )}
                  
                  {record.status !== 'completed' && (
                    <div className="space-y-2">
                      {selectedRecord === record.id ? (
                        <div className="space-y-2">
                          <Textarea
                            placeholder="Digite o feedback a ser aplicado..."
                            value={feedbackText}
                            onChange={(e) => setFeedbackText(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              onClick={() => addFeedback(record.id)}
                            >
                              Salvar Feedback
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedRecord(null);
                                setFeedbackText('');
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setSelectedRecord(record.id)}
                        >
                          Adicionar Feedback
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="new" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nova Monitoria</CardTitle>
              <CardDescription>
                Registre uma nova conversa ou feedback para aplicar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Escola</label>
                  <input
                    type="text"
                    className="w-full p-2 border rounded-md"
                    placeholder="Nome da escola"
                    value={newRecord.school}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, school: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tipo</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={newRecord.type}
                    onChange={(e) => setNewRecord(prev => ({ 
                      ...prev, 
                      type: e.target.value as MonitoringRecord['type']
                    }))}
                  >
                    <option value="conversation">Conversa</option>
                    <option value="feedback">Feedback</option>
                    <option value="improvement">Melhoria</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Prioridade</label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={newRecord.priority}
                    onChange={(e) => setNewRecord(prev => ({ 
                      ...prev, 
                      priority: e.target.value as MonitoringRecord['priority']
                    }))}
                  >
                    <option value="low">Baixa</option>
                    <option value="medium">Média</option>
                    <option value="high">Alta</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Conteúdo</label>
                <Textarea
                  placeholder="Descreva a conversa, situação ou feedback a ser aplicado..."
                  value={newRecord.content}
                  onChange={(e) => setNewRecord(prev => ({ ...prev, content: e.target.value }))}
                  rows={4}
                />
              </div>

              <Button onClick={addRecord} className="w-full">
                <MessageSquare className="mr-2 h-4 w-4" />
                Criar Registro de Monitoria
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MonitoringPortal;