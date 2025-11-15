# Análise de Inconsistências Visuais - SAF Maple Bear

## 1. Mistura de Paletas de Cores (Tailwind vs. CSS Variables)

### Problema Identificado
O projeto utiliza **duas abordagens diferentes** para definir cores:

#### CSS Variables (index.css)
```css
--maple-red: 349 76% 35%;
--success: 142 76% 36%;
--warning: 32 95% 44%;
--destructive: 0 84% 60%;
```

#### Classes Tailwind Hardcoded
Encontradas em múltiplos componentes:
- `bg-green-50`, `text-green-800`, `border-green-200`
- `bg-red-50`, `text-red-800`, `bg-red-500`
- `bg-yellow-50`, `text-yellow-800`, `bg-yellow-100`
- `bg-blue-50`, `text-blue-800`, `bg-blue-100`
- `bg-orange-100`, `text-orange-800`, `bg-orange-500`
- `bg-gray-100`, `text-gray-800`, `bg-gray-200`

### Componentes Afetados
- `AccessControl.tsx` - usa `bg-yellow-50`, `bg-red-50`
- `ProfileManagement.tsx` - usa `bg-green-600`, `bg-green-700`
- `CanvaLicensesDashboard.tsx` - usa classes inline
- `TicketCard.tsx` - usa `bg-orange-100`, `bg-yellow-100`, `bg-blue-100`
- `TicketKanban.tsx` - mesmas inconsistências
- `SchoolAgenda.tsx` - usa `bg-blue-500`, `bg-orange-500`, `bg-green-500`
- `CanvaRankings.tsx` - usa `bg-yellow-100`, `bg-gray-100`, `bg-amber-50`

---

## 2. Badges com Variantes Limitadas

### Problema Identificado
O componente `Badge` possui apenas **4 variantes**:
```typescript
variants: {
  variant: {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground",
  },
}
```

### Uso Inconsistente
Muitos componentes aplicam **classes customizadas** diretamente nos badges:
```tsx
<Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
<Badge className="bg-green-100 text-green-800">Ativo</Badge>
<Badge className="bg-orange-100 text-orange-800">Atenção</Badge>
<Badge className="bg-blue-100 text-blue-800">Em andamento</Badge>
```

### Componentes Afetados
- `TicketCard.tsx` - 3 badges customizados
- `TicketTable.tsx` - 3 badges customizados
- `SchoolAgenda.tsx` - 4 badges customizados
- `CanvaRankings.tsx` - badges com gradientes customizados
- `RankingTable.tsx` - badges com gradientes

---

## 3. Padding e Espaçamento Inconsistentes

### Problema Identificado
Uso **não padronizado** de valores de espaçamento:

#### Gaps
- `gap-1`, `gap-2`, `gap-3`, `gap-4`, `gap-6` (sem padrão claro)
- Alguns componentes usam `gap-1.5` (valor intermediário)

#### Padding
- `p-2`, `p-3`, `p-4`, `p-6`, `p-8`
- `px-2`, `px-3`, `px-4` (horizontal)
- `py-1`, `py-1.5`, `py-3`, `py-6`, `py-8`, `py-16` (vertical)

#### Exemplos de Inconsistência
```tsx
// Diferentes espaçamentos para cards similares
<CardContent className="p-4">  // Alguns cards
<CardContent className="p-6">  // Outros cards
<CardContent className="py-8"> // Outros ainda

// Gaps variados para flex containers
<div className="flex gap-2">
<div className="flex gap-3">
<div className="flex gap-4">
```

### Componentes Mais Afetados
- Todos os componentes de dashboard
- Componentes de formulários
- Cards de estatísticas

---

## 4. Tipografia e Border-Radius Não Padronizadas

### Problema Identificado

#### Border Radius
Apesar de ter variáveis CSS definidas:
```css
--radius: 0.75rem;
borderRadius: {
  lg: "var(--radius)",
  md: "calc(var(--radius) - 2px)",
  sm: "calc(var(--radius) - 4px)",
}
```

Muitos componentes usam valores **hardcoded**:
- `rounded-full` (badges, avatares)
- `rounded-lg` (cards)
- `rounded-md` (inputs)
- `rounded` (genérico)

#### Tipografia
Tamanhos de fonte inconsistentes:
- `text-xs`, `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`
- Sem hierarquia clara ou sistema de design

#### Font Weight
- `font-medium`, `font-semibold`, `font-bold`
- Uso inconsistente entre componentes similares

### Exemplos
```tsx
// Títulos de cards com tamanhos diferentes
<CardTitle className="text-base">  // Alguns
<CardTitle className="text-lg">    // Outros
<CardTitle className="text-xl">    // Outros ainda

// Badges com diferentes border-radius
<Badge className="rounded-full">
<Badge className="rounded">
```

---

## Resumo de Impacto

| Inconsistência | Componentes Afetados | Severidade |
|----------------|---------------------|------------|
| Paleta de Cores | ~40 componentes | 🔴 Alta |
| Badges | ~30 componentes | 🟡 Média |
| Espaçamento | ~60 componentes | 🟡 Média |
| Tipografia/Radius | ~50 componentes | 🟠 Média-Alta |

---

## Próximos Passos
1. Criar variantes de badge para todos os estados (success, warning, info)
2. Remover classes Tailwind hardcoded e usar CSS variables
3. Padronizar espaçamento usando escala consistente
4. Definir hierarquia tipográfica clara
