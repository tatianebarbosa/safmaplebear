# Melhorias Implementadas - Sistema Canva

## Data

05/03/2026

## Resumo

Foi removido o fluxo de coleta automatizada do Canva e mantido apenas o fluxo de atualização por arquivos locais (upload manual de CSV). O sistema agora depende exclusivamente de dados oficiais/manuais para o dashboard.

## Mudancas aplicadas

1. Removido backend de coleta automática
   - `api/canva_coletar_dados/__init__.py`
   - `api/canva_coletar_dados/function.json`
   - `api/canva_registrar_alteracao/__init__.py`
   - `api/canva_registrar_alteracao/function.json`
   - `api/canva_reverter_alteracao/__init__.py`
   - `api/canva_reverter_alteracao/function.json`
   - `api/canva_historico/__init__.py`
   - `api/canva_historico/function.json`
   - `api/shared/canva_collector.py`
   - `api/shared/canva_data_processor.py`
   - `api/collect_all_periods.py`

2. Removido histórico de coletas no frontend/backend
   - Removidas referencias a `canva_history.json`
   - Removida interface `CanvaHistorico`
   - Removida UI de reversão de upload

3. Atualizacao do serviço frontend de dados
   - `src/lib/canvaDataCollector.ts`
     - Mantem leitura de snapshot local e CSV
     - Mantido `obterDadosRecentes`, `summarizeCsvContent`, `aplicarUploadCsv`
     - Removidos métodos de coleta/registro/historico
   - `src/components/canva/CanvaMetricsDisplay.tsx`
     - Remove aba de historico e fluxo de reversao
   - `src/components/canva/CanvaUsageDashboard.tsx`
     - Remove registro de histórico manual

4. Removidos componentes descontinuados
   - `src/components/canva/CanvaDataDisplay.tsx`
   - `api/test_canva_collector.py` (arquivo legado removido)

5. Atualizacao de contexto de IA
   - `src/lib/ai/dashboardInsights.ts`
   - Removido uso de `canva_history.json`
   - Mantido contexto apenas com overview e dados de escolas

6. Configuracao e dependencias
   - `api/requirements.txt`: removido `playwright`
   - `api/local.settings.example.json`: removidas variaveis CANVA_EMAIL/CANVA_PASSWORD
   - `.env.example`: documentado fluxo de ingestao manual apenas

7. Documentacao atualizada
   - `API_CANVA_DOCUMENTATION.md`
   - `CANVA_INTEGRATION.md`
   - `CANVA_METRICS_INTEGRATION.md`

## Endpoints ativos no backend

- `GET /api/canva/dados-recentes`
- `GET /api/canva/metricas/{tipo}`
- `GET /api/canva/overview`

## Endpoints removidos

- `POST /api/canva/coletar-dados`
- `POST /api/canva/registrar-alteracao`
- `POST /api/canva/reverter-alteracao/{id}`
- `GET /api/canva/historico`

## Validacao recomendada

- Confirmar ausência de referencias a métodos removidos (`coletarDadosCanva`, `obterHistorico`, `reverterAlteracao`)
- Confirmar endpoint `/api/canva/coletar-dados` nao listado no host
- Confirmar upload de CSV atualiza dashboard sem tentativa de registrar histórico
