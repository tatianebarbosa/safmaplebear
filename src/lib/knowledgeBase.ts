import type { KnowledgeAttachmentSummary, KnowledgeItem } from '@/types/knowledge';

export const KNOWLEDGE_STORAGE_KEY = 'saf_knowledge_base';
export const KNOWLEDGE_UPDATED_EVENT = 'saf-knowledge-base-updated';
const DEFAULT_KNOWLEDGE_URL = '/knowledge-base/default_knowledge.json';

const stripAccents = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const extractTerms = (text: string) =>
  stripAccents(text)
    .split(/[^a-z0-9]+/i)
    .map((term) => term.trim())
    .filter((term) => term.length >= 3);

const isBrowser = typeof window !== 'undefined';

export const getStoredKnowledgeItems = (): KnowledgeItem[] => {
  if (!isBrowser) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(KNOWLEDGE_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    return JSON.parse(raw) as KnowledgeItem[];
  } catch (error) {
    console.error('Erro ao ler base de conhecimento:', error);
    return [];
  }
};

export const persistKnowledgeItems = (items: KnowledgeItem[]) => {
  if (!isBrowser) {
    return;
  }

  window.localStorage.setItem(KNOWLEDGE_STORAGE_KEY, JSON.stringify(items));
  window.dispatchEvent(
    new CustomEvent(KNOWLEDGE_UPDATED_EVENT, {
      detail: items,
    })
  );
};

export const seedKnowledgeBase = async (): Promise<KnowledgeItem[]> => {
  if (!isBrowser) {
    return [];
  }

  const existing = getStoredKnowledgeItems();
  if (existing.length > 0) {
    return existing;
  }

  try {
    const response = await fetch(DEFAULT_KNOWLEDGE_URL);
    if (!response.ok) {
      throw new Error(`Falha ao carregar conhecimento padrão (${response.status})`);
    }
    const defaultKnowledge = (await response.json()) as KnowledgeItem[];
    persistKnowledgeItems(defaultKnowledge);
    return defaultKnowledge;
  } catch (error) {
    console.warn('Não foi possível carregar base de conhecimento padrão:', error);
    return [];
  }
};

export const subscribeToKnowledgeBase = (
  callback: (items: KnowledgeItem[]) => void
): (() => void) => {
  if (!isBrowser) {
    return () => undefined;
  }

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<KnowledgeItem[]>)?.detail;
    if (detail) {
      callback(detail);
    } else {
      callback(getStoredKnowledgeItems());
    }
  };

  window.addEventListener(KNOWLEDGE_UPDATED_EVENT, handler);
  return () => window.removeEventListener(KNOWLEDGE_UPDATED_EVENT, handler);
};

export const buildKnowledgeSummaries = (
  question: string,
  items: KnowledgeItem[],
  limit = 3
): KnowledgeAttachmentSummary[] => {
  if (!question || !items.length) {
    return [];
  }

  const terms = Array.from(new Set(extractTerms(question)));
  if (!terms.length) {
    return [];
  }

  const scored = items
    .map((item) => {
      const haystack = stripAccents(
        `${item.title} ${item.content} ${item.tags.join(' ')} ${item.category}`
      );
      let score = 0;

      terms.forEach((term) => {
        if (haystack.includes(term)) {
          score += term.length >= 6 ? 2 : 1;
        }
      });

      if (score > 0) {
        if (item.priority === 'alta') score *= 1.4;
        if (item.priority === 'baixa') score *= 0.8;
      }

      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map(({ item }) => ({
    id: item.id,
    title: item.title,
    category: item.category,
    tags: item.tags,
    summary: item.content.slice(0, 600),
  }));
};
