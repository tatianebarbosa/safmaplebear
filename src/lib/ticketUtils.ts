export const normalizeTicketId = (value?: string): string => {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
};

export const hasTicketId = (value?: string): boolean => {
  return Boolean((value || '').trim());
};
