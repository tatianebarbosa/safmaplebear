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
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { 
  Users, 
  Calendar, 
  User, 
  FileText, 
  AlertTriangle,
  MapPin,
  Building2,
  Mail,
  Send,
  Edit,
  RefreshCw,
  Trash2,
  Search
} from 'lucide-react';
import { UserDialog } from './UserDialog';
import { SwapUserDialog } from './SwapUserDialog';
import { School, HistoryEntry } from '@/types/schoolLicense';
import { useSchoolLicenseStore } from '@/stores/schoolLicenseStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { showCanvaSyncReminder } from '@/lib/canvaReminder';
import { dialogLayouts } from './dialogLayouts';

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
  const currentUser = useAuthStore((s) => s.currentUser);
  const actorName =
    currentUser?.email ||
    currentUser?.name ||
    localStorage.getItem('userEmail') ||
    'Portal SAF';

  const { 
    getHistoryBySchool, // Adicionar a nova funcao
    getLicenseStatus,
    revertHistoryEntry,
    updateUser,
    removeUser,
    swapUser,
    transferUsersBetweenSchools,
    addUser,
    officialData,
    schools,
  } = useSchoolLicenseStore();
  const { toast } = useToast();
  const [revertDialogOpen, setRevertDialogOpen] = useState(false);
  const [revertTarget, setRevertTarget] = useState<HistoryEntry | null>(null);
  const [revertReason, setRevertReason] = useState('');
  const [revertPerformedBy, setRevertPerformedBy] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [pendingEditData, setPendingEditData] = useState<any>(null);
  const [showEditJustify, setShowEditJustify] = useState(false);
  const [editTicket, setEditTicket] = useState('');
  const [editObservation, setEditObservation] = useState('');
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [swappingUserId, setSwappingUserId] = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<any>(null);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);
  const [removeTicket, setRemoveTicket] = useState('');
  const [removeObservation, setRemoveObservation] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const handleOpenRevertDialog = (entry: HistoryEntry) => {
    setRevertTarget(entry);
    setRevertReason('');
    setRevertPerformedBy(actorName);
    setRevertDialogOpen(true);
  };

  const handleConfirmRevert = () => {
    if (!revertTarget) return;
    if (!revertReason.trim()) {
      toast({
        title: 'Campos obrigatorios',
        description: 'Informe o motivo/observacao da reversao.',
        variant: 'destructive'
      });
      return;
    }
    const success = revertHistoryEntry(revertTarget.id, {
      reason: revertReason.trim(),
      performedBy: revertPerformedBy.trim() || actorName
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
      showCanvaSyncReminder();
    }
  };

  if (!school) return null;

  const isGenericCluster = (value?: string | null) =>
    !value || value.toLowerCase().startsWith('outros');

  const resolvedCluster = (() => {
    if (school.cluster && !isGenericCluster(school.cluster)) return school.cluster;

    const match = officialData?.find(
      (item) => item.school.id === school.id || item.school.name === school.name
    );
    if (match?.school.cluster && !isGenericCluster(match.school.cluster)) {
      return match.school.cluster;
    }

    const storeMatch = schools.find(
      (s) => s.id === school.id || s.name === school.name
    );
    if (storeMatch?.cluster && !isGenericCluster(storeMatch.cluster)) {
      return storeMatch.cluster;
    }

    return school.cluster || 'Sem cluster';
  })();

  const resolvedSafManager = (() => {
    if (school.safManager && school.safManager.trim()) return school.safManager.trim();

    const match = officialData?.find(
      (item) => item.school.id === school.id || item.school.name === school.name
    );
    const fromOfficial = match?.school.safManager?.trim();
    if (fromOfficial) return fromOfficial;

    // Fallback: tenta usar o consultor/saf manager de qualquer escola do mesmo cluster
    if (resolvedCluster) {
      const clusterMatch = officialData?.find(
        (item) =>
          item.school.cluster?.toLowerCase() === resolvedCluster?.toLowerCase() &&
          item.school.safManager?.trim()
      );
      if (clusterMatch?.school.safManager) return clusterMatch.school.safManager.trim();

      // Busca tambem nas escolas carregadas localmente
      const storeClusterMatch = schools.find(
        (s) =>
          s.id !== school.id &&
          s.cluster?.toLowerCase() === resolvedCluster?.toLowerCase() &&
          s.safManager?.trim()
      );
      if (storeClusterMatch?.safManager) return storeClusterMatch.safManager.trim();
    }

    return "Equipe SAF";
  })();

  const history = getHistoryBySchool(school.id); // Obter o Historico
  const licenseStatus = getLicenseStatus(school);
  const nonCompliantUsers = school.users.filter(u => !u.isCompliant);
  const normalizedUserSearch = userSearchTerm.trim().toLowerCase();
  const filteredUsers = school.users.filter((user) =>
    !normalizedUserSearch
      ? true
      : user.name.toLowerCase().includes(normalizedUserSearch) ||
        user.email.toLowerCase().includes(normalizedUserSearch)
  );

  const getNonComplianceReason = getComplianceReason;

  const handleEditUser = (userId: string) => {
    const user = school.users.find(u => u.id === userId);
    if (!user) return;
    setEditingUser(user);
    setShowEditDialog(true);
  };

  const handleTransferUser = (userId: string) => {
    const user = school.users.find(u => u.id === userId);
    if (!user) return;
    setSwappingUserId(user.id);
    setShowSwapDialog(true);
  };

  const handleRemoveUser = (userId: string) => {
    const user = school.users.find(u => u.id === userId);
    if (!user) return;
    setRemoveTarget(user);
    setRemoveTicket('');
    setRemoveObservation('');
    setShowRemoveDialog(true);
  };

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${dialogLayouts.lg} flex flex-col`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {school.name}
          </DialogTitle>
          <DialogDescription>
            Detalhes completos da escola e Historico de alteracoes
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full flex-1 overflow-y-auto">
          <TabsList className="grid w-full grid-cols-3 gap-3 bg-muted/70 p-3 rounded-2xl">
            <TabsTrigger
              value="overview"
              className="w-full h-12 text-base font-semibold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Visao Geral
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="w-full h-12 text-base font-semibold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Usuarios
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="w-full h-12 text-base font-semibold rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              Historico
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 md:space-y-7 min-h-[55vh] sm:min-h-[60vh]">
            {/* School Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informacoes da Escola</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-4 lg:gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-border/60 bg-amber-50/70 p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Dados gerais
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Nome:</span>
                        <span className="text-foreground">{school.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" size="md" className="px-3 py-1 text-sm rounded-full">
                          {school.status}
                        </Badge>
                        <Badge variant="muted" size="md" className="px-3 py-1 text-sm rounded-full">
                          {resolvedCluster}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span>{school.city || 'Localidade nao informada'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Responsavel do cluster:</span>
                        <span className="text-foreground">{resolvedSafManager || 'Nao informado'}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="rounded-2xl border border-border/60 bg-amber-50/70 p-4 space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                      Licencas e conformidade
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Licencas:</span>
                        <span>{school.usedLicenses}/{school.totalLicenses}</span>
                        <Badge
                          variant={
                            licenseStatus === 'Excedido'
                              ? 'destructive'
                              : licenseStatus === 'Completo'
                              ? 'success'
                              : 'muted'
                          }
                          size="md"
                          className="px-3 py-1 text-sm rounded-full"
                        >
                          {licenseStatus}
                        </Badge>
                      </div>
                      <Button
                        type="button"
                        variant={licenseStatus === 'Excedido' ? 'destructive' : 'secondary'}
                        size="sm"
                        className="gap-2"
                        onClick={() => {
                          const emails = school.users.map((u) => u.email).filter(Boolean);
                          const body = [
                            `A Escola ${school.name} ja possui ${school.usedLicenses} licencas ativas na plataforma, vinculadas aos seguintes e-mails:`,
                            '',
                            ...emails.map((email) => `- ${email}`),
                            '',
                            'Cada escola tem direito a duas licencas para uso da plataforma de marketing (Canva). Para que possamos conceder uma nova licenca, e necessario transferir ou remover um dos usuarios existentes. Lembramos que a remocao so pode ser realizada mediante autorizacao do responsavel pelo e-mail vinculado a licenca.',
                          ].join('\n');
                          navigator.clipboard?.writeText(body);
                          toast({
                            title: 'Mensagem copiada',
                            description: 'Cole no e-mail ou chat com o responsavel do cluster.',
                          });
                        }}
                      >
                        <AlertTriangle className="h-4 w-4" />
                        Copiar aviso de licencas
                      </Button>
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Nao conformes:</span>
                        <span className={nonCompliantUsers.length > 0 ? 'text-destructive' : 'text-success'}>
                          {nonCompliantUsers.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4 min-h-[55vh] sm:min-h-[60vh]">
            {/* Users List */}
            <Card>
              <CardHeader className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-lg">Usuarios da Escola</CardTitle>
                    <DialogDescription>
                      Lista completa de Usuarios com suas Informacoes e status de conformidade
                    </DialogDescription>
                  </div>
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar por nome ou email..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
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
                  ) : filteredUsers.length === 0 ? (
                    <div className="text-center py-6 text-sm text-muted-foreground border rounded-md">
                      Nenhum usuario encontrado para esta busca.
                    </div>
                  ) : (
                    filteredUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.name}</span>
                    {user.role !== "Estudante" && (
                      <Badge variant={user.isCompliant ? "muted" : "destructive"} size="sm">
                        {user.role}
                      </Badge>
                    )}
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
                          {!user.isCompliant && (
                            <Badge variant="destructive">
                              Nao Conforme
                            </Badge>
                          )}
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleEditUser(user.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Editar</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => handleTransferUser(user.id)}
                                >
                                  <RefreshCw className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Transferir licenca</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => handleRemoveUser(user.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remover</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

	          <TabsContent value="history" className="space-y-4 min-h-[55vh] sm:min-h-[60vh]">
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
      <DialogContent className={`${dialogLayouts.sm} flex flex-col`}>
        <DialogHeader>
          <DialogTitle>Reverter alteracao</DialogTitle>
          <DialogDescription>
            Informe o motivo/observacao. O responsavel sera o usuario logado.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Responsavel: <span className="font-medium text-foreground">{actorName}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="revertReason">Motivo / Observacao *</Label>
            <Textarea
              id="revertReason"
              rows={3}
              placeholder="Descreva o motivo e a referencia (ticket/e-mail)"
              value={revertReason}
              onChange={(event) => setRevertReason(event.target.value)}
              className={!revertReason.trim() ? "border-destructive" : ""}
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

    {/* Dialogs de acao em "Gerenciar Usuarios" */}
    <UserDialog
      open={showEditDialog}
      onOpenChange={setShowEditDialog}
      onSave={(payload) => {
        if (!editingUser) return;
        const userData =
          "user" in payload ? payload.user : payload;
        setPendingEditData(userData);
        setShowEditDialog(false);
        setShowEditJustify(true);
        setEditTicket('');
        setEditObservation('');
      }}
      initialData={editingUser}
      title="Editar Usuario"
    />

    <SwapUserDialog
      open={showSwapDialog}
      onOpenChange={setShowSwapDialog}
      onConfirm={(payload: any) => {
        if (!swappingUserId) return;
        const reason = `${payload.reason} | Ticket: ${payload.ticketNumber}`;
        const performedByUser = actorName;

        if (payload.mode === "cross-school" && payload.targetSchoolId) {
          let targetUserId = payload.targetUserId;

          // Se a escola destino nao tiver usuarios, criamos automaticamente baseado em quem libera a licenca
          if (!targetUserId && payload.createTargetFromOutgoing) {
            const sourceUser = school.users.find((u) => u.id === swappingUserId);
            if (sourceUser) {
              const createdId = addUser(
                payload.targetSchoolId,
                {
                  name: sourceUser.name,
                  email: sourceUser.email,
                  role: sourceUser.role,
                  isCompliant: sourceUser.isCompliant,
                },
                {
                  origemSolicitacao: "E-mail",
                  solicitadoPorNome: payload.performedBy || performedByUser,
                  solicitadoPorEmail: payload.performedBy || performedByUser,
                  observacao: `Criado automaticamente ao transferir licenca de ${school.name}`,
                  performedBy: performedByUser,
                }
              );
              targetUserId = createdId || undefined;
            }
          }

          if (payload.targetSchoolId && targetUserId) {
            transferUsersBetweenSchools(
              school.id,
              swappingUserId,
              payload.targetSchoolId,
              targetUserId,
              {
                reason,
                performedBy: performedByUser,
              }
            );
          } else {
            toast({
              title: "Nao foi possivel transferir",
              description: "Escolha uma escola com usuarios ou cadastre um usuario antes de transferir.",
              variant: "destructive",
            });
          }
        } else {
          swapUser(
            school.id,
            swappingUserId,
            payload.newUser,
            { 
              reason,
              performedBy: performedByUser,
              notes: payload.notes,
            } as any
          );
        }
        setSwappingUserId(null);
        setShowSwapDialog(false);
        toast({ title: "Licenca transferida" });
        showCanvaSyncReminder();
      }}
      users={school.users}
      selectedUserId={swappingUserId}
      onUserChange={setSwappingUserId}
      currentSchoolId={school.id}
    />

    {/* Dialog de justificativa para edicao */}
    <Dialog open={showEditJustify} onOpenChange={setShowEditJustify}>
      <DialogContent className={`${dialogLayouts.sm} flex flex-col`}>
        <DialogHeader>
          <DialogTitle>Justificar edicao</DialogTitle>
          <DialogDescription>Informe o ticket para registrar no historico.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Por: <span className="font-medium text-foreground">{actorName}</span>
          </div>
          <div className="space-y-2">
            <Label htmlFor="editTicket">Ticket *</Label>
            <Input
              id="editTicket"
              placeholder="Numero do ticket ou titulo do e-mail"
              value={editTicket}
              onChange={(e) => setEditTicket(e.target.value)}
              className={!editTicket.trim() ? "border-destructive" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="editObs">Observacao</Label>
            <Textarea
              id="editObs"
              placeholder="Observacoes adicionais (opcional)"
              value={editObservation}
              onChange={(e) => setEditObservation(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setShowEditJustify(false);
              setPendingEditData(null);
              setEditingUser(null);
            }}
          >
            Cancelar
          </Button>
          <Button
            disabled={!editTicket.trim() || !pendingEditData || !editingUser}
            onClick={() => {
              if (!pendingEditData || !editingUser) return;
              updateUser(school.id, editingUser.id, pendingEditData, {
                performedBy: actorName,
                reason: `Ticket: ${editTicket}${editObservation ? ` | Obs: ${editObservation}` : ""}`,
              });
              setPendingEditData(null);
              setEditingUser(null);
              setShowEditJustify(false);
              setEditTicket('');
              setEditObservation('');
              toast({ title: "Usuario atualizado" });
              showCanvaSyncReminder();
            }}
          >
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>

    {/* Dialog de remocao com ticket/observacao */}
    <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
      <DialogContent className={`${dialogLayouts.sm} flex flex-col`}>
        <DialogHeader>
          <DialogTitle>Remover usuario</DialogTitle>
          <DialogDescription>
            Informe o ticket como justificativa. Observacao e responsavel sao opcionais, mas recomendados.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1 text-sm">
            <div className="font-medium">{removeTarget?.name}</div>
            <div className="text-muted-foreground text-xs">{removeTarget?.email}</div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="removeTicket">Ticket *</Label>
            <Input
              id="removeTicket"
              placeholder="Numero do ticket ou titulo do e-mail"
              value={removeTicket}
              onChange={(e) => setRemoveTicket(e.target.value)}
              className={!removeTicket ? "border-destructive" : ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="removeObs">Observacao</Label>
            <Textarea
              id="removeObs"
              placeholder="Observacoes adicionais"
              value={removeObservation}
              onChange={(e) => setRemoveObservation(e.target.value)}
            />
          </div>
          <div className="text-xs text-muted-foreground">
            Por: {actorName}
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowRemoveDialog(false)}>Cancelar</Button>
          <Button
            disabled={!removeTicket.trim()}
            onClick={() => {
              if (!removeTarget) return;
              removeUser(school.id, removeTarget.id, {
                reason: `Ticket: ${removeTicket}${removeObservation ? ` | Obs: ${removeObservation}` : ""}`,
                performedBy: actorName,
              });
              toast({ title: "Usuario removido" });
              showCanvaSyncReminder();
              setShowRemoveDialog(false);
              setRemoveTarget(null);
              setRemoveTicket("");
              setRemoveObservation("");
            }}
          >
            Confirmar remocao
          </Button>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};



