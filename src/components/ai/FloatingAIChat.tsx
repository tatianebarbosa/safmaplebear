import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Minimize2, X } from "lucide-react";
import { Mascot } from "@/components/ui/mascot";
import { BearHappy } from "@/assets/maplebear";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  loadSchoolData, 
  searchSchoolByName, 
  formatSchoolData
} from "@/lib/schoolDataQuery";

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const FloatingAIChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: 'Olá! Sou seu assistente de IA do Maple Bear SAF. Posso responder perguntas sobre licenças Canva, escolas, usuários e métricas. Como posso ajudá-lo?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [schoolDataLoaded, setSchoolDataLoaded] = useState(false);

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
      let response;
      
      // 1. Tenta a consulta direta aos dados das escolas (se carregados)
      if (schoolDataLoaded) {
        const schoolResponse = await querySchoolData(currentInput);
        if (schoolResponse) {
          response = schoolResponse;
        }
      }
      
      // 2. Se não for uma consulta direta de escola, usa o ChatGPT via backend
      if (!response) {
        try {
          response = await callOpenAI(currentInput);
        } catch (error) {
          console.error('Erro ao chamar ChatGPT:', error);
          // Fallback para resposta simulada
          response = await simulateAIResponse(currentInput);
        }
      }
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Erro ao processar mensagem:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Função de consulta de dados das escolas (RAG local)
  const querySchoolData = async (message: string): Promise<string | null> => {
    const lowerMessage = message.toLowerCase();

    // Detecção de intenção de consulta de escola
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

      // Se a intenção é clara, mas a busca falhou, retorna uma mensagem de erro específica
      return "Desculpe, não consegui encontrar a escola ou o dado específico que você procurou na base de dados. Tente refinar sua busca ou perguntar o nome exato da escola.";
    }

    return null; // Não é uma consulta de dados de escola, deixa a IA tratar
  };

  const callOpenAI = async (input: string): Promise<string> => {
    // Chama o endpoint seguro do backend que injeta os dados do dashboard
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        question: input,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Erro da API: ${response.status}`);
    }

    const data = await response.json();
    return data.response || "Não consegui processar sua pergunta.";
  };

  const simulateAIResponse = async (input: string): Promise<string> => {
    // Simula delay da API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('ticket') || lowerInput.includes('chamado')) {
      return `Entendi que você está perguntando sobre tickets. No momento temos vários tickets pendentes. Os mais críticos são aqueles com mais de 15 dias. Gostaria que eu liste os tickets mais urgentes?`;
    }
    
    if (lowerInput.includes('escola') || lowerInput.includes('unidade')) {
      return `Posso ajudar com informações sobre escolas! No sistema temos dados de várias unidades. Você gostaria de saber sobre alguma escola específica? Posso mostrar informações como contatos ou histórico de atendimentos.`;
    }
    
    if (lowerInput.includes('texto') || lowerInput.includes('melhorar') || lowerInput.includes('escrever')) {
      return `Posso ajudar a melhorar seus textos de atendimento! Basta me enviar o texto que você quer melhorar e eu posso torná-lo mais educado, acolhedor ou profissional. Qual texto você gostaria de melhorar?`;
    }
    
    if (lowerInput.includes('relatório') || lowerInput.includes('dashboard')) {
      return `Para relatórios e dashboards, posso ajudar explicando os dados ou sugerindo análises. Qual métrica específica você gostaria de entender melhor? Temos dados de vouchers, licenças, atendimentos e muito mais.`;
    }
    
    if (lowerInput.includes('licença') || lowerInput.includes('canva')) {
      return `Posso ajudar com informações sobre licenças Canva! Temos dados atualizados sobre:
• Licenças ativas por escola
• Usuários conformes e não conformes
• Domínios autorizados
• Métricas de uso

Qual informação específica você gostaria?`;
    }
    
    return `Entendi sua pergunta sobre "${input}". Como assistente do Maple Bear SAF, posso ajudar com:
    
• Informações sobre licenças Canva
• Dados de escolas e franquias
• Análise de conformidade de usuários
• Relatórios e métricas
• Suporte geral

Como posso ser mais específico para ajudá-lo?`;
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
          <Mascot src={BearHappy} size="md" alt="Assistente IA" animated />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`w-96 shadow-2xl transition-all duration-300 ${isMinimized ? 'h-14' : 'h-96'}`}>
        <CardHeader className="flex flex-row items-center justify-between p-4 pb-2">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle className="text-sm">Assistente IA - Maple Bear SAF</CardTitle>
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
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
};

export default FloatingAIChat;
