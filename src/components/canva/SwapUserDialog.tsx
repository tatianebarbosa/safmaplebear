import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UserRole } from '@/types/schoolLicense';
import { useSchoolLicenseStore } from '@/stores/schoolLicenseStore';
import { Badge } from '@/components/ui/badge';

interface SwapUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    newUser: { name: string; email: string; role: UserRole };
    reason: string;
  }) => void;
  currentUser: any;
}

export const SwapUserDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  currentUser 
}: SwapUserDialogProps) => {
  const [formData, setFormData] = useState({
    newName: '',
    newEmail: '',
    newRole: 'Estudante' as UserRole,
    reason: '',
  });
  const [errors, setErrors] = useState<any>({});
  
  const { isEmailValid } = useSchoolLicenseStore();

  const resetForm = () => {
    setFormData({
      newName: '',
      newEmail: '',
      newRole: 'Estudante',
      reason: '',
    });
    setErrors({});
  };

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!formData.newName.trim()) {
      newErrors.newName = 'Nome é obrigatório';
    }
    
    if (!formData.newEmail.trim()) {
      newErrors.newEmail = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.newEmail)) {
      newErrors.newEmail = 'E-mail inválido';
    }
    
    if (!formData.reason.trim()) {
      newErrors.reason = 'Motivo é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      onConfirm({
        newUser: {
          name: formData.newName,
          email: formData.newEmail,
          role: formData.newRole,
        },
        reason: formData.reason,
      });
      resetForm();
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const emailCompliant = formData.newEmail ? isEmailValid(formData.newEmail) : true;

  if (!currentUser) return null;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Trocar Usuário</DialogTitle>
          <DialogDescription>
            Substitua o usuário atual informando a referência do e-mail ou ticket que motivou a troca.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newName">Novo Nome</Label>
            <Input
              id="newName"
              value={formData.newName}
              onChange={(e) => handleChange('newName', e.target.value)}
              placeholder="Nome completo do novo usuário"
              className={errors.newName ? 'border-destructive' : ''}
            />
            {errors.newName && (
              <p className="text-sm text-destructive">{errors.newName}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newEmail">Novo E-mail</Label>
            <Input
              id="newEmail"
              type="email"
              value={formData.newEmail}
              onChange={(e) => handleChange('newEmail', e.target.value)}
              placeholder="usuario@maplebear.com.br"
              className={errors.newEmail ? 'border-destructive' : ''}
            />
            {errors.newEmail && (
              <p className="text-sm text-destructive">{errors.newEmail}</p>
            )}
            {formData.newEmail && (
              <div className="flex items-center gap-2">
                <Badge variant={emailCompliant ? "default" : "destructive"}>
                  {emailCompliant ? 'Conforme' : 'Fora da política'}
                </Badge>
                {!emailCompliant && (
                  <p className="text-xs text-muted-foreground">
                    Domínio deve conter "maplebear"
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="newRole">Nova Função</Label>
            <Select value={formData.newRole} onValueChange={(value: UserRole) => handleChange('newRole', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Estudante">Estudante</SelectItem>
                <SelectItem value="Professor">Professor</SelectItem>
                <SelectItem value="Administrador">Administrador</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Troca</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              placeholder="Descreva o motivo da substituição do usuário..."
              rows={3}
              className={errors.reason ? 'border-destructive' : ''}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              Confirmar Troca
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
