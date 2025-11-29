"""Load initial schools and users data into PostgreSQL from local files.

Uses:
- api/local_data/Franchising_oficial.xlsx
- api/local_data/usuarios_public.csv

The script expects DATABASE_URL to point to a PostgreSQL instance.
"""
from __future__ import annotations

import sys
import unicodedata
from pathlib import Path
from typing import Dict

import pandas as pd
from sqlalchemy import select

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(PROJECT_ROOT))

from api.shared.db import SessionLocal, engine  # noqa: E402
from api.shared.db_models import Base, School, User  # noqa: E402
from api.shared.model import (  # noqa: E402
    EmailComplianceHelper,
    StatusLicencaHelper,
)

SCHOOLS_FILE = PROJECT_ROOT / "api" / "local_data" / "Franchising_oficial.xlsx"
USERS_FILE = PROJECT_ROOT / "api" / "local_data" / "usuarios_public.csv"
DEFAULT_LICENSE_LIMIT = 2


def normalize_column(name: str) -> str:
    normalized = (
        unicodedata.normalize("NFKD", str(name))
        .encode("ascii", "ignore")
        .decode("ascii")
    )
    normalized = normalized.replace("-", " ")
    return " ".join(normalized.lower().split())


def to_str(value) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and value != value:
        return ""
    try:
        if isinstance(value, float) and value.is_integer():
            return str(int(value))
    except Exception:
        pass
    return str(value).strip()


def load_schools(session) -> int:
    if not SCHOOLS_FILE.exists():
        print(f"Schools file not found: {SCHOOLS_FILE}")
        return 0

    df = pd.read_excel(SCHOOLS_FILE)
    df = df.rename(columns={col: normalize_column(col) for col in df.columns})

    column_map: Dict[str, str] = {
        "id da escola": "id",
        "nome da escola": "name",
        "status da escola": "status",
        "cluster": "cluster",
        "carteira saf": "carteira_saf",
        "logradouro escola": "address",
        "bairro escola": "neighborhood",
        "cidade da escola": "city",
        "estado da escola": "state",
        "regiao da escola": "region",
        "telefone de contato da escola": "contact_phone",
        "e mail da escola": "contact_email",
    }

    created_or_updated = 0
    for row in df.to_dict(orient="records"):
        raw_id = to_str(row.get("id da escola"))
        if not raw_id:
            continue

        school = session.get(School, raw_id) or School(id=raw_id)
        for source_key, target_key in column_map.items():
            value = row.get(source_key)
            if value is None or (isinstance(value, float) and value != value):
                value = ""
            if target_key in {"contact_phone", "contact_email"}:
                setattr(school, target_key, to_str(value))
            else:
                setattr(school, target_key, value if isinstance(value, str) else to_str(value))

        if school.license_limit is None or school.license_limit == 0:
            school.license_limit = DEFAULT_LICENSE_LIMIT

        session.add(school)
        created_or_updated += 1

    print(f"Processed {created_or_updated} schools")
    return created_or_updated


def load_users(session) -> int:
    if not USERS_FILE.exists():
        print(f"Users file not found: {USERS_FILE}")
        return 0

    df = pd.read_csv(USERS_FILE, delimiter=";")
    df = df.rename(columns={col: normalize_column(col) for col in df.columns})

    created_or_updated = 0
    for row in df.to_dict(orient="records"):
        email = to_str(row.get("e mail")).lower()
        school_id = to_str(row.get("escola id"))
        name = to_str(row.get("nome"))
        status = to_str(row.get("status licenca"))

        if not email or not school_id:
            continue

        if not session.get(School, school_id):
            continue

        has_canva = StatusLicencaHelper.has_canva_license(status)
        is_compliant = EmailComplianceHelper.is_email_compliant(email)

        user = session.scalar(select(User).where(User.email == email))
        if not user:
            user = User(school_id=school_id, email=email)

        user.name = name or user.name or ""
        user.school_id = school_id
        user.has_canva = has_canva
        user.is_compliant = is_compliant

        session.add(user)
        created_or_updated += 1

    print(f"Processed {created_or_updated} users")
    return created_or_updated


def main():
    Base.metadata.create_all(bind=engine)

    with SessionLocal.begin() as session:
        schools_count = load_schools(session)
        users_count = load_users(session)

    print(
        f"Finished loading data: {schools_count} schools, {users_count} users into PostgreSQL."
    )


if __name__ == "__main__":
    main()
