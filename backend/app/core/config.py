"""
TecSalud Configuration Settings
Centralized configuration for Azure OpenAI, database, and application settings
"""

from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List, Dict
import os
from pathlib import Path

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # Application
    APP_NAME: str = "TecSalud Medical Assistant"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=False, env="DEBUG")
    
    # Server
    HOST: str = Field(default="0.0.0.0", env="HOST")
    PORT: int = Field(default=8000, env="PORT")
    ALLOWED_HOSTS: List[str] = Field(
        default=["*"], 
        env="ALLOWED_HOSTS"
    )
    
    # Azure OpenAI Configuration
    AZURE_OPENAI_API_KEY: str = Field(..., env="AZURE_OPENAI_API_KEY")
    AZURE_OPENAI_ENDPOINT: str = Field(..., env="AZURE_OPENAI_ENDPOINT")
    AZURE_OPENAI_API_VERSION: str = Field(
        default="2024-02-01", 
        env="AZURE_OPENAI_API_VERSION"
    )
    
    # Model Deployments
    GPT4O_DEPLOYMENT_NAME: str = Field(
        default="gpt-4o", 
        env="GPT4O_DEPLOYMENT_NAME"
    )
    GPT4O_MINI_DEPLOYMENT_NAME: str = Field(
        default="gpt-4o-mini", 
        env="GPT4O_MINI_DEPLOYMENT_NAME"
    )
    EMBEDDING_DEPLOYMENT_NAME: str = Field(
        default="text-embedding-3-large", 
        env="EMBEDDING_DEPLOYMENT_NAME"
    )
    
    # Model Parameters
    GPT4O_MAX_TOKENS: int = Field(default=4096, env="GPT4O_MAX_TOKENS")
    GPT4O_MINI_MAX_TOKENS: int = Field(default=2048, env="GPT4O_MINI_MAX_TOKENS")
    TEMPERATURE: float = Field(default=0.1, env="TEMPERATURE")
    
    # Database
    DATABASE_TYPE: str = Field(
        default="mongodb", 
        env="DATABASE_TYPE"
    )  # "mongodb" or "sqlite"
    
    # SQLite Database (fallback)
    DATABASE_URL: str = Field(
        default="sqlite:///./data/tecsalud.db", 
        env="DATABASE_URL"
    )
    
    # MongoDB/CosmosDB Configuration
    MONGODB_CONNECTION_STRING: str = Field(
        default="mongodb://localhost:27017", 
        env="MONGODB_CONNECTION_STRING"
    )
    MONGODB_DATABASE_NAME: str = Field(
        default="tecsalud", 
        env="MONGODB_DATABASE_NAME"
    )
    
    # MongoDB Collections (matching the image)
    MONGODB_COLLECTIONS: Dict[str, str] = {
        "patients": "patients",
        "doctors": "doctors", 
        "medical_documents": "medical_documents",
        "diagnoses": "diagnoses",
        "treatments": "treatments",
        "vital_signs": "vital_signs",
        "patient_interactions": "patient_interactions",
        "batch_uploads": "batch_uploads",
        "batch_files": "batch_files"
    }
    

    
    # Redis Cache
    REDIS_URL: str = Field(
        default="redis://localhost:6379/0", 
        env="REDIS_URL"
    )
    
    # JWT Authentication
    SECRET_KEY: str = Field(
        default="your-secret-key-change-in-production", 
        env="SECRET_KEY"
    )
    ALGORITHM: str = Field(default="HS256", env="ALGORITHM")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = Field(
        default=30, 
        env="ACCESS_TOKEN_EXPIRE_MINUTES"
    )
    
    # File Upload
    MAX_FILE_SIZE: int = Field(default=10 * 1024 * 1024, env="MAX_FILE_SIZE")  # 10MB
    UPLOAD_DIRECTORY: str = Field(default="./data/pdfs", env="UPLOAD_DIRECTORY")
    ALLOWED_FILE_TYPES: List[str] = Field(
        default=["pdf", "txt", "docx"], 
        env="ALLOWED_FILE_TYPES"
    )
    
    # Logging
    LOG_LEVEL: str = Field(default="INFO", env="LOG_LEVEL")
    LOG_FORMAT: str = Field(
        default="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        env="LOG_FORMAT"
    )
    
    # Medical AI Settings
    MEDICAL_SYSTEM_PROMPT: str = """Eres un asistente médico especializado de TecSalud. 
    Tu función es ayudar a profesionales de la salud con:
    - Análisis de expedientes clínicos
    - Búsqueda de información médica
    - Sugerencias de diagnóstico diferencial
    - Recomendaciones de tratamiento
    
    IMPORTANTE: 
    - Siempre indica que tus respuestas son sugerencias y requieren validación médica
    - No proporciones diagnósticos definitivos
    - Recomienda consultar con especialistas cuando sea apropiado
    - Mantén la confidencialidad del paciente
    """
    
    # Tool Calling Configuration
    ENABLE_TOOL_CALLING: bool = Field(default=True, env="ENABLE_TOOL_CALLING")
    MAX_TOOL_CALLS: int = Field(default=5, env="MAX_TOOL_CALLS")
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    RATE_LIMIT_WINDOW: int = Field(default=3600, env="RATE_LIMIT_WINDOW")  # 1 hour
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        extra = "allow"
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Create directories if they don't exist
        Path(self.UPLOAD_DIRECTORY).mkdir(parents=True, exist_ok=True)

# Global settings instance
settings = Settings()

# Environment-specific configurations
class DevelopmentSettings(Settings):
    """Development environment settings"""
    DEBUG: bool = True
    LOG_LEVEL: str = "DEBUG"

class ProductionSettings(Settings):
    """Production environment settings"""
    DEBUG: bool = False
    LOG_LEVEL: str = "WARNING"
    ALLOWED_HOSTS: List[str] = ["your-domain.com", "api.tecsalud.com"]

class TestingSettings(Settings):
    """Testing environment settings"""
    DEBUG: bool = True
    DATABASE_URL: str = "sqlite:///./test.db"

def get_settings() -> Settings:
    """Get settings based on environment"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        return ProductionSettings()
    elif env == "testing":
        return TestingSettings()
    else:
        return DevelopmentSettings()

