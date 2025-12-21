"""add_justifications_table

Revision ID: 00f5dc789b4e
Revises: 3832a5a434da
Create Date: 2025-12-21 20:08:46.520917+00:00

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '00f5dc789b4e'
down_revision: Union[str, None] = '3832a5a434da'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create justifications table
    op.create_table(
        'justifications',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('school_id', sa.String(), nullable=False),
        sa.Column('school_name', sa.String(), nullable=False),
        sa.Column('old_user_name', sa.String(), nullable=False),
        sa.Column('old_user_email', sa.String(), nullable=False),
        sa.Column('old_user_role', sa.String(), nullable=False),
        sa.Column('new_user_name', sa.String(), nullable=False),
        sa.Column('new_user_email', sa.String(), nullable=False),
        sa.Column('new_user_role', sa.String(), nullable=False),
        sa.Column('reason', sa.String(), nullable=False),
        sa.Column('performed_by', sa.String(), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.ForeignKeyConstraint(['school_id'], ['schools.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_justifications_school_id', 'justifications', ['school_id'])
    op.create_index('idx_justifications_timestamp', 'justifications', ['timestamp'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_justifications_timestamp', table_name='justifications')
    op.drop_index('idx_justifications_school_id', table_name='justifications')
    
    # Drop table
    op.drop_table('justifications')
