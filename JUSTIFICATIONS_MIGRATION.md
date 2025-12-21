# Migração das Justificativas para o Backend (Postgres)

## Resumo da Implementação

Esta implementação migra o armazenamento das **Justificativas** do `localStorage` para o backend PostgreSQL, eliminando um ponto de falha na persistência centralizada.

---

## Alterações Realizadas

### 1. Backend (API)

#### 1.1. Modelo de Dados (`api/shared/db_models.py`)

Foi adicionado o modelo `Justification` ao arquivo de modelos do SQLAlchemy:

```python
class Justification(Base):
    """Model for license justifications (license transfers/swaps)."""
    __tablename__ = "justifications"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    school_id: Mapped[str] = mapped_column(String, ForeignKey("schools.id", ondelete="CASCADE"), nullable=False)
    school_name: Mapped[str] = mapped_column(String, nullable=False)
    old_user_name: Mapped[str] = mapped_column(String, nullable=False)
    old_user_email: Mapped[str] = mapped_column(String, nullable=False)
    old_user_role: Mapped[str] = mapped_column(String, nullable=False)
    new_user_name: Mapped[str] = mapped_column(String, nullable=False)
    new_user_email: Mapped[str] = mapped_column(String, nullable=False)
    new_user_role: Mapped[str] = mapped_column(String, nullable=False)
    reason: Mapped[str] = mapped_column(String, nullable=False)
    performed_by: Mapped[str] = mapped_column(String, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        Index("idx_justifications_school_id", "school_id"),
        Index("idx_justifications_timestamp", "timestamp"),
    )
```

**Características:**
- Chave primária UUID gerada automaticamente
- Foreign key para `schools.id` com `CASCADE DELETE`
- Índices para otimizar consultas por escola e timestamp
- Timestamp automático com timezone

#### 1.2. Migration do Alembic

Criada migration em `api/alembic/versions/20251221_2008_00f5dc789b4e_add_justifications_table.py`:

```python
def upgrade() -> None:
    # Create justifications table
    op.create_table(
        'justifications',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('school_id', sa.String(), nullable=False),
        sa.Column('school_name', sa.String(), nullable=False),
        sa.Column('old_user_name', sa.String(), nullable=False),
        sa.Column('old_user_email', sa.String(), nullable=False),
        sa.Column('old_user_role', sa.String(), nullable=False),
        sa.Column('new_user_name', sa.String(), nullable=False),
        sa.Column('new_user_email', sa.String(), nullable=False),
        sa.Column('new_user_role', sa.String(), nullable=False),
        sa.Column('reason', sa.String(), nullable=False),
        sa.Column('performed_by', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_justifications_school_id', 'justifications', ['school_id'])
    op.create_index('idx_justifications_timestamp', 'justifications', ['timestamp'])
```

#### 1.3. Endpoint da API (`api/justifications/__init__.py`)

Criado novo endpoint `/api/justifications` com suporte a:

**GET `/api/justifications`**
- Lista todas as justificativas
- Parâmetro opcional: `?school_id=<id>` para filtrar por escola
- Ordenação: timestamp decrescente (mais recentes primeiro)
- Autenticação: Bearer token obrigatório
- Permissão: role 'agente' ou superior

**POST `/api/justifications`**
- Cria nova justificativa
- Body JSON:
  ```json
  {
    "schoolId": "string",
    "schoolName": "string",
    "oldUser": {
      "name": "string",
      "email": "string",
      "role": "string"
    },
    "newUser": {
      "name": "string",
      "email": "string",
      "role": "string"
    },
    "reason": "string",
    "performedBy": "string"
  }
  ```
- Validação: verifica se a escola existe no banco
- Retorna: justificativa criada com ID e timestamp

**OPTIONS `/api/justifications`**
- Suporte a CORS preflight

---

### 2. Frontend

#### 2.1. Serviço de Justificativas (`src/lib/justificationService.ts`)

Criado serviço dedicado para comunicação com a API:

**Funções principais:**

