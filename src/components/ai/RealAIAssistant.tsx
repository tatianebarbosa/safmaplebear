import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Copy, RotateCcw, Heart, Smile, Key, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AIResponse {
  id: string;
  originalText: string;
  improvedText: string;
  type: 'polite' | 'welcoming' | 'professional' | 'chat';
  timestamp: string;
}

const RealAIAssistant = () => {
  const [inputText, setInputText] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);

  // Função para melhorar texto usando ChatGPT real
  const improveTextWithAI = async (text: string, type: 'polite' | 'welcoming' | 'professional') => {
    if (!apiKey.trim()) {
      toast.error("Por favor, insira sua chave da API do OpenAI");
      setShowApiKeyInput(true);
      return;
    }

    setLoading(true);
    
    try {
      const prompts = {
        polite: `Reescreva o seguinte texto para soar mais educado e formal, mantendo o significado original. Use tratamento respeitoso e linguagem cortês apropriada para atendimento ao cliente empresarial:

"${text}"

Responda apenas com o texto melhorado, sem explicações adicionais.`,
        
        welcoming: `Reescreva o seguinte texto para soar mais acolhedor e caloroso, mantendo o significado original. Use linguagem amigável e próxima, apropriada para criar conexão com o cliente:

"${text}"

Responda apenas com o texto melhorado, sem explicações adicionais.`,
        
        professional: `Reescreva o seguinte texto para soar mais profissional e corporativo, mantendo o significado original. Use linguagem técnica e formal apropriada para contextos empresariais:

"${text}"

Responda apenas com o texto melhorado, sem explicações adicionais.`
      };

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
              content: 'Você é um assistente especializado em melhorar textos de atendimento ao cliente para o Maple Bear. Sempre mantenha o contexto educacional e o tom apropriado da marca.'
            },
            {
              role: 'user',
              content: prompts[type]
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Erro da API: ${response.status}`);
      }

      const data = await response.json();
      const improvedText = data.choices[0]?.message?.content?.trim() || "Erro ao processar o texto";
      
      const aiResponse: AIResponse = {
        id: Date.now().toString(),
        originalText: text,
        improvedText,
        type,
        timestamp: new Date().toLocaleString('pt-BR')
      };
      
      setResponses(prev => [aiResponse, ...prev]);
      setInputText('');
      toast.success("Texto melhorado com IA!");
      
    } catch (error: any) {
      console.error('Erro na API do OpenAI:', error);
      toast.error(`Erro: ${error.message || 'Falha na comunicação com a IA'}`);
    } finally {
      setLoading(false);
    }
  };

  // Chat livre com ChatGPT
  const chatWithAI = async (message: string) => {
    if (!apiKey.trim()) {
      toast.error("Por favor, insira sua chave da API do OpenAI");
      setShowApiKeyInput(true);
      return;
    }

    setLoading(true);
    
    try {
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
              content: `Você é um assistente inteligente do Maple Bear SAF (Sistema de Atendimento às Franquias). Você ajuda com:

- Informações sobre tickets de atendimento
- Dados de escolas e franquias
- Melhorar textos de comunicação
- Explicar relatórios e métricas
- Agendar atividades do SAF
- Questões sobre vouchers e campanhas
- Suporte a coordenadores e franqueados

Seja sempre útil, profissional e focado no contexto educacional do Maple Bear. Responda em português brasileiro.`
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.8,
          max_tokens: 800
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Erro da API: ${response.status}`);
      }

      const data = await response.json();
      const aiReply = data.choices[0]?.message?.content?.trim() || "Desculpe, não consegui processar sua pergunta.";
      
      const aiResponse: AIResponse = {
        id: Date.now().toString(),
        originalText: message,
        improvedText: aiReply,
        type: 'chat',
        timestamp: new Date().toLocaleString('pt-BR')
      };
      
      setResponses(prev => [aiResponse, ...prev]);
      setInputText('');
      toast.success("Resposta da IA recebida!");
      
    } catch (error: any) {
      console.error('Erro na API do OpenAI:', error);
      toast.error(`Erro: ${error.message || 'Falha na comunicação com a IA'}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Texto copiado para a área de transferência!");
  };

  const clearHistory = () => {
    setResponses([]);
    toast.success("Histórico limpo!");
  };

  const saveApiKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('openai_api_key', apiKey);
      setShowApiKeyInput(false);
      toast.success("Chave da API salva com segurança!");
    }
  };

  // Carregar API key salva
  useState(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setShowApiKeyInput(false);
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            Assistente de IA Avançado
          </h1>
          <p className="text-muted-foreground">
            IA real powered by ChatGPT para melhorar textos e responder perguntas
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowApiKeyInput(!showApiKeyInput)}>
            <Key className="mr-2 h-4 w-4" />
            {showApiKeyInput ? 'Ocultar' : 'Configurar'} API
          </Button>
          {responses.length > 0 && (
            <Button variant="outline" onClick={clearHistory}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Limpar Histórico
            </Button>
          )}
        </div>
      </div>

      {/* Configuração da API Key */}
      {showApiKeyInput && (
        <Alert>
          <Key className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3 mt-2">
              <p>Para usar a IA real, insira sua chave da API do OpenAI:</p>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={saveApiKey} disabled={!apiKey.trim()}>
                  Salvar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Sua chave é armazenada localmente e usada apenas para as chamadas da IA.
                <br />
                Obtenha sua chave em: <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary underline">OpenAI Platform</a>
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {!apiKey.trim() && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Configure sua chave da API do OpenAI para usar todas as funcionalidades da IA.
          </AlertDescription>
        </Alert>
      )}

      {/* Interface de Input */}
      <Card>
        <CardHeader>
          <CardTitle>Interaja com a IA</CardTitle>
          <CardDescription>
            Melhore textos ou faça perguntas sobre o SAF
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Digite seu texto para melhorar ou faça uma pergunta..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
            disabled={!apiKey.trim()}
          />
          
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => improveTextWithAI(inputText, 'polite')}
              disabled={!inputText.trim() || loading || !apiKey.trim()}
              variant="outline"
            >
              <Heart className="mr-2 h-4 w-4" />
              Mais Educado
            </Button>
            
            <Button
              onClick={() => improveTextWithAI(inputText, 'welcoming')}
              disabled={!inputText.trim() || loading || !apiKey.trim()}
              variant="outline"
            >
              <Smile className="mr-2 h-4 w-4" />
              Mais Acolhedor
            </Button>
            
            <Button
              onClick={() => improveTextWithAI(inputText, 'professional')}
              disabled={!inputText.trim() || loading || !apiKey.trim()}
              variant="outline"
            >
              <Send className="mr-2 h-4 w-4" />
              Mais Profissional
            </Button>

            <Button
              onClick={() => chatWithAI(inputText)}
              disabled={!inputText.trim() || loading || !apiKey.trim()}
              variant="default"
            >
              <Bot className="mr-2 h-4 w-4" />
              Perguntar à IA
            </Button>
          </div>
          
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Processando com IA...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Respostas */}
      {responses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Histórico de Interações</h2>
          
          {responses.map((response) => (
            <Card key={response.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {response.type === 'chat' ? 'Pergunta & Resposta' : 'Texto Melhorado'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {response.type === 'polite' && 'Educado'}
                      {response.type === 'welcoming' && 'Acolhedor'}
                      {response.type === 'professional' && 'Profissional'}
                      {response.type === 'chat' && 'Chat IA'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {response.timestamp}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Pergunta/Texto Original */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    {response.type === 'chat' ? 'Sua Pergunta:' : 'Texto Original:'}
                  </h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{response.originalText}</p>
                  </div>
                </div>
                
                {/* Resposta da IA */}
                <div>
                  <h4 className="font-medium text-sm text-success mb-2">
                    {response.type === 'chat' ? 'Resposta da IA:' : 'Texto Melhorado:'}
                  </h4>
                  <div className="p-3 bg-success-bg border border-success/20 rounded-lg">
                    <p className="text-sm whitespace-pre-line">{response.improvedText}</p>
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(response.improvedText)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Resposta
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default RealAIAssistant;