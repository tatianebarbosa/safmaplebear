# Integracao de Metricas do Canva

Este documento descreve o monitoramento de métricas do Canva no estado atual do projeto.

## O que é considerado

- Pessoas e licencas
- Atividade (designs, publicados, compartilhados)
- Kits de marca
- Tabelas e graficos derivados de dados oficiais locais

## Arquivos principais

- `src/lib/canvaDataCollector.ts`
- `src/components/canva/CanvaMetricsDisplay.tsx`
- `src/components/canva/CanvaUsageDashboard.tsx`
- `src/components/canva/CanvaAdvancedInsights.tsx`
- `public/data/relatorio_canva_30_dias.csv` e arquivos CSV importados manualmente

## Como alimentar os dados

- Faça upload de CSVs no fluxo de uso do Canva.
- Os dados entram no snapshot local e atualizam os componentes de métricas.
- Não há coleta via scraper, cron ou credenciais do Canva.

## API REST em uso

- `GET /api/canva/dados-recentes`
- `GET /api/canva/metricas/{tipo}`

## Exemplo

```javascript
fetch('/api/canva/metricas/pessoas')
  .then(response => response.json())
  .then(data => console.log(data));
```

## Observacoes

- O fluxo passa a ser **apenas manual**, por upload de CSV e atualização local.
- Não há mais coleta automática do Canva, histórico de snapshots e reversão por API.
