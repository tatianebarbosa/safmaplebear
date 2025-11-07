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
                    <span className="value\">{registro.data} às {registro.hora}</span>\n                  </div>\n                  {registro.ipAddress && (\n                    <div className=\"detail-row\">\n                      <span className=\"label\">IP Address:</span>\n                      <span className=\"value\">{registro.ipAddress}</span>\n                    </div>\n                  )}\n                  {registro.camposAlterados && registro.camposAlterados.length > 0 && (\n                    <div className=\"campos-alterados\">\n                      <h4>Campos Alterados:</h4>\n                      <table className=\"campos-table\">\n                        <thead>\n                          <tr>\n                            <th>Campo</th>\n                            <th>Valor Anterior</th>\n                            <th>Valor Novo</th>\n                          </tr>\n                        </thead>\n                        <tbody>\n                          {registro.camposAlterados.map((campo, idx) => (\n                            <tr key={idx}>\n                              <td>{campo.campo}</td>\n                              <td className=\"valor-anterior\">{JSON.stringify(campo.valorAnterior)}</td>\n                              <td className=\"valor-novo\">{JSON.stringify(campo.valorNovo)}</td>\n                            </tr>\n                          ))}\n                        </tbody>\n                      </table>\n                    </div>\n                  )}\n                  {registro.idReversao && (\n                    <div className=\"detail-row revertido\">\n                      <span className=\"label\">Revertido por:</span>\n                      <span className=\"value\">{registro.idReversao}</span>\n                    </div>\n                  )}\n                </div>\n              )}\n            </div>\n          ))}\n        </div>\n      )}\n\n      <style>{`\n        .historico-alteracoes {\n          background-color: white;\n          border-radius: 8px;\n          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);\n          padding: 20px;\n          margin-top: 20px;\n        }\n\n        .historico-header {\n          display: flex;\n          justify-content: space-between;\n          align-items: center;\n          margin-bottom: 20px;\n          border-bottom: 2px solid #e0e0e0;\n          padding-bottom: 15px;\n        }\n\n        .historico-header h3 {\n          margin: 0;\n          font-size: 18px;\n          color: #333;\n        }\n\n        .btn-refresh {\n          padding: 8px 16px;\n          background-color: #3b82f6;\n          color: white;\n          border: none;\n          border-radius: 4px;\n          cursor: pointer;\n          font-size: 13px;\n          transition: background-color 0.3s;\n        }\n\n        .btn-refresh:hover {\n          background-color: #2563eb;\n        }\n\n        .error-message {\n          padding: 12px;\n          background-color: #fee;\n          color: #c33;\n          border-radius: 4px;\n          margin-bottom: 15px;\n        }\n\n        .no-data {\n          padding: 20px;\n          text-align: center;\n          color: #999;\n          font-size: 14px;\n        }\n\n        .historico-loading {\n          padding: 20px;\n          text-align: center;\n          color: #666;\n        }\n\n        .historico-list {\n          display: flex;\n          flex-direction: column;\n          gap: 10px;\n        }\n\n        .historico-item {\n          border: 1px solid #e0e0e0;\n          border-radius: 6px;\n          overflow: hidden;\n          transition: all 0.3s;\n        }\n\n        .historico-item:hover {\n          border-color: #3b82f6;\n          box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);\n        }\n\n        .historico-item-header {\n          display: flex;\n          justify-content: space-between;\n          align-items: center;\n          padding: 12px;\n          cursor: pointer;\n          background-color: #f9f9f9;\n          transition: background-color 0.3s;\n        }\n\n        .historico-item-header:hover {\n          background-color: #f0f0f0;\n        }\n\n        .item-info {\n          display: flex;\n          align-items: flex-start;\n          gap: 12px;\n          flex: 1;\n        }\n\n        .tipo-badge {\n          display: flex;\n          align-items: center;\n          justify-content: center;\n          width: 32px;\n          height: 32px;\n          border-radius: 50%;\n          color: white;\n          font-size: 16px;\n          font-weight: bold;\n          flex-shrink: 0;\n        }\n\n        .item-details {\n          flex: 1;\n        }\n\n        .item-descricao {\n          margin: 0 0 4px 0;\n          font-size: 14px;\n          font-weight: 600;\n          color: #333;\n        }\n\n        .item-meta {\n          margin: 0;\n          font-size: 12px;\n          color: #999;\n        }\n\n        .item-actions {\n          display: flex;\n          align-items: center;\n          gap: 10px;\n        }\n\n        .btn-revert {\n          padding: 6px 12px;\n          background-color: #f59e0b;\n          color: white;\n          border: none;\n          border-radius: 4px;\n          cursor: pointer;\n          font-size: 12px;\n          font-weight: 600;\n          transition: background-color 0.3s;\n        }\n\n        .btn-revert:hover {\n          background-color: #d97706;\n        }\n\n        .expand-icon {\n          color: #999;\n          font-size: 12px;\n        }\n\n        .historico-item-details {\n          padding: 15px;\n          background-color: #fafafa;\n          border-top: 1px solid #e0e0e0;\n        }\n\n        .detail-row {\n          display: flex;\n          margin-bottom: 10px;\n          font-size: 13px;\n        }\n\n        .detail-row.revertido {\n          background-color: #fffbeb;\n          padding: 8px;\n          border-radius: 4px;\n          color: #d97706;\n        }\n\n        .label {\n          font-weight: 600;\n          color: #666;\n          min-width: 150px;\n        }\n\n        .value {\n          color: #333;\n          word-break: break-all;\n        }\n\n        .valor-anterior {\n          color: #ef4444;\n        }\n\n        .valor-novo {\n          color: #22c55e;\n        }\n\n        .campos-alterados {\n          margin-top: 15px;\n          padding-top: 15px;\n          border-top: 1px solid #e0e0e0;\n        }\n\n        .campos-alterados h4 {\n          margin: 0 0 10px 0;\n          font-size: 13px;\n          color: #333;\n        }\n\n        .campos-table {\n          width: 100%;\n          border-collapse: collapse;\n          font-size: 12px;\n        }\n\n        .campos-table th {\n          background-color: #e0e0e0;\n          padding: 8px;\n          text-align: left;\n          font-weight: 600;\n          color: #333;\n        }\n\n        .campos-table td {\n          padding: 8px;\n          border-bottom: 1px solid #e0e0e0;\n        }\n      `}</style>\n    </div>\n  );\n};\n\nexport default HistoricoAlteracoes;\n
