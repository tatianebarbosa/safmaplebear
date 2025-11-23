# 🚀 Começando Agora - Seu Site Rodando

**Status:** ✅ Seu site ESTÁ RODANDO em http://localhost:3002

## ⚡ Próximos 3 Passos para Funcionar Essa Semana

### ✅ PASSO 1: Configurar Conexão com Backend (HOJE)

Seu backend Python/Azure Functions precisa estar configurado. Crie um arquivo `.env`:

```bash
# .env (na raiz do projeto)
VITE_API_BASE_URL=http://localhost:7071
# ou se estiver em Azure:
# VITE_API_BASE_URL=https://seu-funcapp.azurewebsites.net
```

**Verificar se o backend está rodando:**

```bash
# Se local:
cd api
func start
# Deve mostrar: http://localhost:7071
```

### ✅ PASSO 2: Testar Login (AMANHÃ)

1. Abra http://localhost:3002 no navegador
2. Tente fazer login
3. Se der erro, verifique:
   - Backend está rodando?
   - `VITE_API_BASE_URL` está correto?
   - As funções Azure estão configuradas?

**Se o login falhar, execute:**

```bash
# Verificar logs do backend
cd api
func start
# Veja as mensagens de erro
```

### ✅ PASSO 3: Ativar Funcionalidades (ESTA SEMANA)

```bash
# Enquanto o servidor está rodando, vá testando:
npm run dev
# Acesse: http://localhost:3002/dashboard
# Tente: clicar nas abas, escolas, canva, etc
```

---

## 🔧 Comando Rápido para Rodar

```bash
# Em uma aba do terminal (Frontend)
npm run dev
# Acesse: http://localhost:3002

# Em outra aba do terminal (Backend)
cd api
func start
# Será: http://localhost:7071
```

---

## 📋 O Que Você Ainda Precisa Fazer

| Dia        | Tarefa                                           | Status  |
| ---------- | ------------------------------------------------ | ------- |
| **Hoje**   | Configurar `.env` com endpoint do backend        | ⏳ TODO |
| **Amanhã** | Testar login funcional                           | ⏳ TODO |
| **Quarta** | Testar carregamento de dados (escolas, usuários) | ⏳ TODO |
| **Quinta** | Testar Canva integration                         | ⏳ TODO |
| **Sexta**  | Deploy em staging                                | ⏳ TODO |

---

## 🐛 Se Algo Dar Erro

### Erro: "Cannot GET /api/..."

→ Backend não está rodando. Execute `func start` na pasta `api`

### Erro: "CORS error"

→ Backend precisa de CORS configurado. Verifique `api/local.settings.json`

### Erro: "Module not found"

→ Execute `npm install` novamente

### Site branco vazio

→ Verifique console do navegador (F12) para ver erros

---

## 📞 Conexão Backend → Frontend

Seu código já está configurado para usar `apiClient`. Ele conecta em:

```typescript
// Arquivo: src/services/authService.ts
const API_BASE_URL = "/api";

// Usará: http://localhost:3002/api/...
// Que vai para: http://localhost:7071/api/... (backend)
```

**Para mudar o endpoint do backend:**

1. Edite `.env`
2. Reinicie: `npm run dev`

---

## ✅ Checklist - Faça Agora

- [ ] `.env` configurado com backend URL
- [ ] `npm run dev` rodando sem erros
- [ ] Página carrega em http://localhost:3002
- [ ] Backend rodando em paralelo (ou Azure Functions)
- [ ] Testa login na página
- [ ] Abre ferramentas de dev (F12) para verificar erros

---

## 🎯 Meta Desta Semana

```
✅ Site rodando localmente
✅ Login funcionando
✅ Dashboard carregando dados
✅ Pronto para deploy
```

**Tempo estimado:** 2-3 horas

---

**Desenvolvido:** 21 de novembro de 2025  
**Versão:** 1.0 - Início Rápido
