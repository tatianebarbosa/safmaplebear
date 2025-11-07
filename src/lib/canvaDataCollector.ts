/**
 * Módulo de Coleta de Dados do Canva
 * 
 * Este módulo é responsável por:
 * 1. Fazer login automaticamente no Canva
 * 2. Coletar o número de pessoas (usuários ativos)
 * 3. Armazenar os dados em um banco de dados
 * 4. Implementar o histórico de alterações
 */

// Tipos de dados
export interface CanvaData {
  totalPessoas: number;
  dataAtualizacao: string;
  horaAtualizacao: string;
  timestamp: number;
}

export interface CanvaHistorico {
  id: string;
  totalPessoas: number;
  dataAtualizacao: string;
  horaAtualizacao: string;
  timestamp: number;
  mudanca: number; // Diferença em relação ao registro anterior
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
   * Coleta o número de pessoas do Canva via API
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
    totalPessoas: number,
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
          totalPessoas,
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
}

// Exporta uma instância singleton do coletor
export const canvaCollector = new CanvaDataCollector(
  process.env.REACT_APP_CANVA_EMAIL || '',
  process.env.REACT_APP_CANVA_PASSWORD || ''
);
