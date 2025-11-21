import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Minimize2, X, BookOpenText } from "lucide-react";
import { Mascot } from "@/components/ui/mascot";
import { Mascots } from "@/assets/maplebear";
import { Badge } from "@/components/ui/badge";
import {
  loadSchoolData,
  searchSchoolByName,
  formatSchoolData
} from "@/lib/schoolDataQuery";
import { getStoredKnowledgeItems, subscribeToKnowledgeBase, buildKnowledgeSummaries } from "@/lib/knowledgeBase";
import type { KnowledgeAttachmentSummary, KnowledgeItem } from "@/types/knowledge";
import { loadDashboardBIContext, buildBIAnswer, type DashboardBIContext } from "@/lib/ai/dashboardInsights";

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  sources?: KnowledgeAttachmentSummary[];
}

const BI_DATA_SOURCES: KnowledgeAttachmentSummary[] = [
  {
    id: 'dataset-licencas-canva',
    title: 'LicenÃ§as Canva (CSV oficial)',
    category: 'dados',
    tags: ['csv', 'licencas'],
    summary: 'Fonte: public/data/licencas_canva.csv'
  },
  {
    id: 'dataset-franchising',
    title: 'Franchising.csv (mapa de escolas)',
    category: 'dados',
    tags: ['csv', 'escolas'],
    summary: 'Fonte: public/data/Franchising.csv'
  },
  {
    id: 'dataset-canva-history',
    title: 'HistÃ³rico de coletas Canva',
    category: 'dados',
    tags: ['json', 'timer'],
    summary: 'Fonte: public/data/canva_history.json'
  }
];

const FloatingAIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'OlÃ¡! Sou o Assistente de IA do SAF. Posso responder sobre licenÃ§as Canva, escolas, usuÃ¡rios e mÃ©tricas. Como posso ajudar?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [schoolDataLoaded, setSchoolDataLoaded] = useState(false);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [dashboardContext, setDashboardContext] = useState<DashboardBIContext | null>(null);

  // Carregar dados das escolas ao montar o componente
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadSchoolData();
        setSchoolDataLoaded(true);
      } catch (error) {
        console.error('Erro ao carregar dados das escolas:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    setKnowledgeItems(getStoredKnowledgeItems());
    const unsubscribe = subscribeToKnowledgeBase(setKnowledgeItems);
    return () => {
      if (typeof unsubscribe === 'function') {
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
        console.error('Erro ao carregar contexto de BI do Canva:', error);
      });

    return () => {
      active = false;
    };
  }, []);

  const ensureDashboardContext = async (): Promise<DashboardBIContext | null> => {
    if (dashboardContext) {
      return dashboardContext;
    }
    const context = await loadDashboardBIContext();
    setDashboardContext(context);
    return context;
  };

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      let response: string | null = null;
      let knowledgeContext: KnowledgeAttachmentSummary[] = [];
      let knowledgeUsed = false;
      let dataSourcesUsed: KnowledgeAttachmentSummary[] = [];
      
      // 1. Tenta a consulta direta aos dados das escolas (se carregados)
      if (schoolDataLoaded) {
        const schoolResponse = await querySchoolData(currentInput);
        if (schoolResponse) {
          response = schoolResponse;
        }
      }
      
      // 2. Consulta BI local com os CSV/JSON oficiais
      if (!response) {
        const context = await ensureDashboardContext();
        if (context) {
          const biAnswer = buildBIAnswer(currentInput, context);
          if (biAnswer) {
            response = biAnswer;
            dataSourcesUsed = [...BI_DATA_SOURCES];
          }
        }
      }
      
      // 3. Se ainda nÃ£o houver resposta, usa o backend com contexto da base
      if (!response) {
        knowledgeContext = buildKnowledgeSummaries(currentInput, knowledgeItems);
        try {
          response = await callOpenAI(currentInput, knowledgeContext);
          knowledgeUsed = knowledgeContext.length > 0;
        } catch (error) {
          console.error('Erro ao chamar ChatGPT:', error);
          response = await simulateAIResponse(currentInput);
        }
      }
      
      const sources: KnowledgeAttachmentSummary[] = [];
      if (knowledgeUsed && knowledgeContext.length) {
        sources.push(...knowledgeContext);
      }
      if (dataSourcesUsed.length) {
        sources.push(...dataSourcesUsed);
      }
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response ?? 'NÃ£o consegui processar sua pergunta neste momento.',
        role: 'assistant',
        timestamp: new Date(),
        sources: sources.length ? sources : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // FunÃ§Ã£o de consulta de dados das escolas (RAG local)
  const querySchoolData = async (message: string): Promise<string | null> => {
    const lowerMessage = message.toLowerCase();

    // DetecÃ§Ã£o de intenÃ§Ã£o de consulta de escola
    if (lowerMessage.includes('escola') || lowerMessage.includes('unidade') || lowerMessage.includes('cnpj') || lowerMessage.includes('cluster') || lowerMessage.includes('status')) {
      
      // Tenta buscar por nome
      const schoolNameMatch = lowerMessage.match(/(escola|unidade)\s+([a-z0-9\s]+)/i);
      if (schoolNameMatch && schoolNameMatch[2]) {
        const schoolName = schoolNameMatch[2].trim();
        const school = await searchSchoolByName(schoolName);
        if (school) {
          return formatSchoolData(school);
        }
      }

      // Se a intenÃ§Ã£o Ã© clara, mas a busca falhou, retorna uma mensagem de erro especÃ­fica
      return "NÃ£o encontrei a escola ou o dado especÃ­fico na base. Tente refinar a busca ou perguntar o nome exato da escola.";
    }

    return null; // NÃ£o Ã© uma consulta de dados de escola, deixa a IA tratar
  };

  const callOpenAI = async (
    input: string,
    knowledge?: KnowledgeAttachmentSummary[]
  ): Promise<string> => {
    // Chama o endpoint seguro do backend que injeta os dados do dashboard
    const payload: Record<string, unknown> = {
      question: input,
    };

    if (knowledge && knowledge.length) {
      payload.knowledge = knowledge;
    }

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Erro da API: ${response.status}`);
    }

    const data = await response.json();
    return data.response || "NÃ£o consegui processar sua pergunta.";
  };

  const simulateAIResponse = async (input: string): Promise<string> => {
    // Simula delay da API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('ticket') || lowerInput.includes('chamado')) {
      return `VocÃª perguntou sobre tickets. Temos vÃ¡rios pendentes, sendo os mais crÃ­ticos aqueles com mais de 15 dias. Gostaria de listar os mais urgentes?`;
    }
    
    if (lowerInput.includes('escola') || lowerInput.includes('unidade')) {
      return `Posso fornecer informaÃ§Ãµes sobre escolas! Qual unidade especÃ­fica vocÃª gostaria de consultar (contatos, histÃ³rico, etc.)?`;
    }
    
    if (lowerInput.includes('texto') || lowerInput.includes('melhorar') || lowerInput.includes('escrever')) {
      return `Posso aprimorar seus textos de atendimento (educado, acolhedor ou profissional). Qual texto vocÃª gostaria de melhorar?`;
    }
    
    if (lowerInput.includes('relatÃ³rio') || lowerInput.includes('dashboard')) {
      return `Para relatÃ³rios e dashboards, posso explicar dados ou sugerir anÃ¡lises. Qual mÃ©trica (vouchers, licenÃ§as, atendimentos, etc.) vocÃª gostaria de entender melhor?`;
    }
    
    if (lowerInput.includes('licenÃ§a') || lowerInput.includes('canva')) {
      return `Posso fornecer informaÃ§Ãµes sobre licenÃ§as Canva, como:
â€¢ LicenÃ§as ativas por escola
â€¢ UsuÃ¡rios conformes e nÃ£o conformes
â€¢ DomÃ­nios autorizados
â€¢ MÃ©tricas de uso

Qual informaÃ§Ã£o especÃ­fica vocÃª gostaria?`;
    }
    
    return `Entendi sua pergunta sobre "${input}". Como Assistente SAF, posso ajudar com:
    
â€¢ InformaÃ§Ãµes sobre licenÃ§as Canva
â€¢ Dados de escolas e franquias
â€¢ AnÃ¡lise de conformidade de usuÃ¡rios
â€¢ RelatÃ³rios e mÃ©tricas
â€¢ Suporte geral

Como posso ser mais especÃ­fico?`;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
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
      <Card className={`shadow-2xl transition-all duration-300 ${isMinimized ? 'h-14' : 'h-96'}`}>
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Assistente SAF</CardTitle>
            <Badge variant="default" className="text-xs">
              ChatGPT 4.1-mini
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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
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
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                    {message.role === 'assistant' && message.sources?.length ? (
                      <div className="mt-2 space-y-1">
                        <p className="text-[11px] font-semibold uppercase text-primary flex items-center gap-1">
                          <BookOpenText className="h-3 w-3" />
                          Fontes usadas
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {message.sources.map((source) => (
                            <Badge key={`${message.id}-${source.id}`} variant="outline" className="text-[11px] flex items-center gap-1">
                              {source.title}
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
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Input Area */}
            <div className="flex gap-2">
              <Input
                placeholder="Digite sua pergunta..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="sm"
                isLoading={isLoading}
              >
                {!isLoading && <Send className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default FloatingAIChat;
