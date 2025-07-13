"""
OpenAPI Documentation Configuration
Configures Swagger/OpenAPI documentation for the TecSalud API
"""

from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi

def custom_openapi(app: FastAPI):
    """Generate custom OpenAPI schema"""
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="TecSalud API",
        version="2.0.0",
        description="""
        # TecSalud - Asistente Virtual Médico con IA
        
        API completa para el sistema TecSalud que integra Azure OpenAI con análisis de documentos completos
        para proporcionar asistencia médica inteligente.
        
        ## 🚀 Características Principales
        
        - **Chat Médico Inteligente**: Consultas médicas con GPT-4o/4o-mini
        - **Análisis de Documentos Completos**: Análisis exhaustivo de expedientes médicos
        - **Gestión de Pacientes**: CRUD completo de pacientes y expedientes
        - **Análisis de Documentos**: Procesamiento automático de documentos médicos
        - **Tool Calling**: Funciones especializadas para tareas médicas
        
        ## 🔐 Autenticación
        
        La API utiliza JWT tokens para autenticación. Incluye el token en el header:
        ```
        Authorization: Bearer <your-jwt-token>
        ```
        
        ## 📊 Modelos de IA Disponibles
        
        - **gpt-4o**: Análisis médicos complejos y diagnósticos profundos
        - **gpt-4o-mini**: Consultas rápidas y respuestas eficientes
        - **text-embedding-3-large**: Embeddings para búsqueda semántica
        
        ## 🏥 Casos de Uso
        
        1. **Consultas Médicas**: Chat inteligente con contexto de paciente
        2. **Análisis de Expedientes**: Procesamiento automático de documentos
        3. **Búsqueda Semántica**: Encontrar información relevante en expedientes
        4. **Gestión de Pacientes**: Administración completa de datos médicos
        
        ## 📝 Formatos Soportados
        
        - **Documentos**: PDF, TXT, DOC, DOCX
        - **Respuestas**: JSON con metadatos de IA
        - **Búsqueda**: Consultas en lenguaje natural
        
        ## ⚡ Rate Limits
        
        - **Chat**: 60 requests/minuto
        - **Upload**: 10 files/minuto
        - **Search**: 100 requests/minuto
        
        ## 🔗 Enlaces Útiles
        
        - [Documentación Completa](http://localhost:8000/docs)
        - [Frontend](http://localhost:3000)
        - [Health Check](http://localhost:8000/api/v1/health)
        """,
        routes=app.routes,
        servers=[
            {
                "url": "http://localhost:8000",
                "description": "Desarrollo Local"
            },
            {
                "url": "https://api.tecsalud.com",
                "description": "Producción"
            }
        ]
    )
    
    # Add custom tags
    openapi_schema["tags"] = [
        {
            "name": "Chat",
            "description": "Endpoints para chat médico con IA",
            "externalDocs": {
                "description": "Documentación de Chat",
                "url": "https://docs.tecsalud.com/chat"
            }
        },
        {
            "name": "Patients",
            "description": "Gestión de pacientes y expedientes médicos",
            "externalDocs": {
                "description": "Documentación de Pacientes",
                "url": "https://docs.tecsalud.com/patients"
            }
        },
        {
            "name": "Documents",
            "description": "Gestión y análisis de documentos médicos",
            "externalDocs": {
                "description": "Documentación de Documentos",
                "url": "https://docs.tecsalud.com/documents"
            }
        },
        {
            "name": "Health",
            "description": "Monitoreo y estado del sistema",
            "externalDocs": {
                "description": "Documentación de Health Checks",
                "url": "https://docs.tecsalud.com/health"
            }
        }
    ]
    
    # Add security schemes
    openapi_schema["components"]["securitySchemes"] = {
        "BearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
            "description": "JWT token para autenticación"
        },
        "ApiKeyAuth": {
            "type": "apiKey",
            "in": "header",
            "name": "X-API-Key",
            "description": "API Key para acceso programático"
        }
    }
    
    # Add global security
    openapi_schema["security"] = [
        {"BearerAuth": []},
        {"ApiKeyAuth": []}
    ]
    
    # Add custom info
    openapi_schema["info"]["contact"] = {
        "name": "TecSalud Support",
        "email": "soporte@tecsalud.com",
        "url": "https://tecsalud.com/support"
    }
    
    openapi_schema["info"]["license"] = {
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT"
    }
    
    # Add external docs
    openapi_schema["externalDocs"] = {
        "description": "Documentación Completa de TecSalud",
        "url": "https://docs.tecsalud.com"
    }
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