- `fetchJustifications(schoolId?: string): Promise<Justification[]>`
  - Busca justificativas do backend
  - Suporta filtro opcional por escola

- `createJustification(justification): Promise<Justification | null>`
  - Cria nova justificativa no backend
  - Retorna a justificativa criada ou null em caso de erro

- `migrateJustificationsToBackend(localJustifications): Promise<{success, failed}>`
  - Função de migração única
  - Transfere justificativas do localStorage para o backend
  - Retorna estatísticas de sucesso/falha

#### 2.2. Store Zustand (`src/stores/schoolLicenseStore.ts`)

**Alterações principais:**

1. **Nova action `loadJustifications`:**
   ```typescript
   loadJustifications: async (schoolId?: string) => {
     try {
       const justifications = await fetchJustifications(schoolId);
       set({ justifications });
     } catch (error) {
       console.error("Erro ao carregar justificativas:", error);
     }
   }
   ```

2. **`addJustification` agora é assíncrona:**
   ```typescript
   addJustification: async (justification) => {
     // Save to backend
     const newJustification = await createJustification(justification);
     
     if (newJustification) {
       // Update local state
       set((state) => ({
         justifications: [...state.justifications, newJustification],
       }));
     } else {
       console.error("Falha ao criar justificativa no backend");
     }
   }
   ```

3. **Carregamento automático em `loadOfficialData`:**
   - Após carregar escolas, carrega justificativas do backend
   - Detecta justificativas no localStorage e migra automaticamente
   - Logs de migração no console

4. **Remoção do localStorage:**
   - `justifications` removido do `partialize` (não persiste mais)
   - `initialJustifications` sempre vazio (carrega do backend)
   - `loadPersistedSnapshot` não carrega mais justifications

---

## Instruções de Deployment

### Passo 1: Aplicar Migration no Banco de Dados

**Ambiente Local/Dev:**
```bash
cd api
alembic upgrade head
```

**Ambiente de Produção (Azure Functions):**
Se você usa Azure Functions, a migration pode ser aplicada de duas formas:

1. **Via Azure Cloud Shell:**
   ```bash
   # Conectar ao banco de dados
   psql "postgresql://usuario:senha@servidor.postgres.database.azure.com/database?sslmode=require"
   
   # Executar SQL manualmente (copiar do arquivo de migration)
   ```

2. **Via script de deployment:**
   - Adicionar step de migration no pipeline CI/CD
   - Executar `alembic upgrade head` antes do deploy das functions

### Passo 2: Deploy do Backend

```bash
cd api
# Deploy das Azure Functions (seguir processo atual do projeto)
func azure functionapp publish <nome-do-function-app>
```

### Passo 3: Deploy do Frontend

```bash
cd ..
# Build e deploy (seguir processo atual do projeto)
npm run build
# Deploy para Netlify/Vercel/etc
```

### Passo 4: Verificação

