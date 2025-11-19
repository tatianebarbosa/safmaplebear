import { useState, useEffect } from 'react';
import { validateEmail } from '@/lib/validators';
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

type NewUserMeta = {
  origemSolicitacao: 'Ticket SAF' | 'E-mail';
  solicitadoPorNome: string;
  solicitadoPorEmail: string;
  observacao: string;
  ticketNumber?: string;
  emailTitle?: string;
};

type UserDialogPayload =
  | { name: string; email: string; role: UserRole }
  | { user: { name: string; email: string; role: UserRole }; meta: NewUserMeta };

interface UserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (payload: UserDialogPayload) => void;
  initialData?: { name: string; email: string; role: UserRole };
  title: string;
}

const INITIAL_META: NewUserMeta = {
  origemSolicitacao: 'Ticket SAF',
  solicitadoPorNome: '',
  solicitadoPorEmail: '',
  observacao: '',
  ticketNumber: '',
  emailTitle: ''
};

export const UserDialog = ({
  open,
  onOpenChange,
  onSave,
  initialData,
  title
}: UserDialogProps) => {
  const isEdit = Boolean(initialData);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Estudante' as UserRole,
  });
  const [meta, setMeta] = useState<NewUserMeta>(INITIAL_META);
  const [errors, setErrors] = useState<any>({});

  const { isEmailValid } = useSchoolLicenseStore();

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        role: initialData.role || 'Estudante',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'Estudante',
      });
      setMeta(INITIAL_META);
    }
    setErrors({});
  }, [initialData, open]);

  const validateForm = () => {
    const newErrors: any = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.role) {
      newErrors.role = 'Função é obrigatória';
    }

    if (!isEdit) {
      if (!meta.solicitadoPorNome.trim()) {
        newErrors.solicitadoPorNome = 'Informe quem solicitou';
      }
      if (!meta.solicitadoPorEmail.trim() || !validateEmail(meta.solicitadoPorEmail)) {
        newErrors.solicitadoPorEmail = 'Informe um e-mail válido';
      }
      if (!meta.observacao.trim()) {
        newErrors.observacao = 'Informe a observação';
      }
      if (meta.origemSolicitacao === 'Ticket SAF' && !meta.ticketNumber?.trim()) {
        newErrors.ticketNumber = 'Informe o número do ticket';
      }
      if (meta.origemSolicitacao === 'E-mail' && !meta.emailTitle?.trim()) {
        newErrors.emailTitle = 'Informe o título do e-mail';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      if (isEdit) {
        onSave({
          name: formData.name,
          email: formData.email,
          role: formData.role
        });
      } else {
        onSave({
          user: formData,
          meta
        });
      }
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const updateMeta = (field: keyof NewUserMeta, value: string) => {
    setMeta(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: '' }));
    }
  };

  const canSubmit =
    formData.name.trim() &&
    formData.email.trim() &&
    formData.role &&
    (isEdit ||
      (meta.solicitadoPorNome.trim() &&
        meta.solicitadoPorEmail.trim() &&
        meta.observacao.trim() &&
        (meta.origemSolicitacao === 'Ticket SAF'
          ? meta.ticketNumber?.trim()
          : meta.emailTitle?.trim())));

  const emailCompliant = formData.email ? isEmailValid(formData.email) : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Edite as informações do usuário abaixo.'
              : 'Adicione um novo usuário à escola.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Nome completo"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="usuario@maplebear.com.br"
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
            {formData.email && (
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
            <Label htmlFor="role">Função</Label>
            <Select value={formData.role} onValueChange={(value: UserRole) => handleChange('role', value)}>
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

          {!isEdit && (
            <>
              <div className="space-y-2">
                <Label htmlFor="origem">Origem da solicitação</Label>
                <Select
                  value={meta.origemSolicitacao}
                  onValueChange={(value: 'Ticket SAF' | 'E-mail') => updateMeta('origemSolicitacao', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ticket SAF">Ticket SAF</SelectItem>
                    <SelectItem value="E-mail">E-mail</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Solicitado por</Label>
                <Input
                  placeholder="Nome do solicitante"
                  value={meta.solicitadoPorNome}
                  onChange={(event) => updateMeta('solicitadoPorNome', event.target.value)}
                  className={errors.solicitadoPorNome ? 'border-destructive' : ''}
                />
                {errors.solicitadoPorNome && (
                  <p className="text-xs text-destructive">{errors.solicitadoPorNome}</p>
                )}
                <Input
                  type="email"
                  placeholder="email@solicitante.com.br"
                  value={meta.solicitadoPorEmail}
                  onChange={(event) => updateMeta('solicitadoPorEmail', event.target.value)}
                  className={errors.solicitadoPorEmail ? 'border-destructive' : ''}
                />
                {errors.solicitadoPorEmail && (
                  <p className="text-xs text-destructive">{errors.solicitadoPorEmail}</p>
                )}
              </div>

              {meta.origemSolicitacao === 'Ticket SAF' ? (
                <div className="space-y-2">
                  <Label htmlFor="ticketNumber">Número do Ticket</Label>
                  <Input
                    id="ticketNumber"
                    value={meta.ticketNumber}
                    onChange={(event) => updateMeta('ticketNumber', event.target.value)}
                    placeholder="Ex: SAF-12345"
                    className={errors.ticketNumber ? 'border-destructive' : ''}
                  />
                  {errors.ticketNumber && (
                    <p className="text-xs text-destructive">{errors.ticketNumber}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="emailTitle">Título do e-mail</Label>
                  <Input
                    id="emailTitle"
                    value={meta.emailTitle}
                    onChange={(event) => updateMeta('emailTitle', event.target.value)}
                    placeholder="Assunto do e-mail recebido"
                    className={errors.emailTitle ? 'border-destructive' : ''}
                  />
                  {errors.emailTitle && (
                    <p className="text-xs text-destructive">{errors.emailTitle}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="observacao">Observação / motivo</Label>
                <Textarea
                  id="observacao"
                  value={meta.observacao}
                  onChange={(event) => updateMeta('observacao', event.target.value)}
                  rows={3}
                  className={errors.observacao ? 'border-destructive' : ''}
                />
                {errors.observacao && (
                  <p className="text-xs text-destructive">{errors.observacao}</p>
                )}
              </div>
            </>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {isEdit ? 'Salvar Alterações' : 'Adicionar Usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
