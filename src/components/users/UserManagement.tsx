import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Download, 
  Upload, 
  Users, 
  Filter,
  MoreVertical
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { loadUserData, type UserData } from "@/lib/userAnalytics";

const UserManagement = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [schoolFilter, setSchoolFilter] = useState("");
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "Estudante",
    school: "",
    schoolId: "",
    licenseStatus: "Disponível",
    updatedAt: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, statusFilter, schoolFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Carregar usuários do localStorage primeiro
      const savedUsers = localStorage.getItem('maple-bear-users');
      if (savedUsers) {
        const parsedUsers = JSON.parse(savedUsers);
        setUsers(parsedUsers);
      } else {
        // Se não houver dados salvos, carregar do CSV
        const userData = await loadUserData();
        setUsers(userData);
        localStorage.setItem('maple-bear-users', JSON.stringify(userData));
      }
      
      toast.success("Usuários carregados com sucesso!");
    } catch (error) {
      toast.error("Erro ao carregar usuários");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const saveUsers = (updatedUsers: UserData[]) => {
    localStorage.setItem('maple-bear-users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const filterUsers = () => {
    let filtered = users;

    // Filtro por texto
    if (searchTerm) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.school.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por status de licença
    if (statusFilter !== "all") {
      filtered = filtered.filter(user => {
        switch (statusFilter) {
          case "available":
            return user.licenseStatus === "Disponível" || user.licenseStatus === "";
          case "active":
            return user.licenseStatus === "Ativa";
          case "inactive":
            return user.licenseStatus === "Inativa";
          case "excess":
            return user.licenseStatus === "Excesso";
          default:
            return true;
        }
      });
    }

    // Filtro por escola
    if (schoolFilter) {
      filtered = filtered.filter(user => 
        user.school.toLowerCase().includes(schoolFilter.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleAddUser = () => {
    if (!formData.name || !formData.email) {
      toast.error("Nome e email são obrigatórios");
      return;
    }

    // Verificar se email já existe
    if (users.some(user => user.email === formData.email)) {
      toast.error("Este email já está cadastrado");
      return;
    }

    const newUser: UserData = {
      ...formData,
      updatedAt: new Date().toISOString().split('T')[0]
    };

    const updatedUsers = [...users, newUser];
    saveUsers(updatedUsers);
    
    setIsAddDialogOpen(false);
    resetForm();
    toast.success("Usuário adicionado com sucesso!");
  };

  const handleEditUser = () => {
    if (!selectedUser) return;

    const updatedUsers = users.map(user => 
      user.email === selectedUser.email 
        ? { ...formData, updatedAt: new Date().toISOString().split('T')[0] }
        : user
    );

    saveUsers(updatedUsers);
    
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    resetForm();
    toast.success("Usuário atualizado com sucesso!");
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;

    const updatedUsers = users.filter(user => user.email !== selectedUser.email);
    saveUsers(updatedUsers);
    
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
    toast.success("Usuário excluído com sucesso!");
  };

  const openEditDialog = (user: UserData) => {
    setSelectedUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      school: user.school,
      schoolId: user.schoolId,
      licenseStatus: user.licenseStatus || "Disponível",
      updatedAt: user.updatedAt
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: UserData) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      role: "Estudante",
      school: "",
      schoolId: "",
      licenseStatus: "Disponível",
      updatedAt: new Date().toISOString().split('T')[0]
    });
  };

  const exportUsers = () => {
    const csvContent = [
      "Nome;E-mail;Função;Escola;Escola ID;Status Licença;Atualizado em",
      ...filteredUsers.map(user => 
        `${user.name};${user.email};${user.role};${user.school};${user.schoolId};${user.licenseStatus};${user.updatedAt}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `usuarios-maple-bear-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Dados exportados com sucesso!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Ativa":
        return <Badge variant="default">Ativa</Badge>;
      case "Inativa":
        return <Badge variant="secondary">Inativa</Badge>;
      case "Excesso":
        return <Badge variant="destructive">Excesso</Badge>;
      case "Disponível":
      default:
        return <Badge variant="outline">Disponível</Badge>;
    }
  };

  const getSchoolStats = () => {
    const schoolStats = new Map<string, { total: number; active: number; excess: number }>();
    
    users.forEach(user => {
      if (user.school) {
        if (!schoolStats.has(user.school)) {
          schoolStats.set(user.school, { total: 0, active: 0, excess: 0 });
        }
        const stats = schoolStats.get(user.school)!;
        stats.total++;
        if (user.licenseStatus === "Ativa") stats.active++;
        if (user.licenseStatus === "Excesso") stats.excess++;
      }
    });

    return Array.from(schoolStats.entries())
      .map(([school, stats]) => ({ school, ...stats }))
      .sort((a, b) => b.total - a.total);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie licenças de usuários do Canva
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportUsers}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Usuário
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nome, email ou escola..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status da Licença</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="available">Disponível</SelectItem>
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="inactive">Inativa</SelectItem>
                  <SelectItem value="excess">Excesso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Escola</label>
              <Input
                placeholder="Filtrar por escola..."
                value={schoolFilter}
                onChange={(e) => setSchoolFilter(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setSchoolFilter("");
                }}
              >
                <Filter className="mr-2 h-4 w-4" />
                Limpar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Usuários ({filteredUsers.length})</TabsTrigger>
          <TabsTrigger value="schools">Por Escola</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-4 text-left font-medium">Nome</th>
                      <th className="p-4 text-left font-medium">Email</th>
                      <th className="p-4 text-left font-medium">Escola</th>
                      <th className="p-4 text-left font-medium">Status</th>
                      <th className="p-4 text-left font-medium">Função</th>
                      <th className="p-4 text-right font-medium">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-muted-foreground">
                          Nenhum usuário encontrado
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((user, index) => (
                        <tr key={`${user.email}-${index}`} className="border-t">
                          <td className="p-4">
                            <div className="font-medium">{user.name || "Sem nome"}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </td>
                          <td className="p-4">
                            <div className="text-sm">{user.school || "Não definida"}</div>
                          </td>
                          <td className="p-4">
                            {getStatusBadge(user.licenseStatus)}
                          </td>
                          <td className="p-4">
                            <div className="text-sm">{user.role}</div>
                          </td>
                          <td className="p-4 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => openDeleteDialog(user)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schools" className="space-y-4">
          <div className="grid gap-4">
            {getSchoolStats().map((school, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">{school.school}</h3>
                      <p className="text-sm text-muted-foreground">
                        {school.total} usuários total
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="default">
                        {school.active} Ativos
                      </Badge>
                      {school.excess > 0 && (
                        <Badge variant="destructive">
                          {school.excess} Excesso
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog Adicionar Usuário */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Usuário</DialogTitle>
            <DialogDescription>
              Cadastre um novo usuário no sistema
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome completo"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Função</label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estudante">Estudante</SelectItem>
                    <SelectItem value="Professor">Professor</SelectItem>
                    <SelectItem value="Coordenador">Coordenador</SelectItem>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status da Licença</label>
                <Select 
                  value={formData.licenseStatus} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, licenseStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Ativa">Ativa</SelectItem>
                    <SelectItem value="Inativa">Inativa</SelectItem>
                    <SelectItem value="Excesso">Excesso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Escola</label>
              <Input
                value={formData.school}
                onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
                placeholder="Nome da escola"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddUser}>
              Adicionar Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Editar Usuário */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Altere as informações do usuário
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome completo"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Email *</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                  disabled
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Função</label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Estudante">Estudante</SelectItem>
                    <SelectItem value="Professor">Professor</SelectItem>
                    <SelectItem value="Coordenador">Coordenador</SelectItem>
                    <SelectItem value="Administrador">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Status da Licença</label>
                <Select 
                  value={formData.licenseStatus} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, licenseStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Disponível">Disponível</SelectItem>
                    <SelectItem value="Ativa">Ativa</SelectItem>
                    <SelectItem value="Inativa">Inativa</SelectItem>
                    <SelectItem value="Excesso">Excesso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Escola</label>
              <Input
                value={formData.school}
                onChange={(e) => setFormData(prev => ({ ...prev, school: e.target.value }))}
                placeholder="Nome da escola"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Excluir Usuário */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          
          {selectedUser && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="font-medium">{selectedUser.name}</p>
              <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              <p className="text-sm text-muted-foreground">{selectedUser.school}</p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              Excluir Usuário
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;