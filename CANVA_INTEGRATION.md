# Integracao de Dados do Canva

Este documento descreve o fluxo atual do Canva no projeto: **importacao manual via CSV**.

## Visao Geral

O projeto usa os arquivos locais de dados atualizados por upload de CSV.

Fluxo suportado:

1. Upload manual de arquivos CSV de uso do Canva
2. Parsing e consolidacao dos dados no frontend
3. Exibicao nos cards e graficos do dashboard

## Configuracao

Nao ha necessidade de credenciais do Canva no backend para o fluxo padrao.

No arquivo `.env.example` existe apenas o bloco de informacao de ingestao manual.

## Como usar

O fluxo de atualizacao e feito em:

1. Acesso ao dashboard de uso do Canva
2. Upload dos arquivos CSV nos paineis de membros/modelos
3. Refresh automatico dos graficos

Nao ha componente dedicado `CanvaDataDisplay` no projeto atual.

## Estrutura de Dados

### Arquivo `data/canva-data.json` (base consolidada)

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
  "timestamp": 1730970645000,
  "dataAtualizacao": "07/11/2025"
}
```

## Endpoint de Dados

- `GET /api/canva/dados-recentes`
- `GET /api/canva/metricas/{tipo}`

## Observacoes

Não existem mais endpoints de coleta automática, histórico ou reversão de upload no backend.
