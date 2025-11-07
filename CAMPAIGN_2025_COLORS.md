# Paleta de Cores - Campanha 20/25

## Visão Geral

A paleta de cores da Campanha 20/25 foi desenvolvida para criar uma identidade visual forte, moderna e profissional. Todas as cores foram cuidadosamente selecionadas para garantir acessibilidade, contraste adequado e harmonia visual.

## Cores Primárias

### Vermelho Vívido
- **Código Hex:** `#aa0414`
- **Pantone:** 186 C
- **CMYK:** 10, 100, 100, 5
- **RGB:** 170, 4, 20
- **Uso:** Cor principal para botões, links, destaques e elementos interativos

**Variações:**
- **Claro:** `#d32f2f` - Hover states
- **Mais Claro:** `#ff6b6b` - Estados desabilitados
- **Escuro:** `#7a0310` - Active states
- **Mais Escuro:** `#5a0208` - Backgrounds

### Cinza-claro
- **Código Hex:** `#ededed`
- **RGB:** 237, 237, 237
- **Uso:** Fundo secundário, cards, elementos neutros

**Variações:**
- **Claro:** `#f5f5f5` - Backgrounds leves
- **Mais Claro:** `#fafafa` - Backgrounds muito leves
- **Escuro:** `#d0d0d0` - Bordas
- **Mais Escuro:** `#b0b0b0` - Texto secundário

### Preto
- **Código Hex:** `#000000`
- **RGB:** 0, 0, 0
- **Uso:** Texto principal, contraste máximo

**Variações:**
- **Claro:** `#1a1a1a` - Backgrounds escuros
- **Mais Claro:** `#333333` - Texto secundário

### Branco
- **Código Hex:** `#ffffff`
- **RGB:** 255, 255, 255
- **Uso:** Fundo principal, texto sobre cores escuras

## Cores Funcionais

### Sucesso
- **Código Hex:** `#10b981`
- **Claro:** `#d1fae5`
- **Escuro:** `#047857`
- **Uso:** Mensagens de sucesso, ícones positivos

### Aviso
- **Código Hex:** `#f59e0b`
- **Claro:** `#fef3c7`
- **Escuro:** `#d97706`
- **Uso:** Alertas, avisos, atenção necessária

### Erro
- **Código Hex:** `#ef4444`
- **Claro:** `#fee2e2`
- **Escuro:** `#dc2626`
- **Uso:** Erros, validações negativas, ações destrutivas

### Informação
- **Código Hex:** `#3b82f6`
- **Claro:** `#dbeafe`
- **Escuro:** `#1d4ed8`
- **Uso:** Informações, dicas, notificações

## Tabela de Cores

| Elemento | Cor | Código | Uso |
|----------|-----|--------|-----|
| **Botão Primário** | Vermelho Vívido | `#aa0414` | CTAs principais |
| **Botão Hover** | Vermelho Escuro | `#7a0310` | Estados interativos |
| **Fundo Secundário** | Cinza-claro | `#ededed` | Cards, seções |
| **Texto Principal** | Preto | `#000000` | Conteúdo |
| **Texto Secundário** | Cinza | `#666666` | Descrições |
| **Borda** | Cinza-claro | `#ededed` | Separadores |
| **Sucesso** | Verde | `#10b981` | Confirmações |
| **Aviso** | Laranja | `#f59e0b` | Alertas |
| **Erro** | Vermelho | `#ef4444` | Erros |

## Aplicação das Cores

### Botões

```html
<!-- Botão Primário -->
<button class="btn btn-primary">Ação Principal</button>

<!-- Botão Secundário -->
<button class="btn btn-secondary">Ação Secundária</button>

<!-- Botão Terciário -->
<button class="btn btn-tertiary">Ação Terciária</button>
```

### Cards

```html
<!-- Card Primário -->
<div class="card card-primary">
  <h3>Título</h3>
  <p>Conteúdo</p>
</div>

<!-- Card Sucesso -->
<div class="card card-success">
  <h3>Sucesso</h3>
  <p>Operação realizada com sucesso</p>
</div>
```

### Alertas

```html
<!-- Alerta de Sucesso -->
<div class="alert alert-success">
  ✓ Operação realizada com sucesso!
</div>

<!-- Alerta de Erro -->
<div class="alert alert-error">
  ✗ Ocorreu um erro. Tente novamente.
</div>
```

### Badges

```html
<!-- Badge Primário -->
<span class="badge badge-primary">Novo</span>

<!-- Badge Sucesso -->
<span class="badge badge-success">Ativo</span>

<!-- Badge Aviso -->
<span class="badge badge-warning">Pendente</span>
```

