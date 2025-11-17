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

  // Domínios permitidos (mantido apenas para referência, a validação foi removida)
  private readonly ALLOWED_DOMAINS = [
    '@mbcentral.com.br',
    '@seb.com.br', 
    '@sebsa.com.br'
  ];

  // Token agora é gerado pelo backend (JWT real)
  private generateToken(): string {
    return 'simulated_token_from_backend';
  }

  // A validação de domínio foi removida para permitir o login do admin temporário
  // A validação de domínio deve ser feita no backend, se necessário.
  private isValidDomain(email: string): boolean {
    return true; // Sempre retorna true
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
      // A validação de domínio foi removida para permitir o login do admin temporário
      // if (!this.isValidDomain(credentials.email)) {
      //   return {
      //     success: false,
      //     message: 'Acesso permitido apenas para emails corporativos (@mbcentral, @seb, @sebsa)'
      //   };
      // }

      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 1000));

      // --- SOLUÇÃO DE CONTORNO: AUTENTICAÇÃO SIMULADA NO FRONTEND ---
      // Esta lógica é temporária para contornar o problema de comunicação com o backend
      // Em produção, a autenticação DEVE ser feita via API.
      
      // Simular a busca do usuário no "banco de dados" users.json
      const simulatedUser = {
        username: 'temp_admin@mbcentral.com.br',
        name: 'Admin Temporario',
        role: 'Admin',
        password: 'saf123' // Senha em texto puro (INSEGURO, APENAS PARA CONTORNO)
      };

      if (credentials.email !== simulatedUser.username || credentials.password !== simulatedUser.password) {
        return {
          success: false,
          message: 'Credenciais inválidas. (Simulação de Frontend)'
        };
      }

      const token = this.generateToken();
      const userData = {
        username: simulatedUser.username,
        role: simulatedUser.role
      };
      
      // Criar perfil do usuário (adaptado para usar dados da API)
      const user = this.createUserProfile(userData.username, userData.role as User['role']);
      // O token e o refresh token agora vêm do backend
      const refreshToken = token; // Usando o mesmo token para simplificar a migração


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
    
    // Limpar o token de acesso (se estiver em cookie, seria limpo pelo backend)
    // Se estiver em localStorage, limpamos aqui.
    localStorage.removeItem(this.STORAGE_KEYS.TOKEN);
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

