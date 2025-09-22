import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Minimize2, X, MessageSquare, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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
      content: 'Olá! Sou seu assistente de IA do Maple Bear SAF powered by ChatGPT. Como posso ajudá-lo hoje?',
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
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
      
      if (apiKey.trim()) {
        // Usar ChatGPT real
        response = await callOpenAI(currentInput);
      } else {
        // Fallback para resposta simulada
        response = await simulateAIResponse(currentInput);
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

  const callOpenAI = async (input: string): Promise<string> => {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `Você é um assistente inteligente do Maple Bear SAF (Sistema de Atendimento às Franquias). Você é especializado em:

- Tickets de atendimento e suporte
- Informações sobre escolas e franquias
- Licenças Canva e recursos educacionais  
- Vouchers e campanhas promocionais
- Relatórios e métricas de desempenho
- Agendamento de visitas e atividades
- Suporte a coordenadores e franqueados

Seja sempre útil, conciso e profissional. Mantenha o foco no contexto educacional do Maple Bear. Responda em português brasileiro.`
          },
          ...messages.slice(-5).map(msg => ({
            role: msg.role,
            content: msg.content
          })),
          {
            role: 'user',
            content: input
          }
        ],
        temperature: 0.7,
        max_tokens: 400
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || `Erro da API: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || "Não consegui processar sua pergunta.";
  };

  const simulateAIResponse = async (input: string): Promise<string> => {
    // Simula delay da API
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const lowerInput = input.toLowerCase();
    
    if (lowerInput.includes('ticket') || lowerInput.includes('chamado')) {
      return `Entendi que você está perguntando sobre tickets. No momento temos ${Math.floor(Math.random() * 15 + 5)} tickets pendentes. Os mais críticos são aqueles com mais de 15 dias. Gostaria que eu liste os tickets mais urgentes?`;
    }
    
    if (lowerInput.includes('escola') || lowerInput.includes('unidade')) {
      return `Posso ajudar com informações sobre escolas! No sistema temos dados de várias unidades. Você gostaria de saber sobre alguma escola específica? Posso mostrar informações como licenças ativas, contatos ou histórico de atendimentos.`;
    }
    
    if (lowerInput.includes('texto') || lowerInput.includes('melhorar') || lowerInput.includes('escrever')) {
      return `Posso ajudar a melhorar seus textos de atendimento! Basta me enviar o texto que você quer melhorar e eu posso torná-lo mais educado, acolhedor ou profissional. Qual texto você gostaria de melhorar?`;
    }
    
    if (lowerInput.includes('relatório') || lowerInput.includes('dashboard')) {
      return `Para relatórios e dashboards, posso ajudar explicando os dados ou sugerindo análises. Qual métrica específica você gostaria de entender melhor? Temos dados de vouchers, licenças, atendimentos e muito mais.`;
    }
    
    return `Entendi sua pergunta sobre "${input}". Como assistente do Maple Bear SAF, posso ajudar com:
    
• Informações sobre tickets e atendimentos
• Dados de escolas e licenças
• Melhorar textos de comunicação
• Explicar relatórios e métricas
• Agendar atividades do SAF

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
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
        >
          <Bot className="h-6 w-6" />
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
            <Badge variant={apiKey ? "default" : "secondary"} className="text-xs">
              {apiKey ? "ChatGPT" : "Demo"}
            </Badge>
          </div>
          <div className="flex items-center gap-1">
            {!apiKey && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const key = prompt("Cole sua chave da API do OpenAI:");
                  if (key) {
                    setApiKey(key);
                    localStorage.setItem('openai_api_key', key);
                    toast.success("API Key configurada!");
                  }
                }}
                title="Configurar ChatGPT"
              >
                <Key className="h-4 w-4" />
              </Button>
            )}
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