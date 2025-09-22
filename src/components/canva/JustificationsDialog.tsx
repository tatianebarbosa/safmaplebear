import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, FileText, Calendar, User } from 'lucide-react';
import { useSchoolLicenseStore } from '@/stores/schoolLicenseStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface JustificationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schoolId: string;
  schoolName: string;
}

export const JustificationsDialog = ({ 
  open, 
  onOpenChange, 
  schoolId, 
  schoolName 
}: JustificationsDialogProps) => {
  const { getJustificationsBySchool } = useSchoolLicenseStore();
  const justifications = getJustificationsBySchool(schoolId);

  const handleDownloadAttachment = (attachment: any) => {
    try {
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = attachment.data;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Erro ao baixar anexo:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Histórico de Justificativas</DialogTitle>
          <DialogDescription>
            Escola: {schoolName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {justifications.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                Nenhuma justificativa encontrada para esta escola.
              </p>
            </div>
          ) : (
            justifications.map((justification) => (
              <Card key={justification.id}>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            {formatDistanceToNow(new Date(justification.timestamp), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">
                            Por: {justification.performedBy}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline">Troca de Usuário</Badge>
                    </div>

                    {/* User Change Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-red-600">Usuário Anterior:</h4>
                        <div className="text-sm space-y-1">
                          <div><strong>Nome:</strong> {justification.oldUser.name}</div>
                          <div><strong>E-mail:</strong> {justification.oldUser.email}</div>
                          <div><strong>Função:</strong> {justification.oldUser.role}</div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-green-600">Novo Usuário:</h4>
                        <div className="text-sm space-y-1">
                          <div><strong>Nome:</strong> {justification.newUser.name}</div>
                          <div><strong>E-mail:</strong> {justification.newUser.email}</div>
                          <div><strong>Função:</strong> {justification.newUser.role}</div>
                        </div>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Motivo:</h4>
                      <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                        {justification.reason}
                      </p>
                    </div>

                    {/* Attachment */}
                    {justification.attachment && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Anexo:</h4>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownloadAttachment(justification.attachment)}
                            className="gap-2"
                          >
                            <Download className="h-3 w-3" />
                            {justification.attachment.name}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};