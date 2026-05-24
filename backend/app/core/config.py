"""Centralized application settings (loaded from env)."""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", case_sensitive=False)

    APP_NAME: str = "AI Meter API"
    ENV: str = "dev"

    JWT_SECRET: str = "change-me-in-prod"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24

    # SQLite by default (zero-setup local dev). Switch to Postgres in prod via .env.
    DATABASE_URL: str = "sqlite+aiosqlite:///./aimeter.db"

    # When empty/None the backend uses an in-process pub/sub (no Redis required).
    REDIS_URL: str | None = None

    # If False, the FastAPI process will not start MQTT-related code.
    MQTT_ENABLED: bool = False
    MQTT_HOST: str = "localhost"
    MQTT_PORT: int = 1883
    MQTT_USERNAME: str | None = None
    MQTT_PASSWORD: str | None = None
    MQTT_TLS: bool = False

    AUTO_CREATE_TABLES: bool = True

    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    ADMIN_EMAIL: str = "admin@aimeter.com"
    ADMIN_PASSWORD: str = "admin1234"
    ADMIN_NAME: str = "System Admin"

    DEFAULT_LOW_V: float = 200.0
    DEFAULT_HIGH_V: float = 250.0

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
