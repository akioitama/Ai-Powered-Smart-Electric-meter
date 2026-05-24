"""FastAPI entrypoint."""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import api_router
from app.core.config import settings
from app.services.bootstrap import bootstrap_admin
from app.services.mqtt_client import mqtt_service
from app.services.ws_manager import ws_manager

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
log = logging.getLogger("aimeter")


@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Booting %s (%s)", settings.APP_NAME, settings.ENV)
    await bootstrap_admin()
    await ws_manager.start()
    if settings.MQTT_ENABLED:
        await mqtt_service.start_publisher()
    else:
        log.info("MQTT disabled — running in HTTP-only mode.")
    log.info("Boot complete.")
    try:
        yield
    finally:
        log.info("Shutting down...")
        if settings.MQTT_ENABLED:
            await mqtt_service.stop_publisher()
        await ws_manager.stop()


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/", tags=["meta"])
async def root():
    return {"app": settings.APP_NAME, "status": "ok", "env": settings.ENV}


@app.get("/health", tags=["meta"])
async def health():
    return {"status": "healthy"}


app.include_router(api_router, prefix="/api/v1")
