// Application state management
import type { School, SchoolUser, AuditEntry } from './api.js';

export interface AppState {
    schools: School[];
    selectedSchool: School | null;
    schoolUsers: Record<string, SchoolUser[]>;
    auditLog: AuditEntry[];
    loading: boolean;
    filters: {
        search: string;
        cluster: string;
        status: string;
    };
    auditFilters: {
        start: string;
        end: string;
        schoolId: string;
        action: string;
        actor: string;
    };
}

type StateChangeListener = (state: AppState) => void;

export class Store {
    private state: AppState = {
        schools: [],
        selectedSchool: null,
        schoolUsers: {},
        auditLog: [],
        loading: false,
        filters: {
            search: '',
            cluster: '',
            status: ''
        },
        auditFilters: {
            start: '',
            end: '',
            schoolId: '',
            action: '',
            actor: ''
        }
    };
    
    private listeners: StateChangeListener[] = [];
    
    // State getters
    getState(): AppState {
        return { ...this.state };
    }
    
    getSchools(): School[] {
        return this.state.schools;
    }
    
    getFilteredSchools(): School[] {
        const { search, cluster, status } = this.state.filters;
        
        return this.state.schools.filter(school => {
            // Search filter (name or ID)
            if (search && !school.name.toLowerCase().includes(search.toLowerCase()) && 
                !school.id.toLowerCase().includes(search.toLowerCase())) {
                return false;
            }
            
            // Cluster filter
            if (cluster && school.cluster !== cluster) {
                return false;
            }
            
            // Status filter based on license usage
            if (status) {
                const licenseStatus = this.getLicenseStatus(school);
                if (status !== licenseStatus) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    getSelectedSchool(): School | null {
        return this.state.selectedSchool;
    }
    
    getSchoolUsers(schoolId: string): SchoolUser[] {
        return this.state.schoolUsers[schoolId] || [];
    }
    
    getAuditLog(): AuditEntry[] {
        return this.state.auditLog;
    }
    
    getFilters() {
        return { ...this.state.filters };
    }
    
    getAuditFilters() {
        return { ...this.state.auditFilters };
    }
    
    isLoading(): boolean {
        return this.state.loading;
    }
    
    // State setters
    setSchools(schools: School[]) {
        this.setState({ schools });
    }
    
    setSelectedSchool(school: School | null) {
        this.setState({ selectedSchool: school });
    }
    
    setSchoolUsers(schoolId: string, users: SchoolUser[]) {
        this.setState({
            schoolUsers: {
                ...this.state.schoolUsers,
                [schoolId]: users
            }
        });
    }
    
    setAuditLog(auditLog: AuditEntry[]) {
        this.setState({ auditLog });
    }
    
    setLoading(loading: boolean) {
        this.setState({ loading });
    }
    
    setFilters(filters: Partial<typeof this.state.filters>) {
        this.setState({
            filters: {
                ...this.state.filters,
                ...filters
            }
        });
    }
    
    setAuditFilters(filters: Partial<typeof this.state.auditFilters>) {
        this.setState({
            auditFilters: {
                ...this.state.auditFilters,
                ...filters
            }
        });
    }
    
    clearFilters() {
        this.setState({
            filters: {
                search: '',
                cluster: '',
                status: ''
            }
        });
    }
    
    clearAuditFilters() {
        this.setState({
            auditFilters: {
                start: '',
                end: '',
                schoolId: '',
                action: '',
                actor: ''
            }
        });
    }
    
    // Utility methods
    updateSchool(updatedSchool: School) {
        const schools = this.state.schools.map(school => 
            school.id === updatedSchool.id ? updatedSchool : school
        );
        this.setState({ schools });
        
        // Update selected school if it's the same one
        if (this.state.selectedSchool?.id === updatedSchool.id) {
            this.setState({ selectedSchool: updatedSchool });
        }
    }
    
    addAuditEntry(entry: AuditEntry) {
        this.setState({
            auditLog: [entry, ...this.state.auditLog]
        });
    }
    
    getLicenseStatus(school: School): string {
        if (school.used === 0) return 'Sem';
        if (school.used < school.limit) return 'Parcial';
        if (school.used === school.limit) return 'Completa';
        return 'Excesso';
    }
    
    getClusters(): string[] {
        const clusters = new Set(this.state.schools.map(s => s.cluster));
        return Array.from(clusters).sort();
    }
    
    getSchoolById(id: string): School | undefined {
        return this.state.schools.find(s => s.id === id);
    }
    
    getStats() {
        const schools = this.state.schools;
        const totalSchools = schools.length;
        const totalLicenses = schools.reduce((sum, s) => sum + s.limit, 0);
        const usedLicenses = schools.reduce((sum, s) => sum + s.used, 0);
        const availableLicenses = totalLicenses - usedLicenses;
        
        const statusCount = {
            'Sem': schools.filter(s => this.getLicenseStatus(s) === 'Sem').length,
            'Parcial': schools.filter(s => this.getLicenseStatus(s) === 'Parcial').length,
            'Completa': schools.filter(s => this.getLicenseStatus(s) === 'Completa').length,
            'Excesso': schools.filter(s => this.getLicenseStatus(s) === 'Excesso').length
        };
        
        return {
            totalSchools,
            totalLicenses,
            usedLicenses,
            availableLicenses,
            utilizationRate: totalLicenses > 0 ? (usedLicenses / totalLicenses * 100).toFixed(1) : '0',
            statusCount
        };
    }
    
    // Event handling
    subscribe(listener: StateChangeListener) {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }
    
    private setState(newState: Partial<AppState>) {
        this.state = { ...this.state, ...newState };
        this.notifyListeners();
    }
    
    private notifyListeners() {
        this.listeners.forEach(listener => {
            try {
                listener(this.getState());
            } catch (error) {
                console.error('Erro no listener do store:', error);
            }
        });
    }
}