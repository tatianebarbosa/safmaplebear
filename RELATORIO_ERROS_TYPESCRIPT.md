# Relatório de Erros de TypeScript Pendentes

Este relatório lista e categoriza os 102 erros de TypeScript restantes que impedem o build de produção do projeto. A maioria dos erros são avisos de código limpo que o compilador está tratando como erros devido à configuração estrita do `tsconfig.json`.

## 📊 Resumo dos Erros por Categoria

| Categoria | Código de Erro | Descrição | Quantidade | Prioridade |
| :--- | :--- | :--- | :--- | :--- |
| **Código Não Utilizado** | `TS6133` | Variável, import ou função declarada, mas nunca lida/utilizada. | **87** | Média (Limpeza de Código) |
| **Imports Não Utilizados** | `TS6192` | Declaração de importação completamente não utilizada. | **2** | Média (Limpeza de Código) |
| **Módulo Não Encontrado** | `TS2307` | Módulo importado não encontrado (dependência ausente ou caminho incorreto). | **3** | Alta (Funcionalidade) |
| **Tipagem Incorreta** | `TS2322` | Tipo incorreto atribuído a uma variável. | **1** | Alta (Estabilidade) |
| **Propriedade Inexistente** | `TS2353` | Tentativa de acessar uma propriedade que não existe no tipo. | **1** | Alta (Estabilidade) |
| **Augmentação Inválida** | `TS2664` | Augmentação de módulo inválida (relacionado a `jspdf`). | **1** | Alta (Funcionalidade) |
| **Outros** | - | Erros diversos (ex: `TS5097` já corrigido). | **7** | Alta/Média |
| **TOTAL** | | | **102** | |

## 📝 Detalhamento dos Erros Críticos (Prioridade Alta)

Estes erros precisam ser corrigidos para que o build de produção seja bem-sucedido.

| Código | Arquivo | Linha | Descrição | Ação Necessária |
| :--- | :--- | :--- | :--- | :--- |
| `TS2307` | `src/components/ui/resizable.tsx` | 2 | Cannot find module 'react-resizable-panels'. | Instalar `react-resizable-panels` ou remover o componente se não for usado. |
| `TS2307` | `src/lib/pdfGenerator.ts` | 1 | Cannot find module 'jspdf'. | Instalar `jspdf` e `@types/jspdf` ou remover o código de geração de PDF se não for usado. |
| `TS2664` | `src/lib/pdfGenerator.ts` | 5 | Invalid module name in augmentation, module 'jspdf' cannot be found. | Depende da correção do `TS2307` acima. |
| `TS2322` | `src/components/canva/EnhancedSchoolManagement.tsx` | 136 | Type 'string \| undefined' is not assignable to type 'string'. | Adicionar verificação de `undefined` ou fornecer um valor padrão. |
| `TS2353` | `src/components/canva/SchoolLicenseCard.tsx` | 170 | Object literal may only specify known properties, and 'timestamp' does not exist in type 'Omit<Justification, "id" \| "timestamp">'. | Corrigir a tipagem da interface `Justification` ou a forma como o objeto está sendo criado. |

## 🧹 Detalhamento dos Erros de Limpeza de Código (`TS6133` e `TS6192`)

A grande maioria dos erros são imports e variáveis não utilizadas. Para corrigir, basta remover as linhas de código indicadas.

