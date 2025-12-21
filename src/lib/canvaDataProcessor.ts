import { getMaxLicensesPerSchool } from '@/config/licenseLimits';
import { isEmailCompliant } from '@/lib/safDataService';
import { apiPost, apiGet } from './apiClient';

// ... (interfaces CanvaUser, SchoolCanvaData, CanvaAnalytics, UserRanking, LicenseAction)

// Funções de parsing e processamento de dados (parseCanvaReportCSV, parseUsersCSV, etc.)

// License action history management

// Função auxiliar para normalizar o AuditLog do backend para o formato LicenseAction do frontend
const normalizeAuditLogToLicenseAction = (log: any): LicenseAction => {
  return {
    id: String(log.id),
    schoolId: String(log.school_id),
    schoolName: log.payload?.school_name || 'Desconhecida',
    action: log.action as any,
    userId: log.payload?.user_id,
    userName: log.payload?.user_name,
    userEmail: log.payload?.user_email,
    targetSchoolId: log.payload?.target_school_id,
    targetSchoolName: log.payload?.target_school_name,
    justification: log.payload?.motivo || log.payload?.reason || 'Sem justificativa',
    timestamp: log.timestamp,
    performedBy: log.actor,
  };
};

export const saveLicenseAction = async (action: LicenseAction): Promise<void> => {
  try {
    const auditPayload = {
      action: action.action,
      school_id: action.schoolId,
      actor: action.performedBy,
      payload: {
        user_email: action.userEmail,
        motivo: action.justification,
        timestamp: action.timestamp,
        ...action,
      },
    };
    await apiPost("/api/audit_log", auditPayload);
  } catch (error) {
    console.error("Falha ao salvar ação de licença na API:", error);
  }
};

export const getLicenseHistory = async (): Promise<LicenseAction[]> => {
  try {
    const response = await apiGet("/api/audit_log");
    if (Array.isArray(response)) {
      return response.map(normalizeAuditLogToLicenseAction);
    }
    return [];
  } catch (error) {
    console.error("Falha ao buscar histórico de licenças na API:", error);
    return [];
  }
};

export const filterLicenseHistory = (filters: {
  schoolId?: string;
  action?: string;
  dateRange?: { start: Date; end: Date };
}): LicenseAction[] => {
  return [];
};
