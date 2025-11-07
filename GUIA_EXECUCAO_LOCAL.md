# Guia de Execução Local - MapleBear SAF

## ✅ Correções Realizadas

Seu projeto foi revisado e corrigido com sucesso! Os seguintes problemas foram identificados e resolvidos:

### 1. Problema da Tela em Branco
- **Causa:** Redirecionamento automático forçado na página de login
- **Solução:** Removido o código que forçava redirecionamento sem autenticação

### 2. Proteção de Rotas Desativada
- **Causa:** Componente `ProtectedRoute` estava comentado
- **Solução:** Reativada a proteção em todas as rotas protegidas

### 3. Credenciais de Login
- **Solução:** Documentadas todas as credenciais disponíveis

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos

1. **Node.js** versão 18 ou superior
   - Verifique: `node --version`
   - Download: https://nodejs.org/

2. **npm** ou **pnpm**
   - Verifique: `npm --version`

### Passo a Passo

#### 1. Clone o Repositório (se ainda não tiver)

```bash
git clone https://github.com/tatianebarbosa/safmaplebear.git
cd safmaplebear
```

#### 2. Instale as Dependências

```bash
npm install --legacy-peer-deps
```

**Nota:** A flag `--legacy-peer-deps` é necessária devido a conflitos de versão do React 19 com algumas bibliotecas.

#### 3. Inicie o Servidor de Desenvolvimento

```bash
npm run dev
```

Você verá uma mensagem como:

```
VITE v7.2.1  ready in 200 ms
➜  Local:   http://localhost:3000/
➜  Network: http://192.168.x.x:3000/
```

#### 4. Acesse a Aplicação

Abra seu navegador e acesse:
```
http://localhost:3000
```

#### 5. Faça Login

Use uma das credenciais abaixo:

**Administrador:**
- Email: `admin@mbcentral.com.br`
- Senha: `maplebear2025`

**Usuário SAF:**
- Email: `saf@seb.com.br`
- Senha: `saf2025`

**Coordenador:**
- Email: `coordenador@sebsa.com.br`
- Senha: `coord2025`

---

## 📝 Estrutura do Projeto

```
safmaplebear/
├── src/
│   ├── pages/
│   │   ├── Login.tsx          # Página de login (CORRIGIDA)
│   │   ├── Index.tsx           # Dashboard principal
│   │   └── ...
│   ├── components/
│   │   ├── auth/
│   │   │   ├── AuthService.ts  # Serviço de autenticação
│   │   │   └── ProtectedRoute.tsx  # Proteção de rotas (REATIVADA)
│   │   └── ...
│   ├── App.tsx                 # Rotas principais (CORRIGIDO)
│   └── main.tsx                # Ponto de entrada
├── vite.config.ts              # Configuração do Vite (ATUALIZADA)
├── package.json
└── ...
```

---

## 🔐 Credenciais de Login

### Credenciais Disponíveis

| Perfil | Email | Senha | Acesso |
|--------|-------|-------|--------|
| Administrador | admin@mbcentral.com.br | maplebear2025 | Completo |
| Usuário SAF | saf@seb.com.br | saf2025 | Padrão |
| Coordenador | coordenador@sebsa.com.br | coord2025 | Padrão |

### Domínios Permitidos

O sistema aceita apenas emails dos seguintes domínios:
- `@mbcentral.com.br`
- `@seb.com.br`
- `@sebsa.com.br`

### Como Adicionar Novos Usuários

Edite o arquivo `src/components/auth/AuthService.ts`, linha 43:

```typescript
private readonly VALID_CREDENTIALS = [
  { email: 'admin@mbcentral.com.br', password: 'maplebear2025', role: 'admin' as const },
  { email: 'saf@seb.com.br', password: 'saf2025', role: 'user' as const },
  { email: 'coordenador@sebsa.com.br', password: 'coord2025', role: 'user' as const },
  // Adicione novos usuários aqui:
  { email: 'novo.usuario@mbcentral.com.br', password: 'senha123', role: 'user' as const }
];
```

---

## 🛠️ Comandos Úteis

### Desenvolvimento
```bash
npm run dev          # Inicia servidor de desenvolvimento
```

### Build
```bash
npm run build        # Compila para produção
npm run preview      # Preview da build de produção
```

### Verificação de Tipos
```bash
npm run type-check   # Verifica erros de TypeScript
```

---

## ⚠️ Observações Importantes

### Sessão e Autenticação

1. **Duração da Sessão:** 7 dias após o login
2. **Logout Automático:** O sistema faz logout automático às segundas-feiras (regra de negócio)
3. **Armazenamento:** Dados salvos no `localStorage` (apenas para desenvolvimento)

### Segurança

⚠️ **IMPORTANTE:** Este sistema usa autenticação local para desenvolvimento. Para produção:

1. Implemente backend real com autenticação JWT
2. Migre credenciais para banco de dados seguro
3. Use cookies httpOnly em vez de localStorage
4. Adicione autenticação de dois fatores (2FA)
5. Configure rate limiting para prevenir ataques

### Backend API

O projeto está configurado para se conectar a uma API backend em:
```
http://localhost:7071
```

Se você tiver o backend configurado, ele será acessado automaticamente através do proxy do Vite.

---

## 🐛 Solução de Problemas

### Problema: Tela em Branco

**Solução:** Já corrigido! Mas se ocorrer novamente:
1. Limpe o localStorage do navegador
2. Faça logout e login novamente
3. Verifique se não há redirecionamentos forçados no código

### Problema: Erro de Dependências

```bash
npm install --legacy-peer-deps --force
```

### Problema: Porta 3000 Ocupada

Edite `vite.config.ts` e altere a porta:
```typescript
server: {
  port: 3001,  // Altere para outra porta
  // ...
}
```

### Problema: Não Consegue Fazer Login

1. Verifique se o email está em um domínio permitido
2. Confirme que a senha está correta (case-sensitive)
3. Abra o console do navegador (F12) para ver erros
4. Limpe o cache e cookies do navegador

---

## 📚 Documentação Adicional

- `CREDENCIAIS_LOGIN.md` - Detalhes sobre autenticação
- `CORRECOES_REALIZADAS.md` - Lista completa de correções
- `README.md` - Informações gerais do projeto

---

## 🎯 Próximos Passos Recomendados

1. ✅ Executar o projeto localmente
2. ✅ Fazer login com credenciais fornecidas
3. ✅ Explorar as funcionalidades do dashboard
4. 🔄 Implementar backend real (se necessário)
5. 🔄 Configurar deploy em produção
6. 🔄 Adicionar testes automatizados

---

## 💡 Dicas

- Use o **Chrome DevTools** (F12) para debugar
- O **React DevTools** extension ajuda muito
- Mantenha o console aberto para ver erros
- Use `console.log()` para debugar quando necessário

---

## 📞 Suporte

Se encontrar problemas:
1. Verifique o console do navegador (F12)
2. Verifique o terminal onde o servidor está rodando
3. Consulte a documentação do Vite: https://vitejs.dev/
4. Consulte a documentação do React: https://react.dev/

---

**Última atualização:** 07/11/2025
**Versão:** 1.0.0
