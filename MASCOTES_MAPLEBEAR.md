# Mascotes e Logos Maple Bear - Guia de Uso

## 📋 Visão Geral

Este documento descreve como usar os mascotes e logos institucionais da Maple Bear no projeto SafMaplebear.

---

## 📁 Estrutura de Arquivos

```
src/assets/maplebear/
├── mascots/
│   ├── bear_waving.png         # Urso acenando (saudação)
│   ├── bear_happy.png          # Urso feliz (boas-vindas)
│   ├── bear_leaning.png        # Urso apoiado (relaxado)
│   ├── bear_thinking.png       # Urso pensando (erro/dúvida)
│   ├── bear_idea.png           # Urso com ideia (sucesso)
│   ├── bear_writing.png        # Urso escrevendo (formulários)
│   ├── bear_reading.png        # Urso lendo (documentação)
│   ├── bear_investigating.png  # Urso investigando (loading)
│   ├── bear_peeking.png        # Urso espiando (404)
│   └── bear_pulling.png        # Urso puxando (processamento)
├── logos/
│   ├── maple_logos.png         # Logos completos (3 versões)
│   └── maple_logo_outline.png  # Logo outline
└── index.ts                    # Arquivo de exportação
```

---

## 🎨 Como Usar

### Importação Básica

```typescript
// Importar mascotes individuais
import { BearWaving, BearThinking, BearIdea } from '@/assets/maplebear';

// Importar todos os mascotes organizados
import { Mascots, Logos, MascotUsage } from '@/assets/maplebear';
```

### Usando o Componente Mascot

```tsx
import { Mascot } from '@/components/ui/mascot';
import { BearWaving } from '@/assets/maplebear';

function MyComponent() {
  return (
    <Mascot 
      src={BearWaving} 
      size="lg" 
      alt="Bem-vindo!" 
      animated 
    />
  );
}
```

**Tamanhos disponíveis:**
- `sm` - 64px (w-16 h-16)
- `md` - 96px (w-24 h-24) - padrão
- `lg` - 128px (w-32 h-32)
- `xl` - 192px (w-48 h-48)

### Usando o Componente LoadingMascot

```tsx
import { LoadingMascot } from '@/components/ui/loading-mascot';

function LoadingScreen() {
  return (
    <LoadingMascot 
      message="Carregando dados..." 
      size="lg" 
    />
  );
}
```

---

## 🎯 Uso Recomendado por Contexto

### Telas de Feedback

| Contexto | Mascote | Uso |
|----------|---------|-----|
| **Sucesso** | `BearIdea` | Operação concluída com sucesso |
| **Erro** | `BearThinking` | Erro ou problema encontrado |
| **Loading** | `BearInvestigating` | Carregamento/processamento |
| **404** | `BearPeeking` | Página não encontrada |

### Telas de Autenticação

| Contexto | Mascote | Uso |
|----------|---------|-----|
| **Login** | `BearWaving` | Tela de login (saudação) |
| **Boas-vindas** | `BearHappy` | Após login bem-sucedido |

### Telas de Conteúdo

| Contexto | Mascote | Uso |
|----------|---------|-----|
| **Leitura** | `BearReading` | Documentação, artigos |
| **Escrita** | `BearWriting` | Formulários, edição |
| **Trabalho** | `BearPulling` | Processamento pesado |

---

## 📦 Integrações Realizadas

### ✅ Página de Login
- **Arquivo:** `src/pages/Login.tsx`
- **Mascote:** `BearWaving` (urso acenando)
- **Localização:** Header do card de login

### ✅ Página 404 (Not Found)
- **Arquivo:** `src/pages/NotFound.tsx`
- **Mascote:** `BearPeeking` (urso espiando)
- **Localização:** Centro da página

### ✅ Loading de Autenticação
- **Arquivo:** `src/components/auth/ProtectedRoute.tsx`
- **Mascote:** `BearInvestigating` (urso investigando)
- **Componente:** `LoadingMascot`

### ✅ Header do Sistema
- **Arquivo:** `src/components/layout/Header.tsx`
- **Mascote:** `BearHappy` (urso feliz)
- **Localização:** Logo ao lado do título

---

## 🔧 Componentes Criados

### 1. Mascot Component
**Arquivo:** `src/components/ui/mascot.tsx`

Componente reutilizável para exibir mascotes com tamanhos padronizados.

**Props:**
- `src` (string) - Caminho da imagem
- `alt` (string) - Texto alternativo
- `size` ('sm' | 'md' | 'lg' | 'xl') - Tamanho do mascote
- `className` (string) - Classes CSS adicionais
- `animated` (boolean) - Adiciona animação bounce

### 2. LoadingMascot Component
**Arquivo:** `src/components/ui/loading-mascot.tsx`

