import os
import unicodedata
from pathlib import Path
from typing import Dict, List


def _normalize(text: str) -> str:
    """Remove acentos e normaliza para comparacoes simples."""
    if not text:
        return ""
    nfkd = unicodedata.normalize("NFKD", text)
    return "".join(c for c in nfkd if not unicodedata.combining(c)).lower().strip()


def _find_data_file(filename: str) -> Path:
    """Procura o arquivo primeiro em public/data e depois em api/local_data."""
    base = Path(__file__).parent.parent.parent
    candidates = [
        base / "public" / "data" / filename,
        base / "api" / "local_data" / filename,
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise FileNotFoundError(f"Arquivo nao encontrado: {filename}")


def _load_csv_lines(filename: str) -> List[str]:
    path = _find_data_file(filename)
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except UnicodeDecodeError:
        text = path.read_text(encoding="latin-1", errors="ignore")
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    return lines


def load_franchising_schools() -> List[Dict]:
    """Carrega escolas do CSV de franchising, ignorando linhas sem ID."""
    lines = _load_csv_lines("Franchising.csv")
    if not lines:
        return []

    header = lines[0].split(";")
    normalized_header = [_normalize(col) for col in header]

    def _get(row: List[str], label: str) -> str:
        norm = _normalize(label)
        if norm in normalized_header:
            idx = normalized_header.index(norm)
            return row[idx].strip() if idx < len(row) else ""
        return ""

    schools: List[Dict] = []
    seen_ids = set()

    for raw in lines[1:]:
        cells = raw.split(";")
        school_id = _get(cells, "id da escola") or _get(cells, "id")
        if not school_id or not school_id.strip().isdigit():
            continue
        if school_id in seen_ids:
            continue
        seen_ids.add(school_id)

        name = _get(cells, "nome da escola") or _get(cells, "nome")
        status = _get(cells, "status da escola") or _get(cells, "status")
        cluster = _get(cells, "cluster")
        city = _get(cells, "cidade da escola") or _get(cells, "cidade")
        state = _get(cells, "estado da escola") or _get(cells, "estado")

        schools.append(
            {
                "id": school_id,
                "name": name,
                "status": status,
                "cluster": cluster,
                "city": city,
                "state": state,
            }
        )

    return schools


def load_license_users() -> List[Dict]:
    """Le o arquivo de licencas (preferindo usuarios_public.csv) replicando a logica do front."""
    lines: List[str] = []
    source = None
    for filename in ("usuarios_public.csv", "licencas_canva.csv"):
        try:
            lines = _load_csv_lines(filename)
            source = filename
            break
        except FileNotFoundError:
            continue

    if len(lines) <= 1:
        return []

    users: List[Dict] = []
    for raw in lines[1:]:
        cells = [c.strip() for c in raw.replace('"', "").split(";")]
        name_cell = cells[0].lower() if cells else ""
        email_cell = cells[1].lower() if len(cells) > 1 else ""
        if "nome" in name_cell and "e-mail" in email_cell:
            continue

        email = cells[1] if len(cells) > 1 else ""
        if not email:
            continue

        user = {
            "name": cells[0] if len(cells) > 0 else "",
            "email": email,
            "role": cells[2] if len(cells) > 2 else "",
            "school_name": cells[3] if len(cells) > 3 else "",
            "school_id": cells[4] if len(cells) > 4 else "",
            "status": cells[5] if len(cells) > 5 else "",
            "source": source or "",
        }
        users.append(user)

    return users


def is_email_compliant(email: str) -> bool:
    """Regras iguais as usadas no front (safDataService)."""
    normalized = (email or "").strip().lower()
    if "@" not in normalized:
        return False
    local_part, _, domain = normalized.partition("@")

    domain_keywords = ["maplebear", "mbcentral", "sebsa", "seb"]
    if any(kw in domain for kw in domain_keywords):
        return True

    if domain.startswith("mb") and len(domain) > 2:
        return True

    if local_part.startswith("mb") and len(local_part) > 2:
        return True

    return False


def compute_overview(license_limit: int = None) -> Dict:
    """
    Calcula os indicadores de licencas a partir dos CSVs locais.
    - total de escolas
    - licencas utilizadas/total
    - escolas em excesso
    - usuarios nao conformes e dominios externos
    """
    schools_raw = load_franchising_schools()
    users = load_license_users()

    schools_map: Dict[str, Dict] = {}
    for school in schools_raw:
        key = school.get("id") or _normalize(school.get("name", ""))
        if not key:
            continue
        schools_map[key] = school
    schools = list(schools_map.values())

    limit = int(license_limit or os.environ.get("MAX_LICENSES_PER_SCHOOL") or 2)
    total_schools = len(schools)
    total_licenses = total_schools * limit
    licencas_utilizadas = len(users)

    usage_by_school: Dict[str, int] = {}
    for user in users:
        key = user.get("school_id") or _normalize(user.get("school_name", "")) or "sem-escola"
        usage_by_school[key] = usage_by_school.get(key, 0) + 1

    escolas_com_licenca = sum(1 for k, v in usage_by_school.items() if k != "sem-escola" and v > 0)
    escolas_excesso = sum(1 for k, v in usage_by_school.items() if k != "sem-escola" and v > limit)

    non_compliant = [u for u in users if not is_email_compliant(u.get("email", ""))]
    dominio_contagem: Dict[str, int] = {}
    for user in non_compliant:
        domain = (user.get("email", "").split("@")[1] if "@" in user.get("email", "") else "").lower()
        if domain:
            dominio_contagem[domain] = dominio_contagem.get(domain, 0) + 1

    top_dominios = sorted(
        [{"domain": d, "count": c} for d, c in dominio_contagem.items()],
        key=lambda item: item["count"],
        reverse=True,
    )

    ocupacao = 0.0
    if total_licenses > 0:
        ocupacao = (licencas_utilizadas / total_licenses) * 100

    source_file = users[0].get("source", "") if users else ""

    return {
        "totalEscolas": total_schools,
        "escolasComLicenca": escolas_com_licenca,
        "licencasUtilizadas": licencas_utilizadas,
        "licencasTotais": total_licenses,
        "ocupacaoPercentual": round(ocupacao, 1),
        "escolasEmExcesso": escolas_excesso,
        "usuariosNaoConformes": len(non_compliant),
        "dominiosNaoMapleBear": sum(dominio_contagem.values()),
        "dominiosNaoMapleBearTop": top_dominios[:10],
        "fonte": f"public/data/Franchising.csv e public/data/{source_file or 'usuarios_public.csv'}",
    }


def build_school_breakdown(license_limit: int = None) -> List[Dict]:
    """Retorna uso por escola para dashboards (opcional)."""
    limit = int(license_limit or os.environ.get("MAX_LICENSES_PER_SCHOOL") or 2)
    schools_raw = load_franchising_schools()
    users = load_license_users()

    usage_by_school: Dict[str, Dict] = {}
    for school in schools_raw:
        key = school.get("id") or _normalize(school.get("name", ""))
        if not key:
            continue
        usage_by_school[key] = {
            "schoolId": school.get("id") or key,
            "name": school.get("name"),
            "usedLicenses": 0,
            "limit": limit,
        }

    for user in users:
        key = user.get("school_id") or _normalize(user.get("school_name", ""))
        if key in usage_by_school:
            usage_by_school[key]["usedLicenses"] += 1

    breakdown = []
    for data in usage_by_school.values():
        status = "available"
        if data["usedLicenses"] > data["limit"]:
            status = "excess"
        elif data["usedLicenses"] == data["limit"]:
            status = "full"
        elif data["usedLicenses"] >= data["limit"] * 0.8:
            status = "warning"

        breakdown.append({**data, "status": status})

    breakdown.sort(key=lambda item: item["usedLicenses"], reverse=True)
    return breakdown
