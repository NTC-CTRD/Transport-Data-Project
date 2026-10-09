"""Add corridor coordinates

Revision ID: de46b7c90621
Revises: 15a46a01de35
Create Date: 2026-08-24 10:02:12.567478

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'de46b7c90621'
down_revision: Union[str, Sequence[str], None] = '15a46a01de35'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        'corridors',
        sa.Column('origin_latitude', sa.Float(), nullable=True)
    )

    op.add_column(
        'corridors',
        sa.Column('origin_longitude', sa.Float(), nullable=True)
    )

    op.add_column(
        'corridors',
        sa.Column('destination_latitude', sa.Float(), nullable=True)
    )

    op.add_column(
        'corridors',
        sa.Column('destination_longitude', sa.Float(), nullable=True)
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column('corridors', 'destination_longitude')
    op.drop_column('corridors', 'destination_latitude')
    op.drop_column('corridors', 'origin_longitude')
    op.drop_column('corridors', 'origin_latitude')