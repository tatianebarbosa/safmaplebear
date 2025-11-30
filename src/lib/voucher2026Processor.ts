import Papa from "papaparse";
import { getAgentDisplayName } from "@/data/teamMembers";
import { fetchCsvWindows1252, fixEncoding, normalizeForMatch } from "@/lib/encoding";

export interface Voucher2026 {
  id: string;
  name: string;
  cluster: string;
  status: string;
  contractualCompliance: string;
  financialCompliance: string;
  lexIntegration: string;
  slmSales2025: number;
  voucherEligible: boolean;
  reason: string;
  voucherEnabled: string;
  voucherQuantity: number;
  voucherCode: string;
  voucherSent: boolean;
  observations: string;
  safConsultant: string;
}

export interface Voucher2026Exception {
  unit: string;
  financialResponsible: string;
  course: string;
  voucherPercent: number | string;
  code: string;
  cpf: string;
  createdBy: string;
  emailTitle: string;
  requestedBy: string;
  usageCount: number;
}

export interface Voucher2026Installment {
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
    (cleanCluster === "alerta" && (cleanName.includes("goiania") || cleanName.includes("marista")))
  ) {
    return SAF_CONSULTANTS.ingrid;
  }

  if (
    (cleanName.includes("sao paulo") && !cleanName.includes("capital")) ||
    cleanName.includes("campinas") ||
    cleanName.includes("ribeirao") ||
    cleanName.includes("piracicaba") ||
    cleanName.includes("sorocaba")
  ) {
    return SAF_CONSULTANTS.rafhael;
  }

  if (
    cleanName.includes("capital") ||
    cleanName.includes("abc") ||
    (cleanName.includes("sao paulo") && (cleanName.includes("vila") || cleanName.includes("jardim")))
  ) {
    return SAF_CONSULTANTS.joao;
  }

  return SAF_CONSULTANTS.fallback;
}

export function parseVouchers2026CSV(csvContent: string): Voucher2026[] {
  const parsed = Papa.parse<string[]>(csvContent, {
    delimiter: ";",
    skipEmptyLines: true,
  });

  const rows = (parsed.data || []) as unknown as string[][];
  const dataRows = rows.slice(1);

  return dataRows
    .map((row, index) => {
      try {
        if (!row || row.length === 0) return null;

        const getValue = (idx: number) => fixEncoding((row[idx] ?? "").toString().trim());

        const id = getValue(0);
        const name = getValue(1);
        const cluster = getValue(2);
        const status = getValue(3);
        const contractualCompliance = getValue(4);
        const financialCompliance = getValue(5);
        const lexIntegration = getValue(6);
        const slmSales2025 = parseInt((row[7] ?? "0").toString(), 10) || 0;
        const voucherEligible = (row[8] ?? "").toString().trim().toLowerCase() === "sim";
        const reason = getValue(9);
        const voucherEnabled = getValue(10);
        const voucherQuantity = parseInt((row[11] ?? "0").toString(), 10) || 0;
        const voucherCode = getValue(12);
        const voucherSent = (row[13] ?? "").toString().trim().toLowerCase() === "sim";
        const observations = getValue(14);

        if (!id && !name) return null;

        const safConsultant = assignSafConsultant(cluster, name);

        return {
          id,
          name,
          cluster,
          status,
          contractualCompliance,
          financialCompliance,
          lexIntegration,
          slmSales2025,
          voucherEligible,
          reason: reason || "",
          voucherEnabled,
          voucherQuantity,
          voucherCode: voucherCode || "",
          voucherSent,
          observations: observations || "",
          safConsultant,
        };
      } catch (error) {
        console.error(`Erro ao processar linha ${index + 2}:`, error);
        return null;
      }
    })
    .filter((voucher): voucher is Voucher2026 => voucher !== null && voucher.id !== "");
}

export function parseVouchers2026Exceptions(csvContent: string): Voucher2026Exception[] {
  const parsed = Papa.parse<string[]>(csvContent, {
    delimiter: ";",
    skipEmptyLines: true,
  });

  const rows = (parsed.data || []) as unknown as string[][];
  const dataRows = rows.slice(1);

  return dataRows
    .map((row) => {
      if (!row || row.length === 0) return null;
      const getValue = (idx: number) => fixEncoding((row[idx] ?? "").toString().trim());

      const unit = getValue(0);
      const financialResponsible = getValue(1);
      const course = getValue(2);
      const voucherPercent = getValue(3);
      const code = getValue(4);
      const cpf = getValue(5);
      const createdBy = getValue(6);
      const emailTitle = getValue(7);
      const requestedBy = getValue(8);
      const usageCount = parseInt((row[9] ?? "0").toString(), 10) || 0;

      if (!unit && !code) return null;

      return {
        unit,
        financialResponsible,
        course,
        voucherPercent,
        code,
        cpf,
        createdBy,
        emailTitle,
        requestedBy,
        usageCount,
      } as Voucher2026Exception;
    })
    .filter((v): v is Voucher2026Exception => v !== null);
}

