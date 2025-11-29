"""Database engine and session factory for PostgreSQL access."""
from sqlalchemy import MetaData, create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from .config import DATABASE_URL, config


convention = {
    "ix": "ix_%(table_name)s_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}


class Base(DeclarativeBase):
    """Base declarative class for SQLAlchemy models (with naming conventions)."""

    metadata = MetaData(naming_convention=convention)


# Engine and session configuration (with pooling and pre-ping to avoid stale connections)
engine = create_engine(
    DATABASE_URL,
    future=True,
    echo=config.DEBUG,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=1800,
)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    future=True,
)


def get_session():
    """Context-managed session helper."""
    return SessionLocal()
