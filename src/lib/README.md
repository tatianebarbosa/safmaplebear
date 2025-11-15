# Biblioteca de Utilitários - SafMaplebear

Esta pasta contém utilitários centralizados para formatação, validação e manipulação de dados utilizados em todo o projeto.

---

## 📚 Arquivos

### `formatters.ts`
Funções de formatação para datas, moedas, números e arquivos.

**Principais funções:**
- `formatDateBR()` - Formata data para padrão brasileiro
- `formatDateTimeBR()` - Formata data e hora completa
- `formatDateISO()` - Formata data para padrão ISO
- `formatCurrency()` - Formata valores monetários em reais
- `formatNumber()` - Formata números com separadores
- `formatPercentage()` - Formata percentuais
- `formatFileSize()` - Formata tamanho de arquivos

### `validators.ts`
Funções de validação para email, CPF, CNPJ, telefone e compliance.

**Principais funções:**
- `validateEmail()` - Valida formato de email
- `validateCPF()` - Valida CPF brasileiro
- `validateCNPJ()` - Valida CNPJ brasileiro
- `validatePhone()` - Valida telefone brasileiro
- `isCompliantEmail()` - Verifica compliance de email
- `getNonComplianceReason()` - Retorna razão de não compliance
- `getEmailDomain()` - Extrai domínio de email

### `fileUtils.ts`
Funções para geração, download e manipulação de arquivos.

**Principais funções:**
- `downloadCSV()` - Faz download de arquivo CSV
- `downloadJSON()` - Faz download de arquivo JSON
- `arrayToCSV()` - Converte array para CSV
- `sanitizeForCSV()` - Sanitiza texto para CSV
- `readFileAsText()` - Lê arquivo como texto
- `validateFileType()` - Valida tipo de arquivo

### `stringUtils.ts`
Funções para manipulação e transformação de strings.

**Principais funções:**
- `generateCleanId()` - Gera ID único limpo
- `toTitleCase()` - Converte para Title Case
- `removeAccents()` - Remove acentos
- `truncate()` - Trunca string com reticências
- `isEmpty()` - Verifica se string está vazia
- `extractEmails()` - Extrai emails de texto
- `stringSimilarity()` - Calcula similaridade entre strings

### `utils.ts`
Utilitário original do projeto (classnames).

**Funções:**
- `cn()` - Combina classes CSS com Tailwind

### `index.ts`
Exportações centralizadas de todos os utilitários.

---

## 🚀 Como Usar

### Importação Recomendada

```typescript
// Importar do index centralizado
import { 
  formatCurrency, 
  formatDateBR, 
  validateEmail,
  downloadCSV 
} from '@/lib';
```

### Importação Específica

```typescript
// Importar de arquivo específico
import { formatCurrency } from '@/lib/formatters';
import { validateEmail } from '@/lib/validators';
```

---

## 📖 Exemplos de Uso

### Formatação de Data

```typescript
import { formatDateBR, formatDateTimeBR, formatDateISO } from '@/lib';

const hoje = new Date();

formatDateBR(hoje);        // "14/11/2025"
formatDateTimeBR(hoje);    // "14/11/2025 15:30:45"
formatDateISO(hoje);       // "2025-11-14"
```

### Formatação de Moeda

```typescript
import { formatCurrency, formatPercentage } from '@/lib';

formatCurrency(1234.56);   // "R$ 1.234,56"
formatPercentage(75.5);    // "75,5%"
```

### Validação de Email

```typescript
import { 
  validateEmail, 
  isCompliantEmail, 
  getNonComplianceReason 
} from '@/lib';

const email = "usuario@maplebear.com.br";

validateEmail(email);              // true
isCompliantEmail(email);           // true
getNonComplianceReason(email);     // "Email em compliance"
```

### Download de CSV

```typescript
import { downloadCSV, formatDateForFilename } from '@/lib';

const dados = [
  ['Nome', 'Email', 'Idade'],
  ['João', 'joao@email.com', '30'],
  ['Maria', 'maria@email.com', '25']
];

downloadCSV(dados, `usuarios-${formatDateForFilename()}`);
// Gera: usuarios-2025-11-14.csv
```

