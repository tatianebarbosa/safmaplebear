import { useEffect, useState } from 'react';
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
import { dialogLayouts } from './dialogLayouts';
import { useAssetStore } from '@/stores/assetStore';
import { normalizeTicketId } from '@/lib/stringUtils';

type NewUserMeta = {
  origemSolicitacao: 'Ticket SAF' | 'E-mail' | 'Ativo';
  solicitadoPorNome: string;
  solicitadoPorEmail: string;
  observacao: string;
  ticketNumber?: string;
  emailTitle?: string;
  assetId?: string;
  assetName?: string;
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
  emailTitle: '',
  assetId: '',
  assetName: ''
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
  const assets = useAssetStore((state) => state.assets);

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
      newErrors.name = 'Nome obrigatorio';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail obrigatorio';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'E-mail invalido';
    }

    if (!formData.role) {
      newErrors.role = 'Função obrigatória';
    }

    if (!isEdit) {
      if (!meta.solicitadoPorNome.trim()) {
        newErrors.solicitadoPorNome = 'Informe quem solicitou';
      }
      if (!meta.solicitadoPorEmail.trim() || !validateEmail(meta.solicitadoPorEmail)) {
        newErrors.solicitadoPorEmail = 'Informe um e-mail valido';
      }
      if (!meta.observacao.trim()) {
        newErrors.observacao = 'Informe a observação';
      }
      if (meta.origemSolicitacao === 'Ativo' && !meta.assetId?.trim()) {
        newErrors.assetId = 'Selecione o ativo';
      }
      if (meta.origemSolicitacao === 'Ticket SAF' && !meta.ticketNumber?.trim()) {
        newErrors.ticketNumber = 'Informe o numero do ticket';
      }
      if (meta.origemSolicitacao === 'E-mail' && !meta.emailTitle?.trim()) {
        newErrors.emailTitle = 'Informe o titulo do e-mail';
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

  const handleOriginChange = (value: NewUserMeta['origemSolicitacao']) => {
    setMeta((prev) => ({
      ...prev,
      origemSolicitacao: value,
      ticketNumber: value === 'Ticket SAF' ? prev.ticketNumber : '',
      emailTitle: value === 'E-mail' ? prev.emailTitle : '',
      assetId: value === 'Ativo' ? prev.assetId : '',
      assetName: value === 'Ativo' ? prev.assetName : '',
    }));
    setErrors((prev: any) => ({
      ...prev,
      ticketNumber: '',
      emailTitle: '',
      assetId: '',
    }));
  };

  const handleAssetSelect = (assetId: string) => {
    const selectedAsset = assets.find((asset) => asset.id === assetId);
    setMeta((prev) => ({
      ...prev,
      assetId,
      assetName: selectedAsset?.name || '',
    }));
    if (errors.assetId) {
      setErrors((prev: any) => ({ ...prev, assetId: '' }));
    }
  };

  const originDetailFilled =
    meta.origemSolicitacao === 'Ticket SAF'
      ? meta.ticketNumber?.trim()
      : meta.origemSolicitacao === 'E-mail'
      ? meta.emailTitle?.trim()
      : meta.assetId?.trim();

  const canSubmit =
    formData.name.trim() &&
    formData.email.trim() &&
    formData.role &&
    (isEdit ||
      (meta.solicitadoPorNome.trim() &&
        meta.solicitadoPorEmail.trim() &&
        meta.observacao.trim() &&
        originDetailFilled));
  const emailCompliant = formData.email ? isEmailValid(formData.email) : true;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={`${dialogLayouts.xs} flex flex-col user-dialog-compact`}
        style={{ width: "min(90vw, 520px)", maxWidth: "520px" }}
      >
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
                <Badge variant={emailCompliant ? "success" : "destructive"}>
                  {emailCompliant ? 'Conforme' : 'Fora da política'}
                </Badge>
                {!emailCompliant && (
                  <p className="text-xs text-muted-foreground">
                    Use domínio corporativo (maplebear.com.br, mbcentral.com.br, seb.com.br ou sebsa.com.br).
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
                  onValueChange={(value: NewUserMeta['origemSolicitacao']) => handleOriginChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a origem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ticket SAF">Ticket</SelectItem>
                    <SelectItem value="E-mail">E-mail</SelectItem>
                    <SelectItem value="Ativo">Ativo</SelectItem>
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

              {meta.origemSolicitacao === 'Ticket SAF' && (
                <div className="space-y-2">
                  <Label htmlFor="ticketNumber">Numero do ticket</Label>
                  <Input
                    id="ticketNumber"
                    value={meta.ticketNumber}
                    onChange={(event) => updateMeta('ticketNumber', normalizeTicketId(event.target.value))}
                    className={errors.ticketNumber ? 'border-destructive' : ''}
                  />
                  {errors.ticketNumber && (
                    <p className="text-xs text-destructive">{errors.ticketNumber}</p>
                  )}
                </div>
              )}

              {meta.origemSolicitacao === 'E-mail' && (
                <div className="space-y-2">
                  <Label htmlFor="emailTitle">Titulo do e-mail</Label>
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

              {meta.origemSolicitacao === 'Ativo' && (
                <div className="space-y-2">
                  <Label htmlFor="assetId">Ativo</Label>
                  <Select
                    value={meta.assetId || ''}
                    onValueChange={handleAssetSelect}
                    disabled={!assets.length}
                  >
                    <SelectTrigger className={errors.assetId ? 'border-destructive' : ''}>
                      <SelectValue placeholder={assets.length ? 'Selecione o ativo' : 'Nenhum ativo cadastrado'} />
                    </SelectTrigger>
                    <SelectContent>
                      {assets.length ? (
                        assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-assets" disabled>
                          Nenhum ativo cadastrado
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {errors.assetId && (
                    <p className="text-xs text-destructive">{errors.assetId}</p>
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
              {isEdit ? 'Salvar alterações' : 'Adicionar usuário'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

