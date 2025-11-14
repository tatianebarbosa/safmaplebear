/**
 * Hook customizado para auto-refresh de dados
 * 
 * Este hook implementa polling automático para manter os dados
 * sincronizados sem necessidade de intervenção manual do usuário.
 */

import { useEffect, useRef, useCallback } from 'react';

interface UseAutoRefreshOptions {
  /**
   * Função a ser executada no refresh
   */
  onRefresh: () => void | Promise<void>;
  
  /**
   * Intervalo em milissegundos (padrão: 5 minutos)
   */
  interval?: number;
  
  /**
   * Se o auto-refresh está habilitado (padrão: true)
   */
  enabled?: boolean;
  
  /**
   * Se deve executar imediatamente ao montar (padrão: true)
   */
  immediate?: boolean;
}

/**
 * Hook para implementar auto-refresh de dados
 * 
 * @example
 * ```tsx
 * useAutoRefresh({
 *   onRefresh: loadData,
 *   interval: 5 * 60 * 1000, // 5 minutos
 *   enabled: true
 * });
 * ```
 */
export function useAutoRefresh({
  onRefresh,
  interval = 5 * 60 * 1000, // 5 minutos por padrão
  enabled = true,
  immediate = true
}: UseAutoRefreshOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onRefreshRef = useRef(onRefresh);

  // Atualiza a referência da função de refresh
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  // Função para executar o refresh
  const executeRefresh = useCallback(async () => {
    try {
      await onRefreshRef.current();
    } catch (error) {
      console.error('[useAutoRefresh] Erro ao executar refresh:', error);
    }
  }, []);

  // Configura o intervalo de auto-refresh
  useEffect(() => {
    if (!enabled) {
      // Limpa o intervalo se desabilitado
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Executa imediatamente se configurado
    if (immediate) {
      executeRefresh();
    }

    // Configura o intervalo
    intervalRef.current = setInterval(() => {
      executeRefresh();
    }, interval);

    // Cleanup ao desmontar
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, immediate, executeRefresh]);

  return {
    /**
     * Força um refresh manual imediato
     */
    refresh: executeRefresh
  };
}

/**
 * Hook para auto-refresh com notificação visual
 * 
 * Similar ao useAutoRefresh, mas também retorna estado de loading
 */
export function useAutoRefreshWithStatus({
  onRefresh,
  interval = 5 * 60 * 1000,
  enabled = true,
  immediate = true
}: UseAutoRefreshOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const onRefreshRef = useRef(onRefresh);
  const lastRefreshRef = useRef<Date | null>(null);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const executeRefresh = useCallback(async () => {
    try {
      await onRefreshRef.current();
      lastRefreshRef.current = new Date();
    } catch (error) {
      console.error('[useAutoRefreshWithStatus] Erro ao executar refresh:', error);
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (immediate) {
      executeRefresh();
    }

    intervalRef.current = setInterval(() => {
      executeRefresh();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, immediate, executeRefresh]);

  return {
    refresh: executeRefresh,
    lastRefresh: lastRefreshRef.current
  };
}
