import json
import logging
import os
from pathlib import Path
from typing import Any, Dict, List, Optional

import azure.functions as func
import httpx

PROJECT_ROOT = Path(__file__).resolve().parents[2]
DEFAULT_DATA_FILE = PROJECT_ROOT / "canva_data_integrated_latest.json"
PUBLIC_DATA_FILE = PROJECT_ROOT / "public" / "data" / "canva_data_integrated_latest.json"
KNOWLEDGE_DIR = PROJECT_ROOT / "public" / "knowledge-base"
DEFAULT_KNOWLEDGE_FILE = KNOWLEDGE_DIR / "default_knowledge.json"
SITE_CONTEXT_FILE = KNOWLEDGE_DIR / "site_context.json"
DATA_FILE_ENV = "CANVA_DATA_FILE"
MODEL_ENV = "CHAT_IA_MODEL"
TEMPERATURE_ENV = "CHAT_IA_TEMPERATURE"
OPENAI_API_KEY_ENV = "OPENAI_API_KEY"
OPENAI_BASE_URL_ENV = "OPENAI_BASE_URL"


def _json_response(payload: Dict[str, Any], status_code: int) -> func.HttpResponse:
  """Retorna uma resposta JSON padronizada."""
  return func.HttpResponse(
    json.dumps(payload, ensure_ascii=False),
    mimetype="application/json; charset=utf-8",
    status_code=status_code,
  )


def _resolve_data_file() -> Optional[Path]:
  """Determina qual arquivo deve ser usado como fonte de dados do dashboard."""
  env_path = os.environ.get(DATA_FILE_ENV)
  candidates = []

  if env_path:
    candidates.append(Path(env_path).expanduser())

  candidates.extend([DEFAULT_DATA_FILE, PUBLIC_DATA_FILE])

  for candidate in candidates:
    if candidate.exists():
      logging.info(f"Dados do dashboard carregados de: {candidate}")
      return candidate

  logging.warning("Nenhum arquivo de dados integrado foi encontrado.")
  return None


def get_dashboard_data() -> Dict[str, Any]:
  """Le o arquivo de dados integrado mais recente e remove informacoes sensiveis."""
  data_file = _resolve_data_file()

  if not data_file:
    return {"error": "Dados nao disponiveis", "message": "Os dados do Canva ainda nao foram coletados."}

  try:
    with open(data_file, "r", encoding="utf-8") as file_handle:
      data = json.load(file_handle)
  except (OSError, json.JSONDecodeError) as error:
    logging.error(f"Erro ao ler dados do dashboard: {error}")
    return {"error": "Erro ao ler dados", "message": str(error)}

  if "schools_allocation" in data:
    for school in data["schools_allocation"]:
      school.pop("users", None)

  data.pop("unallocated_users_list", None)

  return data


def _load_json_file(file_path: Path) -> Optional[Any]:
  if not file_path.exists():
    logging.warning("Arquivo nao encontrado: %s", file_path)
    return None

  try:
    with open(file_path, "r", encoding="utf-8") as handle:
      return json.load(handle)
  except (OSError, json.JSONDecodeError) as error:
    logging.error("Erro ao carregar %s: %s", file_path, error)
    return None


def get_site_context() -> Optional[Dict[str, Any]]:
  """Carrega o mapa de modulos e pipelines do site."""
  data = _load_json_file(SITE_CONTEXT_FILE)
  if isinstance(data, dict):
    return data
  return None


def get_default_knowledge() -> List[Dict[str, Any]]:
  """Carrega o conhecimento padrao disponibilizado em public/knowledge-base."""
  data = _load_json_file(DEFAULT_KNOWLEDGE_FILE)
  if isinstance(data, list):
    return data
  return []


def _format_knowledge_entries(
  entries: List[Dict[str, Any]],
  header: str,
  limit: int = 6,
  char_limit: int = 400,
) -> str:
  if not entries:
    return ""

  formatted = []
  for entry in entries[:limit]:
    title = str(entry.get("title") or entry.get("name") or "Documento sem titulo").strip()
    category = str(entry.get("category") or "geral").strip()
    content = str(entry.get("summary") or entry.get("content") or "").strip()
    if not content:
      continue

    snippet = " ".join(content.split())
    if len(snippet) > char_limit:
      snippet = snippet[:char_limit].rsplit(" ", 1)[0] + "..."

    formatted.append(f"- {title} [{category}]: {snippet}")

  if not formatted:
    return ""

  return f"{header}:\n" + "\n".join(formatted)


