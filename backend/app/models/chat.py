"""
Chat Models
Pydantic models for chat functionality and Azure OpenAI integration
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

class ChatMessage(BaseModel):
    """Individual chat message"""
    role: ChatRole
    content: str
    name: Optional[str] = None
    tool_call_id: Optional[str] = None
    
    class Config:
        use_enum_values = True

class ChatRequest(BaseModel):
    """Request for chat completion"""
    messages: List[ChatMessage]
    model_type: ModelType = ModelType.GPT4O_MINI
    temperature: Optional[float] = Field(default=0.1, ge=0.0, le=2.0)
    max_tokens: Optional[int] = Field(default=None, gt=0)
    stream: bool = False
    patient_id: Optional[str] = None
    include_context: bool = True
    
    class Config:
        use_enum_values = True

class ToolCall(BaseModel):
    """Tool call information"""
    id: str
    type: str
    function: Dict[str, Any]

class ChatResponse(BaseModel):
    """Response from chat completion"""
    content: str
    model: ModelType
    usage: Dict[str, int]
    tool_calls: List[ToolCall] = []
    finish_reason: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        use_enum_values = True

class ChatSession(BaseModel):
    """Chat session with patient context"""
    session_id: str
    patient_id: Optional[str] = None
    messages: List[ChatMessage] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    
class StreamResponse(BaseModel):
    """Streaming response chunk"""
    content: str
    is_complete: bool = False
    session_id: Optional[str] = None

