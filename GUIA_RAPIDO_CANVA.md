# 🚀 Guia Rápido - Integração Canva

## ✅ O que foi implementado

Implementação completa de um coletor automático de dados do Canva que:

1. **Faz login automaticamente** no Canva com suas credenciais
2. **Navega até o Relatório de Uso**
3. **Aplica filtros de período** (7 dias, 14 dias, 30 dias, 3/6/12 meses)
4. **Extrai todas as métricas** mostradas na imagem que você forneceu
5. **Salva os dados** em CSV e JSON

## 📊 Dados Coletados

### Métricas Principais
- ✅ Designs criados (5.994 + 21%)
- ✅ Total publicado (10.911 + 1%)
- ✅ Total compartilhado (947 + 21%)
- ✅ Alunos (482 + 5%)
- ✅ Professores (4 0%)
- ✅ Administradores
- ✅ Total de pessoas

### Tabela de Modelos
- ✅ Nome do modelo
- ✅ Titular (criador)
- ✅ Vezes usadas
- ✅ Total publicado
- ✅ Total compartilhado

## 🎯 Como Usar

### 1️⃣ Instalar Dependências

```bash
cd api
pip install -r requirements.txt
playwright install chromium
```

### 2️⃣ Configurar Credenciais

Edite `api/local.settings.json`:

```json
{
  "Values": {
    "CANVA_EMAIL": "tatianebarbosa20166@gmail.com",
    "CANVA_PASSWORD": "Tati2025@"
  }
}
```

### 3️⃣ Coletar Dados de Um Período

```python
from api.shared.canva_collector import collect_canva_data_sync

# Coleta dados dos últimos 30 dias
data = collect_canva_data_sync(
    email="tatianebarbosa20166@gmail.com",
    password="Tati2025@",
    periodo_filtro="Últimos 30 dias"
)

print(f"Designs criados: {data['designs_criados']}")
print(f"Total de pessoas: {data['total_pessoas']}")
```

### 4️⃣ Coletar Dados de TODOS os Períodos

```bash
python api/collect_all_periods.py
```

Isso irá:
- Coletar dados de todos os 6 períodos
- Salvar em `public/data/relatorio_canva_*.csv`
- Salvar em `public/data/modelos_canva_*.csv`
- Salvar em `public/data/canva_data_*.json`

## 📁 Arquivos Criados/Modificados

### Novos Arquivos
- ✅ `api/shared/canva_collector.py` - Coletor principal (reescrito)
- ✅ `api/collect_all_periods.py` - Script para coletar todos os períodos
- ✅ `api/test_canva_collector.py` - Testes automatizados
- ✅ `CANVA_INTEGRATION_COMPLETE.md` - Documentação completa

### Arquivos Atualizados
- ✅ `api/requirements.txt` - Adicionado Playwright
- ✅ `api/TimerSyncCanva/__init__.py` - Atualizado para usar novo coletor

## 🔄 Sincronização Automática

A função Azure `TimerSyncCanva` está configurada para rodar automaticamente a cada 24 horas.

Para alterar a frequência, edite `api/TimerSyncCanva/function.json`:

```json
{
  "schedule": "0 0 0 * * *"  // Meia-noite todos os dias
}
```

Exemplos:
- `0 0 */6 * * *` - A cada 6 horas
- `0 0 9 * * 1-5` - Dias úteis às 9h

## 🧪 Testes

Todos os testes passaram com 100% de sucesso:

```bash
python api/test_canva_collector.py
```

Resultado:
```
✓ PASSOU: Imports
✓ PASSOU: CanvaMetrics
✓ PASSOU: CanvaCollector Init
✓ PASSOU: Filtros de Período
✓ PASSOU: Constantes
✓ PASSOU: Estrutura de Arquivos

Total: 6/6 testes passaram (100.0%)
🎉 Todos os testes passaram! O coletor está pronto para uso.
```

## 📝 Exemplo de Dados Retornados

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
  "total_pessoas": 497,
  "modelos": [
    {
      "modelo": "Maple Bear - Apresentação C...",
      "titular": "comunicacao@maplebear.com.br",
      "usadas": 146,
      "publicado": 145,
      "compartilhado": 44
    }
  ],
  "periodo_filtro": "Últimos 30 dias"
}
```

## 🎨 Integração com Frontend

Para usar no frontend React/TypeScript:

```typescript
// Criar endpoint HTTP
// api/canva_collect/__init__.py

import azure.functions as func
from shared.canva_collector import collect_canva_data_sync
import os, json

def main(req: func.HttpRequest) -> func.HttpResponse:
    periodo = req.params.get('periodo', 'Últimos 30 dias')
    email = os.getenv('CANVA_EMAIL')
    password = os.getenv('CANVA_PASSWORD')
    
    data = collect_canva_data_sync(email, password, periodo_filtro=periodo)
    return func.HttpResponse(json.dumps(data), mimetype="application/json")
```

```typescript
// Frontend
const coletarDados = async () => {
  const response = await fetch('/api/canva_collect?periodo=Últimos 30 dias');
  const data = await response.json();
  console.log('Dados:', data);
};
```

## ⚠️ Observações Importantes

1. **Autenticação 2FA**: Se o Canva tiver 2FA ativado, pode ser necessário fazer login manual uma vez
2. **Rate Limiting**: Não execute o coletor muito frequentemente (máximo a cada 15 minutos)
3. **Segurança**: NUNCA commite as credenciais no repositório
4. **Headless Mode**: Use `headless=False` para debug visual

## 📞 Próximos Passos

Para usar a integração:

1. Instale as dependências
2. Configure as credenciais
3. Execute `python api/collect_all_periods.py`
4. Verifique os arquivos em `public/data/`
5. Integre com o frontend conforme necessário

## 📚 Documentação Completa

Para mais detalhes, consulte: `CANVA_INTEGRATION_COMPLETE.md`

---

**Commit realizado com sucesso!** ✅
**Push para GitHub concluído!** ✅

Repositório: https://github.com/tatianebarbosa/safmaplebear