def build_system_prompt(
  dashboard_data: Dict[str, Any],
  site_context: Optional[Dict[str, Any]] = None,
  knowledge_base: Optional[List[Dict[str, Any]]] = None,
) -> str:
  """Gera o system prompt usado pela IA."""
  sections = [
    (
      "Voce eh a IA do SAF Maple Bear para licencas Canva, usuarios, tickets, agenda e rotinas internas. "
      "Use apenas os dados fornecidos."
    ),
    (
      "Regras de negocio:\n"
      "- Nao invente metricas, analises, previsoes ou interpretacoes avancadas.\n"
      "- Use somente dados explicitos da base local (CSV/JSON) ou do contexto recebido.\n"
      "- Para licencas: se nao houver dado, responda exatamente: "
      "\"Nao encontrei essa informacao na base local. No sistema SAF, voce pode verificar isso na tela de Licencas Canva pesquisando o nome da escola.\".\n"
      "- Para perguntas que exigem BI ou analise inexistente, responda: "
      "\"Isso nao faz parte dos dados disponiveis no SAF. Posso auxiliar somente com as informacoes que ja existem no sistema.\".\n"
      "- Responda em portugues do Brasil, sem se apresentar, com no maximo 2 paragrafos curtos, de forma simples e objetiva.\n"
      "- Para licencas, considere 'licencas_utilizadas' como ativas; saldo = total_licencas_disponiveis - licencas_utilizadas; 'schools_allocation' contem o resumo por escola.\n"
      "- Se os dados estiverem indisponiveis, informe que a sincronizacao mais recente nao foi concluida.\n"
      "- Se receber um texto para melhorar, devolva apenas a versao final revisada (clara, educada, profissional e objetiva), sem prefacio ou explicacao."
    ),
    f"Dados atuais do dashboard (JSON):\n{json.dumps(dashboard_data, indent=2, ensure_ascii=False)}",
  ]

  if site_context:
    sections.append(
      "Mapa do site e modulos ativos:\n"
      f"{json.dumps(site_context, indent=2, ensure_ascii=False)}"
    )

  if knowledge_base:
    formatted = _format_knowledge_entries(
      knowledge_base,
      "Base oficial do SAF (componentes e fluxos mapeados)",
      limit=8,
    )
    if formatted:
      sections.append(formatted)

  return "\n\n".join(sections)


def call_openai(system_prompt: str, user_question: str, user_documents: Optional[str] = None) -> str:
  """Envia a pergunta do usuario para o modelo configurado."""
  model = os.environ.get(MODEL_ENV, "gpt-4.1")
  api_key = os.environ.get(OPENAI_API_KEY_ENV)

  if not api_key:
    raise RuntimeError("OPENAI_API_KEY nao configurada.")

  try:
    temperature = float(os.environ.get(TEMPERATURE_ENV, "0.2"))
  except ValueError:
    logging.warning("CHAT_IA_TEMPERATURE invalido. Usando 0.2.")
    temperature = 0.2

  messages = [
    {"role": "system", "content": system_prompt},
  ]

  if user_documents:
    messages.append({"role": "system", "content": user_documents})

  messages.append({"role": "user", "content": user_question})

  base_url = os.environ.get(OPENAI_BASE_URL_ENV, "https://api.openai.com/v1")
  payload = {
    "model": model,
    "messages": messages,
    "temperature": temperature,
  }

  # Usa httpx direto para evitar issues de compatibilidade do SDK dentro do worker
  with httpx.Client(base_url=base_url, timeout=30.0) as client:
    resp = client.post(
      "/chat/completions",
      headers={
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
      },
      json=payload,
    )
    resp.raise_for_status()
    response = resp.json()

  logging.info("Resposta da IA gerada com sucesso.")
  return response["choices"][0]["message"]["content"]


def main(req: func.HttpRequest) -> func.HttpResponse:
  logging.info("Requisicao HTTP recebida para o endpoint de Chat IA.")

  try:
    req_body = req.get_json()
  except ValueError:
    return _json_response({"error": "JSON invalido", "message": "Envie um corpo JSON valido."}, 400)

  user_question = req_body.get("question")

  if not isinstance(user_question, str) or not user_question.strip():
    return _json_response(
      {"error": "Campo invalido", "message": "Informe o campo 'question' com uma string nao vazia."},
      400,
    )

  sanitized_question = user_question.strip()

  dashboard_data = get_dashboard_data()
  site_context = get_site_context()
  default_knowledge = get_default_knowledge()
  system_prompt = build_system_prompt(dashboard_data, site_context, default_knowledge)

  user_documents_text = None
  request_knowledge = req_body.get("knowledge")
  if isinstance(request_knowledge, list):
    sanitized_entries: List[Dict[str, Any]] = []
    for entry in request_knowledge[:8]:
      if not isinstance(entry, dict):
        continue
      title = str(entry.get("title") or entry.get("name") or "").strip()
      summary = str(entry.get("summary") or entry.get("content") or "").strip()
      if not title or not summary:
        continue
      sanitized_entries.append(
        {
          "title": title,
          "category": str(entry.get("category") or "documento").strip(),
          "content": summary,
        }
      )

    if sanitized_entries:
      formatted = _format_knowledge_entries(
        sanitized_entries,
        "Documentos anexados pelo operador",
        limit=len(sanitized_entries),
        char_limit=300,
      )
      if formatted:
        user_documents_text = formatted

  try:
    ia_response = call_openai(system_prompt, sanitized_question, user_documents_text)
    return _json_response({"response": ia_response}, 200)
  except Exception as error:  # pylint: disable=broad-except
    logging.error(f"Erro ao chamar a API do OpenAI: {error}", exc_info=True)
    return _json_response(
      {"error": "Erro interno ao processar a IA", "details": str(error)},
      500,
    )
