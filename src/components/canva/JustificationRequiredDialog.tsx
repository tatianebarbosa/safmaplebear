import React, { useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { Upload, X, Check, ChevronsUpDown } from 'lucide-react';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { TEAM_MEMBERS, searchTeamMembers, type TeamMember } from '@/data/teamMembers';

interface JustificationRequiredDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: {
    reason: string;
    attachment?: File;
    performedBy: string;
  }) => void;
  title: string;
  description: string;
}

export const JustificationRequiredDialog = ({ 
  open, 
  onOpenChange, 
  onConfirm, 
  title, 
  description 
}: JustificationRequiredDialogProps) => {
  const [reason, setReason] = useState('');
  const [performedBy, setPerformedBy] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [errors, setErrors] = useState<any>({});
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const validateForm = () => {
    const newErrors: any = {};
    
    if (!reason.trim()) {
      newErrors.reason = 'Motivo é obrigatório';
    }
    
    if (!performedBy.trim()) {
      newErrors.performedBy = 'Nome do solicitante é obrigatório';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      onConfirm({
        reason: reason.trim(),
        attachment: attachment || undefined,
        performedBy: performedBy.trim(),
      });
      
      // Reset form
      setReason('');
      setPerformedBy('');
      setAttachment(null);
      setErrors({});
      setSelectedMember(null);
      setOpenCombobox(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 5MB permitido.');
        return;
      }
      
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        toast.error('Tipo de arquivo não permitido. Use PDF, DOC, DOCX, JPG ou PNG.');
        return;
      }
      
      setAttachment(file);
    }
  };

  const removeAttachment = () => {
    setAttachment(null);
  };

  const handleClose = () => {
    setReason('');
    setPerformedBy('');
    setAttachment(null);
    setErrors({});
    setSelectedMember(null);
    setOpenCombobox(false);
    onOpenChange(false);
  };

  const handleFileUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Arquivo muito grande. Máximo 5MB permitido.');
          return;
        }
        
        // Validate file type
        const allowedTypes = [
          'application/pdf',
          'image/jpeg',
          'image/png',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        if (!allowedTypes.includes(file.type)) {
          toast.error('Tipo de arquivo não permitido. Use PDF, DOC, DOCX, JPG ou PNG.');
          return;
        }
        
        setAttachment(file);
      }
    };
    input.click();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="performedBy">Solicitante *</Label>
            <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openCombobox}
                  className={cn(
                    "w-full justify-between",
                    errors.performedBy ? 'border-destructive' : ''
                  )}
                >
                  {selectedMember
                    ? selectedMember.fullName
                    : "Selecione quem está fazendo a solicitação..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput placeholder="Buscar membro da equipe..." />
                  <CommandList>
                    <CommandEmpty>Nenhum membro encontrado.</CommandEmpty>
                    <CommandGroup>
                      {TEAM_MEMBERS.map((member) => (
                        <CommandItem
                          key={member.username}
                          value={member.fullName}
                          onSelect={() => {
                            setSelectedMember(member);
                            setPerformedBy(member.fullName);
                            setOpenCombobox(false);
                            if (errors.performedBy) {
                              setErrors((prev: any) => ({ ...prev, performedBy: '' }));
                            }
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedMember?.username === member.username ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{member.fullName}</span>
                            <span className="text-xs text-muted-foreground">
                              {member.username} • {member.role}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.performedBy && (
              <p className="text-sm text-destructive">{errors.performedBy}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da Alteração *</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) {
                  setErrors((prev: any) => ({ ...prev, reason: '' }));
                }
              }}
              placeholder="Descreva o motivo para esta alteração de licença..."
              rows={4}
              className={errors.reason ? 'border-destructive' : ''}
            />
            {errors.reason && (
              <p className="text-sm text-destructive">{errors.reason}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Anexo (Opcional)</Label>
            <div className="space-y-2">
              {!attachment ? (
                <div 
                  className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={handleFileUploadClick}
                >
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Clique para adicionar um arquivo
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, DOC, DOCX, JPG, PNG (máx. 5MB)
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">{attachment.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeAttachment}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit}>
            Confirmar Alteração
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

