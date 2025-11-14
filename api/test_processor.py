import unittest
import pandas as pd
from io import StringIO
from shared.canva_data_processor import load_schools_data, process_canva_users, integrate_canva_data, generate_markdown_report, UNALLOCATED_SCHOOL_ID, UNALLOCATED_SCHOOL_NAME

class TestCanvaDataProcessor(unittest.TestCase):

    # Base de dados simulada para testes
    SCHOOLS_CSV = """
ID da Escola;Nome da Escola;E-mail da Escola
1;Maple Bear Santa Maria;santamaria.maplebear.com.br
2;Maple Bear Arcoverde;arcoverde.maplebear.com.br
3;Maple Bear Alphaville;alphaville.maplebear.com.br
4;Escola Comum;escola.com
999;Maple Bear Genérico;maplebear.com.br
"""

    # Usuários simulados
    CANVA_USERS = [
        {'nome': 'Andressa Menezes', 'email': 'andressa.menezes@santamaria.maplebear.com.br', 'funcao': 'Estudante'}, # Alocado 1
        {'nome': 'Clarice Silva', 'email': 'clarice.silva@arcoverde.maplebear.com.br', 'funcao': 'Estudante'}, # Alocado 2
        {'nome': 'Professor João', 'email': 'joao.professor@maplebear.com.br', 'funcao': 'Professor'}, # Alocado 999
        {'nome': 'Admin Teste', 'email': 'admin@escola.com', 'funcao': 'Administrador'}, # Alocado 4
        {'nome': 'Usuario Gmail', 'email': 'usuario@gmail.com', 'funcao': 'Estudante'}, # Não alocado (domínio genérico)
        {'nome': 'Usuario Hotmail', 'email': 'usuario@hotmail.com', 'funcao': 'Professor'}, # Não alocado (domínio genérico)
        {'nome': 'Usuario Sem Email', 'email': '', 'funcao': 'Estudante'}, # Não alocado (sem email)
        {'nome': 'Usuario Desconhecido', 'email': 'desconhecido@naoexiste.com', 'funcao': 'Estudante'}, # Não alocado (domínio não mapeado)
    ]
    
    # Métricas simuladas
    CANVA_METRICS = {
        'timestamp': 1731520245000,
        'data_atualizacao': '13/11/2025',
        'periodo_filtro': 'Últimos 30 dias',
        'designs_criados': 5994,
        'total_pessoas': 500,
        'usuarios': CANVA_USERS,
        'modelos': [{'nome': 'Modelo A', 'uso': 100}]
    }

    def test_load_schools_data(self):
        """Testa o carregamento e mapeamento da base de escolas."""
        schools_df, domain_map_df = load_schools_data(self.SCHOOLS_CSV)
        
        self.assertIsInstance(schools_df, pd.DataFrame)
        self.assertIsInstance(domain_map_df, pd.DataFrame)
        
        # Verifica se o número de escolas é o esperado
        self.assertEqual(len(schools_df), 5) # 5 escolas únicas no CSV de teste
        
        # Verifica se o número de domínios mapeados é o esperado
        self.assertEqual(len(domain_map_df), 5)
        
        # Verifica se o domínio foi extraído corretamente
        self.assertIn('santamaria.maplebear.com.br', domain_map_df['school_domain'].values)
        self.assertIn('escola.com', domain_map_df['school_domain'].values)
        
        # Testa com CSV vazio (deve usar o fallback)
        schools_df_empty, domain_map_df_empty = load_schools_data("")
        self.assertEqual(len(schools_df_empty), 3)
        self.assertEqual(len(domain_map_df_empty), 3)

    def test_process_canva_users(self):
        """Testa a alocação de usuários às escolas."""
        schools_df, domain_map_df = load_schools_data(self.SCHOOLS_CSV)
        
        schools_allocation, unallocated_users = process_canva_users(
            self.CANVA_USERS, 
            schools_df,
            domain_map_df
        )
        
        # Verifica o número de usuários não alocados
        # Esperado: gmail.com, hotmail.com, sem email, naoexiste.com (4 usuários)
        self.assertEqual(len(unallocated_users), 4)
        
        # Verifica o número total de escolas na alocação (5 escolas mapeadas + 1 não alocada)
        self.assertEqual(len(schools_allocation), 6) 
        
        # Verifica a alocação por escola
        allocation_map = {s['school_id']: s for s in schools_allocation}
        
        # Escola 1: Santa Maria
        self.assertEqual(allocation_map[1]['total_users'], 1)
        self.assertEqual(allocation_map[1]['users'][0]['nome'], 'Andressa Menezes')
        
        # Escola 2: Arcoverde
        self.assertEqual(allocation_map[2]['total_users'], 1)
        
        # Escola 999: Genérico
        self.assertEqual(allocation_map[999]['total_users'], 1)
        
        # Escola 4: Escola Comum
        self.assertEqual(allocation_map[4]['total_users'], 1)
        
        # Escola 0: Não Alocados
        self.assertEqual(allocation_map[UNALLOCATED_SCHOOL_ID]['total_users'], 4)
        self.assertEqual(allocation_map[UNALLOCATED_SCHOOL_ID]['school_name'], UNALLOCATED_SCHOOL_NAME)
        self.assertIn('Usuario Gmail', [u['nome'] for u in allocation_map[UNALLOCATED_SCHOOL_ID]['users']])
        self.assertIn('Usuario Desconhecido', [u['nome'] for u in allocation_map[UNALLOCATED_SCHOOL_ID]['users']])

    def test_integrate_canva_data(self):
        """Testa a integração completa dos dados."""
        schools_df, domain_map_df = load_schools_data(self.SCHOOLS_CSV)
        
        integrated_data = integrate_canva_data(
            self.CANVA_METRICS, 
            schools_df,
            domain_map_df
        )
        
        self.assertIn('schools_allocation', integrated_data)
        self.assertIn('unallocated_users_list', integrated_data)
        self.assertIn('unallocated_users_count', integrated_data)
        self.assertIn('canva_metrics', integrated_data)
        self.assertIn('modelos', integrated_data)
        
        # Verifica se as métricas foram transferidas
        self.assertEqual(integrated_data['canva_metrics']['designs_criados'], 5994)
        
        # Verifica a contagem de não alocados
        self.assertEqual(integrated_data['unallocated_users_count'], 4)
        self.assertEqual(len(integrated_data['unallocated_users_list']), 4)
        
        # Verifica a alocação
        self.assertEqual(len(integrated_data['schools_allocation']), 6)

    def test_generate_markdown_report(self):
        """Testa a geração do relatório Markdown."""
        schools_df, domain_map_df = load_schools_data(self.SCHOOLS_CSV)
        
        integrated_data = integrate_canva_data(
            self.CANVA_METRICS, 
            schools_df,
            domain_map_df
        )
        
        report = generate_markdown_report(integrated_data)
        
        self.assertIsInstance(report, str)
        self.assertIn("Relatório de Uso do Canva Integrado", report)
        self.assertIn("Usuários Sem Escola Definida (4)", report)
        self.assertIn("Alocação de Usuários por Escola", report)
        self.assertIn("Maple Bear Santa Maria", report)
        self.assertIn("Usuario Gmail", report)


if __name__ == '__main__':
    unittest.main()
