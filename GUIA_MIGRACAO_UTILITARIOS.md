# Guia de Migração para Utilitários Centralizados

## Visão Geral

Este guia documenta a refatoração realizada para centralizar lógica duplicada em arquivos de utilitário reutilizáveis. A migração elimina mais de **130 instâncias de código duplicado** em todo o projeto.

---

## Novos Arquivos Criados

### 📁 `/src/lib/formatters.ts`
Funções de formatação para datas, moedas e números.

### 📁 `/src/lib/validators.ts`
Funções de validação para email, CPF, CNPJ e telefone.

### 📁 `/src/lib/fileUtils.ts`
Funções para geração e download de arquivos (CSV, JSON).

### 📁 `/src/lib/stringUtils.ts`
Funções para manipulação e transformação de strings.

### 📁 `/src/lib/index.ts`
Exportações centralizadas de todos os utilitários.

---

## Como Usar os Novos Utilitários

### Importação Simplificada

```typescript
// ✅ Importar do index centralizado
import { formatCurrency, formatDateBR, validateEmail } from '@/lib';

// ✅ Ou importar de arquivos específicos
import { formatCurrency } from '@/lib/formatters';
import { validateEmail } from '@/lib/validators';
```

---

## Exemplos de Migração

### 1. Formatação de Data

#### ❌ Antes (código duplicado)
```typescript
new Date().toLocaleDateString('pt-BR')
new Date(value).toLocaleString('pt-BR')
new Date().toISOString().split('T')[0]
```

#### ✅ Depois (usando utilitários)
```typescript
import { formatDateBR, formatDateTimeBR, formatDateISO } from '@/lib/formatters';

formatDateBR(new Date())           // "14/11/2025"
formatDateTimeBR(new Date())       // "14/11/2025 15:30:45"
formatDateISO(new Date())          // "2025-11-14"
```

### 2. Formatação de Moeda

#### ❌ Antes (código duplicado)
```typescript
`R$ ${value.toFixed(2)}`
`R$ ${analytics.totalCost.toFixed(2)}`
```

#### ✅ Depois (usando utilitários)
```typescript
import { formatCurrency } from '@/lib/formatters';

formatCurrency(1234.56)            // "R$ 1.234,56"
formatCurrency(analytics.totalCost) // "R$ 10.500,00"
```

### 3. Validação de Email

#### ❌ Antes (código duplicado)
```typescript
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  return 'Email inválido';
}

const domain = email.split('@')[1];
```

#### ✅ Depois (usando utilitários)
```typescript
import { validateEmail, getEmailDomain, isCompliantEmail } from '@/lib/validators';

if (!validateEmail(email)) {
  return 'Email inválido';
}

const domain = getEmailDomain(email);
const isValid = isCompliantEmail(email);
```

### 4. Download de CSV

#### ❌ Antes (código duplicado)
```typescript
const csvContent = data.map(row => row.join(';')).join('\n');
const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
const url = URL.createObjectURL(blob);
const link = document.createElement('a');
link.href = url;
link.download = `arquivo-${new Date().toISOString().split('T')[0]}.csv`;
link.click();
URL.revokeObjectURL(url);
```

#### ✅ Depois (usando utilitários)
```typescript
import { downloadCSV, formatDateForFilename } from '@/lib';

const csvData = [
  ['Coluna 1', 'Coluna 2'],
  ['Valor 1', 'Valor 2']
];

downloadCSV(csvData, `arquivo-${formatDateForFilename()}`);
```

### 5. Formatação de Números

#### ❌ Antes (código duplicado)
```typescript
value.toLocaleString('pt-BR')
percentage.toFixed(1) + '%'
```

#### ✅ Depois (usando utilitários)
```typescript
import { formatNumber, formatPercentage } from '@/lib/formatters';

formatNumber(1234567)              // "1.234.567"
formatPercentage(75.5)             // "75,5%"
```

---

## Componentes Já Refatorados

Os seguintes componentes já foram migrados para usar os novos utilitários:

