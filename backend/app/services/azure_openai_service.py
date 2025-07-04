"""
Azure OpenAI Service
Handles communication with Azure OpenAI API for GPT-4o and GPT-4o-mini models
"""

import asyncio
import logging
from typing import List, Dict, Any, Optional, AsyncGenerator
from openai import AsyncAzureOpenAI
from openai.types.chat import ChatCompletion, ChatCompletionMessage
from openai.types.chat.chat_completion import Choice

from app.core.config import settings
from app.models.chat import ChatMessage, ChatResponse, ModelType
from app.utils.exceptions import AzureOpenAIError

logger = logging.getLogger(__name__)

class AzureOpenAIService:
    """Service for interacting with Azure OpenAI API"""
    
    def __init__(self):
        self.client: Optional[AsyncAzureOpenAI] = None
        self.is_initialized = False
    
    async def initialize(self) -> None:
        """Initialize Azure OpenAI client"""
        try:
            self.client = AsyncAzureOpenAI(
                api_key=settings.AZURE_OPENAI_API_KEY,
                api_version=settings.AZURE_OPENAI_API_VERSION,
                azure_endpoint=settings.AZURE_OPENAI_ENDPOINT
            )
            
            # Test connection
            await self._test_connection()
            self.is_initialized = True
            logger.info("✅ Azure OpenAI service initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Azure OpenAI service: {str(e)}")
            raise AzureOpenAIError(f"Failed to initialize Azure OpenAI: {str(e)}")
    
    async def _test_connection(self) -> None:
        """Test Azure OpenAI connection"""
        try:
            response = await self.client.chat.completions.create(
                model=settings.GPT4O_MINI_DEPLOYMENT_NAME,
                messages=[{"role": "user", "content": "Test connection"}],
                max_tokens=10,
                temperature=0
            )
            logger.info("🔗 Azure OpenAI connection test successful")
        except Exception as e:
            logger.error(f"🔗 Azure OpenAI connection test failed: {str(e)}")
            raise
    
    async def chat_completion(
        self,
        messages: List[ChatMessage],
        model_type: ModelType = ModelType.GPT4O_MINI,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[str] = None,
        stream: bool = False
    ) -> ChatResponse:
        """
        Generate chat completion using specified model (non-streaming)
        
        Args:
            messages: List of chat messages
            model_type: Model to use (GPT4O or GPT4O_MINI)
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            tools: Available tools for function calling
            tool_choice: Tool choice strategy
            stream: Whether to stream response (ignored, use chat_completion_stream)
            
        Returns:
            ChatResponse with generated content
        """
        if not self.is_initialized:
            raise AzureOpenAIError("Azure OpenAI service not initialized")
        
        try:
            # Select model deployment
            deployment_name = self._get_deployment_name(model_type)
            
            # Set default parameters
            if temperature is None:
                temperature = settings.TEMPERATURE
            if max_tokens is None:
                max_tokens = self._get_max_tokens(model_type)
            
            # Prepare messages for API
            api_messages = [
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ]
            
            # Add system prompt if not present
            if not any(msg["role"] == "system" for msg in api_messages):
                api_messages.insert(0, {
                    "role": "system",
                    "content": settings.MEDICAL_SYSTEM_PROMPT
                })
            
            # Prepare request parameters
            request_params = {
                "model": deployment_name,
                "messages": api_messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": False
            }
            
            # Add tools if provided
            if tools and settings.ENABLE_TOOL_CALLING:
                request_params["tools"] = tools
                if tool_choice:
                    request_params["tool_choice"] = tool_choice
            
            logger.info(f"🤖 Generating completion with {model_type.value}")
            
            return await self._single_completion(request_params, model_type)
                
        except Exception as e:
            logger.error(f"❌ Chat completion failed: {str(e)}")
            raise AzureOpenAIError(f"Chat completion failed: {str(e)}")

    async def chat_completion_stream(
        self,
        messages: List[ChatMessage],
        model_type: ModelType = ModelType.GPT4O_MINI,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        tools: Optional[List[Dict[str, Any]]] = None,
        tool_choice: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """
        Generate streaming chat completion using specified model
        
        Args:
            messages: List of chat messages
            model_type: Model to use (GPT4O or GPT4O_MINI)
            temperature: Sampling temperature
            max_tokens: Maximum tokens to generate
            tools: Available tools for function calling
            tool_choice: Tool choice strategy
            
        Yields:
            Content chunks as they are generated
        """
        if not self.is_initialized:
            raise AzureOpenAIError("Azure OpenAI service not initialized")
        
        try:
            # Select model deployment
            deployment_name = self._get_deployment_name(model_type)
            
            # Set default parameters
            if temperature is None:
                temperature = settings.TEMPERATURE
            if max_tokens is None:
                max_tokens = self._get_max_tokens(model_type)
            
            # Prepare messages for API
            api_messages = [
                {"role": msg.role, "content": msg.content}
                for msg in messages
            ]
            
            # Add system prompt if not present
            if not any(msg["role"] == "system" for msg in api_messages):
                api_messages.insert(0, {
                    "role": "system",
                    "content": settings.MEDICAL_SYSTEM_PROMPT
                })
            
            # Prepare request parameters
            request_params = {
                "model": deployment_name,
                "messages": api_messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "stream": True
            }
            
            # Add tools if provided
            if tools and settings.ENABLE_TOOL_CALLING:
                request_params["tools"] = tools
                if tool_choice:
                    request_params["tool_choice"] = tool_choice
            
            logger.info(f"🌊 Streaming completion with {model_type.value}")
            
            async for chunk in self._stream_completion(request_params):
                yield chunk
                
        except Exception as e:
            logger.error(f"❌ Streaming completion failed: {str(e)}")
            raise AzureOpenAIError(f"Streaming completion failed: {str(e)}")
    
    async def _single_completion(
        self, 
        request_params: Dict[str, Any], 
        model_type: ModelType
    ) -> ChatResponse:
        """Generate single completion response"""
        response: ChatCompletion = await self.client.chat.completions.create(**request_params)
        
        choice: Choice = response.choices[0]
        message: ChatCompletionMessage = choice.message
        
        # Handle tool calls
        tool_calls = []
        if message.tool_calls:
            tool_calls = [
                {
                    "id": tool_call.id,
                    "type": tool_call.type,
                    "function": {
                        "name": tool_call.function.name,
                        "arguments": tool_call.function.arguments
                    }
                }
                for tool_call in message.tool_calls
            ]
        
        return ChatResponse(
            content=message.content or "",
            model=model_type,
            usage={
                "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                "total_tokens": response.usage.total_tokens if response.usage else 0
            },
            tool_calls=tool_calls,
            finish_reason=choice.finish_reason
        )
    
    async def _stream_completion(
        self, 
        request_params: Dict[str, Any]
    ) -> AsyncGenerator[str, None]:
        """Generate streaming completion response"""
        stream = await self.client.chat.completions.create(**request_params)
        async for chunk in stream:
            if chunk.choices and chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    
    def _get_deployment_name(self, model_type: ModelType) -> str:
        """Get Azure deployment name for model type"""
        if model_type == ModelType.GPT4O:
            return settings.GPT4O_DEPLOYMENT_NAME
        elif model_type == ModelType.GPT4O_MINI:
            return settings.GPT4O_MINI_DEPLOYMENT_NAME
        else:
            raise ValueError(f"Unsupported model type: {model_type}")
    
    def _get_max_tokens(self, model_type: ModelType) -> int:
        """Get max tokens for model type"""
        if model_type == ModelType.GPT4O:
            return settings.GPT4O_MAX_TOKENS
        elif model_type == ModelType.GPT4O_MINI:
            return settings.GPT4O_MINI_MAX_TOKENS
        else:
            return 2048
    
    async def generate_embeddings(
        self, 
        texts: List[str]
    ) -> List[List[float]]:
        """
        Generate embeddings for text chunks
        
        Args:
            texts: List of text strings to embed
            
        Returns:
            List of embedding vectors
        """
        if not self.is_initialized:
            raise AzureOpenAIError("Azure OpenAI service not initialized")
        
        try:
            response = await self.client.embeddings.create(
                model=settings.EMBEDDING_DEPLOYMENT_NAME,
                input=texts
            )
            
            embeddings = [data.embedding for data in response.data]
            logger.info(f"📊 Generated {len(embeddings)} embeddings")
            
            return embeddings
            
        except Exception as e:
            logger.error(f"❌ Embedding generation failed: {str(e)}")
            raise AzureOpenAIError(f"Embedding generation failed: {str(e)}")
    
    async def close(self) -> None:
        """Close Azure OpenAI client"""
        if self.client:
            await self.client.close()
            self.is_initialized = False
            logger.info("🔒 Azure OpenAI service closed")

# Global service instance
azure_openai_service = AzureOpenAIService()

