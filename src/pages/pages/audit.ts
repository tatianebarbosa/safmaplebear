// Audit log page component (coordenadora only)
import { AuthService } from '../auth.js';
import { ApiService } from '../api.js';
import { Store } from '../store.js';
import { Toast, LoadingSpinner, EmptyState } from '../ui/components.js';

export class AuditLogPage {
    private authService = new AuthService();
    private apiService = new ApiService();
    private store = new Store();

    async render(): Promise<string> {
        const user = this.authService.getCurrentUser();
        if (!user || user.role !== 'coordenadora') {
            return '<div>Acesso negado</div>';
        }

        return `
            <div class="header">
                <div class="container">
                    <div class="header-content">
                        <a href="#dashboard" class="logo">MapleBear Licenças Canva</a>
                        <nav class="nav">
                            <a href="#dashboard" class="nav-link">Dashboard</a>
                            <a href="#audit" class="nav-link active">Auditoria</a>
                        </nav>
                        <div class="user-menu">
                            <button onclick="logout()" class="btn btn-secondary btn-sm">Sair</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="main-content">
                <div class="container">
                    <div class="page-header">
                        <h1 class="page-title">Log de Auditoria</h1>
                        <p class="page-subtitle">Histórico de todas as ações realizadas no sistema</p>
                    </div>
                    
                    <div class="filters">
                        <div class="filters-row">
                            <div class="filter-group">
                                <label class="form-label">Data Início</label>
                                <input type="date" id="start-date" class="form-input">
                            </div>
                            <div class="filter-group">
                                <label class="form-label">Data Fim</label>
                                <input type="date" id="end-date" class="form-input">
                            </div>
                            <div class="filter-group">
                                <label class="form-label">Ação</label>
                                <select id="action-filter" class="form-select">
                                    <option value="">Todas</option>
                                    <option value="assign">Atribuir</option>
                                    <option value="revoke">Revogar</option>
                                    <option value="transfer">Transferir</option>
                                    <option value="alter_limit">Alterar Limite</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <button onclick="loadAuditLog()" class="btn btn-primary">Filtrar</button>
                                <button onclick="exportCsv()" class="btn btn-success">Exportar CSV</button>
                            </div>
                        </div>
                    </div>
                    
                    <div id="audit-section">
                        ${LoadingSpinner.render('Carregando auditoria...')}
                    </div>
                </div>
            </div>
        `;
    }

    async init() {
        (window as any).logout = () => this.authService.logout();
        (window as any).loadAuditLog = () => this.loadAuditLog();
        (window as any).exportCsv = () => this.exportCsv();
        
        await this.loadAuditLog();
    }

    private async loadAuditLog() {
        try {
            const filters = this.getFilters();
            const auditLog = await this.apiService.getAuditLog(filters);
            this.store.setAuditLog(auditLog);
            this.renderAuditTable();
        } catch (error) {
            Toast.error('Erro ao carregar auditoria', 'Tente novamente');
        }
    }

    private getFilters() {
        const startDate = (document.getElementById('start-date') as HTMLInputElement)?.value;
        const endDate = (document.getElementById('end-date') as HTMLInputElement)?.value;
        const action = (document.getElementById('action-filter') as HTMLSelectElement)?.value;
        
        return { start: startDate, end: endDate, action };
    }

    private renderAuditTable() {
        const auditSection = document.getElementById('audit-section');
        if (!auditSection) return;

        const auditLog = this.store.getAuditLog();
        
        if (auditLog.length === 0) {
            auditSection.innerHTML = EmptyState.render('Nenhum registro', 'Nenhum registro de auditoria encontrado');
            return;
        }

        const rows = auditLog.map(entry => `
            <tr>
                <td>${this.apiService.formatDate(entry.ts)}</td>
                <td>${this.apiService.formatAction(entry.action)}</td>
                <td>${entry.school_name || entry.school_id}</td>
                <td>${entry.actor}</td>
                <td>${JSON.stringify(entry.payload)}</td>
            </tr>
        `).join('');

        auditSection.innerHTML = `
            <div class="table-container">
                <table class="table">
                    <thead>
                        <tr>
                            <th>Data/Hora</th>
                            <th>Ação</th>
                            <th>Escola</th>
                            <th>Usuário</th>
                            <th>Detalhes</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                </table>
            </div>
        `;
    }

    private async exportCsv() {
        try {
            const filters = this.getFilters();
            const blob = await this.apiService.exportAuditCsv(filters);
            
            const filename = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
            this.apiService.downloadFile(blob, filename);
            
            Toast.success('CSV exportado!', 'Download iniciado');
        } catch (error) {
            Toast.error('Erro na exportação', 'Tente novamente');
        }
    }

    destroy() {
        delete (window as any).logout;
        delete (window as any).loadAuditLog;
        delete (window as any).exportCsv;
    }
}