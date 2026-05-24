"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-24 09:00:00

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column(
            "role",
            sa.Enum("admin", "consumer", "technician", name="user_role"),
            nullable=False,
            server_default="consumer",
        ),
        sa.Column("is_active", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_table(
        "meters",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("meter_uid", sa.String(64), unique=True, nullable=False, index=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column(
            "owner_user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
        sa.Column("access_token_hash", sa.String(255), nullable=False),
        sa.Column("low_v_threshold", sa.Float, nullable=False, server_default="200"),
        sa.Column("high_v_threshold", sa.Float, nullable=False, server_default="250"),
        sa.Column("relay_state", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("online", sa.Boolean, nullable=False, server_default=sa.false()),
        sa.Column("firmware_version", sa.String(40), nullable=True),
        sa.Column("last_seen", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )

    op.create_table(
        "readings",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "meter_id",
            sa.Integer,
            sa.ForeignKey("meters.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "ts",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
            index=True,
        ),
        sa.Column("voltage", sa.Float, nullable=False),
        sa.Column("current", sa.Float, nullable=False),
        sa.Column("power", sa.Float, nullable=False),
        sa.Column("energy_kwh", sa.Float, nullable=False, server_default="0"),
        sa.Column("frequency", sa.Float, nullable=True),
        sa.Column("power_factor", sa.Float, nullable=True),
        sa.Column("anomaly_score", sa.Float, nullable=True),
        sa.Column("is_anomaly", sa.Integer, nullable=False, server_default="0"),
    )
    op.create_index("ix_readings_meter_ts", "readings", ["meter_id", "ts"])

    op.create_table(
        "alerts",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "meter_id",
            sa.Integer,
            sa.ForeignKey("meters.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "ts",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
            index=True,
        ),
        sa.Column(
            "type",
            sa.Enum(
                "voltage_high",
                "voltage_low",
                "theft",
                "relay_action",
                "offline",
                "other",
                name="alert_type",
            ),
            nullable=False,
        ),
        sa.Column(
            "severity",
            sa.Enum("info", "warning", "critical", name="alert_severity"),
            nullable=False,
            server_default="warning",
        ),
        sa.Column("value", sa.Float, nullable=True),
        sa.Column("message", sa.String(500), nullable=False),
        sa.Column(
            "acknowledged_by",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("acknowledged_at", sa.DateTime(timezone=True), nullable=True),
    )

    op.create_table(
        "relay_events",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "meter_id",
            sa.Integer,
            sa.ForeignKey("meters.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column(
            "ts",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
            index=True,
        ),
        sa.Column(
            "action",
            sa.Enum("on", "off", name="relay_action"),
            nullable=False,
        ),
        sa.Column(
            "source",
            sa.Enum("user", "admin", "ai_auto", "threshold_auto", "system", name="relay_source"),
            nullable=False,
            server_default="system",
        ),
        sa.Column(
            "requested_by_user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("success", sa.Boolean, nullable=False, server_default=sa.true()),
        sa.Column("note", sa.String(255), nullable=True),
    )

    op.create_table(
        "audit_logs",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "user_id",
            sa.Integer,
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
            index=True,
        ),
        sa.Column("action", sa.String(120), nullable=False, index=True),
        sa.Column("target", sa.String(120), nullable=True),
        sa.Column(
            "ts",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
            index=True,
        ),
        sa.Column("ip", sa.String(64), nullable=True),
        sa.Column("payload", sa.JSON, nullable=True),
    )

    op.create_table(
        "bills",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column(
            "meter_id",
            sa.Integer,
            sa.ForeignKey("meters.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        ),
        sa.Column("period_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("period_end", sa.DateTime(timezone=True), nullable=False),
        sa.Column("units", sa.Float, nullable=False, server_default="0"),
        sa.Column("amount", sa.Float, nullable=False, server_default="0"),
        sa.Column(
            "status",
            sa.Enum("pending", "paid", "overdue", name="bill_status"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            nullable=False,
            server_default=sa.func.now(),
        ),
    )


def downgrade() -> None:
    op.drop_table("bills")
    op.drop_table("audit_logs")
    op.drop_table("relay_events")
    op.drop_table("alerts")
    op.drop_index("ix_readings_meter_ts", table_name="readings")
    op.drop_table("readings")
    op.drop_table("meters")
    op.drop_table("users")
    op.execute("DROP TYPE IF EXISTS bill_status")
    op.execute("DROP TYPE IF EXISTS relay_source")
    op.execute("DROP TYPE IF EXISTS relay_action")
    op.execute("DROP TYPE IF EXISTS alert_severity")
    op.execute("DROP TYPE IF EXISTS alert_type")
    op.execute("DROP TYPE IF EXISTS user_role")
