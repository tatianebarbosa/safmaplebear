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
from datetime import datetime

# Colunas chave da planilha de escolas
SCHOOL_ID_COL = 'ID da Escola'
SCHOOL_NAME_COL = 'Nome da Escola'
SCHOOL_EMAIL_COL = 'E-mail da Escola'

# Nome da "escola" para usuários não alocados
UNALLOCATED_SCHOOL_NAME = "Usuários Sem Escola Definida"
UNALLOCATED_SCHOOL_ID = 0

def load_schools_data(csv_content: str) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Carrega a base de dados de escolas a partir do conteúdo CSV e cria o mapeamento de domínio.
    
    Args:
        csv_content: Conteúdo do arquivo CSV das escolas.
        
    Returns:
        Tupla contendo:
        1. DataFrame com os dados de todas as escolas (schools_df).
        2. DataFrame com o mapeamento único de domínio para escola (domain_map_df).
        
    Raises:
        Exception: Se houver erro na leitura ou processamento do CSV.
    """
    logging.info("Carregando base de dados de escolas...")
    
    # Base de dados simulada para fallback (se o CSV estiver vazio ou não for encontrado)
    SIMULATED_SCHOOLS_CSV = """
ID da Escola;Nome da Escola;E-mail da Escola
1;Maple Bear Santa Maria;santamaria.maplebear.com.br
2;Maple Bear Arcoverde;arcoverde.maplebear.com.br
999;Maple Bear Genérico;maplebear.com.br
"""
    
    if not csv_content or csv_content.isspace():
        logging.warning("Conteúdo CSV vazio ou nulo. Usando base de dados simulada para continuar o fluxo.")
        csv_content = SIMULATED_SCHOOLS_CSV
        
    try:
        # O arquivo CSV tem um BOM (Byte Order Mark) no início, por isso o encoding 'utf-8-sig'
        # E o separador é ponto e vírgula (;)
        df = pd.read_csv(StringIO(csv_content), sep=';', encoding='utf-8-sig')
        
        # Validação básica de colunas
        required_cols = [SCHOOL_ID_COL, SCHOOL_NAME_COL, SCHOOL_EMAIL_COL]
        if not all(col in df.columns for col in required_cols):
            logging.error(f"CSV de escolas não contém todas as colunas obrigatórias: {required_cols}")
            raise ValueError("Colunas obrigatórias ausentes no CSV de escolas.")
            
        # Seleciona apenas as colunas relevantes e renomeia para facilitar
        df = df[required_cols].copy()
        df.columns = ['school_id', 'school_name', 'school_email']
        
        # Limpeza e conversão de dados
        df['school_id'] = pd.to_numeric(df['school_id'], errors='coerce').fillna(UNALLOCATED_SCHOOL_ID).astype(int)
        df['school_name'] = df['school_name'].astype(str).str.strip()
        df['school_email'] = df['school_email'].astype(str).str.lower().str.strip()
        
        # Extrai o domínio do e-mail da escola
        # Se o e-mail for um endereço completo (ex: user@domain.com), extrai o domínio.
        # Se for apenas um domínio (ex: domain.com), usa o próprio valor.
        df['school_domain'] = df['school_email'].apply(
            lambda x: x.split('@')[-1] if isinstance(x, str) and '@' in x else (x if isinstance(x, str) else None)
        )
        
        # Remove linhas onde o domínio não pôde ser extraído
        df.dropna(subset=['school_domain'], inplace=True)
        
        # Remove duplicatas de escolas (mantendo a primeira ocorrência)
        schools_df = df.drop_duplicates(subset=['school_id'], keep='first').copy()
        
        # Cria o mapeamento de domínio para a primeira escola encontrada com esse domínio.
        # Isso garante que o índice do dicionário seja único.
        domain_map_df = schools_df.drop_duplicates(subset=['school_domain'], keep='first').copy()
        
        logging.info(f"✅ Base de escolas carregada: {len(schools_df)} registros. {len(domain_map_df)} domínios únicos para mapeamento.")
        return schools_df, domain_map_df
    except Exception as e:
        logging.error(f"❌ Erro ao carregar a base de escolas: {e}")
        raise

def process_canva_users(
    users: List[Dict[str, Any]], 
    schools_df: pd.DataFrame,
    domain_map_df: pd.DataFrame
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    Processa a lista de usuários do Canva e aloca às escolas.
    
    Args:
        users: Lista de usuários do Canva (extraída pelo coletor).
        schools_df: DataFrame com os dados de todas as escolas.
        domain_map_df: DataFrame com um mapeamento único de domínio para escola.
        
    Returns:
        Tupla contendo:
        1. Lista de escolas com a lista de usuários alocados.
        2. Lista de usuários não alocados.
    """
    logging.info(f"Iniciando processamento de {len(users)} usuários do Canva...")
    
    # Estrutura para armazenar os usuários por escola (usando ID como chave)
    schools_users: Dict[int, Dict[str, Any]] = {}
    unallocated_users: List[Dict[str, Any]] = []
    
    # Mapeamento de domínio para ID/Nome da escola (agora garantido como único)
    domain_to_school = domain_map_df.set_index('school_domain')[['school_id', 'school_name']].to_dict('index')
    
    # Inicializa o dicionário de escolas com a estrutura base
    for _, row in schools_df.iterrows():
        school_id = int(row['school_id'])
        school_name = row['school_name']
        schools_users[school_id] = {
            'school_id': school_id,
            'school_name': school_name,
            'users': [],
            'total_users': 0,
            'total_licenses': 0 # A ser preenchido com a lógica de licenças (será o total_users)
        }
        
    # Adiciona a "escola" de não alocados (ID 0)
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
            school_id = int(school_info['school_id'])
            
            # Aloca o usuário à escola
            if school_id in schools_users:
                schools_users[school_id]['users'].append(user)
                schools_users[school_id]['total_users'] += 1
                schools_users[school_id]['total_licenses'] += 1 # Licença = Usuário Alocado
                allocated = True
        if not allocated:
            # Usuário não alocado
            unallocated_users.append(user)
            schools_users[UNALLOCATED_SCHOOL_ID]['users'].append(user)
            schools_users[UNALLOCATED_SCHOOL_ID]['total_users'] += 1
            schools_users[UNALLOCATED_SCHOOL_ID]['total_licenses'] += 1 # Licença = Usuário Não Alocado    
    # Converte o dicionário de volta para uma lista de escolas
    schools_list = list(schools_users.values())
    
    return schools_list, unallocated_users


