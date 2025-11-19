export type KnowledgeStatus = 'ativo' | 'rascunho' | 'arquivado';
export type KnowledgePriority = 'alta' | 'media' | 'baixa';

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  status: KnowledgeStatus;
  priority: KnowledgePriority;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  usageCount: number;
  sourceFileName?: string;
}

export interface KnowledgeAttachmentSummary {
  id: string;
  title: string;
  category: string;
  tags: string[];
  summary: string;
}

export interface AIPrompt {
  id: string;
  name: string;
  prompt: string;
  category: string;
  isActive: boolean;
  usageCount: number;
  createdAt: string;
}
