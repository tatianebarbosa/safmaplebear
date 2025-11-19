import { useState } from 'react';
import { getNonComplianceReason as getComplianceReason } from '@/lib/validators';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  Users, 
  Calendar, 
  User, 
  FileText, 
  AlertTriangle,
  MapPin,
  Building2,
  Mail,
  Phone
} from 'lucide-react';
import { School, HistoryEntry } from '@/types/schoolLicense';
import { useSchoolLicenseStore } from '@/stores/schoolLicenseStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface SchoolDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  school: School | null;
}

export const SchoolDetailsDialog = ({ 
  open, 
  onOpenChange, 
  school 
}: SchoolDetailsDialogProps) => {
  const { 
    getHistoryBySchool, // Adicionar a nova funcao
    getLicenseStatus,
    isEmailValid,
    revertHistoryEntry
  } = useSchoolLicenseStore();
  const { toast } = useToast();
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [revertTarget, setRevertTarget] = useState<HistoryEntry | null>(null);
  const [revertReason, setRevertReason] = useState('');
  const [revertPerformedBy, setRevertPerformedBy] = useState('');

  const handleOpenRevertDialog = (entry: HistoryEntry) => {
    setRevertTarget(entry);
    setRevertReason('');
    setRevertPerformedBy('');
    setRevertDialogOpen(true);
  };

  const handleConfirmRevert = () => {
    if (!revertTarget) return;
    if (!revertReason.trim() || !revertPerformedBy.trim()) {
      toast({
        title: 'Campos obrigatorios',
      description: 'Informe quem reverteu e a referencia do e-mail/ticket.',
        variant: 'destructive'
      });
      return;
    }
    const success = revertHistoryEntry(revertTarget.id, {
      reason: revertReason.trim(),
      performedBy: revertPerformedBy.trim()
    });
    toast({
      title: success ? 'Reversao registrada' : 'Nao foi possivel reverter',
      description: success
        ? 'Os dados foram atualizados e o historico anotado.'
        : 'Verifique se o registro ja foi revertido ou removido.',
      variant: success ? 'default' : 'destructive'
    });
    if (success) {
      setRevertDialogOpen(false);
      setRevertTarget(null);
    }
  };

  if (!school) return null;

  const history = getHistoryBySchool(school.id); // Obter o Historico
  const licenseStatus = getLicenseStatus(school);
  const nonCompliantUsers = school.users.filter(u => !u.isCompliant);

  const getNonComplianceReason = getComplianceReason;

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {school.name}
          </DialogTitle>
          <DialogDescription>
            Detalhes completos da escola e Historico de alteracoes
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visao Geral</TabsTrigger>
            <TabsTrigger value="users">Usuarios</TabsTrigger>
            <TabsTrigger value="history">Historico</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* School Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informacoes da Escola</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Nome:</span>
                      <span>{school.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{school.status}</Badge>
                      <Badge variant="secondary">{school.cluster}</Badge>
                    </div>
                    {school.city && (
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{school.city}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Licencas:</span>
                      <span>{school.usedLicenses}/{school.totalLicenses}</span>
                      <Badge variant={
                        licenseStatus === 'Excedido' ? 'destructive' : 
                        licenseStatus === 'Completo' ? 'secondary' : 'default'
                      }>
                        {licenseStatus}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Nao Conformes:</span>
                      <span className={nonCompliantUsers.length > 0 ? 'text-destructive' : 'text-success'}>
                        {nonCompliantUsers.length}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            {/* Users List */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usuarios da Escola</CardTitle>
                <DialogDescription>
                  Lista completa de Usuarios com suas Informacoes e status de conformidade
                </DialogDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {school.users.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhum usuario cadastrado nesta escola.
                      </p>
                    </div>
                  ) : (
                    school.users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.name}</span>
                            <Badge variant={user.isCompliant ? "default" : "destructive"}>
                              {user.role}
                            </Badge>
                            {!user.isCompliant && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div className="w-2 h-2 bg-destructive rounded-full"></div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{getNonComplianceReason(user.email)}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                          {user.createdAt && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              Adicionado {formatDistanceToNow(new Date(user.createdAt), {
                                addSuffix: true,
                                locale: ptBR,
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={user.isCompliant ? "outline" : "destructive"}>
                            {user.isCompliant ? 'Conforme' : 'Nao Conforme'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

	          <TabsContent value="history" className="space-y-4">
	            {/* History */}
	            <Card>
	              <CardHeader>
	                <CardTitle className="text-lg">Historico de alteracoes</CardTitle>
	                <DialogDescription>
	                  Registro de todas as alteracoes realizadas nesta escola
	                </DialogDescription>
	              </CardHeader>
	              <CardContent>
	                <div className="space-y-4">
	                  {history.length === 0 ? (
	                    <div className="text-center py-8">
	                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
	                      <p className="text-muted-foreground">
	                        Nenhuma alteracao registrada para esta escola.
	                      </p>
	                    </div>
	                  ) : (
	                    history.map((entry) => (
	                      <Card key={entry.id} className="border-l-4 border-l-primary">
	                        <CardContent className="p-4">
	                          <div className="space-y-3">
	                            {/* Header */}
	                            <div className="flex items-start justify-between">
	                              <div className="space-y-1">
	                                <div className="flex items-center gap-2">
	                                  <Calendar className="h-4 w-4 text-muted-foreground" />
	                                  <span className="text-sm text-muted-foreground">
	                                    {formatDistanceToNow(new Date(entry.timestamp), {
	                                      addSuffix: true,
	                                      locale: ptBR,
	                                    })}
	                                  </span>
	                                </div>
	                                <div className="flex items-center gap-2">
	                                  <User className="h-4 w-4 text-muted-foreground" />
	                                  <span className="text-sm text-muted-foreground">
	                                    Por: {entry.performedBy}
	                                  </span>
	                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">{entry.action.replace('_', ' ')}</Badge>
                                {entry.changeSet && !entry.reverted && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleOpenRevertDialog(entry)}
                                  >
                                    Reverter
                                  </Button>
                                )}
                              </div>
                            </div>

                            {/* Details */}
                            <div className="space-y-2">
                              <h4 className="text-sm font-medium">Detalhes da Acao:</h4>
                              <p className="text-sm text-muted-foreground bg-muted p-3 rounded">
                                {entry.details}
                              </p>
                              {entry.reverted && (
                                <div className="text-xs text-muted-foreground bg-muted/60 p-2 rounded">
                                  Revertido por {entry.revertedBy || 'Nao informado'}{' '}
                                  {entry.revertTimestamp
                                    ? formatDistanceToNow(new Date(entry.revertTimestamp), {
                                        addSuffix: true,
                                        locale: ptBR,
                                      })
                                    : ''}
                                  . Motivo: {entry.revertReason || 'Nao informado'}.
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
	                      </Card>
	                    ))
	                  )}
	                </div>
	              </CardContent>
	            </Card>
	          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>

    <Dialog open={revertDialogOpen} onOpenChange={setRevertDialogOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Reverter alteracao</DialogTitle>
          <DialogDescription>
            Informe a referencia do e-mail/ticket e o responsavel pela reversao.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">Responsavel</span>
            <Input
              placeholder="Nome de quem reverteu"
              value={revertPerformedBy}
              onChange={(event) => setRevertPerformedBy(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <span className="text-sm font-medium text-muted-foreground">
              Referencia (Titulo do e-mail ou numero do ticket)
            </span>
            <Textarea
              rows={3}
              placeholder="Informe o titulo do e-mail ou numero do ticket"
              value={revertReason}
              onChange={(event) => setRevertReason(event.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setRevertDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirmRevert}>
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};




