# Documentacao da API REST do Canva

Esta documentacao descreve os endpoints do Canva atualmente disponiveis.

Base URL local:

`http://localhost:7071/api/canva`

## Endpoints disponiveis

### 1. GET `/api/canva/dados-recentes`

Retorna os dados de relatorio mais recentes.

**Autenticacao:** Nao requerida  
**Metodo:** `GET`

**Exemplo**

```javascript
fetch('http://localhost:7071/api/canva/dados-recentes')
  .then(response => response.json())
  .then(data => console.log(data));
```

---

### 2. GET `/api/canva/metricas/{tipo}`

Retorna metricas filtradas por tipo:

- `pessoas`
- `designs`
- `membros`
- `kits`
- `escolas`

**Autenticacao:** Nao requerida  
**Metodo:** `GET`

**Exemplo**

```javascript
fetch('http://localhost:7071/api/canva/metricas/pessoas')
  .then(response => response.json())
  .then(data => console.log(data));
```

---

### 3. GET `/api/canva/overview`

Retorna o resumo consolidado para o dashboard de compliance.

**Autenticacao:** Nao requerida  
**Metodo:** `GET`

```javascript
fetch('http://localhost:7071/api/canva/overview')
  .then(response => response.json())
  .then(data => console.log(data));
```

## Autenticacao

Os endpoints acima nao exigem Function Key (anonymous).

## Observacoes

- Foram removidos: coleta automática, registro e reversão de alteracoes e endpoint de historico.
- A atualizacao dos dados ocorre por upload manual de arquivos CSV.
