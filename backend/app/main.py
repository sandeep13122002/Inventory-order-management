"""FastAPI application entrypoint."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routers import customers, dashboard, orders, products
from app.seed import seed_if_empty

logger = logging.getLogger("uvicorn.error")
settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup. For a larger system, swap this for Alembic
    # migrations; auto-create keeps the assessment self-contained.
    Base.metadata.create_all(bind=engine)
    if settings.seed_on_startup:
        with SessionLocal() as db:
            try:
                seed_if_empty(db)
            except Exception as exc:  # pragma: no cover - best effort seeding
                logger.warning("Seeding skipped: %s", exc)
    yield


app = FastAPI(
    title="Inventory & Order Management API",
    description="Manage products, customers, orders and inventory.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)


@app.get("/", tags=["health"])
def root():
    return {"service": "inventory-order-management", "status": "ok", "docs": "/docs"}


@app.get("/health", tags=["health"])
def health():
    """Liveness + DB connectivity probe used by Docker/Render healthchecks."""
    db_ok = True
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        db_ok = False
    return {"status": "ok", "database": "up" if db_ok else "down"}
