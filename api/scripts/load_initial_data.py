import os
import unicodedata
from datetime import datetime
from pathlib import Path

import pandas as pd
from sqlalchemy import (
    Boolean,
    Column,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.orm import declarative_base, sessionmaker, relationship

# --------------------------------------------------------------------
# CONFIGURAÇÃO DE BANCO
# --------------------------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL não encontrada nas variáveis de ambiente.")

engine = create_engine(DATABASE_URL, future=True, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
Base = declarative_base()

# --------------------------------------------------------------------
# MODELOS (tabelas)
# --------------------------------------------------------------------


class School(Base):
    __tablename__ = "schools"

    # ID como texto, para casar com o tipo já existente no Postgres
    id = Column(String(50), primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    city = Column(String(255))
    state = Column(String(2))
    region = Column(String(50))
    cluster = Column(String(50))
    carteira_saf = Column(String(100))
    license_limit = Column(Integer)
    status = Column(String(50))
    contact_email = Column(String(255))
    contact_phone = Column(String(50))
    address = Column(Text)
    neighborhood = Column(String(255))

    users = relationship("User", back_populates="school")


class User(Base):
    __tablename__ = "users"

    # ID também como texto (varchar) para bater com a tabela existente
    id = Column(String(50), primary_key=True, index=True)
    school_id = Column(String(50), ForeignKey("schools.id"), nullable=False)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255))
    has_canva = Column(Boolean, default=False)
    is_compliant = Column(Boolean, default=False)

    school = relationship("School", back_populates="users")


# --------------------------------------------------------------------
# FUNÇÕES DE CARGA
# --------------------------------------------------------------------


def init_db():
    print(">> Criando tabelas (se não existirem)...")
    Base.metadata.create_all(bind=engine)


def load_schools():
    print(">> Carregando escolas do Excel...")

    path = "local_data/Franchising_oficial.xlsx"

    df = pd.read_excel(path)

    ID_COL = "ID da Escola"
    NAME_COL = "Nome da Escola"

    if ID_COL not in df.columns or NAME_COL not in df.columns:
        raise ValueError(
            f"O arquivo precisa ter as colunas '{ID_COL}' e '{NAME_COL}'. "
            f"Colunas encontradas: {list(df.columns)}"
        )

    session = SessionLocal()
    imported = 0

    try:
        for _, row in df.iterrows():
            if pd.isna(row[ID_COL]):
                continue

            school = School(
                id=str(row[ID_COL]),  # sempre texto
                name=str(row[NAME_COL]),
                city=row.get("Cidade da Escola"),
                state=row.get("Estado da Escola"),
                region=row.get("Tipo de Escola"),
                cluster=row.get("Franquia"),
                carteira_saf=row.get("Carteira SAF"),
                license_limit=2,  # limite padrão
                status=row.get("Status da Escola"),
                contact_email=None,
                contact_phone=None,
                address=row.get("Logradouro Escola"),
                neighborhood=row.get("Bairro Escola"),
            )

            session.merge(school)
            imported += 1

        session.commit()
        print(f">> Escolas carregadas: {imported}")
    finally:
        session.close()


def load_users():
    print(">> Carregando usuarios do CSV de licencas...")

    # Preferir a fonte mais completa (usuarios_public.csv); cair para licencas_canva.csv se faltar.
    candidate_paths = [
        "local_data/usuarios_public.csv",
        "local_data/licencas_canva.csv",
    ]
    path = next((p for p in candidate_paths if Path(p).exists()), None)

    if not path:
        print(">> Nenhum arquivo de licencas encontrado em local_data/. Pulando carga de usuarios.")
        return

    print(f">> Usando fonte de licencas: {path}")

    # Leitura simples, tolerando aspas extras e linhas vazias.
    lines = Path(path).read_text(encoding='latin-1', errors='ignore').splitlines()
    lines = [line.strip().replace('"', '') for line in lines if line.strip()]

    if len(lines) <= 1:
        print(">> Arquivo de licencas esta vazio ou so com cabecalho. Pulando.")
        return

    header = [c.strip() for c in lines[0].split(';')]

    def normalize(label: str) -> str:
        base = (
            unicodedata.normalize("NFKD", str(label))
            .encode("ascii", "ignore")
            .decode("ascii")
        )
        return base.strip().lower()

    def find_index(candidates):
        for i, col in enumerate(header):
            norm = normalize(col)
            if any(norm.startswith(candidate) or candidate in norm for candidate in candidates):
                return i
        return -1

    idx_email = find_index(["e-mail", "email"])
    idx_school = find_index(["escola id", "id da escola", "id"])
    idx_name = find_index(["nome"])
    idx_status = find_index(["status licenca", "status"])

    if idx_email == -1 or idx_school == -1:
        print(f">> Cabecalho nao contem colunas obrigatorias de E-mail e Escola ID. Colunas: {header}. Pulando.")
        return

    def is_email_compliant(email: str) -> bool:
        normalized = (email or '').strip().lower()
        if '@' not in normalized:
            return False
        local_part, _, domain = normalized.partition('@')
        domain_keywords = ['maplebear', 'mbcentral', 'sebsa', 'seb']
        if any(kw in domain for kw in domain_keywords):
            return True
        if domain.startswith('mb') and len(domain) > 2:
            return True
        if local_part.startswith('mb') and len(local_part) > 2:
            return True
        return False

    session = SessionLocal()
    imported = 0
    user_id = 1  # ID sequencial para preencher a PK

    try:
        for line in lines[1:]:
            parts = [p.strip() for p in line.split(';')]
            if len(parts) <= max(idx_email, idx_school):
                continue

            email = parts[idx_email]
            school_id = parts[idx_school]
            if not email or not school_id:
                continue

            name = parts[idx_name] if idx_name != -1 and idx_name < len(parts) else None
            status = parts[idx_status] if idx_status != -1 and idx_status < len(parts) else ''

            has_canva = True  # se esta no CSV, tem Canva
            status_lower = (status or '').lower()
            status_compliant = any(
                word in status_lower for word in ['dentro', 'conforme', 'ok', 'regular']
            )

            user = User(
                id=str(user_id),          # ID como texto
                email=email,
                name=name,
                school_id=str(school_id),
                has_canva=has_canva,
                is_compliant=status_compliant or is_email_compliant(email),
            )
            session.merge(user)
            imported += 1
            user_id += 1

        session.commit()
        print(f">> Usuarios carregados: {imported}")
    finally:
        session.close()

# --------------------------------------------------------------------
# EXECUÇÃO
# --------------------------------------------------------------------

if __name__ == "__main__":
    print("========================================")
    print(" Carga inicial de dados no Neon (Postgres)")
    print("========================================")
    init_db()
    load_schools()
    load_users()
    print(">> Concluído com sucesso.")
