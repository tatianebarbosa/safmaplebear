// Dashboard page component
import { AuthService } from '../auth.js';
import { ApiService } from '../api.js';
import { Store } from '../store.js';
import { Toast, Modal, LicenseBadge, Card, LoadingSpinner, EmptyState } from '../ui/components.js';
import type { School, SchoolUser } from '../api.js';

export class DashboardPage {
    private authService = new AuthService();
    private apiService = new ApiService();
    private store = new Store();
    private unsubscribe?: () => void;
    
    async render(): Promise<string> {
        const user = this.authService.getCurrentUser();
        if (!user) return '<div>Erro: usuário não encontrado</div>';
        
        return `
            <div class="header">
                <div class="container">
                    <div class="header-content">
                        <a href="#dashboard" class="logo">MapleBear Licenças Canva</a>
                        
                        <nav class="nav">
                            <a href="#dashboard" class="nav-link active">Dashboard</a>
                            ${user.role === 'coordenadora' ? '<a href="#audit" class="nav-link">Auditoria</a>' : ''}
                        </nav>
                        
                        <div class="user-menu">
                            <div class="user-button">
                                <div class="user-avatar">${user.name.charAt(0).toUpperCase()}</div>
                                <div>
                                    <div class="font-medium">${user.name}</div>
                                    <div class="text-sm text-gray">${user.role === 'coordenadora' ? 'Coordenadora' : 'Agente'}</div>
                                </div>
                            </div>
                            <button onclick="logout()" class="btn btn-secondary btn-sm">Sair</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="main-content">
                <div class="container">
                    <!-- Stats Cards -->
                    <div id="stats-section" class="mb-8">
                        ${LoadingSpinner.render('Carregando estatísticas...')}
                    </div>
                    
                    <!-- Filters -->
                    <div class="filters">
                        <div class="filters-row">
                            <div class="filter-group">
                                <label for="search-filter" class="form-label">Buscar</label>
                                <input type="text" id="search-filter" class="form-input" placeholder="Nome da escola ou ID...">
                            </div>
                            
                            <div class="filter-group">
                                <label for="cluster-filter" class="form-label">Cluster</label>
                                <select id="cluster-filter" class="form-select">
                                    <option value="">Todos os clusters</option>
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <label for="status-filter" class="form-label">Situação</label>
                                <select id="status-filter" class="form-select">
                                    <option value="">Todas as situações</option>
                                    <option value="Sem">Sem Licenças</option>
                                    <option value="Parcial">Parcialmente Ocupada</option>
                                    <option value="Completa">Completa</option>
                                    <option value="Excesso">Em Excesso</option>
                                </select>
                            </div>
                            
                            <div class="filter-group">
                                <button onclick="clearFilters()" class="btn btn-secondary">Limpar Filtros</button>
                                ${user.role === 'coordenadora' ? '<button onclick="reloadData()" class="btn btn-warning">Recarregar Dados</button>' : ''}
                            </div>
                        </div>
                    </div>
                    
                    <!-- Schools Grid -->
                    <div id="schools-section">
                        ${LoadingSpinner.render('Carregando escolas...')}
                    </div>
                </div>
            </div>
        `;
    }
    
    async init() {
        // Set up global functions
        (window as any).logout = () => this.logout();
        (window as any).clearFilters = () => this.clearFilters();
        (window as any).reloadData = () => this.reloadData();
        (window as any).viewSchoolUsers = (schoolId: string) => this.viewSchoolUsers(schoolId);
        (window as any).assignLicense = (schoolId: string) => this.assignLicense(schoolId);
        (window as any).revokeLicense = (schoolId: string) => this.revokeLicense(schoolId);
        (window as any).transferLicense = (schoolId: string) => this.transferLicense(schoolId);
        (window as any).changeLimit = (schoolId: string) => this.changeLimit(schoolId);
        
        // Subscribe to store changes
        this.unsubscribe = this.store.subscribe(() => {
            this.renderStats();
            this.renderSchools();
        });
        
        // Set up filter event listeners
        this.setupFilters();
        
        // Load initial data
        await this.loadData();
    }
    
