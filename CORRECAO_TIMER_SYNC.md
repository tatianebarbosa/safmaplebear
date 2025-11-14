# Correção do Erro no Timer de Sincronização do Canva

## Problema Identificado

O erro ocorria ao tentar executar a função `TimerSyncCanva` localmente, fora do ambiente Azure Functions:

```
AttributeError: 'NoneType' object has no attribute 'past_due'
```

### Causa Raiz

A função `main()` no arquivo `api/TimerSyncCanva/__init__.py` tentava acessar o atributo `past_due` do objeto `mytimer` sem verificar se ele estava disponível. Quando executado localmente (fora do contexto do Azure Functions), o objeto `mytimer` pode ser `None`, causando o erro.

**Código original (linha 32):**
```python
if mytimer.past_due:
    logging.warning(f'[{timestamp}] O timer foi atrasado!')
```

## Solução Implementada

Foi adicionada uma verificação de segurança antes de acessar o atributo `past_due`:

**Código corrigido (linhas 32-34):**
```python
# Verifica se mytimer está disponível (pode ser None em testes locais)
if mytimer and hasattr(mytimer, 'past_due') and mytimer.past_due:
    logging.warning(f'[{timestamp}] O timer foi atrasado!')
```

### Benefícios da Correção

1. **Compatibilidade com testes locais**: A função agora pode ser executada localmente sem erros
2. **Robustez**: Adiciona verificação defensiva que previne erros em diferentes contextos
3. **Manutenibilidade**: Facilita o desenvolvimento e testes da função
4. **Sem impacto no Azure**: Continua funcionando normalmente no ambiente de produção

## Arquivos Modificados

- `api/TimerSyncCanva/__init__.py` - Linha 32-34

## Arquivos Criados

- `api/test_timer_local.py` - Script de teste local para a função timer

## Como Testar Localmente

### Pré-requisitos

1. Configurar as variáveis de ambiente:
```bash
export CANVA_EMAIL="seu_email@exemplo.com"
export CANVA_PASSWORD="sua_senha"
```

2. Instalar dependências:
```bash
cd api
pip3 install -r requirements.txt
playwright install chromium
```

### Executar o teste

```bash
cd api
python3 test_timer_local.py
```

### Teste alternativo (chamada direta)

```bash
cd api
python3 -c "import sys; sys.path.insert(0, '.'); from TimerSyncCanva import main; main(None)"
```

## Observações Importantes

### Sobre o Erro de Login do Canva

O erro "Falha no login do Canva" que aparece após a correção do `past_due` é um problema diferente e pode ter várias causas:

1. **Credenciais inválidas**: Verifique se `CANVA_EMAIL` e `CANVA_PASSWORD` estão corretos
2. **Autenticação de dois fatores (2FA)**: Se habilitado, pode impedir o login automático
3. **Timeout**: O Canva pode estar demorando para responder
4. **Mudanças na interface**: O Canva pode ter alterado a estrutura HTML da página de login
5. **Detecção de bot**: O Canva pode estar bloqueando o acesso automatizado

### Recomendações para Resolver o Erro de Login

1. **Verificar credenciais**:
```bash
# No terminal do Windows
set CANVA_EMAIL=tatianebarbosa20166@gmail.com
set CANVA_PASSWORD=Tati2025@

# No terminal Linux/Mac
export CANVA_EMAIL="tatianebarbosa20166@gmail.com"
export CANVA_PASSWORD="Tati2025@"
```

2. **Testar com modo não-headless** (para ver o que está acontecendo):
   - Editar `api/TimerSyncCanva/__init__.py` linha 50
   - Mudar `headless=True` para `headless=False`

3. **Desabilitar 2FA temporariamente** na conta do Canva (se aplicável)

4. **Verificar logs detalhados** para identificar em qual etapa o login falha

5. **Atualizar seletores** se a interface do Canva mudou:
   - Verificar arquivo `api/shared/canva_collector.py`
   - Método `_login()` (linhas 163-206)

## Estrutura do Projeto

```
api/
├── TimerSyncCanva/
│   ├── __init__.py          # ✅ Corrigido
│   └── function.json
├── shared/
│   ├── canva_collector.py   # Coletor principal
│   └── canva_data_processor.py
├── test_timer_local.py      # ✅ Novo arquivo
└── requirements.txt
```

## Próximos Passos

1. ✅ Correção do erro `past_due` - **CONCLUÍDO**
2. 🔄 Resolver o erro de login do Canva - **EM ANDAMENTO**
3. ⏳ Testar coleta completa de dados
4. ⏳ Validar integração com base de escolas
5. ⏳ Deploy no Azure Functions

## Data da Correção

**Data**: 13 de novembro de 2025  
**Autor**: Sistema SAF Maple Bear  
**Versão**: 1.0