1. **Verificar tabela criada:**
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'justifications';
   ```

2. **Verificar índices:**
   ```sql
   SELECT * FROM pg_indexes WHERE tablename = 'justifications';
   ```

3. **Testar endpoint:**
   ```bash
   curl -X GET "https://seu-dominio/.netlify/functions/justifications" \
     -H "Authorization: Bearer SEU_TOKEN"
   ```

---

## Migração Automática

A migração do localStorage para o backend acontece **automaticamente** na primeira vez que um usuário carrega a aplicação após o deploy:

1. O `loadOfficialData` é chamado ao iniciar a aplicação
2. Detecta se há justificativas no localStorage
3. Se o backend estiver vazio, migra todas as justificativas locais
4. Logs são exibidos no console do navegador
5. Após a migração, o localStorage não é mais usado

**Console esperado:**
```
Migrando justificativas do localStorage para o backend...
Migração concluída: 15 sucesso, 0 falhas
```

---

## Impacto e Benefícios

### ✅ Benefícios

1. **Persistência Centralizada:** Justificativas agora são armazenadas no Postgres junto com Schools e Users
2. **Sincronização Multi-Dispositivo:** Usuários veem as mesmas justificativas em qualquer dispositivo
3. **Auditoria Melhorada:** Timestamps e IDs gerados pelo banco garantem integridade
4. **Escalabilidade:** Sem limite de quota do localStorage (5-10MB)
5. **Backup Automático:** Incluído nos backups do banco de dados
6. **Consultas Otimizadas:** Índices permitem filtros rápidos por escola e data

### ⚠️ Considerações

1. **Dependência de Rede:** Agora requer conexão para criar/listar justificativas
2. **Latência:** Pequeno delay adicional nas operações (mitigado por cache local no state)
3. **Autenticação:** Todas as operações requerem token válido

---

## Testes Recomendados

### Testes Manuais

1. **Criar justificativa:**
   - Realizar swap de usuário
   - Verificar se justificativa aparece na lista
   - Verificar no banco se foi salva

2. **Listar justificativas:**
   - Filtrar por escola
   - Verificar ordenação por data

3. **Migração:**
   - Adicionar justificativas manualmente no localStorage
   - Recarregar página
   - Verificar logs de migração
   - Confirmar que dados foram transferidos

### Testes Automatizados (Sugestão)

```typescript
// Exemplo de teste para o serviço
describe('justificationService', () => {
  it('should create justification', async () => {
    const justification = {
      schoolId: '1',
      schoolName: 'Escola Teste',
      oldUser: { name: 'João', email: 'joao@test.com', role: 'Estudante' },
      newUser: { name: 'Maria', email: 'maria@test.com', role: 'Professor' },
      reason: 'Troca de função',
      performedBy: 'Admin'
    };
    
    const result = await createJustification(justification);
    expect(result).toBeTruthy();
    expect(result?.id).toBeDefined();
  });
});
```

---

## Troubleshooting

### Problema: Migration falha

**Solução:**
```bash
# Verificar status atual
alembic current

# Reverter se necessário
alembic downgrade -1

# Aplicar novamente
alembic upgrade head
```

### Problema: Endpoint retorna 401

**Solução:**
- Verificar se `VITE_API_TOKEN` está configurado no `.env`
- Verificar se token é válido e não expirou
- Verificar permissões do usuário (deve ser 'agente' ou superior)

### Problema: Justificativas não aparecem após migração

**Solução:**
- Abrir console do navegador e verificar logs
- Verificar se migration foi aplicada: `SELECT COUNT(*) FROM justifications;`
- Verificar se há erros de CORS nos headers da resposta

### Problema: Duplicação de justificativas

**Solução:**
- A migração só ocorre se o backend estiver vazio
- Se houver duplicatas, limpar localStorage: `localStorage.removeItem('school-license-storage-v2')`

---

## Próximos Passos (Opcional)

1. **Adicionar endpoint DELETE:** Para remover justificativas antigas
2. **Paginação:** Para escolas com muitas justificativas
3. **Cache:** Implementar cache no frontend para reduzir chamadas à API
4. **Notificações:** Alertar usuários quando novas justificativas são criadas
5. **Exportação:** Permitir exportar justificativas para CSV/PDF

---

## Arquivos Modificados

### Backend
- ✅ `api/shared/db_models.py` - Adicionado modelo Justification
- ✅ `api/alembic/versions/20251221_2008_00f5dc789b4e_add_justifications_table.py` - Migration
- ✅ `api/justifications/__init__.py` - Novo endpoint
- ✅ `api/justifications/function.json` - Configuração do endpoint

### Frontend
- ✅ `src/lib/justificationService.ts` - Novo serviço
- ✅ `src/stores/schoolLicenseStore.ts` - Atualizado para usar backend

---

## Conclusão

A migração das Justificativas para o backend Postgres foi implementada com sucesso, seguindo os padrões arquiteturais do projeto safmaplebear. A implementação inclui:

- Modelo de dados robusto com foreign keys e índices
- Endpoint RESTful com autenticação e validação
- Serviço frontend com tratamento de erros
- Migração automática do localStorage
- Documentação completa

A aplicação agora tem **persistência 100% centralizada** no backend, eliminando o ponto de falha do localStorage para justificativas.
