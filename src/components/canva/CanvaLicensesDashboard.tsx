import React, { useEffect, useState } from 'react';
import './CanvaLicensesDashboard.css';

interface LicenseData {
  totalPessoas: number;
  pessoasAtivas: number;
  pessoasInativas: number;
  dataAtualizacao: string;
  horaAtualizacao: string;
  tendencia: 'aumento' | 'reducao' | 'estavel';
  percentualMudanca: number;
  historico: Array<{
    data: string;
    quantidade: number;
  }>;
}

interface CanvaLicensesDashboardProps {
  dados?: LicenseData;
  loading?: boolean;
  onRefresh?: () => void;
}

/**
 * Dashboard moderno e profissional para gerenciamento de licenças Canva
 */
export const CanvaLicensesDashboard: React.FC<CanvaLicensesDashboardProps> = ({
  dados,
  loading = false,
  onRefresh,
}) => {
  const [animateCount, setAnimateCount] = useState(false);

  useEffect(() => {
    setAnimateCount(true);
  }, [dados?.totalPessoas]);

  const getTendenciaIcon = () => {
    switch (dados?.tendencia) {
      case 'aumento':
        return '📈';
      case 'reducao':
        return '📉';
      default:
        return '→';
    }
  };

  const getTendenciaColor = () => {
    switch (dados?.tendencia) {
      case 'aumento':
        return '#10b981';
      case 'reducao':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const percentualUso = dados
    ? Math.round((dados.pessoasAtivas / dados.totalPessoas) * 100)
    : 0;

  return (
    <div className="canva-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-title">
            <div className="logo-canva">🎨</div>
            <div>
              <h1>Gestão de Licenças Canva</h1>
              <p>Monitoramento centralizado de usuários e licenças</p>
            </div>
          </div>
          <button
            className={`btn-refresh ${loading ? 'loading' : ''}`}
            onClick={onRefresh}
            disabled={loading}
            title="Atualizar dados do Canva"
          >
            {loading ? '⟳ Atualizando...' : '🔄 Atualizar Agora'}
          </button>
        </div>
      </div>

      {/* Main Cards Grid */}
      <div className="dashboard-grid">
        {/* Total de Pessoas Card */}
        <div className="card card-primary">
          <div className="card-header">
            <h3>Total de Usuários</h3>
            <span className="card-icon">👥</span>
          </div>
          <div className={`card-value ${animateCount ? 'animate' : ''}`}>
            {loading ? (
              <div className="skeleton-loader"></div>
            ) : (
              <>
                <div className="number">{dados?.totalPessoas || 0}</div>
                <div className="label">pessoas ativas</div>
              </>
            )}
          </div>
          <div className="card-footer">
            <span className="tendencia" style={{ color: getTendenciaColor() }}>
              {getTendenciaIcon()} {Math.abs(dados?.percentualMudanca || 0)}% em relação ao mês anterior
            </span>
          </div>
        </div>

        {/* Pessoas Ativas Card */}
        <div className="card card-success">
          <div className="card-header">
            <h3>Pessoas Ativas</h3>
            <span className="card-icon">✅</span>
          </div>
          <div className="card-value">
            {loading ? (
              <div className="skeleton-loader"></div>
            ) : (
              <>
                <div className="number">{dados?.pessoasAtivas || 0}</div>
                <div className="label">
                  {percentualUso}% do total
                </div>
              </>
            )}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${percentualUso}%` }}
            ></div>
          </div>
        </div>

        {/* Pessoas Inativas Card */}
        <div className="card card-warning">
          <div className="card-header">
            <h3>Pessoas Inativas</h3>
            <span className="card-icon">⏸️</span>
          </div>
          <div className="card-value">
            {loading ? (
              <div className="skeleton-loader"></div>
            ) : (
              <>
                <div className="number">{dados?.pessoasInativas || 0}</div>
                <div className="label">
                  {100 - percentualUso}% do total
                </div>
              </>
            )}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill inactive"
              style={{ width: `${100 - percentualUso}%` }}
            ></div>
          </div>
        </div>

        {/* Última Atualização Card */}
        <div className="card card-info">
          <div className="card-header">
            <h3>Última Atualização</h3>
            <span className="card-icon">⏰</span>
          </div>
          <div className="card-value">
            {loading ? (
              <div className="skeleton-loader"></div>
            ) : (
              <>
                <div className="date-time">
                  <div className="date">{dados?.dataAtualizacao}</div>
                  <div className="time">{dados?.horaAtualizacao}</div>
                </div>
              </>
            )}
          </div>
          <div className="card-footer">
            <span className="status-badge active">● Sincronizado</span>
          </div>
        </div>
      </div>

      {/* Histórico Chart */}
      {dados?.historico && dados.historico.length > 0 && (
        <div className="card card-chart">
          <div className="card-header">
            <h3>Histórico de Usuários (Últimos 7 dias)</h3>
            <span className="card-icon">📊</span>
          </div>
          <div className="chart-container">
            <div className="chart-bars">
              {dados.historico.map((item, index) => {
                const maxValue = Math.max(...dados.historico.map(h => h.quantidade));
                const height = (item.quantidade / maxValue) * 100;
                return (
                  <div key={index} className="chart-bar-wrapper">
                    <div
                      className="chart-bar"
                      style={{ height: `${height}%` }}
                      title={`${item.data}: ${item.quantidade} usuários`}
                    ></div>
                    <div className="chart-label">{item.data}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-btn action-btn-primary">
          📥 Exportar Relatório
        </button>
        <button className="action-btn action-btn-secondary">
          ⚙️ Configurações
        </button>
        <button className="action-btn action-btn-tertiary">
          📞 Suporte Canva
        </button>
      </div>

      {/* Info Box */}
      <div className="info-box">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <h4>Dica Profissional</h4>
          <p>
            Os dados de licenças são sincronizados automaticamente a cada hora. Para uma sincronização manual, clique no botão "Atualizar Agora" acima.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CanvaLicensesDashboard;
