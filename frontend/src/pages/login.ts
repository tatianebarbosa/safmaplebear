// Login page component
import { AuthService } from '../auth.js';
import { Toast } from '../ui/components.js';

export class LoginPage {
    private authService = new AuthService();
    
    async render(): Promise<string> {
        return `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-header">
                        <div class="login-logo">🍁</div>
                        <h1 class="login-title">MapleBear</h1>
                        <p class="login-subtitle">Sistema de Licenças Canva</p>
                    </div>
                    
                    <form id="login-form" class="space-y-4">
                        <div class="form-group">
                            <label for="username" class="form-label">Usuário</label>
                            <input 
                                type="text" 
                                id="username" 
                                name="username" 
                                class="form-input" 
                                placeholder="primeiro.segundo"
                                required
                                autocomplete="username"
                            >
                            <small class="text-gray">Use formato: primeiro.segundo (minúsculo, sem acentos)</small>
                        </div>
                        
                        <div class="form-group">
                            <label for="password" class="form-label">Senha</label>
                            <input 
                                type="password" 
                                id="password" 
                                name="password" 
                                class="form-input" 
                                placeholder="Digite sua senha"
                                required
                                autocomplete="current-password"
                            >
                        </div>
                        
                        <button type="submit" class="btn btn-primary w-full" id="login-btn">
                            <span>Entrar</span>
                        </button>
                    </form>
                    
                    <div class="mt-6 text-center">
                        <small class="text-gray">
                            Acesso restrito a funcionários autorizados<br>
                            Entre em contato com a coordenação em caso de problemas
                        </small>
                    </div>
                </div>
            </div>
        `;
    }
    
    async init() {
        const form = document.getElementById('login-form') as HTMLFormElement;
        const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
        
        if (!form || !loginBtn) return;
        
        // Focus on username field
        const usernameField = document.getElementById('username') as HTMLInputElement;
        if (usernameField) {
            usernameField.focus();
        }
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(form);
            const username = formData.get('username') as string;
            const password = formData.get('password') as string;
            
            if (!username || !password) {
                Toast.error('Dados obrigatórios', 'Preencha usuário e senha');
                return;
            }
            
            // Validate username format
            if (!/^[a-z]+\.[a-z]+$/.test(username)) {
                Toast.error('Formato inválido', 'Use formato: primeiro.segundo (minúsculo, sem acentos)');
                return;
            }
            
            try {
                // Show loading state
                loginBtn.disabled = true;
                loginBtn.innerHTML = '<div class="spinner" style="width: 20px; height: 20px;"></div><span>Entrando...</span>';
                
                // Attempt login
                await this.authService.login(username, password);
                
                Toast.success('Login realizado!', 'Redirecionando...');
                
                // Redirect to dashboard
                setTimeout(() => {
                    window.location.hash = 'dashboard';
                }, 1000);
                
            } catch (error) {
                console.error('Erro no login:', error);
                
                const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
                
                if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
                    Toast.error('Acesso negado', 'Usuário ou senha incorretos');
                } else if (errorMessage.includes('network') || errorMessage.includes('fetch')) {
                    Toast.error('Erro de conexão', 'Verifique sua conexão com a internet');
                } else {
                    Toast.error('Erro no login', errorMessage);
                }
                
            } finally {
                // Reset button state
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<span>Entrar</span>';
            }
        });
        
        // Allow Enter key to submit from password field
        const passwordField = document.getElementById('password') as HTMLInputElement;
        if (passwordField) {
            passwordField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    form.dispatchEvent(new Event('submit'));
                }
            });
        }
    }
    
    destroy() {
        // Cleanup if needed
    }
}