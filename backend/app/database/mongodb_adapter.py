"""
MongoDB Database Adapter
Implements MongoDB operations and schema mapping from SQLAlchemy models
"""

import logging
from typing import Any, Dict, List, Optional, Type, Union
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorClient
import pymongo
from bson import ObjectId

from app.core.config import settings
from .abstract_layer import DatabaseAdapter, DatabaseSession, QueryBuilder

logger = logging.getLogger(__name__)


class MongoQueryBuilder(QueryBuilder):
    """MongoDB-specific query builder"""
    
    def __init__(self, adapter: 'MongoDBAdapter', model_class: Type, session: 'MongoSession'):
        super().__init__(adapter, model_class)
        self.session = session
        self.collection_name = self._get_collection_name()
        
    def _get_collection_name(self) -> str:
        """Get MongoDB collection name for model"""
        if hasattr(self.model_class, '__tablename__'):
            table_name = self.model_class.__tablename__
            # Map SQLAlchemy table names to MongoDB collections
            return settings.MONGODB_COLLECTIONS.get(table_name, table_name)
        return self.model_class.__name__.lower()
    
    def filter(self, *args, **kwargs):
        """Add filters to query"""
        # For MongoDB, we'll store filters and apply them during execution
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
        # Convert SQLAlchemy ordering to MongoDB sort
        for arg in args:
            field_name = str(arg).split('.')[-1]
            if 'desc' in str(arg).lower():
                self.sort_fields[field_name] = -1
            else:
                self.sort_fields[field_name] = 1
        return self
    
    def options(self, *args):
        """Add query options (joinedload equivalent not needed in MongoDB)"""
        return self
    
    def join(self, *args, **kwargs):
        """Add joins (implemented as aggregation pipeline in MongoDB)"""
        # MongoDB joins are handled differently, store for later processing
        return self
    
    async def _execute_query(self):
        """Execute the MongoDB query"""
        collection = self.session.adapter.db[self.collection_name]
        
        # Build MongoDB query
        mongo_filter = self._convert_filters_to_mongo()
        
        # Execute query
        cursor = collection.find(mongo_filter)
        
        # Apply sorting
        if self.sort_fields:
            cursor = cursor.sort(list(self.sort_fields.items()))
        
        # Apply pagination
        if self.offset_value:
            cursor = cursor.skip(self.offset_value)
        if self.limit_value:
            cursor = cursor.limit(self.limit_value)
        
        # Convert results to model instances
        results = []
        async for doc in cursor:
            model_instance = self._doc_to_model(doc)
            results.append(model_instance)
        
        return results
    
    def _convert_filters_to_mongo(self) -> Dict[str, Any]:
        """Convert SQLAlchemy-style filters to MongoDB query"""
        mongo_filter = {}
        for key, value in self.filters.items():
            if key == 'id':
                # Convert id to MongoDB _id
                if isinstance(value, int):
                    mongo_filter['id'] = value  # Keep as id for compatibility
                else:
                    mongo_filter['_id'] = ObjectId(value)
            else:
                mongo_filter[key] = value
        return mongo_filter
    
    def _doc_to_model(self, doc: Dict[str, Any]):
        """Convert MongoDB document to model instance"""
        # Remove MongoDB _id and use id field
        if '_id' in doc:
            if 'id' not in doc:
                doc['id'] = str(doc['_id'])
            del doc['_id']
        
        # Create model instance with document data
        instance = self.model_class()
        for key, value in doc.items():
            if hasattr(instance, key):
                setattr(instance, key, value)
        
        return instance
    
    def first(self):
        """Get first result (sync wrapper for async)"""
        import asyncio
        return asyncio.create_task(self._first_async())
    
    async def _first_async(self):
        """Get first result async"""
        self.limit_value = 1
        results = await self._execute_query()
        return results[0] if results else None
    
    def all(self):
        """Get all results (sync wrapper for async)"""
        import asyncio
        return asyncio.create_task(self._execute_query())
    
    def count(self):
        """Count results (sync wrapper for async)"""
        import asyncio
        return asyncio.create_task(self._count_async())
    
    async def _count_async(self):
        """Count results async"""
        collection = self.session.adapter.db[self.collection_name]
        mongo_filter = self._convert_filters_to_mongo()
        return await collection.count_documents(mongo_filter)


