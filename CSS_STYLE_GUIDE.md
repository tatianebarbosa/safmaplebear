# Guia de Estilo CSS - Dashboard Moderno

## Visão Geral

Este guia apresenta as melhores práticas de CSS aplicadas ao novo dashboard de licenças Canva, criando uma interface moderna, profissional e acessível.

## Princípios de Design

### 1. **Design System Consistente**

O projeto utiliza um sistema de cores, espaçamento e tipografia bem definidos através de variáveis CSS:

```css
/* Cores Primárias */
--color-primary: #6366f1;
--color-primary-light: #e0e7ff;
--color-primary-dark: #4f46e5;

/* Espaçamento (8px base) */
--spacing-md: 1rem;    /* 16px */
--spacing-lg: 1.5rem;  /* 24px */
--spacing-xl: 2rem;    /* 32px */

/* Border Radius */
--radius-md: 0.5rem;   /* 8px */
--radius-lg: 0.75rem;  /* 12px */
--radius-xl: 1rem;     /* 16px */
```

### 2. **Hierarquia Visual**

- **Tipografia**: Tamanhos e pesos bem definidos para criar hierarquia
- **Cores**: Uso estratégico de cores para destacar elementos importantes
- **Espaçamento**: Margem e padding consistentes para melhor legibilidade
- **Sombras**: Profundidade visual através de sombras sutis

### 3. **Acessibilidade**

- Contraste de cores adequado (WCAG AA)
- Suporte a modo escuro
- Navegação por teclado
- Modo de alto contraste
- Suporte a movimento reduzido

## Componentes

### Card

O card é o componente base do dashboard:

```tsx
<div className="card card-primary">
  <div className="card-header">
    <h3>Título</h3>
    <span className="card-icon">🎨</span>
  </div>
  <div className="card-value">
    <div className="number">123</div>
    <div className="label">Descrição</div>
  </div>
</div>
```

**Variações:**
- `.card-primary` - Azul (primário)
- `.card-success` - Verde (sucesso)
- `.card-warning` - Amarelo (aviso)
- `.card-info` - Azul claro (informação)

### Progress Bar

Indicador visual de progresso:

```tsx
<div className="progress-bar">
  <div className="progress-fill" style={{ width: '75%' }}></div>
</div>
```

### Botões

Três variações de botões:

```tsx
<button className="action-btn action-btn-primary">Primário</button>
<button className="action-btn action-btn-secondary">Secundário</button>
<button className="action-btn action-btn-tertiary">Terciário</button>
```

### Info Box

Caixa de informação com ícone:

```tsx
<div className="info-box">
  <div className="info-icon">ℹ️</div>
  <div className="info-content">
    <h4>Título</h4>
    <p>Descrição</p>
  </div>
</div>
```

## Animações

### Transições Suaves

Todas as transições usam `cubic-bezier` para movimento natural:

```css
--transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-base: 300ms cubic-bezier(0.4, 0, 0.2, 1);
--transition-slow: 500ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Animações Principais

1. **Float** - Logo flutuante no header
2. **Pulse** - Pulsação dos ícones
3. **Spin** - Rotação do botão de atualização
4. **Shimmer** - Efeito de brilho na progress bar
5. **CountUp** - Animação de contagem dos números
6. **Loading** - Efeito de carregamento do skeleton

## Responsividade

### Breakpoints

- **Desktop**: > 768px
- **Tablet**: 480px - 768px
- **Mobile**: < 480px

### Grid Responsivo

```css
.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: var(--spacing-xl);
}
```

O grid se adapta automaticamente ao tamanho da tela.

## Modo Escuro

O projeto suporta modo escuro através de `prefers-color-scheme`:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #111827;
    --color-text: #f3f4f6;
    /* ... outras cores ... */
  }
}
```

## Sombras

Hierarquia de sombras para profundidade:

```css
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
```

## Boas Práticas

### 1. Use Variáveis CSS

```css
/* ✅ Bom */
padding: var(--spacing-lg);
color: var(--color-text);

/* ❌ Evite */
padding: 24px;
color: #1f2937;
```

### 2. Mantenha Consistência

- Use a mesma paleta de cores
- Siga o espaçamento definido
- Use transições consistentes

### 3. Mobile First

```css
/* ✅ Bom - Começa mobile, depois desktop */
.card {
  grid-column: 1fr;
}

@media (min-width: 768px) {
  .card {
    grid-column: repeat(2, 1fr);
  }
}

/* ❌ Evite - Começa desktop, depois mobile */
.card {
  grid-column: repeat(2, 1fr);
}

@media (max-width: 768px) {
  .card {
    grid-column: 1fr;
  }
}
```

### 4. Acessibilidade

```css
/* ✅ Bom - Suporta navegação por teclado */
.btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* ✅ Bom - Respeita preferência de movimento */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
  }
}
```

### 5. Contraste Adequado

Todas as cores seguem WCAG AA:

- Texto sobre fundo: 4.5:1
- Componentes UI: 3:1

## Integração no Projeto

### 1. Importar o Componente

```tsx
import { CanvaLicensesDashboard } from '@/components/canva/CanvaLicensesDashboard';
```

### 2. Usar o Componente

```tsx
<CanvaLicensesDashboard
  dados={{
    totalPessoas: 836,
    pessoasAtivas: 613,
    pessoasInativas: 223,
    dataAtualizacao: '07/11/2025',
    horaAtualizacao: '14:30:45',
    tendencia: 'aumento',
    percentualMudanca: 5.2,
    historico: [
      { data: '01/11', quantidade: 800 },
      { data: '02/11', quantidade: 810 },
      // ...
    ]
  }}
  loading={false}
  onRefresh={() => console.log('Atualizar dados')}
/>
```

### 3. Personalizar Cores

Para mudar as cores primárias, edite as variáveis CSS:

```css
:root {
  --color-primary: #seu-color;
  --color-primary-light: #seu-color-light;
  --color-primary-dark: #seu-color-dark;
}
```

## Troubleshooting

### As cores não estão aparecendo

- Verifique se o CSS está sendo importado
- Certifique-se de que não há conflitos de CSS global
- Use `!important` como último recurso

### As animações estão muito rápidas/lentas

- Ajuste as variáveis de transição
- Verifique se o usuário tem `prefers-reduced-motion` ativado

### O layout não está responsivo

- Verifique os breakpoints
- Teste com DevTools do navegador
- Certifique-se de que o viewport meta está correto

## Referências

- [MDN - CSS Variables](https://developer.mozilla.org/en-US/docs/Web/CSS/--*)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Tailwind CSS - Design System](https://tailwindcss.com/)
- [Material Design 3](https://m3.material.io/)

## Próximos Passos

1. Integrar o componente no dashboard
2. Testar em diferentes dispositivos
3. Coletar feedback dos usuários
4. Refinar cores e espaçamento conforme necessário
5. Adicionar mais animações e interações
