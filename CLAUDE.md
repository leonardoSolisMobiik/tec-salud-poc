# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TecSalud is a medical virtual assistant application that integrates Azure OpenAI (GPT-4o/4o-mini) with Chroma vector database for intelligent medical consultations, clinical record analysis, and medical document management.

**Project Evolution**: This application evolved from an initial frontend mockup specification (detailed in `docs/PRD.txt`) to a full implementation with real backend integration. The original PRD outlined a complete React+Vite mockup with mock data, but the project has since been enhanced with a functional FastAPI backend using Azure OpenAI services.

**Medical Context**: The system is specifically designed around Dr. Solis's workflow patterns and TecSalud's 11-year historical medical records stored in PDF format. The UX design (documented in `docs/Guía de Experiencia de Usuario.md`) emphasizes the "copiloto médico" (medical copilot) concept - an intelligent assistant that provides instant, contextual access to patient information with complete traceability and verification capabilities.

## Architecture

### Backend (FastAPI)
- **Agent-based AI system**: Medical Coordinator routes queries to specialized agents (Diagnostic, Quick Response, Document Analysis, Search)
- **Azure OpenAI Integration**: Uses GPT-4o for complex analysis, GPT-4o-mini for quick responses
- **Chroma Vector Database**: Semantic search in medical records using embeddings
- **SQLite Database**: Patient records and metadata storage
- **Pydantic Models**: Type-safe data validation and serialization

### Frontend (React + Vite)
- **Styled Components**: CSS-in-JS theming with medical color palette
- **Zustand**: State management for UI and medical data
- **ReactMarkdown**: Renders AI responses with proper medical formatting
- **Framer Motion**: Smooth animations and transitions

### Key Components
- **Medical Coordinator**: Routes queries based on classification (diagnostic/quick/document/search/general)
- **Specialized Agents**: Each agent has its own Azure OpenAI service instance and initialization logic
- **API Service**: Frontend service with streaming support for real-time chat responses
- **Theme System**: Medical-focused styling with blue primary colors and professional typography

## Development Commands

### Backend Development
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Testing
```bash
# Backend
cd backend && pytest tests/ -v

# Frontend
cd frontend && npm test
```

### Linting and Formatting
```bash
# Backend
cd backend
black app/
isort app/
flake8 app/
mypy app/

# Frontend
cd frontend
npm run lint
```

## Critical Configuration

### Environment Variables
Required in `.env` file in project root:
```env
# Azure OpenAI (REQUIRED)
AZURE_OPENAI_API_KEY=your_api_key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_VERSION=2025-03-01-preview

# Model Deployments (must match Azure deployment names)
GPT4O_DEPLOYMENT_NAME=gpt-4o
GPT4O_MINI_DEPLOYMENT_NAME=gpt-4o-mini
EMBEDDING_DEPLOYMENT_NAME=text-embedding-3-large

# Application
ENVIRONMENT=development
DEBUG=true
```

### Azure OpenAI Setup
- Requires deployments for: `gpt-4o`, `gpt-4o-mini`, `text-embedding-3-large`
- Endpoint format: `https://resource-name.openai.azure.com/`
- API version must match deployed models capabilities

## Agent Architecture Patterns

### Agent Initialization
All agents follow this pattern:
```python
class SpecializedAgent:
    def __init__(self):
        self.azure_openai_service = AzureOpenAIService()
    
    async def initialize(self):
        if not self.azure_openai_service.is_initialized:
            await self.azure_openai_service.initialize()
```

### Coordinator Pattern
The Medical Coordinator:
1. Classifies queries using GPT-4o with function calling
2. Routes to appropriate specialized agent
3. Handles fallback to general responses
4. Manages agent initialization and error handling

### Model Type Handling
Always convert string model types to enum in coordinator:
```python
if isinstance(model_type, str):
    model_type = ModelType.GPT4O if model_type == "gpt-4o" else ModelType.GPT4O_MINI
```

## Frontend Patterns

### API Service Usage
```javascript
// Non-streaming
const response = await apiService.sendMedicalChat(messages);

// Streaming with real-time chunks
await apiService.sendMedicalChatStream(messages, {
  onChunk: (chunk) => updateMessage(chunk)
});
```

### Markdown Rendering
AI responses are rendered with ReactMarkdown:
- Escape sequences `\\n` are converted to actual newlines
- Medical-themed styling for headers, lists, and emphasis
- Custom components for consistent medical formatting