Componente especializado para telas de carregamento.

**Props:**
- `message` (string) - Mensagem de loading
- `size` ('sm' | 'md' | 'lg' | 'xl') - Tamanho do mascote
- `className` (string) - Classes CSS adicionais

---

## 💡 Exemplos de Uso

### Exemplo 1: Tela de Sucesso

```tsx
import { Mascot } from '@/components/ui/mascot';
import { BearIdea } from '@/assets/maplebear';

function SuccessPage() {
  return (
    <div className="flex flex-col items-center">
      <Mascot src={BearIdea} size="xl" animated />
      <h2>Operação realizada com sucesso!</h2>
    </div>
  );
}
```

### Exemplo 2: Tela de Erro

```tsx
import { Mascot } from '@/components/ui/mascot';
import { BearThinking } from '@/assets/maplebear';

function ErrorPage() {
  return (
    <div className="flex flex-col items-center">
      <Mascot src={BearThinking} size="lg" />
      <h2>Ops! Algo deu errado</h2>
      <p>Estamos investigando o problema...</p>
    </div>
  );
}
```

### Exemplo 3: Usando MascotUsage

```tsx
import { MascotUsage } from '@/assets/maplebear';
import { Mascot } from '@/components/ui/mascot';

function DynamicMascot({ context }: { context: keyof typeof MascotUsage }) {
  return (
    <Mascot 
      src={MascotUsage[context]} 
      size="lg" 
    />
  );
}

// Uso:
<DynamicMascot context="success" />
<DynamicMascot context="error" />
<DynamicMascot context="loading" />
```

---

## 🎨 Logos Institucionais

### Logo Completo (3 versões)
```tsx
import { MapleLogos } from '@/assets/maplebear';

<img src={MapleLogos} alt="Maple Bear Logos" />
```

Contém:
- Logo Canadian School (urso com bandeira)
- Logo Elementary School (escudo vermelho)
- Logo High School (escudo preto)

### Logo Outline
```tsx
import { MapleLogoOutline } from '@/assets/maplebear';

<img src={MapleLogoOutline} alt="Maple Bear Logo" />
```

---

## 📊 Informações Técnicas

### Tamanhos dos Arquivos

| Arquivo | Tamanho |
|---------|---------|
| bear_happy.png | 24 KB |
| bear_waving.png | 95 KB |
| bear_thinking.png | 88 KB |
| bear_investigating.png | 102 KB |
| bear_idea.png | 101 KB |
| bear_writing.png | 104 KB |
| bear_reading.png | 93 KB |
| bear_peeking.png | 47 KB |
| bear_pulling.png | 91 KB |
| bear_leaning.png | 89 KB |
| maple_logos.png | 46 KB |
| maple_logo_outline.png | 1.2 KB |

### Formato
- Todas as imagens estão em formato PNG
- Fundo transparente
- Otimizadas para web

---

## 🚀 Próximos Passos Sugeridos

### Integrações Futuras

1. **Tela de Sucesso de Operações**
   - Usar `BearIdea` para confirmações
   - Adicionar animação de celebração

2. **Tela de Erro Genérica**
   - Usar `BearThinking` para erros
   - Adicionar mensagens contextuais

3. **Dashboard de Boas-vindas**
   - Usar `BearHappy` para saudação
   - Personalizar por horário do dia

4. **Tela de Documentação**
   - Usar `BearReading` para guias
   - Adicionar tooltips com mascotes

5. **Formulários Longos**
   - Usar `BearWriting` para indicar progresso
   - Adicionar feedback visual

---

## 🗄️ Banco de Dados (Opcional)

Para gerenciamento dinâmico dos mascotes, você pode criar uma tabela:

```sql
CREATE TABLE mascots (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  path VARCHAR(255) NOT NULL,
  category ENUM('feedback', 'logo', 'illustration', 'action') NOT NULL,
  context VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exemplo de inserção
INSERT INTO mascots (name, path, category, context, description) VALUES
('Bear Waving', '/assets/maplebear/mascots/bear_waving.png', 'illustration', 'login', 'Urso acenando para saudação'),
('Bear Thinking', '/assets/maplebear/mascots/bear_thinking.png', 'feedback', 'error', 'Urso pensando para telas de erro'),
('Bear Investigating', '/assets/maplebear/mascots/bear_investigating.png', 'action', 'loading', 'Urso investigando para loading');
```

---

## 📞 Suporte

Para dúvidas ou sugestões sobre o uso dos mascotes:
- Consulte a documentação do projeto
- Verifique os exemplos de implementação
- Revise os componentes criados em `src/components/ui/`

---

**Última atualização:** 07/11/2025
**Versão:** 1.0.0