- ✅ `CostManagementDashboard.tsx` - Formatação de moeda e datas, download de CSV
- ✅ `LicenseHistory.tsx` - Formatação de datas, download de CSV
- ✅ `UserDialog.tsx` - Validação de email
- ✅ `SchoolDetailsDialog.tsx` - Validação de compliance de email
- ✅ `VoucherManagement.tsx` - Download de CSV, sanitização de strings

---

## Componentes Pendentes de Migração

Os seguintes componentes ainda contêm código duplicado e devem ser migrados:

### Alta Prioridade
- `AIAssistant.tsx` - 2 instâncias de formatação de data
- `RealAIAssistant.tsx` - 3 instâncias de formatação de data
- `ProfileManagement.tsx` - 6 instâncias de formatação de data
- `InvoiceDialog.tsx` - 4 instâncias de formatação de data e moeda
- `CanvaInsights.tsx` - 4 instâncias de formatação de números
- `CanvaDashboard.tsx` - Download de CSV
- `SchoolLicenseManagement.tsx` - Download de CSV

### Média Prioridade
- `CanvaMetricsDisplay.tsx` - Formatação de números
- `CanvaRankings.tsx` - Formatação de números
- `CanvaUsageDashboard.tsx` - Formatação de datas e números
- `SchoolAgenda.tsx` - Formatação de datas
- `AIKnowledgeBase.tsx` - Download de JSON, formatação de datas

### Baixa Prioridade
- `AccessControl.tsx` - Formatação de data ISO
- `ComplianceAlert.tsx` - Extração de domínio de email
- `UserAnalytics.tsx` - Verificação de domínio de email
- `TicketCard.tsx`, `TicketDialog.tsx`, `TicketKanban.tsx` - Formatação de datas

---

## Funções Mais Utilizadas

### Formatação de Data
```typescript
formatDateBR(date)           // dd/MM/yyyy
formatDateTimeBR(date)       // dd/MM/yyyy HH:mm:ss
formatDateISO(date)          // yyyy-MM-dd
formatDateForFilename(date)  // yyyy-MM-dd (para nomes de arquivo)
formatDateShort(date)        // dd/MM
```

### Formatação de Moeda e Números
```typescript
formatCurrency(value)        // R$ 1.234,56
formatNumber(value)          // 1.234.567
formatPercentage(value)      // 75,5%
formatFileSize(bytes)        // 1.46 MB
```

### Validação
```typescript
validateEmail(email)         // true/false
validateCPF(cpf)            // true/false
validateCNPJ(cnpj)          // true/false
isCompliantEmail(email)     // true/false
getNonComplianceReason(email) // string
```

### Arquivos
```typescript
downloadCSV(data, filename)
downloadJSON(data, filename)
sanitizeForCSV(text)
generateFilenameWithDate(prefix, ext)
```

---

## Benefícios da Migração

### ✅ Manutenibilidade
- Alterações em lógica de formatação/validação em um único lugar
- Redução de bugs por inconsistências

### ✅ Testabilidade
- Funções isoladas e fáceis de testar
- Testes unitários centralizados

### ✅ Consistência
- Formatação uniforme em toda a aplicação
- Validações padronizadas

### ✅ Reutilização
- Código DRY (Don't Repeat Yourself)
- Fácil adição de novos componentes

### ✅ Performance
- Funções otimizadas e validadas
- Menor bundle size (eliminação de duplicação)

---

## Próximos Passos

1. **Migrar componentes pendentes** seguindo os exemplos deste guia
2. **Adicionar testes unitários** para os novos utilitários
3. **Documentar funções adicionais** conforme necessário
4. **Revisar e otimizar** funções existentes

---

## Suporte

Para dúvidas ou sugestões sobre os utilitários:
- Consulte a documentação inline nos arquivos `/src/lib/*.ts`
- Revise os exemplos nos componentes já refatorados
- Consulte o arquivo `analise-logica-duplicada.md` para contexto completo

---

**Data da Refatoração:** 14/11/2025  
**Versão:** 1.0  
**Status:** Em andamento
