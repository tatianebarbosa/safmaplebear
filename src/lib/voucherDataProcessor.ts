import { getAgentDisplayName } from "@/data/teamMembers";
import { downloadCSV } from "@/lib/fileUtils";
import { fetchCsvSmart, fixEncoding, normalizeForMatch } from "@/lib/encoding";

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

export interface VoucherInstallment {
  employeeName: string;
  employeeCpf: string;
  school: string;
  childName: string;
  series: string;
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

export function parseVoucherInstallments(csvContent: string): VoucherInstallment[] {
  const rows = csvContent
    .split("\n")
    .map((line) => line.split(";"))
    .filter((row) => row.length > 1);

  const dataRows = rows.slice(1);
  const installments: VoucherInstallment[] = [];

  dataRows.forEach((row) => {
    if (!row || row.length === 0) return;

    const employeeName = fixEncoding((row[0] ?? "").toString().trim());
    const employeeCpf = fixEncoding((row[1] ?? "").toString().trim());
    const school = fixEncoding((row[2] ?? "").toString().trim());

    for (let i = 3; i < row.length; i += 2) {
      const childName = fixEncoding((row[i] ?? "").toString().trim());
      const series = fixEncoding((row[i + 1] ?? "").toString().trim());
      if (!childName && !series) continue;
      installments.push({
        employeeName,
        employeeCpf,
        school,
        childName,
        series,
      });
    }
  });

  return installments;
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

type CampaignYear = string | number;

const customCampaignFiles: Record<
  CampaignYear,
  { vouchers: string[]; exceptions: string[]; installments?: string[] }
> = {
  piloto_welcome: {
    vouchers: [
      "/data/campanha_piloto_welcome_b.b.csv",
      "/data/campanha_piloto_welcome.csv",
    ],
    exceptions: [
      "/data/excecoes_2025.csv",
      "/data/excecoes_2026.csv",
    ],
  },
};

const voucherFileCandidates = (year: CampaignYear) =>
  customCampaignFiles[year]?.vouchers || [
    `/data/vouchers_${year}.csv`,
    `/data/voucher_${year}.csv`,
    `/data/vouchers${year}.csv`,
  ];

const exceptionFileCandidates = (year: CampaignYear) =>
  customCampaignFiles[year]?.exceptions || [
    `/data/voucher_campanha${year}_excecoes.csv`,
    `/data/excecoes_${year}.csv`,
    `/data/excecoes${year}.csv`,
  ];

const installmentFileCandidates = (year: CampaignYear) =>
  customCampaignFiles[year]?.installments || [
    `/data/voucher_campanha${year}_parcelamento_func.csv`,
    `/data/parcelamento_${year}.csv`,
  ];

async function fetchFirstAvailable(paths: string[]) {
  let lastError: unknown = null;
  for (const path of paths) {
    try {
      return await fetchCsvSmart(path);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error("Nenhum arquivo encontrado");
}

export async function loadVoucherData(
  campaignYear: CampaignYear = "2026"
): Promise<{
  schools: VoucherSchool[];
  exceptions: ExceptionVoucher[];
  installments: VoucherInstallment[];
}> {
  try {
    const [schoolsCsv, exceptionsCsv] = await Promise.all([
      fetchFirstAvailable(voucherFileCandidates(campaignYear)),
      fetchFirstAvailable(exceptionFileCandidates(campaignYear)),
    ]);

    const schools = parseVouchersCSV(schoolsCsv);
    const exceptions = parseExceptionVouchersCSV(exceptionsCsv);

    let installments: VoucherInstallment[] = [];
    try {
      const installmentsCsv = await fetchFirstAvailable(installmentFileCandidates(campaignYear));
      installments = parseVoucherInstallments(installmentsCsv);
    } catch {
      installments = [];
    }

    return { schools, exceptions, installments };
  } catch (error) {
    console.error("Erro ao carregar dados dos vouchers:", error);
    return { schools: [], exceptions: [], installments: [] };
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
    s.voucherEligible ? "Sim" : "N?o",
    s.voucherQuantity.toString(),
    s.voucherCode,
    s.voucherSent ? "Sim" : "N?o",
    s.slmSales.toString(),
    (s.observations || "").replace(/\r?\n/g, " ").trim(),
    s.safConsultant || "",
  ]);

  const filename = `relatorio_vouchers_${new Date().toISOString().split("T")[0]}`;
  downloadCSV([headers, ...rows], filename, ";");
}