    private setupFilters() {
        const searchFilter = document.getElementById('search-filter') as HTMLInputElement;
        const clusterFilter = document.getElementById('cluster-filter') as HTMLSelectElement;
        const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
        
        if (searchFilter) {
            let timeout: NodeJS.Timeout;
            searchFilter.addEventListener('input', () => {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.store.setFilters({ search: searchFilter.value });
                }, 300);
            });
        }
        
        if (clusterFilter) {
            clusterFilter.addEventListener('change', () => {
                this.store.setFilters({ cluster: clusterFilter.value });
            });
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => {
                this.store.setFilters({ status: statusFilter.value });
            });
        }
    }
    
    private async loadData() {
        try {
            this.store.setLoading(true);
            
            const schools = await this.apiService.getSchools();
            this.store.setSchools(schools);
            
            // Populate cluster filter
            this.populateClusterFilter();
            
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            Toast.error('Erro ao carregar dados', 'Tente novamente em alguns segundos');
        } finally {
            this.store.setLoading(false);
        }
    }
    
    private populateClusterFilter() {
        const clusterFilter = document.getElementById('cluster-filter') as HTMLSelectElement;
        if (!clusterFilter) return;
        
        const clusters = this.store.getClusters();
        
        // Clear existing options (except first one)
        clusterFilter.innerHTML = '<option value="">Todos os clusters</option>';
        
        clusters.forEach(cluster => {
            const option = document.createElement('option');
            option.value = cluster;
            option.textContent = cluster;
            clusterFilter.appendChild(option);
        });
    }
    
    private renderStats() {
        const statsSection = document.getElementById('stats-section');
        if (!statsSection) return;
        
        const stats = this.store.getStats();
        
        statsSection.innerHTML = `
            <div class="grid grid-cols-4 gap-6">
                ${Card.render({
                    title: 'Total de Escolas',
                    content: `<div class="text-3xl font-bold text-primary">${stats.totalSchools}</div>`
                })}
                
                ${Card.render({
                    title: 'Licenças Totais',
                    content: `<div class="text-3xl font-bold text-info">${stats.totalLicenses}</div>`
                })}
                
                ${Card.render({
                    title: 'Licenças Utilizadas',
                    content: `
                        <div class="text-3xl font-bold text-success">${stats.usedLicenses}</div>
                        <div class="text-sm text-gray">Taxa: ${stats.utilizationRate}%</div>
                    `
                })}
                
                ${Card.render({
                    title: 'Licenças Disponíveis',
                    content: `<div class="text-3xl font-bold text-warning">${stats.availableLicenses}</div>`
                })}
            </div>
            
            <div class="grid grid-cols-4 gap-6 mt-6">
                ${Card.render({
                    title: 'Sem Licenças',
                    content: `<div class="text-2xl font-bold text-gray-600">${stats.statusCount.Sem}</div>`
                })}
                
                ${Card.render({
                    title: 'Parcialmente Ocupadas',
                    content: `<div class="text-2xl font-bold text-blue-600">${stats.statusCount.Parcial}</div>`
                })}
                
                ${Card.render({
                    title: 'Completas',
                    content: `<div class="text-2xl font-bold text-green-600">${stats.statusCount.Completa}</div>`
                })}
                
                ${Card.render({
                    title: 'Em Excesso',
                    content: `<div class="text-2xl font-bold text-red-600">${stats.statusCount.Excesso}</div>`
                })}
            </div>
        `;
    }
    
    private renderSchools() {
        const schoolsSection = document.getElementById('schools-section');
        if (!schoolsSection) return;
        
        const schools = this.store.getFilteredSchools();
        const user = this.authService.getCurrentUser();
        
        if (schools.length === 0) {
            schoolsSection.innerHTML = EmptyState.render(
                'Nenhuma escola encontrada',
                'Ajuste os filtros para ver mais resultados'
            );
            return;
        }
        
        const schoolCards = schools.map(school => {
            const badge = LicenseBadge.render(school.used, school.limit);
            
            const actions = `
                <div class="flex gap-2 flex-wrap">
                    <button onclick="viewSchoolUsers('${school.id}')" class="btn btn-secondary btn-sm">
                        👥 Usuários
                    </button>
                    <button onclick="assignLicense('${school.id}')" class="btn btn-success btn-sm">
                        ➕ Atribuir
                    </button>
                    <button onclick="revokeLicense('${school.id}')" class="btn btn-danger btn-sm">
                        ➖ Revogar
                    </button>
                    <button onclick="transferLicense('${school.id}')" class="btn btn-warning btn-sm">
                        🔄 Transferir
                    </button>
                    ${user?.role === 'coordenadora' ? 
                        `<button onclick="changeLimit('${school.id}')" class="btn btn-primary btn-sm">
                            📊 Alterar Limite
                        </button>` : ''
                    }
                </div>
            `;
            
            return Card.render({
                title: school.name,
                subtitle: `ID: ${school.id} • ${school.cluster}`,
                content: `
                    <div class="mb-4">${badge}</div>
                    <div class="text-sm text-gray space-y-1">
                        <div><strong>Status:</strong> ${school.status}</div>
                        <div><strong>Localização:</strong> ${school.city}/${school.state}</div>
                        <div><strong>Região:</strong> ${school.region}</div>
                        <div><strong>SAF:</strong> ${school.carteira_saf}</div>
                        ${school.contact.phone ? `<div><strong>Telefone:</strong> ${school.contact.phone}</div>` : ''}
                    </div>
                `,
                footer: actions
            });
        }).join('');
        
        schoolsSection.innerHTML = `
            <div class="grid grid-cols-3 gap-6">
                ${schoolCards}
            </div>
        `;
    }
    
    private logout() {
        this.authService.logout();
    }
    
    private clearFilters() {
        this.store.clearFilters();
        
        // Reset form fields
        const searchFilter = document.getElementById('search-filter') as HTMLInputElement;
        const clusterFilter = document.getElementById('cluster-filter') as HTMLSelectElement;
        const statusFilter = document.getElementById('status-filter') as HTMLSelectElement;
        
        if (searchFilter) searchFilter.value = '';
        if (clusterFilter) clusterFilter.value = '';
        if (statusFilter) statusFilter.value = '';
    }
    
    private async reloadData() {
        try {
            const user = this.authService.getCurrentUser();
            if (!user || user.role !== 'coordenadora') return;
            
            const confirmed = await Modal.confirm(
                'Recarregar Dados',
                'Isso irá reprocessar os arquivos CSV do Blob Storage. Continuar?'
            );
            
            if (!confirmed) return;
            
            Toast.info('Recarregando dados...', 'Aguarde alguns segundos');
            
            await this.apiService.reloadData();
            await this.loadData();
            
            Toast.success('Dados recarregados!', 'Informações atualizadas com sucesso');
            
        } catch (error) {
            console.error('Erro ao recarregar dados:', error);
            Toast.error('Erro ao recarregar', 'Tente novamente em alguns segundos');
        }
    }
    
    private async viewSchoolUsers(schoolId: string) {
        try {
            const school = this.store.getSchoolById(schoolId);
            if (!school) return;
            
            Toast.info('Carregando usuários...', '');
            
            const users = await this.apiService.getSchoolUsers(schoolId);
            this.store.setSchoolUsers(schoolId, users);
            
            const usersList = users.length > 0 ? 
                users.map(user => `
                    <div class="flex justify-between items-center py-2 border-b border-gray-200">
                        <div>
                            <div class="font-medium">${user.name || 'Nome não informado'}</div>
                            <div class="text-sm text-gray">${user.email}</div>
                            <div class="text-xs text-gray">
                                ${user.role} • ${user.is_compliant ? 'Email conforme' : 'Email não conforme'}
                            </div>
                        </div>
                        <div class="text-right">
                            <span class="badge badge-${user.has_canva ? 'green' : 'gray'}">
                                ${user.has_canva ? 'Com Licença' : 'Sem Licença'}
                            </span>
                            ${user.status_licenca ? `<div class="text-xs text-gray mt-1">Status: ${user.status_licenca}</div>` : ''}
                        </div>
                    </div>
                `).join('') :
                '<p class="text-center text-gray py-4">Nenhum usuário encontrado</p>';
            
            const compliantUsers = users.filter(u => u.is_compliant);
            const nonCompliantUsers = users.filter(u => !u.is_compliant);
            
            Modal.show(
                `Usuários - ${school.name}`,
                `
                    <div class="mb-4 p-3 bg-gray-50 rounded">
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div><strong>Total de usuários:</strong> ${users.length}</div>
                            <div><strong>Com licença Canva:</strong> ${users.filter(u => u.has_canva).length}</div>
                            <div><strong>Emails conformes:</strong> ${compliantUsers.length}</div>
                            <div><strong>Emails não conformes:</strong> ${nonCompliantUsers.length}</div>
                        </div>
                    </div>
                    <div class="max-h-96 overflow-y-auto">
                        ${usersList}
                    </div>
                `,
                { showCancel: false, confirmText: 'Fechar', size: 'lg' }
            );
            
        } catch (error) {
            console.error('Erro ao carregar usuários:', error);
            Toast.error('Erro ao carregar usuários', 'Tente novamente');
        }
    }
    
    private async assignLicense(schoolId: string) {
        const school = this.store.getSchoolById(schoolId);
        if (!school) return;
        
        if (school.used >= school.limit) {
            const confirmed = await Modal.confirm(
                'Limite Excedido',
                `Esta escola já tem ${school.used} licenças de um limite de ${school.limit}. Continuar mesmo assim?`
            );
            if (!confirmed) return;
        }
        
        const content = `
            <form id="assign-form">
                <div class="form-group">
                    <label for="user-email" class="form-label">Email do Usuário *</label>
                    <input type="email" id="user-email" name="userEmail" class="form-input" required 
                           placeholder="usuario@escola.com.br">
                </div>
                
                <div class="form-group">
                    <label for="motivo" class="form-label">Motivo *</label>
                    <textarea id="motivo" name="motivo" class="form-textarea" required 
                              placeholder="Descreva o motivo da atribuição da licença"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="ticket" class="form-label">Ticket *</label>
                    <input type="text" id="ticket" name="ticket" class="form-input" required 
                           placeholder="Número do ticket ou referência">
                </div>
            </form>
        `;
        
        Modal.show(
            `Atribuir Licença - ${school.name}`,
            content,
            {
                confirmText: 'Atribuir Licença',
                onConfirm: async () => {
                    await this.handleAssignLicense(schoolId);
                }
            }
        );
    }
    
    private async handleAssignLicense(schoolId: string) {
        const form = document.getElementById('assign-form') as HTMLFormElement;
        if (!form || !form.checkValidity()) {
            Toast.error('Dados inválidos', 'Preencha todos os campos obrigatórios');
            return;
        }
        
        const formData = new FormData(form);
        
        try {
            await this.apiService.assignLicense({
                schoolId,
                userEmail: formData.get('userEmail') as string,
                motivo: formData.get('motivo') as string,
                ticket: formData.get('ticket') as string
            });
            
            Toast.success('Licença atribuída!', 'A licença foi atribuída com sucesso');
            await this.loadData(); // Refresh data
            
        } catch (error) {
            console.error('Erro ao atribuir licença:', error);
            Toast.error('Erro ao atribuir licença', error instanceof Error ? error.message : 'Erro desconhecido');
        }
    }
    
    private async revokeLicense(schoolId: string) {
        const school = this.store.getSchoolById(schoolId);
        if (!school) return;
        
        if (school.used === 0) {
            Toast.warning('Sem licenças', 'Esta escola não possui licenças para revogar');
            return;
        }
        
        const content = `
            <form id="revoke-form">
                <div class="form-group">
                    <label for="user-email" class="form-label">Email do Usuário *</label>
                    <input type="email" id="user-email" name="userEmail" class="form-input" required 
                           placeholder="usuario@escola.com.br">
                </div>
                
                <div class="form-group">
                    <label for="motivo" class="form-label">Motivo *</label>
                    <textarea id="motivo" name="motivo" class="form-textarea" required 
                              placeholder="Descreva o motivo da revogação da licença"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="ticket" class="form-label">Ticket *</label>
                    <input type="text" id="ticket" name="ticket" class="form-input" required 
                           placeholder="Número do ticket ou referência">
                </div>
            </form>
        `;
        
        Modal.show(
            `Revogar Licença - ${school.name}`,
            content,
            {
                confirmText: 'Revogar Licença',
                onConfirm: async () => {
                    await this.handleRevokeLicense(schoolId);
                }
            }
        );
    }
    
    private async handleRevokeLicense(schoolId: string) {
        const form = document.getElementById('revoke-form') as HTMLFormElement;
        if (!form || !form.checkValidity()) {
            Toast.error('Dados inválidos', 'Preencha todos os campos obrigatórios');
            return;
        }
        
        const formData = new FormData(form);
        
        try {
            await this.apiService.revokeLicense({
                schoolId,
                userEmail: formData.get('userEmail') as string,
                motivo: formData.get('motivo') as string,
                ticket: formData.get('ticket') as string
            });
            
            Toast.success('Licença revogada!', 'A licença foi revogada com sucesso');
            await this.loadData(); // Refresh data
            
        } catch (error) {
            console.error('Erro ao revogar licença:', error);
            Toast.error('Erro ao revogar licença', error instanceof Error ? error.message : 'Erro desconhecido');
        }
    }
    
    private async transferLicense(schoolId: string) {
        const school = this.store.getSchoolById(schoolId);
        if (!school) return;
        
        if (school.used === 0) {
            Toast.warning('Sem licenças', 'Esta escola não possui licenças para transferir');
            return;
        }
        
        const content = `
            <form id="transfer-form">
                <div class="form-group">
                    <label for="from-email" class="form-label">De (Email atual) *</label>
                    <input type="email" id="from-email" name="fromEmail" class="form-input" required 
                           placeholder="usuario.atual@escola.com.br">
                </div>
                
                <div class="form-group">
                    <label for="to-email" class="form-label">Para (Email novo) *</label>
                    <input type="email" id="to-email" name="toEmail" class="form-input" required 
                           placeholder="usuario.novo@escola.com.br">
                </div>
                
                <div class="form-group">
                    <label for="motivo" class="form-label">Motivo *</label>
                    <textarea id="motivo" name="motivo" class="form-textarea" required 
                              placeholder="Descreva o motivo da transferência da licença"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="ticket" class="form-label">Ticket *</label>
                    <input type="text" id="ticket" name="ticket" class="form-input" required 
                           placeholder="Número do ticket ou referência">
                </div>
            </form>
        `;
        
        Modal.show(
            `Transferir Licença - ${school.name}`,
            content,
            {
                confirmText: 'Transferir Licença',
                onConfirm: async () => {
                    await this.handleTransferLicense(schoolId);
                }
            }
        );
    }
    
    private async handleTransferLicense(schoolId: string) {
        const form = document.getElementById('transfer-form') as HTMLFormElement;
        if (!form || !form.checkValidity()) {
            Toast.error('Dados inválidos', 'Preencha todos os campos obrigatórios');
            return;
        }
        
        const formData = new FormData(form);
        const fromEmail = formData.get('fromEmail') as string;
        const toEmail = formData.get('toEmail') as string;
        
        if (fromEmail === toEmail) {
            Toast.error('Emails iguais', 'Os emails de origem e destino devem ser diferentes');
            return;
        }
        
        try {
            await this.apiService.transferLicense({
                schoolId,
                fromEmail,
                toEmail,
                motivo: formData.get('motivo') as string,
                ticket: formData.get('ticket') as string
            });
            
            Toast.success('Licença transferida!', 'A licença foi transferida com sucesso');
            await this.loadData(); // Refresh data
            
        } catch (error) {
            console.error('Erro ao transferir licença:', error);
            Toast.error('Erro ao transferir licença', error instanceof Error ? error.message : 'Erro desconhecido');
        }
    }
    
    private async changeLimit(schoolId: string) {
        const user = this.authService.getCurrentUser();
        if (!user || user.role !== 'coordenadora') {
            Toast.error('Acesso negado', 'Apenas coordenadoras podem alterar limites');
            return;
        }
        
        const school = this.store.getSchoolById(schoolId);
        if (!school) return;
        
        const content = `
            <form id="limit-form">
                <div class="form-group">
                    <label for="new-limit" class="form-label">Novo Limite *</label>
                    <input type="number" id="new-limit" name="newLimit" class="form-input" required 
                           min="0" max="100" value="${school.limit}">
                    <small class="text-gray">Limite atual: ${school.limit} | Em uso: ${school.used}</small>
                </div>
                
                <div class="form-group">
                    <label for="motivo" class="form-label">Motivo *</label>
                    <textarea id="motivo" name="motivo" class="form-textarea" required 
                              placeholder="Descreva o motivo da alteração do limite"></textarea>
                </div>
                
                ${school.used > 0 && 'newLimit' ? 
                    '<div class="bg-warning-light p-3 rounded"><strong>Atenção:</strong> Se o novo limite for menor que o uso atual, a escola ficará em situação de excesso até regularizar.</div>' 
                    : ''
                }
            </form>
        `;
        
        Modal.show(
            `Alterar Limite - ${school.name}`,
            content,
            {
                confirmText: 'Alterar Limite',
                onConfirm: async () => {
                    await this.handleChangeLimit(schoolId);
                }
            }
        );
    }
    
    private async handleChangeLimit(schoolId: string) {
        const form = document.getElementById('limit-form') as HTMLFormElement;
        if (!form || !form.checkValidity()) {
            Toast.error('Dados inválidos', 'Preencha todos os campos obrigatórios');
            return;
        }
        
        const formData = new FormData(form);
        const newLimit = parseInt(formData.get('newLimit') as string);
        const motivo = formData.get('motivo') as string;
        
        if (newLimit < 0) {
            Toast.error('Limite inválido', 'O limite deve ser maior ou igual a zero');
            return;
        }
        
        try {
            await this.apiService.changeSchoolLimit(schoolId, newLimit, motivo);
            
            Toast.success('Limite alterado!', 'O limite da escola foi alterado com sucesso');
            await this.loadData(); // Refresh data
            
        } catch (error) {
            console.error('Erro ao alterar limite:', error);
            Toast.error('Erro ao alterar limite', error instanceof Error ? error.message : 'Erro desconhecido');
        }
    }
    
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        
        // Clean up global functions
        delete (window as any).logout;
        delete (window as any).clearFilters;
        delete (window as any).reloadData;
        delete (window as any).viewSchoolUsers;
        delete (window as any).assignLicense;
        delete (window as any).revokeLicense;
        delete (window as any).transferLicense;
        delete (window as any).changeLimit;
    }
}