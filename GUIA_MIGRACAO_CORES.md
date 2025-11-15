# Guia de Migração de Cores - Design System

## Substituições de Classes Tailwind Hardcoded

### ✅ Cores de Sucesso (Verde)
| ❌ Antes (Hardcoded) | ✅ Depois (CSS Variables) |
|---------------------|---------------------------|
| `bg-green-50` | `bg-success-bg` |
| `bg-green-100` | `bg-success-bg` |
| `bg-green-500` | `bg-success` |
| `bg-green-600` | `bg-success` |
| `bg-green-700` | `bg-success-dark` (se necessário) |
| `text-green-600` | `text-success` |
| `text-green-700` | `text-success` |
| `text-green-800` | `text-success-foreground` |
| `border-green-200` | `border-success/20` |
| `border-green-600` | `border-success` |

### ⚠️ Cores de Aviso (Amarelo/Laranja)
| ❌ Antes (Hardcoded) | ✅ Depois (CSS Variables) |
|---------------------|---------------------------|
| `bg-yellow-50` | `bg-warning-bg` |
| `bg-yellow-100` | `bg-warning-bg` |
| `bg-orange-50` | `bg-warning-bg` |
| `bg-orange-100` | `bg-warning-bg` |
| `bg-orange-500` | `bg-warning` |
| `text-yellow-600` | `text-warning` |
| `text-yellow-800` | `text-warning-foreground` |
| `text-orange-800` | `text-warning-foreground` |
| `border-yellow-200` | `border-warning/20` |

### 🔴 Cores de Erro (Vermelho)
| ❌ Antes (Hardcoded) | ✅ Depois (CSS Variables) |
|---------------------|---------------------------|
| `bg-red-50` | `bg-destructive-bg` |
| `bg-red-100` | `bg-destructive-bg` |
| `bg-red-500` | `bg-destructive` |
| `bg-red-600` | `bg-destructive` |
| `text-red-600` | `text-destructive` |
| `text-red-800` | `text-destructive-foreground` |
| `border-red-100` | `border-destructive/20` |
| `border-red-200` | `border-destructive/20` |

### 🔵 Cores de Informação (Azul)
| ❌ Antes (Hardcoded) | ✅ Depois (CSS Variables) |
|---------------------|---------------------------|
| `bg-blue-50` | `bg-info-bg` |
| `bg-blue-100` | `bg-info-bg` |
| `bg-blue-500` | `bg-info` |
| `text-blue-800` | `text-info-foreground` |
| `border-blue-100` | `border-info/20` |

### ⚪ Cores Neutras (Cinza)
| ❌ Antes (Hardcoded) | ✅ Depois (CSS Variables) |
|---------------------|---------------------------|
| `bg-gray-50` | `bg-muted` |
| `bg-gray-100` | `bg-muted` |
| `bg-gray-200` | `bg-muted` |
| `text-gray-500` | `text-muted-foreground` |
| `text-gray-600` | `text-muted-foreground` |
| `text-gray-800` | `text-foreground` |
| `border-gray-200` | `border-border` |

---

## Migração de Badges

### Antes (Classes Customizadas)
```tsx
<Badge className="bg-green-100 text-green-800">Ativo</Badge>
<Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>
<Badge className="bg-red-100 text-red-800">Erro</Badge>
<Badge className="bg-blue-100 text-blue-800">Info</Badge>
```

### Depois (Variantes Semânticas)
```tsx
<Badge variant="success">Ativo</Badge>
<Badge variant="warning">Pendente</Badge>
<Badge variant="destructive">Erro</Badge>
<Badge variant="info">Info</Badge>
```

---

## Exemplos de Componentes Migrados

### AccessControl.tsx
```tsx
// ❌ Antes
<div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
  <p className="text-sm text-yellow-800 dark:text-yellow-200">
    Sua solicitação está pendente
  </p>
</div>

// ✅ Depois
<div className="card-padding-md bg-warning-bg rounded-lg">
  <p className="body-md text-warning-foreground">
    Sua solicitação está pendente
  </p>
</div>
```

### TicketCard.tsx
```tsx
// ❌ Antes
<Badge className="text-xs bg-orange-100 text-orange-800">
  Atenção {ticket.diasAberto}d
</Badge>

// ✅ Depois
<Badge variant="warning" className="body-sm">
  Atenção {ticket.diasAberto}d
</Badge>
```

### SchoolAgenda.tsx
```tsx
// ❌ Antes
<Badge className="bg-blue-500 hover:bg-blue-600">Agendado</Badge>
<Badge className="bg-orange-500 hover:bg-orange-600">Em Andamento</Badge>
<Badge className="bg-green-500 hover:bg-green-600">Concluído</Badge>

// ✅ Depois
<Badge variant="info">Agendado</Badge>
<Badge variant="warning">Em Andamento</Badge>
<Badge variant="success">Concluído</Badge>
```

---

## Benefícios da Migração

1. **Consistência Visual**: Todas as cores seguem o mesmo padrão
2. **Modo Escuro Automático**: CSS variables ajustam automaticamente
3. **Manutenção Facilitada**: Mudanças centralizadas em `index.css`
4. **Acessibilidade**: Contraste garantido pelas variáveis semânticas
5. **Redução de Código**: Menos classes customizadas inline

---

## Checklist de Migração

- [ ] Substituir todas as classes `bg-green-*` por `bg-success-*`
- [ ] Substituir todas as classes `bg-yellow-*` e `bg-orange-*` por `bg-warning-*`
- [ ] Substituir todas as classes `bg-red-*` por `bg-destructive-*`
- [ ] Substituir todas as classes `bg-blue-*` por `bg-info-*`
- [ ] Substituir todas as classes `bg-gray-*` por `bg-muted`
- [ ] Migrar badges customizados para variantes semânticas
- [ ] Padronizar espaçamento com classes utilitárias (`gap-md`, `card-padding-md`)
- [ ] Padronizar tipografia com classes utilitárias (`heading-3`, `body-md`)
- [ ] Testar em modo claro e escuro
