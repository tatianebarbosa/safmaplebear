import React, { useEffect, useState } from 'react';
import { auditTrail, RegistroAuditoria, TipoEntidade } from '@/lib/auditTrail';

interface HistoricoAlteracoesProps {
  tipoEntidade: TipoEntidade;
  idEntidade: string;
  nomeEntidade: string;
  limite?: number;
}

/**
 * Componente para exibir o histórico de alterações
 */
export const HistoricoAlteracoes: React.FC<HistoricoAlteracoesProps> = ({
  tipoEntidade,
  idEntidade,
  nomeEntidade,
  limite = 50,
}) => {
  const [historico, setHistorico] = useState<RegistroAuditoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Carrega o histórico ao montar o componente
  useEffect(() => {
    carregarHistorico();
  }, [tipoEntidade, idEntidade]);

  const carregarHistorico = async () => {
    setLoading(true);
    setError(null);
    try {
      const dados = await auditTrail.obterHistorico(tipoEntidade, idEntidade, limite);
      setHistorico(dados);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const reverterAlteracao = async (registroId: string) => {
    if (!window.confirm('Tem certeza que deseja reverter esta alteração?')) {
      return;
    }

    try {
      await auditTrail.reverterAlteracao(registroId);
      // Recarrega o histórico
      await carregarHistorico();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reverter alteração');
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  if (loading) {
    return <div className="historico-loading">Carregando histórico...</div>;
  }

  return (
    <div className="historico-alteracoes">
      <div className="historico-header">
        <h3>Histórico de Alterações - {nomeEntidade}</h3>
        <button onClick={carregarHistorico} className="btn-refresh">
          🔄 Atualizar
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {historico.length === 0 ? (
        <div className="no-data">Nenhuma alteração registrada para esta entidade</div>
      ) : (
        <div className="historico-list">
          {historico.map((registro) => (
            <div
              key={registro.id}
              className={`historico-item ${expandedId === registro.id ? 'expanded' : ''}`}
            >
              <div
                className="historico-item-header"
                onClick={() => toggleExpanded(registro.id)}
              >
                <div className="item-info">
                  <span
                    className="tipo-badge"
                    style={{ backgroundColor: auditTrail.obterCorTipoAlteracao(registro.tipoAlteracao) }}
                    title={registro.tipoAlteracao}
                  >
                    {auditTrail.obterIconoTipoAlteracao(registro.tipoAlteracao)}
                  </span>
                  <div className="item-details">
                    <p className="item-descricao">{registro.descricao}</p>
                    <p className="item-meta">
                      {registro.data} às {registro.hora} • {registro.nomeUsuario} ({registro.emailUsuario})
                    </p>
                  </div>
                </div>
                <div className="item-actions">
                  {registro.reversivel && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        reverterAlteracao(registro.id);
                      }}
                      className="btn-revert"
                      title="Reverter esta alteração"
                    >
                      ↶ Reverter
                    </button>
                  )}
                  <span className="expand-icon">{expandedId === registro.id ? '▼' : '▶'}</span>
                </div>
              </div>

              {expandedId === registro.id && (
                <div className="historico-item-details">
                  <div className="detail-row">
                    <span className="label">ID do Registro:</span>
                    <span className="value">{registro.id}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Tipo de Alteração:</span>
                    <span className="value">{registro.tipoAlteracao}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Tipo de Entidade:</span>
                    <span className="value">{registro.tipoEntidade}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">ID da Entidade:</span>
                    <span className="value">{registro.idEntidade}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Usuário:</span>
                    <span className="value">{registro.nomeUsuario} ({registro.emailUsuario})</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Data/Hora:</span>
                    <span className="value">{registro.data} às {registro.hora}</span>
                  </div>
                  {registro.ipAddress && (
                    <div className="detail-row">
                      <span className="label">IP Address:</span>
                      <span className="value">{registro.ipAddress}</span>
                    </div>
                  )}
                  {registro.camposAlterados && registro.camposAlterados.length > 0 && (
                    <div className="campos-alterados">
                      <h4>Campos Alterados:</h4>
                      <table className="campos-table">
                        <thead>
                          <tr>
                            <th>Campo</th>
                            <th>Valor Anterior</th>
                            <th>Valor Novo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {registro.camposAlterados.map((campo, idx) => (
                            <tr key={idx}>
                              <td>{campo.campo}</td>
                              <td className="valor-anterior">{JSON.stringify(campo.valorAnterior)}</td>
                              <td className="valor-novo">{JSON.stringify(campo.valorNovo)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {registro.idReversao && (
                    <div className="detail-row revertido">
                      <span className="label">Revertido por:</span>
                      <span className="value">{registro.idReversao}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <style>{`
        .historico-alteracoes {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          padding: 20px;
          margin-top: 20px;
        }

        .historico-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          border-bottom: 2px solid #e0e0e0;
          padding-bottom: 15px;
        }

        .historico-header h3 {
          margin: 0;
          font-size: 18px;
          color: #333;
        }

        .btn-refresh {
          padding: 8px 16px;
          background-color: #3b82f6;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          transition: background-color 0.3s;
        }

        .btn-refresh:hover {
          background-color: #2563eb;
        }

        .error-message {
          padding: 12px;
          background-color: #fee;
          color: #c33;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .no-data {
          padding: 20px;
          text-align: center;
          color: #999;
          font-size: 14px;
        }

        .historico-loading {
          padding: 20px;
          text-align: center;
          color: #666;
        }

        .historico-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .historico-item {
          border: 1px solid #e0e0e0;
          border-radius: 6px;
          overflow: hidden;
          transition: all 0.3s;
        }

        .historico-item:hover {
          border-color: #3b82f6;
          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
        }

        .historico-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px;
          cursor: pointer;
          background-color: #f9f9f9;
          transition: background-color 0.3s;
        }

        .historico-item-header:hover {
          background-color: #f0f0f0;
        }

        .item-info {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          flex: 1;
        }

        .tipo-badge {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          color: white;
          font-size: 16px;
          font-weight: bold;
          flex-shrink: 0;
        }

        .item-details {
          flex: 1;
        }

        .item-descricao {
          margin: 0 0 4px 0;
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        .item-meta {
          margin: 0;
          font-size: 12px;
          color: #999;
        }

        .item-actions {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .btn-revert {
          padding: 6px 12px;
          background-color: #f59e0b;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: background-color 0.3s;
        }

        .btn-revert:hover {
          background-color: #d97706;
        }

        .expand-icon {
          color: #999;
          font-size: 12px;
        }

        .historico-item-details {
          padding: 15px;
          background-color: #fafafa;
          border-top: 1px solid #e0e0e0;
        }

        .detail-row {
          display: flex;
          margin-bottom: 10px;
          font-size: 13px;
        }

        .detail-row.revertido {
          background-color: #fffbeb;
          padding: 8px;
          border-radius: 4px;
          color: #d97706;
        }

        .label {
          font-weight: 600;
          color: #666;
          min-width: 150px;
        }

        .value {
          color: #333;
          word-break: break-all;
        }

        .valor-anterior {
          color: #ef4444;
        }

        .valor-novo {
          color: #22c55e;\n        }

        .campos-alterados {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e0e0e0;
        }

        .campos-alterados h4 {
          margin: 0 0 10px 0;
          font-size: 13px;
          color: #333;
        }

        .campos-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
        }

        .campos-table th {
          background-color: #e0e0e0;
          padding: 8px;
          text-align: left;
          font-weight: 600;
          color: #333;
        }

        .campos-table td {
          padding: 8px;
          border-bottom: 1px solid #e0e0e0;
        }
      `}</style>
    </div>
  );
};

export default HistoricoAlteracoes;

