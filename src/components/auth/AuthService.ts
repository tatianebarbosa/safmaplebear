// Serviço de autenticação com suporte a criação de acessos locais (admin/coordenador/time)
export type UserRole = 'admin' | 'coordinator' | 'agent';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  profileImage?: string;
  createdAt: string;
  lastLogin: string;
  sessionExpiry: string;
  approvedBy: string;
  approvedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

interface StoredAccess {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const DEFAULT_ADMIN_EMAIL = 'temp_admin@mbcentral.com.br';
const DEFAULT_ADMIN_PASSWORD = 'saf123';
const DEFAULT_ADMIN_NAME = 'Admin Temporario';
const envRole = import.meta.env.VITE_ADMIN_ROLE?.toLowerCase() as UserRole | undefined;
const ADMIN_ROLE: UserRole = envRole === 'coordinator' || envRole === 'agent' ? envRole : 'admin';
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL || DEFAULT_ADMIN_EMAIL;
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || DEFAULT_ADMIN_PASSWORD;
const ADMIN_NAME = import.meta.env.VITE_ADMIN_NAME || DEFAULT_ADMIN_NAME;
const ENFORCE_MONDAY_LOGOUT = import.meta.env.VITE_ENFORCE_MONDAY_LOGOUT === 'true';

class AuthService {
  private readonly STORAGE_KEYS = {
    TOKEN: 'saf_auth_token',
    USER: 'saf_current_user',
    REFRESH_TOKEN: 'saf_refresh_token',
    SESSION_EXPIRY: 'sessionExpiry'
  };
  private readonly CUSTOM_USERS_KEY = 'saf_custom_access';

  private generateToken(): string {
    return 'simulated_token_from_backend';
  }

  private createUserProfile(email: string, role: UserRole, name?: string): User {
    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 7);

    return {
      id: `user_${Date.now()}`,
      name: name || email.split('@')[0].replace('.', ' ').replace(/^\w/, c => c.toUpperCase()),
      email,
      role,
      status: 'active',
      profileImage: '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      sessionExpiry: sessionExpiry.toISOString(),
      approvedBy: 'sistema',
      approvedAt: new Date().toISOString()
    };
  }

  private getCustomUsers(): StoredAccess[] {
    try {
      const raw = localStorage.getItem(this.CUSTOM_USERS_KEY);
      return raw ? (JSON.parse(raw) as StoredAccess[]) : [];
    } catch {
      return [];
    }
  }

  private saveCustomUsers(list: StoredAccess[]) {
    localStorage.setItem(this.CUSTOM_USERS_KEY, JSON.stringify(list));
  }

  public createAccess(data: { name: string; email: string; password: string; role: UserRole }): AuthResponse {
    const users = this.getCustomUsers();
    const emailExists = users.some(u => u.email.toLowerCase() === data.email.toLowerCase());
    if (emailExists) {
      return { success: false, message: 'Já existe um acesso com este e-mail' };
    }

    const newAccess: StoredAccess = {
      id: `custom_${Date.now()}`,
      ...data,
    };
    this.saveCustomUsers([...users, newAccess]);
    return { success: true, message: 'Acesso criado com sucesso' };
  }

  public removeAccess(id: string): void {
    const filtered = this.getCustomUsers().filter(u => u.id !== id);
    this.saveCustomUsers(filtered);
  }

  public listAccesses(): StoredAccess[] {
    return this.getCustomUsers();
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      await new Promise(resolve => setTimeout(resolve, 300));

      const customUsers = this.getCustomUsers();
      const defaultUser: StoredAccess = {
        id: 'default_admin',
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: ADMIN_ROLE,
      };

      const allUsers = [defaultUser, ...customUsers];
      const match = allUsers.find(
        (u) =>
          u.email.toLowerCase() === credentials.email.toLowerCase() &&
          u.password === credentials.password
      );

      if (!match) {
        return {
          success: false,
          message: 'Credenciais inválidas.'
        };
      }

      const token = this.generateToken();
      const user = this.createUserProfile(match.email, match.role, match.name);
      const refreshToken = token;

      localStorage.setItem(this.STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      localStorage.setItem(this.STORAGE_KEYS.SESSION_EXPIRY, user.sessionExpiry);

      this.initializeDefaultData(user);

      return {
        success: true,
        user,
        token,
        message: 'Login realizado com sucesso!'
      };

    } catch (error) {
      return {
        success: false,
        message: 'Erro interno do servidor. Tente novamente.'
      };
    }
  }

  logout(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });

    localStorage.removeItem('authenticated');
    localStorage.removeItem('userEmail');
  }

  getCurrentUser(): User | null {
    try {
      const userStr = localStorage.getItem(this.STORAGE_KEYS.USER);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem(this.STORAGE_KEYS.TOKEN);
    const user = this.getCurrentUser();
    const sessionExpiry = localStorage.getItem(this.STORAGE_KEYS.SESSION_EXPIRY);

    if (!token || !user || !sessionExpiry) {
      return false;
    }

    const expiry = new Date(sessionExpiry);
    const now = new Date();
    
    if (now > expiry) {
      this.logout();
      return false;
    }

    if (ENFORCE_MONDAY_LOGOUT) {
      const dayOfWeek = now.getDay();
      if (dayOfWeek === 1) {
        this.logout();
        return false;
      }
    }

    return true;
  }

  private initializeDefaultData(currentUser?: User): void {
    if (!localStorage.getItem('saf_pending_users')) {
      const pendingUsers = [
        {
          id: 'pending_1',
          name: 'Maria Silva',
          email: 'maria.silva@mbcentral.com.br',
          requestedAt: new Date().toISOString(),
          status: 'pending'
        }
      ];
      localStorage.setItem('saf_pending_users', JSON.stringify(pendingUsers));
    }

    if (!localStorage.getItem('saf_all_users')) {
      if (currentUser) {
        localStorage.setItem('saf_all_users', JSON.stringify([currentUser]));
      }
    }
  }

  refreshToken(): Promise<AuthResponse> {
    return new Promise((resolve) => {
      const refreshToken = localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
      const user = this.getCurrentUser();

      if (!refreshToken || !user) {
        resolve({ success: false, message: 'Token de refresh inválido' });
        return;
      }

      const newToken = this.generateToken();
      const sessionExpiry = new Date();
      sessionExpiry.setDate(sessionExpiry.getDate() + 7);
      const updatedUser = {
        ...user,
        sessionExpiry: sessionExpiry.toISOString(),
        lastLogin: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEYS.TOKEN, newToken);
      localStorage.setItem(this.STORAGE_KEYS.SESSION_EXPIRY, sessionExpiry.toISOString());
      localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(updatedUser));

      resolve({
        success: true,
        token: newToken,
        user: updatedUser,
        message: 'Token renovado com sucesso'
      });
    });
  }
}

export const authService = new AuthService();

