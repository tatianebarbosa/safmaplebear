import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Edit, 
  Trash2, 
  Plus, 
  Users, 
  AlertTriangle, 
  Paperclip,
  MapPin,
  Settings,
  Eye
} from 'lucide-react';
import { School } from '@/types/schoolLicense';
import { UserDialog } from './UserDialog';
import { SwapUserDialog } from './SwapUserDialog';
import { JustificationsDialog } from './JustificationsDialog';
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
  const [editingUser, setEditingUser] = useState<any>(null);
  const [swappingUserId, setSwappingUserId] = useState<string | null>(null);
  
  const { 
    addUser, 
    updateUser, 
    removeUser, 
    swapUser,
    getLicenseStatus,
    getJustificationsBySchool
  } = useSchoolLicenseStore();

  const licenseStatus = getLicenseStatus(school);
  const utilizationPercent = Math.min(100, (school.usedLicenses / school.totalLicenses) * 100);
  const nonCompliantUsers = school.users.filter(u => !u.isCompliant);
  const justifications = getJustificationsBySchool(school.id);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'Ativa': return 'default';
      case 'Implantando': return 'secondary';
      case 'Pausa': return 'destructive';
      default: return 'outline';
    }
  };

  const getLicensesBadgeColor = () => {
    switch (licenseStatus) {
      case 'Disponível': return 'bg-green-100 text-green-800 border-green-200';
      case 'Completo': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Excedido': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getProgressColor = () => {
    if (school.usedLicenses > school.totalLicenses) return 'bg-red-500';
    if (school.usedLicenses === school.totalLicenses) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleAddUser = (userData: any) => {
    addUser(school.id, userData);
    setShowUserDialog(false);
    toast.success('Usuário adicionado com sucesso');
  };

  const handleEditUser = (userData: any) => {
    if (editingUser) {
      updateUser(school.id, editingUser.id, userData);
      setEditingUser(null);
      setShowUserDialog(false);
      toast.success('Usuário atualizado com sucesso');
    }
  };

  const handleRemoveUser = (userId: string) => {
    if (confirm('Tem certeza que deseja remover este usuário?')) {
      removeUser(school.id, userId);
      toast.success('Usuário removido com sucesso');
    }
  };

  const handleSwapUser = (data: any) => {
    if (swappingUserId) {
      const oldUser = school.users.find(u => u.id === swappingUserId);
      if (oldUser) {
        swapUser(school.id, swappingUserId, data.newUser, {
          schoolId: school.id,
          schoolName: school.name,
          oldUser: {
            name: oldUser.name,
            email: oldUser.email,
            role: oldUser.role,
          },
          newUser: {
            name: data.newUser.name,
            email: data.newUser.email,
            role: data.newUser.role,
          },
          reason: data.reason,
          attachment: data.attachment,
          performedBy: 'Administrador'
        });
      }
      setSwappingUserId(null);
      setShowSwapDialog(false);
      toast.success('Usuário substituído com sucesso');
    }
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
      <Card className="w-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">{school.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {school.city && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {school.city}
                  </div>
                )}
                <Badge variant="outline" className="text-xs">
                  {school.cluster}
                </Badge>
              </div>
            </div>
            <Badge variant={getStatusBadgeVariant(school.status)}>
              {school.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* License Status */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-medium px-2 py-1 rounded border ${getLicensesBadgeColor()}`}>
                {school.usedLicenses}/{school.totalLicenses} Licenças
                {licenseStatus === 'Excedido' && ' (Excesso)'}
              </span>
              <span className="text-xs text-muted-foreground">
                {utilizationPercent.toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${getProgressColor()}`}
                style={{ width: `${Math.min(100, utilizationPercent)}%` }}
              />
            </div>
          </div>

          {/* Indicators */}
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{school.users.length} usuários</span>
            </div>
            {nonCompliantUsers.length > 0 && (
              <div className="flex items-center gap-1 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <span>{nonCompliantUsers.length} fora da política</span>
              </div>
            )}
            {school.hasRecentJustifications && (
              <div className="flex items-center gap-1">
                <Paperclip className="h-4 w-4 text-blue-600" />
                <span className="text-blue-600">Justificativas</span>
              </div>
            )}
          </div>

          {/* Users List */}
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {school.users.slice(0, 5).map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{user.name}</span>
                    <Badge variant={user.isCompliant ? "default" : "destructive"} className="text-xs">
                      {user.role}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </div>
                </div>
                <div className="flex items-center gap-1">
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
                +{school.users.length - 5} usuários adicionais
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => setShowUserDialog(true)}
              className="flex-1"
            >
              <Plus className="h-3 w-3 mr-1" />
              Adicionar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onViewDetails(school)}
            >
              <Eye className="h-3 w-3 mr-1" />
              Detalhes
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => onManage(school)}
            >
              <Settings className="h-3 w-3 mr-1" />
              Gerenciar
            </Button>
          </div>

          {/* Additional Actions */}
          {school.users.length > 0 && (
            <div className="flex gap-2">
              <Button 
                size="sm" 
                variant="secondary" 
                onClick={() => openSwapDialog(school.users[0].id)}
                className="flex-1"
              >
                Trocar Usuário
              </Button>
              {justifications.length > 0 && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => setShowJustificationsDialog(true)}
                >
                  <Paperclip className="h-3 w-3 mr-1" />
                  Ver Justificativas
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <UserDialog
        open={showUserDialog}
        onOpenChange={setShowUserDialog}
        onSave={editingUser ? handleEditUser : handleAddUser}
        initialData={editingUser}
        title={editingUser ? 'Editar Usuário' : 'Adicionar Usuário'}
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
    </>
  );
};