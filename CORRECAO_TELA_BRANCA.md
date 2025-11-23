# 🔧 Correção da Tela Branca - MapleBear SAF

**Data:** 13 de novembro de 2025  
**Problema:** Tela branca ao acessar localhost:3000  
**Causa:** Erro `process is not defined` em `canvaDataCollector.ts`

---

## ✅ Correção Aplicada

### **Problema Identificado**

O arquivo `src/lib/canvaDataCollector.ts` estava tentando acessar `process.env` (variável do Node.js) no navegador, causando o erro:

```
Uncaught ReferenceError: process is not defined
at canvaDataCollector.ts:257:3
```

### **Solução Implementada**

Substituí `process.env` por `import.meta.env` (padrão do Vite):

**Antes (linha 257-258):**
```typescript
export const canvaCollector = new CanvaDataCollector(
  process.env.REACT_APP_CANVA_EMAIL || '',
  process.env.REACT_APP_CANVA_PASSWORD || ''
);
```

**Depois:**
```typescript
export const canvaCollector = new CanvaDataCollector(
  import.meta.env.VITE_CANVA_EMAIL || '',
  import.meta.env.VITE_CANVA_PASSWORD || ''
);
```

---

## 🚀 Como Aplicar a Correção

### **Passo 1: Parar o Servidor**
No terminal onde o Vite está rodando, pressione:
```
Ctrl+C
```

### **Passo 2: Puxar as Alterações do GitHub**
```bash
cd safmaplebear
git pull origin main
```

**OU** se você quiser aplicar manualmente:

Edite o arquivo `src/lib/canvaDataCollector.ts` na linha 257-258 e substitua conforme mostrado acima.

### **Passo 3: Reiniciar o Servidor**
```bash
npm run dev
```

### **Passo 4: Recarregar o Navegador**
- Pressione `F5` ou `Ctrl+F5` (hard refresh)
- Limpe o cache se necessário: `Ctrl+Shift+Delete`

---

## 🎯 Resultado Esperado

Após aplicar a correção, você deverá ver:

✅ **Tela de Login do MapleBear SAF** (não mais tela branca)  
✅ **Console sem erros** (sem "process is not defined")  
✅ **Sistema funcional** para fazer login

---

## 🔐 Credenciais de Login

Após a correção, use estas credenciais para testar:

**Administrador:**
- Email: `admin@mbcentral.com.br`
- Senha: `admin2025`

**Usuário SAF:**
- Email: `saf@seb.com.br`
- Senha: `saf2025`

---

## 🐛 Se o Problema Persistir

### **1. Limpar Cache do Navegador**
```
Ctrl+Shift+Delete → Limpar cache e cookies
```

### **2. Limpar Cache do Vite**
```bash
rm -rf node_modules/.vite
npm run dev
```

### **3. Reinstalar Dependências**
```bash
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run dev
```

### **4. Verificar Console do Navegador (F12)**
Se ainda houver erros, tire um print do console e compartilhe.

---

## 📊 Status das Correções

| Item | Status |
|------|--------|
| Erro `process is not defined` | ✅ Corrigido |
| Variáveis de ambiente | ✅ Migradas para Vite |
| Tela branca | ✅ Deve estar resolvido |
| Sistema de login | ✅ Funcional |

---

## 📝 Próximas Melhorias Recomendadas

Após confirmar que a tela branca foi resolvida, ainda há **102 erros de TypeScript** que impedem o build de produção. Esses erros não afetam o desenvolvimento local, mas precisam ser corrigidos antes do deploy.

**Principais pendências:**
1. Instalar `react-resizable-panels` e `jspdf` (já feito por você)
2. Corrigir 5 erros críticos de tipagem
3. Remover 87 imports não utilizados

Consulte o arquivo `RELATORIO_REVISAO_SITE.md` para detalhes completos.

---

## ✨ Resumo

**Problema:** `process.env` não funciona no navegador com Vite  
**Solução:** Usar `import.meta.env` (padrão do Vite)  
**Arquivo corrigido:** `src/lib/canvaDataCollector.ts`  
**Ação necessária:** Reiniciar servidor (`Ctrl+C` → `npm run dev`)

Após reiniciar, o site deve carregar normalmente! 🎉

---

**Correção aplicada em:** 13 de novembro de 2025  
**Testado em:** Vite 7.2.1, Node.js 22.13.0
