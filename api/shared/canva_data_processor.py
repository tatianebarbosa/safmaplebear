"""
Canva Data Processor - Lógica de Processamento e Alocação de Usuários
=====================================================================

Este módulo é responsável por:
1. Carregar a base de dados oficial de escolas.
2. Processar a lista de usuários do Canva.
3. Alocar usuários às escolas com base no domínio do e-mail.
4. Identificar usuários sem escola definida.
"""

import logging
import pandas as pd
from typing import List, Dict, Any, Tuple
from io import StringIO

# Colunas chave da planilha de escolas
SCHOOL_ID_COL = 'ID da Escola'
SCHOOL_NAME_COL = 'Nome da Escola'
SCHOOL_EMAIL_COL = 'E-mail da Escola'

# Nome da "escola" para usuários não alocados
UNALLOCATED_SCHOOL_NAME = "Usuários Sem Escola Definida"
UNALLOCATED_SCHOOL_ID = 0

def load_schools_data(csv_content: str) -> pd.DataFrame:
    """
    Carrega a base de dados de escolas a partir do conteúdo CSV.
    
    Args:
        csv_content: Conteúdo do arquivo CSV das escolas.
        
    Returns:
        DataFrame do Pandas com os dados das escolas.
    """
    logging.info("Carregando base de dados de escolas...")
    # O arquivo CSV tem um BOM (Byte Order Mark) no início, por isso o encoding 'utf-8-sig'
    # E o separador é ponto e vírgula (;)
    try:
        df = pd.read_csv(StringIO(csv_content), sep=';', encoding='utf-8-sig')
        
        # Seleciona apenas as colunas relevantes e renomeia para facilitar
        df = df[[SCHOOL_ID_COL, SCHOOL_NAME_COL, SCHOOL_EMAIL_COL]].copy()
        df.columns = ['school_id', 'school_name', 'school_email']
        
        # Limpeza de dados
        df['school_id'] = pd.to_numeric(df['school_id'], errors='coerce').fillna(UNALLOCATED_SCHOOL_ID).astype(int)
        df['school_email'] = df['school_email'].str.lower().str.strip()
        
        # Extrai o domínio do e-mail da escola
        # Se o e-mail for um endereço completo (ex: user@domain.com), extrai o domínio.
        # Se for apenas um domínio (ex: domain.com), usa o próprio valor.
        df['school_domain'] = df['school_email'].apply(
            lambda x: x.split('@')[-1] if isinstance(x, str) and '@' in x else (x if isinstance(x, str) else None)
        )
        
        # Remove duplicatas de escolas (mantendo a primeira ocorrência)
        df.drop_duplicates(subset=['school_id'], keep='first', inplace=True)
        
        # Cria um mapeamento de domínio para a primeira escola encontrada com esse domínio.
        # Isso resolve o problema de domínios duplicados (ex: escolas com o mesmo domínio genérico)
        # e garante que o índice do dicionário seja único.
        domain_map = df.drop_duplicates(subset=['school_domain'], keep='first')
        
        logging.info(f"Base de escolas carregada: {len(df)} registros. {len(domain_map)} domínios únicos para mapeamento.")
        return df, domain_map
    except Exception as e:
        logging.error(f"Erro ao carregar a base de escolas: {e}")
        raise

def process_canva_users(
    users: List[Dict[str, Any]], 
    schools_df: pd.DataFrame,
    domain_map_df: pd.DataFrame
) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
    """
    Processa a lista de usuários do Canva e aloca às escolas.
    
    Args:
        users: Lista de usuários do Canva (extraída pelo coletor).
        schools_df: DataFrame com os dados de todas as escolas.
        domain_map_df: DataFrame com um mapeamento único de domínio para escola.
        
    Returns:
        Tupla contendo:
        1. Dicionário de escolas com a lista de usuários alocados.
        2. Lista de usuários não alocados.
    """
    logging.info(f"Iniciando processamento de {len(users)} usuários do Canva...")
    
    # Estrutura para armazenar os usuários por escola
    schools_users: Dict[str, Any] = {}
    unallocated_users: List[Dict[str, Any]] = []
    
    # Mapeamento de domínio para ID/Nome da escola (agora garantido como único)
    domain_to_school = domain_map_df.set_index('school_domain')[['school_id', 'school_name']].to_dict('index')
    
    # Inicializa o dicionário de escolas com a estrutura base
    for _, row in schools_df.iterrows():
        school_id = row['school_id']
        school_name = row['school_name']
        schools_users[school_id] = {
            'school_id': school_id,
            'school_name': school_name,
            'users': [],
            'total_users': 0,
            'total_licenses': 0 # A ser preenchido com a lógica de licenças
        }
        
    # Adiciona a "escola" de não alocados
    schools_users[UNALLOCATED_SCHOOL_ID] = {
        'school_id': UNALLOCATED_SCHOOL_ID,
        'school_name': UNALLOCATED_SCHOOL_NAME,
        'users': [],
        'total_users': 0,
        'total_licenses': 0
    }

    # Processa cada usuário
    for user in users:
        email = user.get('email', '').lower().strip()
        user_domain = email.split('@')[-1] if '@' in email else None
        
        allocated = False
        
        if user_domain and user_domain in domain_to_school:
            school_info = domain_to_school[user_domain]
            school_id = school_info['school_id']
            
            # Aloca o usuário à escola
            # O ID da escola 0 é reservado para "Usuários Sem Escola Definida"
            if school_id != UNALLOCATED_SCHOOL_ID and school_id in schools_users:
                schools_users[school_id]['users'].append(user)
                schools_users[school_id]['total_users'] += 1
                allocated = True
        
        if not allocated:
            # Usuário não alocado
            unallocated_users.append(user)
            schools_users[UNALLOCATED_SCHOOL_ID]['users'].append(user)
            schools_users[UNALLOCATED_SCHOOL_ID]['total_users'] += 1

    logging.info(f"Processamento concluído. {len(unallocated_users)} usuários não alocados.")
    
    # Converte o dicionário de volta para uma lista de escolas
    schools_list = list(schools_users.values())
    
    return schools_list, unallocated_users

