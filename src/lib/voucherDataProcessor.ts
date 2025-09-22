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
  voucherEnable: string;
  voucherQuantity: number;
  voucherCode: string;
  voucherSent: boolean;
  observations: string;
  safConsultant?: string; // Novo campo para consultor SAF
}

export interface ExceptionVoucher {
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
  // Novos campos
  voucherCode: string;
  expiryDate: string;
  requester: string;
  requestSource: 'email' | 'ticket';
  emailTitle2?: string;
  ticketNumber?: string;
  createdAt: string;
}

export interface VoucherJustification {
  id: string;
  schoolId: string;
  action: 'add' | 'edit' | 'exception';
  justification: string;
  createdBy: string;
  createdAt: string;
  oldValue?: any;
  newValue?: any;
}

// Função para corrigir encoding
function fixEncoding(text: string): string {
  if (!text) return text;
  
  const encodingMap: { [key: string]: string } = {
    'Cama�ari': 'Camaçari',
    'Paul�nia': 'Paulínia',
    'Cambu�': 'Cambuí', 
    'Adimpl�ncia': 'Adimplência',
    'Utiliza��o': 'Utilização',
    'C�digo': 'Código',
    'Observa��o': 'Observação',
    'B�rbara': 'Bárbara',
    'orienta��es': 'orientações',
    'Andr�': 'André',
    'Jo�o': 'João'
  };
  
  let fixedText = text;
  Object.keys(encodingMap).forEach(broken => {
    fixedText = fixedText.replace(new RegExp(broken, 'g'), encodingMap[broken]);
  });
  
  return fixedText;
}

// Função para atribuir consultor SAF baseado no cluster/região
function assignSafConsultant(cluster: string, name: string): string {
  const consultantMap: { [key: string]: string } = {
    'Desenvolvimento': 'Tatiane',
    'Potente': 'Rafhael', 
    'Alerta': 'João',
    'Crescimento': 'Ingrid',
    'Fortalecimento': 'Ana Paula'
  };
  
  // Se não encontrar por cluster, atribuir por região/estado
  if (!consultantMap[cluster]) {
    if (name.includes('São Paulo') || name.includes('SP')) return 'Rafhael';
    if (name.includes('Rio de Janeiro') || name.includes('RJ')) return 'Ana Paula';
    if (name.includes('Bahia') || name.includes('BA')) return 'Tatiane';
    if (name.includes('Minas Gerais') || name.includes('MG')) return 'Ingrid';
    return 'João'; // Consultor padrão
  }
  
  return consultantMap[cluster] || 'João';
}

export function parseVouchersCSV(csvContent: string): VoucherSchool[] {
  const lines = csvContent.split('\n');
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(';');
      
      const rawName = values[1] || '';
      const rawCluster = values[2] || '';
      
      const fixedName = fixEncoding(rawName);
      const fixedCluster = fixEncoding(rawCluster);
      
      return {
        id: values[0] || '',
        name: fixedName,
        cluster: fixedCluster,
        status: fixEncoding(values[3] || ''),
        contractualCompliance: fixEncoding(values[4] || ''),
        financialCompliance: fixEncoding(values[5] || ''),
        lexUsage: fixEncoding(values[6] || ''),
        slmSales: parseInt(values[7]) || 0,
        voucherEligible: values[8] === 'Sim',
        reason: fixEncoding(values[9] || ''),
        voucherEnable: fixEncoding(values[10] || ''),
        voucherQuantity: parseInt(values[11]) || 0,
        voucherCode: values[12] || '',
        voucherSent: values[13] === 'SIM',
        observations: fixEncoding(values[14] || ''),
        safConsultant: assignSafConsultant(fixedCluster, fixedName)
      };
    })
    .filter(school => school.id && school.name);
}

