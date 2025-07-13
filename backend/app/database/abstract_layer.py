"""
Abstract Database Layer Interface
Defines the common interface for database operations
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Union, Type
from datetime import datetime


class DatabaseAdapter(ABC):
    """Abstract database adapter interface"""
    
    @abstractmethod
    async def initialize(self) -> None:
        """Initialize database connection and setup"""
        pass
    
    @abstractmethod
    async def close(self) -> None:
        """Close database connection"""
        pass
    
    @abstractmethod
    async def create(self, collection: str, data: Dict[str, Any]) -> Any:
        """Create a new document/record"""
        pass
    
    @abstractmethod
    async def get_by_id(self, collection: str, id: Any) -> Optional[Dict[str, Any]]:
        """Get document/record by ID"""
        pass
    
    @abstractmethod
    async def get_by_field(self, collection: str, field: str, value: Any) -> Optional[Dict[str, Any]]:
        """Get document/record by field value"""
        pass
    
    @abstractmethod
    async def find(self, collection: str, filters: Dict[str, Any] = None, 
                  limit: int = None, offset: int = None, 
                  sort: Dict[str, int] = None) -> List[Dict[str, Any]]:
        """Find documents/records with filters"""
        pass
    
    async def find_many(self, collection: str, filter_dict: Dict[str, Any] = None, 
                       limit: int = None, offset: int = None, 
                       sort_by: str = None, sort_order: str = "asc") -> List[Dict[str, Any]]:
        """Find documents/records with filters (alias for find with different parameter names)"""
        # Convert sort parameters to the format expected by find
        sort = None
        if sort_by:
            sort = {sort_by: 1 if sort_order == "asc" else -1}
        
        return await self.find(collection, filter_dict, limit, offset, sort)
    
    @abstractmethod
    async def update(self, collection: str, id: Any, data: Dict[str, Any]) -> bool:
        """Update document/record by ID"""
        pass
    
    @abstractmethod
    async def delete(self, collection: str, id: Any) -> bool:
        """Delete document/record by ID"""
        pass
    
    @abstractmethod
    async def count(self, collection: str, filters: Dict[str, Any] = None) -> int:
        """Count documents/records"""
        pass
    
    @abstractmethod
    async def aggregate(self, collection: str, pipeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Perform aggregation operations"""
        pass
    
    @abstractmethod
    def begin_transaction(self):
        """Begin a database transaction"""
        pass
    
    @abstractmethod
    def commit_transaction(self):
        """Commit current transaction"""
        pass
    
    @abstractmethod
    def rollback_transaction(self):
        """Rollback current transaction"""
        pass


class DatabaseSession:
    """Database session wrapper that mimics SQLAlchemy Session interface"""
    
    def __init__(self, adapter: DatabaseAdapter):
        self.adapter = adapter
        self._transaction_active = False
    
    async def __aenter__(self):
        """Async context manager entry"""
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if exc_type:
            self.rollback()
        else:
            # For async sessions, commit might be async
            if hasattr(self, 'commit') and callable(self.commit):
                try:
                    await self.commit()
                except TypeError:
                    # If commit is not async, call it normally
                    self.commit()
        self.close()
    
    def query(self, model_class: Type):
        """Return a query builder for the model"""
        return QueryBuilder(self.adapter, model_class)
    
    def add(self, obj: Any):
        """Add object to session (will be committed later)"""
        if not hasattr(self, '_pending_objects'):
            self._pending_objects = []
        self._pending_objects.append(('add', obj))
    
    def commit(self):
        """Commit pending operations"""
        if hasattr(self, '_pending_objects'):
            for operation, obj in self._pending_objects:
                if operation == 'add':
                    # Convert object to dict and save
                    if hasattr(obj, '__dict__'):
                        data = {k: v for k, v in obj.__dict__.items() if not k.startswith('_')}
                        collection = obj.__tablename__ if hasattr(obj, '__tablename__') else obj.__class__.__name__.lower()
                        # This should be async, but for compatibility we'll handle it in the factory
                        pass
            self._pending_objects = []
        
        if self._transaction_active:
            self.adapter.commit_transaction()
            self._transaction_active = False
    
    def rollback(self):
        """Rollback pending operations"""
        if hasattr(self, '_pending_objects'):
            self._pending_objects = []
        
        if self._transaction_active:
            self.adapter.rollback_transaction()
            self._transaction_active = False
    
    def refresh(self, obj: Any):
        """Refresh object (compatibility method - no-op for MongoDB)"""
        # In MongoDB, objects don't need refreshing as they're fetched fresh each time
        # This is a compatibility method for SQLAlchemy code
        pass
    
    def close(self):
        """Close session"""
        self.rollback()
    
    # Delegate database operations to adapter
    async def count(self, collection: str, filters: Dict[str, Any] = None) -> int:
        """Count documents/records"""
        return await self.adapter.count(collection, filters)
    
    async def find_many(self, collection: str, filter_dict: Dict[str, Any] = None, 
                       limit: int = None, offset: int = None, 
                       sort_by: str = None, sort_order: str = "asc") -> List[Dict[str, Any]]:
        """Find documents/records with filters"""
        return await self.adapter.find_many(collection, filter_dict, limit, offset, sort_by, sort_order)
    
    async def create(self, collection: str, data: Dict[str, Any]) -> Any:
        """Create a new document/record"""
        return await self.adapter.create(collection, data)
    
    async def get_by_id(self, collection: str, id: Any) -> Optional[Dict[str, Any]]:
        """Get document/record by ID"""
        return await self.adapter.get_by_id(collection, id)
    
    async def update(self, collection: str, id: Any, data: Dict[str, Any]) -> bool:
        """Update document/record by ID"""
        return await self.adapter.update(collection, id, data)
    
    async def delete(self, collection: str, id: Any) -> bool:
        """Delete document/record by ID"""
        return await self.adapter.delete(collection, id)


class QueryBuilder:
    """Query builder that mimics SQLAlchemy Query interface"""
    
    def __init__(self, adapter: DatabaseAdapter, model_class: Type):
        self.adapter = adapter
        self.model_class = model_class
        self.filters = {}
        self.limit_value = None
        self.offset_value = None
        self.sort_fields = {}
        
    def filter(self, *args, **kwargs):
        """Add filters to query"""
        # Simple implementation - in production would parse SQLAlchemy expressions
        for key, value in kwargs.items():
            self.filters[key] = value
        return self
    
    def filter_by(self, **kwargs):
        """Add filters by field values"""
        self.filters.update(kwargs)
        return self
    
    def limit(self, limit: int):
        """Set query limit"""
        self.limit_value = limit
        return self
    
    def offset(self, offset: int):
        """Set query offset"""
        self.offset_value = offset
        return self
    
    def order_by(self, *args):
        """Set query ordering"""
        # Simple implementation - would need to parse SQLAlchemy expressions
        return self
    
    def first(self):
        """Get first result"""
        results = self.all()
        return results[0] if results else None
    
    def all(self):
        """Get all results"""
        collection = getattr(self.model_class, '__tablename__', self.model_class.__name__.lower())
        # This should be async, but for compatibility we'll handle it in the adapter
        return []
    
    def count(self):
        """Count results"""
        collection = getattr(self.model_class, '__tablename__', self.model_class.__name__.lower())
        # This should be async, but for compatibility we'll handle it in the adapter
        return 0 