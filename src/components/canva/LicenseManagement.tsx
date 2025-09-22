import React, { useState } from 'react';
import { User, Building2, Plus, Minus, UserX, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { SchoolCanvaData, CanvaUser } from '@/lib/canvaDataProcessor';

interface LicenseManagementProps {
  schoolsData: SchoolCanvaData[];
  onUpdateLicenses: (schoolId: string, action: 'add' | 'remove' | 'transfer' | 'delete', userId?: string, justification?: string, targetSchoolId?: string) => void;
}

export const LicenseManagement = ({ schoolsData, onUpdateLicenses }: LicenseManagementProps) => {
  const [selectedSchool, setSelectedSchool] = useState<SchoolCanvaData | null>(null);
  const [selectedUser, setSelectedUser] = useState<CanvaUser | null>(null);
  const [action, setAction] = useState<'add' | 'remove' | 'transfer' | 'delete'>('add');
  const [justification, setJustification] = useState('');
  const [targetSchoolId, setTargetSchoolId] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const totalLicenses = schoolsData.reduce((sum, school) => sum + school.maxLicenses, 0);
  const usedLicenses = schoolsData.reduce((sum, school) => sum + school.usedLicenses, 0);
  const availableLicenses = totalLicenses - usedLicenses;

  const handleAction = () => {
    if (!selectedSchool || !justification.trim()) {
      toast.error('Escola e justificativa são obrigatórios');
      return;
    }

    if ((action === 'remove' || action === 'delete') && !selectedUser) {
      toast.error('Selecione um usuário para remover ou excluir');
      return;
    }

    if (action === 'transfer' && (!selectedUser || !targetSchoolId)) {
      toast.error('Selecione usuário e escola de destino para transferir');
      return;
    }

    onUpdateLicenses(
      selectedSchool.schoolId,
      action,
      selectedUser?.id,
      justification,
      targetSchoolId
    );

    // Reset form
    setJustification('');
    setSelectedUser(null);
    setTargetSchoolId('');
    setIsDialogOpen(false);
    
    toast.success('Ação realizada com sucesso');
  };

  const getActionLabel = () => {
    switch (action) {
      case 'add': return 'Adicionar Licença';
      case 'remove': return 'Remover Licença';
      case 'transfer': return 'Transferir Usuário';
      case 'delete': return 'Excluir Usuário';
    }
  };

  const getActionDescription = () => {
    switch (action) {
      case 'add': return 'Aumentar o limite de licenças da escola';
      case 'remove': return 'Remover licença de um usuário específico';
      case 'transfer': return 'Transferir usuário para outra escola';
      case 'delete': return 'Excluir usuário permanentemente';
    }
  };

  const nonCompliantUsers = schoolsData.flatMap(school => 
    school.nonCompliantUsers.map(user => ({ ...user, schoolName: school.schoolName }))
  );

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{totalLicenses}</div>
                <div className="text-sm text-muted-foreground">Total de Licenças</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="text-2xl font-bold">{usedLicenses}</div>
                <div className="text-sm text-muted-foreground">Licenças Ativas</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-success" />
              <div>
                <div className="text-2xl font-bold text-success">{availableLicenses}</div>
                <div className="text-sm text-muted-foreground">Disponíveis</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <div>
                <div className="text-2xl font-bold text-destructive">{nonCompliantUsers.length}</div>
                <div className="text-sm text-muted-foreground">Fora da Política</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Non-Compliant Users Alert */}
      {nonCompliantUsers.length > 0 && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Usuários Fora da Política ({nonCompliantUsers.length})
            </CardTitle>
            <CardDescription>
              Usuários sem domínio autorizado (@maplebear.com.br, @sebsa.com.br, @seb.com.br)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 max-h-40 overflow-y-auto">
              {nonCompliantUsers.map((user, index) => (
                <div key={index} className="flex items-center justify-between text-sm p-2 bg-background rounded border">
                  <div>
                    <span className="font-medium">{user.name || 'Nome não informado'}</span>
                    <span className="text-muted-foreground ml-2">{user.email}</span>
                    <Badge variant="outline" className="ml-2">{user.schoolName || 'Escola não definida'}</Badge>
                  </div>
                  <Button 
                    size="sm" 
                    variant="destructive" 
                    onClick={() => {
                      setSelectedUser(user);
                      setAction('delete');
                      setIsDialogOpen(true);
                    }}
                  >
                    <UserX className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* License Management */}
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Licenças por Escola</CardTitle>
          <CardDescription>
            Cada escola tem direito a 2 licenças. Use as ações abaixo para gerenciar licenças e usuários.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {schoolsData
              .filter(school => school.usedLicenses > 0 || school.maxLicenses > 0)
              .sort((a, b) => {
                // Priorizar escolas com problemas
                const aHasIssues = a.usedLicenses > a.maxLicenses || a.nonCompliantUsers.length > 0;
                const bHasIssues = b.usedLicenses > b.maxLicenses || b.nonCompliantUsers.length > 0;
                if (aHasIssues && !bHasIssues) return -1;
                if (bHasIssues && !aHasIssues) return 1;
                return b.usedLicenses - a.usedLicenses;
              })
              .map((school) => (
                <Card 
                  key={school.schoolId} 
                  className={`${
                    school.usedLicenses > school.maxLicenses || school.nonCompliantUsers.length > 0
                      ? 'border-destructive/50 bg-destructive/5' 
                      : ''
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{school.schoolName || 'Escola não identificada'}</h3>
                          {school.usedLicenses > school.maxLicenses && (
                            <Badge variant="destructive">
                              {school.usedLicenses - school.maxLicenses} em excesso
                            </Badge>
                          )}
                          {school.nonCompliantUsers.length > 0 && (
                            <Badge variant="outline" className="text-destructive">
                              {school.nonCompliantUsers.length} não conforme(s)
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {school.usedLicenses}/{school.maxLicenses} licenças utilizadas • {school.users.length} usuários totais
                        </div>
                        <div className="flex gap-1">
                          {school.users.slice(0, 3).map((user, index) => (
                            <Badge key={index} variant={user.isCompliant ? "secondary" : "destructive"} className="text-xs">
                              {user.name || user.email.split('@')[0]}
                            </Badge>
                          ))}
                          {school.users.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{school.users.length - 3} mais
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              onClick={() => setSelectedSchool(school)}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Gerenciar
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>{getActionLabel()}</DialogTitle>
                              <DialogDescription>
                                {getActionDescription()} - {selectedSchool?.schoolName}
                              </DialogDescription>
                            </DialogHeader>
                            
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="action">Ação</Label>
                                <Select value={action} onValueChange={(value: any) => setAction(value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="add">Adicionar Licença</SelectItem>
                                    <SelectItem value="remove">Remover Licença</SelectItem>
                                    <SelectItem value="transfer">Transferir Usuário</SelectItem>
                                    <SelectItem value="delete">Excluir Usuário</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {(action === 'remove' || action === 'delete' || action === 'transfer') && selectedSchool && (
                                <div>
                                  <Label htmlFor="user">Usuário</Label>
                                  <Select value={selectedUser?.id || ''} onValueChange={(value) => {
                                    const user = selectedSchool.users.find(u => u.id === value);
                                    setSelectedUser(user || null);
                                  }}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione um usuário" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {selectedSchool.users.map((user) => (
                                        <SelectItem key={user.id} value={user.id}>
                                          {user.name || user.email} {!user.isCompliant && '⚠️'}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                              {action === 'transfer' && (
                                <div>
                                  <Label htmlFor="targetSchool">Escola de Destino</Label>
                                  <Select value={targetSchoolId} onValueChange={setTargetSchoolId}>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Selecione a escola de destino" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {schoolsData
                                        .filter(s => s.schoolId !== selectedSchool?.schoolId)
                                        .map((school) => (
                                          <SelectItem key={school.schoolId} value={school.schoolId}>
                                            {school.schoolName} ({school.usedLicenses}/{school.maxLicenses})
                                          </SelectItem>
                                        ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}

                              <div>
                                <Label htmlFor="justification">Justificativa *</Label>
                                <Textarea
                                  id="justification"
                                  placeholder="Descreva o motivo desta alteração..."
                                  value={justification}
                                  onChange={(e) => setJustification(e.target.value)}
                                />
                              </div>
                            </div>

                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                                Cancelar
                              </Button>
                              <Button onClick={handleAction}>
                                Confirmar
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};