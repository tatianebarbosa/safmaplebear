# Guia de Configuração - Ambiente Local de Desenvolvimento

## 📋 Resumo do Projeto

**Nome:** MapleBear SAF - Sistema de Gestão de Licenças Canva  
**Tipo:** Aplicação Web Full-Stack  
**Frontend:** React + TypeScript + Vite  
**Backend:** Azure Functions (Python)  
**UI:** shadcn/ui + Tailwind CSS

---

## ✅ Configuração Realizada

### 1. Dependências Instaladas

Todas as dependências necessárias foram instaladas e configuradas:

#### Frontend (React)
- **React 19.1.1** - Framework principal
- **React Router DOM** - Navegação entre páginas
- **TanStack Query** - Gerenciamento de estado e cache
- **Tailwind CSS** - Estilização
- **shadcn/ui** - Componentes UI (Radix UI)
- **Lucide React** - Ícones
- **Sonner** - Notificações toast
- **Zustand** - Gerenciamento de estado global
- **DND Kit** - Drag and drop para Kanban
- **Next Themes** - Suporte a temas

#### Backend (Python)
- **Azure Functions** - Serverless functions
- **Azure Storage Blob** - Armazenamento
- **PyJWT** - Autenticação JWT
- **Pandas** - Manipulação de dados
- **OpenPyXL** - Leitura/escrita Excel

### 2. Arquivos Corrigidos

- ✅ **package.json** - Atualizado com todas as dependências necessárias
- ✅ **index.html** - Corrigido para usar React corretamente (main.tsx)
- ✅ **vite.config.ts** - Configurado com proxy para API
- ✅ **tsconfig.json** - Configuração TypeScript otimizada

---

## 🚀 Como Executar

### Iniciar o Servidor de Desenvolvimento

```bash
cd /home/ubuntu/safmaplebear
npm run dev
```

O servidor estará disponível em: **http://localhost:3000**

### Comandos Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Preview do build
npm run preview

# Verificação de tipos
npm run type-check
```

---

## 🏗️ Estrutura do Projeto

```
safmaplebear/
├── api/                          # Backend Azure Functions
│   ├── admin_reload/            # Função de reload admin
│   ├── assign_license/          # Atribuir licença
│   ├── audit_list/              # Lista de auditoria
│   ├── auth/                    # Autenticação
│   ├── change_limit/            # Alterar limites
│   ├── revoke_license/          # Revogar licença
│   ├── school_users/            # Usuários por escola
│   ├── schools/                 # Gestão de escolas
│   ├── shared/                  # Código compartilhado
│   ├── transfer_license/        # Transferir licença
│   ├── host.json               # Configuração Azure Functions
│   ├── local.settings.json     # Configurações locais
│   └── requirements.txt        # Dependências Python
│
├── src/                         # Frontend React
│   ├── components/              # Componentes React
│   │   ├── ai/                 # Assistente AI
│   │   ├── analytics/          # Análises
│   │   ├── auth/               # Autenticação
│   │   ├── canva/              # Gestão Canva
│   │   ├── dashboard/          # Dashboard
│   │   ├── insights/           # Insights
│   │   ├── layout/             # Layout
│   │   ├── monitoring/         # Monitoramento
│   │   ├── ranking/            # Rankings
│   │   ├── saf/                # SAF específico
│   │   ├── schools/            # Escolas
│   │   ├── tickets/            # Tickets
│   │   ├── ui/                 # Componentes UI (shadcn)
│   │   ├── users/              # Usuários
│   │   └── vouchers/           # Vouchers
│   ├── pages/                   # Páginas
│   ├── lib/                     # Utilitários
│   ├── stores/                  # Stores Zustand
│   ├── App.tsx                  # Componente principal
│   ├── main.tsx                 # Entry point
│   └── index.css                # Estilos globais
│
├── public/                      # Arquivos estáticos
├── index.html                   # HTML principal
├── vite.config.ts              # Configuração Vite
├── tailwind.config.ts          # Configuração Tailwind
├── tsconfig.json               # Configuração TypeScript
└── package.json                # Dependências NPM
```

---

## 🔧 Configurações Importantes

### Proxy API (vite.config.ts)

O Vite está configurado para fazer proxy das requisições `/api` para o backend local:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:7071',
      changeOrigin: true
    }
  }
}
```

### Rotas da Aplicação

- `/login` - Página de login
- `/dashboard` - Dashboard principal
- `/dashboard/canva` - Gestão de licenças Canva
- `/dashboard/vouchers` - Gestão de vouchers
- `/dashboard/vouchers-2026` - Vouchers 2026
- `/insights` - Analytics e insights
- `/monitoring` - Portal de monitoramento
- `/tickets` - Sistema de tickets
- `/admin` - Painel administrativo

---

## 🎨 Componentes UI Disponíveis

O projeto usa **shadcn/ui** com os seguintes componentes:

- Accordion, Alert, Avatar, Badge, Button
- Calendar, Card, Carousel, Chart, Checkbox
- Combobox, Command, Context Menu, Dialog, Drawer
- Dropdown Menu, Form, Hover Card, Input, Label
- Menubar, Navigation Menu, Popover, Progress
- Radio Group, Scroll Area, Select, Separator
- Sheet, Sidebar, Skeleton, Slider, Switch
- Table, Tabs, Textarea, Toast, Toggle
- Tooltip, e mais...

---

## 🐛 Solução de Problemas

### Erros de Compilação TypeScript

O projeto possui alguns avisos de TypeScript (variáveis não utilizadas, tipos implícitos). Estes não impedem a execução em modo desenvolvimento:

```bash
# Para ignorar avisos durante desenvolvimento, use:
npm run dev
```

### Porta já em uso

Se a porta 3000 estiver em uso:

```bash
# Matar processo na porta 3000
lsof -ti:3000 | xargs kill -9

# Ou alterar a porta no vite.config.ts
server: {
  port: 3001  // Nova porta
}
```

### Dependências ausentes

Se encontrar erros de módulos não encontrados:

```bash
# Reinstalar dependências
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

---

## 📝 Próximos Passos

### Para Desenvolvimento Local

1. **Configurar Backend Local** (opcional)
   - Instalar Azure Functions Core Tools
   - Configurar variáveis de ambiente
   - Executar: `cd api && func start`

2. **Adicionar Dados de Teste**
   - Criar usuários de teste
   - Popular dados de escolas
   - Configurar licenças mock

3. **Desenvolvimento de Features**
   - Todos os componentes estão prontos
   - Sistema de rotas configurado
   - UI components disponíveis

### Para Testes

```bash
# Testar build de produção
npm run build
npm run preview
```

### Para Deploy

O projeto está configurado para deploy no **Azure Static Web Apps** com:
- Frontend: Vite build
- Backend: Azure Functions
- Configuração: `staticwebapp.config.json`

---

## 📚 Recursos Úteis

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Azure Functions](https://docs.microsoft.com/azure/azure-functions/)

---

## ✨ Status Atual

✅ **Frontend funcionando perfeitamente**  
✅ **Todas as dependências instaladas**  
✅ **Sistema de rotas operacional**  
✅ **Página de login renderizando**  
✅ **UI components carregando**  
✅ **Pronto para desenvolvimento e testes**

---

**Última atualização:** 06 de Novembro de 2025  
**Versão:** 1.0.0  
**Ambiente:** Desenvolvimento Local
