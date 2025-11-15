# Análise de Problemas de Usabilidade - SAF Maple Bear

## 1. Layout Quebrado em Dispositivos Móveis

### Problemas Identificados

#### Grids sem Responsividade Adequada
```tsx
// ❌ Problema: Grid com 5 colunas em desktop, quebra em mobile
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">

// ❌ Problema: Grid com 4 colunas sem fallback mobile
<div className="grid grid-cols-4 gap-4">

// ❌ Problema: TabsList com muitas colunas
<TabsList className="grid w-full grid-cols-5">
```

#### Componentes com Largura Fixa
```tsx
// ❌ FloatingAIChat.tsx
<Card className="w-96 shadow-2xl">  // 384px fixo

// ❌ Dialogs sem max-width responsivo
<DialogContent className="sm:max-w-[700px]">  // Muito largo para mobile
```

#### Flex Containers sem Wrap
```tsx
// ❌ Múltiplos filtros em linha sem quebra
<div className="flex gap-3">
  <Select className="min-w-[140px]">
  <Select className="min-w-[120px]">
  <Select className="min-w-[110px]">
  // Overflow horizontal em mobile
</div>
```

### Componentes Mais Afetados
1. **CanvaDashboard.tsx** - Grid de 5 colunas
2. **SchoolsDashboard.tsx** - Múltiplos filtros inline
3. **FloatingAIChat.tsx** - Largura fixa de 384px
4. **EnhancedSchoolManagement.tsx** - Grid de 4 colunas sem responsividade
5. **TicketDialog.tsx** - Grid de 3 colunas para watchers

---

## 2. Botões Muito Pequenos para Toque

### Problemas Identificados

#### Botões com `size="sm"` (Tamanho Insuficiente)
Encontrados **118 botões** com `size="sm"` que não atendem o mínimo de 44x44px recomendado para toque.

```tsx
// ❌ Exemplos de botões pequenos
<Button size="sm" variant="ghost">  // ~32x32px
<Button size="sm" className="h-6 w-6 p-0">  // 24x24px - MUITO pequeno
<Button size="sm" className="h-8 w-8 p-0">  // 32x32px - Insuficiente
```

#### Ícones Clicáveis sem Área de Toque Adequada
```tsx
// ❌ Ícones muito pequenos
<Clock className="w-3 h-3" />  // 12px
<User className="w-4 h-4" />   // 16px
<Edit className="w-4 h-4" />   // 16px em botão
```

#### Botões de Ação em Cards
```tsx
// ❌ TicketCard.tsx
<Button variant="ghost" size="sm" className="h-6 w-6 p-0">
  <MoreVertical className="h-3 w-3" />
</Button>

// ❌ AIKnowledgeBase.tsx
<Button size="sm" variant="ghost">
  <Edit className="w-4 h-4" />
</Button>
```

### Impacto
- **Dificuldade de clique** em dispositivos móveis
- **Frustração do usuário** ao tentar tocar em botões pequenos
- **Acessibilidade comprometida** para usuários com dificuldades motoras

---

## 3. Overflow de Texto em Cards

### Problemas Identificados

#### Texto sem Truncamento
```tsx
// ❌ LicenseHistory.tsx
<span className="truncate max-w-[150px]">{action.schoolName}</span>
<span className="text-xs truncate max-w-[200px] block">
  {action.justification}
</span>
```

#### Larguras Máximas Hardcoded
- `max-w-[150px]` - Muito pequeno para nomes de escolas
- `max-w-[200px]` - Insuficiente para justificativas
- `max-w-[80%]` - Percentual fixo sem considerar container

#### Falta de Ellipsis e Tooltip
Muitos textos truncados não possuem tooltip para visualizar conteúdo completo:
```tsx
// ❌ Sem tooltip
<span className="truncate">{longText}</span>

// ✅ Com tooltip
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      <span className="truncate">{longText}</span>
    </TooltipTrigger>
    <TooltipContent>{longText}</TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Componentes Afetados
1. **LicenseHistory.tsx** - Nomes de escolas e justificativas
2. **SchoolLicenseCard.tsx** - Emails e nomes de usuários
3. **FloatingAIChat.tsx** - Mensagens longas
4. **TicketCard.tsx** - Descrições de tickets

---

## 4. Falta de Responsividade Geral

### Problemas Estruturais

#### Headers sem Responsividade
```tsx
// ❌ Flex sem quebra em mobile
<div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
  // Conteúdo pode ficar apertado em tablets
</div>
```

#### Containers sem Padding Responsivo
```tsx
// ❌ Padding fixo
<div className="container mx-auto p-6">
  // Muito espaço em mobile, pouco em desktop
</div>

// ✅ Padding responsivo
<div className="container mx-auto px-4 py-3 md:px-6 md:py-4 lg:px-8 lg:py-6">
```

#### Tabelas sem Scroll Horizontal
Muitas tabelas não possuem scroll horizontal em mobile, causando quebra de layout.

#### Font Sizes Fixos
```tsx
// ❌ Tamanho fixo
<h1 className="text-3xl font-bold">

// ✅ Tamanho responsivo
<h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">
```

---

## Resumo de Impacto

| Problema | Componentes Afetados | Severidade |
|----------|---------------------|------------|
| Layout Quebrado Mobile | ~25 componentes | 🔴 Alta |
| Botões Pequenos | ~30 componentes | 🔴 Alta |
| Overflow de Texto | ~15 componentes | 🟡 Média |
| Responsividade Geral | ~40 componentes | 🟠 Média-Alta |

---

## Diretrizes de Correção

### 1. Tamanhos Mínimos de Toque
- **Botões principais**: mínimo 44x44px (padrão iOS/Android)
- **Botões secundários**: mínimo 36x36px
- **Ícones clicáveis**: mínimo 32x32px com padding

### 2. Breakpoints Recomendados
```css
sm: 640px   /* Mobile landscape */
md: 768px   /* Tablet portrait */
lg: 1024px  /* Tablet landscape / Desktop */
xl: 1280px  /* Desktop large */
2xl: 1536px /* Desktop extra large */
```

### 3. Grid Responsivo
```tsx
// ✅ Padrão recomendado
<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
```

### 4. Truncamento de Texto
```tsx
// ✅ Padrão recomendado
<div className="min-w-0 flex-1">
  <p className="truncate" title={fullText}>
    {fullText}
  </p>
</div>
```

---

## Próximos Passos

1. Criar utilitários CSS para tamanhos de toque
2. Padronizar grids responsivos
3. Implementar sistema de truncamento com tooltip
4. Adicionar scroll horizontal em tabelas
5. Testar em dispositivos reais (mobile, tablet)
