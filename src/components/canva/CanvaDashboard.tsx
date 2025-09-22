import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Users, Search, Plus, Edit, Trash2, UserPlus, Download, BarChart3 } from "lucide-react";
import StatsCard from "@/components/dashboard/StatsCard";
import { 
  CanvaUser, 
  UserStats,
  loadCanvaUsers, 
  getUserStats, 
  filterCanvaUsers,
  saveUserChange
} from "@/lib/canvaUserProcessor";

const CanvaDashboard = () => {
  const [users, setUsers] = useState<CanvaUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<CanvaUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [showUserDialog, setShowUserDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<CanvaUser | null>(null);
  const [actionType, setActionType] = useState<'add' | 'edit' | 'remove' | 'deactivate'>('add');
  const [justification, setJustification] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [users, searchTerm, selectedUnit, selectedStatus, selectedRole]);

  const loadData = async () => {
    try {
      setLoading(true);
      const userData = await loadCanvaUsers();
      setUsers(userData);
      toast.success("Dados dos usuários carregados!");
    } catch (error) {
      toast.error("Erro ao carregar dados dos usuários");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const filters = {
      search: searchTerm,
      unit: selectedUnit === "all" ? undefined : selectedUnit,
      status: selectedStatus === "all" ? undefined : selectedStatus,
      role: selectedRole === "all" ? undefined : selectedRole
    };

    const filtered = filterCanvaUsers(users, filters);
    setFilteredUsers(filtered);
  };

  const handleUserAction = (user: CanvaUser, action: 'edit' | 'remove' | 'deactivate') => {
    setCurrentUser(user);
    setActionType(action);
    setShowUserDialog(true);
  };

  const handleAddUser = () => {
    setCurrentUser(null);
    setActionType('add');
    setShowUserDialog(true);
  };

  const submitAction = () => {
    if (!justification.trim()) {
      toast.error("Justificativa é obrigatória");
      return;
    }

    if (currentUser) {
      saveUserChange({
        userId: currentUser.id,
        unitId: currentUser.unitCode,
        action: actionType as any,
        justification,
        performedBy: "admin@mbcentral.com.br" // Pegar do contexto de auth
      });

      // Atualizar lista local baseado na ação
      if (actionType === 'remove' || actionType === 'deactivate') {
        setUsers(users.filter(u => u.id !== currentUser.id));
      }
    }

    toast.success(`Usuário ${actionType === 'add' ? 'adicionado' : actionType === 'edit' ? 'editado' : 'removido'} com sucesso!`);
    setShowUserDialog(false);
    setJustification("");
    setCurrentUser(null);
  };

  const getUnits = () => {
    const units = [...new Set(users.map(u => u.unit))].filter(Boolean);
    return units.sort();
  };

  const getRoles = () => {
    const roles = [...new Set(users.map(u => u.role))].filter(Boolean);
    return roles.sort();
  };

  const getActionTitle = () => {
    switch (actionType) {
      case 'add': return 'Adicionar Usuário';
      case 'edit': return 'Editar Usuário';
      case 'remove': return 'Remover Usuário';
      case 'deactivate': return 'Desativar Usuário';
      default: return 'Ação do Usuário';
    }
  };

  const stats: UserStats = getUserStats(users);

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
          <h1 className="text-3xl font-bold">Dashboard Canva</h1>
          <p className="text-muted-foreground">
            Gerenciamento de usuários e licenças Canva
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleAddUser}>
            <UserPlus className="w-4 h-4 mr-2" />
            Adicionar Usuário
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline">
            <BarChart3 className="w-4 h-4 mr-2" />
            Relatórios
          </Button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total de Usuários"
          value={stats.totalUsers.toString()}
          icon={Users}
        />
        <StatsCard
          title="Usuários Ativos"
          value={stats.activeUsers.toString()}
          trend={{ value: (stats.activeUsers / stats.totalUsers) * 100, isPositive: true }}
          icon={UserPlus}
        />
        <StatsCard
          title="Usuários Inativos"
          value={stats.inactiveUsers.toString()}
          icon={Users}
        />
        <StatsCard
          title="Unidades"
          value={Object.keys(stats.usersByUnit).length.toString()}
          icon={BarChart3}
        />
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Buscar usuário</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome ou e-mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Button variant="outline" size="icon">
                  <Search className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="min-w-[140px]">
                <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas unidades</SelectItem>
                    {getUnits().map((unit) => (
                      <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[120px]">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas funções</SelectItem>
                    {getRoles().map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="min-w-[110px]">
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos status</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Usuários */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-tight">{user.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">{user.email}</p>
                </div>
                <Badge variant={user.isActive ? "default" : "secondary"}>
                  {user.isActive ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Função: </span>
                  <span className="font-medium">{user.role}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Unidade: </span>
                  <span className="font-medium">{user.unit}</span>
                </div>
                {user.addedDate && (
                  <div>
                    <span className="text-muted-foreground">Adicionado: </span>
                    <span className="font-medium">{new Date(user.addedDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUserAction(user, 'edit')}
                  className="flex-1"
                >
                  <Edit className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleUserAction(user, 'remove')}
                  className="flex-1"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Remover
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-8">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum usuário encontrado com os filtros aplicados.</p>
          </CardContent>
        </Card>
      )}

      {/* Dialog de Ação do Usuário */}
      <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getActionTitle()}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {currentUser && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-semibold">{currentUser.name}</p>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                <p className="text-sm text-muted-foreground">{currentUser.unit}</p>
              </div>
            )}
            
            <div>
              <Label htmlFor="justification">Justificativa *</Label>
              <Textarea
                id="justification"
                placeholder="Digite a justificativa para esta ação..."
                value={justification}
                onChange={(e) => setJustification(e.target.value)}
                rows={4}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={submitAction}>
                Confirmar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CanvaDashboard;