| Arquivo | Linhas de Erro | Variáveis/Imports Não Utilizados |
| :--- | :--- | :--- |
| `src/App.tsx` | 5 | `MonitoringPage` |
| `src/components/ai/FloatingAIChat.tsx` | 6 | `MessageSquare` |
| `src/components/auth/AccessControl.tsx` | 7 | `isFirstAccess` |
| `src/components/auth/ProfileManagement.tsx` | 8, 93 | `Camera`, `Clock`, `Shield`, `isSessionExpired` |
| `src/components/canva/CanvaDashboard.tsx` | 12, 13, 14, 15 | `React`, `SchoolLicenseOverview`, `officialData`, `getPeriodLabel` |
| `src/components/canva/CanvaInsights.tsx` | 16 | `React` |
| `src/components/canva/CanvaUsageDashboard.tsx` | 17 | `React` |
| `src/components/canva/CostManagementDashboard.tsx` | 18, 19, 20, 21, 22 | `React`, `BarChart`, `Bar`, `Upload`, `entry` |
| `src/components/canva/EnhancedSchoolManagement.tsx` | 23, 24, 25 | `React`, `Building2`, `CanvaUser` |
| `src/components/canva/ImportPreviewDialog.tsx` | 28 | `React` |
| `src/components/canva/InvoiceDialog.tsx` | 29 | `Textarea` |
| `src/components/canva/JustificationRequiredDialog.tsx` | 30, 31, 32 | `Input`, `searchTeamMembers`, `handleFileChange` |
| `src/components/canva/JustificationsDialog.tsx` | 33 | `React` |
| `src/components/canva/LicenseHistory.tsx` | 34, 35, 36 | `React`, `Calendar`, `filterLicenseHistory` |
| `src/components/canva/LicenseManagement.tsx` | 37, 38, 39 | `React`, `Minus`, `Input` |
| `src/components/canva/SchoolDetailsDialog.tsx` | 40, 41, 42, 43 | `React`, `Button`, `Phone`, `isEmailValid` |
| `src/components/canva/SchoolLicenseCard.tsx` | 44, 45, 46, 47 | `React`, `Progress`, `onViewDetails`, `isEmailValid` |
| `src/components/canva/SchoolLicenseManagement.tsx` | 49, 50, 51, 52, 53 | `Combobox`, `Filter`, `ClusterType`, `LicenseStatus`, `schoolOptions` |
| `src/components/dashboard/StatsCard.tsx` | 54 | `LucideIcon` |
| `src/components/insights/InsightsAnalytics.tsx` | 55, 56 | `selectedMetric`, `setSelectedMetric` |
| `src/components/layout/Header.tsx` | 57, 58 | `BarChart3`, `Activity` |
| `src/components/monitoring/MonitoringPortal.tsx` | 59, 60, 61 | `Search`, `setSearchTerm`, `setStatusFilter` |
| `src/components/ranking/RankingDashboard.tsx` | 62 | `CanvaUserData` |
| `src/components/ranking/RankingTable.tsx` | 63 | `positionChange` |
| `src/components/saf/AIKnowledgeBase.tsx` | 64, 65, 66, 67, 68 | `CardDescription`, `CardHeader`, `CardTitle`, `FileText`, `Upload` |
| `src/components/saf/SAFControlCenter.tsx` | 69, 70 | `useEffect`, `setTickets` |
| `src/components/saf/VoucherManagement.tsx` | 71, 72, 73, 74 | `CardDescription`, `CardHeader`, `CardTitle`, `index` |
| `src/components/schools/SchoolAgenda.tsx` | 75, 76 | `CardHeader`, `CardTitle` |
| `src/components/schools/SchoolsDashboard.tsx` | 77, 78, 79, 80 | `DialogTrigger`, `Filter`, `showAddVoucher`, `setShowAddVoucher` |
| `src/components/tickets/TicketKanban.tsx` | 81 | `Button` |
| `src/components/tickets/TicketTable.tsx` | 82 | `useState` |
| `src/components/ui/calendar.tsx` | 83, 84 | `_props` (2x) |
| `src/components/users/UserManagement.tsx` | 86, 87, 88 | `CardDescription`, `Upload`, `Users` |
| `src/lib/canvaDataProcessor.ts` | 89 | `ALLOWED_DOMAINS` |
| `src/lib/csvProcessor.ts` | 90, 91 | `headers`, `index` |
| `src/lib/officialDataProcessor.ts` | 92 | `headers` |
| `src/lib/schoolDataProcessor.ts` | 95 | `headers` |
| `src/lib/voucherDataProcessor.ts` | 96 | `exceptions` |
| `src/pages/MonitoringPage.tsx` | 97 | `tickets` |
| `src/pages/TicketsPage.tsx` | 98, 99, 100, 101, 102 | `CardDescription`, `Badge`, `Tabs`, `Filter`, `tickets` |

## 🛠️ Próximos Passos Sugeridos

Se você deseja que o projeto compile sem erros para um build de produção, o próximo passo seria:

1.  **Instalar Módulos Ausentes:** Instalar `react-resizable-panels` e `jspdf` (e seus tipos).
2.  **Limpeza de Código:** Percorrer os arquivos listados e remover todos os imports e variáveis não utilizadas.
3.  **Correção de Tipagem:** Corrigir os erros `TS2322` e `TS2353`.

Posso começar a implementar essas correções agora, focando primeiro nos erros de módulo ausente.
