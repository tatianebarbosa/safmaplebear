import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTicketStore } from '@/stores/ticketStore';
import { useAuthStore } from '@/stores/authStore';
import { Ticket, TicketStatus, Agente } from '@/types/tickets';
import { toast } from 'sonner';

interface TicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticket?: Ticket | null;
}

const agentes: Agente[] = ['Tati', 'Rafha', 'Ingrid', 'João', 'Jaque', 'Jessika', 'Fernanda'];
const watcherOptions: (Agente | 'Coordinator' | 'Admin')[] = [...agentes, 'Coordinator', 'Admin'];
const statusOptions: TicketStatus[] = ['Pendente', 'Em andamento', 'Resolvido'];

export const TicketDialog = ({ open, onOpenChange, ticket }: TicketDialogProps) => {
  const { createTicket, updateTicket } = useTicketStore();
  const { currentUser, isAgent } = useAuthStore();
  
  const [formData, setFormData] = useState({
    id: ticket?.id || '',
    agente: ticket?.agente || (currentUser?.agente as Agente) || 'João',
    status: ticket?.status || 'Pendente' as TicketStatus,
    observacao: ticket?.observacao || '',
    dueDate: ticket?.dueDate ? new Date(ticket.dueDate) : undefined as Date | undefined,
    watchers: ticket?.watchers || ['Coordinator', currentUser?.agente || 'João'],
  });

  const isEditing = !!ticket;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.id.trim() || !formData.observacao.trim()) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (!formData.id.startsWith('#')) {
      setFormData(prev => ({ ...prev, id: `#${prev.id}` }));
    }

    try {
      const ticketData = {
        ...formData,
        id: formData.id.startsWith('#') ? formData.id : `#${formData.id}`,
        dueDate: formData.dueDate?.toISOString(),
        diasAberto: 0,
      };

      if (isEditing) {
        updateTicket(ticket.id, ticketData);
        toast.success('Ticket atualizado com sucesso');
      } else {
        createTicket(ticketData);
        toast.success('Ticket criado com sucesso');
      }

      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast.error('Erro ao salvar ticket');
    }
  };

  const resetForm = () => {
    setFormData({
      id: '',
      agente: (currentUser?.agente as Agente) || 'João',
      status: 'Pendente',
      observacao: '',
      dueDate: undefined,
      watchers: ['Coordinator', currentUser?.agente || 'João'],
    });
  };

  const handleWatcherToggle = (watcher: Agente | 'Coordinator' | 'Admin', checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      watchers: checked 
        ? [...prev.watchers, watcher]
        : prev.watchers.filter(w => w !== watcher)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Ticket' : 'Novo Ticket'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id">ID do Ticket *</Label>
              <Input
                id="id"
                placeholder="#123456"
                value={formData.id}
                onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="agente">Agente Responsável *</Label>
              <Select
                value={formData.agente}
                onValueChange={(value: Agente) => setFormData(prev => ({ ...prev, agente: value }))}
                disabled={isAgent() && !isEditing}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {agentes.map((agente) => (
                    <SelectItem key={agente} value={agente}>
                      {agente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: TicketStatus) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data de Vencimento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.dueDate ? (
                      format(formData.dueDate, "dd/MM/yyyy")
                    ) : (
                      "Selecionar data"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.dueDate}
                    onSelect={(date) => setFormData(prev => ({ ...prev, dueDate: date }))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacao">Observação *</Label>
            <Textarea
              id="observacao"
              placeholder="Descreva o problema ou situação..."
              value={formData.observacao}
              onChange={(e) => setFormData(prev => ({ ...prev, observacao: e.target.value }))}
              rows={4}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Watchers (quem será notificado)</Label>
            <div className="grid grid-cols-3 gap-3">
              {watcherOptions.map((watcher) => (
                <div key={watcher} className="flex items-center space-x-2">
                  <Checkbox
                    id={`watcher-${watcher}`}
                    checked={formData.watchers.includes(watcher)}
                    onCheckedChange={(checked) => handleWatcherToggle(watcher, checked as boolean)}
                  />
                  <Label htmlFor={`watcher-${watcher}`} className="text-sm">
                    {watcher}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button type="submit">
              {isEditing ? 'Atualizar' : 'Criar'} Ticket
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};