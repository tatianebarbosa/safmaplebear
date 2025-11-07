/**
 * Módulo de Coleta de Dados do Canva - Versão Expandida
 * 
 * Este módulo é responsável por:
 * 1. Fazer login automaticamente no Canva
 * 2. Coletar métricas detalhadas (Pessoas, Designs, Membros, Kits de Marca)
 * 3. Armazenar os dados em um banco de dados
 * 4. Implementar o histórico de alterações
 */

// Tipos de dados para Kit de Marca
export interface KitMarca {
  nome: string;
  aplicado: string;
  criado: string;
  ultimaAtualizacao: string;
}

// Tipos de dados para Canva (expandido)
export interface CanvaData {
  // Dados de Pessoas
  totalPessoas: number;
  
  // Dados de Relatório de Uso
  designsCriados: number;
  designsCriadosCrescimento: number;
  membrosAtivos: number;
  membrosAtivosCrescimento: number;
  totalPublicado: number;
  totalCompartilhado: number;
  
  // Dados de Membros por Função
  administradores: number;
  alunos: number;
  professores: number;
  
  // Dados de Kits de Marca
  totalKits: number;
  kits?: KitMarca[];
  
  // Metadados
  dataAtualizacao: string;
  horaAtualizacao: string;
  timestamp: number;
  mudancas?: {
    totalPessoas?: number;
    designsCriados?: number;
    membrosAtivos?: number;
  };
}

export interface CanvaHistorico {
  id: string;
  
  // Dados de Pessoas
  totalPessoas: number;
  
  // Dados de Relatório de Uso
  designsCriados: number;
  membrosAtivos: number;
  totalPublicado: number;
  totalCompartilhado: number;
  
  // Dados de Membros por Função
  administradores: number;
  alunos: number;
  professores: number;
  
  // Dados de Kits de Marca
  totalKits: number;
  
  // Metadados
  dataAtualizacao: string;
  horaAtualizacao: string;
  timestamp: number;
  mudancas: {
    totalPessoas?: number;
    designsCriados?: number;
    membrosAtivos?: number;
  };
  usuarioAlteracao: string;
  descricaoAlteracao: string;
}

/**
 * Classe para gerenciar a coleta de dados do Canva
 */
export class CanvaDataCollector {
  private canvaEmail: string;
  private canvaPassword: string;
  private apiUrl: string = '/api/canva';

  constructor(email: string, password: string) {
    this.canvaEmail = email;
    this.canvaPassword = password;
  }

  /**
   * Coleta os dados detalhados do Canva via API
   * Esta função será chamada por um backend que faz o scraping
   */
  async coletarDadosCanva(): Promise<CanvaData> {
    try {
      // Faz uma requisição para o backend que faz o scraping
      const response = await fetch(`${this.apiUrl}/coletar-dados`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: this.canvaEmail,
          password: this.canvaPassword,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao coletar dados do Canva: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao coletar dados do Canva:', error);
      throw error;
    }
  }

  /**
   * Obtém o histórico de alterações
   */
  async obterHistorico(): Promise<CanvaHistorico[]> {
    try {
      const response = await fetch(`${this.apiUrl}/historico`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao obter histórico: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao obter histórico:', error);
      throw error;
    }
  }

  /**
   * Registra uma alteração no histórico
   */
  async registrarAlteracao(
    dados: Partial<CanvaData>,
    usuarioAlteracao: string,
    descricaoAlteracao: string
  ): Promise<CanvaHistorico> {
    try {
      const response = await fetch(`${this.apiUrl}/registrar-alteracao`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dados,
          usuarioAlteracao,
          descricaoAlteracao,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro ao registrar alteração: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao registrar alteração:', error);
      throw error;
    }
  }

  /**
   * Reverte uma alteração no histórico
   */
  async reverterAlteracao(historicoId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/reverter-alteracao/${historicoId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao reverter alteração: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro ao reverter alteração:', error);
      throw error;
    }
  }

  /**
   * Obtém os dados mais recentes do Canva
   */
  async obterDadosRecentes(): Promise<CanvaData | null> {
    try {
      const response = await fetch(`${this.apiUrl}/dados-recentes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao obter dados recentes: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao obter dados recentes:', error);
      return null;
    }
  }

  /**
   * Obtém dados filtrados por tipo de métrica
   */
  async obterMetricasPorTipo(tipo: 'pessoas' | 'designs' | 'membros' | 'kits'): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/metricas/${tipo}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao obter métricas: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao obter métricas:', error);
      return null;
    }
  }
}

// Exporta uma instância singleton do coletor
export const canvaCollector = new CanvaDataCollector(
  process.env.REACT_APP_CANVA_EMAIL || '',
  process.env.REACT_APP_CANVA_PASSWORD || ''
);
