#!/bin/bash

# Script para commit das alterações da migração de justificativas

echo "=== Preparando commit da migração de justificativas ==="

# Adicionar arquivos novos
git add api/justifications/
git add api/alembic/versions/20251221_2008_00f5dc789b4e_add_justifications_table.py
git add src/lib/justificationService.ts
git add JUSTIFICATIONS_MIGRATION.md
git add verify_justifications_migration.sql
git add CHANGES_SUMMARY.txt

# Adicionar arquivos modificados
git add api/shared/db_models.py
git add src/stores/schoolLicenseStore.ts

# Verificar status
echo ""
echo "=== Status do Git ==="
git status

# Commit
echo ""
echo "=== Criando commit ==="
git commit -m "feat: migrar justificativas do localStorage para Postgres

- Adicionar modelo Justification no backend (SQLAlchemy)
- Criar migration do Alembic para tabela justifications
- Implementar endpoint REST /api/justifications (GET/POST)
- Criar serviço justificationService no frontend
- Atualizar schoolLicenseStore para usar backend
- Implementar migração automática do localStorage
- Remover justifications da persistência local

Closes: Migração de persistência centralizada
"

echo ""
echo "=== Commit criado com sucesso! ==="
echo ""
echo "Para fazer push:"
echo "  git push origin main"
echo ""
echo "Ou se estiver em outra branch:"
echo "  git push origin <nome-da-branch>"

