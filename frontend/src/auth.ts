// Authentication service
import { ApiService } from './api.js';

export interface User {
    username: string;
    name: string;
    role: 'agente' | 'coordenadora';
    exp: number;
}

export class AuthService {
    private TOKEN_KEY = 'mb_canva_token';
    private USER_KEY = 'mb_canva_user';
    private apiService = new ApiService();
    
    async init() {
        // Check for existing token and validate
        const token = this.getToken();
        if (token) {
            try {
                const user = this.getCurrentUser();
                if (user && user.exp * 1000 > Date.now()) {
                    // Token is still valid
                    this.apiService.setAuthToken(token);
                    return;
                }
            } catch (error) {
                console.warn('Token inválido, removendo:', error);
            }
        }
        
        // Clear invalid tokens
        this.logout();
    }
    
    async login(username: string, password: string): Promise<boolean> {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro de autenticação');
            }
            
            const data = await response.json();
            const { token, user } = data;
            
            // Store token and user info
            localStorage.setItem(this.TOKEN_KEY, token);
            localStorage.setItem(this.USER_KEY, JSON.stringify(user));
            
            // Set token for API calls
            this.apiService.setAuthToken(token);
            
            return true;
            
        } catch (error) {
            console.error('Erro no login:', error);
            throw error;
        }
    }
    
    logout() {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        this.apiService.setAuthToken(null);
        window.location.hash = 'login';
    }
    
    async isAuthenticated(): Promise<boolean> {
        const token = this.getToken();
        const user = this.getCurrentUser();
        
        if (!token || !user) {
            return false;
        }
        
        // Check if token is expired
        if (user.exp * 1000 <= Date.now()) {
            this.logout();
            return false;
        }
        
        return true;
    }
    
    getCurrentUser(): User | null {
        try {
            const userData = localStorage.getItem(this.USER_KEY);
            if (!userData) return null;
            
            return JSON.parse(userData);
        } catch (error) {
            console.error('Erro ao obter usuário atual:', error);
            return null;
        }
    }
    
    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }
    
    hasRole(role: string): boolean {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        if (role === 'coordenadora') {
            return user.role === 'coordenadora';
        }
        
        // All authenticated users are at least 'agente'
        return user.role === 'agente' || user.role === 'coordenadora';
    }
    
    canAccessAudit(): boolean {
        return this.hasRole('coordenadora');
    }
    
    canAlterLimits(): boolean {
        return this.hasRole('coordenadora');
    }
    
    canReloadData(): boolean {
        return this.hasRole('coordenadora');
    }
}