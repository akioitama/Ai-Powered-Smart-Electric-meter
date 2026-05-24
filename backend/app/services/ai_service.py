"""AI scoring service — Isolation Forest based theft / anomaly detection.

If a trained model file is missing, falls back to a small synthetic-fit model
so the system is always live. Re-train via `python -m app.ml.train`.
"""

from __future__ import annotations

import logging
from collections import defaultdict, deque
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from sklearn.ensemble import IsolationForest

log = logging.getLogger("aimeter.ai")

MODEL_PATH = Path(__file__).resolve().parent.parent / "ml" / "isolation_forest.pkl"
WINDOW_SIZE = 60  # last N readings per meter
ANOMALY_THRESHOLD = -0.05  # IsolationForest: lower scores → more anomalous


class AIService:
    def __init__(self) -> None:
        self.model: Any = None
        self.windows: dict[int, deque] = defaultdict(lambda: deque(maxlen=WINDOW_SIZE))
        self._lock = Lock()
        self._disabled = False

    async def load(self) -> None:
        if self.model is not None or self._disabled:
            return
        try:
            import joblib  # noqa: WPS433
        except ImportError:
            log.warning("scikit-learn / joblib not installed — AI scoring disabled.")
            self._disabled = True
            return

        if MODEL_PATH.exists():
            try:
                self.model = joblib.load(MODEL_PATH)
                log.info("Loaded Isolation Forest model from %s", MODEL_PATH)
                return
            except Exception as e:  # noqa: BLE001
                log.warning("Could not load existing model (%s) — training fallback.", e)
        self._train_fallback()

    def _train_fallback(self) -> None:
        try:
            import joblib  # noqa: WPS433
            import numpy as np  # noqa: WPS433
            from sklearn.ensemble import IsolationForest  # noqa: WPS433
        except ImportError:
            log.warning("ML deps missing — AI scoring disabled.")
            self._disabled = True
            return

        rng = np.random.default_rng(42)
        n = 4000
        voltage = rng.normal(220, 4, n)
        hour = rng.integers(0, 24, n)
        base_current = 1.0 + 0.4 * np.sin((hour - 6) / 24 * 2 * np.pi) + rng.normal(0, 0.15, n)
        current = np.clip(base_current, 0.05, None)
        power = voltage * current
        weekday = rng.integers(0, 7, n)
        X = np.column_stack([voltage, current, power, hour, weekday])
        model = IsolationForest(
            n_estimators=150,
            contamination=0.03,
            random_state=42,
            n_jobs=-1,
        )
        model.fit(X)
        self.model = model
        log.info("Trained synthetic-fit Isolation Forest fallback (n=%d).", n)
        try:
            MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
            joblib.dump(model, MODEL_PATH)
        except Exception:  # noqa: BLE001
            pass

    async def score(
        self,
        meter_id: int,
        voltage: float,
        current: float,
        power: float,
    ) -> tuple[float, bool]:
        if self.model is None and not self._disabled:
            await self.load()
        if self._disabled or self.model is None:
            return 0.0, False

        import numpy as np  # noqa: WPS433

        now = datetime.now(timezone.utc)
        x = np.array([[voltage, current, power, now.hour, now.weekday()]], dtype=float)

        with self._lock:
            self.windows[meter_id].append((voltage, current, power))
            try:
                score = float(self.model.score_samples(x)[0])
            except Exception as e:  # noqa: BLE001
                log.warning("AI score failed: %s", e)
                return 0.0, False

        is_anomaly = score < ANOMALY_THRESHOLD and current > 0.05
        return score, is_anomaly


ai_service = AIService()