# Example responses for documentation
EXAMPLE_RESPONSES = {
    "chat_response": {
        "content": "Basándome en los síntomas descritos, podría tratarse de una infección respiratoria alta. Recomiendo realizar un examen físico completo y considerar estudios de laboratorio si los síntomas persisten.",
        "model": "gpt-4o-mini",
        "usage": {
            "prompt_tokens": 150,
            "completion_tokens": 75,
            "total_tokens": 225
        },
        "tool_calls": [],
        "patient_context_used": True,
        "response_time": 2.3
    },
    "patient_response": {
        "id": "PAT001",
        "name": "María González Rodríguez",
        "age": 45,
        "gender": "femenino",
        "blood_type": "O+",
        "phone": "+52 81 1234-5678",
        "email": "maria.gonzalez@email.com",
        "medical_record_number": "EXP-2024-001",
        "last_visit": "2024-01-15",
        "conditions": ["Diabetes Mellitus tipo 2", "Hipertensión arterial"],
        "allergies": ["Penicilina"],
        "medications": ["Metformina 850mg", "Losartán 50mg"]
    },
    "document_upload_response": {
        "document_id": "DOC_PAT001_1704067200_a1b2c3d4",
        "filename": "laboratorio_2024.pdf",
        "size": 2048576,
        "text_length": 1500,
        "status": "processed",
        "analysis_summary": "Documento de laboratorio procesado. Contiene 150 palabras. Análisis automático completado.",
        "message": "Document uploaded and indexed successfully"
    },
    "search_response": {
        "query": "diabetes glucosa",
        "results": [
            {
                "document_id": "DOC_PAT001_001",
                "title": "Laboratorio - Glucosa en ayunas",
                "content_preview": "Glucosa en ayunas: 145 mg/dL (elevada). Hemoglobina glucosilada: 7.2%. Recomendación: ajuste de medicación antidiabética...",
                "relevance_score": 0.92,
                "document_type": "laboratorio",
                "patient_id": "PAT001",
                "date": "2024-01-15"
            }
        ],
        "total_found": 5,
        "search_time": "0.1s"
    },
    "health_response": {
        "status": "healthy",
        "timestamp": "2024-01-20T10:30:00Z",
        "services": {
            "azure_openai": "healthy",
            "database": "healthy"
        },
        "version": "2.0.0",
        "uptime": "2 days, 14 hours"
    }
}

# Error response examples
ERROR_RESPONSES = {
    400: {
        "description": "Bad Request",
        "content": {
            "application/json": {
                "example": {
                    "detail": "Invalid request format or missing required fields"
                }
            }
        }
    },
    401: {
        "description": "Unauthorized",
        "content": {
            "application/json": {
                "example": {
                    "detail": "Invalid or missing authentication token"
                }
            }
        }
    },
    404: {
        "description": "Not Found",
        "content": {
            "application/json": {
                "example": {
                    "detail": "Resource not found"
                }
            }
        }
    },
    422: {
        "description": "Validation Error",
        "content": {
            "application/json": {
                "example": {
                    "detail": [
                        {
                            "loc": ["body", "field_name"],
                            "msg": "field required",
                            "type": "value_error.missing"
                        }
                    ]
                }
            }
        }
    },
    500: {
        "description": "Internal Server Error",
        "content": {
            "application/json": {
                "example": {
                    "detail": "Internal server error occurred"
                }
            }
        }
    },
    503: {
        "description": "Service Unavailable",
        "content": {
            "application/json": {
                "example": {
                    "detail": "Azure OpenAI service temporarily unavailable"
                }
            }
        }
    }
}

