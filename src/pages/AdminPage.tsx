import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  Users, 
  Globe, 
  Plus,
  Edit,
  Trash2,
  Shield,
  Eye
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { User, Role, Agente } from '@/types/tickets';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface SiteConfig {
  title: string;
  heroTitle: string;
  heroDescription: string;
  menuItems: { name: string; url: string }[];
}

const AdminPage = () => {
  const { currentUser, users, createUser, updateUser, removeUser, hasRole } = useAuthStore();
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>({
    title: 'Maple Bear SAF',
    heroTitle: 'Centro de Controle SAF',
    heroDescription: 'Visão geral dos seus atendimentos, monitorias e alertas importantes',
    menuItems: [
      { name: 'Início', url: '/dashboard' },
      { name: 'Canva', url: '/dashboard/canva' },
      { name: 'Vouchers', url: '/dashboard/vouchers' },
      { name: 'Tickets', url: '/tickets' },
      { name: 'Monitoria', url: '/monitoring' }
    ]
  });

  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'Agent' as Role,
    agente: '' as Agente | ''
  });

  // Redirect if not authorized
  if (!hasRole('Admin')) {
    return (
      <div className="container mx-auto px-6 py-8">
        <Card>
          <CardContent className="py-16 text-center">
            <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
            <h2 className="text-2xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-muted-foreground">
              Apenas Administradores podem acessar esta área.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const agentes: Agente[] = ['Tati', 'Rafha', 'Ingrid', 'João', 'Jaque', 'Jessika', 'Fernanda'];

  const handleCreateUser = () => {
    if (!userForm.name || !userForm.email || !userForm.role) {
      toast.error('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    if (userForm.role === 'Agent' && !userForm.agente) {
      toast.error('Agentes devem ter um nome de agente associado');
      return;
    }

    try {
      createUser({
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        agente: userForm.role === 'Agent' ? userForm.agente as Agente : undefined
      });

      toast.success('Usuário criado com sucesso');
      setUserForm({ name: '', email: '', role: 'Agent', agente: '' });
      setShowUserDialog(false);
    } catch (error) {
      toast.error('Erro ao criar usuário');
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role,
      agente: user.agente || ''
    });
    setShowUserDialog(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    try {
      updateUser(editingUser.id, {
        name: userForm.name,
        email: userForm.email,
        role: userForm.role,
        agente: userForm.role === 'Agent' ? userForm.agente as Agente : undefined
      });

      toast.success('Usuário atualizado com sucesso');
      setUserForm({ name: '', email: '', role: 'Agent', agente: '' });
      setEditingUser(null);
      setShowUserDialog(false);
    } catch (error) {
      toast.error('Erro ao atualizar usuário');
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      toast.error('Você não pode deletar seu próprio usuário');
      return;
    }

    try {
      removeUser(userId);
      toast.success('Usuário removido com sucesso');
    } catch (error) {
      toast.error('Erro ao remover usuário');
    }
  };

  const saveSiteConfig = () => {
    localStorage.setItem('saf-site-config', JSON.stringify(siteConfig));
    toast.success('Configurações do site salvas com sucesso');
  };

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'Admin':
        return <Badge className="bg-red-100 text-red-800">Admin</Badge>;
      case 'Coordinator':
        return <Badge className="bg-blue-100 text-blue-800">Coordenador</Badge>;
      case 'Agent':
        return <Badge className="bg-green-100 text-green-800">Agente</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-6 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Administração
          </h1>
          <p className="text-muted-foreground">
            Gerencie usuários, papéis e configurações do sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Usuários e Papéis
          </TabsTrigger>
          <TabsTrigger value="site" className="gap-2">
            <Globe className="h-4 w-4" />
            Configurações do Site
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            Pré-visualização
          </TabsTrigger>
        </TabsList>

        {/* Users Management */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gerenciamento de Usuários</CardTitle>
                  <CardDescription>
                    Gerencie usuários do sistema e seus papéis de acesso
                  </CardDescription>
                </div>
                <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
                  <DialogTrigger asChild>
                    <Button className="gap-2" onClick={() => {
                      setEditingUser(null);
                      setUserForm({ name: '', email: '', role: 'Agent', agente: '' });
                    }}>
                      <Plus className="h-4 w-4" />
                      Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>
                        {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                      </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nome *</Label>
                        <Input
                          id="name"
                          value={userForm.name}
                          onChange={(e) => setUserForm(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Nome completo"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={userForm.email}
                          onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="email@example.com"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="role">Papel *</Label>
                        <Select
                          value={userForm.role}
                          onValueChange={(value: Role) => setUserForm(prev => ({ 
                            ...prev, 
                            role: value,
                            agente: value === 'Agent' ? prev.agente : ''
                          }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Agent">Agente SAF</SelectItem>
                            <SelectItem value="Coordinator">Coordenador</SelectItem>
                            <SelectItem value="Admin">Administrador</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {userForm.role === 'Agent' && (
                        <div>
                          <Label htmlFor="agente">Nome do Agente *</Label>
                          <Select
                            value={userForm.agente}
                            onValueChange={(value: Agente) => setUserForm(prev => ({ ...prev, agente: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um agente" />
                            </SelectTrigger>
                            <SelectContent>
                              {agentes.map((agente) => (
                                <SelectItem key={agente} value={agente}>
                                  {agente}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      <div className="flex justify-end gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setShowUserDialog(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={editingUser ? handleUpdateUser : handleCreateUser}
                        >
                          {editingUser ? 'Atualizar' : 'Criar'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Papel</TableHead>
                    <TableHead>Agente</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell>
                        {user.agente ? (
                          <Badge variant="outline">{user.agente}</Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          {user.id !== currentUser?.id && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteUser(user.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Site Configuration */}
        <TabsContent value="site" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Site</CardTitle>
              <CardDescription>
                Personalize títulos, textos e menus do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title">Título do Site</Label>
                  <Input
                    id="title"
                    value={siteConfig.title}
                    onChange={(e) => setSiteConfig(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="heroTitle">Título do Dashboard</Label>
                  <Input
                    id="heroTitle"
                    value={siteConfig.heroTitle}
                    onChange={(e) => setSiteConfig(prev => ({ ...prev, heroTitle: e.target.value }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="heroDescription">Descrição do Dashboard</Label>
                <Textarea
                  id="heroDescription"
                  value={siteConfig.heroDescription}
                  onChange={(e) => setSiteConfig(prev => ({ ...prev, heroDescription: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Itens do Menu Principal</Label>
                <div className="space-y-2 mt-2">
                  {siteConfig.menuItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-2 gap-2">
                      <Input
                        placeholder="Nome do menu"
                        value={item.name}
                        onChange={(e) => {
                          const newItems = [...siteConfig.menuItems];
                          newItems[index].name = e.target.value;
                          setSiteConfig(prev => ({ ...prev, menuItems: newItems }));
                        }}
                      />
                      <Input
                        placeholder="URL"
                        value={item.url}
                        onChange={(e) => {
                          const newItems = [...siteConfig.menuItems];
                          newItems[index].url = e.target.value;
                          setSiteConfig(prev => ({ ...prev, menuItems: newItems }));
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
              
              <Button onClick={saveSiteConfig} className="gap-2">
                <Settings className="h-4 w-4" />
                Salvar Configurações
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Pré-visualização das Configurações</CardTitle>
              <CardDescription>
                Veja como as mudanças aparecerão no sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-muted/50">
                <h1 className="text-3xl font-bold mb-2">{siteConfig.heroTitle}</h1>
                <p className="text-muted-foreground mb-6">{siteConfig.heroDescription}</p>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Navegação Principal:</h3>
                  <div className="flex flex-wrap gap-2">
                    {siteConfig.menuItems.map((item, index) => (
                      <Badge key={index} variant="outline">
                        {item.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;