/**
 * Extenso para FloatingAIChat.tsx
 * 
 * Adiciona funcionalidade de consulta sobre mtricas do Canva  IA
 * Cole este cdigo no seu FloatingAIChat.tsx existente
 */

// Adicione este objeto ao seu sistema de consulta de dados:

export const canvaMetricsContext = {
  // Contexto para a IA sobre dados do Canva
  systemPrompt: `
    Voc  um assistente especializado em gest?o de licen?as Canva e mtricas de uso.
    
    Voc tem acesso aos seguintes dados do Canva:
    - Total de pessoas (usu?rios ativos)
    - Designs criados
    - Membros ativos
    - Total publicado
    - Total compartilhado
    - Administradores, Alunos, Professores
    - Kits de marca
    - Histrico de alteraes
    
    Quando o usu?rio perguntar sobre:
    1. "Quantas licen?as Canva temos?" - Responda com o total de pessoas
    2. "Quantos designs foram criados?" - Responda com o total de designs criados
    3. "Qual  a atividade do Canva?" - Fornea um resumo de todas as mtricas
    4. "Quem est usando o Canva?" - Fornea a distribuio por funo
    5. "Quais so os kits de marca?" - Liste os kits de marca dispon?veis
    
    Sempre fornea contexto e anlise dos dados, no apenas nmeros.
  `,

  // Funo para processar perguntas sobre Canva
  processarPerguntaCanva: (pergunta: string, dados: any) => {
    const perguntaLower = pergunta.toLowerCase();
    
    if (perguntaLower.includes('licen?a') || perguntaLower.includes('pessoas')) {
      return `
         **Licen?as Canva Ativas:**
        - Total de Pessoas: ${dados.totalPessoas}
        - Administradores: ${dados.administradores}
        - Alunos: ${dados.alunos}
        - Professores: ${dados.professores}
        
        ${dados.mudancas?.totalPessoas ? `Mudana: ${dados.mudancas.totalPessoas > 0 ? '+' : ''}${dados.mudancas.totalPessoas}` : ''}
      `;
    }
    
    if (perguntaLower.includes('design')) {
      return `
         **Atividade de Designs:**
        - Designs Criados: ${dados.designsCriados}
        - Crescimento: ${dados.designsCriadosCrescimento}% (ltimos 30 dias)
        - Total Publicado: ${dados.totalPublicado}
        - Total Compartilhado: ${dados.totalCompartilhado}
      `;
    }
    
    if (perguntaLower.includes('atividade') || perguntaLower.includes('engajamento')) {
      return `
         **Resumo de Atividade do Canva:**
        
        **Pessoas:**
        - Total: ${dados.totalPessoas}
        - Membros Ativos: ${dados.membrosAtivos}
        
        **Designs:**
        - Criados: ${dados.designsCriados}
        - Publicados: ${dados.totalPublicado}
        - Compartilhados: ${dados.totalCompartilhado}
        
        **Funes:**
        - Administradores: ${dados.administradores}
        - Alunos: ${dados.alunos}
        - Professores: ${dados.professores}
        
        **Kits de Marca:**
        - Total: ${dados.totalKits}
      `;
    }
    
    if (perguntaLower.includes('kit') || perguntaLower.includes('marca')) {
      if (dados.kits && dados.kits.length > 0) {
        const kitsFormatados = dados.kits.map((k: { nome: string; aplicado: string; criado: string }) => 
          `- **${k.nome}**: ${k.aplicado} (Criado: ${k.criado})`
        ).join('\n');
        
        return `
           **Kits de Marca Disponveis:**
          ${kitsFormatados}
          
          Total: ${dados.totalKits} kits
        `;
      }
      return `Nenhum kit de marca encontrado.`;
    }
    
    if (perguntaLower.includes('quem') || perguntaLower.includes('usando')) {
      return `
         **Distribuio de Usurios:**
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

// Adicione esta funo ao seu componente FloatingAIChat:

export const consultarCanvaComIA = async (pergunta: string, dadosCanva: any, openaiClient: any) => {
  // Detecta se a pergunta  sobre Canva
  const ehSobreCanva = pergunta.toLowerCase().includes('canva') || 
                       pergunta.toLowerCase().includes('licen?a') ||
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
  
  // Se no conseguiu processar com contexto, usa a IA com os dados
  const prompt = `
    ${canvaMetricsContext.systemPrompt}
    
    Dados Atuais do Canva:
    ${JSON.stringify(dadosCanva, null, 2)}
    
    Pergunta do usu?rio: ${pergunta}
    
    Responda de forma clara e concisa, usando os dados fornecidos.
  `;
  
  try {
    const response = await openaiClient.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        {
          role: 'system',
          content: canvaMetricsContext.systemPrompt,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    
    return response.choices[0].message.content;
  } catch (error) {
    console.error('Erro ao consultar IA sobre Canva:', error);
    return 'Desculpe, no consegui processar sua pergunta sobre Canva.';
  }
};
