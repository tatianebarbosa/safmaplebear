import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { VoucherSchool, ExceptionVoucher } from "@/lib/voucherDataProcessor";

interface ExceptionVoucherDialogProps {
  isOpen: boolean;
  onClose: () => void;
  school: VoucherSchool | null;
  onSave: (exception: Partial<ExceptionVoucher>) => void;
}

const ExceptionVoucherDialog = ({ isOpen, onClose, school, onSave }: ExceptionVoucherDialogProps) => {
  const [formData, setFormData] = useState({
    voucherCode: '',
    expiryDate: '',
    requester: '',
    requestSource: 'email' as 'email' | 'ticket',
    emailTitle: '',
    ticketNumber: '',
    justification: ''
  });

  const handleSubmit = () => {
    // Validações
    if (!formData.voucherCode.trim()) {
      toast.error("Código do voucher é obrigatório");
      return;
    }
    
    if (!formData.expiryDate) {
      toast.error("Data de validade é obrigatória");
      return;
    }
    
    if (!formData.requester.trim()) {
      toast.error("Solicitante é obrigatório");
      return;
    }
    
    if (formData.requestSource === 'email' && !formData.emailTitle.trim()) {
      toast.error("Título do email é obrigatório");
      return;
    }
    
    if (formData.requestSource === 'ticket' && !formData.ticketNumber.trim()) {
      toast.error("Número do ticket é obrigatório");
      return;
    }
    
    if (!formData.justification.trim()) {
      toast.error("Justificativa é obrigatória");
      return;
    }

    const exception: Partial<ExceptionVoucher> = {
      unit: school?.name || '',
      voucherCode: formData.voucherCode,
      expiryDate: formData.expiryDate,
      requester: formData.requester,
      requestSource: formData.requestSource,
      emailTitle2: formData.requestSource === 'email' ? formData.emailTitle : undefined,
      ticketNumber: formData.requestSource === 'ticket' ? formData.ticketNumber : undefined,
      createdAt: new Date().toISOString(),
      createdBy: "admin@mbcentral.com.br", // Pegar do contexto de auth
      // Campos legados para compatibilidade
      financialResponsible: '',
      course: '',
      voucherPercent: 0,
      code: formData.voucherCode,
      cpf: '',
      emailTitle: formData.requestSource === 'email' ? formData.emailTitle : '',
      requestedBy: formData.requester,
      usageCount: 0
    };

    onSave(exception);
    
    // Reset form
    setFormData({
      voucherCode: '',
      expiryDate: '',
      requester: '',
      requestSource: 'email',
      emailTitle: '',
      ticketNumber: '',
      justification: ''
    });
    
    onClose();
    toast.success("Exceção de voucher criada com sucesso!");
  };

  const handleClose = () => {
    setFormData({
      voucherCode: '',
      expiryDate: '',
      requester: '',
      requestSource: 'email',
      emailTitle: '',
      ticketNumber: '',
      justification: ''
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Adicionar Exceção de Voucher</DialogTitle>
        </DialogHeader>
        
        {school && (
          <div className="p-3 bg-muted rounded-lg mb-4">
            <p className="font-semibold">{school.name}</p>
            <p className="text-sm text-muted-foreground">ID: {school.id} | Cluster: {school.cluster}</p>
          </div>
        )}
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="voucherCode">Código do Voucher *</Label>
              <Input
                id="voucherCode"
                placeholder="Ex: MBSP2026001"
                value={formData.voucherCode}
                onChange={(e) => setFormData({ ...formData, voucherCode: e.target.value.toUpperCase() })}
              />
            </div>
            
            <div>
              <Label htmlFor="expiryDate">Data de Validade *</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="requester">Quem Solicitou *</Label>
            <Input
              id="requester"
              placeholder="Nome do solicitante"
              value={formData.requester}
              onChange={(e) => setFormData({ ...formData, requester: e.target.value })}
            />
          </div>
          
          <div>
            <Label htmlFor="requestSource">Onde Foi Solicitado *</Label>
            <Select 
              value={formData.requestSource} 
              onValueChange={(value: 'email' | 'ticket') => 
                setFormData({ ...formData, requestSource: value, emailTitle: '', ticketNumber: '' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Por Email</SelectItem>
                <SelectItem value="ticket">Por Ticket</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {formData.requestSource === 'email' && (
            <div>
              <Label htmlFor="emailTitle">Título do Email *</Label>
              <Input
                id="emailTitle"
                placeholder="Assunto do email"
                value={formData.emailTitle}
                onChange={(e) => setFormData({ ...formData, emailTitle: e.target.value })}
              />
            </div>
          )}
          
          {formData.requestSource === 'ticket' && (
            <div>
              <Label htmlFor="ticketNumber">Número do Ticket *</Label>
              <Input
                id="ticketNumber"
                placeholder="Ex: #12345"
                value={formData.ticketNumber}
                onChange={(e) => setFormData({ ...formData, ticketNumber: e.target.value })}
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="justification">Justificativa *</Label>
            <Textarea
              id="justification"
              placeholder="Explique o motivo da criação desta exceção..."
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              rows={3}
            />
          </div>
          
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit}>
              Criar Exceção
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExceptionVoucherDialog;