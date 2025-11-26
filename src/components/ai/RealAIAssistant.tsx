import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Copy, RotateCcw, Heart, Smile, Key, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  loadSchoolData, 
  searchSchoolByName, 
  searchSchoolsByState,
  searchSchoolsByCluster,
  searchSchoolsByStatus,
  generateSchoolContext,
  formatSchoolData,
  summarizeSchoolsByCluster,
  summarizeSchoolsBySafAgent
} from "@/lib/schoolDataQuery";

interface AIResponse {
  id: string;
  originalText: string;
  improvedText: string;
  type: 'polite' | 'welcoming' | 'professional' | 'chat' | 'school_query';
  timestamp: string;
}

const OPENAI_MODEL = import.meta.env.VITE_OPENAI_MODEL || 'gpt-4.1';

const RealAIAssistant = () => {
  const [inputText, setInputText] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [showApiKeyInput, setShowApiKeyInput] = useState(true);
  const [schoolDataLoaded, setSchoolDataLoaded] = useState(false);

  // Carregar dados das escolas ao montar o componente
  useEffect(() => {
    const loadData = async () => {
      try {
        await loadSchoolData();
        setSchoolDataLoaded(true);
      } catch (error) {
        console.error('Erro ao carregar dados das escolas:', error);
        toast.error('Erro ao carregar dados das escolas');
      }
    };
    loadData();
  }, []);

  // Carregar API key salva
  useEffect(() => {
    const savedKey = localStorage.getItem('openai_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      setShowApiKeyInput(false);
    }
  }, []);

  // Função para consultar dados de escolas
  const querySchoolData = async (message: string) => {
    if (!schoolDataLoaded) {
      toast.error("Dados das escolas ainda estão sendo carregados");
      return;
    }

    setLoading(true);
    
    try {
      let schoolInfo = "";

      // Detecta o tipo de consulta e busca os dados apropriados
      const lowerMessage = message.toLowerCase();

      if (
        lowerMessage.includes('quant') &&
        lowerMessage.includes('cluster')
      ) {
        schoolInfo = await summarizeSchoolsByCluster();
      } else if (
        (lowerMessage.includes('agente') ||
          lowerMessage.includes('carteira saf') ||
          lowerMessage.includes('consultor') ||
          lowerMessage.includes('responsavel') ||
          lowerMessage.includes('responsável')) &&
        (lowerMessage.includes('quant') ||
          lowerMessage.includes('lista') ||
          lowerMessage.includes('listar') ||
          lowerMessage.includes('quais'))
      ) {
        const includeSchools =
          lowerMessage.includes('lista') ||
          lowerMessage.includes('listar') ||
          lowerMessage.includes('quais');
        schoolInfo = await summarizeSchoolsBySafAgent({ includeSchools });
      } else if (lowerMessage.includes('qual') && lowerMessage.includes('escola')) {
        // Busca por nome de escola
        const schoolName = message.replace(/qual|escola|é|o|da|de|/gi, '').trim();
        const school = await searchSchoolByName(schoolName);
        if (school) {
          schoolInfo = formatSchoolData(school);
        }
      } else if (lowerMessage.includes('estado') || lowerMessage.includes('sp') || lowerMessage.includes('mg')) {
        // Busca por estado
        const states = ['SP', 'MG', 'RJ', 'BA', 'PE', 'CE', 'RS', 'PR', 'SC', 'GO', 'DF', 'MT', 'MS', 'ES', 'AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO', 'MA', 'PI', 'AL', 'SE', 'PB', 'RN'];
        let foundState = '';
        for (const state of states) {
          if (lowerMessage.includes(state.toLowerCase())) {
            foundState = state;
            break;
          }
        }
        if (foundState) {
          const schools = await searchSchoolsByState(foundState);
          schoolInfo = `Encontradas ${schools.length} escolas em ${foundState}:\n\n`;
          schools.forEach(school => {
            schoolInfo += `- ${school['Nome da Escola']} (${school['Status da Escola']}, Cluster: ${school['Cluster']})\n`;
          });
        }
      } else if (lowerMessage.includes('cluster')) {
        // Busca por cluster
        const clusters = ['Potente', 'Desenvolvimento', 'Alta Performance', 'Alerta', 'Implantação'];
        let foundCluster = '';
        for (const cluster of clusters) {
          if (lowerMessage.toLowerCase().includes(cluster.toLowerCase())) {
            foundCluster = cluster;
            break;
          }
        }
        if (foundCluster) {
          const schools = await searchSchoolsByCluster(foundCluster);
          schoolInfo = `Encontradas ${schools.length} escolas no cluster '${foundCluster}':\n\n`;
          schools.forEach(school => {
            schoolInfo += `- ${school['Nome da Escola']} (${school['Cidade da Escola']}, ${school['Estado da Escola']})\n`;
          });
        }
      } else if (lowerMessage.includes('status') || lowerMessage.includes('operando') || lowerMessage.includes('implantando')) {
        // Busca por status
        const statuses = ['Operando', 'Implantando'];
        let foundStatus = '';
        for (const status of statuses) {
          if (lowerMessage.toLowerCase().includes(status.toLowerCase())) {
            foundStatus = status;
            break;
          }
        }
        if (foundStatus) {
          const schools = await searchSchoolsByStatus(foundStatus);
          schoolInfo = `Encontradas ${schools.length} escolas com status '${foundStatus}':\n\n`;
          schools.forEach(school => {
            schoolInfo += `- ${school['Nome da Escola']} (${school['Cidade da Escola']}, ${school['Estado da Escola']})\n`;
          });
        }
      }

      if (!schoolInfo) {
        // Se não encontrou dados específicos, usa a IA para responder
        await chatWithAI(message);
        return;
      }

      const aiResponse: AIResponse = {
        id: Date.now().toString(),
        originalText: message,
        improvedText: schoolInfo,
        type: 'school_query',
        timestamp: new Date().toLocaleString('pt-BR')
      };
      
      setResponses(prev => [aiResponse, ...prev]);
      setInputText('');
      toast.success("Dados da escola recuperados com sucesso!");
      
    } catch (error: any) {
      console.error('Erro ao consultar dados das escolas:', error);
      toast.error(`Erro: ${error.message || 'Falha ao consultar dados'}`);
    } finally {
      setLoading(false);
    }
  };

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
          model: OPENAI_MODEL,
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

  // Chat livre com ChatGPT, agora com contexto das escolas
  const chatWithAI = async (message: string) => {
    if (!apiKey.trim()) {
      toast.error("Por favor, insira sua chave da API do OpenAI");
      setShowApiKeyInput(true);
      return;
    }

    setLoading(true);
    
    try {
      // Gera o contexto das escolas para a IA
      let schoolContext = "";
      if (schoolDataLoaded) {
        schoolContext = await generateSchoolContext();
      }

      const systemPrompt = `Você é um assistente inteligente do Maple Bear SAF (Sistema de Atendimento às Franquias). Você ajuda com:

- Informações sobre escolas e franquias (você tem acesso a uma base de dados atualizada)
- Dados de tickets de atendimento
- Melhorar textos de comunicação
- Explicar relatórios e métricas
- Agendar atividades do SAF
- Questões sobre vouchers e campanhas
- Suporte a coordenadores e franqueados

Seja sempre útil, profissional e focado no contexto educacional do Maple Bear. Responda em português brasileiro.

${schoolContext ? `\n\nVocê tem acesso aos seguintes dados de escolas:\n${schoolContext}` : ''}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: systemPrompt
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            Assistente de IA Avançado
          </h1>
          <p className="text-muted-foreground">
            IA real powered by ChatGPT + Dados das Escolas Maple Bear
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Modelo OpenAI ativo: {OPENAI_MODEL}
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

      {/* Status dos Dados das Escolas */}
      {!schoolDataLoaded && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Carregando dados das escolas...
          </AlertDescription>
        </Alert>
      )}

      {schoolDataLoaded && (
        <Alert className="bg-green-50 border-green-200">
          <AlertCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            Dados das escolas carregados com sucesso! Você pode fazer perguntas sobre as escolas.
          </AlertDescription>
        </Alert>
      )}

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
            Faça perguntas sobre escolas, melhore textos ou converse com a IA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Digite uma pergunta sobre escolas (ex: 'Quais escolas estão em SP?') ou faça outra pergunta..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
            disabled={loading}
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
              onClick={() => {
                if (inputText.toLowerCase().includes('escola') || 
                    inputText.toLowerCase().includes('estado') ||
                    inputText.toLowerCase().includes('cluster') ||
                    inputText.toLowerCase().includes('status')) {
                  querySchoolData(inputText);
                } else {
                  chatWithAI(inputText);
                }
              }}
              disabled={!inputText.trim() || loading}
              variant="default"
            >
              <Bot className="mr-2 h-4 w-4" />
              Perguntar à IA
            </Button>
          </div>
          
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Processando...</span>
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
                    {response.type === 'chat' ? 'Pergunta & Resposta' : response.type === 'school_query' ? 'Consulta de Escolas' : 'Texto Melhorado'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {response.type === 'polite' && 'Educado'}
                      {response.type === 'welcoming' && 'Acolhedor'}
                      {response.type === 'professional' && 'Profissional'}
                      {response.type === 'chat' && 'Chat IA'}
                      {response.type === 'school_query' && 'Escolas'}
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
                    {response.type === 'chat' ? 'Sua Pergunta:' : response.type === 'school_query' ? 'Sua Consulta:' : 'Texto Original:'}
                  </h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{response.originalText}</p>
                  </div>
                </div>
                
                {/* Resposta da IA */}
                <div>
                  <h4 className="font-medium text-sm text-success mb-2">
                    {response.type === 'chat' ? 'Resposta da IA:' : response.type === 'school_query' ? 'Dados Encontrados:' : 'Texto Melhorado:'}
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
