import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Edit, 
  Trash2, 
  Plus, 
  Users, 
  AlertTriangle, 
  Paperclip,
  MapPin,
  Settings,
  Eye,
  RefreshCw
} from 'lucide-react';
import { School } from '@/types/schoolLicense';
import { UserDialog } from './UserDialog';
import { SwapUserDialog } from './SwapUserDialog';
import { JustificationsDialog } from './JustificationsDialog';
import { JustificationRequiredDialog } from './JustificationRequiredDialog';
import { SchoolDetailsDialog } from './SchoolDetailsDialog';
import { useSchoolLicenseStore } from '@/stores/schoolLicenseStore';
import { toast } from 'sonner';

interface SchoolLicenseCardProps {
  school: School;
  onViewDetails: (school: School) => void;
  onManage: (school: School) => void;
}

export const SchoolLicenseCard = ({ 
  school, 
  onViewDetails, 
  onManage 
}: SchoolLicenseCardProps) => {
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [showSwapDialog, setShowSwapDialog] = useState(false);
  const [showJustificationsDialog, setShowJustificationsDialog] = useState(false);
  const [showJustificationDialog, setShowJustificationDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'edit' | 'remove' | 'swap';
    data?: any;
  } | null>(null);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [swappingUserId, setSwappingUserId] = useState<string | null>(null);
  
  const { 
    addUser, 
    updateUser, 
    removeUser, 
    swapUser,
    getLicenseStatus,
    getJustificationsBySchool,
    isEmailValid
  } = useSchoolLicenseStore();

  const licenseStatus = getLicenseStatus(school);
  const utilizationPercent = Math.min(100, (school.usedLicenses / school.totalLicenses) * 100);
  const nonCompliantUsers = school.users.filter(u => !u.isCompliant);
  const justifications = getJustificationsBySchool(school.id);

  const getNonComplianceReason = (email: string) => {
    const domain = email.toLowerCase().split('@')[1];
    if (!domain) return 'Email invalido';
    
    if (domain.includes('gmail.com') || domain.includes('hotmail.com') || domain.includes('yahoo.com')) {
      return 'Email pessoal nao autorizado';
    }
    
    if (!domain.includes('maplebear') && domain !== 'mbcentral.com.br') {
      return 'Dominio nao autorizado pela politica Maple Bear';
    }
    
    return 'Email fora da politica';
  };

  const getLicensesBadgeColor = () => {
    switch (licenseStatus) {
      case 'Disponivel':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Completo':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Excedido':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressColor = () => {
    if (school.usedLicenses > school.totalLicenses) return 'bg-destructive';
    if (school.usedLicenses === school.totalLicenses) return 'bg-warning';
    return 'bg-success';
  };

  const handleAddUser = (userData: any) => {
    // Verificar se a escola ja tem 2 usuarios
    if (school.users.length >= 2) {
      toast.error('Esta escola ja possui o limite maximo de 2 usuarios. Para adicionar um novo usuario, voce deve transferir ou excluir um usuario existente.');
      return;
    }
    
    addUser(school.id, userData);
    setShowUserDialog(false);
    toast.success('Usuario adicionado com sucesso');
  };

  const handleEditUser = (userData: any) => {
    setPendingAction({ type: 'edit', data: userData });
    setShowJustificationDialog(true);
  };

  const handleRemoveUser = (userId: string) => {
    setPendingAction({ type: 'remove', data: { userId } });
    setShowJustificationDialog(true);
  };

  const handleSwapUser = (data: any) => {
    setPendingAction({ type: 'swap', data });
    setShowJustificationDialog(true);
  };

  const handleJustificationConfirm = (justificationData: any) => {
    if (!pendingAction) return;

    const timestamp = new Date().toISOString();
    
    switch (pendingAction.type) {
      case 'edit':
        if (editingUser) {
          updateUser(school.id, editingUser.id, pendingAction.data, {
            performedBy: justificationData.performedBy,
            reason: justificationData.reason
          });
          setEditingUser(null);
          setShowUserDialog(false);
          toast.success('Usuario atualizado com sucesso');
        }
        break;
        
      case 'remove':
        removeUser(school.id, pendingAction.data.userId, {
          performedBy: justificationData.performedBy,
          reason: justificationData.reason
        });
        toast.success('Usuario removido com sucesso');
        break;
        
      case 'swap':
        if (swappingUserId) {
          const oldUser = school.users.find(u => u.id === swappingUserId);
          if (oldUser) {
            swapUser(school.id, swappingUserId, pendingAction.data.newUser, {
              schoolId: school.id,
              schoolName: school.name,
              oldUser: {
                name: oldUser.name,
                email: oldUser.email,
                role: oldUser.role,
              },
              newUser: {
                name: pendingAction.data.newUser.name,
                email: pendingAction.data.newUser.email,
                role: pendingAction.data.newUser.role,
              },
              reason: justificationData.reason,
              performedBy: justificationData.performedBy,
              // timestamp
            });
          }
          setSwappingUserId(null);
          setShowSwapDialog(false);
          toast.success('Usuario substituido com sucesso');
        }
        break;
    }
    
    setPendingAction(null);
    setShowJustificationDialog(false);
  };

  const openEditDialog = (user: any) => {
    setEditingUser(user);
    setShowUserDialog(true);
  };

  const openSwapDialog = (userId: string) => {
    setSwappingUserId(userId);
    setShowSwapDialog(true);
  };

  return (
    <>
      <Card className="w-full rounded-xl shadow-sm border-border/40">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-base font-semibold">{school.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {school.city && (
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    {school.city}
                  </div>
                )}
                <Badge variant="outline" className="text-xs">
                  {school.cluster}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* License Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getLicensesBadgeColor()}`}>
                {school.usedLicenses}/{school.totalLicenses} Licencas
                {licenseStatus === 'Excedido' && ' (Excesso)'}
              </span>
              <span className="text-xs text-muted-foreground">
                {utilizationPercent.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div 
                className={`h-1.5 rounded-full transition-all ${getProgressColor()}`}
                style={{ width: `${Math.min(100, utilizationPercent)}%` }}
              />
            </div>
          </div>

          {/* Indicators */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{school.users.length} usuarios</span>
            </div>
            {nonCompliantUsers.length > 0 && (
              <div className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-4 w-4" />
                <span>{nonCompliantUsers.length} fora da politica</span>
              </div>
            )}
            {school.hasRecentJustifications && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Paperclip className="h-4 w-4 text-primary" />
                <span className="text-primary">Referencias (Email/Ticket)</span>
              </div>
            )}
          </div>

          {/* Users List */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {school.users.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 border-b border-border/50 last:border-b-0">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium truncate">{user.name}</span>
                    <Badge variant={user.isCompliant ? "secondary" : "destructive"}>
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
                  <div className="text-xs text-muted-foreground truncate ml-1">
                    {user.email}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(user)}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemoveUser(user.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
            {school.users.length > 5 && (
              <div className="text-xs text-muted-foreground text-center py-1">
                +{school.users.length - 5} usuarios adicionais
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col space-y-2 pt-2 border-t">
            {/* Botao de Acao Principal Condicional */}
            {licenseStatus === 'Disponivel' ? (
              <Button 
                size="sm" 
                variant="default" 
                onClick={() => setShowUserDialog(true)}
                className="w-full"
              >
                <Plus className="h-3 w-3 mr-1" />
                Conceder Licenca
              </Button>
            ) : licenseStatus === 'Excedido' ? (
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={() => openSwapDialog(school.users[0].id)} // Assumindo que o primeiro usuario e o que sera trocado por padrao
                className="w-full"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Transferir Licenca
              </Button>
            ) : (
              <Button 
                size="sm" 
                variant="outline" 
                disabled
                className="w-full"
              >
                Licencas Completas
              </Button>
            )}
            
            {/* Botao Gerenciar (Substitui Detalhes) */}
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowDetailsDialog(true)}
              className="w-full"
            >
              <Settings className="h-3 w-3 mr-1" />
              Gerenciar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserDialog
        open={showUserDialog}
        onOpenChange={setShowUserDialog}
        onSave={editingUser ? handleEditUser : handleAddUser}
        initialData={editingUser}
        title={editingUser ? 'Editar Usuario' : 'Adicionar Usuario'}
      />

      <SwapUserDialog
        open={showSwapDialog}
        onOpenChange={setShowSwapDialog}
        onConfirm={handleSwapUser}
        currentUser={swappingUserId ? school.users.find(u => u.id === swappingUserId) : null}
      />

      <JustificationsDialog
        open={showJustificationsDialog}
        onOpenChange={setShowJustificationsDialog}
        schoolId={school.id}
        schoolName={school.name}
      />

      <JustificationRequiredDialog
        open={showJustificationDialog}
        onOpenChange={setShowJustificationDialog}
        onConfirm={handleJustificationConfirm}
        title="Referencia Necessaria"
        description="Para realizar esta alteracao de licenca, informe o titulo do e-mail ou numero do ticket."
      />

      <SchoolDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        school={school}
      />
    </>
  );
};


