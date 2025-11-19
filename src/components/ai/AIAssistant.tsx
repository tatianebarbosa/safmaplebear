import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Copy, RotateCcw, Heart, Smile } from "lucide-react";
import { toast } from "sonner";
import { 
  loadSchoolData, 
  searchSchoolByName, 
  formatSchoolData
} from "@/lib/schoolDataQuery";

interface AIResponse {
  id: string;
  originalText: string;
  improvedText: string;
  type: 'polite' | 'welcoming' | 'professional' | 'school_query';
  timestamp: string;
}

const AIAssistant = () => {
  const [inputText, setInputText] = useState('');
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [loading, setLoading] = useState(false);
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

  // Função para consultar dados de escolas
  const querySchoolData = async (message: string) => {
    if (!schoolDataLoaded) {
        toast.error("Aguarde: os dados das escolas ainda estão sendo carregados.");
      return;
    }

    setLoading(true);
    
    try {
      let schoolInfo = "";
      
      // Tenta buscar por nome
      const lowerMessage = message.toLowerCase();
      const schoolNameMatch = lowerMessage.match(/(escola|unidade)\s+([a-z0-9\s]+)/i);
      if (schoolNameMatch && schoolNameMatch[2]) {
        const schoolName = schoolNameMatch[2].trim();
        const school = await searchSchoolByName(schoolName);
        if (school) {
          schoolInfo = formatSchoolData(school);
        }
      }

      if (!schoolInfo) {
        toast.error("Escola não encontrada. Tente o nome completo.");
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
      toast.success("Dados da escola recuperados.");
      
    } catch (error: any) {
      console.error('Erro ao consultar dados das escolas:', error);
      toast.error(`Erro: ${error.message || 'Falha ao consultar dados'}`);
    } finally {
      setLoading(false);
    }
  };

  // Simulação de IA - em produção seria uma chamada real para API
  const improveText = async (text: string, type: 'polite' | 'welcoming' | 'professional') => {
    setLoading(true);
    
    // Simulação de delay da API
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    let improvedText = '';
    
    switch (type) {
      case 'polite':
        improvedText = `Prezado(a),

Espero que esteja bem. ${text}

Caso tenha alguma dúvida, estarei à disposição para esclarecimentos.

Atenciosamente,
Equipe Maple Bear`;
        break;
      
      case 'welcoming':
        improvedText = `Olá! 😊

Que alegria poder conversar com você! ${text}

Estamos aqui para tornar sua experiência ainda melhor. Se precisar de qualquer coisa, é só nos avisar!

Com carinho,
Equipe Maple Bear 🍁`;
        break;
      
      case 'professional':
        improvedText = `Prezado(a) parceiro(a),

${text}

Permanecemos à disposição para quaisquer esclarecimentos adicionais que se façam necessários.

Cordialmente,
Equipe Maple Bear
Departamento de Atendimento`;
        break;
    }
    
    const response: AIResponse = {
      id: Date.now().toString(),
      originalText: text,
      improvedText,
      type,
      timestamp: new Date().toLocaleString('pt-BR')
    };
    
    setResponses(prev => [response, ...prev]);
    setLoading(false);
    toast.success("Texto aprimorado.");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Texto copiado.");
  };

  const clearHistory = () => {
    setResponses([]);
    toast.success("Histórico limpo.");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
Assistente de Texto e Dados
          </h1>
          <p className="text-muted-foreground">
Reescreva textos e consulte dados de escolas rapidamente.
          </p>
        </div>
        {responses.length > 0 && (
          <Button variant="outline" onClick={clearHistory}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpar Histórico
          </Button>
        )}
      </div>

      {/* Interface de Input */}
      <Card>
        <CardHeader>
          <CardTitle>Aprimorar Texto ou Consultar Escola</CardTitle>
          <CardDescription>
            Digite o texto para aprimorar ou o nome da escola para consulta.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Digite o texto que quer aprimorar ou o nome da escola (ex.: 'Escola São Roque')."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
          />
          
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => improveText(inputText, 'polite')}
              disabled={!inputText.trim() || loading}
              variant="outline"
            >
              <Heart className="mr-2 h-4 w-4" />
Educado (Cortesia)
            </Button>
            
            <Button
              onClick={() => improveText(inputText, 'welcoming')}
              disabled={!inputText.trim() || loading}
              variant="outline"
            >
              <Smile className="mr-2 h-4 w-4" />
Acolhedor (Empatia)
            </Button>
            
            <Button
              onClick={() => improveText(inputText, 'professional')}
              disabled={!inputText.trim() || loading}
              variant="outline"
            >
              <Send className="mr-2 h-4 w-4" />
Profissional (Formal)
            </Button>

            <Button
              onClick={() => querySchoolData(inputText)}
              disabled={!inputText.trim() || loading || !schoolDataLoaded}
              variant="default"
            >
              <Bot className="mr-2 h-4 w-4" />
Buscar Dados da Escola
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
          <h2 className="text-2xl font-semibold">Histórico</h2>
          
          {responses.map((response) => (
            <Card key={response.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {response.type === 'school_query' ? 'Consulta de Escola' : 'Texto Aprimorado'}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {response.type === 'polite' && 'Educado'}
                      {response.type === 'welcoming' && 'Acolhedor'}
                      {response.type === 'professional' && 'Profissional'}
                      {response.type === 'school_query' && 'Consulta de Dados'}
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
                    {response.type === 'school_query' ? 'Consulta:' : 'Original:'}
                  </h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{response.originalText}</p>
                  </div>
                </div>
                
                {/* Resposta da IA */}
                <div>
                  <h4 className="font-medium text-sm text-success mb-2">
                    {response.type === 'school_query' ? 'Resultado:' : 'Aprimorado:'}
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
                  Copiar Texto
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dicas de Uso */}
      <Card>
        <CardHeader>
          <CardTitle>Guia Rápido</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Heart className="h-4 w-4 text-primary mt-0.5" />
              <span><strong>Educado:</strong> Adiciona cortesia e formalidade ao texto.</span>
            </li>
            <li className="flex items-start gap-2">
              <Smile className="h-4 w-4 text-primary mt-0.5" />
              <span><strong>Acolhedor:</strong> Torna o texto mais caloroso e empático.</span>
            </li>
            <li className="flex items-start gap-2">
              <Send className="h-4 w-4 text-primary mt-0.5" />
              <span><strong>Profissional:</strong> Adequa o texto para comunicação formal.</span>
            </li>
            <li className="flex items-start gap-2">
              <Bot className="h-4 w-4 text-primary mt-0.5" />
              <span><strong>Buscar Dados da Escola:</strong> Consulta dados da escola na base unificada.</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAssistant;
