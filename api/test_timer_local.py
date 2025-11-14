#!/usr/bin/env python3
"""
Script de Teste Local do Timer de Sincronização do Canva
=========================================================

Este script permite testar a função TimerSyncCanva localmente
sem precisar do ambiente Azure Functions.
"""

import sys
import os
import logging

# Adiciona o diretório api ao path
sys.path.insert(0, os.path.dirname(__file__))

# Configura logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def main():
    """Função principal de teste"""
    print("="*80)
    print("TESTE LOCAL - TIMER SYNC CANVA")
    print("="*80)
    
    # Importa a função do timer
    from TimerSyncCanva import main as timer_main
    
    # Cria um objeto mock para mytimer (None é aceitável agora)
    class MockTimerRequest:
        def __init__(self):
            self.past_due = False
    
    # Executa a função com um mock ou None
    try:
        print("\nExecutando função timer com mock object...\n")
        timer_main(None)  # Agora aceita None
        print("\n" + "="*80)
        print("TESTE CONCLUÍDO COM SUCESSO!")
        print("="*80)
        return 0
    except Exception as e:
        print("\n" + "="*80)
        print("ERRO DURANTE O TESTE")
        print("="*80)
        logging.error(f"Erro: {str(e)}", exc_info=True)
        return 1

if __name__ == "__main__":
    sys.exit(main())