def generate_markdown_report(integrated_data: Dict[str, Any]) -> str:
    """
    Gera um relatório detalhado em formato Markdown a partir dos dados integrados.
    """
    report = []
    
    # --- Cabeçalho e Métricas Gerais ---
    report.append("# 📊 Relatório de Uso do Canva Integrado")
    report.append(f"**Data de Geração:** {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}")
    report.append(f"**Período do Filtro:** {integrated_data.get('periodo_filtro', 'N/A')}")
    report.append("---")
    
    report.append("## 📈 Métricas Gerais do Canva")
    report.append("| Métrica | Valor | Crescimento |")
    report.append("| :--- | :--- | :--- |")
    
    metrics = [
        ("Designs Criados", integrated_data.get('designs_criados'), integrated_data.get('designs_criados_crescimento')),
        ("Total Publicado", integrated_data.get('total_publicado'), integrated_data.get('total_publicado_crescimento')),
        ("Total Compartilhado", integrated_data.get('total_compartilhado'), integrated_data.get('total_compartilhado_crescimento')),
        ("Alunos", integrated_data.get('alunos'), integrated_data.get('alunos_crescimento')),
        ("Professores", integrated_data.get('professores'), integrated_data.get('professores_crescimento')),
        ("Total de Pessoas", integrated_data.get('total_pessoas'), None),
    ]
    
    for name, value, growth in metrics:
        growth_str = f"{growth:.1f}%" if growth is not None else "N/A"
        report.append(f"| {name} | {value} | {growth_str} |")
        
    report.append("\n---")
    
    # --- Usuários Não Alocados ---
    unallocated_users = integrated_data.get('unallocated_users_list', [])
    report.append(f"## ⚠️ Usuários Sem Escola Definida ({len(unallocated_users)})")
    report.append("Estes usuários possuem e-mails com domínios genéricos ou não mapeados na base de escolas.")
    
    if unallocated_users:
        report.append("| Nome | E-mail | Função |")
        report.append("| :--- | :--- | :--- |")
        for user in unallocated_users:
            report.append(f"| {user.get('nome', 'N/A')} | {user.get('email', 'N/A')} | {user.get('funcao', 'N/A')} |")
    else:
        report.append("Nenhum usuário sem escola definida encontrado. ✅")
        
    report.append("\n---")
    
    # --- Alocação por Escola ---
    report.append("## 🏫 Alocação de Usuários por Escola")
    
    schools_allocation = integrated_data.get('schools_allocation', [])
    
    # Filtra escolas com usuários alocados e ordena
    allocated_schools = sorted(
        [s for s in schools_allocation if s.get('total_users', 0) > 0 and s.get('school_id') != 0],
        key=lambda x: x['total_users'],
        reverse=True
    )
    
    if allocated_schools:
        report.append("| Escola | ID | Usuários Alocados |")
        report.append("| :--- | :--- | :--- |")
        for school in allocated_schools:
            report.append(f"| {school['school_name']} | {school['school_id']} | {school['total_users']} |")
            
        report.append("\n### Detalhe por Escola (Apenas Escolas com Usuários Alocados)")
        
        for school in allocated_schools:
            report.append(f"\n#### {school['school_name']} (ID: {school['school_id']}) - Total: {school['total_users']} Usuários")
            report.append("| Nome | E-mail | Função |")
            report.append("| :--- | :--- | :--- |")
            for user in school['users']:
                report.append(f"| {user.get('nome', 'N/A')} | {user.get('email', 'N/A')} | {user.get('funcao', 'N/A')} |")
    else:
        report.append("Nenhum usuário alocado a uma escola específica. ❌")
        
    report.append("\n---")
    
    # --- Tabela de Modelos (do primeiro período coletado) ---
    models = integrated_data.get('modelos', [])
    report.append("## 🎨 Modelos Mais Utilizados (Dados Brutos do Canva)")
    
    if models:
        report.append("| Modelo | Titular | Usadas | Publicado | Compartilhado |")
        report.append("| :--- | :--- | :--- | :--- | :--- |")
        for model in models:
            report.append(f"| {model.get('modelo', 'N/A')} | {model.get('titular', 'N/A')} | {model.get('usadas', 0)} | {model.get('publicado', 0)} | {model.get('compartilhado', 0)} |")
    else:
        report.append("Nenhum dado de modelo encontrado.")
        
    return "\n".join(report)


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
        
    Raises:
        Exception: Se houver erro no processamento dos usuários.
    """
    
    try:
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
            'unallocated_users_list': unallocated_users,
            'unallocated_users_count': len(unallocated_users), # Adiciona contagem
            'modelos': canva_metrics.get('modelos', [])
        }
        
        logging.info("✅ Integração de dados do Canva concluída.")
        return integrated_data
    except Exception as e:
        logging.error(f"❌ Erro na integração dos dados do Canva: {e}")
        raise

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
