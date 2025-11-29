"""Apply idempotent database tuning: indexes, constraints, and basic cleanup."""
from __future__ import annotations

import sys
from pathlib import Path

from sqlalchemy import text

PROJECT_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(PROJECT_ROOT))

from api.shared.db import engine  # noqa: E402


INDEX_STATEMENTS = [
    "CREATE INDEX IF NOT EXISTS idx_users_school_id ON users (school_id);",
    "CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users ((lower(email)));",
    "CREATE INDEX IF NOT EXISTS idx_users_has_canva ON users (has_canva);",
    "CREATE INDEX IF NOT EXISTS idx_school_limits_school_id ON school_limits (school_id);",
    "CREATE INDEX IF NOT EXISTS idx_audit_logs_school_id_ts ON audit_logs (school_id, ts DESC);",
]


CONSTRAINT_STATEMENTS = [
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'ck_schools_license_limit_nonnegative'
        ) THEN
            ALTER TABLE schools ADD CONSTRAINT ck_schools_license_limit_nonnegative CHECK (license_limit >= 0);
        END IF;
    END$$;
    """,
    """
    DO $$
    BEGIN
        IF NOT EXISTS (
            SELECT 1 FROM pg_constraint WHERE conname = 'ck_school_limits_limit_nonnegative'
        ) THEN
            ALTER TABLE school_limits ADD CONSTRAINT ck_school_limits_limit_nonnegative CHECK ("limit" >= 0);
        END IF;
    END$$;
    """,
]


DATA_CLEANUP = [
    "UPDATE users SET email = lower(trim(email)) WHERE email IS NOT NULL;",
    "UPDATE schools SET license_limit = COALESCE(license_limit, 0);",
    'UPDATE school_limits SET "limit" = COALESCE("limit", 0);',
]


COLUMN_DEFAULTS = [
    "ALTER TABLE schools ALTER COLUMN license_limit SET DEFAULT 0;",
    'ALTER TABLE school_limits ALTER COLUMN "limit" SET DEFAULT 0;',
    "ALTER TABLE schools ALTER COLUMN license_limit SET NOT NULL;",
    'ALTER TABLE school_limits ALTER COLUMN "limit" SET NOT NULL;',
]


def apply_statements(conn, statements):
    for stmt in statements:
        conn.execute(text(stmt))


def main():
    with engine.begin() as conn:
        apply_statements(conn, DATA_CLEANUP)
        apply_statements(conn, COLUMN_DEFAULTS)
        apply_statements(conn, CONSTRAINT_STATEMENTS)
        apply_statements(conn, INDEX_STATEMENTS)

    print("Database tuning applied: indexes, constraints, and defaults enforced.")


if __name__ == "__main__":
    main()
