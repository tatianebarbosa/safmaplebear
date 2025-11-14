# 🔐 Configuração de Credenciais do Canva

## ⚠️ Importante - Segurança

As credenciais do Canva **NÃO** devem estar no código-fonte. Este documento explica como configurá-las corretamente usando variáveis de ambiente.

---

## 🏠 Desenvolvimento Local

### Opção 1: Arquivo `local.settings.json` (Recomendado para Azure Functions)

1. Copie o arquivo de exemplo:
```bash
cd api
cp local.settings.example.json local.settings.json
```

2. Edite o arquivo `local.settings.json` e configure suas credenciais:
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "python",
    "CANVA_EMAIL": "tatianebarbosa20166@gmail.com",
    "CANVA_PASSWORD": "Tati2025@"
  }
}
```

3. **IMPORTANTE**: O arquivo `local.settings.json` já está no `.gitignore` e não será commitado.

### Opção 2: Variáveis de Ambiente do Sistema

Para scripts Python standalone (como `collect_all_periods.py`):

**Linux/Mac:**
```bash
export CANVA_EMAIL="tatianebarbosa20166@gmail.com"
export CANVA_PASSWORD="Tati2025@"
```

**Windows (PowerShell):**
```powershell
$env:CANVA_EMAIL="tatianebarbosa20166@gmail.com"
$env:CANVA_PASSWORD="Tati2025@"
```

**Windows (CMD):**
```cmd
set CANVA_EMAIL=tatianebarbosa20166@gmail.com
set CANVA_PASSWORD=Tati2025@
```

---

## ☁️ Produção (Azure)

### Configurar no Azure Portal

1. Acesse o [Azure Portal](https://portal.azure.com)

2. Navegue até sua **Function App**

3. No menu lateral, clique em **Configuration** (Configuração)

4. Na aba **Application settings**, clique em **+ New application setting**

5. Adicione as seguintes variáveis:

| Nome | Valor |
|------|-------|
| `CANVA_EMAIL` | tatianebarbosa20166@gmail.com |
| `CANVA_PASSWORD` | Tati2025@ |

6. Clique em **Save** (Salvar)

7. Clique em **Continue** para confirmar o restart da aplicação

### Configurar via Azure CLI

```bash
# Defina as variáveis
RESOURCE_GROUP="seu-resource-group"
FUNCTION_APP_NAME="sua-function-app"

# Configure as credenciais
az functionapp config appsettings set \
  --name $FUNCTION_APP_NAME \
  --resource-group $RESOURCE_GROUP \
  --settings \
    CANVA_EMAIL="tatianebarbosa20166@gmail.com" \
    CANVA_PASSWORD="Tati2025@"
```

---

## 🧪 Testando a Configuração

### Teste 1: Verificar se as variáveis estão configuradas

```python
import os

canva_email = os.getenv("CANVA_EMAIL")
canva_password = os.getenv("CANVA_PASSWORD")

if canva_email and canva_password:
    print("✅ Credenciais configuradas corretamente!")
    print(f"   Email: {canva_email}")
    print(f"   Senha: {'*' * len(canva_password)}")
else:
    print("❌ Credenciais NÃO configuradas!")
    if not canva_email:
        print("   Faltando: CANVA_EMAIL")
    if not canva_password:
        print("   Faltando: CANVA_PASSWORD")
```

### Teste 2: Executar coleta de dados

```bash
cd api
python3 collect_all_periods.py
```

Se as credenciais estiverem corretas, você verá:
```
================================================================================
COLETA DE DADOS DO CANVA - TODOS OS PERÍODOS
================================================================================

Email: tatianebarbosa20166@gmail.com
Períodos a coletar: 6
...
```

Se as credenciais **não** estiverem configuradas, você verá:
```
❌ ERRO: Variáveis de ambiente CANVA_EMAIL e CANVA_PASSWORD não configuradas!
Configure as variáveis de ambiente antes de executar o script.
Exemplo: export CANVA_EMAIL='seu_email@gmail.com'
         export CANVA_PASSWORD='sua_senha'
```

---

## 🔄 Rotação de Credenciais

Se você precisar alterar as credenciais do Canva:

### Desenvolvimento Local
1. Edite o arquivo `api/local.settings.json`
2. Atualize os valores de `CANVA_EMAIL` e `CANVA_PASSWORD`
3. Reinicie o servidor de desenvolvimento

### Produção (Azure)
1. Acesse o Azure Portal
2. Navegue até Configuration → Application settings
3. Edite os valores de `CANVA_EMAIL` e `CANVA_PASSWORD`
4. Salve e confirme o restart

---

## 🛡️ Boas Práticas de Segurança

### ✅ FAÇA

- ✅ Use variáveis de ambiente para credenciais
- ✅ Adicione `local.settings.json` ao `.gitignore`
- ✅ Use Azure Key Vault para produção (recomendado)
- ✅ Rotacione credenciais periodicamente
- ✅ Use credenciais diferentes para dev/staging/prod

### ❌ NÃO FAÇA

- ❌ **NUNCA** commite credenciais no código-fonte
- ❌ **NUNCA** compartilhe credenciais por email/chat
- ❌ **NUNCA** use credenciais de produção em desenvolvimento
- ❌ **NUNCA** exponha credenciais em logs ou mensagens de erro

---

## 🔐 Azure Key Vault (Opcional - Recomendado para Produção)

Para maior segurança em produção, use o Azure Key Vault:

### 1. Criar um Key Vault

```bash
az keyvault create \
  --name "seu-keyvault-name" \
  --resource-group "seu-resource-group" \
  --location "brazilsouth"
```

### 2. Adicionar as credenciais

```bash
az keyvault secret set \
  --vault-name "seu-keyvault-name" \
  --name "CANVA-EMAIL" \
  --value "tatianebarbosa20166@gmail.com"

az keyvault secret set \
  --vault-name "seu-keyvault-name" \
  --name "CANVA-PASSWORD" \
  --value "Tati2025@"
```

### 3. Configurar a Function App para usar o Key Vault

```bash
# Habilitar Managed Identity
az functionapp identity assign \
  --name "sua-function-app" \
  --resource-group "seu-resource-group"

# Dar permissão para ler secrets
az keyvault set-policy \
  --name "seu-keyvault-name" \
  --object-id "<managed-identity-object-id>" \
  --secret-permissions get list
```

### 4. Referenciar os secrets nas Application Settings

```bash
az functionapp config appsettings set \
  --name "sua-function-app" \
  --resource-group "seu-resource-group" \
  --settings \
    CANVA_EMAIL="@Microsoft.KeyVault(SecretUri=https://seu-keyvault-name.vault.azure.net/secrets/CANVA-EMAIL/)" \
    CANVA_PASSWORD="@Microsoft.KeyVault(SecretUri=https://seu-keyvault-name.vault.azure.net/secrets/CANVA-PASSWORD/)"
```

---

## 📞 Suporte

Se você encontrar problemas com a configuração das credenciais:

1. Verifique se as variáveis estão configuradas corretamente
2. Verifique se não há espaços extras nos valores
3. Verifique se o arquivo `local.settings.json` está no diretório correto (`api/`)
4. Reinicie o servidor/aplicação após alterar as configurações

Para mais informações, consulte:
- [Documentação do Azure Functions - Application Settings](https://docs.microsoft.com/azure/azure-functions/functions-app-settings)
- [Documentação do Azure Key Vault](https://docs.microsoft.com/azure/key-vault/)

---

**Última atualização:** 13 de novembro de 2025
