"""Rename password column

Revision ID: cb94ffcc3f48
Revises: fef45b518dad
"""

from typing import Sequence, Union

from alembic import op

revision: str = "cb94ffcc3f48"
down_revision: Union[str, Sequence[str], None] = "fef45b518dad"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "users",
        "password",
        new_column_name="hashed_password"
    )


def downgrade() -> None:
    op.alter_column(
        "users",
        "hashed_password",
        new_column_name="password"
    )