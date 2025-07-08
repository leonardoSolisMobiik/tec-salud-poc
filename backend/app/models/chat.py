"""
Chat Models
Pydantic models for chat functionality with enhanced hybrid document context
"""

from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from enum import Enum
from datetime import datetime

class ModelType(str, Enum):
    """Available Azure OpenAI model types"""
    GPT4O = "gpt-4o"
    GPT4O_MINI = "gpt-4o-mini"

class ChatRole(str, Enum):
    """Chat message roles"""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"
    TOOL = "tool"

class ContextStrategy(str, Enum):
    """Context retrieval strategies for enhanced document context"""
    VECTORS_ONLY = "vectors_only"
    FULL_DOCS_ONLY = "full_docs_only"
    HYBRID_SMART = "hybrid_smart"
    HYBRID_PRIORITY_VECTORS = "hybrid_priority_vectors"
    HYBRID_PRIORITY_FULL = "hybrid_priority_full"

class ChatMessage(BaseModel):
    """Individual chat message"""
    role: ChatRole
    content: str
    name: Optional[str] = None
    tool_call_id: Optional[str] = None
    
    class Config:
        use_enum_values = True

class ChatRequest(BaseModel):
    """Enhanced request for chat completion with hybrid context support"""
    messages: List[ChatMessage]
    model_type: ModelType = ModelType.GPT4O_MINI
    temperature: Optional[float] = Field(default=0.1, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, gt=0)
    stream: bool = False
    patient_id: Optional[str] = None
    include_context: bool = True
    context_strategy: Optional[ContextStrategy] = Field(
        default=None,
        description="Strategy for retrieving patient context. If not specified, uses intelligent default based on query type."
    )
    
    class Config:
        use_enum_values = True

class ToolCall(BaseModel):
    """Tool call information"""
    id: str
    type: str
    function: Dict[str, Any]

class EnhancedChatResponse(BaseModel):
    """Enhanced response with context metadata"""
    content: str
    model: ModelType
    usage: Dict[str, int]
    tool_calls: List[ToolCall] = []
    finish_reason: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = None
    
    # Enhanced context information
    context_used: bool = False
    context_strategy: Optional[ContextStrategy] = None
    context_confidence: Optional[float] = None
    total_context_documents: int = 0
    total_context_tokens: int = 0
    
    class Config:
        use_enum_values = True

# Alias for backward compatibility
ChatResponse = EnhancedChatResponse

class ChatSession(BaseModel):
    """Enhanced chat session with hybrid context tracking"""
    session_id: str
    patient_id: Optional[str] = None
    messages: List[ChatMessage] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
    # Enhanced context tracking
    context_strategy_used: Optional[ContextStrategy] = None
    total_context_retrievals: int = 0
    avg_context_confidence: Optional[float] = None
    
class StreamResponse(BaseModel):
    """Enhanced streaming response chunk with context info"""
    content: str
    is_complete: bool = False
    session_id: Optional[str] = None
    chunk_id: Optional[int] = None
    
    # Context metadata (sent with first chunk)
    context_info: Optional[Dict[str, Any]] = None
    enhanced_processing: bool = False

class ContextPreview(BaseModel):
    """Preview of context that would be retrieved for a query"""
    patient_id: int
    query: str
    strategy_used: ContextStrategy
    total_documents: int
    total_tokens: int
    confidence: float
    processing_time_ms: float
    context_summary: str
    recommendations: List[str]
    vector_results_count: int
    full_documents_count: int
    document_breakdown: Dict[str, int]
    relevance_distribution: Dict[str, int]
    sample_documents: List[Dict[str, Any]]

