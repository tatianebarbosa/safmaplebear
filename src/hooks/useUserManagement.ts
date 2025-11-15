import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";

// Definições de tipos (copiadas do UserManagement.tsx)
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'maintenance';
  status: 'active' | 'pending' | 'blocked';
  lastLogin: string;
  createdAt: string;
}

export interface UserFormData {
  id?: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'maintenance';
}

// Simulação de dados e persistência (copiada do UserManagement.tsx)
const initialUsers: User[] = [
  { id: '1', name: 'Admin Principal', email: 'admin@saf.com', role: 'admin', status: 'active', lastLogin: '2024-10-25', createdAt: '2023-01-01' },
  { id: '2', name: 'Usuário Comum', email: 'user@saf.com', role: 'user', status: 'active', lastLogin: '2024-10-24', createdAt: '2023-05-15' },
  { id: '3', name: 'Manutenção', email: 'manutencao@saf.com', role: 'maintenance', status: 'active', lastLogin: '2024-10-23', createdAt: '2023-08-10' },
];

const loadUsers = (): User[] => {
  const storedUsers = localStorage.getItem('saf_users');
  return storedUsers ? JSON.parse(storedUsers) : initialUsers;
};

const saveUsers = (users: User[]) => {
  localStorage.setItem('saf_users', JSON.stringify(users));
};

export const useUserManagement = () => {
  const [users, setUsers] = useState<User[]>(loadUsers);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | User['role']>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserFormData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Efeito para garantir que os dados iniciais sejam salvos se não existirem
  useEffect(() => {
    if (!localStorage.getItem('saf_users')) {
      saveUsers(initialUsers);
    }
  }, []);

  // Lógica de Filtragem e Busca
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, filterRole]);

  // Ações CRUD
  const handleSaveUser = async (formData: UserFormData) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulação de API

    let updatedUsers: User[];
    if (formData.id) {
      // Edição
      updatedUsers = users.map(u => u.id === formData.id ? { ...u, ...formData } as User : u);
      toast({ title: "Usuário Atualizado", description: `O usuário ${formData.name} foi atualizado com sucesso.` });
    } else {
      // Criação
      const newUser: User = {
        ...formData,
        id: Date.now().toString(),
        status: 'active',
        lastLogin: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString().split('T')[0],
      };
      updatedUsers = [...users, newUser];
      toast({ title: "Usuário Criado", description: `O usuário ${formData.name} foi criado com sucesso.` });
    }

    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    setIsDialogOpen(false);
    setEditingUser(null);
    setIsLoading(false);
  };

  const handleDeleteUser = async (userId: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulação de API

    const updatedUsers = users.filter(u => u.id !== userId);
    setUsers(updatedUsers);
    saveUsers(updatedUsers);
    toast({ title: "Usuário Excluído", description: "O usuário foi permanentemente removido.", variant: "destructive" });
    setIsLoading(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleNewUser = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  return {
    users: filteredUsers,
    searchTerm,
    setSearchTerm,
    filterRole,
    setFilterRole,
    isDialogOpen,
    setIsDialogOpen,
    editingUser,
    isLoading,
    handleSaveUser,
    handleDeleteUser,
    handleEditUser,
    handleNewUser,
    allUsers: users, // Para contagem total
  };
};
