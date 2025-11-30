import { getAgentDisplayName } from "@/data/teamMembers";
import { downloadCSV } from "@/lib/fileUtils";
import { fetchCsvWindows1252, fixEncoding, normalizeForMatch } from "@/lib/encoding";

export interface VoucherSchool {
  id: string;
  name: string;
  cluster: string;
  status: string;
  contractualCompliance: string;
  financialCompliance: string;
  lexUsage: string;
  slmSales: number;
  voucherEligible: boolean;
  reason: string;
  voucherEnabled: string;
  voucherQuantity: number;
  voucherCode: string;
  voucherSent: boolean;
  observations: string;
  safConsultant?: string;
}

export interface ExceptionVoucher {
  id: string;
  unit: string;
  financialResponsible: string;
  course: string;
  voucherPercent: number;
  code: string;
  cpf: string;
  createdBy: string;
  emailTitle: string;
  requestedBy: string;
  usageCount: number;
  voucherCode: string;
  expiryDate: string;
  requester: string;
  requestSource: "email" | "ticket";
  emailTitle2?: string;
  ticketNumber?: string;
  createdAt: string;
}

export interface VoucherJustification {
  id: string;
  schoolId: string;
  action: "add" | "edit" | "exception";
  justification: string;
  createdBy: string;
  createdAt: string;
  oldValue?: any;
  newValue?: any;
}

const SAF_CONSULTANTS = {
  ingrid: getAgentDisplayName("Ingrid") || "Ingrid Vania Mazzei de Oliveira",
  rafhael: getAgentDisplayName("Rafhael") || "Rafhael Nazeazeno Pereira",
  joao: getAgentDisplayName("Joao") || "Joao Felipe Gutierrez de Freitas",
  fallback: "SAF TEAM",
};

function assignSafConsultant(cluster: string, name: string): string {
  const cleanCluster = normalizeForMatch(cluster);
  const cleanName = normalizeForMatch(name);

  if (
    cleanName.includes("minas gerais") ||
    cleanName.includes("belo horizonte") ||
    cleanName.includes("mg") ||
    cleanName.includes("parana") ||
    cleanName.includes("curitiba") ||
    cleanName.includes("pr") ||
    cleanName.includes("santa catarina") ||
    cleanName.includes("florianopolis") ||
    cleanName.includes("sc") ||
    cleanName.includes("goias") ||
    cleanName.includes("goiania") ||
    cleanName.includes("go") ||
    cleanName.includes("marista") ||
    cleanName.includes("aguas claras") ||
    cleanName.includes("brasilia") ||
    cleanName.includes("manaus") ||
    cleanName.includes("df") ||
    cleanName.includes("amazonas") ||
    cleanName.includes("am") ||
    (cleanCluster === "alerta" &&
      (cleanName.includes("goiania") ||
        cleanName.includes("marista") ||
        cleanName.includes("aguas claras") ||
        cleanName.includes("brasilia") ||
        cleanName.includes("manaus")))
  ) {
    return SAF_CONSULTANTS.ingrid;
  }

  if (
    (cleanName.includes("sao paulo") && !cleanName.includes("capital")) ||
    cleanName.includes("campinas") ||
    cleanName.includes("ribeirao") ||
    cleanName.includes("piracicaba") ||
    cleanName.includes("sorocaba") ||
    cleanName.includes("limeira") ||
    cleanName.includes("rio branco")
  ) {
    return SAF_CONSULTANTS.rafhael;
  }

  if (
    cleanName.includes("capital") ||
    cleanName.includes("abc") ||
    (cleanName.includes("sao paulo") &&
      (cleanName.includes("vila") ||
        cleanName.includes("jardim") ||
        cleanName.includes("alto") ||
        cleanName.includes("pinheiros"))) ||
    cleanName.includes("rio de janeiro") ||
    cleanName.includes("rj")
  ) {
    return SAF_CONSULTANTS.joao;
  }

  return SAF_CONSULTANTS.fallback;
}

export function parseVouchersCSV(csvContent: string): VoucherSchool[] {
  const lines = csvContent.split("\n");

  return lines
    .slice(1)
    .filter((line) => line.trim())
    .map((line) => {
      const values = line.split(";");

      const rawName = values[1] || "";
      const rawCluster = values[2] || "";

      const fixedName = fixEncoding(rawName);
      const fixedCluster = fixEncoding(rawCluster);

      return {
        id: values[0] || "",
        name: fixedName,
        cluster: fixedCluster,
        status: fixEncoding(values[3] || ""),
        contractualCompliance: fixEncoding(values[4] || ""),
        financialCompliance: fixEncoding(values[5] || ""),
        lexUsage: fixEncoding(values[6] || ""),
        slmSales: parseInt(values[7]) || 0,
        voucherEligible: values[8]?.toLowerCase() === "sim",
        reason: fixEncoding(values[9] || ""),
        voucherEnabled: fixEncoding(values[10] || ""),
        voucherQuantity: parseInt(values[11]) || 0,
        voucherCode: values[12] || "",
        voucherSent: (values[13] || "").toLowerCase() === "sim",
        observations: fixEncoding(values[14] || ""),
        safConsultant: assignSafConsultant(fixedCluster, fixedName),
      };
    })
    .filter((school) => school.id && school.name);
}

