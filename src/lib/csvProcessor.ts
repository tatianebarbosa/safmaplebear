export interface CanvaUserData {
  membro: string;
  email: string;
  funcao: string;
  ultimaAtividade: string;
  designsCriados: number;
  designsPublicados: number;
  linksCompartilhados: number;
  designsVisualizados: number;
  score: number;
  escola?: string;
}

export interface RankingComparison {
  current: CanvaUserData[];
  previous?: CanvaUserData[];
  changes: RankingChange[];
}

export interface RankingChange {
  email: string;
  membro: string;
  escola?: string;
  currentPosition: number;
  previousPosition?: number;
  positionChange: number;
  currentScore: number;
  previousScore?: number;
  scoreChange: number;
  trend: 'up' | 'down' | 'same' | 'new';
}

export function parseCSV(csvContent: string): CanvaUserData[] {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
  
  return lines.slice(1)
    .filter(line => line.trim())
    .map((line, index) => {
      const values = parseCSVLine(line);
      
      const designsCriados = parseInt(values[4]) || 0;
      const designsPublicados = parseInt(values[5]) || 0;
      const linksCompartilhados = parseInt(values[6]) || 0;
      const designsVisualizados = parseInt(values[7]) || 0;
      
      // Fórmula de score baseada na atividade
      const score = calculateActivityScore(
        designsCriados,
        designsPublicados,
        linksCompartilhados,
        designsVisualizados
      );

      const escola = extractSchoolFromEmail(values[1]);
      
      return {
        membro: values[0].replace(/"/g, ''),
        email: values[1].replace(/"/g, ''),
        funcao: values[2].replace(/"/g, ''),
        ultimaAtividade: values[3].replace(/"/g, ''),
        designsCriados,
        designsPublicados,
        linksCompartilhados,
        designsVisualizados,
        score,
        escola
      };
    })
    .filter(user => user.email && user.membro)
    .sort((a, b) => b.score - a.score);
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

function calculateActivityScore(
  criados: number,
  publicados: number,
  compartilhados: number,
  visualizados: number
): number {
  // Pesos para diferentes atividades
  const pesoCriados = 2;
  const pesoPublicados = 3;
  const pesoCompartilhados = 1.5;
  const pesoVisualizados = 0.5;
  
  return Math.round(
    (criados * pesoCriados) +
    (publicados * pesoPublicados) +
    (compartilhados * pesoCompartilhados) +
    (visualizados * pesoVisualizados)
  );
}

function extractSchoolFromEmail(email: string): string {
  const domain = email.split('@')[1];
  
  if (domain?.includes('maplebear.com.br')) {
    const subdomain = domain.split('.')[0];
    return formatSchoolName(subdomain);
  }
  
  if (domain?.includes('gmail.com') || domain?.includes('icloud.com')) {
    return 'Externa';
  }
  
  return formatSchoolName(domain?.split('.')[0] || 'Não identificada');
}

function formatSchoolName(name: string): string {
  const schoolMap: { [key: string]: string } = {
    'macapa': 'Macapá',
    'vilavelha': 'Vila Velha',
    'florianopolis': 'Florianópolis',
    'morumbi': 'Morumbi',
    'riobranco': 'Rio Branco',
    'chapeco': 'Chapecó',
    'rioclaro': 'Rio Claro',
    'linhares': 'Linhares',
    'sorocaba': 'Sorocaba',
    'sudoeste': 'Sudoeste',
    'governadorvaladares': 'Governador Valadares',
    'campogrande': 'Campo Grande',
    'te': 'Taubaté',
    'maplebearmaceio': 'Maceió',
    'maplebearbotafogo': 'Botafogo'
  };
  
  return schoolMap[name] || name.charAt(0).toUpperCase() + name.slice(1);
}

export function compareRankings(
  current: CanvaUserData[],
  previous?: CanvaUserData[]
): RankingComparison {
  const changes: RankingChange[] = current.map((currentUser, currentIndex) => {
    const previousUser = previous?.find(p => p.email === currentUser.email);
    const previousIndex = previousUser ? previous!.indexOf(previousUser) : -1;
    
    let trend: 'up' | 'down' | 'same' | 'new' = 'new';
    let positionChange = 0;
    
    if (previousUser) {
      positionChange = previousIndex - currentIndex;
      if (positionChange > 0) trend = 'up';
      else if (positionChange < 0) trend = 'down';
      else trend = 'same';
    }
    
    return {
      email: currentUser.email,
      membro: currentUser.membro,
      escola: currentUser.escola,
      currentPosition: currentIndex + 1,
      previousPosition: previousUser ? previousIndex + 1 : undefined,
      positionChange,
      currentScore: currentUser.score,
      previousScore: previousUser?.score,
      scoreChange: previousUser ? currentUser.score - previousUser.score : currentUser.score,
      trend
    };
  });
  
  return {
    current,
    previous,
    changes
  };
}

export async function loadReportData(period: '30_dias' | '3_meses' | '6_meses' | '12_meses'): Promise<CanvaUserData[]> {
  try {
    const response = await fetch(`/data/relatorio_${period}.csv`);
    const csvContent = await response.text();
    return parseCSV(csvContent);
  } catch (error) {
    console.error(`Erro ao carregar dados de ${period}:`, error);
    return [];
  }
}