class MongoSession(DatabaseSession):
    """MongoDB session wrapper"""
    
    def __init__(self, adapter: 'MongoDBAdapter'):
        super().__init__(adapter)
        self.adapter = adapter
        
    def query(self, model_class: Type):
        """Return a MongoDB query builder for the model"""
        return MongoQueryBuilder(self.adapter, model_class, self)
    
    def add(self, obj: Any):
        """Add object to session (store for later commit)"""
        super().add(obj)
    
    async def commit(self):
        """Commit pending operations"""
        if hasattr(self, '_pending_objects'):
            for operation, obj in self._pending_objects:
                if operation == 'add':
                    await self._save_object(obj)
            self._pending_objects = []
    
    async def _save_object(self, obj: Any):
        """Save object to MongoDB"""
        # Get collection name
        collection_name = getattr(obj, '__tablename__', obj.__class__.__name__.lower())
        collection_name = settings.MONGODB_COLLECTIONS.get(collection_name, collection_name)
        
        # Convert object to document
        doc = self._model_to_doc(obj)
        
        # Insert or update
        collection = self.adapter.db[collection_name]
        if hasattr(obj, 'id') and obj.id:
            # Update existing
            await collection.replace_one({'id': obj.id}, doc, upsert=True)
        else:
            # Insert new
            result = await collection.insert_one(doc)
            obj.id = result.inserted_id
    
    def _model_to_doc(self, obj: Any) -> Dict[str, Any]:
        """Convert model instance to MongoDB document"""
        doc = {}
        for key, value in obj.__dict__.items():
            if not key.startswith('_'):
                # Handle special field conversions
                if key == 'id' and value is None:
                    continue  # Skip None id for inserts
                doc[key] = value
        
        # Add metadata
        if 'created_at' not in doc:
            doc['created_at'] = datetime.utcnow()
        doc['updated_at'] = datetime.utcnow()
        
        return doc


