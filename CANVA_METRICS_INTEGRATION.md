# Integração de Métricas Detalhadas do Canva

## Visão Geral

Este documento descreve a integração completa de métricas do Canva no seu dashboard, incluindo coleta automática de dados, exibição profissional e consultas via IA.

## Métricas Coletadas

### 1. **Pessoas e Licenças**
- Total de pessoas (usuários ativos)
- Administradores
- Alunos
- Professores

### 2. **Atividade e Engajamento**
- Designs criados (com % de crescimento)
- Membros ativos (com % de crescimento)
- Total publicado
- Total compartilhado

### 3. **Kits de Marca**
- Nome do kit
- Número de designs aplicados
- Data de criação
- Data da última atualização

### 4. **Histórico de Alterações**
- Data e hora de cada coleta
- Mudanças em relação à coleta anterior
- Usuário que fez a alteração
- Descrição da alteração
- Funcionalidade de reverter

## Arquivos Atualizados

### 1. **`scripts/canva-scraper.js`** (Expandido)
- Coleta dados de múltiplas páginas do Canva
- Extrai métricas de Relatório de Uso
- Extrai dados de Pessoas
- Extrai dados de Kits de Marca
- Calcula mudanças em relação aos dados anteriores

### 2. **`src/lib/canvaDataCollector.ts`** (Atualizado)
- Novos tipos de dados: `CanvaData` (expandido)
- Novo tipo: `KitMarca`
- Novo método: `obterMetricasPorTipo()`
- Suporte para todas as métricas

### 3. **`src/components/canva/CanvaMetricsDisplay.tsx`** (Novo)
- Componente React profissional
- Exibe todas as métricas em cards
- Tabelas para kits de marca e histórico
- Cores da campanha 20/25
- Responsivo e moderno

### 4. **`src/components/ai/FloatingAIChat_CANVA_UPDATED.tsx`** (Novo)
- Extensão para consultas sobre Canva
- Processamento inteligente de perguntas
- Contexto automático para a IA
- Exemplos de perguntas suportadas

## Instalação e Configuração

### Passo 1: Instalar Dependências
```bash
npm install puppeteer
```

### Passo 2: Configurar Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto:
```
CANVA_EMAIL=tatianebarbosa20166@gmail.com
CANVA_PASSWORD=Tati2025@
REACT_APP_CANVA_EMAIL=tatianebarbosa20166@gmail.com
REACT_APP_CANVA_PASSWORD=Tati2025@
```

### Passo 3: Importar o Componente
No seu dashboard, importe e use o novo componente:
```tsx
import { CanvaMetricsDisplay } from '@/components/canva/CanvaMetricsDisplay';

export const Dashboard = () => {
  return (
    <div>
      <CanvaMetricsDisplay />
    </div>
  );
};
```

### Passo 4: Integrar Consultas na IA
No seu `FloatingAIChat.tsx`, adicione o contexto do Canva:
```tsx
import { consultarCanvaComIA, canvaMetricsContext } from '@/components/ai/FloatingAIChat_CANVA_UPDATED';

// Dentro do seu handler de mensagens:
const resposta = await consultarCanvaComIA(pergunta, dadosCanva, openaiClient);
```

## Configurar Coleta Automática (Cron Job)

### Linux/macOS
```bash
# Abre o editor de cron jobs
crontab -e

# Adiciona a linha para executar a cada hora
0 * * * * cd /caminho/para/safmaplebear && node scripts/canva-scraper.js

# Ou para executar a cada 30 minutos
*/30 * * * * cd /caminho/para/safmaplebear && node scripts/canva-scraper.js
```

### Windows (Agendador de Tarefas)
1. Abra o **Agendador de Tarefas**
2. Clique em **Criar Tarefa Básica**
3. Nome: "Canva Data Scraper"
4. Gatilho: Diário (ou a cada hora)
5. Ação: Iniciar um programa
   - Programa: `C:\Program Files\nodejs\node.exe`
   - Argumentos: `C:\caminho\para\safmaplebear\scripts\canva-scraper.js`

