# Integração de Dados do Canva

Este documento descreve como usar a funcionalidade de coleta automática de dados do Canva no projeto.

## Visão Geral

A integração permite que o sistema:

1. **Coleta automaticamente** o número de usuários ativos do Canva
2. **Armazena os dados** com data, hora e timestamp
3. **Registra o histórico** de alterações
4. **Permite reverter** alterações anteriores
5. **Exibe os dados** em um dashboard

## Configuração

### 1. Instalar Dependências

```bash
npm install puppeteer
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```env
REACT_APP_CANVA_EMAIL=tatianebarbosa20166@gmail.com
REACT_APP_CANVA_PASSWORD=Tati2025@
```

**⚠️ AVISO DE SEGURANÇA:** Nunca commite o arquivo `.env.local` no repositório. Adicione-o ao `.gitignore`.

### 3. Usar o Componente de Exibição

Importe o componente `CanvaDataDisplay` em qualquer página do seu projeto:

```tsx
import { CanvaDataDisplay } from '@/components/canva/CanvaDataDisplay';

export default function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <CanvaDataDisplay />
    </div>
  );
}
```

## Uso

### Coleta Manual

Clique no botão "Coletar Dados Agora" no componente `CanvaDataDisplay` para fazer uma coleta manual.

### Coleta Automática (Cron Job)

Para fazer a coleta automaticamente a cada hora, configure um cron job:

```bash
# Editar o crontab
crontab -e

# Adicionar a seguinte linha para executar a cada hora
0 * * * * cd /caminho/para/safmaplebear && node scripts/canva-scraper.js
```

### API Backend (Opcional)

Se você tiver um backend Node.js/Express, você pode criar endpoints para:

1. **POST `/api/canva/coletar-dados`** - Faz a coleta de dados
2. **GET `/api/canva/dados-recentes`** - Obtém os dados mais recentes
3. **GET `/api/canva/historico`** - Obtém o histórico de alterações
4. **POST `/api/canva/registrar-alteracao`** - Registra uma alteração manual
5. **POST `/api/canva/reverter-alteracao/:id`** - Reverte uma alteração

## Estrutura de Dados

### CanvaData

```typescript
interface CanvaData {
  totalPessoas: number;        // Número de usuários ativos
  dataAtualizacao: string;     // Data (ex: "07/11/2025")
  horaAtualizacao: string;     // Hora (ex: "08:30:45")
  timestamp: number;           // Timestamp em milissegundos
}
```

### CanvaHistorico

```typescript
interface CanvaHistorico {
  id: string;                  // ID único do registro
  totalPessoas: number;        // Número de usuários ativos
  dataAtualizacao: string;     // Data da alteração
  horaAtualizacao: string;     // Hora da alteração
  timestamp: number;           // Timestamp em milissegundos
  mudanca: number;             // Diferença em relação ao registro anterior
  usuarioAlteracao: string;    // Usuário que fez a alteração
  descricaoAlteracao: string;  // Descrição da alteração
}
```

## Arquivo de Dados

Os dados são armazenados em `/data/canva-data.json`:

```json
{
  "totalPessoas": 836,
  "dataAtualizacao": "07/11/2025",
  "horaAtualizacao": "08:30:45",
  "timestamp": 1730951445000,
  "mudanca": 5,
  "ultimaAtualizacao": "2025-11-07T08:30:45.000Z"
}
```

## Troubleshooting

### Erro: "Não foi possível extrair o número de pessoas"

- Verifique se o login foi bem-sucedido
- Verifique se a página do Canva mudou de estrutura
- Tente executar o script manualmente para ver o erro completo

### Erro: "Cloudflare Challenge"

- O Canva pode estar bloqueando o acesso automatizado
- Tente usar um proxy ou VPN
- Considere usar a API do Canva se disponível

### Erro: "2FA Required"

- O Canva requer autenticação de dois fatores
- Você precisará fazer o login manualmente ou usar um serviço que suporte 2FA

## Próximos Passos

1. Implementar a API Backend para armazenar dados em um banco de dados
2. Implementar a autenticação 2FA automaticamente
3. Adicionar notificações quando o número de pessoas mudar
4. Integrar com o sistema de Histórico de Alterações

## Referências

- [Puppeteer Documentation](https://pptr.dev/)
- [Canva API](https://www.canva.com/api/)
- [Node.js Cron Jobs](https://www.npmjs.com/package/node-cron)