### Validação de CPF

```typescript
import { validateCPF, formatCPF } from '@/lib';

const cpf = "12345678900";

validateCPF(cpf);          // true/false
formatCPF(cpf);            // "123.456.789-00"
```

---

## 🎯 Casos de Uso Comuns

### 1. Exportar Dados para CSV

```typescript
import { downloadCSV, formatDateBR, formatCurrency } from '@/lib';

const exportarFaturas = (faturas) => {
  const csvData = [
    ['Data', 'Descrição', 'Valor'],
    ...faturas.map(f => [
      formatDateBR(f.data),
      f.descricao,
      formatCurrency(f.valor)
    ])
  ];
  
  downloadCSV(csvData, 'faturas');
};
```

### 2. Validar Formulário

```typescript
import { validateEmail, validateCPF, isEmpty } from '@/lib';

const validarFormulario = (dados) => {
  const erros = {};
  
  if (isEmpty(dados.nome)) {
    erros.nome = 'Nome é obrigatório';
  }
  
  if (!validateEmail(dados.email)) {
    erros.email = 'Email inválido';
  }
  
  if (!validateCPF(dados.cpf)) {
    erros.cpf = 'CPF inválido';
  }
  
  return erros;
};
```

### 3. Formatar Dashboard

```typescript
import { formatCurrency, formatNumber, formatPercentage } from '@/lib';

const Dashboard = ({ analytics }) => (
  <div>
    <StatsCard 
      title="Receita Total"
      value={formatCurrency(analytics.receita)}
    />
    <StatsCard 
      title="Usuários Ativos"
      value={formatNumber(analytics.usuarios)}
    />
    <StatsCard 
      title="Taxa de Conversão"
      value={formatPercentage(analytics.conversao)}
    />
  </div>
);
```

---

## 🧪 Testes

Cada arquivo de utilitário deve ter testes unitários correspondentes:

```
src/lib/
  ├── formatters.ts
  ├── formatters.test.ts
  ├── validators.ts
  ├── validators.test.ts
  ├── fileUtils.ts
  ├── fileUtils.test.ts
  └── ...
```

---

## 📝 Convenções

### Nomenclatura
- Funções de formatação: `format*` (ex: `formatCurrency`)
- Funções de validação: `validate*` ou `is*` (ex: `validateEmail`, `isEmpty`)
- Funções de conversão: `to*` ou `parse*` (ex: `toTitleCase`, `parseCurrency`)
- Funções de geração: `generate*` (ex: `generateCleanId`)

### Documentação
- Todas as funções devem ter JSDoc com descrição, parâmetros e exemplos
- Incluir tipos TypeScript para todos os parâmetros e retornos
- Adicionar exemplos de uso no JSDoc

### Tratamento de Erros
- Funções de validação retornam `boolean`
- Funções de formatação retornam string vazia ou valor padrão em caso de erro
- Não lançar exceções, retornar valores seguros

---

## 🔄 Atualizações

Para adicionar novas funções:

1. Adicione a função no arquivo apropriado (`formatters.ts`, `validators.ts`, etc)
2. Inclua documentação JSDoc completa
3. Adicione testes unitários
4. Exporte a função no `index.ts`
5. Atualize este README com exemplos

---

## 📊 Estatísticas

- **Total de funções:** 80+
- **Linhas de código duplicado eliminadas:** ~500
- **Componentes refatorados:** 5+
- **Componentes pendentes:** 20+

---

## 🤝 Contribuindo

Ao adicionar novos utilitários:

1. ✅ Mantenha funções pequenas e focadas
2. ✅ Documente com JSDoc
3. ✅ Adicione testes unitários
4. ✅ Use TypeScript com tipos explícitos
5. ✅ Siga as convenções de nomenclatura
6. ✅ Evite dependências externas quando possível

---

## 📚 Referências

- [Análise de Lógica Duplicada](../../analise-logica-duplicada.md)
- [Guia de Migração](../../GUIA_MIGRACAO_UTILITARIOS.md)

---

**Última atualização:** 14/11/2025