export function parseExceptionVouchersCSV(csvContent: string): ExceptionVoucher[] {
  const lines = csvContent.split("\n");

  return lines
    .slice(1)
    .filter((line) => line.trim() && line.split(";")[0])
    .map((line) => {
      const values = line.split(";");
      const unit = values[0] || "";
      const code = values[4] || "";
      const cpf = values[5] || "";
      const createdAt = new Date().toISOString();
      const id = code || `${unit}-${cpf || "unknown"}-${createdAt}`;

      return {
        id,
        unit,
        financialResponsible: values[1] || "",
        course: values[2] || "",
        voucherPercent: parseFloat(values[3]) || 0,
        code,
        cpf,
        createdBy: values[6] || "",
        emailTitle: values[7] || "",
        requestedBy: values[8] || "",
        usageCount: parseInt(values[9]) || 0,
        voucherCode: code,
        expiryDate: "",
        requester: values[8] || "",
        requestSource: "email" as "email" | "ticket",
        createdAt: new Date().toISOString(),
      };
    });
}

export function getVoucherStats(schools: VoucherSchool[], exceptions: ExceptionVoucher[]) {
  const totalSchools = schools.length;
  const eligibleSchools = schools.filter((s) => s.voucherEligible).length;
  const totalVouchers = schools.reduce((sum, school) => sum + school.voucherQuantity, 0);
  const sentVouchers = schools.filter((s) => s.voucherSent).length;
  const exceptionVouchers = exceptions.length;

  const clusterStats = schools.reduce((acc, school) => {
    if (!acc[school.cluster]) {
      acc[school.cluster] = { total: 0, eligible: 0, vouchers: 0 };
    }
    acc[school.cluster].total++;
    if (school.voucherEligible) acc[school.cluster].eligible++;
    acc[school.cluster].vouchers += school.voucherQuantity;
    return acc;
  }, {} as Record<string, { total: number; eligible: number; vouchers: number }>);

  return {
    totalSchools,
    eligibleSchools,
    totalVouchers,
    sentVouchers,
    exceptionVouchers,
    clusterStats,
    eligibilityRate: totalSchools ? Math.round((eligibleSchools / totalSchools) * 10000) / 100 : 0,
    deliveryRate: totalSchools ? Math.round((sentVouchers / totalSchools) * 10000) / 100 : 0,
  };
}

export function filterSchools(
  schools: VoucherSchool[],
  filters: {
    search?: string;
    cluster?: string;
    status?: string;
    voucherEligible?: boolean;
    voucherSent?: boolean;
    safConsultant?: string;
  }
) {
  return schools.filter((school) => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchMatch =
        school.name.toLowerCase().includes(searchTerm) ||
        school.id.includes(searchTerm) ||
        (school.voucherCode && school.voucherCode.toLowerCase().includes(searchTerm));

      if (!searchMatch) return false;
    }

    if (filters.cluster && school.cluster !== filters.cluster) return false;

    if (filters.status && school.status !== filters.status) return false;

    if (filters.voucherEligible !== undefined && school.voucherEligible !== filters.voucherEligible) return false;

    if (filters.voucherSent !== undefined && school.voucherSent !== filters.voucherSent) return false;

    if (filters.safConsultant && school.safConsultant !== filters.safConsultant) return false;

    return true;
  });
}

export function searchVoucherByCode(
  searchTerm: string,
  schools: VoucherSchool[],
  exceptions: ExceptionVoucher[]
) {
  const term = searchTerm.toLowerCase();
  const foundSchool = schools.find((s) => s.voucherCode.toLowerCase() === term);
  if (foundSchool) return { found: true, school: foundSchool };

  const foundException = exceptions.find((e) => e.code.toLowerCase() === term);
  if (foundException) return { found: true, exception: foundException };

  return { found: false };
}

export async function loadVoucherData(): Promise<{
  schools: VoucherSchool[];
  exceptions: ExceptionVoucher[];
}> {
  try {
    const [schoolsCsv, exceptionsCsv] = await Promise.all([
      fetchCsvWindows1252("/data/vouchers_2026.csv"),
      fetchCsvWindows1252("/data/voucher_campanha2026_excecoes.csv"),
    ]);

    const schools = parseVouchersCSV(schoolsCsv);
    const exceptions = parseExceptionVouchersCSV(exceptionsCsv);

    return { schools, exceptions };
  } catch (error) {
    console.error("Erro ao carregar dados dos vouchers:", error);
    return { schools: [], exceptions: [] };
  }
}

export function exportVoucherReport(schools: VoucherSchool[]) {
  const headers = [
    "ID",
    "Nome",
    "Cluster",
    "Elegivel",
    "Qtd Vouchers",
    "Codigo",
    "Enviado",
    "Vendas SLM",
    "Observacoes",
    "Consultor SAF",
  ];

  const rows = schools.map((s) => [
    `${s.id}`,
    s.name,
    s.cluster,
    s.voucherEligible ? "Sim" : "Nao",
    s.voucherQuantity.toString(),
    s.voucherCode,
    s.voucherSent ? "Sim" : "Nao",
    s.slmSales.toString(),
    (s.observations || "").replace(/\r?\n/g, " ").trim(),
    s.safConsultant || "",
  ]);

  const filename = `relatorio_vouchers_${new Date().toISOString().split("T")[0]}`;
  downloadCSV([headers, ...rows], filename, ";");
}
