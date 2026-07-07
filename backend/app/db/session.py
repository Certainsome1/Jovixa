from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy import inspect, text

from app.core.config import settings
from app.db.base import Base
from app.models import job, match, resume

engine_kwargs = {"pool_pre_ping": True}
if not settings.DATABASE_URL.startswith("sqlite"):
    engine_kwargs.update({"pool_size": 5, "max_overflow": 10})

engine = create_async_engine(settings.DATABASE_URL, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    autoflush=False,
)


async def init_database() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
        await connection.run_sync(add_missing_job_columns)


async def close_database() -> None:
    await engine.dispose()


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


def add_missing_job_columns(sync_connection) -> None:
    inspector = inspect(sync_connection)
    if not inspector.has_table("jobs"):
        return

    existing_columns = {column["name"] for column in inspector.get_columns("jobs")}
    if "is_applied" not in existing_columns:
        default_value = "0" if sync_connection.dialect.name == "sqlite" else "false"
        sync_connection.execute(
            text(f"ALTER TABLE jobs ADD COLUMN is_applied BOOLEAN NOT NULL DEFAULT {default_value}")
        )
    if "applied_at" not in existing_columns:
        sync_connection.execute(text("ALTER TABLE jobs ADD COLUMN applied_at DATETIME"))
