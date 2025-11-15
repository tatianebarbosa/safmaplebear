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
import { School } from '@/types/schoolLicense';
import { useSchoolLicenseStore } from '@/stores/schoolLicenseStore';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
    getJustificationsBySchool,
    getLicenseStatus,
    isEmailValid
  } = useSchoolLicenseStore();

  if (!school) return null;

  const justifications = getJustificationsBySchool(school.id);
  const licenseStatus = getLicenseStatus(school);
  const nonCompliantUsers = school.users.filter(u => !u.isCompliant);

  const getNonComplianceReason = getComplianceReason;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {school.name}
          </DialogTitle>
          <DialogDescription>
            Detalhes completos da escola e histórico de alterações
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* School Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações da Escola</CardTitle>
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
                      <span className="font-medium">Licenças:</span>
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
                      <span className="font-medium">Não Conformes:</span>
                      <span className={nonCompliantUsers.length > 0 ? 'text-red-600' : 'text-green-600'}>
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
                <CardTitle className="text-lg">Usuários da Escola</CardTitle>
                <DialogDescription>
                  Lista completa de usuários com suas informações e status de conformidade
                </DialogDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {school.users.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhum usuário cadastrado nesta escola.
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
                                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
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
                            {user.isCompliant ? 'Conforme' : 'Não Conforme'}
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
                <CardTitle className="text-lg">Histórico de Alterações</CardTitle>
                <DialogDescription>
                  Registro de todas as alterações realizadas nesta escola
                </DialogDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {justifications.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Nenhuma alteração registrada para esta escola.
                      </p>
                    </div>
                  ) : (
                    justifications.map((justification) => (
                      <Card key={justification.id} className="border-l-4 border-l-blue-500">
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
                                <div className="text-sm space-y-1 bg-red-50 p-2 rounded">
                                  <div><strong>Nome:</strong> {justification.oldUser.name}</div>
                                  <div><strong>E-mail:</strong> {justification.oldUser.email}</div>
                                  <div><strong>Função:</strong> {justification.oldUser.role}</div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-green-600">Novo Usuário:</h4>
                                <div className="text-sm space-y-1 bg-green-50 p-2 rounded">
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
                                  <Badge variant="outline" className="gap-1">
                                    <FileText className="h-3 w-3" />
                                    {justification.attachment.name}
                                  </Badge>
                                </div>
                              </div>
                            )}
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
  );
};

