"""
Database Factory
Factory pattern for selecting database adapter based on configuration
"""

import logging
from typing import Optional
from contextlib import contextmanager, asynccontextmanager

from app.core.config import settings
from .abstract_layer import DatabaseAdapter, DatabaseSession
from .sqlite_adapter import SQLiteAdapter
from .mongodb_adapter import MongoDBAdapter

logger = logging.getLogger(__name__)

# Global database adapter instance
_database_adapter: Optional[DatabaseAdapter] = None


async def init_database() -> None:
    """Initialize database based on configuration"""
    global _database_adapter
    
    try:
        if settings.DATABASE_TYPE.lower() == "mongodb":
            logger.info("🔗 Initializing MongoDB database adapter")
            _database_adapter = MongoDBAdapter()
        else:
            logger.info("🔗 Initializing SQLite database adapter")
            _database_adapter = SQLiteAdapter()
        
        await _database_adapter.initialize()
        logger.info(f"✅ Database adapter initialized: {settings.DATABASE_TYPE}")
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {str(e)}")
        # Fallback to SQLite if MongoDB fails
        if settings.DATABASE_TYPE.lower() == "mongodb":
            logger.warning("⚠️ MongoDB failed, falling back to SQLite")
            try:
                _database_adapter = SQLiteAdapter()
                await _database_adapter.initialize()
                logger.info("✅ Fallback SQLite database initialized")
            except Exception as fallback_error:
                logger.error(f"❌ Fallback SQLite initialization failed: {str(fallback_error)}")
                raise fallback_error
        else:
            raise e


def get_database_adapter() -> DatabaseAdapter:
    """Get the current database adapter"""
    if _database_adapter is None:
        raise RuntimeError("Database adapter not initialized. Call init_database() first.")
    return _database_adapter


@contextmanager
def get_db():
    """
    Database session dependency
    Maintains compatibility with existing code
    """
    adapter = get_database_adapter()
    session = adapter.get_session()
    try:
        yield session
    finally:
        session.close()

@asynccontextmanager
async def get_db_async():
    """
    Async database session dependency
    For FastAPI async endpoints
    """
    adapter = get_database_adapter()
    session = adapter.get_session()
    try:
        yield session
    finally:
        session.close()


async def close_database() -> None:
    """Close database connection"""
    global _database_adapter
    if _database_adapter:
        await _database_adapter.close()
        _database_adapter = None
        logger.info("🔒 Database connection closed")


# Compatibility functions for existing code migration
def get_legacy_session() -> DatabaseSession:
    """Get database session for legacy code compatibility"""
    adapter = get_database_adapter()
    return adapter.get_session()


class DatabaseConfig:
    """Database configuration helper"""
    
    @staticmethod
    def get_connection_info() -> dict:
        """Get database connection information"""
        if settings.DATABASE_TYPE.lower() == "mongodb":
            return {
                "type": "mongodb",
                "connection_string": settings.MONGODB_CONNECTION_STRING,
                "database_name": settings.MONGODB_DATABASE_NAME,
                "collections": settings.MONGODB_COLLECTIONS
            }
        else:
            return {
                "type": "sqlite",
                "database_url": settings.DATABASE_URL
            }
    
    @staticmethod
    def is_mongodb() -> bool:
        """Check if using MongoDB"""
        return settings.DATABASE_TYPE.lower() == "mongodb"
    
    @staticmethod
    def is_sqlite() -> bool:
        """Check if using SQLite"""
        return settings.DATABASE_TYPE.lower() == "sqlite"


# Migration helper for gradual transition
class MigrationHelper:
    """Helper for migrating from SQLAlchemy to abstracted layer"""
    
    @staticmethod
    def convert_sqlalchemy_filter(filter_expression):
        """Convert SQLAlchemy filter to adapter-compatible filter"""
        # This would be implemented to parse SQLAlchemy expressions
        # For now, return as-is for basic compatibility
        return filter_expression
    
    @staticmethod
    def convert_sqlalchemy_order(order_expression):
        """Convert SQLAlchemy order_by to adapter-compatible sort"""
        # This would be implemented to parse SQLAlchemy ordering
        # For now, return as-is for basic compatibility
        return order_expression 