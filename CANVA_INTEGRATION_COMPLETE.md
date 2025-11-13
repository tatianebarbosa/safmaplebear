# Integração Completa com Canva - Documentação

## 📋 Visão Geral

Esta integração permite coletar automaticamente dados do **Relatório de Uso** do Canva, incluindo métricas detalhadas de uso, licenças e atividades da equipe.

## 🎯 Funcionalidades

### 1. **Coleta Automática de Dados**
- ✅ Login automático no Canva
- ✅ Navegação até o Relatório de Uso
- ✅ Aplicação de filtros de período
- ✅ Extração de métricas detalhadas
- ✅ Extração de tabela de modelos

### 2. **Filtros de Período Suportados**
- **12 meses**
- **6 meses**
- **3 meses**
- **Últimos 30 dias** (padrão)
- **Últimos 14 dias**
- **Últimos 7 dias**

### 3. **Métricas Coletadas**

#### Métricas de Atividade
- **Designs criados**: Número total + % de crescimento
- **Total publicado**: Número total + % de crescimento
- **Total compartilhado**: Número total + % de crescimento

#### Métricas de Pessoas
- **Alunos**: Número total + % de crescimento
- **Professores**: Número total + % de crescimento
- **Administradores**: Número total
- **Total de pessoas**: Soma de todos os usuários

#### Tabela de Modelos
Para cada modelo/template usado:
- Nome do modelo
- Titular (criador)
- Número de vezes usado
- Número de publicações
- Número de compartilhamentos

## 📦 Instalação

### 1. Instalar Dependências Python

```bash
cd api
pip install -r requirements.txt
playwright install chromium
```

### 2. Configurar Variáveis de Ambiente

Crie ou edite o arquivo `api/local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "CANVA_EMAIL": "tatianebarbosa20166@gmail.com",
    "CANVA_PASSWORD": "Tati2025@",
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "python"
  }
}
```

Ou configure as variáveis de ambiente no sistema:

```bash
export CANVA_EMAIL="tatianebarbosa20166@gmail.com"
export CANVA_PASSWORD="Tati2025@"
```

## 🚀 Uso

### Método 1: Coleta Manual (Python)

#### Coletar dados de um período específico:

```python
from api.shared.canva_collector import collect_canva_data_sync

# Coleta dados dos últimos 30 dias
data = collect_canva_data_sync(
    email="tatianebarbosa20166@gmail.com",
    password="Tati2025@",
    headless=True,
    periodo_filtro="Últimos 30 dias"
)

print(f"Designs criados: {data['designs_criados']}")
print(f"Total de pessoas: {data['total_pessoas']}")
```

#### Coletar dados de todos os períodos:

```bash
cd /caminho/para/safmaplebear
python api/collect_all_periods.py
```

Este script irá:
1. Coletar dados de todos os 6 períodos disponíveis
2. Salvar em arquivos CSV no diretório `public/data/`
3. Gerar um relatório resumido em JSON

### Método 2: Azure Function (Timer Trigger)

A função `TimerSyncCanva` é executada automaticamente a cada 24 horas.

#### Configuração do Timer:

Edite `api/TimerSyncCanva/function.json`:

```json
{
  "scriptFile": "__init__.py",
  "bindings": [
    {
      "name": "mytimer",
      "type": "timerTrigger",
      "direction": "in",
      "schedule": "0 0 0 * * *"
    }
  ]
}
```

**Exemplos de Cron:**
- `0 0 0 * * *` - Todos os dias à meia-noite
- `0 0 */6 * * *` - A cada 6 horas
- `0 0 9 * * 1-5` - Dias úteis às 9h

#### Executar localmente:

```bash
cd api
func start
```

### Método 3: Integração com Frontend

#### Criar endpoint HTTP para coleta sob demanda:

