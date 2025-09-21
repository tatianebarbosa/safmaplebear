import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Camera, Key, Users, CheckCircle, Clock, Trash2, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'maintenance';
  profileImage?: string;
  status: 'active' | 'pending' | 'blocked';
  createdAt: string;
  lastLogin: string;
  sessionExpiry: string;
  approvedBy?: string;
  approvedAt?: string;
}

interface PendingUser {
  id: string;
  name: string;
  email: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'denied';
}

const ProfileManagement = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [newUserOpen, setNewUserOpen] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Carregar dados do usuário atual e listas
  useEffect(() => {
    loadUserData();
    loadPendingUsers();
    loadAllUsers();
  }, []);

  const loadUserData = () => {
    const userData = localStorage.getItem('saf_current_user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      setFormData({
        ...formData,
        name: user.name,
        email: user.email
      });
    }
  };

  const loadPendingUsers = () => {
    const pending = localStorage.getItem('saf_pending_users');
    if (pending) {
      setPendingUsers(JSON.parse(pending));
    }
  };

  const loadAllUsers = () => {
    const users = localStorage.getItem('saf_all_users');
    if (users) {
      setAllUsers(JSON.parse(users));
    }
  };

  // Verificar se domínio é permitido
  const isAllowedDomain = (email: string): boolean => {
    const allowedDomains = ['@mbcentral.com.br', '@seb.com.br', '@sebsa.com.br'];
    return allowedDomains.some(domain => email.toLowerCase().includes(domain));
  };

  // Verificar se sessão expirou (1 semana)
  const isSessionExpired = (): boolean => {
    if (!currentUser?.sessionExpiry) return true;
    
    const expiry = new Date(currentUser.sessionExpiry);
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = domingo, 1 = segunda
    
    // Se é segunda-feira ou sessão já expirou
    return dayOfWeek === 1 || now > expiry;
  };

  // Atualizar perfil
  const updateProfile = async () => {
    if (!isAllowedDomain(formData.email)) {
      toast({
        title: "Email não permitido",
        description: "Use emails corporativos @mbcentral, @seb ou @sebsa",
        variant: "destructive"
      });
      return;
    }

    const updatedUser = {
      ...currentUser!,
      name: formData.name,
      email: formData.email
    };

    setCurrentUser(updatedUser);
    localStorage.setItem('saf_current_user', JSON.stringify(updatedUser));
    localStorage.setItem('userEmail', formData.email);
    
    toast({
      title: "Perfil atualizado",
      description: "Suas informações foram atualizadas com sucesso"
    });
    
    setIsProfileOpen(false);
  };

  // Alterar senha
  const changePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A nova senha e confirmação devem ser iguais",
        variant: "destructive"
      });
      return;
    }

    if (formData.newPassword.length < 8) {
      toast({
        title: "Senha muito fraca",
        description: "A senha deve ter pelo menos 8 caracteres",
        variant: "destructive"
      });
      return;
    }

    // Simular alteração de senha
    toast({
      title: "Senha alterada",
      description: "Sua senha foi alterada com sucesso"
    });
    
    setFormData({
      ...formData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    
    setIsPasswordOpen(false);
  };

  // Aprovar usuário pendente
  const approveUser = (userId: string) => {
    const user = pendingUsers.find(u => u.id === userId);
    if (!user) return;

    const newUser: UserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: 'user',
      status: 'active',
      createdAt: user.requestedAt,
      lastLogin: new Date().toISOString(),
      sessionExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 semana
      approvedBy: currentUser?.email,
      approvedAt: new Date().toISOString()
    };

    const updatedPending = pendingUsers.filter(u => u.id !== userId);
    const updatedAllUsers = [...allUsers, newUser];

    setPendingUsers(updatedPending);
    setAllUsers(updatedAllUsers);
    
    localStorage.setItem('saf_pending_users', JSON.stringify(updatedPending));
    localStorage.setItem('saf_all_users', JSON.stringify(updatedAllUsers));

    toast({
      title: "Usuário aprovado",
      description: `${user.name} foi aprovado e pode acessar o sistema`
    });
  };

  // Negar usuário pendente
  const denyUser = (userId: string) => {
    const updatedPending = pendingUsers.filter(u => u.id !== userId);
    setPendingUsers(updatedPending);
    localStorage.setItem('saf_pending_users', JSON.stringify(updatedPending));

    toast({
      title: "Acesso negado",
      description: "Usuário foi removido da lista de pendentes"
    });
  };

  // Criar novo usuário (admin only)
  const createUser = () => {
    if (!isAllowedDomain(formData.email)) {
      toast({
        title: "Email não permitido",
        description: "Use emails corporativos @mbcentral, @seb ou @sebsa",
        variant: "destructive"
      });
      return;
    }

    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      name: formData.name,
      email: formData.email,
      role: 'user',
      status: 'active',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      sessionExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      approvedBy: currentUser?.email,
      approvedAt: new Date().toISOString()
    };

    const updatedUsers = [...allUsers, newUser];
    setAllUsers(updatedUsers);
    localStorage.setItem('saf_all_users', JSON.stringify(updatedUsers));

    toast({
      title: "Usuário criado",
      description: `${formData.name} foi adicionado ao sistema`
    });

    setFormData({ ...formData, name: '', email: '' });
    setNewUserOpen(false);
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'default';
      case 'maintenance': return 'destructive';
      default: return 'secondary';
    }
  };

  if (!currentUser) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Perfil</h1>
          <p className="text-muted-foreground">Configure seu perfil e gerencie usuários</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="profile">Meu Perfil</TabsTrigger>
          {currentUser.role === 'admin' && (
            <>
              <TabsTrigger value="pending">Aprovações ({pendingUsers.length})</TabsTrigger>
              <TabsTrigger value="users">Usuários ({allUsers.length})</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          {/* Perfil do usuário atual */}
          <Card>
            <CardHeader>
              <CardTitle>Informações do Perfil</CardTitle>
              <CardDescription>Gerencie suas informações pessoais e segurança</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={currentUser.profileImage} />
                  <AvatarFallback className="text-lg">
                    {getInitials(currentUser.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold">{currentUser.name}</h3>
                  <p className="text-muted-foreground">{currentUser.email}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={getRoleColor(currentUser.role) as any}>
                      {currentUser.role}
                    </Badge>
                    <Badge variant="outline">
                      {currentUser.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Último Login</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(currentUser.lastLogin).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Sessão Expira</Label>
                  <p className="text-sm text-muted-foreground">
                    {new Date(currentUser.sessionExpiry).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <User className="w-4 h-4 mr-2" />
                      Editar Perfil
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Perfil</DialogTitle>
                      <DialogDescription>
                        Atualize suas informações pessoais
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome Completo</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email Corporativo</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Apenas emails @mbcentral, @seb ou @sebsa são permitidos
                        </p>
                      </div>
                      <Button onClick={updateProfile} className="w-full">
                        Salvar Alterações
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Key className="w-4 h-4 mr-2" />
                      Alterar Senha
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Alterar Senha</DialogTitle>
                      <DialogDescription>
                        Digite sua senha atual e a nova senha
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="currentPassword">Senha Atual</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={formData.currentPassword}
                          onChange={(e) => setFormData({...formData, currentPassword: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="newPassword">Nova Senha</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={formData.newPassword}
                          onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                        />
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={formData.confirmPassword}
                          onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                        />
                      </div>
                      <Button onClick={changePassword} className="w-full">
                        Alterar Senha
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aprovações - apenas para admin */}
        {currentUser.role === 'admin' && (
          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Usuários Pendentes de Aprovação</CardTitle>
                <CardDescription>
                  Analise e aprove novos usuários que solicitaram acesso
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingUsers.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhum usuário pendente de aprovação
                    </p>
                  ) : (
                    pendingUsers.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <Avatar>
                            <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-semibold">{user.name}</h4>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-xs text-muted-foreground">
                              Solicitado em: {new Date(user.requestedAt).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => approveUser(user.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => denyUser(user.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            Negar
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Usuários - apenas para admin */}
        {currentUser.role === 'admin' && (
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Usuários do Sistema</CardTitle>
                    <CardDescription>Gerencie todos os usuários ativos</CardDescription>
                  </div>
                  <Dialog open={newUserOpen} onOpenChange={setNewUserOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Users className="w-4 h-4 mr-2" />
                        Criar Usuário
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Criar Novo Usuário</DialogTitle>
                        <DialogDescription>
                          Adicione um novo usuário ao sistema
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="newUserName">Nome Completo</Label>
                          <Input
                            id="newUserName"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                        </div>
                        <div>
                          <Label htmlFor="newUserEmail">Email Corporativo</Label>
                          <Input
                            id="newUserEmail"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                        <Button onClick={createUser} className="w-full">
                          Criar Usuário
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {allUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage src={user.profileImage} />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-semibold">{user.name}</h4>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getRoleColor(user.role) as any} className="text-xs">
                              {user.role}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {user.status}
                            </Badge>
                            {user.approvedBy && (
                              <span className="text-xs text-muted-foreground">
                                Aprovado por {user.approvedBy}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default ProfileManagement;