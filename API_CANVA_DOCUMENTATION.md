# 📚 Documentação da API REST do Canva

Esta documentação descreve os endpoints REST disponíveis para interagir com os dados do Canva no sistema SAF Maple Bear.

---

## 🔗 Base URL

**Desenvolvimento Local:**
```
http://localhost:7071/api/canva
```

**Produção (Azure):**
```
https://sua-function-app.azurewebsites.net/api/canva
```

---

## 📋 Endpoints Disponíveis

### 1. GET `/api/canva/dados-recentes`

Retorna os dados mais recentes coletados do Canva.

**Autenticação:** Não requerida

**Método:** `GET`

**Resposta de Sucesso (200):**
```json
{
  "timestamp": 1731520245000,
  "data_atualizacao": "13/11/2025",
  "hora_atualizacao": "20:17:08",
  "periodo_filtro": "Últimos 30 dias",
  "canva_metrics": {
    "designs_criados": 5423,
    "designs_criados_crescimento": 21.0,
    "total_publicado": 8234,
    "total_compartilhado": 1523,
    "alunos": 799,
    "professores": 5,
    "administradores": 15,
    "total_pessoas": 838
  },
  "schools_allocation": [...],
  "unallocated_users_list": [...],
  "unallocated_users_count": 114,
  "modelos": [...]
}
```

**Resposta de Erro (404):**
```json
{
  "error": "Dados não disponíveis",
  "message": "Os dados do Canva ainda não foram coletados. Execute o TimerSyncCanva primeiro."
}
```

**Exemplo de Uso:**
```javascript
fetch('http://localhost:7071/api/canva/dados-recentes')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Erro:', error));
```

---

### 2. POST `/api/canva/coletar-dados`

Executa a coleta de dados do Canva manualmente (sob demanda).

**Autenticação:** Function Key requerida

**Método:** `POST`

**Headers:**
```
Content-Type: application/json
x-functions-key: <sua-function-key>
```

**Body (opcional):**
```json
{
  "periodo_filtro": "Últimos 30 dias"
}
```

**Períodos Válidos:**
- `"12 meses"`
- `"6 meses"`
- `"3 meses"`
- `"Últimos 30 dias"` (padrão)
- `"Últimos 14 dias"`
- `"Últimos 7 dias"`

**Resposta de Sucesso (200):**
```json
{
  "timestamp": 1731520245000,
  "data_atualizacao": "13/11/2025",
  "hora_atualizacao": "20:17:08",
  "periodo_filtro": "Últimos 30 dias",
  "coleta_manual": true,
  "timestamp_coleta": "2025-11-13T20:17:08.123456",
  "canva_metrics": {...},
  "schools_allocation": [...],
  ...
}
```

**Resposta de Erro (500):**
```json
{
  "error": "Configuração inválida",
  "message": "Credenciais do Canva não configuradas. Configure CANVA_EMAIL e CANVA_PASSWORD."
}
```

**Exemplo de Uso:**
```javascript
fetch('http://localhost:7071/api/canva/coletar-dados', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-functions-key': 'sua-function-key'
  },
  body: JSON.stringify({
    periodo_filtro: 'Últimos 30 dias'
  })
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Erro:', error));
```

⚠️ **Atenção:** Esta operação pode levar vários minutos para ser concluída, pois faz scraping do site do Canva.

---

### 3. GET `/api/canva/metricas/{tipo}`

Retorna métricas específicas filtradas por tipo.

**Autenticação:** Não requerida

**Método:** `GET`

**Parâmetros de Rota:**
- `tipo`: Tipo de métrica a ser retornada
  - `pessoas` - Métricas de pessoas (alunos, professores, administradores)
  - `designs` - Métricas de designs (criados, publicados, compartilhados)
  - `membros` - Lista de todos os membros com suas escolas
  - `kits` - Kits de marca disponíveis
  - `escolas` - Informações de escolas e alocação de usuários

**Exemplos de Requisição:**

#### 3.1. Métricas de Pessoas

**GET** `/api/canva/metricas/pessoas`

**Resposta:**
```json
{
  "total_pessoas": 838,
  "alunos": 799,
  "alunos_crescimento": 15.2,
  "professores": 5,
  "professores_crescimento": 0.0,
  "administradores": 15,
  "periodo_filtro": "Últimos 30 dias",
  "data_atualizacao": "13/11/2025"
}
```

#### 3.2. Métricas de Designs

**GET** `/api/canva/metricas/designs`

**Resposta:**
```json
{
  "designs_criados": 5423,
  "designs_criados_crescimento": 21.0,
  "total_publicado": 8234,
  "total_publicado_crescimento": 12.5,
  "total_compartilhado": 1523,
  "total_compartilhado_crescimento": 8.3,
  "periodo_filtro": "Últimos 30 dias",
  "data_atualizacao": "13/11/2025"
}
```

#### 3.3. Lista de Membros

**GET** `/api/canva/metricas/membros`

**Resposta:**
```json
{
  "total_membros": 838,
  "membros": [
    {
      "nome": "João Silva",
      "email": "joao.silva@santamaria.maplebear.com.br",
      "funcao": "Estudante",
      "escola": "Maple Bear Santa Maria",
      "escola_id": "1"
    },
    ...
  ],
  "periodo_filtro": "Últimos 30 dias",
  "data_atualizacao": "13/11/2025"
}
```