class MongoDBAdapter(DatabaseAdapter):
    """MongoDB database adapter using Motor (async PyMongo)"""
    
    def __init__(self):
        self.client = None
        self.db = None
        
    async def initialize(self) -> None:
        """Initialize MongoDB connection"""
        try:
            # Create Motor client
            self.client = AsyncIOMotorClient(settings.MONGODB_CONNECTION_STRING)
            
            # Get database
            self.db = self.client[settings.MONGODB_DATABASE_NAME]
            
            # Test connection
            await self.client.admin.command('ping')
            
            # Create indexes for better performance
            await self._create_indexes()
            
            logger.info("✅ MongoDB database initialized")
            
        except Exception as e:
            logger.error(f"❌ MongoDB initialization failed: {str(e)}")
            raise
    
    async def _create_indexes(self):
        """Create MongoDB indexes for better performance"""
        try:
            # Patients collection indexes
            patients_collection = self.db[settings.MONGODB_COLLECTIONS['patients']]
            await patients_collection.create_index("medical_record_number", unique=True)
            await patients_collection.create_index("name")
            await patients_collection.create_index("doctor_id")
            
            # Medical documents indexes
            docs_collection = self.db[settings.MONGODB_COLLECTIONS['medical_documents']]
            await docs_collection.create_index("patient_id")
            await docs_collection.create_index("document_type")
            await docs_collection.create_index("created_at")
            await docs_collection.create_index("content_hash")
            
            # Batch uploads indexes
            batch_uploads_collection = self.db[settings.MONGODB_COLLECTIONS['batch_uploads']]
            await batch_uploads_collection.create_index("session_id", unique=True)
            await batch_uploads_collection.create_index("uploaded_by")
            
            # Patient interactions indexes
            interactions_collection = self.db[settings.MONGODB_COLLECTIONS['patient_interactions']]
            await interactions_collection.create_index([("patient_id", 1), ("created_at", -1)])
            await interactions_collection.create_index("doctor_id")
            
            logger.info("✅ MongoDB indexes created")
            
        except Exception as e:
            logger.warning(f"⚠️ Index creation failed: {str(e)}")
    
    async def close(self) -> None:
        """Close MongoDB connection"""
        if self.client:
            self.client.close()
            logger.info("🔒 MongoDB database closed")
    
    def get_session(self) -> MongoSession:
        """Get a new MongoDB session"""
        return MongoSession(self)
    
    async def create(self, collection: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """Create a new document and return the complete document"""
        collection_obj = self.db[collection]
        result = await collection_obj.insert_one(data)
        
        # Return the complete document with the new _id
        created_doc = data.copy()
        created_doc["_id"] = result.inserted_id
        return created_doc
    
    async def get_by_id(self, collection: str, id: Any) -> Optional[Dict[str, Any]]:
        """Get document by ID"""
        collection_obj = self.db[collection]
        
        # Handle both ObjectId and integer IDs
        if isinstance(id, str) and len(id) == 24:
            query = {'_id': ObjectId(id)}
        else:
            query = {'id': id}
        
        doc = await collection_obj.find_one(query)
        return doc
    
    async def get_by_field(self, collection: str, field: str, value: Any) -> Optional[Dict[str, Any]]:
        """Get document by field value"""
        collection_obj = self.db[collection]
        doc = await collection_obj.find_one({field: value})
        return doc
    
    async def find(self, collection: str, filters: Dict[str, Any] = None, 
                  limit: int = None, offset: int = None, 
                  sort: Dict[str, int] = None) -> List[Dict[str, Any]]:
        """Find documents with filters"""
        collection_obj = self.db[collection]
        
        # Build query
        query = filters or {}
        cursor = collection_obj.find(query)
        
        # Apply sorting
        if sort:
            cursor = cursor.sort(list(sort.items()))
        
        # Apply pagination
        if offset:
            cursor = cursor.skip(offset)
        if limit:
            cursor = cursor.limit(limit)
        
        # Return results
        return await cursor.to_list(length=limit)
    
    async def find_many(self, collection: str, filter_dict: Dict[str, Any] = None, 
                       limit: int = None, offset: int = None, 
                       sort_by: str = None, sort_order: str = "asc") -> List[Dict[str, Any]]:
        """Find documents/records with filters (alias for find with different parameter names)"""
        # Convert sort parameters to the format expected by find
        sort = None
        if sort_by:
            sort = {sort_by: 1 if sort_order == "asc" else -1}
        
        return await self.find(collection, filter_dict, limit, offset, sort)
    
    async def update(self, collection: str, id: Any, data: Dict[str, Any]) -> bool:
        """Update document by ID"""
        collection_obj = self.db[collection]
        
        # Handle both ObjectId and integer IDs
        if isinstance(id, str) and len(id) == 24:
            query = {'_id': ObjectId(id)}
        else:
            query = {'id': id}
        
        # Add updated timestamp
        data['updated_at'] = datetime.utcnow()
        
        result = await collection_obj.update_one(query, {'$set': data})
        return result.modified_count > 0
    
    async def delete(self, collection: str, id: Any) -> bool:
        """Delete document by ID"""
        collection_obj = self.db[collection]
        
        # Handle both ObjectId and integer IDs
        if isinstance(id, str) and len(id) == 24:
            query = {'_id': ObjectId(id)}
        else:
            query = {'id': id}
        
        result = await collection_obj.delete_one(query)
        return result.deleted_count > 0
    
    async def count(self, collection: str, filters: Dict[str, Any] = None) -> int:
        """Count documents"""
        collection_obj = self.db[collection]
        query = filters or {}
        return await collection_obj.count_documents(query)
    
    async def aggregate(self, collection: str, pipeline: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Perform aggregation operations"""
        collection_obj = self.db[collection]
        cursor = collection_obj.aggregate(pipeline)
        return await cursor.to_list(length=None)
    
    def begin_transaction(self):
        """Begin a database transaction"""
        # MongoDB transactions would be implemented here if needed
        pass
    
    def commit_transaction(self):
        """Commit current transaction"""
        pass
    
    def rollback_transaction(self):
        """Rollback current transaction"""
        pass 