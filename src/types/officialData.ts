export interface OfficialSchool {
  id: string;
  name: string;
  status: 'Ativa' | 'Implantando' | 'Pausa';
  cluster: string;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  region?: string;
  phone?: string;
  email?: string;
  safManager?: string;
}

export interface OfficialUser {
  id: string;
  name: string;
  email: string;
  role: 'Estudante' | 'Professor' | 'Administrador';
  school?: string;
  schoolId?: string;
  licenseStatus?: string;
  updatedAt?: string;
  isCompliant: boolean;
}

export interface ProcessedSchoolData {
  school: OfficialSchool;
  users: OfficialUser[];
  totalUsers: number;
  compliantUsers: number;
  nonCompliantUsers: number;
  estimatedLicenses: number;
  licenseStatus: 'Disponível' | 'Completo' | 'Excedido';
}

export interface CanvaOverviewData {
  totalUsers: number;
  totalSchools: number;
  compliantUsers: number;
  nonCompliantUsers: number;
  complianceRate: number;
  nonMapleBearDomains: number;
  topNonCompliantDomains: Array<{
    domain: string;
    count: number;
  }>;
  schoolsWithUsers: number;
  schoolsAtCapacity: number;
}