// API service for communicating with Azure Functions
export interface School {
    id: string;
    name: string;
    cluster: string;
    status: string;
    used: number;
    limit: number;
    badge: {
        tone: 'gray' | 'blue' | 'green' | 'red';
        text: string;
    };
}

export interface SchoolUser {
    name: string;
    email: string;
    role: string;
    has_canva: boolean;
}

export interface AuditEntry {
    ts: string;
    action: string;
    school_id: string;
    school_name?: string;
    actor: string;
    payload: any;
}

export interface ActionRequest {
    schoolId: string;
    userEmail?: string;
    fromEmail?: string;
    toEmail?: string;
    motivo: string;
    ticket: string;
    newLimit?: number;
}

export class ApiService {
    private baseUrl = '/api';
    private authToken: string | null = null;
    
    setAuthToken(token: string | null) {
        this.authToken = token;
    }
    
    private async request<T>(
        endpoint: string, 
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers
        };
        
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        
        const response = await fetch(url, {
            ...options,
            headers
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response.json();
    }
    
    // Schools API
    async getSchools(): Promise<School[]> {
        return this.request<School[]>('/schools');
    }
    
    async getSchoolUsers(schoolId: string): Promise<SchoolUser[]> {
        return this.request<SchoolUser[]>(`/schools/${schoolId}/users`);
    }
    
    // License Management API
    async assignLicense(request: ActionRequest): Promise<{ success: boolean, message: string }> {
        return this.request('/licenses/assign', {
            method: 'POST',
            body: JSON.stringify(request)
        });
    }
    
    async revokeLicense(request: ActionRequest): Promise<{ success: boolean, message: string }> {
        return this.request('/licenses/revoke', {
            method: 'POST',
            body: JSON.stringify(request)
        });
    }
    
    async transferLicense(request: ActionRequest): Promise<{ success: boolean, message: string }> {
        return this.request('/licenses/transfer', {
            method: 'POST',
            body: JSON.stringify(request)
        });
    }
    
    // School Management API
    async changeSchoolLimit(schoolId: string, newLimit: number, motivo: string): Promise<{ success: boolean, message: string }> {
        return this.request(`/schools/${schoolId}/limit`, {
            method: 'POST',
            body: JSON.stringify({ newLimit, motivo })
        });
    }
    
    // Audit API
    async getAuditLog(filters: {
        start?: string;
        end?: string;
        schoolId?: string;
        action?: string;
        actor?: string;
    } = {}): Promise<AuditEntry[]> {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        
        const queryString = params.toString();
        const endpoint = `/audit${queryString ? `?${queryString}` : ''}`;
        
        return this.request<AuditEntry[]>(endpoint);
    }
    
    async exportAuditCsv(filters: {
        start?: string;
        end?: string;
        schoolId?: string;
        action?: string;
        actor?: string;
    } = {}): Promise<Blob> {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value) params.append(key, value);
        });
        params.append('export', 'csv');
        
        const queryString = params.toString();
        const endpoint = `/audit${queryString ? `?${queryString}` : ''}`;
        
        const url = `${this.baseUrl}${endpoint}`;
        const headers: HeadersInit = {};
        
        if (this.authToken) {
            headers['Authorization'] = `Bearer ${this.authToken}`;
        }
        
        const response = await fetch(url, { headers });
        
        if (!response.ok) {
            throw new Error(`Erro ao exportar: ${response.statusText}`);
        }
        
        return response.blob();
    }
    
    // Admin API
    async reloadData(): Promise<{ success: boolean, message: string }> {
        return this.request('/admin/reload-data', {
            method: 'POST'
        });
    }
    
    // Utility methods
    downloadFile(blob: Blob, filename: string) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
    
    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleString('pt-BR');
    }
    
    formatAction(action: string): string {
        const actions: Record<string, string> = {
            'assign': 'Atribuir Licença',
            'revoke': 'Revogar Licença',
            'transfer': 'Transferir Licença',
            'alter_limit': 'Alterar Limite',
            'reload_data': 'Recarregar Dados'
        };
        
        return actions[action] || action;
    }
}