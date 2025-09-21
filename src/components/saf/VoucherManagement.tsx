import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Clock, CheckCircle, AlertCircle, Trash2, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface VoucherRecord {
  id: string;
  school: string;
  type: string;
  amount: number;
  status: 'pendente' | 'criado' | 'enviado' | 'usado';
  requestedBy: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  voucherCode?: string;
  editHistory: EditHistoryRecord[];
}

interface EditHistoryRecord {
  id: string;
  voucherId: string;
  field: string;
  oldValue: any;
  newValue: any;
  editedBy: string;
  editedAt: string;
  reason: string;
}

const VoucherManagement = () => {
  const [vouchers, setVouchers] = useState<VoucherRecord[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<VoucherRecord | null>(null);
  const [viewHistory, setViewHistory] = useState<string | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    school: '',
    type: 'canva_pro',
    amount: 1,
    description: '',
    requestedBy: '',
    reason: ''
  });

  // Carregar vouchers do localStorage
  useEffect(() => {
    const saved = localStorage.getItem('saf_vouchers');
    if (saved) {
      setVouchers(JSON.parse(saved));
    }
  }, []);

  // Salvar no localStorage
  const saveVouchers = (newVouchers: VoucherRecord[]) => {
    setVouchers(newVouchers);
    localStorage.setItem('saf_vouchers', JSON.stringify(newVouchers));
  };

  // Registrar histórico de edição
  const addEditHistory = (voucherId: string, field: string, oldValue: any, newValue: any, reason: string = '') => {
    const historyRecord: EditHistoryRecord = {
      id: `edit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      voucherId,
      field,
      oldValue,
      newValue,
      editedBy: localStorage.getItem("userEmail") || "Sistema",
      editedAt: new Date().toLocaleString('pt-BR'),
      reason
    };

    const updatedVouchers = vouchers.map(voucher => {
      if (voucher.id === voucherId) {
        return {
          ...voucher,
          editHistory: [...voucher.editHistory, historyRecord],
          updatedAt: new Date().toLocaleString('pt-BR')
        };
      }
      return voucher;
    });

    saveVouchers(updatedVouchers);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingVoucher) {
      // Editar voucher existente
      const updatedVouchers = vouchers.map(voucher => {
        if (voucher.id === editingVoucher.id) {
          // Registrar mudanças no histórico
          Object.keys(formData).forEach(key => {
            const fieldKey = key as keyof typeof formData;
            if (formData[fieldKey] !== (voucher as any)[fieldKey]) {
              addEditHistory(
                voucher.id,
                fieldKey,
                (voucher as any)[fieldKey],
                formData[fieldKey],
                formData.reason
              );
            }
          });

          return {
            ...voucher,
            ...formData,
            updatedAt: new Date().toLocaleString('pt-BR')
          };
        }
        return voucher;
      });

      saveVouchers(updatedVouchers);
      toast({
        title: "Voucher atualizado",
        description: "Voucher foi atualizado com sucesso"
      });
    } else {
      // Criar novo voucher
      const newVoucher: VoucherRecord = {
        id: `voucher_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        school: formData.school,
        type: formData.type,
        amount: formData.amount,
        status: 'pendente',
        requestedBy: formData.requestedBy,
        createdAt: new Date().toLocaleString('pt-BR'),
        updatedAt: new Date().toLocaleString('pt-BR'),
        description: formData.description,
        editHistory: []
      };

      saveVouchers([...vouchers, newVoucher]);
      toast({
        title: "Voucher criado",
        description: "Novo voucher foi criado com sucesso"
      });
    }

    // Reset form
    setFormData({
      school: '',
      type: 'canva_pro',
      amount: 1,
      description: '',
      requestedBy: '',
      reason: ''
    });
    setEditingVoucher(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (voucher: VoucherRecord) => {
    setEditingVoucher(voucher);
    setFormData({
      school: voucher.school,
      type: voucher.type,
      amount: voucher.amount,
      description: voucher.description,
      requestedBy: voucher.requestedBy,
      reason: ''
    });
    setIsDialogOpen(true);
  };

  const updateStatus = (id: string, status: VoucherRecord['status']) => {
    const updatedVouchers = vouchers.map(voucher => {
      if (voucher.id === id) {
        addEditHistory(id, 'status', voucher.status, status, 'Atualização de status');
        return {
          ...voucher,
          status,
          updatedAt: new Date().toLocaleString('pt-BR'),
          voucherCode: status === 'criado' ? `VC${Date.now()}` : voucher.voucherCode
        };
      }
      return voucher;
    });

    saveVouchers(updatedVouchers);
    toast({
      title: "Status atualizado",
      description: `Status do voucher foi alterado para ${status}`
    });
  };

  const deleteVoucher = (id: string) => {
    const updatedVouchers = vouchers.filter(v => v.id !== id);
    saveVouchers(updatedVouchers);
    toast({
      title: "Voucher removido",
      description: "Voucher foi removido do sistema"
    });
  };

  const exportData = () => {
    const csvContent = [
      ['Escola', 'Tipo', 'Quantidade', 'Status', 'Solicitado por', 'Criado em', 'Código', 'Descrição'].join(','),
      ...vouchers.map(v => [
        v.school,
        v.type,
        v.amount,
        v.status,
        v.requestedBy,
        v.createdAt,
        v.voucherCode || '',
        v.description.replace(/,/g, ';')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vouchers_saf_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendente': return <Clock className="w-4 h-4" />;
      case 'criado': return <CheckCircle className="w-4 h-4" />;
      case 'enviado': return <CheckCircle className="w-4 h-4" />;
      case 'usado': return <CheckCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendente': return 'secondary';
      case 'criado': return 'default';
      case 'enviado': return 'outline';
      case 'usado': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Vouchers</h1>
          <p className="text-muted-foreground">Controle e histórico de vouchers para escolas</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportData} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditingVoucher(null);
                setFormData({
                  school: '',
                  type: 'canva_pro',
                  amount: 1,
                  description: '',
                  requestedBy: '',
                  reason: ''
                });
              }}>
                <Plus className="w-4 h-4 mr-2" />
                Novo Voucher
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingVoucher ? 'Editar' : 'Novo'} Voucher</DialogTitle>
                <DialogDescription>
                  {editingVoucher ? 'Edite as informações do voucher' : 'Crie um novo voucher para uma escola'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="school">Escola</Label>
                  <Input
                    id="school"
                    value={formData.school}
                    onChange={(e) => setFormData({...formData, school: e.target.value})}
                    placeholder="Nome da escola"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type">Tipo de Voucher</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="canva_pro">Canva Pro</SelectItem>
                      <SelectItem value="canva_teams">Canva for Teams</SelectItem>
                      <SelectItem value="canva_education">Canva for Education</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Quantidade</Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: parseInt(e.target.value)})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="requestedBy">Solicitado por</Label>
                  <Input
                    id="requestedBy"
                    value={formData.requestedBy}
                    onChange={(e) => setFormData({...formData, requestedBy: e.target.value})}
                    placeholder="Nome do solicitante"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Detalhes da solicitação..."
                  />
                </div>
                {editingVoucher && (
                  <div>
                    <Label htmlFor="reason">Motivo da Alteração</Label>
                    <Input
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => setFormData({...formData, reason: e.target.value})}
                      placeholder="Por que está fazendo esta alteração?"
                      required
                    />
                  </div>
                )}
                <Button type="submit" className="w-full">
                  {editingVoucher ? 'Atualizar' : 'Criar'} Voucher
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{vouchers.length}</p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold">{vouchers.filter(v => v.status === 'pendente').length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Criados</p>
                <p className="text-2xl font-bold">{vouchers.filter(v => v.status === 'criado').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Utilizados</p>
                <p className="text-2xl font-bold">{vouchers.filter(v => v.status === 'usado').length}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Vouchers */}
      <div className="grid gap-4">
        {vouchers.map((voucher) => (
          <Card key={voucher.id}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <h3 className="font-semibold">{voucher.school}</h3>
                    <Badge variant={getStatusColor(voucher.status) as any} className="flex items-center gap-1">
                      {getStatusIcon(voucher.status)}
                      {voucher.status}
                    </Badge>
                    <span className="text-sm text-muted-foreground">{voucher.type}</span>
                    <span className="text-sm font-medium">Qty: {voucher.amount}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{voucher.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Solicitado por: {voucher.requestedBy}</span>
                    <span>Criado: {voucher.createdAt}</span>
                    {voucher.voucherCode && <span>Código: {voucher.voucherCode}</span>}
                    {voucher.editHistory.length > 0 && (
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-xs"
                        onClick={() => setViewHistory(voucher.id)}
                      >
                        Ver histórico ({voucher.editHistory.length})
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {voucher.status === 'pendente' && (
                    <Button
                      size="sm"
                      onClick={() => updateStatus(voucher.id, 'criado')}
                    >
                      Criar
                    </Button>
                  )}
                  {voucher.status === 'criado' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(voucher.id, 'enviado')}
                    >
                      Enviar
                    </Button>
                  )}
                  {voucher.status === 'enviado' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateStatus(voucher.id, 'usado')}
                    >
                      Marcar Usado
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(voucher)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => deleteVoucher(voucher.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog do Histórico */}
      {viewHistory && (
        <Dialog open={!!viewHistory} onOpenChange={() => setViewHistory(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Histórico de Edições</DialogTitle>
              <DialogDescription>
                Todas as alterações realizadas neste voucher
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {vouchers.find(v => v.id === viewHistory)?.editHistory.map((edit, index) => (
                <div key={edit.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-sm">Campo: {edit.field}</div>
                    <div className="text-xs text-muted-foreground">{edit.editedAt}</div>
                  </div>
                  <div className="text-sm space-y-1">
                    <div><span className="font-medium">De:</span> {edit.oldValue}</div>
                    <div><span className="font-medium">Para:</span> {edit.newValue}</div>
                    <div><span className="font-medium">Por:</span> {edit.editedBy}</div>
                    {edit.reason && <div><span className="font-medium">Motivo:</span> {edit.reason}</div>}
                  </div>
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default VoucherManagement;