import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User, Plus, Eye, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface AgendaItem {
  id: string;
  escolaId: string;
  titulo: string;
  descricao: string;
  dataVisita: Date;
  tipo: 'visita' | 'reuniao' | 'auditoria' | 'treinamento' | 'outros';
  responsavel: string;
  status: 'agendado' | 'em-andamento' | 'concluido' | 'cancelado';
  criadoPor: string;
  criadoEm: Date;
  historico: Array<{
    data: Date;
    usuario: string;
    acao: string;
    detalhes: string;
  }>;
}

interface SchoolAgendaProps {
  escolaId: string;
  escolaNome: string;
}

const SchoolAgenda = ({ escolaId, escolaNome }: SchoolAgendaProps) => {
  const [agenda, setAgenda] = useState<AgendaItem[]>([
    {
      id: '1',
      escolaId,
      titulo: 'Visita técnica - Verificação Canva',
      descricao: 'Rafael irá visitar a escola para verificar implementação das licenças Canva e dar suporte técnico',
      dataVisita: new Date('2024-09-25'),
      tipo: 'visita',
      responsavel: 'Rafael',
      status: 'agendado',
      criadoPor: 'Ana Paula',
      criadoEm: new Date('2024-09-20'),
      historico: [
        { data: new Date('2024-09-20'), usuario: 'Ana Paula', acao: 'Agendou visita', detalhes: 'Visita técnica agendada' }
      ]
    }
  ]);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<AgendaItem | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const { toast } = useToast();

  const [newItem, setNewItem] = useState({
    titulo: '',
    descricao: '',
    dataVisita: '',
    tipo: 'visita' as const,
    responsavel: ''
  });

  const handleCreateItem = () => {
    if (!newItem.titulo || !newItem.dataVisita || !newItem.responsavel) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive",
      });
      return;
    }

    const agendaItem: AgendaItem = {
      id: Date.now().toString(),
      escolaId,
      titulo: newItem.titulo,
      descricao: newItem.descricao,
      dataVisita: new Date(newItem.dataVisita),
      tipo: newItem.tipo,
      responsavel: newItem.responsavel,
      status: 'agendado',
      criadoPor: 'Sistema', // Em produção seria o usuário logado
      criadoEm: new Date(),
      historico: [
        {
          data: new Date(),
          usuario: 'Sistema',
          acao: 'Item criado',
          detalhes: `${newItem.tipo} agendado(a) para ${new Date(newItem.dataVisita).toLocaleDateString()}`
        }
      ]
    };

    setAgenda([agendaItem, ...agenda]);
    setNewItem({ titulo: '', descricao: '', dataVisita: '', tipo: 'visita', responsavel: '' });
    setIsCreateDialogOpen(false);
    
    toast({
      title: "Sucesso",
      description: "Item da agenda criado com sucesso!",
    });
  };

  const handleStatusChange = (itemId: string, newStatus: AgendaItem['status']) => {
    setAgenda(agenda.map(item => {
      if (item.id === itemId) {
        return {
          ...item,
          status: newStatus,
          historico: [
            ...item.historico,
            {
              data: new Date(),
              usuario: 'Sistema',
              acao: 'Status alterado',
              detalhes: `Status alterado para ${newStatus}`
            }
          ]
        };
      }
      return item;
    }));

    toast({
      title: "Status Atualizado",
      description: `Item marcado como ${newStatus}`,
    });
  };

  const handleDeleteItem = (itemId: string) => {
    setAgenda(agenda.filter(item => item.id !== itemId));
    toast({
      title: "Item Removido",
      description: "Item da agenda foi removido",
    });
  };

  const getStatusBadge = (status: AgendaItem['status']) => {
    switch (status) {
      case 'agendado':
        return <Badge className="bg-blue-500 hover:bg-blue-600">Agendado</Badge>;
      case 'em-andamento':
        return <Badge className="bg-orange-500 hover:bg-orange-600">Em Andamento</Badge>;
      case 'concluido':
        return <Badge className="bg-green-500 hover:bg-green-600">Concluído</Badge>;
      case 'cancelado':
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTipoBadge = (tipo: AgendaItem['tipo']) => {
    const colors = {
      visita: 'bg-purple-100 text-purple-800',
      reuniao: 'bg-blue-100 text-blue-800',
      auditoria: 'bg-red-100 text-red-800',
      treinamento: 'bg-green-100 text-green-800',
      outros: 'bg-gray-100 text-gray-800'
    };
    
    return <Badge variant="outline" className={colors[tipo]}>{tipo}</Badge>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Agenda - {escolaNome}
        </h3>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Novo Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Item da Agenda</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título*</Label>
                <Input
                  id="titulo"
                  placeholder="Ex: Visita técnica..."
                  value={newItem.titulo}
                  onChange={(e) => setNewItem({ ...newItem, titulo: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <Select value={newItem.tipo} onValueChange={(value: any) => setNewItem({ ...newItem, tipo: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visita">Visita</SelectItem>
                    <SelectItem value="reuniao">Reunião</SelectItem>
                    <SelectItem value="auditoria">Auditoria</SelectItem>
                    <SelectItem value="treinamento">Treinamento</SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="responsavel">Responsável*</Label>
                <Select value={newItem.responsavel} onValueChange={(value) => setNewItem({ ...newItem, responsavel: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Rafael">Rafael</SelectItem>
                    <SelectItem value="João">João</SelectItem>
                    <SelectItem value="Ingrid">Ingrid</SelectItem>
                    <SelectItem value="Ana Paula">Ana Paula (Coordenadora)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="dataVisita">Data*</Label>
                <Input
                  id="dataVisita"
                  type="datetime-local"
                  value={newItem.dataVisita}
                  onChange={(e) => setNewItem({ ...newItem, dataVisita: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o objetivo..."
                  value={newItem.descricao}
                  onChange={(e) => setNewItem({ ...newItem, descricao: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateItem} className="w-full">
                Criar Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {agenda.map((item) => (
          <Card key={item.id} className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-medium">{item.titulo}</h4>
                    {getTipoBadge(item.tipo)}
                    {getStatusBadge(item.status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {item.dataVisita.toLocaleDateString()} às {item.dataVisita.toLocaleTimeString()}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {item.responsavel}
                    </div>
                  </div>
                  
                  {item.descricao && (
                    <p className="text-sm text-muted-foreground">{item.descricao}</p>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedItem(item);
                      setIsDetailsDialogOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  
                  {item.status === 'agendado' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusChange(item.id, 'em-andamento')}
                    >
                      Iniciar
                    </Button>
                  )}
                  
                  {item.status === 'em-andamento' && (
                    <Button
                      size="sm"
                      onClick={() => handleStatusChange(item.id, 'concluido')}
                    >
                      Concluir
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {agenda.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum item na agenda para esta escola</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Item</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Título</Label>
                  <p className="font-medium">{selectedItem.titulo}</p>
                </div>
                <div>
                  <Label>Tipo</Label>
                  <div className="mt-1">{getTipoBadge(selectedItem.tipo)}</div>
                </div>
                <div>
                  <Label>Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
                </div>
                <div>
                  <Label>Responsável</Label>
                  <p>{selectedItem.responsavel}</p>
                </div>
                <div>
                  <Label>Data</Label>
                  <p>{selectedItem.dataVisita.toLocaleString()}</p>
                </div>
                <div>
                  <Label>Criado por</Label>
                  <p>{selectedItem.criadoPor}</p>
                </div>
              </div>
              
              <div>
                <Label>Descrição</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedItem.descricao || 'Nenhuma descrição fornecida'}
                </p>
              </div>
              
              <div>
                <Label>Histórico</Label>
                <div className="space-y-2 mt-2">
                  {selectedItem.historico.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm border-l-2 border-muted pl-3">
                      <Clock className="w-3 h-3" />
                      <span className="text-muted-foreground">
                        {entry.data.toLocaleString()}
                      </span>
                      <span className="font-medium">{entry.usuario}</span>
                      <span>{entry.acao}</span>
                      {entry.detalhes && (
                        <span className="text-muted-foreground">- {entry.detalhes}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SchoolAgenda;