# Checklist de Deployment - Migração de Justificativas

## Pré-Deployment

### Backend
- [ ] Revisar código do modelo `Justification` em `api/shared/db_models.py`
- [ ] Revisar migration em `api/alembic/versions/20251221_2008_00f5dc789b4e_add_justifications_table.py`
- [ ] Revisar endpoint em `api/justifications/__init__.py`
- [ ] Verificar variáveis de ambiente (DATABASE_URL, API_TOKEN)

### Frontend
- [ ] Revisar serviço em `src/lib/justificationService.ts`
- [ ] Revisar alterações em `src/stores/schoolLicenseStore.ts`
- [ ] Verificar variáveis de ambiente (VITE_NETLIFY_BASE, VITE_API_TOKEN)
- [ ] Testar build local: `npm run build`

### Documentação
- [ ] Ler `JUSTIFICATIONS_MIGRATION.md`
- [ ] Preparar comunicação para equipe sobre a mudança
- [ ] Documentar rollback plan

---

## Deployment - Passo a Passo

### 1. Backup do Banco de Dados
```bash
# Fazer backup antes de aplicar migration
pg_dump -h <host> -U <user> -d <database> > backup_pre_justifications_$(date +%Y%m%d).sql
```
- [ ] Backup realizado e verificado

### 2. Aplicar Migration
```bash
cd api
alembic upgrade head
```
- [ ] Migration aplicada com sucesso
- [ ] Executar `verify_justifications_migration.sql` para verificar

### 3. Deploy do Backend (Azure Functions)
```bash
cd api
func azure functionapp publish <nome-do-function-app>
```
- [ ] Deploy realizado
- [ ] Verificar logs no Azure Portal
- [ ] Testar endpoint com `test_justifications_endpoint.sh`

### 4. Deploy do Frontend
```bash
npm run build
# Deploy para Netlify/Vercel/etc
```
- [ ] Build concluído sem erros
- [ ] Deploy realizado
- [ ] Verificar se site está acessível

---

## Pós-Deployment - Testes

### Testes Funcionais
- [ ] **Teste 1:** Abrir aplicação e verificar console do navegador
  - Deve carregar justificativas do backend
  - Não deve haver erros de autenticação
  
- [ ] **Teste 2:** Criar nova justificativa (swap de usuário)
  - Realizar swap de usuário
  - Verificar se justificativa aparece na lista
  - Verificar no banco: `SELECT * FROM justifications ORDER BY timestamp DESC LIMIT 5;`
  
- [ ] **Teste 3:** Filtrar justificativas por escola
  - Selecionar uma escola
  - Verificar se apenas justificativas daquela escola aparecem
  
- [ ] **Teste 4:** Migração automática (se houver dados no localStorage)
  - Verificar logs no console: "Migrando justificativas..."
  - Verificar se dados foram transferidos para o banco
  - Limpar localStorage e recarregar para confirmar que carrega do backend

### Testes de Performance
- [ ] Verificar tempo de resposta do endpoint GET
- [ ] Verificar tempo de resposta do endpoint POST
- [ ] Verificar uso de índices: `EXPLAIN ANALYZE SELECT * FROM justifications WHERE school_id = '1';`

### Testes de Segurança
- [ ] Tentar acessar endpoint sem autenticação (deve retornar 401)
- [ ] Tentar acessar com token inválido (deve retornar 401)
- [ ] Tentar criar justificativa para escola inexistente (deve retornar 404)

---

## Monitoramento Pós-Deploy

### Primeiras 24 horas
- [ ] Monitorar logs de erro no Azure Functions
- [ ] Monitorar logs de erro no frontend (Sentry/LogRocket)
- [ ] Verificar crescimento da tabela justifications
- [ ] Verificar feedback dos usuários

### Primeira semana
- [ ] Analisar performance das queries
- [ ] Verificar se há duplicatas ou dados inconsistentes
- [ ] Coletar feedback da equipe
- [ ] Ajustar índices se necessário

---

## Rollback Plan

### Se houver problemas críticos:

1. **Reverter Frontend:**
   ```bash
   # Deploy da versão anterior
   git revert <commit-hash>
   npm run build
   # Deploy
   ```

2. **Reverter Backend:**
   ```bash
   cd api
   # Reverter migration
   alembic downgrade -1
   
   # Deploy da versão anterior
   git revert <commit-hash>
   func azure functionapp publish <nome-do-function-app>
   ```

3. **Restaurar Backup (último recurso):**
   ```bash
   psql -h <host> -U <user> -d <database> < backup_pre_justifications_YYYYMMDD.sql
   ```

- [ ] Rollback plan testado em ambiente de staging

---

## Comunicação

### Antes do Deploy
- [ ] Notificar equipe sobre janela de manutenção (se aplicável)
- [ ] Enviar resumo das mudanças
- [ ] Informar sobre possível migração automática

### Depois do Deploy
- [ ] Confirmar deploy bem-sucedido
- [ ] Enviar instruções de teste para equipe
- [ ] Solicitar feedback

---

## Observações Importantes

⚠️ **Atenção:**
- A migração automática só ocorre se o backend estiver vazio
- Usuários verão logs no console durante a migração
- Após migração, localStorage não é mais usado para justificativas
- Todas as operações agora requerem conexão com internet

✅ **Benefícios:**
- Dados sincronizados entre dispositivos
- Sem limite de quota do localStorage
- Backup automático via banco de dados
- Auditoria melhorada com timestamps do servidor

---

## Contatos de Suporte

- **Backend:** [Nome/Email do responsável]
- **Frontend:** [Nome/Email do responsável]
- **DevOps:** [Nome/Email do responsável]
- **Database:** [Nome/Email do responsável]

---

## Assinatura

- [ ] Revisor 1: _________________ Data: _______
- [ ] Revisor 2: _________________ Data: _______
- [ ] Aprovador: _________________ Data: _______

**Deploy realizado por:** _________________ 
**Data/Hora:** _________________
