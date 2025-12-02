# SAF MapleBear – Painel de Licenças Canva

Aplicação web em React/TypeScript para a governança das licenças Canva na rede MapleBear. O painel centraliza dados de uso, conformidade, tickets, base de conhecimento e operações de ativos, servindo como ponto único para time SAF e escolas.

## Principais recursos
- Painel Canva com visão de licenças, conformidade de domínios e uso por escola.
- Dashboards de vouchers (incluindo campanha 2026) e insights analíticos.
- Monitoramento operacional, tickets, base de conhecimento e perfis de usuários.
- Gestão de ativos SAF, detalhes por escola e monitoria de agentes.
- Modo focado no Canva via `VITE_ENABLE_ONLY_CANVA=true` para restringir rotas.

## Requisitos
- Node.js 18+ e npm (ou pnpm).
- Opcional: Azure Functions Core Tools para rodar o backend em `api/`.

## Configuração rápida
1) Clone o repositório e instale dependências:
```sh
git clone <url-do-repo>
cd safmaplebear
npm install
# ou pnpm install
```
2) Copie `.env.example` para `.env` e ajuste valores principais:
- `VITE_API_BASE_URL`: URL base da API (opcional em dev, usada no build).
- `VITE_ADMIN_EMAIL`, `VITE_ADMIN_PASSWORD`, `VITE_ADMIN_NAME`, `VITE_ADMIN_ROLE`: login temporário do painel.
- `VITE_MAX_LICENSES_PER_SCHOOL`: limite padrão por escola.
- `VITE_ENABLE_ONLY_CANVA`: defina `true` para liberar apenas as rotas do painel Canva.
3) Para usar o backend local, configure `api/local.settings.json` (Azure Functions) e as credenciais do Canva (`CANVA_EMAIL`, `CANVA_PASSWORD`, `CANVA_PERIODO`). Nunca versione credenciais reais.

## Scripts úteis
- `npm run dev`: sobe o Vite em modo desenvolvimento (http://localhost:5173).
- `npm run build`: checa tipos (`tsc`) e gera build em `dist/`.
- `npm run preview`: serve o build gerado para validação rápida.
- `npm run css-build`: compila Tailwind para `src/assets/styles.css`.
- `npm run type-check`: verificação de tipos sem emitir saída.
- `npm run test`: suite de testes com Jest (jsdom).

## Estrutura de pastas (resumo)
- `src/`: componentes, páginas e fluxos principais (Canva, vouchers, insights, tickets, base de conhecimento, ativos, monitoria).
- `api/`: Azure Functions usadas para integrações e serviços.
- `public/`: assets estáticos servidos diretamente.
- `scripts/`: utilitários de build/infra.

## Como contribuir
1) Crie um branch ou fork.
2) Ajuste o que for necessário e rode `npm run type-check` e `npm run test`.
3) Faça commit e abra PR descrevendo impacto e passos de validação.

## Build e deploy
1) Execute `npm run build` para gerar `dist/`.
2) Publique `dist/` em seu host estático preferido e, se necessário, deploy das Functions em `api/` (ex.: Azure Static Web Apps).
3) Configure as variáveis de ambiente de produção conforme as de `.env.example` e `api/local.settings.json`.