### State Management
```javascript
// UI State (Zustand)
const { activeView, setActiveView } = useUIStore();

// Medical responses include metadata field for coordinator info
response.metadata = {
  coordinator: {
    classification: query_classification,
    agent_used: "diagnostic",
    patient_context_used: true
  }
}
```

### Premium UI System

#### Medical Icon Library
- Custom SVG medical icons with micro-animations
- Consistent medical branding (stethoscope, heart, brain, etc.)
- Hover states and loading animations
- Located in `src/components/ui/icons/`

#### Conversational Loader System
- Premium AI thinking animations with medical context
- Heartbeat pulse, DNA helix, synapse patterns
- Contextual messages and progress indicators
- Component: `ConversationalLoader.jsx`

#### Micro-animations
- Button hover states with medical color transitions
- Input focus effects with blue glow
- Card hover elevations with medical shadows
- Stagger animations for lists and patient cards

#### Theme Extensions
- Premium gradients for medical contexts
- Glassmorphism effects for floating panels
- Advanced shadow system with medical glow effects
- Particle system for success states and celebrations

## Common Development Tasks

### Adding New Agent
1. Create agent class in `backend/app/agents/`
2. Implement `initialize()` method
3. Add to coordinator imports and initialization
4. Update routing logic in `_route_to_agent()`

### Backend Service Changes
1. Stop backend: `lsof -ti:8000 | xargs kill -9`
2. Make changes
3. Restart: `cd backend && source venv/bin/activate && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000`

### Debugging Agent Issues
- Check agent initialization in coordinator
- Verify Azure OpenAI service has `self.` prefix
- Ensure model type conversion from string to enum
- Check `.env` variable names match config.py expectations

### API Endpoints
- Medical chat: `POST /api/v1/chat/medical`
- Quick responses: `POST /api/v1/chat/quick` 
- Streaming: `POST /api/v1/chat/medical/stream`
- Health checks: `GET /api/v1/health/azure-openai`
- API docs: `http://localhost:8000/docs`

## User Experience Patterns

### Core UX Principles (from docs/Guía de Experiencia de Usuario.md)
1. **Contexto Activo Único**: System maintains single active patient context throughout session
2. **Transparencia y Verificabilidad**: All responses include clickable document references with exact page numbers
3. **Eficiencia en Flujo de Trabajo**: Sub-500ms autocompletado, sub-4s responses, hands-free voice commands
4. **Feedback Visual Inmediato**: Header color changes, toast notifications, loading indicators

### Key Interaction Flows
1. **Patient Selection**: Search → Autocompletado → Context Activation → Visual Feedback
2. **Conversational Query**: Question → Processing → Structured Response + Document Badges
3. **Document Verification**: Badge Click → PDF Sidebar → Page Navigation → Return to Chat
4. **Voice Commands**: "Copiloto, cambia al paciente [nombre]" → Confirmation → Visual Feedback

### Frontend Layout Specifications (from docs/PRD.txt)
- **Panel Izquierdo (300px)**: Recent patients, search functionality
- **Panel Central (adaptable, max 1200px)**: Patient header + chat interface
- **Panel Derecho (400px, deslizable)**: PDF viewer with navigation controls
- **Responsive Breakpoints**: 768px (tablet), 1024px (desktop)

## Troubleshooting

### Common Issues
1. **"Azure OpenAI service not initialized"**: Check agent initialization chain
2. **"'str' object has no attribute 'value'"**: Ensure model_type enum conversion
3. **Markdown not rendering**: Check `\\n` to `\n` conversion in frontend
4. **Agent import errors**: Verify all agents use `self.azure_openai_service`

### UX-Related Issues
5. **Context not activating**: Verify header color change to blue (`#E3F2FD`) and toast notification
6. **Autocompletado slow**: Should respond in < 500ms, check debounce implementation
7. **PDF viewer not opening**: Check badge click handlers and sidebar slide animation
8. **Voice commands not working**: Verify "Copiloto" keyword recognition and confirmation flow

### Development URLs
- Frontend: `http://localhost:5173` (Vite dev server)
- Backend API: `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Chroma DB: `http://localhost:8001` (when running via Docker)

## Documentation References
- **UX Specifications**: `docs/Guía de Experiencia de Usuario.md` - Complete interaction flows and microinteractions
- **Frontend Mockup**: `docs/PRD.txt` - Original React+Vite component specifications and layout details
- **Environment Config**: `.env` - Azure OpenAI credentials and model deployment names
- **Backend Config**: `backend/app/core/config.py` - Application settings and medical prompts