import logging
import json
import os
import azure.functions as func
from openai import OpenAI
from pathlib import Path

# Configuração do cliente OpenAI
# A chave e o base_url são lidos automaticamente das variáveis de ambiente
client = OpenAI()

def get_dashboard_data():
    """Lê o arquivo de dados integrado mais recente."""
    try:
        # Caminho para o arquivo de dados integrado
        data_file = Path(__file__).parent.parent.parent / 'canva_data_integrated_latest.json'
        
        if not data_file.exists():
            # Tenta caminho alternativo (public/data)
            data_file = Path(__file__).parent.parent.parent / 'public' / 'data' / 'canva_data_integrated_latest.json'
        
        if not data_file.exists():
            return {"error": "Dados não disponíveis", "message": "Os dados do Canva ainda não foram coletados."}
        
        with open(data_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        # Remove dados brutos de usuários para economizar tokens, mantendo apenas o resumo
        if "schools_allocation" in data:
            for school in data["schools_allocation"]:
                if "users" in school:
                    del school["users"]
        if "unallocated_users_list" in data:
            del data["unallocated_users_list"]
            
        return data
        
    except Exception as e:
        logging.error(f"Erro ao ler dados do dashboard: {e}")
        return {"error": "Erro ao ler dados", "message": str(e)}

def main(req: func.HttpRequest) -> func.HttpResponse:
    logging.info('Requisição HTTP recebida para o endpoint de Chat IA.')

    try:
        req_body = req.get_json()
    except ValueError:
        return func.HttpResponse(
             "Por favor, passe um JSON no corpo da requisição",
             status_code=400
        )

    user_question = req_body.get('question')
    
    if not user_question:
        return func.HttpResponse(
             "Por favor, passe a 'question' no corpo da requisição",
             status_code=400
        )

    # 1. Obter os dados mais recentes do dashboard
    dashboard_data = get_dashboard_data()
    
    # 2. Definir o System Prompt com as regras de negócio e o contexto dos dados
    system_prompt = f"""
    Você é a IA de Análise de Licenças do SAF Maple Bear. Sua função é responder perguntas sobre o uso de licenças e métricas do Canva com base nos dados fornecidos.
    
    **Regras de Negócio da Maple Bear:**
    1.  Sempre responda em Português do Brasil.
    2.  Seja profissional, direto e utilize os dados fornecidos para justificar suas respostas.
    3.  Se a pergunta for sobre licenças, use o campo 'licencas_utilizadas' como o número de licenças ativas.
    4.  A diferença entre 'licencas_utilizadas' e 'total_licencas_disponiveis' é o excedente ou o saldo.
    5.  A lista 'schools_allocation' contém o resumo de licenças por escola.
    6.  Se os dados não estiverem disponíveis, informe que a coleta de dados mais recente não foi concluída.
    
    **Dados Atuais do Dashboard (JSON):**
    {json.dumps(dashboard_data, indent=2, ensure_ascii=False)}
    """

    try:
        # 3. Chamar a API do ChatGPT
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_question}
            ],
            temperature=0.2
        )
        
        ia_response = response.choices[0].message.content

        return func.HttpResponse(
            json.dumps({"response": ia_response}, ensure_ascii=False),
            mimetype="application/json",
            status_code=200
        )

    except Exception as e:
        logging.error(f"Erro ao chamar a API do OpenAI: {e}")
        return func.HttpResponse(
             json.dumps({"error": "Erro interno ao processar a IA", "details": str(e)}, ensure_ascii=False),
             mimetype="application/json",
             status_code=500
        )

