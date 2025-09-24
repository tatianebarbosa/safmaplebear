// Serviço de autenticação melhorado
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'maintenance';
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

class AuthService {
  private readonly STORAGE_KEYS = {
    TOKEN: 'saf_auth_token',
    USER: 'saf_current_user',
    REFRESH_TOKEN: 'saf_refresh_token',
    SESSION_EXPIRY: 'sessionExpiry'
  };

  private readonly ALLOWED_DOMAINS = [
    '@mbcentral.com.br',
    '@seb.com.br', 
    '@sebsa.com.br'
  ];

  // Simulação de credenciais válidas (em produção, isso seria validado no backend)
  private readonly VALID_CREDENTIALS = [
    { email: 'admin@mbcentral.com.br', password: 'maplebear2025', role: 'admin' as const },
    { email: 'saf@seb.com.br', password: 'saf2025', role: 'user' as const },
    { email: 'coordenador@sebsa.com.br', password: 'coord2025', role: 'user' as const }
  ];

  private generateToken(): string {
    // Em produção, isso seria um JWT real
    return btoa(JSON.stringify({
      timestamp: Date.now(),
      random: Math.random().toString(36)
    }));
  }

  private isValidDomain(email: string): boolean {
    return this.ALLOWED_DOMAINS.some(domain => 
      email.toLowerCase().includes(domain)
    );
  }

  private createUserProfile(email: string, role: User['role']): User {
    const sessionExpiry = new Date();
    sessionExpiry.setDate(sessionExpiry.getDate() + 7);

    return {
      id: `user_${Date.now()}`,
      name: email.split('@')[0].replace('.', ' ').replace(/^\w/, c => c.toUpperCase()),
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

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      // Validar domínio
      if (!this.isValidDomain(credentials.email)) {
        return {
          success: false,
          message: 'Acesso permitido apenas para emails corporativos (@mbcentral, @seb, @sebsa)'
        };
      }

      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Validar credenciais
      const validCredential = this.VALID_CREDENTIALS.find(
        cred => cred.email === credentials.email && cred.password === credentials.password
      );

      if (!validCredential) {
        return {
          success: false,
          message: 'Email ou senha incorretos'
        };
      }

      // Criar perfil do usuário
      const user = this.createUserProfile(credentials.email, validCredential.role);
      const token = this.generateToken();
      const refreshToken = this.generateToken();

      // Salvar no localStorage (em produção, usar httpOnly cookies)
      localStorage.setItem(this.STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(this.STORAGE_KEYS.USER, JSON.stringify(user));
      localStorage.setItem(this.STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      localStorage.setItem(this.STORAGE_KEYS.SESSION_EXPIRY, user.sessionExpiry);

      // Inicializar dados se necessário
      this.initializeDefaultData();

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
    // Limpar todos os dados de autenticação
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Limpar outros dados relacionados
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

    // Verificar expiração da sessão
    const expiry = new Date(sessionExpiry);
    const now = new Date();
    
    if (now > expiry) {
      this.logout();
      return false;
    }

    // Verificar se é segunda-feira (regra de negócio específica)
    const dayOfWeek = now.getDay();
    if (dayOfWeek === 1) {
      this.logout();
      return false;
    }

    return true;
  }

  private initializeDefaultData(): void {
    // Inicializar dados padrão se não existirem
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
      const currentUser = this.getCurrentUser();
      if (currentUser) {
        localStorage.setItem('saf_all_users', JSON.stringify([currentUser]));
      }
    }
  }

  refreshToken(): Promise<AuthResponse> {
    // Em produção, isso faria uma chamada para o backend
    return new Promise((resolve) => {
      const refreshToken = localStorage.getItem(this.STORAGE_KEYS.REFRESH_TOKEN);
      const user = this.getCurrentUser();

      if (!refreshToken || !user) {
        resolve({ success: false, message: 'Token de refresh inválido' });
        return;
      }

      const newToken = this.generateToken();
      localStorage.setItem(this.STORAGE_KEYS.TOKEN, newToken);

      resolve({
        success: true,
        token: newToken,
        user,
        message: 'Token renovado com sucesso'
      });
    });
  }
}

export const authService = new AuthService();

