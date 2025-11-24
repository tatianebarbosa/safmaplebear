import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DELAY_API_SIMULATION } from "@/lib/constants";
import { Bot, Send, Minimize2, X, BookOpenText, Sparkles } from "lucide-react";
import { Mascot } from "@/components/ui/mascot";
import { Mascots } from "@/assets/maplebear";
import { Badge } from "@/components/ui/badge";
import {
  loadSchoolData,
  searchSchoolByName,
  formatSchoolData,
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

type ResponseOrigin = "api" | "bi" | "knowledge" | "school" | "offline";

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
  offline: "Simulado",
};

const FloatingAIChat = () => {
  const currentUser = useAuthStore((state) => state.currentUser);
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

  const userDisplayName =
    currentUser?.name ||
    (currentUser?.email ? currentUser.email.split("@")[0] : null);

  // Load school data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadSchoolData();
        setSchoolDataLoaded(true);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Erro desconhecido";
        console.error("Erro ao carregar dados das escolas:", message);
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

      // 1. Direct school data (local)
      if (schoolDataLoaded) {
        const schoolResponse = await querySchoolData(messageText);
        if (schoolResponse) {
          response = schoolResponse;
          origin = "school";
        }
      }

      // 2. Local BI (CSV/JSON)
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

      // 3. Backend AI with knowledge
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

    if (
      lowerMessage.includes("escola") ||
      lowerMessage.includes("unidade") ||
      lowerMessage.includes("cnpj") ||
      lowerMessage.includes("cluster") ||
      lowerMessage.includes("status")
    ) {
      const schoolNameMatch = lowerMessage.match(
        /(escola|unidade)\s+([a-z0-9\s]+)/i
      );
      if (schoolNameMatch && schoolNameMatch[2]) {
        const schoolName = schoolNameMatch[2].trim();
        const school = await searchSchoolByName(schoolName);
        if (school) {
          return formatSchoolData(school);
        }
      }

      return "Não encontrei essa informação na base local. No sistema SAF, você pode verificar isso na tela de Licenças Canva pesquisando o nome da escola.";
    }

    return null;
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

  const handleImproveShortcut = () => {
    if (!inputValue.trim()) {
      setInputValue("Melhore este texto para resposta de ticket: ");
      return;
    }
    const prepared = `Melhore este texto para resposta de ticket: ${inputValue}`;
    sendMessage(prepared);
  };

  const renderOriginBadge = (origin?: ResponseOrigin) => {
    if (!origin) return null;
    return (
      <Badge variant="secondary" className="text-[10px] px-2 py-0">
        {ORIGIN_LABEL[origin]}
      </Badge>
    );
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
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
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 w-full max-w-[calc(100vw-2rem)] sm:w-96 sm:max-w-none">
      <Card
        className={`shadow-2xl transition-all duration-300 ${
          isMinimized ? "h-14" : "h-96"
        }`}
      >
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Assistente SAF</CardTitle>
            <Badge variant="default" className="text-xs">
              ChatGPT 4.1
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              <Minimize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="flex flex-col h-80 p-4 pt-0">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {message.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-1">
                        {renderOriginBadge(message.origin)}
                        {message.origin === "offline" && (
                          <span className="text-[11px] text-muted-foreground">
                            Resposta simulada
                          </span>
                        )}
                      </div>
                    )}
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
            <div className="flex gap-2 items-start">
              <Input
                placeholder="Digite sua pergunta ou cole o texto para melhorar..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1"
              />
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => sendMessage()}
                  disabled={!inputValue.trim() || isLoading}
                  size="sm"
                  isLoading={isLoading}
                >
                  {!isLoading && <Send className="h-4 w-4" />}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleImproveShortcut}
                  disabled={isLoading}
                  className="gap-1"
                >
                  <Sparkles className="h-3 w-3" />
                  Melhorar texto
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
