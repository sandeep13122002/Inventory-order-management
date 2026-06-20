"""Application configuration loaded from environment variables."""
from functools import lru_cache

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Runtime settings.

    Values are read from environment variables (or a local .env file when
    present). No secrets are hardcoded here.
    """

    # SQLAlchemy-compatible connection string, e.g.
    # postgresql+psycopg2://user:password@host:5432/dbname
    database_url: str = "postgresql+psycopg2://inventory:inventory@db:5432/inventory_db"

    # Comma-separated list of origins allowed to call the API from a browser.
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # Products with quantity at or below this value are reported as low stock.
    low_stock_threshold: int = 10

    # Seed sample data on startup when the database is empty.
    seed_on_startup: bool = True

    class Config:
        env_file = ".env"
        case_sensitive = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def sqlalchemy_url(self) -> str:
        """Normalize the connection string for SQLAlchemy + psycopg2.

        Managed providers (e.g. Render, Heroku) hand out URLs starting with
        ``postgres://``, which SQLAlchemy 2.x rejects. Convert those to the
        explicit ``postgresql+psycopg2://`` driver form.
        """
        url = self.database_url
        if url.startswith("postgres://"):
            url = "postgresql+psycopg2://" + url[len("postgres://"):]
        elif url.startswith("postgresql://") and "+psycopg2" not in url:
            url = "postgresql+psycopg2://" + url[len("postgresql://"):]
        return url


@lru_cache
def get_settings() -> Settings:
    return Settings()
