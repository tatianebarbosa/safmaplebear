// Main application entry point
import { AuthService } from './auth.js';
import { Router } from './router.js';
import { Store } from './store.js';
import { Toast } from './ui/components.js';

class App {
    private authService = new AuthService();
    private router = new Router();
    private store = new Store();
    
    async init() {
        try {
            // Initialize services
            await this.authService.init();
            this.router.init();
            
            // Hide loading spinner
            this.hideLoading();
            
            // Show main content
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.display = 'block';
            }
            
            Toast.success('Sistema carregado com sucesso!', 'Bem-vindo ao MapleBear Licenças Canva');
            
        } catch (error) {
            console.error('Erro ao inicializar aplicação:', error);
            Toast.error('Erro ao carregar sistema', 'Tente novamente em alguns segundos');
            this.hideLoading();
        }
    }
    
    private hideLoading() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.display = 'none';
        }
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});

// Export for debugging
(window as any).app = { AuthService, Router, Store, Toast };