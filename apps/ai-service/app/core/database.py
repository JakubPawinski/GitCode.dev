from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)


DATABASE_URL = settings.AI_DATABASE_URL 

if DATABASE_URL and DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

engine = create_async_engine(DATABASE_URL, echo=True, future=True)

async def get_session() -> AsyncSession:
    """
    Dependency to get async database session.
    
    Usage in endpoints:
        async def my_endpoint(db: AsyncSession = Depends(get_session)):
            ...
    """
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session

async def init_db():
    """
    Initialize database tables using SQLModel metadata.
    
    WARNING: This should ONLY be used in development/testing.
    In production, use Alembic migrations instead:
        poetry run alembic upgrade head
    
    This function creates tables if they don't exist, but bypasses Alembic
    migration tracking, which can lead to schema drift.
    """
    if settings.ENVIRONMENT == "production":
        logger.warning(
            "Skipping automatic table creation in production. "
            "Use Alembic migrations instead: poetry run alembic upgrade head"
        )
        return
    
    logger.info("Creating database tables in development mode...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(SQLModel.metadata.create_all)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise