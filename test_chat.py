#!/usr/bin/env python3
"""
Simple test script to verify chat functionality
"""

import asyncio
import aiohttp
import json

async def test_chat():
    """Test the chat endpoint"""
    url = "http://localhost:8000/api/v1/chat/medical"
    
    payload = {
        "messages": [
            {
                "role": "user",
                "content": "¿Qué es la diabetes?"
            }
        ],
        "model_type": "gpt-4o",
        "temperature": 0.1,
        "max_tokens": 500,
        "patient_id": None,
        "include_context": False
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(url, json=payload) as response:
                if response.status == 200:
                    result = await response.json()
                    print("✅ Chat test successful!")
                    print(f"Response: {result['content'][:100]}...")
                    return True
                else:
                    error_text = await response.text()
                    print(f"❌ Chat test failed: {response.status}")
                    print(f"Error: {error_text}")
                    return False
                    
    except Exception as e:
        print(f"❌ Chat test error: {str(e)}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_chat())
    exit(0 if success else 1)