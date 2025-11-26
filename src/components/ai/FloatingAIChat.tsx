import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DELAY_API_SIMULATION } from "@/lib/constants";
import { Bot, Send, Minimize2, X, BookOpenText } from "lucide-react";
import { Mascot } from "@/components/ui/mascot";
import { Mascots } from "@/assets/maplebear";
import { Badge } from "@/components/ui/badge";
import {
  loadSchoolData,
  findSchoolFromMessage,
  buildSchoolSafSummary,
  type SchoolData,
  resolveFieldFromQuestion,
  formatSingleFieldAnswer,
  formatMultipleFieldAnswers,
  getSchoolDataLastUpdated,
  formatSchoolHighlights,
  searchSchoolsByCluster,
  searchSchoolsByState,
  formatTopSchoolsList,
  summarizeSchoolsByCluster,
  summarizeSchoolsBySafAgent,
} from "@/lib/schoolDataQuery";
import {
  getStoredKnowledgeItems,
  subscribeToKnowledgeBase,
  buildKnowledgeSummaries,
} from "@/lib/knowledgeBase";
import type {
  KnowledgeAttachmentSummary,
  KnowledgeItem,
} from "@/types/knowledge";
import {
  loadDashboardBIContext,
  buildBIAnswer,
  resolveSchoolPanelSource,
  type DashboardBIContext,
} from "@/lib/ai/dashboardInsights";
import { useAuthStore } from "@/stores/authStore";
import { useTicketStore } from "@/stores/ticketStore";
import { differenceInCalendarDays, format } from "date-fns";

type ResponseOrigin = "api" | "bi" | "knowledge" | "school" | "offline" | "tickets";

interface ChatMessage {
  id: string;
  content: string;
  role: "user" | "assistant";
  timestamp: Date;
  sources?: KnowledgeAttachmentSummary[];
  sourceLabel?: string;
  origin?: ResponseOrigin;
}

const BI_DATA_SOURCES: KnowledgeAttachmentSummary[] = [];
const ORIGIN_LABEL: Record<ResponseOrigin, string> = {
  api: "IA com dados (backend)",
  bi: "Dados do Painel SAF",
  knowledge: "Base de conhecimento",
  school: "Dados de escolas",
  tickets: "Dados de tickets",
  offline: "Simulado",
};

