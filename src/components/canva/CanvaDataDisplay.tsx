import { useState, useCallback } from 'react';
import { canvaCollector, CanvaData, CanvaHistorico } from '@/lib/canvaDataCollector';
import { useAutoRefresh } from '@/hooks/useAutoRefresh';

/**
 * Componente para exibir os dados do Canva e o historico de alteracoes
 */
export const CanvaDataDisplay = () => {
  const [canvaData, setCanvaData] = useState<CanvaData | null>(null);
  const [historico, setHistorico] = useState<CanvaHistorico[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
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
      // Recarrega o historico
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
      setError(err instanceof Error ? err.message : 'Erro ao reverter alteracao');
    }
  };

  return (
    <div className="canva-data-display">
      <div className="canva-header">
        <h2>Gestao Canva</h2>
        <button onClick={coletarDadosAgora} disabled={loading} className="btn-primary">
          {loading ? 'Coletando...' : 'Coletar Dados Agora'}
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {canvaData && (
        <div className="canva-info">
          <div className="info-card">
            <h3>Total de Pessoas</h3>
            <p className="big-number">{canvaData.totalPessoas}</p>
            <p className="info-text">
              Ultima atualizacao: {canvaData.dataAtualizacao} as {canvaData.horaAtualizacao}
            </p>
          </div>
        </div>
      )}

      <div className="historico-section">
        <h3>Historico de Alteracoes</h3>
        {historico.length === 0 ? (
          <p>Nenhuma alteracao registrada para esta escola</p>
        ) : (
          <table className="historico-table">
            <thead>
              <tr>
                <th>Data</th>
                <th>Hora</th>
                <th>Pessoas</th>
                <th>Mudanca</th>
                <th>Usuario</th>
                <th>Descricao</th>
                <th>Acao</th>
              </tr>
            </thead>
        <tbody>
          {historico.map((item) => {
            const pessoasDelta = item.mudancas?.totalPessoas ?? 0;
            const deltaClass = pessoasDelta > 0 ? 'positive' : pessoasDelta < 0 ? 'negative' : '';
            const deltaLabel = pessoasDelta !== 0 ? `${pessoasDelta > 0 ? '+' : ''}${pessoasDelta}` : '0';
            const snapshot = item.data ?? { totalPessoas: item.totalPessoas, designsCriados: item.designsCriados };

            return (
              <tr key={item.id}>
                <td>{item.dataAtualizacao}</td>
                <td>{item.horaAtualizacao}</td>
                <td>{snapshot.totalPessoas}</td>
                <td className={deltaClass}>{deltaLabel}</td>
                <td>{item.usuarioAlteracao}</td>
                <td>{item.descricaoAlteracao}</td>
                <td>
                  <button
                    onClick={() => reverterAlteracao(item.id)}
                    className="btn-revert"
                    title="Reverter esta alteracao"
                  >
                    Reverter
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
          </table>
        )}
      </div>

      <style>{`
        .canva-data-display {
          padding: 20px;
          background-color: #f5f5f5;
          border-radius: 8px;
          margin: 20px 0;
        }

        .canva-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .canva-header h2 {
          margin: 0;
          font-size: 24px;
          color: #333;
        }

        .btn-primary {
          padding: 10px 20px;
          background-color: #7c3aed;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          transition: background-color 0.3s;
        }

        .btn-primary:hover:not(:disabled) {
          background-color: #6d28d9;
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .error-message {
          padding: 12px;
          background-color: #fee;
          color: #c33;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .canva-info {
          margin-bottom: 30px;
        }

        .info-card {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .info-card h3 {
          margin: 0 0 10px 0;
          font-size: 16px;
          color: #666;
        }

        .big-number {
          margin: 10px 0;
          font-size: 48px;
          font-weight: bold;
          color: #7c3aed;
        }

        .info-text {
          margin: 10px 0 0 0;
          font-size: 12px;
          color: #999;
        }

        .historico-section {
          background-color: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .historico-section h3 {
          margin: 0 0 15px 0;
          font-size: 18px;
          color: #333;
        }

        .historico-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }

        .historico-table thead {
          background-color: #f9f9f9;
        }

        .historico-table th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #333;
          border-bottom: 2px solid #e0e0e0;
        }

        .historico-table td {
          padding: 12px;
          border-bottom: 1px solid #e0e0e0;
        }

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
      `}</style>
    </div>
  );
};

export default CanvaDataDisplay;
