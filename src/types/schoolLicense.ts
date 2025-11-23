export type SchoolStatus = 'Ativa' | 'Implantando' | 'Inativa';
export type UserRole = 'Estudante' | 'Professor' | 'Administrador';
export type LicenseStatus = 'Dispon\u00edvel' | 'Completo' | 'Excedido';
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
  contactEmail?: string;
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
  timestamp: string;
  performedBy: string;
}

export type UsagePeriod = '30d' | '3m' | '6m' | '12m';

export interface CanvaUsageData {
  schoolId: string;
  schoolName: string;
  cluster?: string;
  designsCreated: number;
  designsPublished: number;
  designsShared: number;
  designsViewed: number;
  topCreators: Array<{
    name: string;
    email: string;
    designs: number;
    schoolName?: string;
    schoolId?: string;
    cluster?: string;
  }>;
}

export interface UsageFilters {
  period: UsagePeriod;
  cluster?: string;
  school?: string;
}

export type HistoryAction = 'GRANT_LICENSE' | 'TRANSFER_LICENSE' | 'REMOVE_USER' | 'UPDATE_USER' | 'ADD_USER';


export type HistoryChangeSet =
  | { type: 'GRANT_LICENSE'; user: SchoolUser }
  | { type: 'REMOVE_USER'; user: SchoolUser }
  | { type: 'UPDATE_USER'; before: SchoolUser; after: SchoolUser }
  | {
      type: 'TRANSFER_LICENSE';
      sourceSchool: { id: string; name: string; beforeUser: SchoolUser; afterUser: SchoolUser };
      targetSchool?: { id: string; name: string; beforeUser: SchoolUser; afterUser: SchoolUser };
    }
  | { type: 'ADD_USER'; user: SchoolUser };

export interface HistoryEntry {
  id: string;
  schoolId: string;
  schoolName: string;
  action: HistoryAction;
  details: string; // Descricao detalhada da acao
  performedBy: string; // Quem realizou a acao
  timestamp: string;
  changeSet?: HistoryChangeSet;
  reverted?: boolean;
  revertReason?: string;
  revertedBy?: string;
  revertTimestamp?: string;
}