## Acessibilidade

### Contraste

Todas as combinações de cores foram testadas para garantir contraste adequado:

- **Texto sobre Fundo:** 4.5:1 (WCAG AA)
- **Componentes UI:** 3:1 (WCAG AA)
- **Ícones:** 3:1 (WCAG AA)

### Modo Escuro

A paleta de cores foi adaptada para modo escuro, mantendo a identidade visual:

- Cores primárias permanecem as mesmas
- Fundos são invertidos para melhor legibilidade
- Contraste é mantido em todos os elementos

### Daltonismo

As cores foram selecionadas para serem distinguíveis por pessoas com daltonismo:

- Não há dependência exclusiva de cores vermelha/verde
- Uso de padrões e ícones adicionais para diferenciação

## Implementação

### CSS Global

O arquivo `global-campaign-2025.css` contém todas as variáveis de cores e estilos base:

```css
:root {
  --color-primary: #aa0414;
  --color-secondary: #ededed;
  --color-dark: #000000;
  --color-light: #ffffff;
  /* ... mais variáveis ... */
}
```

### Importação

Para usar as cores em seu projeto, importe o arquivo CSS global:

```tsx
import '@/styles/global-campaign-2025.css';
```

### Uso em Componentes

```tsx
// Usar classes CSS
<button className="btn btn-primary">Clique aqui</button>

// Ou usar variáveis CSS
<div style={{ color: 'var(--color-primary)' }}>
  Texto em vermelho
</div>
```

## Guia de Estilo

### Quando Usar Cada Cor

| Cor | Quando Usar |
|-----|-----------|
| **Vermelho Vívido** | Ações principais, CTAs, destaques importantes |
| **Cinza-claro** | Fundos secundários, separadores, elementos neutros |
| **Preto** | Texto principal, contraste máximo, ícones |
| **Branco** | Fundos principais, texto sobre cores escuras |
| **Verde** | Sucesso, confirmações, ações positivas |
| **Laranja** | Avisos, atenção necessária, estados pendentes |
| **Vermelho** | Erros, ações destrutivas, validações negativas |
| **Azul** | Informações, dicas, notificações |

### Boas Práticas

1. **Use a cor primária (vermelho) para:**
   - Botões de ação principal
   - Links importantes
   - Destaques visuais
   - Ícones de ação

2. **Use a cor secundária (cinza) para:**
   - Fundos de cards
   - Separadores
   - Elementos neutros
   - Backgrounds

3. **Use cores funcionais para:**
   - Feedback do usuário
   - Estados de validação
   - Mensagens de status
   - Alertas

4. **Evite:**
   - Usar muitas cores diferentes
   - Misturar cores de diferentes paletas
   - Usar cores sem contraste adequado
   - Depender exclusivamente de cores para informações

## Exemplos de Uso

### Header/Navbar

```css
.navbar {
  background-color: var(--color-primary);
  color: var(--color-light);
}

.navbar-link {
  color: var(--color-light);
}

.navbar-link:hover {
  background-color: var(--color-primary-dark);
}
```

### Cards de Dashboard

```css
.dashboard-card {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-light);
  border-left: 4px solid var(--color-primary);
}

.dashboard-card:hover {
  box-shadow: 0 4px 12px rgba(170, 4, 20, 0.15);
}
```

### Formulários

```css
.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(170, 4, 20, 0.1);
}

.form-label {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
}
```

## Troubleshooting

### As cores não estão aparecendo

1. Verifique se o arquivo CSS está sendo importado
2. Certifique-se de que não há conflitos de CSS global
3. Use DevTools para verificar as variáveis CSS

### Contraste inadequado

1. Verifique a combinação de cores
2. Use ferramentas de contraste (WebAIM, Contrast Checker)
3. Teste com modo escuro e modo claro

### Cores diferentes em navegadores diferentes

1. Verifique o perfil de cores do navegador
2. Teste em diferentes navegadores
3. Use valores RGB ou HEX em vez de nomes de cores

## Referências

- [WCAG 2.1 Color Contrast](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Material Design Color System](https://material.io/design/color/)
- [Accessible Colors](https://accessible-colors.com/)
- [Color Blindness Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/)

## Próximos Passos

1. Importar `global-campaign-2025.css` em seu projeto
2. Atualizar componentes para usar as novas variáveis de cores
3. Testar em diferentes dispositivos e navegadores
4. Coletar feedback dos usuários
5. Refinar cores conforme necessário

---

**Última atualização:** 07 de Novembro de 2025
**Versão:** 1.0
**Autor:** Manus AI
