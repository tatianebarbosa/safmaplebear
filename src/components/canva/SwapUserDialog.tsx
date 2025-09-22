import React, { useState, useRef } from 'react';
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
import { Upload, File } from 'lucide-react';
import { toast } from 'sonner';

interface SwapUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    newUser: { name: string; email: string; role: UserRole };
    reason: string;
    attachment?: { name: string; data: string; type: string };
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
  const [attachment, setAttachment] = useState<{
    name: string;
    data: string;
    type: string;
  } | null>(null);
  const [errors, setErrors] = useState<any>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { isEmailValid } = useSchoolLicenseStore();

  const resetForm = () => {
    setFormData({
      newName: '',
      newEmail: '',
      newRole: 'Estudante',
      reason: '',
    });
    setAttachment(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Apenas arquivos PDF, JPG e PNG são permitidos');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo deve ter no máximo 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setAttachment({
        name: file.name,
        data: base64,
        type: file.type,
      });
    };
    reader.readAsDataURL(file);
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
        attachment: attachment || undefined,
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
            Substitua o usuário atual por um novo usuário com justificativa.
          </DialogDescription>
        </DialogHeader>
        
        {/* Current User Info */}
        <div className="p-3 bg-muted rounded-lg">
          <h4 className="font-medium text-sm mb-2">Usuário Atual:</h4>
          <div className="space-y-1 text-sm">
            <div><strong>Nome:</strong> {currentUser.name}</div>
            <div><strong>E-mail:</strong> {currentUser.email}</div>
            <div><strong>Função:</strong> {currentUser.role}</div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newName">Novo Nome</Label>
            <Input
              id="newName"
              value={formData.newName}
              onChange={(e) => handleChange('newName', e.target.value)}
              placeholder="Nome completo do novo usuário"
              className={errors.newName ? 'border-red-500' : ''}
            />
            {errors.newName && (
              <p className="text-sm text-red-500">{errors.newName}</p>
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
              className={errors.newEmail ? 'border-red-500' : ''}
            />
            {errors.newEmail && (
              <p className="text-sm text-red-500">{errors.newEmail}</p>
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
              className={errors.reason ? 'border-red-500' : ''}
            />
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Anexo (Opcional)</Label>
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full justify-start"
              >
                <Upload className="h-4 w-4 mr-2" />
                {attachment ? 'Alterar arquivo' : 'Adicionar arquivo'}
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              {attachment && (
                <div className="flex items-center gap-2 p-2 bg-muted rounded">
                  <File className="h-4 w-4" />
                  <span className="text-sm">{attachment.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAttachment(null)}
                  >
                    ×
                  </Button>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: PDF, JPG, PNG (máx. 5MB)
              </p>
            </div>
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