## Resumo das Alterações de UX Writing (Componentes AI)

As alterações foram aplicadas nos arquivos `AIAssistant.tsx` e `FloatingAIChat.tsx` para tornar a linguagem mais humana, direta e profissional.

### 1. AIAssistant.tsx

| Tipo | Antes | Depois |
| :--- | :--- | :--- |
| Título | Assistente de IA | Assistente de Texto e Dados |
| Subtítulo | Torne seu atendimento mais educado e acolhedor | Reescreva textos e consulte dados de escolas rapidamente. |
| Card Title | Melhore seu texto ou Consulte Escolas | Aprimorar Texto ou Consultar Escola |
| Placeholder | Digite o texto que você gostaria de melhorar ou o nome de uma escola (ex: 'escola São Roque')... | Digite o texto que quer aprimorar ou o nome da escola (ex.: 'Escola São Roque'). |
| Botão | Mais Educado | Educado (Cortesia) |
| Botão | Mais Acolhedor | Acolhedor (Empatia) |
| Botão | Mais Profissional | Profissional (Formal) |
| Botão | Consultar Escola | Buscar Dados da Escola |
| Toast | Dados das escolas ainda estão sendo carregados | Aguarde: os dados das escolas ainda estão sendo carregados. |
| Toast | Não foi possível encontrar a escola específica. Tente o nome completo. | Escola não encontrada. Tente o nome completo. |
| Toast | Dados da escola recuperados com sucesso! | Dados da escola recuperados. |
| Toast | Texto melhorado com sucesso! | Texto aprimorado. |
| Toast | Texto copiado para a área de transferência! | Texto copiado. |
| Toast | Histórico limpo! | Histórico limpo. |

### 2. FloatingAIChat.tsx

| Tipo | Antes | Depois |
| :--- | :--- | :--- |
| Título | Assistente IA - Maple Bear SAF | Assistente SAF |
| Mensagem Inicial | Olá! Sou seu assistente de IA do Maple Bear SAF. Posso responder perguntas sobre licenças Canva, escolas, usuários e métricas. Como posso ajudá-lo? | Olá! Sou o Assistente de IA do SAF. Posso responder sobre licenças Canva, escolas, usuários e métricas. Como posso ajudar? |
| Erro | Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente. | Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente. |
| Erro Consulta | Desculpe, não consegui encontrar a escola ou o dado específico que você procurou na base de dados. Tente refinar sua busca ou perguntar o nome exato da escola. | Não encontrei a escola ou o dado específico na base. Tente refinar a busca ou perguntar o nome exato da escola. |
| Simulação Ticket | Entendi que você está perguntando sobre tickets. No momento temos vários tickets pendentes. Os mais críticos são aqueles com mais de 15 dias. Gostaria que eu liste os tickets mais urgentes? | Você perguntou sobre tickets. Temos vários pendentes, sendo os mais críticos aqueles com mais de 15 dias. Gostaria de listar os mais urgentes? |
| Simulação Escola | Posso ajudar com informações sobre escolas! No sistema temos dados de várias unidades. Você gostaria de saber sobre alguma escola específica? Posso mostrar informações como contatos ou histórico de atendimentos. | Posso fornecer informações sobre escolas! Qual unidade específica você gostaria de consultar (contatos, histórico, etc.)? |
| Simulação Texto | Posso ajudar a melhorar seus textos de atendimento! Basta me enviar o texto que você quer melhorar e eu posso torná-lo mais educado, acolhedor ou profissional. Qual texto você gostaria de melhorar? | Posso aprimorar seus textos de atendimento (educado, acolhedor ou profissional). Qual texto você gostaria de melhorar? |
| Simulação Relatório | Para relatórios e dashboards, posso ajudar explicando os dados ou sugerindo análises. Qual métrica específica você gostaria de entender melhor? Temos dados de vouchers, licenças, atendimentos e muito mais. | Para relatórios e dashboards, posso explicar dados ou sugerir análises. Qual métrica (vouchers, licenças, atendimentos, etc.) você gostaria de entender melhor? |
| Simulação Licença | Posso ajudar com informações sobre licenças Canva! Temos dados atualizados sobre: | Posso fornecer informações sobre licenças Canva, como: |
| Simulação Final | Entendi sua pergunta sobre "${input}". Como assistente do Maple Bear SAF, posso ajudar com: | Entendi sua pergunta sobre "${input}". Como Assistente SAF, posso ajudar com: |
| Simulação Final | Como posso ser mais específico para ajudá-lo? | Como posso ser mais específico? |