```python
# api/canva_collect/__init__.py
import azure.functions as func
from shared.canva_collector import collect_canva_data_sync
import os
import json

def main(req: func.HttpRequest) -> func.HttpResponse:
    """Endpoint para coletar dados do Canva sob demanda"""
    
    # Obtém o período do query string (padrão: Últimos 30 dias)
    periodo = req.params.get('periodo', 'Últimos 30 dias')
    
    # Credenciais
    email = os.getenv('CANVA_EMAIL')
    password = os.getenv('CANVA_PASSWORD')
    
    try:
        # Coleta os dados
        data = collect_canva_data_sync(email, password, headless=True, periodo_filtro=periodo)
        
        return func.HttpResponse(
            json.dumps(data, ensure_ascii=False),
            mimetype="application/json",
            status_code=200
        )
    except Exception as e:
        return func.HttpResponse(
            json.dumps({"erro": str(e)}),
            mimetype="application/json",
            status_code=500
        )
```

#### Chamar do frontend (React/TypeScript):

```typescript
// src/lib/canvaDataCollector.ts
export async function coletarDadosCanva(periodo: string = 'Últimos 30 dias') {
  const response = await fetch(`/api/canva_collect?periodo=${encodeURIComponent(periodo)}`);
  
  if (!response.ok) {
    throw new Error('Erro ao coletar dados do Canva');
  }
  
  return await response.json();
}

// Uso em componente
import { coletarDadosCanva } from '@/lib/canvaDataCollector';

const handleColetar = async () => {
  try {
    setLoading(true);
    const data = await coletarDadosCanva('Últimos 30 dias');
    console.log('Dados coletados:', data);
    // Atualizar estado/UI com os dados
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    setLoading(false);
  }
};
```

## 📊 Estrutura de Dados Retornados

```typescript
interface CanvaMetrics {
  // Métricas de atividade
  designs_criados: number;
  designs_criados_crescimento: number;
  total_publicado: number;
  total_publicado_crescimento: number;
  total_compartilhado: number;
  total_compartilhado_crescimento: number;
  
  // Métricas de pessoas
  alunos: number;
  alunos_crescimento: number;
  professores: number;
  professores_crescimento: number;
  administradores: number;
  total_pessoas: number;
  
  // Tabela de modelos
  modelos: Array<{
    modelo: string;
    titular: string;
    usadas: number;
    publicado: number;
    compartilhado: number;
  }>;
  
  // Metadados
  data_atualizacao: string;      // "13/11/2025"
  hora_atualizacao: string;      // "14:30:45"
  timestamp: number;             // 1699890645000
  periodo_filtro: string;        // "Últimos 30 dias"
}
```

### Exemplo de Dados Retornados:

```json
{
  "designs_criados": 5994,
  "designs_criados_crescimento": 21.0,
  "total_publicado": 10911,
  "total_publicado_crescimento": 1.0,
  "total_compartilhado": 947,
  "total_compartilhado_crescimento": 21.0,
  "alunos": 482,
  "alunos_crescimento": 5.0,
  "professores": 4,
  "professores_crescimento": 0.0,
  "administradores": 11,
  "total_pessoas": 497,
  "modelos": [
    {
      "modelo": "Maple Bear - Apresentação C...",
      "titular": "Maple Bear | Comunicação\ncomunicacao@maplebear.com.br",
      "usadas": 146,
      "publicado": 145,
      "compartilhado": 44
    },
    {
      "modelo": "10 - SLM+ Outubro - Contagem",
      "titular": "Maple Bear | Comunicação\ncomunicacao@maplebear.com.br",
      "usadas": 41,
      "publicado": 46,
      "compartilhado": 2
    }
  ],
  "data_atualizacao": "13/11/2025",
  "hora_atualizacao": "14:30:45",
  "timestamp": 1699890645000,
  "periodo_filtro": "Últimos 30 dias"
}
```

## 🔄 Arquivos Gerados

Ao executar `collect_all_periods.py`, os seguintes arquivos são criados em `public/data/`:

