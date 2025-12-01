"""
Azure Function - HTTP Trigger para obter métricas específicas do Canva
======================================================================

Endpoint: GET /api/canva/metricas/{tipo}
Retorna métricas filtradas por tipo
"""

import logging
import json
import os
from pathlib import Path
import azure.functions as func


def main(req: func.HttpRequest) -> func.HttpResponse:
    """
    Retorna métricas específicas do Canva.
    
    Parâmetros:
        tipo: pessoas | designs | membros | kits | escolas
    
    Returns:
        JSON com as métricas filtradas
    """
    logging.info('Requisição recebida para obter métricas do Canva')
    
    try:
        # Obtém o tipo de métrica da rota
        tipo = req.route_params.get('tipo', '').lower()
        
        if not tipo:
            return func.HttpResponse(
                json.dumps({
                    "error": "Parâmetro inválido",
                    "message": "Especifique o tipo de métrica: pessoas, designs, membros, kits ou escolas"
                }, ensure_ascii=False),
                status_code=400,
                mimetype="application/json; charset=utf-8"
            )
        
        # Caminho para o arquivo de dados integrados
        data_file = Path(__file__).parent.parent.parent / 'canva_data_integrated_latest.json'
        
        if not data_file.exists():
            data_file = Path(__file__).parent.parent.parent / 'public' / 'data' / 'canva_data_integrated_latest.json'
        
        if not data_file.exists():
            logging.warning('Arquivo de dados integrados não encontrado')
            return func.HttpResponse(
                json.dumps({
                    "error": "Dados não disponíveis",
                    "message": "Os dados do Canva ainda não foram coletados."
                }, ensure_ascii=False),
                status_code=404,
                mimetype="application/json; charset=utf-8"
            )
        
        # Lê o arquivo de dados
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Filtra as métricas por tipo
        if tipo == 'pessoas':
            metrics = {
                'total_pessoas': data.get('canva_metrics', {}).get('total_pessoas', 0),
                'alunos': data.get('canva_metrics', {}).get('alunos', 0),
                'alunos_crescimento': data.get('canva_metrics', {}).get('alunos_crescimento', 0),
                'professores': data.get('canva_metrics', {}).get('professores', 0),
                'professores_crescimento': data.get('canva_metrics', {}).get('professores_crescimento', 0),
                'administradores': data.get('canva_metrics', {}).get('administradores', 0),
                'periodo_filtro': data.get('periodo_filtro', 'N/A'),
                'data_atualizacao': data.get('data_atualizacao', 'N/A')
            }
        
        elif tipo == 'designs':
            metrics = {
                'designs_criados': data.get('canva_metrics', {}).get('designs_criados', 0),
                'designs_criados_crescimento': data.get('canva_metrics', {}).get('designs_criados_crescimento', 0),
                'total_publicado': data.get('canva_metrics', {}).get('total_publicado', 0),
                'total_publicado_crescimento': data.get('canva_metrics', {}).get('total_publicado_crescimento', 0),
                'total_compartilhado': data.get('canva_metrics', {}).get('total_compartilhado', 0),
                'total_compartilhado_crescimento': data.get('canva_metrics', {}).get('total_compartilhado_crescimento', 0),
                'periodo_filtro': data.get('periodo_filtro', 'N/A'),
                'data_atualizacao': data.get('data_atualizacao', 'N/A')
            }
        
        elif tipo == 'membros':
            # Extrai informações de membros (usuários)
            usuarios = []
            for school in data.get('schools_allocation', []):
                for user in school.get('users', []):
                    usuarios.append({
                        'nome': user.get('nome', 'N/A'),
                        'email': user.get('email', 'N/A'),
                        'funcao': user.get('funcao', 'N/A'),
                        'escola': school.get('school_name', 'N/A'),
                        'escola_id': school.get('school_id', 'N/A')
                    })
            
            metrics = {
                'total_membros': len(usuarios),
                'membros': usuarios,
                'periodo_filtro': data.get('periodo_filtro', 'N/A'),
                'data_atualizacao': data.get('data_atualizacao', 'N/A')
            }
        
        elif tipo == 'kits':
            metrics = {
                'total_kits': data.get('canva_metrics', {}).get('total_kits', 0),
                'kits': data.get('canva_metrics', {}).get('kits', []),
                'periodo_filtro': data.get('periodo_filtro', 'N/A'),
                'data_atualizacao': data.get('data_atualizacao', 'N/A')
            }
        
        elif tipo == 'escolas':
            escolas = []
            for school in data.get('schools_allocation', []):
                if school.get('school_id', 0) != 0:  # Ignora "Usuários Sem Escola"
                    escolas.append({
                        'escola_id': school.get('school_id'),
                        'escola_nome': school.get('school_name'),
                        'total_usuarios': school.get('total_users', 0),
                        'total_licencas': school.get('total_licenses', 0)
                    })
            
            metrics = {
                'total_escolas': len(escolas),
                'escolas': escolas,
                'usuarios_nao_alocados': data.get('unallocated_users_count', 0),
                'periodo_filtro': data.get('periodo_filtro', 'N/A'),
                'data_atualizacao': data.get('data_atualizacao', 'N/A')
            }
        
        else:
            return func.HttpResponse(
                json.dumps({
                    "error": "Tipo inválido",
                    "message": f"Tipo '{tipo}' não reconhecido. Use: pessoas, designs, membros, kits ou escolas"
                }, ensure_ascii=False),
                status_code=400,
                mimetype="application/json; charset=utf-8"
            )
        
        logging.info(f'Métricas do tipo "{tipo}" retornadas com sucesso')
        
        return func.HttpResponse(
            json.dumps(metrics, ensure_ascii=False, indent=2),
            status_code=200,
            mimetype="application/json; charset=utf-8",
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type"
            }
        )
    
    except Exception as e:
        logging.error(f'Erro ao obter métricas: {str(e)}', exc_info=True)
        return func.HttpResponse(
            json.dumps({
                "error": "Erro interno",
                "message": str(e)
            }, ensure_ascii=False),
            status_code=500,
            mimetype="application/json; charset=utf-8"
        )
