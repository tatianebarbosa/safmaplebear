import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Copy, RotateCcw, Heart, Smile } from "lucide-react";
import { toast } from "sonner";

interface AIResponse {
  id: string;
  originalText: string;
  improvedText: string;
  type: 'polite' | 'welcoming' | 'professional';
  timestamp: string;
}

const AIAssistant = () => {
  const [inputText, setInputText] = useState('');
  const [responses, setResponses] = useState<AIResponse[]>([]);
  const [loading, setLoading] = useState(false);

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
    toast.success("Texto melhorado com sucesso!");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Texto copiado para a área de transferência!");
  };

  const clearHistory = () => {
    setResponses([]);
    toast.success("Histórico limpo!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bot className="h-8 w-8 text-primary" />
            Assistente de IA
          </h1>
          <p className="text-muted-foreground">
            Torne seu atendimento mais educado e acolhedor
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
          <CardTitle>Melhore seu texto</CardTitle>
          <CardDescription>
            Digite seu texto e escolha o tom desejado para o atendimento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Digite o texto que você gostaria de melhorar..."
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
              Mais Educado
            </Button>
            
            <Button
              onClick={() => improveText(inputText, 'welcoming')}
              disabled={!inputText.trim() || loading}
              variant="outline"
            >
              <Smile className="mr-2 h-4 w-4" />
              Mais Acolhedor
            </Button>
            
            <Button
              onClick={() => improveText(inputText, 'professional')}
              disabled={!inputText.trim() || loading}
              variant="outline"
            >
              <Send className="mr-2 h-4 w-4" />
              Mais Profissional
            </Button>
          </div>
          
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Melhorando seu texto...</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Respostas */}
      {responses.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Histórico de Melhorias</h2>
          
          {responses.map((response) => (
            <Card key={response.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Texto Melhorado</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {response.type === 'polite' && 'Educado'}
                      {response.type === 'welcoming' && 'Acolhedor'}
                      {response.type === 'professional' && 'Profissional'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {response.timestamp}
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Texto Original */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Texto Original:
                  </h4>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{response.originalText}</p>
                  </div>
                </div>
                
                {/* Texto Melhorado */}
                <div>
                  <h4 className="font-medium text-sm text-success mb-2">
                    Texto Melhorado:
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
                  Copiar Texto Melhorado
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dicas de Uso */}
      <Card>
        <CardHeader>
          <CardTitle>Dicas de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <Heart className="h-4 w-4 text-primary mt-0.5" />
              <span><strong>Mais Educado:</strong> Adiciona formalidade e cortesia ao texto</span>
            </li>
            <li className="flex items-start gap-2">
              <Smile className="h-4 w-4 text-primary mt-0.5" />
              <span><strong>Mais Acolhedor:</strong> Torna o texto mais caloroso e próximo</span>
            </li>
            <li className="flex items-start gap-2">
              <Send className="h-4 w-4 text-primary mt-0.5" />
              <span><strong>Mais Profissional:</strong> Adequa o texto para contextos corporativos</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIAssistant;