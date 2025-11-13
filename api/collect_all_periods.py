#!/usr/bin/env python3
"""
Script para Coletar Dados do Canva de Todos os Períodos
========================================================

Este script coleta dados do Canva para todos os períodos disponíveis
e salva em arquivos CSV separados no diretório public/data/.

Uso:
    python api/collect_all_periods.py

Variáveis de Ambiente:
    CANVA_EMAIL: Email de login do Canva
    CANVA_PASSWORD: Senha de login do Canva
"""

import os
import sys
import json
import logging
from datetime import datetime
from pathlib import Path

# Adiciona o diretório api ao path para importar módulos
sys.path.insert(0, os.path.join(os.path.dirname(__file__)))

from shared.canva_collector import CanvaCollector, collect_canva_data_sync

# Configura logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Diretório de saída
OUTPUT_DIR = Path(__file__).parent.parent / "public" / "data"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def save_to_csv(data: dict, periodo: str):
    """
    Salva os dados coletados em formato CSV.
    
    Args:
        data: Dicionário com os dados coletados
        periodo: Nome do período (ex: "30_dias", "12_meses")
    """
    import csv
    
    # Normaliza o nome do período para nome de arquivo
    periodo_normalized = periodo.lower().replace(" ", "_").replace("ú", "u").replace("í", "i")
    
    # Salva métricas principais
    metrics_file = OUTPUT_DIR / f"relatorio_canva_{periodo_normalized}.csv"
    with open(metrics_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        writer.writerow(['Métrica', 'Valor', 'Crescimento (%)'])
        writer.writerow(['Designs criados', data.get('designs_criados', 0), data.get('designs_criados_crescimento', 0)])
        writer.writerow(['Total publicado', data.get('total_publicado', 0), data.get('total_publicado_crescimento', 0)])
        writer.writerow(['Total compartilhado', data.get('total_compartilhado', 0), data.get('total_compartilhado_crescimento', 0)])
        writer.writerow(['Alunos', data.get('alunos', 0), data.get('alunos_crescimento', 0)])
        writer.writerow(['Professores', data.get('professores', 0), data.get('professores_crescimento', 0)])
        writer.writerow(['Administradores', data.get('administradores', 0), 0])
        writer.writerow(['Total de pessoas', data.get('total_pessoas', 0), 0])
    
    logging.info(f"Métricas salvas em: {metrics_file}")
    
    # Salva tabela de modelos
    modelos = data.get('modelos', [])
    if modelos:
        modelos_file = OUTPUT_DIR / f"modelos_canva_{periodo_normalized}.csv"
        with open(modelos_file, 'w', newline='', encoding='utf-8') as f:
            writer = csv.DictWriter(f, fieldnames=['modelo', 'titular', 'usadas', 'publicado', 'compartilhado'])
            writer.writeheader()
            writer.writerows(modelos)
        
        logging.info(f"Modelos salvos em: {modelos_file}")
    
    # Salva JSON completo
    json_file = OUTPUT_DIR / f"canva_data_{periodo_normalized}.json"
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    logging.info(f"Dados completos salvos em: {json_file}")


def main():
    """Função principal"""
    # Obtém credenciais
    email = os.getenv("CANVA_EMAIL", "tatianebarbosa20166@gmail.com")
    password = os.getenv("CANVA_PASSWORD", "Tati2025@")
    
    if not email or not password:
        logging.error("Credenciais não encontradas. Configure CANVA_EMAIL e CANVA_PASSWORD")
        sys.exit(1)
    
    # Lista de períodos para coletar
    periodos = CanvaCollector.FILTROS_PERIODO
    
    print("\n" + "="*80)
    print("COLETA DE DADOS DO CANVA - TODOS OS PERÍODOS")
    print("="*80)
    print(f"\nEmail: {email}")
    print(f"Períodos a coletar: {len(periodos)}")
    print(f"Diretório de saída: {OUTPUT_DIR}")
    print("\n" + "="*80 + "\n")
    
    # Coleta dados para cada período
    resultados = {}
    
    for i, periodo in enumerate(periodos, 1):
        print(f"\n[{i}/{len(periodos)}] Coletando dados para: {periodo}")
        print("-" * 80)
        
        try:
            # Coleta os dados
            data = collect_canva_data_sync(
                email=email,
                password=password,
                headless=True,
                periodo_filtro=periodo
            )
            
            # Salva os dados
            save_to_csv(data, periodo)
            
            # Armazena resultado
            resultados[periodo] = {
                'sucesso': True,
                'designs_criados': data.get('designs_criados', 0),
                'total_pessoas': data.get('total_pessoas', 0),
                'modelos_coletados': len(data.get('modelos', []))
            }
            
            print(f"✓ Sucesso! Designs: {data.get('designs_criados', 0)}, Pessoas: {data.get('total_pessoas', 0)}")
            
        except Exception as e:
            logging.error(f"✗ Erro ao coletar dados para '{periodo}': {str(e)}")
            resultados[periodo] = {
                'sucesso': False,
                'erro': str(e)
            }
    
    # Resumo final
    print("\n" + "="*80)
    print("RESUMO DA COLETA")
    print("="*80)
    
    sucessos = sum(1 for r in resultados.values() if r.get('sucesso', False))
    falhas = len(resultados) - sucessos
    
    print(f"\nTotal de períodos: {len(periodos)}")
    print(f"Sucessos: {sucessos}")
    print(f"Falhas: {falhas}")
    
    print("\nDetalhes por período:")
    for periodo, resultado in resultados.items():
        if resultado.get('sucesso'):
            print(f"  ✓ {periodo}: {resultado['designs_criados']} designs, {resultado['total_pessoas']} pessoas")
        else:
            print(f"  ✗ {periodo}: {resultado.get('erro', 'Erro desconhecido')}")
    
    print("\n" + "="*80)
    print(f"Arquivos salvos em: {OUTPUT_DIR}")
    print("="*80 + "\n")
    
    # Salva resumo em JSON
    resumo_file = OUTPUT_DIR / f"canva_coleta_resumo_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(resumo_file, 'w', encoding='utf-8') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'email': email,
            'periodos_coletados': len(periodos),
            'sucessos': sucessos,
            'falhas': falhas,
            'resultados': resultados
        }, f, indent=2, ensure_ascii=False)
    
    print(f"Resumo salvo em: {resumo_file}\n")


if __name__ == "__main__":
    main()
