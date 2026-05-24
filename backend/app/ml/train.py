"""Train the Isolation Forest theft / anomaly detector.

Usage:
    python -m app.ml.train [--days 30] [--out app/ml/isolation_forest.pkl]

Pulls historical readings from the database and trains an Isolation Forest on
[voltage, current, power, hour_of_day, day_of_week]. Falls back to a synthetic
dataset when the DB has too few rows so the system always boots with a usable
model.
"""

from __future__ import annotations

import argparse
import asyncio
import logging
from datetime import datetime, timedelta, timezone
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import IsolationForest
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.reading import Reading

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
log = logging.getLogger("aimeter.ml.train")


def _features(rows: list[tuple[float, float, float, datetime]]) -> np.ndarray:
    feats = []
    for v, c, p, ts in rows:
        feats.append([v, c, p, ts.hour, ts.weekday()])
    return np.array(feats, dtype=float)


def _synthetic(n: int = 5000) -> np.ndarray:
    rng = np.random.default_rng(42)
    voltage = rng.normal(220, 5, n)
    hour = rng.integers(0, 24, n)
    base_current = 1.0 + 0.4 * np.sin((hour - 6) / 24 * 2 * np.pi) + rng.normal(0, 0.15, n)
    current = np.clip(base_current, 0.05, None)
    power = voltage * current
    weekday = rng.integers(0, 7, n)
    return np.column_stack([voltage, current, power, hour, weekday])


async def _load_from_db(days: int) -> np.ndarray:
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    async with AsyncSessionLocal() as db:
        res = await db.execute(
            select(
                Reading.voltage, Reading.current, Reading.power, Reading.ts
            ).where(Reading.ts >= cutoff)
        )
        rows = list(res.all())
    if len(rows) < 200:
        log.warning("Only %d historical readings — falling back to synthetic.", len(rows))
        return _synthetic()
    log.info("Training on %d real readings.", len(rows))
    return _features(rows)


async def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=30)
    parser.add_argument("--out", type=Path, default=Path(__file__).with_name("isolation_forest.pkl"))
    args = parser.parse_args()

    X = await _load_from_db(args.days)

    model = IsolationForest(
        n_estimators=200,
        contamination=0.03,
        random_state=42,
        n_jobs=-1,
    )
    model.fit(X)

    args.out.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(model, args.out)
    log.info("Saved Isolation Forest model to %s", args.out)


if __name__ == "__main__":
    asyncio.run(main())
