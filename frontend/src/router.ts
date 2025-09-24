// Hash-based SPA router
import { AuthService } from './auth.js';
import { LoginPage } from './pages/login.js';
import { DashboardPage } from './pages/dashboard.js';
import { AuditLogPage } from './pages/audit.js';

interface Route {
    path: string;
    component: any;
    requiresAuth: boolean;
    roles?: string[];
}

export class Router {
    private routes: Route[] = [
        { path: '', component: DashboardPage, requiresAuth: true },
        { path: 'login', component: LoginPage, requiresAuth: false },
        { path: 'dashboard', component: DashboardPage, requiresAuth: true },
        { path: 'audit', component: AuditLogPage, requiresAuth: true, roles: ['coordenadora'] }
    ];
    
    private currentPage: any = null;
    private authService = new AuthService();
    
    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
        
        // Handle initial route
        this.handleRoute();
    }
    
    private async handleRoute() {
        const hash = window.location.hash.slice(1) || '';
        const [path, ...params] = hash.split('/');
        const route = this.routes.find(r => r.path === path);
        
        if (!route) {
            this.navigate('dashboard');
            return;
        }
        
        // Check authentication
        const isAuthenticated = await this.authService.isAuthenticated();
        
        if (route.requiresAuth && !isAuthenticated) {
            this.navigate('login');
            return;
        }
        
        if (!route.requiresAuth && isAuthenticated) {
            this.navigate('dashboard');
            return;
        }
        
        // Check role-based access
        if (route.roles && route.roles.length > 0) {
            const user = this.authService.getCurrentUser();
            if (!user || !route.roles.includes(user.role)) {
                this.navigate('dashboard');
                return;
            }
        }
        
        // Load page component
        try {
            // Cleanup previous page
            if (this.currentPage && typeof this.currentPage.destroy === 'function') {
                this.currentPage.destroy();
            }
            
            // Create new page instance
            this.currentPage = new route.component();
            
            // Render page
            const mainContent = document.getElementById('main-content');
            if (mainContent && typeof this.currentPage.render === 'function') {
                const html = await this.currentPage.render(params);
                mainContent.innerHTML = html;
                
                // Initialize page if method exists
                if (typeof this.currentPage.init === 'function') {
                    await this.currentPage.init();
                }
            }
            
        } catch (error) {
            console.error('Erro ao carregar página:', error);
            this.navigate('dashboard');
        }
    }
    
    navigate(path: string) {
        if (window.location.hash.slice(1) !== path) {
            window.location.hash = path;
        }
    }
    
    back() {
        window.history.back();
    }
}