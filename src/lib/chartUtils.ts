import type { TimeSeriesPoint } from "@/lib/canvaUsageService";

/**
 * Remove pontos antigos (ex.: ano 2024) para evitar compresso visual nos grficos.
 * Mantm a srie original se o filtro zerar os dados.
 */
export const filterRecentTimeSeries = (series: TimeSeriesPoint[]): TimeSeriesPoint[] => {
  const filtered = series.filter((point) => {
    const match = point.period.match(/20\d{2}/);
    const year = match ? Number(match[0]) : undefined;
    return year === undefined || year >= 2025;
  });

  const recent = filtered.length > 0 ? filtered : series;

  // Remove meses vazios no inicio/fim para evitar eixos cheios de zeros.
  let firstNonZero = -1;
  let lastNonZero = -1;

  recent.forEach((point, index) => {
    const hasData = (point.designs ?? 0) > 0;
    if (hasData && firstNonZero === -1) firstNonZero = index;
    if (hasData) lastNonZero = index;
  });

  if (firstNonZero === -1) return recent;
  return recent.slice(firstNonZero, lastNonZero + 1);
};
