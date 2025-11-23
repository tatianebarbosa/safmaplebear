# 📅 Plano de Ação - Hoje (21 de Novembro)

## ✅ O QUE JÁ FOI FEITO

✅ Frontend buildado e rodando em **http://localhost:3002**  
✅ Dependências instaladas (zod, todas as libs)  
✅ TypeScript compilando (modo não-strict)  
✅ Componentes carregando (sem erros críticos)  
✅ Mascotes corrigidos

**Tempo decorrido:** ~30 minutos  
**Próximo:** Fazer login funcionar

---

## 🎯 O QUE FAZER AGORA (Próximas 2 Horas)

### TAREFA 1: Configurar Backend (15 min)

**Verifique onde seu backend está:**

#### Se for LOCAL (Node/Python local):

```bash
# Abra OUTRA aba do terminal e execute:
cd c:\Users\tatiane.xavier\Documents\safmaplebear\api
func start
# Você verá: http://localhost:7071
```

#### Se for AZURE (Cloud):

```
Pegue a URL em: Portal Azure > Sua Function App > URL
Exemplo: https://seu-funcapp.azurewebsites.net
```

---

### TAREFA 2: Criar Arquivo .env (5 min)

**Crie o arquivo `.env` na RAIZ do projeto:**

```bash
# Caminho: c:\Users\tatiane.xavier\Documents\safmaplebear\.env

# Se backend for LOCAL:
VITE_API_BASE_URL=http://localhost:7071

# Se backend for AZURE, comente a linha acima e descomente:
# VITE_API_BASE_URL=https://seu-funcapp.azurewebsites.net
```

**Depois:**

1. Salve o arquivo
2. Volte para a aba do terminal onde roda `npm run dev`
3. Pressione Ctrl+C e execute novamente:
   ```bash
   npm run dev
   ```

---

### TAREFA 3: Testar Login (30 min)

**Abra no navegador:** http://localhost:3002

**Você vê a tela de login com:**

- [ ] Campo "Usuário"
- [ ] Campo "Senha"
- [ ] Botão "Entrar"
- [ ] Logo Maple Bear

**Se vir tudo isso, tente:**

1. Digite qualquer usuário: `admin`
2. Digite qualquer senha: `123456`
3. Clique "Entrar"

**Esperado:**

- ✅ Se der sucesso → Vai para /dashboard
- ❌ Se der erro → Backend pode não estar respondendo

**Se der erro, execute:**

```bash
# No navegador, pressione F12
# Vá para a aba "Network"
# Tente fazer login novamente
# Procure por "login" na lista
# Veja qual é o erro
```

---

### TAREFA 4: Verificar Dados (30 min)

**Se login funcionar, você verá:**

- [ ] Dashboard com gráficos
- [ ] Aba "Escolas" com lista
- [ ] Aba "Usuários" com tabela
- [ ] Menu lateral funcionando
- [ ] Dark mode toggle

**Se alguma coisa não carregar:**

```bash
# Abra console (F12)
# Procure por erros vermelhos
# Copie a mensagem de erro
# Execute no terminal seu backend:
func start
# Procure por mensagens de erro ali também
```

---

## 📊 Checklist de Conclusão - Se Tudo der Certo

```
✅ Terminal mostra: http://localhost:3002
✅ Navegador abre a página
✅ Tela de login aparece
✅ Login funciona (vai para dashboard)
✅ Dashboard carrega dados
✅ Menu lateral funciona

Resultado: SITE FUNCIONANDO
```

---

## 🔴 Se Algo Der Errado

### Problema 1: "Cannot GET /api/"

```
Causa: Backend não está rodando
Solução: Execute em outro terminal:
  cd api
  func start
```

### Problema 2: "Blank white page"

```
Causa: Erro em JavaScript
Solução: Pressione F12, veja aba "Console"
         Procure por "error" em vermelho
```

### Problema 3: "Cannot find module X"

```
Causa: Dependências faltando
Solução: npm install
```

### Problema 4: "Port already in use"

```
Causa: Outro servidor rodando
Solução: npm run dev vai tentar porta 3002 automaticamente
```

---

## 📝 Anotações Importantes

**Arquivo importante criado:**  
→ `COMECANDO_AGORA.md` (na raiz)

**Comandos que você pode precisar:**

```bash
# Parar servidor
Ctrl+C (na aba do terminal)

# Reiniciar frontend
npm run dev

# Reiniciar backend
cd api && func start

# Build para produção
npm run build
```

---

## ✨ Se Conseguir em 2 Horas

Parabéns! 🎉 Você terá:

✅ Site local rodando  
✅ Backend conectado  
✅ Login funcionando  
✅ Dashboard carregando dados  
✅ Base pronta para deploy

**Próximo:** Corrigir erros TypeScript (opcional, pode deixar para semana que vem)

---

**Comece por:** Tarefa 1 - Verificar backend  
**Tempo total:** 2-3 horas  
**Resultado:** Site 100% funcional localmente