const FloatingAIChat = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
  const tickets = useTicketStore((state) => state.tickets);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      content:
        "Pronto para ajudar com dados do SAF (licenças, escolas, usuários, métricas, agenda) ou melhorar um texto. O que precisa?",
      role: "assistant",
      timestamp: new Date(),
      origin: "offline",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [schoolDataLoaded, setSchoolDataLoaded] = useState(false);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [dashboardContext, setDashboardContext] =
    useState<DashboardBIContext | null>(null);
  const panelSchoolBasePath =
    import.meta.env.VITE_PANEL_SCHOOL_BASE_PATH || "";
  const [schoolLoadError, setSchoolLoadError] = useState<string | null>(null);
  const [lastSchoolUpdated, setLastSchoolUpdated] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const STORAGE_KEY = "saf_ai_chat_history";

  const normalize = (text: string) =>
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();

  const getUserKey = () => {
    if (!currentUser) return STORAGE_KEY;
    const base = currentUser.email || currentUser.name || currentUser.id;
    return `${STORAGE_KEY}:${base}`;
  };

  const loadPersistedMessages = () => {
    const key = getUserKey();
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Array<Omit<ChatMessage, "timestamp"> & { timestamp: string }>;
      return parsed.map((m) => ({ ...m, timestamp: new Date(m.timestamp) }));
    } catch (error) {
      console.warn("Erro ao ler histórico do chat:", error);
      return null;
    }
  };

  const persistMessages = (items: ChatMessage[]) => {
    const key = getUserKey();
    try {
      const serializable = items.map((m) => ({
        ...m,
        timestamp: m.timestamp.toISOString(),
      }));
      localStorage.setItem(key, JSON.stringify(serializable));
    } catch (error) {
      console.warn("Erro ao salvar histórico do chat:", error);
    }
  };

  const summarizeTicketsForSchool = (school: SchoolData): string | null => {
    const normalizedSchool = normalize(school["Nome da Escola"] as string);
    const schoolId = school["ID da Escola"] ? String(school["ID da Escola"]) : null;

    const matches = tickets.filter((t) => {
      const obs = normalize(t.observacao || "");
      const hasName = obs.includes(normalizedSchool);
      const hasId = schoolId ? obs.includes(schoolId) : false;
      return hasName || hasId;
    });

    if (!matches.length) return null;

    const sorted = [...matches].sort((a, b) => b.diasAberto - a.diasAberto);
    const top = sorted.slice(0, 3);
    const list = top
      .map((t) => `${t.id} (${t.agente}) - ${t.diasAberto}d${t.observacao ? ` | ${truncateObservation(t.observacao, 60)}` : ""}`)
      .join("; ");

    return `${matches.length} ticket(s) vinculados à escola (match na observação): ${list}`;
  };

  const userDisplayName =
    currentUser?.name ||
    (currentUser?.email ? currentUser.email.split("@")[0] : null);

  const normalizeTicketId = (value: string) =>
    value.startsWith("#") ? value : `#${value}`;

  const extractTicketIdFromMessage = (message: string): string | null => {
    const lowerMessage = message.toLowerCase();
    const onlyId = /^#?\d{3,}$/.test(message.trim());
    const hasTicketContext =
      lowerMessage.includes("ticket") ||
      lowerMessage.includes("chamado") ||
      lowerMessage.includes("id");

    if (!hasTicketContext && !message.includes("#") && !onlyId) {
      return null;
    }

    const match = message.match(/#?\d{3,}/);
    if (!match) return null;
    const numericId = match[0].replace("#", "");
    return normalizeTicketId(numericId);
  };

  const truncateObservation = (text: string, max = 120) =>
    text.length > max ? `${text.slice(0, max).trim()}...` : text;

  const buildTicketAnswer = (message: string): string | null => {
    const ticketId = extractTicketIdFromMessage(message);
    if (!ticketId) return null;

    const ticket = tickets.find(
      (item) => normalizeTicketId(item.id).toLowerCase() === ticketId.toLowerCase()
    );

    if (!ticket) {
      return `Nao encontrei o ticket ${ticketId} na fila atual. Confirme o ID ou cadastre o chamado.`;
    }

    const createdAt = new Date(ticket.createdAt);
    const referenceDate = ticket.resolvedAt ? new Date(ticket.resolvedAt) : new Date();
    const daysOpen = Math.max(0, differenceInCalendarDays(referenceDate, createdAt));
    const diasPendente =
      ticket.status === "Resolvido"
        ? daysOpen
        : Math.max(ticket.diasAberto ?? 0, daysOpen);

    const statusText =
      ticket.status === "Resolvido"
        ? "resolvido"
        : ticket.status === "Em andamento"
        ? "em andamento"
        : "pendente";

    const metaParts: string[] = [];
    if (ticket.slaDias) metaParts.push(`SLA ${ticket.slaDias}d`);
    if (ticket.dueDate) metaParts.push(`vence em ${format(new Date(ticket.dueDate), "dd/MM")}`);
    const metaInfo = metaParts.length ? ` (${metaParts.join(" | ")})` : "";
    const obs = ticket.observacao ? ` Obs: ${ticket.observacao}` : "";

    if (ticket.status === "Resolvido") {
      return `Ticket ${ticket.id} foi ${statusText} por ${ticket.agente}. Ficou aberto por ${diasPendente} dia${diasPendente === 1 ? "" : "s"}${metaInfo}.${obs}`;
    }

    return `Ticket ${ticket.id} ${statusText} com ${ticket.agente} ha ${diasPendente} dia${diasPendente === 1 ? "" : "s"}${metaInfo}.${obs}`;
  };

  const buildCriticalSummaryAnswer = (message: string): string | null => {
    const lower = message.toLowerCase();
    const wantsCritical =
      lower.includes("critico") ||
      lower.includes("critica") ||
      lower.includes("criticos");
    const wantsSummary =
      lower.includes("resumo") ||
      lower.includes("quantos") ||
      lower.includes("qts") ||
      lower.includes("quantidade");
    const mentionsPending =
      lower.includes("pendente") || lower.includes("pendentes") || lower.includes("aberto");

    if (!wantsCritical && !wantsSummary) return null;
    if (!wantsCritical && !mentionsPending) return null;

    const criticalPending = tickets.filter(
      (t) => t.diasAberto >= 15 && t.status === "Pendente"
    );

    if (!criticalPending.length) {
      return "Nenhum ticket pendente em situacao critica (>=15 dias) neste momento.";
    }

    const topList = criticalPending
      .slice()
      .sort((a, b) => b.diasAberto - a.diasAberto)
      .slice(0, 5)
      .map((t) => {
        const dueInfo = t.dueDate ? `, vence ${format(new Date(t.dueDate), "dd/MM")}` : "";
        const obsInfo = t.observacao ? ` | ${truncateObservation(t.observacao)}` : "";
        return `${t.id} (${t.agente}) - ${t.diasAberto}d${dueInfo}${obsInfo}`;
      });

    return `Ha ${criticalPending.length} tickets pendentes em situacao critica (>=15 dias). Principais: ${topList.join("; ")}.`;
  };

  // Load school data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadSchoolData();
        setLastSchoolUpdated(getSchoolDataLastUpdated());
        setSchoolDataLoaded(true);
        setSchoolLoadError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("Erro ao carregar dados das escolas:", message);
        setSchoolLoadError(message);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    setKnowledgeItems(getStoredKnowledgeItems());
    const unsubscribe = subscribeToKnowledgeBase(setKnowledgeItems);
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  useEffect(() => {
    let active = true;
    loadDashboardBIContext()
      .then((context) => {
        if (active) {
          setDashboardContext(context);
        }
      })
      .catch((error) => {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("Erro ao carregar contexto de BI:", message);
      });

    return () => {
      active = false;
    };
  }, []);

  // Personalize greeting with user name when available
  useEffect(() => {
    setMessages((prev) => {
      if (!prev.length || prev[0].role !== "assistant") return prev;
      const personalizedGreeting = userDisplayName
        ? `Oi, ${userDisplayName}. Dados do SAF (licenças, escolas, usuários, métricas, agenda) ou melhorar um texto?`
        : `Pronto para ajudar com dados do SAF (licenças, escolas, usuários, métricas, agenda) ou melhorar um texto.`;
      if (prev[0].content === personalizedGreeting) return prev;
      const updated = [...prev];
      updated[0] = { ...updated[0], content: personalizedGreeting };
      return updated;
    });
  }, [userDisplayName]);

  // Carregar histórico do usuário
  useEffect(() => {
    const persisted = loadPersistedMessages();
    if (persisted && persisted.length) {
      setMessages(persisted);
    }
  }, [currentUser?.email, currentUser?.id, currentUser?.name]);

  // Persistir histórico do usuário
  useEffect(() => {
    if (!messages.length) return;
    persistMessages(messages);
  }, [messages, currentUser?.email, currentUser?.id, currentUser?.name]);

  // Foco no input quando abrir
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // ESC para minimizar/fechar
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isOpen && !isMinimized) {
          setIsMinimized(true);
        } else if (isOpen) {
          setIsOpen(false);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, isMinimized]);

  const clearHistory = () => {
    setMessages([
      {
        id: "1",
        content:
          "Pronto para ajudar com dados do SAF (licenças, escolas, usuários, métricas, agenda) ou melhorar um texto. O que precisa?",
        role: "assistant",
        timestamp: new Date(),
        origin: "offline",
      },
    ]);
  };

  const ensureDashboardContext =
    async (): Promise<DashboardBIContext | null> => {
      if (dashboardContext) {
        return dashboardContext;
      }
      const context = await loadDashboardBIContext();
      setDashboardContext(context);
      return context;
    };

  const sendMessage = async (customText?: string) => {
    const messageText = (customText ?? inputValue).trim();
    if (!messageText) {
      return;
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: messageText,
      role: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      let response: string | null = null;
      let knowledgeContext: KnowledgeAttachmentSummary[] = [];
      let knowledgeUsed = false;
      let dataSourcesUsed: KnowledgeAttachmentSummary[] = [];
      let origin: ResponseOrigin | undefined;
      let sourceLabel: string | undefined;

      // 1. Tickets (local)
      const ticketAnswer = buildTicketAnswer(messageText);
      if (ticketAnswer) {
        response = ticketAnswer;
        origin = "tickets";
      }

      if (!response) {
        const criticalSummary = buildCriticalSummaryAnswer(messageText);
        if (criticalSummary) {
          response = criticalSummary;
          origin = "tickets";
        }
      }

      // 2. Direct school data (local)
      if (!response && schoolDataLoaded) {
        const schoolResponse = await querySchoolData(messageText);
        if (schoolResponse) {
          response = schoolResponse;
          origin = "school";
        }
      }

      // 3. Local BI (CSV/JSON)
      if (!response) {
        const context = await ensureDashboardContext();
        if (context) {
          const biAnswer = buildBIAnswer(messageText, context);
          if (biAnswer) {
            response = biAnswer;
            origin = "bi";
            sourceLabel = "Fontes (Painel de escolas/licenças SAF)";

            const schoolPanelSource = resolveSchoolPanelSource(
              messageText,
              context,
              panelSchoolBasePath
            );
            if (schoolPanelSource) {
              dataSourcesUsed = [
                {
                  id: `school-panel-${schoolPanelSource.id}`,
                  title: schoolPanelSource.title,
                  category: "dados",
                  tags: ["painel", "escola"],
                  summary: schoolPanelSource.summary,
                  url: schoolPanelSource.url,
                },
                ...dataSourcesUsed,
              ];
            }
          }
        }
      }

      // 4. Backend AI with knowledge
      if (!response) {
        knowledgeContext = buildKnowledgeSummaries(messageText, knowledgeItems);
        try {
          response = await callOpenAI(messageText, knowledgeContext);
          knowledgeUsed = knowledgeContext.length > 0;
          origin = knowledgeUsed ? "knowledge" : "api";
          if (knowledgeUsed) {
            sourceLabel = "Fontes (base de conhecimento)";
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : "Erro desconhecido";
          console.error("Erro ao consultar OpenAI:", message);
          response = await simulateAIResponse(messageText);
          origin = "offline";
        }
      }

      const sources: KnowledgeAttachmentSummary[] = [];
      if (knowledgeUsed && knowledgeContext.length) {
        sources.push(...knowledgeContext);
        sourceLabel = sourceLabel || "Fontes (base de conhecimento)";
      }
      if (dataSourcesUsed.length) {
        sources.push(...dataSourcesUsed);
        sourceLabel = sourceLabel || "Fontes (Painel de escolas/licenças SAF)";
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response ?? "Não consegui processar sua pergunta neste momento.",
        role: "assistant",
        timestamp: new Date(),
        sources: sources.length ? sources : undefined,
        sourceLabel,
        origin,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro desconhecido";
      console.error("Erro ao processar chat:", message);
      const errorChatMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content:
          "Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
        role: "assistant",
        timestamp: new Date(),
        origin: "offline",
      };
      setMessages((prev) => [...prev, errorChatMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Local RAG for schools
  const querySchoolData = async (message: string): Promise<string | null> => {
    const lowerMessage = message.toLowerCase();

    if (!schoolDataLoaded) {
      return "Ainda carregando dados oficiais das escolas... tente novamente em alguns segundos.";
    }

    const wantsResponsible =
      lowerMessage.includes("responsavel") ||
      lowerMessage.includes("responsável") ||
      lowerMessage.includes("carteira saf") ||
      lowerMessage.includes("consultor") ||
      lowerMessage.includes("time saf") ||
      lowerMessage.includes("agente saf");

    const hasSchoolIntent =
      wantsResponsible ||
      lowerMessage.includes("escola") ||
      lowerMessage.includes("unidade") ||
      lowerMessage.includes("cnpj") ||
      lowerMessage.includes("email") ||
      lowerMessage.includes("e-mail") ||
      lowerMessage.includes("ticket medio") ||
      lowerMessage.includes("ticket médio") ||
      lowerMessage.includes("ticket") ||
      lowerMessage.includes("pendencia") ||
      lowerMessage.includes("cluster") ||
      lowerMessage.includes("status") ||
      lowerMessage.includes("telefone") ||
      lowerMessage.includes("razao") ||
      lowerMessage.includes("razão") ||
      lowerMessage.includes("fantasia") ||
      lowerMessage.includes("cidade") ||
      lowerMessage.includes("estado") ||
      lowerMessage.includes("bairro") ||
      lowerMessage.includes("cep") ||
      lowerMessage.includes("logradouro") ||
      lowerMessage.includes("carteira saf") ||
      lowerMessage.includes("coordenador") ||
      lowerMessage.includes("coordenadora") ||
      lowerMessage.includes("time");

    if (!hasSchoolIntent) {
      return null;
    }

    const wantsClusterBreakdown =
      lowerMessage.includes("quant") && lowerMessage.includes("cluster");
    if (wantsClusterBreakdown) {
      return summarizeSchoolsByCluster();
    }

    const wantsAgentBreakdown =
      (lowerMessage.includes("agente") ||
        lowerMessage.includes("carteira saf") ||
        lowerMessage.includes("consultor") ||
        lowerMessage.includes("responsavel") ||
        lowerMessage.includes("responsável")) &&
      (lowerMessage.includes("quant") ||
        lowerMessage.includes("lista") ||
        lowerMessage.includes("listar") ||
        lowerMessage.includes("quais"));

    if (wantsAgentBreakdown) {
      const includeSchools =
        lowerMessage.includes("lista") ||
        lowerMessage.includes("listar") ||
        lowerMessage.includes("quais");
      return summarizeSchoolsBySafAgent({ includeSchools });
    }

    // Última atualização sem escola específica
    if (lowerMessage.includes("ultima atualizacao") || lowerMessage.includes("última atualizacao")) {
      const lastUpdated = getSchoolDataLastUpdated();
      if (lastUpdated) {
        return `Dados das escolas atualizados em ${lastUpdated}.`;
      }
    }

    // Top por cluster/estado
    const clusterMatch = message.match(/cluster\s+([a-z0-9\s]+)/i);
    if (clusterMatch) {
      const clusterValue = clusterMatch[1].trim();
      const schools = await searchSchoolsByCluster(clusterValue);
      if (schools.length) {
        return formatTopSchoolsList(schools, `cluster ${clusterValue}`);
      }
    }

    const stateMatch = message.match(/\b([A-Za-z]{2})\b/);
    if (lowerMessage.includes("estado") && stateMatch) {
      const uf = stateMatch[1].toUpperCase();
      const schools = await searchSchoolsByState(uf);
      if (schools.length) {
        return formatTopSchoolsList(schools, `estado ${uf}`);
      }
    }

    const school = await findSchoolFromMessage(message);
    if (school) {
      if (wantsResponsible) {
        return buildSchoolSafSummary(school);
      }

      const mentionsTickets =
        lowerMessage.includes("ticket") || lowerMessage.includes("pendencia");

      // Field-specific responses: return only the requested field if one is detected
      const intents = resolveFieldFromQuestion(message);
      if (intents.length) {
        const result =
          intents.length === 1
            ? formatSingleFieldAnswer(school as SchoolData, intents[0])
            : formatMultipleFieldAnswers(school as SchoolData, intents);
        const link =
          panelSchoolBasePath && school["ID da Escola"]
            ? ` (Painel: ${panelSchoolBasePath}/school/${school["ID da Escola"]})`
            : "";
        const ticketSummary = mentionsTickets
          ? summarizeTicketsForSchool(school as SchoolData) ||
            "Tickets: nenhum ticket vinculado à escola no dataset local."
          : null;
        return ticketSummary ? `${result}${link} | ${ticketSummary}` : `${result}${link}`;
      }

      const lastUpdated = getSchoolDataLastUpdated();
      const link =
        panelSchoolBasePath && school["ID da Escola"]
          ? `\nLink do painel: ${panelSchoolBasePath}/school/${school["ID da Escola"]}`
          : "";
      const freshness = lastUpdated ? `\nDados atualizados em: ${lastUpdated}` : "";
      const highlight = formatSchoolHighlights(school as SchoolData);
      const ticketSummary = mentionsTickets
        ? summarizeTicketsForSchool(school as SchoolData) ||
          "Tickets: nenhum ticket vinculado à escola no dataset local."
        : null;
      return ticketSummary
        ? `${highlight}${freshness}${link}\n${ticketSummary}`
        : `${highlight}${freshness}${link}`;
    }

    // Sugestões se não encontrar
    const data = await loadSchoolData();
    const normalizedQuery = normalize(message);
    const suggestions = data
      .map((s) => ({
        name: s["Nome da Escola"] as string,
        score: normalizedQuery.includes(normalize(String(s["Nome da Escola"] || "")))
          ? 2
          : normalize(String(s["Nome da Escola"] || "")).includes(normalizedQuery)
          ? 1
          : 0,
      }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.name);

    const suggestionText = suggestions.length
      ? `Sugestões: ${suggestions.join("; ")}.`
      : "Nenhuma sugestão de nome semelhante.";

    return `Nao localizei essa escola agora. Me envie o nome completo, cidade ou cluster para tentar de novo. ${suggestionText}`;
  };

  const callOpenAI = async (
    input: string,
    knowledge?: KnowledgeAttachmentSummary[]
  ): Promise<string> => {
    const payload: Record<string, unknown> = {
      question: input,
    };

    if (knowledge && knowledge.length) {
      payload.knowledge = knowledge;
    }

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error?.message || `Erro da API: ${response.status}`
      );
    }

    const data = await response.json();
    return data.response || "Não consegui processar sua pergunta.";
  };

  const simulateAIResponse = async (input: string): Promise<string> => {
    const offlineRewrite = (text: string) => {
      const normalized = text.replace(/\s+/g, " ").trim();
      if (!normalized) return "Envie o texto completo para que eu possa melhorar.";
      const capitalized =
        normalized.length > 1
          ? normalized[0].toUpperCase() + normalized.slice(1)
          : normalized.toUpperCase();
      const withPunctuation = /[.!?]$/.test(capitalized) ? capitalized : `${capitalized}.`;
      return withPunctuation;
    };

    await new Promise((resolve) => setTimeout(resolve, DELAY_API_SIMULATION));

    const lowerInput = input.toLowerCase();

    if (lowerInput.includes("ticket") || lowerInput.includes("chamado")) {
      return "Posso listar tickets pendentes e priorizar os críticos (ex.: acima de 15 dias). Quer ver os mais urgentes ou todos os abertos?";
    }

    if (lowerInput.includes("escola") || lowerInput.includes("unidade")) {
      return "Envie o nome completo da escola, cidade ou cluster para trazer status, cidade e cluster. Passo a passo: Escolas > filtro por nome/estado > card com status e cluster.";
    }

    if (
      lowerInput.includes("texto") ||
      lowerInput.includes("melhorar") ||
      lowerInput.includes("escrever")
    ) {
      return offlineRewrite(input);
    }

    if (lowerInput.includes("relatório") || lowerInput.includes("dashboard")) {
      return "Diga a métrica (licenças Canva, escolas, usuários, agenda) e eu mostro onde ver no SAF e como interpretar.";
    }

    if (lowerInput.includes("licença") || lowerInput.includes("licencas") || lowerInput.includes("canva")) {
      return "Consigo trazer totais, usadas, disponíveis, excesso e não conformes por escola, além de domínios autorizados e usuários vinculados. Qual dado você quer?";
    }

    return "Atendo apenas com dados do SAF: licenças Canva, escolas, usuários, métricas/dashboards, agenda ou revisão de textos. Se não houver dado no sistema, aviso que não encontrei. O que você precisa?";
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handlePrepareImprove = () => {
    const prefix = "Melhore este texto: ";
    if (!inputValue.trim()) {
      setInputValue(prefix);
      inputRef.current?.focus();
      return;
    }
    if (!inputValue.toLowerCase().includes("melhore este texto")) {
      setInputValue(`${prefix}${inputValue}`);
    }
    inputRef.current?.focus();
  };

  const renderOriginBadge = (_origin?: ResponseOrigin) => null;

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          aria-label="Abrir chat"
          onClick={() => setIsOpen(true)}
          size="lg"
          className="rounded-full h-16 w-16 shadow-lg hover:shadow-xl transition-all duration-300 bg-white hover:bg-gray-50 p-0"
        >
          <Mascot src={Mascots.Happy} size="md" alt="Assistente IA" animated />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50"
      style={{ width: "300px", maxWidth: "78vw" }}
    >
      <Card
        className="shadow-2xl transition-all duration-300"
        style={!isMinimized ? { height: "65vh" } : { height: "3.5rem" }}
      >
        <CardHeader className="flex flex-row items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 text-base whitespace-nowrap">
            <Bot className="h-6 w-6 text-primary" />
            <CardTitle className="text-base font-semibold">Assistente SAF</CardTitle>
            <Badge variant="default" className="text-[8px] px-1 py-0.5 leading-none">
              ChatGPT 4.1
            </Badge>
            {/* badge removido a pedido do usuário */}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              aria-label="Limpar histórico"
              onClick={clearHistory}
              className="text-xs"
            >
              Limpar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              aria-label="Fechar chat"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent
            className="flex flex-col px-4 pb-4 pt-1"
            style={{ height: "58vh" }}
          >
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-[13px] ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "assistant" && renderOriginBadge(message.origin)}
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                    {message.role === "assistant" && message.sources?.length ? (
                      <div className="mt-2 space-y-1">
                        <p className="text-[11px] font-semibold uppercase text-primary flex items-center gap-1">
                          <BookOpenText className="h-3 w-3" />
                          {message.sourceLabel || "Fontes usadas"}
                        </p>
                      <div className="flex flex-wrap gap-1">
                        {message.sources.map((source) => (
                          <Badge
                            key={`${message.id}-${source.id}`}
                            variant="outline"
                            className="text-[11px] flex items-center gap-1"
                          >
                            {source.url ? (
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="underline underline-offset-2"
                              >
                                {source.title}
                              </a>
                            ) : (
                              <span>{source.title}</span>
                            )}
                          </Badge>
                        ))}
                      </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="flex gap-3 items-start">
              <Input
                ref={inputRef}
                aria-label="Mensagem do chat"
                placeholder="Digite sua pergunta ou cole o texto para melhorar..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1 text-sm px-3 py-3"
              />
              <div className="flex flex-col gap-1 justify-between">
                <Button
                  aria-label="Enviar mensagem"
                  onClick={() => sendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  isLoading={isLoading}
                  className="h-9 px-3"
                >
                  {!isLoading && <Send className="h-4 w-4" />}
                </Button>
                <Button
                  aria-label="Preparar melhoria de texto"
                  variant="ghost"
                  size="sm"
                  onClick={handlePrepareImprove}
                  disabled={isLoading}
                  className="text-xs h-8 px-2"
                >
                  Preparar melhoria
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default FloatingAIChat;
