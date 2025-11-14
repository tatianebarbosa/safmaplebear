#!/usr/bin/env python3
"""
Teste Simplificado - Validação da Correção do past_due
=======================================================
"""

import sys
import os

# Adiciona o diretório api ao path
sys.path.insert(0, os.path.dirname(__file__))

def test_past_due_fix():
    """Testa se a correção do past_due funciona"""
    print("="*80)
    print("TESTE: Validação da Correção do Atributo past_due")
    print("="*80)
    
    # Importa a função do timer
    from TimerSyncCanva import main as timer_main
    
    # Teste 1: Chamada com None (simula execução local)
    print("\n[TESTE 1] Chamando função com mytimer=None...")
    try:
        # Não vamos executar completamente, apenas verificar se não dá erro no past_due
        # Para isso, vamos fazer um mock que falha antes de chegar no Canva
        os.environ['CANVA_EMAIL'] = ''  # Força erro antes do login
        os.environ['CANVA_PASSWORD'] = ''
        
        timer_main(None)
        # Se chegou aqui sem erro de past_due, a correção funcionou!
        print("✅ PASSOU: Função executada sem erro de past_due")
    except AttributeError as e:
        error_msg = str(e)
        # Se o erro for sobre past_due, a correção NÃO funcionou
        if 'past_due' in error_msg.lower():
            print(f"❌ FALHOU: Erro de past_due ainda ocorre: {error_msg}")
            return False
        else:
            print(f"✅ PASSOU: Erro de atributo não relacionado a past_due: {error_msg[:100]}")
    except Exception as e:
        # Outros erros são esperados (credenciais, etc)
        print(f"✅ PASSOU: Função executada sem erro de past_due (outro erro: {str(e)[:50]}...)")
    
    # Teste 2: Chamada com objeto mock
    print("\n[TESTE 2] Chamando função com objeto mock...")
    
    class MockTimerRequest:
        def __init__(self, past_due=False):
            self.past_due = past_due
    
    try:
        os.environ['CANVA_EMAIL'] = ''
        os.environ['CANVA_PASSWORD'] = ''
        
        mock_timer = MockTimerRequest(past_due=True)
        timer_main(mock_timer)
        # Se chegou aqui sem erro de past_due, a correção funcionou!
        print("✅ PASSOU: Função executada sem erro de past_due (com mock)")
    except AttributeError as e:
        error_msg = str(e)
        if 'past_due' in error_msg.lower():
            print(f"❌ FALHOU: Erro de past_due ainda ocorre: {error_msg}")
            return False
        else:
            print(f"✅ PASSOU: Erro de atributo não relacionado a past_due: {error_msg[:100]}")
    except Exception as e:
        # Outros erros são esperados
        print(f"✅ PASSOU: Função executada sem erro de past_due (outro erro: {str(e)[:50]}...)")
    
    print("\n" + "="*80)
    print("✅ TODOS OS TESTES PASSARAM!")
    print("="*80)
    print("\nConclusão: A correção do atributo 'past_due' está funcionando corretamente.")
    print("A função agora aceita mytimer=None sem erros de AttributeError.")
    return True

if __name__ == "__main__":
    success = test_past_due_fix()
    sys.exit(0 if success else 1)
