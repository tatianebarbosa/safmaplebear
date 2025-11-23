import type { TimeSeriesPoint } from "@/lib/canvaUsageService";

/**
 * Remove pontos antigos (ex.: ano 2024) para evitar compressão visual nos gráficos.
 * Mantém a série original se o filtro zerar os dados.
 */
export const filterRecentTimeSeries = (series: TimeSeriesPoint[]): TimeSeriesPoint[] => {
  const filtered = series.filter((point) => {
    const match = point.period.match(/20\d{2}/);
    const year = match ? Number(match[0]) : undefined;
    return year === undefined || year >= 2025;
  });

  return filtered.length > 0 ? filtered : series;
};
