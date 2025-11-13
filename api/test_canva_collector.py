#!/usr/bin/env python3
"""
Script de Teste do Coletor do Canva
====================================

Este script valida a estrutura e funcionalidade básica do coletor
sem executar o navegador.
"""

import sys
import os

# Adiciona o diretório api ao path
sys.path.insert(0, os.path.dirname(__file__))

def test_imports():
    """Testa se todos os imports necessários estão disponíveis"""
    print("Testando imports...")
    
    try:
        from shared.canva_collector import (
            CanvaCollector,
            CanvaMetrics,
            collect_canva_data,
            collect_canva_data_sync
        )
        print("  ✓ Imports do canva_collector OK")
    except ImportError as e:
        print(f"  ✗ Erro ao importar canva_collector: {e}")
        return False
    
    return True


def test_canva_metrics():
    """Testa a classe CanvaMetrics"""
    print("\nTestando CanvaMetrics...")
    
    try:
        from shared.canva_collector import CanvaMetrics
        
        # Cria instância vazia
        metrics = CanvaMetrics()
        print(f"  ✓ Instância criada com período: {metrics.periodo_filtro}")
        
        # Testa conversão para dict
        data = metrics.to_dict()
        assert isinstance(data, dict), "to_dict() deve retornar um dicionário"
        print(f"  ✓ Conversão para dict OK ({len(data)} campos)")
        
        # Testa conversão para JSON
        json_str = metrics.to_json()
        assert isinstance(json_str, str), "to_json() deve retornar uma string"
        print(f"  ✓ Conversão para JSON OK ({len(json_str)} caracteres)")
        
        # Testa com dados
        metrics2 = CanvaMetrics(
            designs_criados=5994,
            designs_criados_crescimento=21.0,
            alunos=482,
            professores=4,
            periodo_filtro="Últimos 30 dias"
        )
        assert metrics2.designs_criados == 5994
        assert metrics2.total_pessoas == 486  # 482 + 4 + 0
        print(f"  ✓ Cálculo de total_pessoas OK: {metrics2.total_pessoas}")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Erro: {e}")
        return False


def test_canva_collector_init():
    """Testa a inicialização do CanvaCollector"""
    print("\nTestando inicialização do CanvaCollector...")
    
    try:
        from shared.canva_collector import CanvaCollector
        
        # Testa inicialização com parâmetros padrão
        collector = CanvaCollector(
            email="teste@exemplo.com",
            password="senha123"
        )
        assert collector.email == "teste@exemplo.com"
        assert collector.periodo_filtro == "Últimos 30 dias"
        print(f"  ✓ Inicialização com padrões OK")
        
        # Testa inicialização com período customizado
        for periodo in CanvaCollector.FILTROS_PERIODO:
            collector = CanvaCollector(
                email="teste@exemplo.com",
                password="senha123",
                periodo_filtro=periodo
            )
            assert collector.periodo_filtro == periodo
        print(f"  ✓ Todos os {len(CanvaCollector.FILTROS_PERIODO)} filtros validados")
        
        # Testa período inválido
        collector = CanvaCollector(
            email="teste@exemplo.com",
            password="senha123",
            periodo_filtro="Período Inválido"
        )
        assert collector.periodo_filtro == "Últimos 30 dias"  # Deve usar padrão
        print(f"  ✓ Validação de período inválido OK")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Erro: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_filtros_periodo():
    """Testa a lista de filtros de período"""
    print("\nTestando filtros de período...")
    
    try:
        from shared.canva_collector import CanvaCollector
        
        filtros_esperados = [
            "12 meses",
            "6 meses",
            "3 meses",
            "Últimos 30 dias",
            "Últimos 14 dias",
            "Últimos 7 dias"
        ]
        
        assert CanvaCollector.FILTROS_PERIODO == filtros_esperados
        print(f"  ✓ Todos os {len(filtros_esperados)} filtros estão presentes:")
        for filtro in filtros_esperados:
            print(f"    - {filtro}")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Erro: {e}")
        return False


def test_constants():
    """Testa as constantes da classe"""
    print("\nTestando constantes...")
    
    try:
        from shared.canva_collector import CanvaCollector
        
        # Testa URLs
        assert CanvaCollector.CANVA_LOGIN_URL == "https://www.canva.com/login"
        assert CanvaCollector.CANVA_REPORTS_URL == "https://www.canva.com/settings/team-reports"
        assert CanvaCollector.CANVA_PEOPLE_URL == "https://www.canva.com/settings/people"
        print(f"  ✓ URLs configuradas corretamente")
        
        # Testa timeouts
        assert CanvaCollector.TIMEOUT_NAVIGATION == 60000
        assert CanvaCollector.TIMEOUT_ELEMENT == 30000
        assert CanvaCollector.TIMEOUT_LOGIN == 90000
        print(f"  ✓ Timeouts configurados corretamente")
        
        return True
        
    except Exception as e:
        print(f"  ✗ Erro: {e}")
        return False


def test_file_structure():
    """Testa a estrutura de arquivos"""
    print("\nTestando estrutura de arquivos...")
    
    base_dir = os.path.dirname(__file__)
    
    files_to_check = [
        "shared/canva_collector.py",
        "shared/__init__.py",
        "TimerSyncCanva/__init__.py",
        "TimerSyncCanva/function.json",
        "requirements.txt",
        "collect_all_periods.py"
    ]
    
    all_ok = True
    for file_path in files_to_check:
        full_path = os.path.join(base_dir, file_path)
        if os.path.exists(full_path):
            print(f"  ✓ {file_path}")
        else:
            print(f"  ✗ {file_path} não encontrado")
            all_ok = False
    
    return all_ok


def main():
    """Função principal"""
    print("="*80)
    print("TESTE DE VALIDAÇÃO DO COLETOR DO CANVA")
    print("="*80)
    
    tests = [
        ("Imports", test_imports),
        ("CanvaMetrics", test_canva_metrics),
        ("CanvaCollector Init", test_canva_collector_init),
        ("Filtros de Período", test_filtros_periodo),
        ("Constantes", test_constants),
        ("Estrutura de Arquivos", test_file_structure)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n✗ Erro crítico no teste '{test_name}': {e}")
            import traceback
            traceback.print_exc()
            results.append((test_name, False))
    
    # Resumo
    print("\n" + "="*80)
    print("RESUMO DOS TESTES")
    print("="*80)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASSOU" if result else "✗ FALHOU"
        print(f"{status}: {test_name}")
    
    print("\n" + "-"*80)
    print(f"Total: {passed}/{total} testes passaram ({passed/total*100:.1f}%)")
    print("="*80)
    
    if passed == total:
        print("\n🎉 Todos os testes passaram! O coletor está pronto para uso.")
        return 0
    else:
        print(f"\n⚠️  {total - passed} teste(s) falharam. Verifique os erros acima.")
        return 1


if __name__ == "__main__":
    sys.exit(main())
