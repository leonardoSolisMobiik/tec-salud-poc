"""
Database Configuration
Abstracted database layer for TecSalud application
Supports both SQLite and MongoDB/CosmosDB
"""

import logging
from sqlalchemy import create_engine, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.database.factory import init_database, get_database_adapter, get_db_async, close_database, DatabaseConfig

logger = logging.getLogger(__name__)

# Legacy SQLAlchemy setup for compatibility
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=StaticPool,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=settings.DEBUG
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Metadata for table creation
metadata = MetaData()

async def init_db() -> None:
    """Initialize database using abstraction layer"""
    try:
        # Use the new abstraction layer
        await init_database()
        
        # Log database type being used
        db_config = DatabaseConfig.get_connection_info()
        logger.info(f"✅ Database initialized: {db_config['type']}")
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {str(e)}")
        raise

async def get_db():
    """Dependency to get database session (abstracted)"""
    async with get_db_async() as session:
        yield session

async def close_db() -> None:
    """Close database connections"""
    try:
        # Use abstraction layer close
        await close_database()
        
        # Also close legacy SQLAlchemy engine
        engine.dispose()
        logger.info("🔒 Database connections closed")
    except Exception as e:
        logger.error(f"❌ Error closing database: {str(e)}")

