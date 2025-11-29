export type CanvaOverviewApiResponse = {
  success: boolean;
  generatedAt: string;
  overview: {
    totalEscolas: number;
    escolasComLicenca: number;
    licencasUtilizadas: number;
    licencasTotais: number;
    ocupacaoPercentual: number;
    escolasEmExcesso: number;
    usuariosNaoConformes: number;
    dominiosNaoMapleBear: number;
    dominiosNaoMapleBearTop: Array<{ domain: string; count: number }>;
    fonte: string;
  };
  schools: Array<{
    schoolId: string | number;
    name: string;
    usedLicenses: number;
    limit: number;
    status: string;
  }>;
};

export async function fetchCanvaOverview(): Promise<CanvaOverviewApiResponse> {
  const res = await fetch("/api/canva/overview");
  if (!res.ok) {
    throw new Error(`Falha ao buscar overview do Canva (${res.status})`);
  }
  return (await res.json()) as CanvaOverviewApiResponse;
}
