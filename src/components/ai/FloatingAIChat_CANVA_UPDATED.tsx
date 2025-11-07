/**
 * Extensão para FloatingAIChat.tsx
 * 
 * Adiciona funcionalidade de consulta sobre métricas do Canva à IA
 * Cole este código no seu FloatingAIChat.tsx existente
 */

// Adicione este objeto ao seu sistema de consulta de dados:

export const canvaMetricsContext = {
  // Contexto para a IA sobre dados do Canva
  systemPrompt: `
    Você é um assistente especializado em gestão de licenças Canva e métricas de uso.
    
    Você tem acesso aos seguintes dados do Canva:
    - Total de pessoas (usuários ativos)
    - Designs criados
    - Membros ativos
    - Total publicado
    - Total compartilhado
    - Administradores, Alunos, Professores
    - Kits de marca
    - Histórico de alterações
    
    Quando o usuário perguntar sobre:
    1. "Quantas licenças Canva temos?" - Responda com o total de pessoas
    2. "Quantos designs foram criados?" - Responda com o total de designs criados
    3. "Qual é a atividade do Canva?" - Forneça um resumo de todas as métricas
    4. "Quem está usando o Canva?" - Forneça a distribuição por função
    5. "Quais são os kits de marca?" - Liste os kits de marca disponíveis
    
    Sempre forneça contexto e análise dos dados, não apenas números.
  `,

  // Função para processar perguntas sobre Canva
  processarPerguntaCanva: (pergunta: string, dados: any) => {
    const perguntaLower = pergunta.toLowerCase();
    
    if (perguntaLower.includes('licença') || perguntaLower.includes('pessoas')) {
      return `
        📊 **Licenças Canva Ativas:**
        - Total de Pessoas: ${dados.totalPessoas}
        - Administradores: ${dados.administradores}
        - Alunos: ${dados.alunos}
        - Professores: ${dados.professores}
        
        ${dados.mudancas?.totalPessoas ? `Mudança: ${dados.mudancas.totalPessoas > 0 ? '+' : ''}${dados.mudancas.totalPessoas}` : ''}
      `;
    }
    
    if (perguntaLower.includes('design')) {
      return `
        🎨 **Atividade de Designs:**
        - Designs Criados: ${dados.designsCriados}
        - Crescimento: ${dados.designsCriadosCrescimento}% (últimos 30 dias)
        - Total Publicado: ${dados.totalPublicado}
        - Total Compartilhado: ${dados.totalCompartilhado}
      `;
    }
    
    if (perguntaLower.includes('atividade') || perguntaLower.includes('engajamento')) {
      return `
        📈 **Resumo de Atividade do Canva:**
        
        **Pessoas:**
        - Total: ${dados.totalPessoas}
        - Membros Ativos: ${dados.membrosAtivos}
        
        **Designs:**
        - Criados: ${dados.designsCriados}
        - Publicados: ${dados.totalPublicado}
        - Compartilhados: ${dados.totalCompartilhado}
        
        **Funções:**
        - Administradores: ${dados.administradores}
        - Alunos: ${dados.alunos}
        - Professores: ${dados.professores}
        
        **Kits de Marca:**
        - Total: ${dados.totalKits}
      `;
    }
    
    if (perguntaLower.includes('kit') || perguntaLower.includes('marca')) {
      if (dados.kits && dados.kits.length > 0) {
        const kitsFormatados = dados.kits.map(k => 
          `- **${k.nome}**: ${k.aplicado} (Criado: ${k.criado})`
        ).join('\n');
        
        return `
          🎯 **Kits de Marca Disponíveis:**
          ${kitsFormatados}
          
          Total: ${dados.totalKits} kits
        `;
      }
      return `Nenhum kit de marca encontrado.`;
    }
    
    if (perguntaLower.includes('quem') || perguntaLower.includes('usando')) {
      return `
        👥 **Distribuição de Usuários:**
        - Administradores: ${dados.administradores}
        - Alunos: ${dados.alunos}
        - Professores: ${dados.professores}
        - Total: ${dados.totalPessoas}
        
        Percentual:
        - Administradores: ${((dados.administradores / dados.totalPessoas) * 100).toFixed(1)}%
        - Alunos: ${((dados.alunos / dados.totalPessoas) * 100).toFixed(1)}%
        - Professores: ${((dados.professores / dados.totalPessoas) * 100).toFixed(1)}%
      `;
    }
    
    return null;
  },
};

// Adicione esta função ao seu componente FloatingAIChat:

export const consultarCanvaComIA = async (pergunta: string, dadosCanva: any, openaiClient: any) => {
  // Detecta se a pergunta é sobre Canva
  const ehSobreCanva = pergunta.toLowerCase().includes('canva') || 
                       pergunta.toLowerCase().includes('licença') ||
                       pergunta.toLowerCase().includes('design') ||
                       pergunta.toLowerCase().includes('kit') ||
                       pergunta.toLowerCase().includes('marca');
  
  if (!ehSobreCanva) {
    return null; // Deixa a IA processar normalmente
  }
  
  // Processa a pergunta com contexto do Canva
  const respostaContexto = canvaMetricsContext.processarPerguntaCanva(pergunta, dadosCanva);
  
  if (respostaContexto) {
    return respostaContexto;
  }
  
  // Se não conseguiu processar com contexto, usa a IA com os dados
  const prompt = `
    ${canvaMetricsContext.systemPrompt}
    
    Dados Atuais do Canva:
    ${JSON.stringify(dadosCanva, null, 2)}
    
    Pergunta do usuário: ${pergunta}
    
    Responda de forma clara e concisa, usando os dados fornecidos.
  `;
  
  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4.1-mini',
      messages: [
        {
          role: 'system',
          content: canvaMetricsContext.systemPrompt,
        },
        {
          role: 'user',
          content: `Dados: ${JSON.stringify(dadosCanva)}\n\nPergunta: ${pergunta}`,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Erro ao consultar IA sobre Canva:', error);
    return 'Desculpe, não consegui processar sua pergunta sobre Canva.';
  }
};
