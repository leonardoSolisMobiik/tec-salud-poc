"""
Database abstraction layer for TecSalud
Supports both SQLite and MongoDB/CosmosDB
"""

from .factory import get_database_adapter, init_database

__all__ = ["get_database_adapter", "init_database"] 