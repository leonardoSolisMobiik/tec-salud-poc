"""
SQLite Database Adapter
Maintains compatibility with existing SQLAlchemy implementation
"""

import logging
from typing import Any, Dict, List, Optional, Type
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from .abstract_layer import DatabaseAdapter, DatabaseSession, QueryBuilder

logger = logging.getLogger(__name__)


class SQLiteQueryBuilder(QueryBuilder):
    """SQLite-specific query builder with SQLAlchemy integration"""
    
    def __init__(self, adapter: 'SQLiteAdapter', model_class: Type, session: Session):
        super().__init__(adapter, model_class)
        self.session = session
        self._query = session.query(model_class)
    
    def filter(self, *args, **kwargs):
        """Add filters to query using SQLAlchemy"""
        if args:
            self._query = self._query.filter(*args)
        if kwargs:
            for key, value in kwargs.items():
                if hasattr(self.model_class, key):
                    self._query = self._query.filter(getattr(self.model_class, key) == value)
        return self
    
    def filter_by(self, **kwargs):
        """Add filters by field values"""
        self._query = self._query.filter_by(**kwargs)
        return self
    
    def limit(self, limit: int):
        """Set query limit"""
        self._query = self._query.limit(limit)
        return self
    
    def offset(self, offset: int):
        """Set query offset"""
        self._query = self._query.offset(offset)
        return self
    
    def order_by(self, *args):
        """Set query ordering"""
        self._query = self._query.order_by(*args)
        return self
    
    def options(self, *args):
        """Add query options (like joinedload)"""
        self._query = self._query.options(*args)
        return self
    
    def join(self, *args, **kwargs):
        """Add joins to query"""
        self._query = self._query.join(*args, **kwargs)
        return self
    
    def first(self):
        """Get first result"""
        return self._query.first()
    
    def all(self):
        """Get all results"""
        return self._query.all()
    
    def count(self):
        """Count results"""
        return self._query.count()
    
    def one(self):
        """Get exactly one result"""
        return self._query.one()
    
    def one_or_none(self):
        """Get one result or None"""
        return self._query.one_or_none()


class SQLiteSession(DatabaseSession):
    """SQLite session wrapper that maintains SQLAlchemy Session interface"""
    
    def __init__(self, adapter: 'SQLiteAdapter', sqlalchemy_session: Session):
        super().__init__(adapter)
        self.sqlalchemy_session = sqlalchemy_session
    
    def query(self, model_class: Type):
        """Return a SQLite query builder for the model"""
        return SQLiteQueryBuilder(self.adapter, model_class, self.sqlalchemy_session)
    
    def add(self, obj: Any):
        """Add object to session"""
        self.sqlalchemy_session.add(obj)
    
    def commit(self):
        """Commit pending operations"""
        self.sqlalchemy_session.commit()
    
    def rollback(self):
        """Rollback pending operations"""
        self.sqlalchemy_session.rollback()
    
    def close(self):
        """Close session"""
        self.sqlalchemy_session.close()
    
    def refresh(self, obj: Any):
        """Refresh object from database"""
        self.sqlalchemy_session.refresh(obj)
    
    def execute(self, statement, params=None):
        """Execute raw SQL statement"""
        return self.sqlalchemy_session.execute(statement, params)
    
    def merge(self, obj: Any):
        """Merge object with session"""
        return self.sqlalchemy_session.merge(obj)
    
    def delete(self, obj: Any):
        """Delete object from session"""
        self.sqlalchemy_session.delete(obj)


class SQLiteAdapter(DatabaseAdapter):
    """SQLite database adapter using SQLAlchemy"""
    
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self.Base = None
        self.metadata = None
        
    async def initialize(self) -> None:
        """Initialize SQLite database"""
        try:
            # Create SQLAlchemy engine
            self.engine = create_engine(
                settings.DATABASE_URL,
                poolclass=StaticPool,
                connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
                echo=settings.DEBUG
            )
            
            # Create session factory
            self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
            
            # Import Base and create tables
            from app.db.models import Base
            self.Base = Base
            self.metadata = Base.metadata
            
            # Create all tables
            Base.metadata.create_all(bind=self.engine)
            
            logger.info("✅ SQLite database initialized")
            
        except Exception as e:
            logger.error(f"❌ SQLite initialization failed: {str(e)}")
            raise
    
    async def close(self) -> None:
        """Close SQLite database"""
        if self.engine:
            self.engine.dispose()
            logger.info("🔒 SQLite database closed")
    
    def get_session(self) -> SQLiteSession:
        """Get a new SQLite session"""
        sqlalchemy_session = self.SessionLocal()
        return SQLiteSession(self, sqlalchemy_session)
    
    async def create(self, collection: str, data: Dict[str, Any]) -> Any:
        """Create a new record (not typically used directly)"""
        # This would require mapping collection names to model classes
        # For now, return None as this is handled through the session interface
        return None
    
    async def find_many(self, collection: str, filter_dict: Dict[str, Any] = None, 
                       limit: int = None, offset: int = None, 
                       sort_by: str = None, sort_order: str = "asc") -> List[Dict[str, Any]]:
        """Find documents/records with filters (alias for find with different parameter names)"""
        # Convert sort parameters to the format expected by find
        sort = None
        if sort_by:
            sort = {sort_by: 1 if sort_order == "asc" else -1}
        
        return await self.find(collection, filter_dict, limit, offset, sort)
    
    async def get_by_id(self, collection: str, id: Any) -> Optional[Dict[str, Any]]:
        """Get record by ID (not typically used directly)"""
        return None
    
    async def get_by_field(self, collection: str, field: str, value: Any) -> Optional[Dict[str, Any]]:
        """Get record by field value (not typically used directly)"""
        return None
    
    async def find(self, collection: str, filters: Dict[str, Any] = None, 
                  limit: int = None, offset: int = None, 
                  sort: Dict[str, int] = None) -> List[Dict[str, Any]]:
        """Find records with filters (not typically used directly)"""
        return []
    
    async def update(self, collection: str, id: Any, data: Dict[str, Any]) -> bool:
        """Update record by ID (not typically used directly)"""
        return False
    
    async def delete(self, collection: str, id: Any) -> bool:
        """Delete record by ID (not typically used directly)"""
        return False
    
    async def count(self, collection: str, filters: Dict[str, Any] = None) -> int:
        """Count records (not typically used directly)"""
        return 0
    
    async def aggregate(self, collection: str, pipeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Perform aggregation operations (not typically used directly)"""
        return []
    
    def begin_transaction(self):
        """Begin a database transaction"""
        # SQLAlchemy handles transactions through sessions
        pass
    
    def commit_transaction(self):
        """Commit current transaction"""
        # SQLAlchemy handles transactions through sessions
        pass
    
    def rollback_transaction(self):
        """Rollback current transaction"""
        # SQLAlchemy handles transactions through sessions
        pass 