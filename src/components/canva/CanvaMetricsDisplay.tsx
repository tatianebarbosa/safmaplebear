import React, { useState } from 'react';
import { canvaCollector, CanvaData, CanvaHistorico } from '@/lib/canvaDataCollector';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

/**
 * Componente para exibir todas as métricas do Canva de forma profissional
 */
export const CanvaMetricsDisplay: React.FC = () => {
  const [canvaData, setCanvaData] = useState<CanvaData | null>(null);
  const [historico, setHistorico] = useState<CanvaHistorico[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarDados = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dados = await canvaCollector.obterDadosRecentes();
      if (dados) {
        setCanvaData(dados);
      }
      const hist = await canvaCollector.obterHistorico();
      setHistorico(hist);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh a cada 5 minutos
  useAutoRefresh({
    onRefresh: carregarDados,
    interval: 5 * 60 * 1000, // 5 minutos
    enabled: true,
    immediate: true
  });

  const coletarDadosAgora = async () => {
    setLoading(true);
    setError(null);
    try {
      const novosDados = await canvaCollector.coletarDadosCanva();
      setCanvaData(novosDados);
      // Recarrega o histórico
      const hist = await canvaCollector.obterHistorico();
      setHistorico(hist);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao coletar dados');
    } finally {
      setLoading(false);
    }
  };

  const reverterAlteracao = async (historicoId: string) => {
    try {
      await canvaCollector.reverterAlteracao(historicoId);
      // Recarrega os dados
      await carregarDados();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao reverter alteração');
    }
  };

  // Função para formatar números
  const formatarNumero = (num: number) => {
    return num.toLocaleString('pt-BR');
  };

  return (
    <div className="canva-metrics-display">
      <div className="metrics-header">
        <div className="header-content">
          <h2>📊 Métricas Canva</h2>
          <p className="header-subtitle">Acompanhamento em tempo real das atividades e licenças</p>
        </div>
        <button onClick={coletarDadosAgora} disabled={loading} className="btn-collect">
          {loading ? '⏳ Coletando...' : '🔄 Atualizar Agora'}
        </button>
      </div>

      {error && <div className="error-message">⚠️ {error}</div>}

      {canvaData && (
        <>
          {/* Seção de Pessoas e Licenças */}
          <div className="metrics-section">
            <h3>👥 Pessoas e Licenças</h3>
            <div className="metrics-grid">
              <div className="metric-card primary">
                <div className="metric-icon">👤</div>
                <div className="metric-content">
                  <h4>Total de Pessoas</h4>
                  <p className="metric-value">{formatarNumero(canvaData.totalPessoas)}</p>
                  <p className="metric-change">
                    {canvaData.mudancas?.totalPessoas !== undefined && (
                      <>
                        {canvaData.mudancas.totalPessoas > 0 ? '📈' : '📉'}
                        {canvaData.mudancas.totalPessoas > 0 ? '+' : ''}
                        {canvaData.mudancas.totalPessoas}
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="metric-card secondary">
                <div className="metric-icon">👨‍💼</div>
                <div className="metric-content">
                  <h4>Administradores</h4>
                  <p className="metric-value">{formatarNumero(canvaData.administradores)}</p>
                </div>
              </div>

              <div className="metric-card secondary">
                <div className="metric-icon">👨‍🎓</div>
                <div className="metric-content">
                  <h4>Alunos</h4>
                  <p className="metric-value">{formatarNumero(canvaData.alunos)}</p>
                </div>
              </div>

              <div className="metric-card secondary">
                <div className="metric-icon">👨‍🏫</div>
                <div className="metric-content">
                  <h4>Professores</h4>
                  <p className="metric-value">{formatarNumero(canvaData.professores)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Atividade */}
          <div className="metrics-section">
            <h3>📈 Atividade e Engajamento</h3>
            <div className="metrics-grid">
              <div className="metric-card accent">
                <div className="metric-icon">🎨</div>
                <div className="metric-content">
                  <h4>Designs Criados</h4>
                  <p className="metric-value">{formatarNumero(canvaData.designsCriados)}</p>
                  <p className="metric-change">
                    {canvaData.designsCriadosCrescimento > 0 ? '📈' : '📉'}
                    {canvaData.designsCriadosCrescimento}% últimos 30 dias
                  </p>
                </div>
              </div>

              <div className="metric-card accent">
                <div className="metric-icon">🔗</div>
                <div className="metric-content">
                  <h4>Total Publicado</h4>
                  <p className="metric-value">{formatarNumero(canvaData.totalPublicado)}</p>
                </div>
              </div>

              <div className="metric-card accent">
                <div className="metric-icon">📤</div>
                <div className="metric-content">
                  <h4>Total Compartilhado</h4>
                  <p className="metric-value">{formatarNumero(canvaData.totalCompartilhado)}</p>
                </div>
              </div>

              <div className="metric-card accent">
                <div className="metric-icon">👥</div>
                <div className="metric-content">
                  <h4>Membros Ativos</h4>
                  <p className="metric-value">{formatarNumero(canvaData.membrosAtivos)}</p>
                  <p className="metric-change">
                    {canvaData.membrosAtivosCrescimento > 0 ? '📈' : '📉'}
                    {canvaData.membrosAtivosCrescimento}% últimos 30 dias
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Seção de Kits de Marca */}
          {canvaData.totalKits > 0 && (
            <div className="metrics-section">
              <h3>🎯 Kits de Marca</h3>
              <div className="kits-info">
                <p className="kits-count">Total de Kits: <strong>{canvaData.totalKits}</strong></p>
                {canvaData.kits && canvaData.kits.length > 0 && (
                  <table className="kits-table">
                    <thead>
                      <tr>
                        <th>Kit de Marca</th>
                        <th>Aplicado</th>
                        <th>Criado</th>
                        <th>Última Atualização</th>
                      </tr>
                    </thead>
                    <tbody>
                      {canvaData.kits.map((kit, idx) => (
                        <tr key={idx}>
                          <td><strong>{kit.nome}</strong></td>
                          <td>{kit.aplicado}</td>
                          <td>{kit.criado}</td>
                          <td>{kit.ultimaAtualizacao}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Seção de Histórico */}
          <div className="metrics-section">
            <h3>📋 Histórico de Alterações</h3>
            {historico.length === 0 ? (
              <p className="no-data">Nenhuma alteração registrada</p>
            ) : (
              <table className="historico-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Hora</th>
                    <th>Pessoas</th>
                    <th>Designs</th>
                    <th>Mudança</th>
                    <th>Usuário</th>
                    <th>Descrição</th>
                    <th>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map((item) => (
                    <tr key={item.id}>
                      <td>{item.dataAtualizacao}</td>
                      <td>{item.horaAtualizacao}</td>
                      <td>{formatarNumero(item.totalPessoas)}</td>
                      <td>{formatarNumero(item.designsCriados)}</td>
                      <td className={item.mudancas?.totalPessoas ? (item.mudancas.totalPessoas > 0 ? 'positive' : 'negative') : ''}>
                        {item.mudancas?.totalPessoas ? (item.mudancas.totalPessoas > 0 ? '+' : '') + item.mudancas.totalPessoas : '-'}
                      </td>
                      <td>{item.usuarioAlteracao}</td>
                      <td>{item.descricaoAlteracao}</td>
                      <td>
                        <button
                          onClick={() => reverterAlteracao(item.id)}
                          className="btn-revert"
                          title="Reverter esta alteração"
                        >
                          ↩️ Reverter
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Informações de Atualização */}
          <div className="update-info">
            <p>✅ Última atualização: {canvaData.dataAtualizacao} às {canvaData.horaAtualizacao}</p>
          </div>
        </>
      )}

      <style>{`
        .canva-metrics-display {
          padding: 24px;
          background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
          border-radius: 12px;
          margin: 20px 0;
        }

        .metrics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .header-content h2 {
          margin: 0 0 5px 0;
          font-size: 28px;
          color: #aa0414;
        }

        .header-subtitle {
          margin: 0;
          font-size: 14px;
          color: #666;
        }

        .btn-collect {
          padding: 12px 24px;
          background: linear-gradient(135deg, #aa0414 0%, #8b030f 100%);
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(170, 4, 20, 0.3);
        }

        .btn-collect:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(170, 4, 20, 0.4);
        }

        .btn-collect:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          padding: 16px;
          background-color: #fee;
          color: #c33;
          border-left: 4px solid #c33;
          border-radius: 4px;
          margin-bottom: 20px;
          font-weight: 500;
        }

        .metrics-section {
          background: white;
          padding: 24px;
          border-radius: 8px;
          margin-bottom: 20px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .metrics-section h3 {
          margin: 0 0 20px 0;
          font-size: 20px;
          color: #333;
          border-bottom: 2px solid #aa0414;
          padding-bottom: 10px;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 16px;
        }

        .metric-card {
          padding: 20px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.3s;
          border-left: 4px solid #ededed;
        }

        .metric-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
        }

        .metric-card.primary {
          background: linear-gradient(135deg, #aa0414 0%, #8b030f 100%);
          color: white;
          border-left-color: #aa0414;
        }

        .metric-card.secondary {
          background: linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%);
          color: #333;
          border-left-color: #aa0414;
        }

        .metric-card.accent {
          background: linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%);
          color: #333;
          border-left-color: #aa0414;
        }

        .metric-icon {
          font-size: 32px;
          min-width: 50px;
          text-align: center;
        }

        .metric-content {
          flex: 1;
        }

        .metric-content h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          opacity: 0.9;
        }

        .metric-value {
          margin: 0 0 4px 0;
          font-size: 28px;
          font-weight: bold;
        }

        .metric-change {
          margin: 0;
          font-size: 12px;
          opacity: 0.8;
        }

        .kits-info {
          background: #f9f9f9;
          padding: 16px;
          border-radius: 6px;
        }

        .kits-count {
          margin: 0 0 16px 0;
          font-size: 14px;
          color: #666;
        }

        .kits-table,
        .historico-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          margin-top: 16px;
        }

        .kits-table thead,
        .historico-table thead {
          background-color: #f0f0f0;
        }

        .kits-table th,
        .historico-table th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #aa0414;
        }

        .kits-table td,
        .historico-table td {
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
        }

        .kits-table tr:hover,
        .historico-table tr:hover {
          background-color: #f9f9f9;
        }

        .positive {
          color: #22c55e;
          font-weight: 600;
        }

        .negative {
          color: #ef4444;
          font-weight: 600;
        }

        .btn-revert {
          padding: 6px 12px;
          background-color: #aa0414;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          transition: all 0.3s;
        }

        .btn-revert:hover {
          background-color: #8b030f;
          transform: scale(1.05);
        }

        .no-data {
          text-align: center;
          color: #999;
          padding: 20px;
          font-style: italic;
        }

        .update-info {
          text-align: center;
          padding: 12px;
          background: white;
          border-radius: 6px;
          font-size: 12px;
          color: #666;
          margin-top: 20px;
        }
      `}</style>
    </div>
  );
};

export default CanvaMetricsDisplay;
