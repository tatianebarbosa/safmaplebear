-- Script de Verificação da Migration de Justificativas
-- Execute este script após aplicar a migration para verificar se tudo está correto

-- 1. Verificar se a tabela foi criada
SELECT 
    table_name, 
    table_type
FROM information_schema.tables 
WHERE table_name = 'justifications';

-- 2. Verificar estrutura da tabela
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'justifications'
ORDER BY ordinal_position;

-- 3. Verificar foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'justifications';

-- 4. Verificar índices
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'justifications';

-- 5. Contar registros (deve ser 0 inicialmente)
SELECT COUNT(*) as total_justifications FROM justifications;

-- 6. Verificar se a tabela está vazia (esperado após migration inicial)
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'OK - Tabela criada e vazia, pronta para receber dados'
        ELSE 'AVISO - Tabela já contém ' || COUNT(*) || ' registros'
    END as status
FROM justifications;

-- 7. Teste de inserção (opcional - comentado por padrão)
/*
INSERT INTO justifications (
    id,
    school_id,
    school_name,
    old_user_name,
    old_user_email,
    old_user_role,
    new_user_name,
    new_user_email,
    new_user_role,
    reason,
    performed_by
) VALUES (
    'test-' || gen_random_uuid()::text,
    '1',
    'Escola Teste',
    'João Silva',
    'joao@teste.com',
    'Estudante',
    'Maria Santos',
    'maria@teste.com',
    'Professor',
    'Teste de migração',
    'Admin'
);

-- Verificar inserção
SELECT * FROM justifications WHERE school_name = 'Escola Teste';

-- Limpar teste
DELETE FROM justifications WHERE school_name = 'Escola Teste';
*/

-- 8. Verificar performance dos índices (após ter dados)
/*
EXPLAIN ANALYZE
SELECT * FROM justifications 
WHERE school_id = '1'
ORDER BY timestamp DESC;
*/
