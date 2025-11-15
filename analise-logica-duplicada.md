# Análise de Lógica Duplicada - SafMaplebear

## Resumo Executivo

Esta análise identificou **padrões de código duplicado** em múltiplos componentes do projeto SafMaplebear. As funções duplicadas foram categorizadas em grupos funcionais que podem ser centralizados em arquivos de utilitário.

---

## 1. Formatação de Data e Hora

### Padrões Identificados

**Ocorrências:** 73 instâncias em 25 arquivos

#### Padrões Comuns:
- `new Date().toLocaleString('pt-BR')` - 15 ocorrências
- `new Date().toISOString()` - 12 ocorrências
- `new Date(value).toLocaleDateString('pt-BR')` - 18 ocorrências
- `new Date().toISOString().split('T')[0]` - 8 ocorrências
- `format(new Date(...), 'dd/MM/yyyy')` - 5 ocorrências

#### Arquivos Afetados:
- AIAssistant.tsx, RealAIAssistant.tsx
- ProfileManagement.tsx, AccessControl.tsx
- CanvaDashboard.tsx, LicenseHistory.tsx
- CostManagementDashboard.tsx, InvoiceDialog.tsx
- VoucherManagement.tsx, SchoolAgenda.tsx
- TicketCard.tsx, TicketDialog.tsx, TicketKanban.tsx

### Funções Propostas:
```typescript
// Formatação de data para exibição em português
formatDateBR(date: Date | string): string

// Formatação de data e hora completa
formatDateTimeBR(date: Date | string): string

// Formatação de data para ISO (YYYY-MM-DD)
formatDateISO(date: Date | string): string

// Formatação de data para nome de arquivo
formatDateForFilename(date: Date | string): string

// Formatação curta (dd/MM)
formatDateShort(date: Date | string): string
```

---

## 2. Formatação de Moeda

### Padrões Identificados

**Ocorrências:** 14 instâncias em 3 arquivos

#### Padrões Comuns:
- `R$ ${value.toFixed(2)}` - 10 ocorrências
- `toFixed(2)` para valores monetários - 14 ocorrências

#### Arquivos Afetados:
- CostManagementDashboard.tsx (11 ocorrências)
- InvoiceDialog.tsx (2 ocorrências)
- JustificationRequiredDialog.tsx (1 ocorrência - tamanho de arquivo)

### Funções Propostas:
```typescript
// Formatação de moeda brasileira
formatCurrency(value: number): string

// Formatação de percentual
formatPercentage(value: number, decimals?: number): string

// Formatação de tamanho de arquivo
formatFileSize(bytes: number): string
```

---

## 3. Validação de Email

### Padrões Identificados

**Ocorrências:** 16 instâncias em 12 arquivos

#### Padrões Comuns:
- `email.split('@')[1]` - extração de domínio (6 ocorrências)
- `email.includes('@maplebear')` - verificação de domínio (4 ocorrências)
- `/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)` - validação regex (1 ocorrência)
- Verificação de domínios permitidos (@mbcentral, @seb, @sebsa) - 3 ocorrências

#### Arquivos Afetados:
- UserAnalytics.tsx, ProfileManagement.tsx
- ComplianceAlert.tsx, SchoolDetailsDialog.tsx
- SchoolLicenseCard.tsx, UserDialog.tsx
- EnhancedSchoolManagement.tsx, LicenseManagement.tsx

### Funções Propostas:
```typescript
// Validação de formato de email
validateEmail(email: string): boolean

// Extração de domínio de email
getEmailDomain(email: string): string

// Verificação de domínio corporativo
isAllowedDomain(email: string): boolean

// Verificação de compliance de email
isCompliantEmail(email: string): boolean

// Obter razão de não compliance
getNonComplianceReason(email: string): string
```

---

## 4. Geração e Download de Arquivos

### Padrões Identificados

**Ocorrências:** 20 instâncias em 8 arquivos

#### Padrões Comuns:
- Criação de Blob para CSV: `new Blob([data], { type: 'text/csv' })` - 6 ocorrências
- Criação de URL temporária: `URL.createObjectURL(blob)` - 7 ocorrências
- Download via elemento `<a>`: criar link, definir href, download, click - 8 ocorrências
- Limpeza de URL: `URL.revokeObjectURL(url)` - 5 ocorrências

#### Arquivos Afetados:
- CanvaDashboard.tsx, CostManagementDashboard.tsx
- LicenseHistory.tsx, SchoolLicenseManagement.tsx
- VoucherManagement.tsx, AIKnowledgeBase.tsx
- JustificationsDialog.tsx

### Funções Propostas:
```typescript
// Download de arquivo CSV
downloadCSV(data: string[][], filename: string): void

// Download de arquivo JSON
downloadJSON(data: any, filename: string): void

// Download de arquivo genérico
downloadFile(content: string | Blob, filename: string, mimeType: string): void

// Conversão de array para CSV
arrayToCSV(data: string[][], delimiter?: string): string
```

---

## 5. Formatação de Números

### Padrões Identificados

**Ocorrências:** 8 instâncias em 5 arquivos

#### Padrões Comuns:
- `number.toLocaleString()` - formatação de números grandes - 6 ocorrências
- `number.toLocaleString('pt-BR')` - formatação específica - 2 ocorrências

#### Arquivos Afetados:
- CanvaInsights.tsx, CanvaMetricsDisplay.tsx
- CanvaRankings.tsx, CanvaUsageDashboard.tsx
- Dashboard.tsx, RankingTable.tsx

### Funções Propostas:
```typescript
// Formatação de número com separadores
formatNumber(value: number): string

// Formatação de número com decimais
formatDecimal(value: number, decimals?: number): string
```

---

## 6. Manipulação de Strings

### Padrões Identificados

**Ocorrências:** 3 instâncias em 3 arquivos

#### Padrões Comuns:
- `string.replace(/,/g, ';')` - substituição de vírgulas para CSV
- `string.replace(/:/g, "")` - remoção de caracteres especiais

#### Arquivos Afetados:
- VoucherManagement.tsx, chart.tsx

### Funções Propostas:
```typescript
// Sanitização de string para CSV
sanitizeForCSV(text: string): string

// Geração de ID único limpo
generateCleanId(prefix?: string): string
```

---

## Resumo de Impacto

| Categoria | Ocorrências | Arquivos Afetados | Prioridade |
|-----------|-------------|-------------------|------------|
| Formatação de Data | 73 | 25 | **Alta** |
| Geração de Arquivos | 20 | 8 | **Alta** |
| Validação de Email | 16 | 12 | **Alta** |
| Formatação de Moeda | 14 | 3 | **Média** |
| Formatação de Números | 8 | 5 | **Média** |
| Manipulação de Strings | 3 | 3 | **Baixa** |

---

## Recomendações

1. **Criar arquivo `/src/lib/formatters.ts`** para funções de formatação (data, moeda, números)
2. **Criar arquivo `/src/lib/validators.ts`** para funções de validação (email, CPF, etc)
3. **Criar arquivo `/src/lib/fileUtils.ts`** para funções de download e geração de arquivos
4. **Expandir `/src/lib/utils.ts`** existente com funções de manipulação de strings

## Benefícios Esperados

- ✅ **Redução de código duplicado** em ~130 instâncias
- ✅ **Manutenção centralizada** de lógica crítica
- ✅ **Consistência** na formatação e validação
- ✅ **Facilidade de testes** unitários
- ✅ **Reutilização** em novos componentes
