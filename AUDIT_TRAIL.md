# Sistema de Histórico de Alterações (Audit Trail)

Este documento descreve como usar o sistema de histórico de alterações no projeto.

## Visão Geral

O sistema de histórico de alterações permite que você:

1. **Registre automaticamente** todas as alterações feitas no sistema
2. **Rastreie quem** fez a alteração (usuário, e-mail)
3. **Saiba quando** a alteração foi feita (data, hora, timestamp)
4. **Entenda o quê** foi alterado (descrição, campos modificados)
5. **Reverta** alterações anteriores com um clique

## Tipos de Alterações

O sistema suporta os seguintes tipos de alterações:

- **CRIAR** - Criação de uma nova entidade
- **ATUALIZAR** - Atualização de uma entidade existente
- **EXCLUIR** - Exclusão de uma entidade
- **REVERTER** - Reversão de uma alteração anterior
- **TRANSFERIR** - Transferência de uma entidade para outro responsável
- **ATIVAR** - Ativação de uma entidade
- **DESATIVAR** - Desativação de uma entidade

## Tipos de Entidades

O sistema pode rastrear alterações em:

- **ESCOLA** - Escolas e franquias
- **USUARIO** - Usuários do sistema
- **LICENCA_CANVA** - Licenças do Canva
- **FRANQUIA** - Franquias
- **CLUSTER** - Clusters de escolas

## Uso

### 1. Registrar uma Alteração

```typescript
import { auditTrail, TipoAlteracao, TipoEntidade } from '@/lib/auditTrail';

// Registrar uma alteração
await auditTrail.registrarAlteracao(
  TipoAlteracao.ATUALIZAR,           // Tipo de alteração
  TipoEntidade.USUARIO,               // Tipo de entidade
  'usuario-123',                       // ID da entidade
  'João Silva',                        // Nome da entidade
  'user-001',                          // ID do usuário que fez a alteração
  'Admin',                             // Nome do usuário
  'admin@example.com',                 // E-mail do usuário
  'Alterou o status do usuário de ativo para inativo', // Descrição
  [                                    // Campos alterados (opcional)
    {
      campo: 'status',
      valorAnterior: 'ativo',
      valorNovo: 'inativo'
    }
  ]
);
```

### 2. Exibir o Histórico de Alterações

Importe o componente `HistoricoAlteracoes` em qualquer página:

```tsx
import { HistoricoAlteracoes } from '@/components/auditoria/HistoricoAlteracoes';
import { TipoEntidade } from '@/lib/auditTrail';

export default function PaginaEscola() {
  return (
    <div>
      <h1>Detalhes da Escola</h1>
      
      <HistoricoAlteracoes
        tipoEntidade={TipoEntidade.ESCOLA}
        idEntidade="escola-123"
        nomeEntidade="Maple Bear São Roque"
        limite={50}
      />
    </div>
  );
}
```

### 3. Obter o Histórico Programaticamente

```typescript
import { auditTrail, TipoEntidade } from '@/lib/auditTrail';

// Obter o histórico de uma entidade
const historico = await auditTrail.obterHistorico(
  TipoEntidade.ESCOLA,
  'escola-123',
  50 // limite de registros
);

// Obter o histórico de um usuário
const historicoUsuario = await auditTrail.obterHistoricoUsuario('user-001', 50);

// Obter um registro específico
const registro = await auditTrail.obterRegistro('registro-id-123');
```

### 4. Reverter uma Alteração

```typescript
import { auditTrail } from '@/lib/auditTrail';

// Reverter uma alteração
await auditTrail.reverterAlteracao('registro-id-123');
```

## Estrutura de Dados

### RegistroAuditoria

```typescript
interface RegistroAuditoria {
  id: string;                    // ID único do registro
  timestamp: number;             // Timestamp em milissegundos
  data: string;                  // Data (ex: "07/11/2025")
  hora: string;                  // Hora (ex: "08:30:45")
  tipoAlteracao: TipoAlteracao;  // Tipo de alteração
  tipoEntidade: TipoEntidade;    // Tipo de entidade
  idEntidade: string;            // ID da entidade alterada
  nomeEntidade: string;          // Nome da entidade alterada
  usuarioId: string;             // ID do usuário que fez a alteração
  nomeUsuario: string;           // Nome do usuário
  emailUsuario: string;          // E-mail do usuário
  descricao: string;             // Descrição da alteração
  camposAlterados?: {            // Campos que foram alterados
    campo: string;
    valorAnterior: any;
    valorNovo: any;
  }[];
  ipAddress?: string;            // IP address do cliente
  userAgent?: string;            // User agent do navegador
  reversivel: boolean;           // Se a alteração pode ser revertida
  idReversao?: string;           // ID do registro que reverteu este
}
```

## Componente HistoricoAlteracoes

### Props