def integrate_canva_data(
    canva_metrics: Dict[str, Any], 
    schools_df: pd.DataFrame,
    domain_map_df: pd.DataFrame
) -> Dict[str, Any]:
    """
    Integra as métricas do Canva com a alocação de usuários por escola.
    
    Args:
        canva_metrics: Dicionário com as métricas do Canva (incluindo 'usuarios').
        schools_df: DataFrame com os dados de todas as escolas.
        domain_map_df: DataFrame com um mapeamento único de domínio para escola.
        
    Returns:
        Dicionário com os dados integrados (métricas e alocação por escola).
    """
    
    # 1. Processa a lista de usuários
    schools_with_users, unallocated_users = process_canva_users(
        canva_metrics.get('usuarios', []), 
        schools_df,
        domain_map_df
    )
    
    # 2. Prepara o resultado final
    integrated_data = {
        'timestamp': canva_metrics.get('timestamp'),
        'data_atualizacao': canva_metrics.get('data_atualizacao'),
        'hora_atualizacao': canva_metrics.get('hora_atualizacao'),
        'periodo_filtro': canva_metrics.get('periodo_filtro'),
        'canva_metrics': {
            k: v for k, v in canva_metrics.items() if k not in ['usuarios', 'modelos']
        },
        'schools_allocation': schools_with_users,
        'unallocated_users_count': len(unallocated_users),
        'unallocated_users_list': unallocated_users,
        'modelos': canva_metrics.get('modelos', [])
    }
    
    logging.info("Integração de dados do Canva concluída.")
    return integrated_data

# Exemplo de uso (para testes)
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    
    # Simulação de dados do Canva (apenas o essencial para o teste)
    simulated_canva_metrics = {
        'timestamp': 1731520245000,
        'data_atualizacao': '13/11/2025',
        'hora_atualizacao': '14:30:45',
        'periodo_filtro': 'Últimos 30 dias',
        'designs_criados': 5994,
        'total_pessoas': 500,
        'usuarios': [
            {'nome': 'Andressa Menezes', 'email': 'andressa.menezes@santamaria.maplebear.com.br', 'funcao': 'Estudante'},
            {'nome': 'Clarice Silva', 'email': 'clarice.silva@arcoverde.maplebear.com.br', 'funcao': 'Estudante'},
            {'nome': 'Professor João', 'email': 'joao.professor@maplebear.com.br', 'funcao': 'Professor'}, # Domínio genérico
            {'nome': 'Admin Teste', 'email': 'admin@escola.com', 'funcao': 'Administrador'}, # Domínio não mapeado
            {'nome': 'Hayan Cesar', 'email': 'hayannne.cesar@santamaria.maplebear.com.br', 'funcao': 'Estudante'},
            {'nome': 'Usuário Sem Email', 'email': '', 'funcao': 'Estudante'},
        ],
        'modelos': [{'nome': 'Modelo 1', 'usadas': 10}]
    }
    
    # Simulação de dados da escola (usando o que foi lido)
    simulated_schools_csv = """
ID da Escola;Nome da Escola;E-mail da Escola
793;Maple Bear Arcoverde;MAPLEBEAR.ARCOVERDE@GMAIL.COM
257;Maple Bear Santa Maria - Centro I;santamaria@maplebear.com.br
800;Maple Bear Escola Teste;escola.teste@escola.com
"""
    
    try:
        # 1. Carrega a base de escolas
        schools_df, domain_map_df = load_schools_data(simulated_schools_csv)
        
        # 2. Processa e integra os dados
        integrated_data = integrate_canva_data(simulated_canva_metrics, schools_df, domain_map_df)
        
        # 3. Exibe o resultado
        print("\n" + "="*80)
        print("DADOS INTEGRADOS (SIMULAÇÃO)")
        print("="*80)
        print(json.dumps(integrated_data, indent=2, ensure_ascii=False))
        
        # Verifica a alocação
        santamaria = next(s for s in integrated_data['schools_allocation'] if s['school_id'] == 257)
        arcoverde = next(s for s in integrated_data['schools_allocation'] if s['school_id'] == 793)
        unallocated = next(s for s in integrated_data['schools_allocation'] if s['school_id'] == UNALLOCATED_SCHOOL_ID)
        
        print("\n" + "="*80)
        print("VERIFICAÇÃO DE ALOCAÇÃO")
        print("="*80)
        print(f"Santa Maria (257) Usuários: {santamaria['total_users']}")
        print(f"Arcoverde (793) Usuários: {arcoverde['total_users']}")
        print(f"Não Alocados (0) Usuários: {unallocated['total_users']}")
        
    except Exception as e:
        logging.error(f"Erro na simulação: {e}")
