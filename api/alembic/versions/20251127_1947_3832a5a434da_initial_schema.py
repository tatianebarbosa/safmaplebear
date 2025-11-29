"""initial_schema

Revision ID: 3832a5a434da
Revises: 
Create Date: 2025-11-27 19:47:16.447751+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '3832a5a434da'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'schools',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('city', sa.String(), nullable=True, server_default=''),
        sa.Column('state', sa.String(), nullable=True, server_default=''),
        sa.Column('region', sa.String(), nullable=True, server_default=''),
        sa.Column('cluster', sa.String(), nullable=True, server_default=''),
        sa.Column('carteira_saf', sa.String(), nullable=True, server_default=''),
        sa.Column('license_limit', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('status', sa.String(), nullable=True, server_default=''),
        sa.Column('contact_email', sa.String(), nullable=True, server_default=''),
        sa.Column('contact_phone', sa.String(), nullable=True, server_default=''),
        sa.Column('address', sa.String(), nullable=True, server_default=''),
        sa.Column('neighborhood', sa.String(), nullable=True, server_default=''),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_schools')),
        sa.CheckConstraint('license_limit >= 0', name=op.f('ck_schools_license_limit_nonnegative')),
    )

    op.create_table(
        'users',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('school_id', sa.String(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=True, server_default=''),
        sa.Column('has_canva', sa.Boolean(), nullable=True, server_default=sa.text('false')),
        sa.Column('is_compliant', sa.Boolean(), nullable=True, server_default=sa.text('true')),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], name=op.f('fk_users_school_id_schools'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_users')),
        sa.UniqueConstraint('email', name=op.f('uq_users_email'))
    )

    op.create_table(
        'school_limits',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('school_id', sa.String(), nullable=False),
        sa.Column('limit', sa.Integer(), nullable=False, server_default=sa.text('0')),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], name=op.f('fk_school_limits_school_id_schools'), ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_school_limits')),
        sa.CheckConstraint('"limit" >= 0', name=op.f('ck_school_limits_limit_nonnegative')),
    )

    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('school_id', sa.String(), nullable=True),
        sa.Column('actor', sa.String(), nullable=False),
        sa.Column('payload', postgresql.JSONB(astext_type=sa.Text()), nullable=True, server_default=sa.text("'{}'::jsonb")),
        sa.Column('ts', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], name=op.f('fk_audit_logs_school_id_schools'), ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name=op.f('pk_audit_logs')),
    )

    op.create_index('uq_users_email_lower', 'users', [sa.text('lower(email)')], unique=True)
    op.create_index('idx_users_school_id', 'users', ['school_id'])
    op.create_index('idx_users_has_canva', 'users', ['has_canva'])
    op.create_index('idx_school_limits_school_id', 'school_limits', ['school_id'])
    op.create_index('idx_audit_logs_school_id_ts', 'audit_logs', ['school_id', sa.text('ts DESC')])


def downgrade() -> None:
    op.drop_index('idx_audit_logs_school_id_ts', table_name='audit_logs')
    op.drop_index('idx_school_limits_school_id', table_name='school_limits')
    op.drop_index('idx_users_has_canva', table_name='users')
    op.drop_index('idx_users_school_id', table_name='users')
    op.drop_index('uq_users_email_lower', table_name='users')
    op.drop_table('audit_logs')
    op.drop_table('school_limits')
    op.drop_table('users')
    op.drop_table('schools')
