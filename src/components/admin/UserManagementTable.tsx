import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Edit, Trash2, KeyRound, UserPlus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { User, Role } from '@/types/tickets';

// Funo auxiliar para fazer requisies autenticadas
const fetchAuthenticated = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('saf_auth_token');
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });
  
  if (response.status === 401 || response.status === 403) {
    // Redirecionar para login se o token for invlido/expirado
    window.location.href = '/login';
    throw new Error('No autorizado');
  }

  return response;
};

const api = {
  getUsers: async (): Promise<User[]> => {
    const response = await fetchAuthenticated('/api/admin/users');
    const data = await response.json();
    if (!data.success) {
      throw new Error(data.message || 'Erro ao buscar usu?rios');
    }
    // O backend retorna username, name, role. O frontend espera id, name, email, role.
    // Usaremos username como email e id.
    return data.users.map((u: any) => ({
      id: u.username,
      name: u.name,
      email: u.username,
      role: u.role,
    }));
  },
  createUser: async (data: { username: string, name: string, password: string, role: Role }): Promise<any> => {
    const response = await fetchAuthenticated('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify({
        username: data.username,
        name: data.name,
        password: data.password,
        role: data.role,
      }),
    });
    return response.json();
  },
  updatePassword: async (username: string, new_password: string): Promise<any> => {
    const response = await fetchAuthenticated('/api/admin/users/password', {
      method: 'PUT',
      body: JSON.stringify({
        username: username,
        new_password: new_password,
      }),
    });
    return response.json();
  },
  updateRole: async (username: string, new_role: Role): Promise<any> => {
    const response = await fetchAuthenticated('/api/admin/users/role', {
      method: 'PUT',
      body: JSON.stringify({
        username: username,
        new_role: new_role,
      }),
    });
    return response.json();
  },
  deleteUser: async (username: string): Promise<any> => {
    const safeUsername = encodeURIComponent(username);
    const response = await fetchAuthenticated(`/api/admin/users/${safeUsername}`, {
      method: 'DELETE',
    });
    return response.json();
  }
};

const getRoleBadge = (role: Role) => {
  switch (role) {
    case 'Admin':
      return <Badge variant="muted" size="sm">Administrador</Badge>;
    case 'Coordinator':
      return <Badge variant="muted" size="sm">Coordenador</Badge>;
    case 'Agent':
      return <Badge variant="muted" size="sm">Agente</Badge>;
    default:
      return <Badge variant="outline">{role}</Badge>;
  }
};

const UserManagementTable = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<Role>('Agent');

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Agent' as Role,
  });

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // TODO: Substituir pela chamada real da API
      const fetchedUsers = await api.getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      toast({
        title: 'Erro ao carregar usu?rios',
        description: 'No foi possvel buscar a lista de usu?rios do servidor.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password || !form.role) {
      toast({ title: 'Erro', description: 'Preencha todos os campos.', variant: 'destructive' });
      return;
    }

    try {
      // TODO: Substituir pela chamada real da API
      const result = await api.createUser({
        username: form.email,
        name: form.name,
        password: form.password,
        role: form.role,
      });

      if (result.success) {
        toast({ title: 'Sucesso', description: result.message });
        setIsDialogOpen(false);
        setForm({ name: '', email: '', password: '', role: 'Agent' });
        fetchUsers(); // Recarrega a lista
      } else {
        toast({ title: 'Erro', description: result.message, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Erro de Conex?o', description: error.message || 'No foi possvel criar o usu?rio.', variant: 'destructive' });
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newPassword) return;

    try {
      // TODO: Substituir pela chamada real da API
      const result = await api.updatePassword(currentUser.email, newPassword);

      if (result.success) {
        toast({ title: 'Sucesso', description: result.message });
        setIsPasswordDialogOpen(false);
        setNewPassword('');
        setCurrentUser(null);
      } else {
        toast({ title: 'Erro', description: result.message, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Erro de Conex?o', description: error.message || 'No foi possvel atualizar a senha.', variant: 'destructive' });
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !newRole) return;

    try {
      // TODO: Substituir pela chamada real da API
      const result = await api.updateRole(currentUser.email, newRole);

      if (result.success) {
        toast({ title: 'Sucesso', description: result.message });
        setIsRoleDialogOpen(false);
        setNewRole('Agent');
        setCurrentUser(null);
        fetchUsers(); // Recarrega a lista
      } else {
        toast({ title: 'Erro', description: result.message, variant: 'destructive' });
      }
    } catch (error: any) {
      toast({ title: 'Erro de Conex?o', description: error.message || 'No foi possvel atualizar o perfil.', variant: 'destructive' });
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!window.confirm(`Tem certeza que deseja deletar o usu?rio ${user.name} (${user.email})?`)) {
      return;
    }

    try {
      const result = await api.deleteUser(user.email);

      if (!result.success) {
        toast({ title: 'Erro', description: result.message || 'No foi possvel remover o usu?rio.', variant: 'destructive' });
        return;
      }

      setUsers((current) => current.filter((u) => u.id !== user.id));
      toast({ title: 'Usurio removido', description: result.message || 'Acesso revogado com sucesso.' });
    } catch (error: any) {
      toast({ title: 'Erro de Conex?o', description: error.message || 'No foi possvel deletar o usu?rio.', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <p>Carregando usu?rios...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
          <UserPlus className="h-4 w-4" />
          Novo Usurio
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Perfil</TableHead>
            <TableHead className="text-right">Aes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell className="font-medium">{user.name}</TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{getRoleBadge(user.role)}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setCurrentUser(user);
                    setIsPasswordDialogOpen(true);
                  }}
                >
                  <KeyRound className="h-4 w-4 mr-2" />
                  Senha
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setCurrentUser(user);
                    setNewRole(user.role);
                    setIsRoleDialogOpen(true);
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Perfil
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => handleDeleteUser(user)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Dialog de Criao de Usurio */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Novo Usurio</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Username)</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Perfil</Label>
              <Select
                value={form.role}
                onValueChange={(value: Role) => setForm({ ...form, role: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agent">Agente</SelectItem>
                  <SelectItem value="Coordinator">Coordenador</SelectItem>
                  <SelectItem value="Admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit">Criar Usurio</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Alterao de Senha */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Alterar Senha de {currentUser?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit">Atualizar Senha</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de Alterao de Perfil */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Alterar Perfil de {currentUser?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateRole} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-role">Novo Perfil</Label>
              <Select
                value={newRole}
                onValueChange={(value: Role) => setNewRole(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Agent">Agente</SelectItem>
                  <SelectItem value="Coordinator">Coordenador</SelectItem>
                  <SelectItem value="Admin">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="submit">Atualizar Perfil</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementTable;