export function parseExceptionVouchersCSV(csvContent: string): ExceptionVoucher[] {
  const lines = csvContent.split('\n');
  
  return lines.slice(1)
    .filter(line => line.trim() && line.split(';')[0])
    .map(line => {
      const values = line.split(';');
      
      return {
        unit: values[0] || '',
        financialResponsible: values[1] || '',
        course: values[2] || '',
        voucherPercent: parseFloat(values[3]) || 0,
        code: values[4] || '',
        cpf: values[5] || '',
        createdBy: values[6] || '',
        emailTitle: values[7] || '',
        requestedBy: values[8] || '',
        usageCount: parseInt(values[9]) || 0,
        // Novos campos com valores padrão
        voucherCode: values[4] || '',
        expiryDate: '',
        requester: values[8] || '',
        requestSource: 'email' as 'email' | 'ticket',
        createdAt: new Date().toISOString()
      };
    });
}

export function getVoucherStats(schools: VoucherSchool[], exceptions: ExceptionVoucher[]) {
  const totalSchools = schools.length;
  const eligibleSchools = schools.filter(s => s.voucherEligible).length;
  const totalVouchers = schools.reduce((sum, school) => sum + school.voucherQuantity, 0);
  const sentVouchers = schools.filter(s => s.voucherSent).length;
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
    eligibilityRate: totalSchools > 0 ? (eligibleSchools / totalSchools) * 100 : 0,
    deliveryRate: eligibleSchools > 0 ? (sentVouchers / eligibleSchools) * 100 : 0
  };
}

export async function loadVoucherData(): Promise<{ schools: VoucherSchool[], exceptions: ExceptionVoucher[] }> {
  try {
    const [schoolsResponse, exceptionsResponse] = await Promise.all([
      fetch('/data/vouchers_2026.csv'),
      fetch('/data/vouchers_excecoes.csv')
    ]);
    
    const schoolsCSV = await schoolsResponse.text();
    const exceptionsCSV = await exceptionsResponse.text();
    
    const schools = parseVouchersCSV(schoolsCSV);
    const exceptions = parseExceptionVouchersCSV(exceptionsCSV);
    
    return { schools, exceptions };
  } catch (error) {
    console.error('Erro ao carregar dados dos vouchers:', error);
    return { schools: [], exceptions: [] };
  }
}

export function searchVoucherByCode(code: string, schools: VoucherSchool[], exceptions: ExceptionVoucher[]) {
  const schoolResult = schools.find(s => s.voucherCode.toLowerCase().includes(code.toLowerCase()));
  const exceptionResult = exceptions.find(e => e.code.toLowerCase().includes(code.toLowerCase()));
  
  return {
    school: schoolResult,
    exception: exceptionResult,
    found: !!(schoolResult || exceptionResult)
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
  return schools.filter(school => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (!school.name.toLowerCase().includes(searchLower) && 
          !school.voucherCode.toLowerCase().includes(searchLower) &&
          !school.id.includes(searchLower)) {
        return false;
      }
    }
    
    if (filters.cluster && school.cluster !== filters.cluster) return false;
    if (filters.status && school.status !== filters.status) return false;
    if (filters.voucherEligible !== undefined && school.voucherEligible !== filters.voucherEligible) return false;
    if (filters.voucherSent !== undefined && school.voucherSent !== filters.voucherSent) return false;
    if (filters.safConsultant && school.safConsultant !== filters.safConsultant) return false;
    
    return true;
  });
}

export function exportVoucherReport(schools: VoucherSchool[], exceptions: ExceptionVoucher[]) {
  const headers = [
    'ID', 'Nome', 'Cluster', 'Status', 'Elegível', 'Qtd Vouchers', 
    'Código', 'Enviado', 'Vendas SLM', 'Observações'
  ];
  
  const rows = schools.map(school => [
    school.id,
    school.name,
    school.cluster,
    school.status,
    school.voucherEligible ? 'Sim' : 'Não',
    school.voucherQuantity,
    school.voucherCode,
    school.voucherSent ? 'Sim' : 'Não',
    school.slmSales,
    school.observations
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(';'))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `relatorio_vouchers_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
}