#### 3.4. Métricas de Escolas

**GET** `/api/canva/metricas/escolas`

**Resposta:**
```json
{
  "total_escolas": 148,
  "escolas": [
    {
      "escola_id": "1",
      "escola_nome": "Maple Bear Santa Maria",
      "total_usuarios": 12,
      "total_licencas": 2
    },
    ...
  ],
  "usuarios_nao_alocados": 114,
  "periodo_filtro": "Últimos 30 dias",
  "data_atualizacao": "13/11/2025"
}
```

**Exemplo de Uso:**
```javascript
// Obter métricas de pessoas
fetch('http://localhost:7071/api/canva/metricas/pessoas')
  .then(response => response.json())
  .then(data => {
    console.log(`Total de pessoas: ${data.total_pessoas}`);
    console.log(`Alunos: ${data.alunos}`);
  });

// Obter métricas de designs
fetch('http://localhost:7071/api/canva/metricas/designs')
  .then(response => response.json())
  .then(data => {
    console.log(`Designs criados: ${data.designs_criados}`);
  });
```

---

## 🔐 Autenticação

### Endpoints Públicos (Anonymous)
- `GET /api/canva/dados-recentes`
- `GET /api/canva/metricas/{tipo}`

Estes endpoints não requerem autenticação.

### Endpoints Protegidos (Function Key)
- `POST /api/canva/coletar-dados`

Estes endpoints requerem uma Function Key no header:

```javascript
headers: {
  'x-functions-key': 'sua-function-key-aqui'
}
```

**Como obter a Function Key:**

1. Acesse o Azure Portal
2. Navegue até sua Function App
3. Vá em Functions → Nome da função → Function Keys
4. Copie a chave default ou crie uma nova

---

## 🌐 CORS

Todos os endpoints incluem headers CORS para permitir chamadas cross-origin:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

---

## ⚠️ Códigos de Status HTTP

| Código | Descrição |
|--------|-----------|
| 200 | Sucesso |
| 400 | Requisição inválida (parâmetros incorretos) |
| 404 | Recurso não encontrado (dados não disponíveis) |
| 500 | Erro interno do servidor |

---

## 📊 Estrutura de Dados

### CanvaMetrics

```typescript
interface CanvaMetrics {
  designs_criados: number;
  designs_criados_crescimento: number;
  total_publicado: number;
  total_publicado_crescimento: number;
  total_compartilhado: number;
  total_compartilhado_crescimento: number;
  alunos: number;
  alunos_crescimento: number;
  professores: number;
  professores_crescimento: number;
  administradores: number;
  total_pessoas: number;
}
```

### SchoolAllocation

```typescript
interface SchoolAllocation {
  school_id: number;
  school_name: string;
  users: CanvaUser[];
  total_users: number;
  total_licenses: number;
}
```

### CanvaUser

```typescript
interface CanvaUser {
  nome: string;
  email: string;
  funcao: string; // "Estudante" | "Professor" | "Administrador" | "Titular"
}
```

---

## 🧪 Testando a API

### Usando cURL

```bash
# Obter dados recentes
curl http://localhost:7071/api/canva/dados-recentes

# Obter métricas de pessoas
curl http://localhost:7071/api/canva/metricas/pessoas

# Coletar dados manualmente (requer function key)
curl -X POST http://localhost:7071/api/canva/coletar-dados \
  -H "Content-Type: application/json" \
  -H "x-functions-key: sua-function-key" \
  -d '{"periodo_filtro": "Últimos 30 dias"}'
```

### Usando Postman

1. Importe a collection (criar arquivo JSON)
2. Configure a base URL como variável de ambiente
3. Configure a function key como variável de ambiente
4. Execute as requisições

---

## 🔄 Fluxo de Atualização de Dados

```
┌─────────────────────────────────────────┐
│  Timer Trigger (Automático - 24h)      │
│  ou                                     │
│  POST /api/canva/coletar-dados (Manual)│
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Coleta dados do Canva via Playwright   │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Processa e integra com base de escolas │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Salva em canva_data_integrated_latest  │
│  .json                                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Dados disponíveis via GET endpoints    │
└─────────────────────────────────────────┘
```

---

## 📝 Notas Importantes

1. **Performance:** A coleta manual pode levar 2-5 minutos para ser concluída
2. **Rate Limiting:** Evite fazer múltiplas coletas manuais em sequência
3. **Cache:** Os dados são atualizados automaticamente a cada 24h
4. **Timeout:** Requisições de coleta têm timeout de 5 minutos
5. **Credenciais:** Certifique-se de que CANVA_EMAIL e CANVA_PASSWORD estão configurados

---

## 🐛 Troubleshooting

### Erro: "Dados não disponíveis"
- Execute o TimerSyncCanva manualmente ou aguarde a execução automática
- Verifique se o arquivo `canva_data_integrated_latest.json` existe

### Erro: "Credenciais não configuradas"
- Configure as variáveis de ambiente CANVA_EMAIL e CANVA_PASSWORD
- Reinicie a Function App após configurar

### Erro: "Timeout"
- A coleta pode estar demorando mais que o esperado
- Verifique a conectividade com o Canva
- Verifique os logs da Function App para mais detalhes

---

**Última atualização:** 13 de novembro de 2025  
**Versão da API:** 1.0
