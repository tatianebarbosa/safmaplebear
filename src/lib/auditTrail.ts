/**
 * Módulo de Histórico de Alterações (Audit Trail)
 * 
 * Este módulo é responsável por registrar todas as alterações feitas nas escolas,
 * usuários, licenças Canva e outras entidades do sistema.
 */

// Tipos de alterações possíveis
export enum TipoAlteracao {
  CRIAR = 'CRIAR',
  ATUALIZAR = 'ATUALIZAR',
  EXCLUIR = 'EXCLUIR',
  REVERTER = 'REVERTER',
  TRANSFERIR = 'TRANSFERIR',
  ATIVAR = 'ATIVAR',
  DESATIVAR = 'DESATIVAR',
}

// Entidades que podem ser alteradas
export enum TipoEntidade {
  ESCOLA = 'ESCOLA',
  USUARIO = 'USUARIO',
  LICENCA_CANVA = 'LICENCA_CANVA',
  FRANQUIA = 'FRANQUIA',
  CLUSTER = 'CLUSTER',
}

/**
 * Interface para um registro de alteração
 */
export interface RegistroAuditoria {
  id: string;
  timestamp: number;
  data: string;
  hora: string;
  tipoAlteracao: TipoAlteracao;
  tipoEntidade: TipoEntidade;
  idEntidade: string;
  nomeEntidade: string;
  usuarioId: string;
  nomeUsuario: string;
  emailUsuario: string;
  descricao: string;
  camposAlterados?: {
    campo: string;
    valorAnterior: any;
    valorNovo: any;
  }[];
  ipAddress?: string;
  userAgent?: string;
  reversivel: boolean;
  idReversao?: string; // ID do registro que reverteu este
}

/**
 * Classe para gerenciar o histórico de alterações
 */
export class AuditTrail {
  private apiUrl: string = '/api/auditoria';

  /**
   * Registra uma alteração no histórico
   */
  async registrarAlteracao(
    tipoAlteracao: TipoAlteracao,
    tipoEntidade: TipoEntidade,
    idEntidade: string,
    nomeEntidade: string,
    usuarioId: string,
    nomeUsuario: string,
    emailUsuario: string,
    descricao: string,
    camposAlterados?: RegistroAuditoria['camposAlterados']
  ): Promise<RegistroAuditoria> {
    try {
      const response = await fetch(`${this.apiUrl}/registrar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tipoAlteracao,
          tipoEntidade,
          idEntidade,
          nomeEntidade,
          usuarioId,
          nomeUsuario,
          emailUsuario,
          descricao,
          camposAlterados,
          ipAddress: await this.obterIPAddress(),
          userAgent: navigator.userAgent,
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
   * Obtém o histórico de alterações para uma entidade
   */
  async obterHistorico(
    tipoEntidade: TipoEntidade,
    idEntidade: string,
    limite: number = 50
  ): Promise<RegistroAuditoria[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/historico/${tipoEntidade}/${idEntidade}?limite=${limite}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

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
   * Obtém o histórico de alterações de um usuário
   */
  async obterHistoricoUsuario(usuarioId: string, limite: number = 50): Promise<RegistroAuditoria[]> {
    try {
      const response = await fetch(`${this.apiUrl}/usuario/${usuarioId}?limite=${limite}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao obter histórico do usuário: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao obter histórico do usuário:', error);
      throw error;
    }
  }

  /**
   * Reverte uma alteração
   */
  async reverterAlteracao(registroId: string): Promise<RegistroAuditoria> {
    try {
      const response = await fetch(`${this.apiUrl}/reverter/${registroId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao reverter alteração: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao reverter alteração:', error);
      throw error;
    }
  }

  /**
   * Obtém um registro específico de auditoria
   */
  async obterRegistro(registroId: string): Promise<RegistroAuditoria> {
    try {
      const response = await fetch(`${this.apiUrl}/registro/${registroId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Erro ao obter registro: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao obter registro:', error);
      throw error;
    }
  }

  /**
   * Obtém o IP address do cliente
   */
  private async obterIPAddress(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Formata um registro de auditoria para exibição
   */
  formatarRegistro(registro: RegistroAuditoria): string {
    const { data, hora, tipoAlteracao, nomeEntidade, nomeUsuario, descricao } = registro;
    return `${data} ${hora} - ${tipoAlteracao} - ${nomeEntidade} - ${nomeUsuario}: ${descricao}`;
  }

  /**
   * Obtém a cor para um tipo de alteração
   */
  obterCorTipoAlteracao(tipo: TipoAlteracao): string {
    const cores: Record<TipoAlteracao, string> = {
      [TipoAlteracao.CRIAR]: '#22c55e', // Verde
      [TipoAlteracao.ATUALIZAR]: '#3b82f6', // Azul
      [TipoAlteracao.EXCLUIR]: '#ef4444', // Vermelho
      [TipoAlteracao.REVERTER]: '#f59e0b', // Laranja
      [TipoAlteracao.TRANSFERIR]: '#8b5cf6', // Roxo
      [TipoAlteracao.ATIVAR]: '#10b981', // Verde escuro
      [TipoAlteracao.DESATIVAR]: '#6b7280', // Cinza
    };
    return cores[tipo] || '#6b7280';
  }

  /**
   * Obtém o ícone para um tipo de alteração
   */
  obterIconoTipoAlteracao(tipo: TipoAlteracao): string {
    const icones: Record<TipoAlteracao, string> = {
      [TipoAlteracao.CRIAR]: '✚',
      [TipoAlteracao.ATUALIZAR]: '✎',
      [TipoAlteracao.EXCLUIR]: '✕',
      [TipoAlteracao.REVERTER]: '↶',
      [TipoAlteracao.TRANSFERIR]: '→',
      [TipoAlteracao.ATIVAR]: '⊙',
      [TipoAlteracao.DESATIVAR]: '⊗',
    };
    return icones[tipo] || '•';
  }
}

// Exporta uma instância singleton do audit trail
export const auditTrail = new AuditTrail();