```typescript
interface HistoricoAlteracoesProps {
  tipoEntidade: TipoEntidade;    // Tipo de entidade
  idEntidade: string;            // ID da entidade
  nomeEntidade: string;          // Nome da entidade
  limite?: number;               // Limite de registros (padrão: 50)
}
```

### Funcionalidades

- **Exibir histórico** em formato de lista com cards expansíveis
- **Expandir detalhes** de cada alteração
- **Reverter alterações** com confirmação
- **Atualizar histórico** com botão de refresh
- **Mostrar campos alterados** em tabela
- **Código de cores** para diferentes tipos de alterações

## Integração com Backend

Para que o sistema funcione completamente, você precisa criar os seguintes endpoints no seu backend:

### 1. Registrar Alteração
```
POST /api/auditoria/registrar
Body: {
  tipoAlteracao: string,
  tipoEntidade: string,
  idEntidade: string,
  nomeEntidade: string,
  usuarioId: string,
  nomeUsuario: string,
  emailUsuario: string,
  descricao: string,
  camposAlterados?: Array,
  ipAddress?: string,
  userAgent?: string
}
Response: RegistroAuditoria
```

### 2. Obter Histórico
```
GET /api/auditoria/historico/:tipoEntidade/:idEntidade?limite=50
Response: RegistroAuditoria[]
```

### 3. Obter Histórico do Usuário
```
GET /api/auditoria/usuario/:usuarioId?limite=50
Response: RegistroAuditoria[]
```

### 4. Obter Registro Específico
```
GET /api/auditoria/registro/:registroId
Response: RegistroAuditoria
```

### 5. Reverter Alteração
```
POST /api/auditoria/reverter/:registroId
Response: RegistroAuditoria
```

## Banco de Dados

### Tabela de Auditoria (Exemplo SQL)

```sql
CREATE TABLE auditoria (
  id VARCHAR(36) PRIMARY KEY,
  timestamp BIGINT NOT NULL,
  data VARCHAR(10) NOT NULL,
  hora VARCHAR(8) NOT NULL,
  tipo_alteracao VARCHAR(50) NOT NULL,
  tipo_entidade VARCHAR(50) NOT NULL,
  id_entidade VARCHAR(36) NOT NULL,
  nome_entidade VARCHAR(255) NOT NULL,
  usuario_id VARCHAR(36) NOT NULL,
  nome_usuario VARCHAR(255) NOT NULL,
  email_usuario VARCHAR(255) NOT NULL,
  descricao TEXT NOT NULL,
  campos_alterados JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  reversivel BOOLEAN DEFAULT TRUE,
  id_reversao VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_id_entidade (id_entidade),
  INDEX idx_usuario_id (usuario_id),
  INDEX idx_tipo_entidade (tipo_entidade),
  INDEX idx_timestamp (timestamp)
);
```

## Boas Práticas

1. **Sempre registre alterações importantes** - Crie, atualize, exclua, transfira
2. **Forneça descrições claras** - Descreva o que foi alterado e por quê
3. **Inclua campos alterados** - Mostre os valores antes e depois
4. **Reverta com cuidado** - Sempre peça confirmação antes de reverter
5. **Monitore alterações suspeitas** - Revise o histórico regularmente
6. **Arquive dados antigos** - Mantenha o banco de dados limpo

## Exemplos de Uso

### Exemplo 1: Excluir um Usuário

```typescript
// Registrar a exclusão
await auditTrail.registrarAlteracao(
  TipoAlteracao.EXCLUIR,
  TipoEntidade.USUARIO,
  'usuario-123',
  'João Silva',
  'admin-001',
  'Admin',
  'admin@example.com',
  'Excluiu o usuário João Silva da escola Maple Bear São Roque',
  [
    {
      campo: 'status',
      valorAnterior: 'ativo',
      valorNovo: 'excluído'
    }
  ]
);
```

### Exemplo 2: Atualizar Status da Escola

```typescript
// Registrar a atualização
await auditTrail.registrarAlteracao(
  TipoAlteracao.ATUALIZAR,
  TipoEntidade.ESCOLA,
  'escola-123',
  'Maple Bear São Roque',
  'user-001',
  'Gerente',
  'gerente@example.com',
  'Alterou o status da escola de "Implantando" para "Ativo"',
  [
    {
      campo: 'status',
      valorAnterior: 'Implantando',
      valorNovo: 'Ativo'
    },
    {
      campo: 'dataAtualizacao',
      valorAnterior: '2025-11-01',
      valorNovo: '2025-11-07'
    }
  ]
);
```

## Referências

- [Audit Trail - Wikipedia](https://en.wikipedia.org/wiki/Audit_trail)
- [GDPR - Data Protection](https://gdpr-info.eu/)
- [SOC 2 - Audit Logging](https://www.aicpa.org/interestareas/informationmanagement/sodp-system-and-organization-controls)
