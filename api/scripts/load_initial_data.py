import os
from datetime import datetime

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
    print(">> Carregando usuários do CSV de licenças...")

    # copie licencas_canva.csv para api/local_data/licencas_canva.csv
    path = "local_data/licencas_canva.csv"

    if not os.path.exists(path):
        print(">> Arquivo local_data/licencas_canva.csv não encontrado. Pulando carga de usuários.")
        return

    # Lê o arquivo “na mão” porque ele vem todo entre aspas
    with open(path, "r", encoding="utf-8") as f:
        lines = [line.strip() for line in f.readlines() if line.strip()]

    if len(lines) <= 1:
        print(">> Arquivo de licenças está vazio ou só com cabeçalho. Pulando.")
        return

    # Cabeçalho: "Nome;E-mail;Função;Escola;Escola ID;Status Licença;Atualizado em"
    header = lines[0].strip().strip('"')
    cols = [c.strip() for c in header.split(";")]

    EMAIL_COL = "E-mail"
    SCHOOL_COL = "Escola ID"
    NAME_COL = "Nome"
    STATUS_COL = "Status Licença"

    def col_index(name: str) -> int:
        try:
            return cols.index(name)
        except ValueError:
            return -1

    idx_email = col_index(EMAIL_COL)
    idx_school = col_index(SCHOOL_COL)
    idx_name = col_index(NAME_COL)
    idx_status = col_index(STATUS_COL)

    if idx_email == -1 or idx_school == -1:
        print(
            f">> Cabeçalho não contém as colunas obrigatórias '{EMAIL_COL}' e '{SCHOOL_COL}'. "
            f"Colunas encontradas: {cols}. Pulando."
        )
        return

    session = SessionLocal()
    imported = 0
    user_id = 1  # ID sequencial para preencher a PK

    try:
        for line in lines[1:]:
            # remove aspas externas e quebra por ';'
            row_text = line.strip().strip('"')
            parts = [p.strip() for p in row_text.split(";")]

            if len(parts) <= max(idx_email, idx_school):
                continue

            email = parts[idx_email]
            school_id = parts[idx_school]

            if not email or not school_id:
                continue

            name = parts[idx_name] if idx_name != -1 and idx_name < len(parts) else None
            status = parts[idx_status] if idx_status != -1 and idx_status < len(parts) else ""

            has_canva = True  # se está no CSV, tem canva
            status_lower = (status or "").lower()
            is_compliant = any(
                word in status_lower for word in ["dentro", "conforme", "ok", "regular"]
            )

            user = User(
                id=str(user_id),          # ID como texto
                email=email,
                name=name,
                school_id=str(school_id),
                has_canva=has_canva,
                is_compliant=is_compliant,
            )
            session.merge(user)
            imported += 1
            user_id += 1

        session.commit()
        print(f">> Usuários carregados: {imported}")
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
