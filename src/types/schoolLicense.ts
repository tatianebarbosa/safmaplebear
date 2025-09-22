export type SchoolStatus = 'Ativa' | 'Implantando' | 'Pausa';
export type UserRole = 'Estudante' | 'Professor' | 'Administrador';
export type LicenseStatus = 'Disponível' | 'Completo' | 'Excedido';
export type ClusterType = 'Implantação' | 'Alta Performance' | 'Potente' | 'Desenvolvimento' | 'Alerta' | 'Outros/Implantação';

export interface SchoolUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isCompliant: boolean;
  createdAt: string;
}

export interface School {
  id: string;
  name: string;
  status: SchoolStatus;
  city?: string;
  cluster: ClusterType;
  totalLicenses: number;
  usedLicenses: number;
  users: SchoolUser[];
  hasRecentJustifications: boolean;
}

export interface Justification {
  id: string;
  schoolId: string;
  schoolName: string;
  oldUser: {
    name: string;
    email: string;
    role: UserRole;
  };
  newUser: {
    name: string;
    email: string;
    role: UserRole;
  };
  reason: string;
  attachment?: {
    name: string;
    data: string; // base64
    type: string;
  };
  timestamp: string;
  performedBy: string;
}

export interface CanvaUsageData {
  schoolId: string;
  schoolName: string;
  designsCreated: number;
  designsPublished: number;
  designsShared: number;
  designsViewed: number;
  topCreators: Array<{
    name: string;
    email: string;
    designs: number;
  }>;
}

export interface UsageFilters {
  period: '7d' | '30d' | '90d';
  cluster?: string;
  school?: string;
}