export function parseVouchers2026Installments(csvContent: string): Voucher2026Installment[] {
  const parsed = Papa.parse<string[]>(csvContent, {
    delimiter: ";",
    skipEmptyLines: true,
  });

  const rows = (parsed.data || []) as unknown as string[][];
  const dataRows = rows.slice(1);

  const installments: Voucher2026Installment[] = [];

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

export function getVoucher2026Stats(vouchers: Voucher2026[]) {
  const totalSchools = vouchers.length;
  const eligibleSchools = vouchers.filter((s) => s.voucherEligible).length;
  const totalVouchers = vouchers.reduce((sum, school) => sum + school.voucherQuantity, 0);
  const sentVouchers = vouchers.filter((s) => s.voucherSent).length;

  return {
    totalSchools,
    eligibleSchools,
    totalVouchers,
    sentVouchers,
    eligibilityRate: totalSchools ? Math.round((eligibleSchools / totalSchools) * 10000) / 100 : 0,
    deliveryRate: totalSchools ? Math.round((sentVouchers / totalSchools) * 10000) / 100 : 0,
  };
}

export function filterVouchers2026(
  vouchers: Voucher2026[],
  filters: {
    search?: string;
    cluster?: string;
    status?: string;
    voucherEligible?: boolean;
    voucherSent?: boolean;
    safConsultant?: string;
  }
): Voucher2026[] {
  return vouchers.filter((voucher) => {
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const searchMatch =
        voucher.name.toLowerCase().includes(searchTerm) ||
        voucher.id.includes(searchTerm) ||
        (voucher.voucherCode && voucher.voucherCode.toLowerCase().includes(searchTerm));
      if (!searchMatch) return false;
    }

    if (filters.cluster && voucher.cluster !== filters.cluster) {
      return false;
    }

    if (filters.status && voucher.status !== filters.status) {
      return false;
    }

    if (filters.voucherEligible !== undefined && voucher.voucherEligible !== filters.voucherEligible) {
      return false;
    }

    if (filters.voucherSent !== undefined && voucher.voucherSent !== filters.voucherSent) {
      return false;
    }

    if (filters.safConsultant && voucher.safConsultant !== filters.safConsultant) {
      return false;
    }

    return true;
  });
}

export async function loadVoucher2026Data(): Promise<{
  vouchers: Voucher2026[];
  exceptions: Voucher2026Exception[];
  installments: Voucher2026Installment[];
}> {
  try {
    const [vouchersCsv, exceptionsCsv, installmentsCsv] = await Promise.all([
      fetchCsvWindows1252("/data/vouchers_2026.csv"),
      fetchCsvWindows1252("/data/voucher_campanha2026_excecoes.csv"),
      fetchCsvWindows1252("/data/voucher_campanha2026_parcelamento_func.csv"),
    ]);

    const vouchers = parseVouchers2026CSV(vouchersCsv);
    const exceptions = parseVouchers2026Exceptions(exceptionsCsv);
    const installments = parseVouchers2026Installments(installmentsCsv);

    return { vouchers, exceptions, installments };
  } catch (error) {
    console.error("Erro ao carregar dados dos vouchers 2026:", error);
    return { vouchers: [], exceptions: [], installments: [] };
  }
}

export function exportVoucher2026Report(vouchers: Voucher2026[]): void {
  const headers = [
    "ID",
    "Nome da Escola",
    "Cluster",
    "Status",
    "Adimplência Contratual",
    "Adimplência Financeira",
    "Utilização LEX",
    "Vendas SLM 2025",
    "Elegível para Voucher",
    "Motivo",
    "Habilitação Voucher",
    "Quantidade Vouchers",
    "Código do Voucher",
    "Voucher Enviado",
    "Observações",
    "Consultor SAF",
  ];

  const rows = vouchers.map((voucher) => [
    voucher.id,
    voucher.name,
    voucher.cluster,
    voucher.status,
    voucher.contractualCompliance,
    voucher.financialCompliance,
    voucher.lexIntegration,
    voucher.slmSales2025,
    voucher.voucherEligible ? "Sim" : "Não",
    voucher.reason,
    voucher.voucherEnabled,
    voucher.voucherQuantity,
    voucher.voucherCode,
    voucher.voucherSent ? "Sim" : "Não",
    voucher.observations,
    voucher.safConsultant || "",
  ]);

  const csvContent = [headers, ...rows].map((row) => row.join(";")).join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", "voucher2026_report.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
