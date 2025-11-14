/**
 * Componente de indicador visual para auto-refresh
 * 
 * Mostra ao usuário quando foi a última atualização e quando será a próxima
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

interface AutoRefreshIndicatorProps {
  /**
   * Última vez que os dados foram atualizados
   */
  lastRefresh?: Date | null;
  
  /**
   * Intervalo de refresh em milissegundos
   */
  interval: number;
  
  /**
   * Se o auto-refresh está ativo
   */
  isActive?: boolean;
}

export const AutoRefreshIndicator: React.FC<AutoRefreshIndicatorProps> = ({
  lastRefresh,
  interval,
  isActive = true
}) => {
  const [timeUntilNext, setTimeUntilNext] = useState<number>(interval);

  useEffect(() => {
    if (!isActive || !lastRefresh) return;

    const updateTimer = setInterval(() => {
      const elapsed = Date.now() - lastRefresh.getTime();
      const remaining = Math.max(0, interval - elapsed);
      setTimeUntilNext(remaining);
    }, 1000);

    return () => clearInterval(updateTimer);
  }, [lastRefresh, interval, isActive]);

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <RefreshCw className="h-3 w-3" />
      <span>
        Próxima atualização em {formatTime(timeUntilNext)}
      </span>
    </div>
  );
};

export default AutoRefreshIndicator;