### Docker
```dockerfile
# Adicione ao seu Dockerfile
RUN npm install puppeteer

# Cron job no container
RUN apt-get update && apt-get install -y cron
COPY canva-scraper-cron /etc/cron.d/canva-scraper
RUN chmod 0644 /etc/cron.d/canva-scraper
```

## Exemplos de Perguntas para a IA

1. **"Quantas licenças Canva temos?"**
   - Retorna: Total de pessoas, distribuição por função

2. **"Quantos designs foram criados?"**
   - Retorna: Total de designs, crescimento percentual

3. **"Qual é a atividade do Canva?"**
   - Retorna: Resumo completo de todas as métricas

4. **"Quem está usando o Canva?"**
   - Retorna: Distribuição de usuários por função

5. **"Quais são os kits de marca?"**
   - Retorna: Lista de todos os kits com detalhes

6. **"Qual foi a mudança no número de pessoas?"**
   - Retorna: Mudança em relação à última coleta

## Estrutura de Dados

### Arquivo `data/canva-data.json`
```json
{
  "totalPessoas": 836,
  "designsCriados": 5707,
  "designsCriadosCrescimento": 9,
  "membrosAtivos": 498,
  "membrosAtivosCrescimento": 4,
  "totalPublicado": 10179,
  "totalCompartilhado": 893,
  "administradores": 11,
  "alunos": 483,
  "professores": 4,
  "totalKits": 3,
  "kits": [
    {
      "nome": "Maple Bear",
      "aplicado": "792 (14%)",
      "criado": "17 de abr. de 2023",
      "ultimaAtualizacao": "2 de abr. de 2025"
    }
  ],
  "dataAtualizacao": "07/11/2025",
  "horaAtualizacao": "14:30:45",
  "timestamp": 1730970645000,
  "mudancas": {
    "totalPessoas": 5,
    "designsCriados": 150,
    "membrosAtivos": 2
  }
}
```

## API Endpoints (Backend)

Se você implementar um backend para gerenciar os dados:

### GET `/api/canva/dados-recentes`
Retorna os dados mais recentes do Canva

### POST `/api/canva/coletar-dados`
Dispara uma coleta imediata de dados

### GET `/api/canva/historico`
Retorna o histórico de alterações

### GET `/api/canva/metricas/:tipo`
Retorna métricas filtradas por tipo (pessoas, designs, membros, kits)

### POST `/api/canva/registrar-alteracao`
Registra uma alteração no histórico

### POST `/api/canva/reverter-alteracao/:id`
Reverte uma alteração específica

## Troubleshooting

### Erro: "Cannot find module 'puppeteer'"
```bash
npm install puppeteer --save
```

### Erro: "Timeout waiting for navigation"
- Verifique se o Canva está acessível
- Verifique as credenciais de login
- Aumente o timeout no script

### Erro: "2FA required"
- O script não consegue resolver CAPTCHA automaticamente
- Você precisa fazer login manualmente uma vez para estabelecer a sessão

### Dados não estão sendo atualizados
- Verifique se o cron job está configurado corretamente
- Verifique os logs: `tail -f /var/log/syslog | grep canva-scraper`
- Teste o script manualmente: `node scripts/canva-scraper.js`

## Boas Práticas

1. **Segurança**: Nunca commit credenciais no repositório. Use `.env` local.
2. **Performance**: Não execute o scraper muito frequentemente (máximo a cada 15 minutos).
3. **Monitoramento**: Configure alertas para falhas de coleta.
4. **Backup**: Faça backup regular do arquivo `data/canva-data.json`.
5. **Limpeza**: Implemente rotação de histórico para não crescer indefinidamente.

## Próximos Passos

1. ✅ Coleta automática de dados
2. ✅ Exibição profissional no dashboard
3. ✅ Consultas via IA
4. ⏳ Implementar backend para persistência em banco de dados
5. ⏳ Adicionar gráficos e visualizações avançadas
6. ⏳ Implementar alertas para mudanças significativas
7. ⏳ Adicionar exportação de relatórios

## Suporte

Para dúvidas ou problemas, consulte a documentação do Canva ou abra uma issue no repositório.
