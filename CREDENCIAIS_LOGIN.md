# Credenciais de Login - MapleBear SAF

## Credenciais Configuradas no Sistema

O sistema possui as seguintes credenciais pré-configuradas:

### 1. Administrador
- **Email:** admin@mbcentral.com.br
- **Senha:** admin2025
- **Perfil:** Administrador (acesso completo)

### 2. Usuário SAF
- **Email:** saf@seb.com.br
- **Senha:** saf2025
- **Perfil:** Usuário padrão

### 3. Coordenador
- **Email:** coordenador@sebsa.com.br
- **Senha:** coord2025
- **Perfil:** Usuário padrão

## Domínios Permitidos

O sistema aceita apenas emails dos seguintes domínios corporativos:
- @mbcentral.com.br
- @seb.com.br
- @sebsa.com.br

## Observações Importantes

1. **Sessão:** A sessão expira após 7 dias de inatividade
2. **Renovação automática:** O sistema renova automaticamente o token quando necessário
3. **Logout automático:** O sistema faz logout automático às segundas-feiras (regra de negócio específica)
4. **Segurança:** Em produção, as credenciais devem ser gerenciadas por um backend seguro

## Como Adicionar Novos Usuários

Para adicionar novos usuários, edite o arquivo:
`src/components/auth/AuthService.ts`

Localize a constante `VALID_CREDENTIALS` (linha 43) e adicione novas credenciais no formato:
```typescript
{ email: 'novo.usuario@mbcentral.com.br', password: 'senha123', role: 'user' }
```

## Perfis de Acesso

- **admin:** Acesso completo ao sistema, incluindo gerenciamento de usuários
- **user:** Acesso padrão às funcionalidades do sistema
- **maintenance:** Acesso para manutenção técnica
