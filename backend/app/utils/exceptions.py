"""
Custom Exceptions
Application-specific exceptions for better error handling
"""

class TecSaludError(Exception):
    """Base exception for TecSalud application"""
    pass

class AzureOpenAIError(TecSaludError):
    """Exception for Azure OpenAI service errors"""
    pass



class AgentError(TecSaludError):
    """Exception for medical agent processing errors"""
    pass

class DocumentProcessingError(TecSaludError):
    """Exception for document processing errors"""
    pass

class DocumentError(TecSaludError):
    """Exception for enhanced document service errors"""
    pass

class AuthenticationError(TecSaludError):
    """Exception for authentication errors"""
    pass

class ValidationError(TecSaludError):
    """Exception for data validation errors"""
    pass

