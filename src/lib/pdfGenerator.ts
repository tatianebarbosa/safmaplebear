// @ts-nocheck
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { VoucherSchool, ExceptionVoucher } from './voucherDataProcessor';

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export function generateVoucherReport(
  schools: VoucherSchool[], 
  exceptions: ExceptionVoucher[]
) {
  const doc = new jsPDF();
  
  // Cabealho
  doc.setFontSize(16);
  doc.text('Relatrio de Vouchers Canva', 20, 20);
  
  doc.setFontSize(10);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
  
  // Resumo Executivo
  doc.setFontSize(12);
  doc.text('Resumo Executivo', 20, 45);
  
  const totalSchools = schools.length;
  const totalVouchers = schools.reduce((sum, school) => sum + school.voucherQuantity, 0);
  const sentVouchers = schools.filter(s => s.voucherSent).length;
  const totalExceptions = exceptions.length;
  
  doc.setFontSize(9);
  doc.text(`Total de Escolas: ${totalSchools}`, 20, 55);
  doc.text(`Vouchers Criados: ${totalVouchers}`, 20, 62);
  doc.text(`Vouchers Enviados: ${sentVouchers}`, 20, 69);
  doc.text(`Excees Criadas: ${totalExceptions}`, 20, 76);
  
  // Tabela de Vouchers por Escola
  const schoolData = schools
    .filter(school => school.voucherQuantity > 0)
    .map(school => [
      school.name,
      school.cluster,
      school.voucherQuantity.toString(),
      school.voucherCode,
      school.voucherSent ? 'Sim' : 'No',
      school.slmSales.toString()
    ]);
  
  doc.autoTable({
    startY: 90,
    head: [['Escola', 'Cluster', 'Qtd Vouchers', 'Cdigo', 'Enviado', 'Vendas SLM']],
    body: schoolData,
    styles: { fontSize: 7 },
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 25 },
      2: { cellWidth: 20 },
      3: { cellWidth: 30 },
      4: { cellWidth: 15 },
      5: { cellWidth: 20 }
    }
  });
  
  // Nova pgina para excees se houver
  if (exceptions.length > 0) {
    doc.addPage();
    
    doc.setFontSize(14);
    doc.text('Vouchers de Exceo', 20, 20);
    
    const exceptionData = exceptions.map(exc => [
      exc.unit || 'N/A',
      exc.voucherCode || exc.code || 'N/A',
      exc.requestedBy || exc.requester || 'N/A',
      exc.requestSource === 'email' ? `Email: ${exc.emailTitle2 || exc.emailTitle || 'N/A'}` 
        : `Ticket: ${exc.ticketNumber || 'N/A'}`,
      exc.expiryDate || 'N/A',
      new Date(exc.createdAt || Date.now()).toLocaleDateString('pt-BR')
    ]);
    
    doc.autoTable({
      startY: 35,
      head: [['Unidade', 'Cdigo Voucher', 'Solicitado Por', 'Origem', 'Validade', 'Criado Em']],
      body: exceptionData,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [231, 76, 60] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 30 },
        2: { cellWidth: 30 },
        3: { cellWidth: 40 },
        4: { cellWidth: 25 },
        5: { cellWidth: 20 }
      }
    });
  }
  
  // Estatsticas por Cluster
  doc.addPage();
  doc.setFontSize(14);
  doc.text('Estatsticas por Cluster', 20, 20);
  
  const clusterStats = schools.reduce((acc, school) => {
    if (!acc[school.cluster]) {
      acc[school.cluster] = { 
        total: 0, 
        vouchers: 0, 
        sent: 0, 
        eligible: 0 
      };
    }
    acc[school.cluster].total++;
    acc[school.cluster].vouchers += school.voucherQuantity;
    if (school.voucherSent) acc[school.cluster].sent++;
    if (school.voucherEligible) acc[school.cluster].eligible++;
    return acc;
  }, {} as Record<string, { total: number; vouchers: number; sent: number; eligible: number }>);
  
  const clusterData = Object.entries(clusterStats).map(([cluster, stats]) => [
    cluster,
    stats.total.toString(),
    stats.eligible.toString(),
    stats.vouchers.toString(),
    stats.sent.toString(),
    `${((stats.sent / Math.max(stats.eligible, 1)) * 100).toFixed(1)}%`
  ]);
  
  doc.autoTable({
    startY: 35,
    head: [['Cluster', 'Total Escolas', 'Elegveis', 'Vouchers', 'Enviados', '% Entrega']],
    body: clusterData,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [46, 204, 113] }
  });
  
  // Salvar o PDF
  doc.save(`relatorio_vouchers_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function generateUserReport(totalUsers: number, schoolData: any[]) {
  const doc = new jsPDF();
  
  doc.setFontSize(16);
  doc.text('Relatrio de Usurios Canva', 20, 20);
  
  doc.setFontSize(10);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 20, 30);
  doc.text(`Total de Usurios: ${totalUsers}`, 20, 37);
  
  const schoolUserData = schoolData
    .filter(school => school.users && school.users.length > 0)
    .map(school => [
      school.name,
      school.cluster || 'N/A',
      school.users.length.toString(),
      school.usedLicenses?.toString() || '0',
      school.maxLicenses?.toString() || '2',
      school.maxLicenses ? `${((school.usedLicenses || 0 / school.maxLicenses) * 100).toFixed(1)}%` : '0%'
    ]);
  
  doc.autoTable({
    startY: 50,
    head: [['Escola', 'Cluster', 'Usuários', 'Licenças Usadas', 'Licenças Total', 'Utilização']],
    body: schoolUserData,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [155, 89, 182] }
  });
  
  doc.save(`relatorio_usu?rios_${new Date().toISOString().split('T')[0]}.pdf`);
}