### Métricas por Período:
- `relatorio_canva_ultimos_7_dias.csv`
- `relatorio_canva_ultimos_14_dias.csv`
- `relatorio_canva_ultimos_30_dias.csv`
- `relatorio_canva_3_meses.csv`
- `relatorio_canva_6_meses.csv`
- `relatorio_canva_12_meses.csv`

### Modelos por Período:
- `modelos_canva_ultimos_7_dias.csv`
- `modelos_canva_ultimos_14_dias.csv`
- `modelos_canva_ultimos_30_dias.csv`
- `modelos_canva_3_meses.csv`
- `modelos_canva_6_meses.csv`
- `modelos_canva_12_meses.csv`

### Dados Completos (JSON):
- `canva_data_ultimos_7_dias.json`
- `canva_data_ultimos_14_dias.json`
- `canva_data_ultimos_30_dias.json`
- `canva_data_3_meses.json`
- `canva_data_6_meses.json`
- `canva_data_12_meses.json`

### Resumo da Coleta:
- `canva_coleta_resumo_YYYYMMDD_HHMMSS.json`

## 🛠️ Troubleshooting

### Erro: "Playwright não está instalado"

```bash
pip install playwright
playwright install chromium
```

### Erro: "Timeout ao aguardar conclusão do login"

**Possíveis causas:**
1. Autenticação de dois fatores (2FA) ativada
2. Credenciais incorretas
3. Canva bloqueou o acesso automatizado

**Soluções:**
1. Desative o 2FA temporariamente
2. Verifique as credenciais
3. Execute com `headless=False` para ver o que está acontecendo:

```python
data = collect_canva_data_sync(email, password, headless=False)
```

### Erro: "Botão de filtro não encontrado"

O Canva pode ter mudado a estrutura da página. Execute com `headless=False` e verifique:

```python
collector = CanvaCollector(email, password, headless=False)
```

### Dados não estão sendo extraídos corretamente

1. Verifique se você tem permissões de administrador no Canva
2. Verifique se o Relatório de Uso está acessível
3. Execute com logs detalhados:

```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 📝 Manutenção

### Atualizar Seletores (se o Canva mudar a interface)

Edite `api/shared/canva_collector.py` e atualize os seletores CSS:

```python
# Exemplo: atualizar seletor do botão de login
await self.page.click('button[type="submit"]')  # Antigo
await self.page.click('button[data-testid="login-button"]')  # Novo
```

### Adicionar Novas Métricas

1. Edite a classe `CanvaMetrics` em `canva_collector.py`
2. Adicione o campo desejado
3. Implemente a extração em `_collect_report_data()`

## 🔐 Segurança

### ⚠️ IMPORTANTE:

1. **NUNCA** commite credenciais no repositório
2. Use variáveis de ambiente ou Azure Key Vault
3. Adicione `local.settings.json` ao `.gitignore`
4. Use credenciais de serviço (não pessoais) em produção

### Exemplo de `.gitignore`:

```gitignore
# Credenciais
api/local.settings.json
.env
.env.local

# Dados sensíveis
public/data/canva_*.json
public/data/canva_*.csv
```

## 📈 Próximos Passos

- [ ] Implementar salvamento em Cosmos DB
- [ ] Adicionar gráficos de tendência
- [ ] Implementar alertas para mudanças significativas
- [ ] Adicionar exportação de relatórios em PDF
- [ ] Implementar cache para reduzir coletas
- [ ] Adicionar testes automatizados

## 📞 Suporte

Para dúvidas ou problemas:
1. Verifique os logs: `logging.basicConfig(level=logging.DEBUG)`
2. Execute com `headless=False` para debug visual
3. Consulte a documentação do Playwright: https://playwright.dev/python/

## 📄 Licença

Este código é parte do projeto SAF Maple Bear e deve ser usado apenas internamente.
