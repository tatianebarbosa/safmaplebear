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

function fixEncoding(text: string): string {
  if (!text) return '';
  
  return text
    .replace(/ã/g, 'ã')
    .replace(/é/g, 'é')
    .replace(/ç/g, 'ç')
    .replace(/á/g, 'á')
    .replace(/ê/g, 'ê')
    .replace(/í/g, 'í')
    .replace(/ô/g, 'ô')
    .replace(/ú/g, 'ú')
    .replace(/â/g, 'â')
    .replace(/à/g, 'à')
    .replace(/õ/g, 'õ');
}

function assignSafConsultant(cluster: string, name: string): string {
  const cleanCluster = cluster?.toLowerCase().trim() || '';
  const cleanName = name?.toLowerCase() || '';
  
  // Ingrid - MG, PR, SC, GO
  if (cleanName.includes('minas gerais') || cleanName.includes('belo horizonte') || cleanName.includes('mg') ||
      cleanName.includes('paraná') || cleanName.includes('curitiba') || cleanName.includes('pr') ||
      cleanName.includes('santa catarina') || cleanName.includes('florianópolis') || cleanName.includes('sc') ||
      cleanName.includes('goiás') || cleanName.includes('goiânia') || cleanName.includes('go') ||
      cleanCluster === 'alerta' && (cleanName.includes('goiânia') || cleanName.includes('marista'))) {
    return 'INGRID VANIA MAZZEI';
  }
  
  // Rafael - SP Interior, Campinas
  if ((cleanName.includes('são paulo') && !cleanName.includes('capital')) || 
      cleanName.includes('campinas') || cleanName.includes('ribeirão') || 
      cleanName.includes('piracicaba') || cleanName.includes('sorocaba')) {
    return 'RAFAEL COSTA';
  }
  
  // João - SP Capital, ABC
  if (cleanName.includes('capital') || cleanName.includes('abc') || 
      (cleanName.includes('são paulo') && (cleanName.includes('vila') || cleanName.includes('jardim')))) {
    return 'JOÃO SILVA';
  }
  
  return 'SAF TEAM';
}

export function parseVouchers2026CSV(csvContent: string): Voucher2026[] {
  const lines = csvContent.split('\n');
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map((line, index) => {
      try {
        const values = line.split(';');
        
        const id = values[0] || '';
        const name = fixEncoding(values[1] || '');
        const cluster = fixEncoding(values[2] || '');
        const status = fixEncoding(values[3] || '');
        const contractualCompliance = fixEncoding(values[4] || '');
        const financialCompliance = fixEncoding(values[5] || '');
        const lexIntegration = fixEncoding(values[6] || '');
        const slmSales2025 = parseInt(values[7] || '0', 10);
        const voucherEligible = values[8]?.toLowerCase().trim() === 'sim';
        const reason = fixEncoding(values[9] || '');
        const voucherEnabled = fixEncoding(values[10] || '');
        const voucherQuantity = parseInt(values[11] || '0', 10);
        const voucherCode = fixEncoding(values[12] || '');
        const voucherSent = values[13]?.toLowerCase().trim() === 'sim';
        const observations = fixEncoding(values[14] || '');
        
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
          reason: reason || '',
          voucherEnabled,
          voucherQuantity,
          voucherCode: voucherCode || '',
          voucherSent,
          observations: observations || '',
          safConsultant
        };
      } catch (error) {
        console.error(`Erro ao processar linha ${index + 2}:`, error);
        return null;
      }
    })
    .filter((voucher): voucher is Voucher2026 => voucher !== null && voucher.id !== '');
}

export function getVoucher2026Stats(vouchers: Voucher2026[]) {
  const totalSchools = vouchers.length;
  const eligibleSchools = vouchers.filter(v => v.voucherEligible).length;
  const sentVouchers = vouchers.filter(v => v.voucherSent).length;
  const totalVouchers = vouchers.reduce((sum, v) => sum + v.voucherQuantity, 0);
  
  const eligibilityRate = totalSchools > 0 ? (eligibleSchools / totalSchools) * 100 : 0;
  const deliveryRate = eligibleSchools > 0 ? (sentVouchers / eligibleSchools) * 100 : 0;
  
  const byCluster = vouchers.reduce((acc, voucher) => {
    if (!acc[voucher.cluster]) {
      acc[voucher.cluster] = {
        total: 0,
        eligible: 0,
        sent: 0,
        vouchers: 0
      };
    }
    
    acc[voucher.cluster].total++;
    if (voucher.voucherEligible) acc[voucher.cluster].eligible++;
    if (voucher.voucherSent) acc[voucher.cluster].sent++;
    acc[voucher.cluster].vouchers += voucher.voucherQuantity;
    
    return acc;
  }, {} as Record<string, { total: number; eligible: number; sent: number; vouchers: number }>);
  
  return {
    totalSchools,
    eligibleSchools,
    sentVouchers,
    totalVouchers,
    eligibilityRate: Math.round(eligibilityRate * 100) / 100,
    deliveryRate: Math.round(deliveryRate * 100) / 100,
    byCluster
  };
}

export function filterVouchers2026(vouchers: Voucher2026[], filters: {
  search?: string;
  cluster?: string;
  status?: string;
  voucherEligible?: boolean;
  voucherSent?: boolean;
  safConsultant?: string;
}): Voucher2026[] {
  return vouchers.filter(voucher => {
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

export async function loadVoucher2026Data(): Promise<Voucher2026[]> {
  try {
    const response = await fetch('/data/vouchers_2026.csv');
    const csvContent = await response.text();
    
    return parseVouchers2026CSV(csvContent);
  } catch (error) {
    console.error('Erro ao carregar dados dos vouchers 2026:', error);
    return [];
  }
}

export function exportVoucher2026Report(vouchers: Voucher2026[]): void {
  const headers = [
    'ID',
    'Nome da Escola',
    'Cluster',
    'Status',
    'Adimplência Contratual',
    'Adimplência Financeira',
    'Utilização LEX',
    'Vendas SLM 2025',
    'Elegível para Voucher',
    'Motivo',
    'Habilitação Voucher',
    'Quantidade Vouchers',
    'Código do Voucher',
    'Voucher Enviado',
    'Observações',
    'Consultor SAF'
  ];
  
  const rows = vouchers.map(voucher => [
    voucher.id,
    voucher.name,
    voucher.cluster,
    voucher.status,
    voucher.contractualCompliance,
    voucher.financialCompliance,
    voucher.lexIntegration,
    voucher.slmSales2025.toString(),
    voucher.voucherEligible ? 'Sim' : 'Não',
    voucher.reason || '',
    voucher.voucherEnabled,
    voucher.voucherQuantity.toString(),
    voucher.voucherCode || '',
    voucher.voucherSent ? 'Sim' : 'Não',
    voucher.observations || '',
    voucher.safConsultant || ''
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(';'))
    .join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `vouchers_2026_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}