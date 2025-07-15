/**
 * Interface representing a chat message in the medical conversation
 *
 * @interface ChatMessage
 * @description Defines the structure for messages exchanged between user, AI assistant,
 * and system in the medical chat interface
 *
 * @example
 * ```typescript
 * const userMessage: ChatMessage = {
 *   role: 'user',
 *   content: '¿Cuáles son los síntomas de la hipertensión?',
 *   timestamp: new Date(),
 *   metadata: {
 *     tokens: 12,
 *     processingTime: 150
 *   }
 * };
 *
 * const aiResponse: ChatMessage = {
 *   role: 'assistant',
 *   content: 'La hipertensión puede presentar...',
 *   timestamp: new Date(),
 *   metadata: {
 *     model: 'gpt-4',
 *     tokens: 245,
 *     documents: [{ document_id: 'doc-123', title: 'Guía Hipertensión' }]
 *   }
 * };
 * ```
 */
export interface ChatMessage {
  /** Role of the message sender (user, assistant AI, or system) */
  role: 'user' | 'assistant' | 'system';

  /** Text content of the message */
  content: string;

  /** Optional timestamp when the message was created */
  timestamp?: Date;

  /** Optional metadata about the message processing */
  metadata?: ChatMetadata;
}

/**
 * Interface representing metadata about chat message processing
 *
 * @interface ChatMetadata
 * @description Contains additional information about how a chat message was processed,
 * including AI model details, performance metrics, and context information
 *
 * @example
 * ```typescript
 * const metadata: ChatMetadata = {
 *   model: 'gpt-4',
 *   tokens: 150,
 *   processingTime: 2500,
 *   documents: [{
 *     document_id: 'medical-guide-001',
 *     title: 'Protocolo de Emergencias',
 *     page: 15,
 *     relevance_score: 0.95
 *   }],
 *   coordinator: {
 *     classification: 'medical_consultation',
 *     agent_used: 'medical_specialist',
 *     patient_context_used: true,
 *     confidence: 0.92
 *   }
 * };
 * ```
 */
export interface ChatMetadata {
  /** AI model used for processing (e.g., 'gpt-4', 'gpt-3.5-turbo') */
  model?: string;

  /** Number of tokens used in processing */
  tokens?: number;

  /** Processing time in milliseconds */
  processingTime?: number;

  /** Referenced documents used for context */
  documents?: DocumentReference[];

  /** AI coordinator system information */
  coordinator?: CoordinatorInfo;
}

/**
 * Interface representing a reference to a document used in chat context
 *
 * @interface DocumentReference
 * @description Defines the structure for documents referenced during AI processing
 * to provide context for medical conversations
 *
 * @example
 * ```typescript
 * const docRef: DocumentReference = {
 *   document_id: 'medical-protocol-456',
 *   title: 'Protocolo de Diabetes Tipo 2',
 *   page: 23,
 *   relevance_score: 0.89
 * };
 * ```
 */
export interface DocumentReference {
  /** Unique identifier for the referenced document */
  document_id: string;

  /** Human-readable title of the document */
  title: string;

  /** Optional specific page number referenced */
  page?: number;

  /** Optional relevance score (0-1) for this reference */
  relevance_score?: number;
}

/**
 * Interface representing AI coordinator system information
 *
 * @interface CoordinatorInfo
 * @description Contains information about how the AI coordinator system classified
 * and routed the request to appropriate specialized agents
 *
 * @example
 * ```typescript
 * const coordinatorInfo: CoordinatorInfo = {
 *   classification: 'emergency_consultation',
 *   agent_used: 'emergency_specialist',
 *   patient_context_used: true,
 *   confidence: 0.96
 * };
 * ```
 */
export interface CoordinatorInfo {
  /** Classification category assigned to the request */
  classification: string;

  /** Specific AI agent that handled the request */
  agent_used: string;

  /** Whether patient context was used in processing */
  patient_context_used: boolean;

  /** Optional confidence score (0-1) for the classification */
  confidence?: number;
}

/**
 * Interface representing a chat request to the AI system
 *
 * @interface ChatRequest
 * @description Defines the structure for requests sent to the AI chat API
 * including message history and processing options
 *
 * @example
 * ```typescript
 * const chatRequest: ChatRequest = {
 *   messages: [
 *     { role: 'user', content: 'Hola, tengo una consulta médica' },
 *     { role: 'assistant', content: 'Hola, ¿en qué puedo ayudarte?' },
 *     { role: 'user', content: '¿Qué síntomas presenta la diabetes?' }
 *   ],
 *   patient_id: 'patient-123',
 *   session_id: 'd31b6cfd-b230-4693-8fbd-04edf36cf6e2',
 *   stream: true,
 *   include_context: true
 * };
 * ```
 */
export interface ChatRequest {
  /** Array of chat messages forming the conversation history */
  messages: ChatMessage[];

  /** Optional patient ID for medical context */
  patient_id?: string;

  /** Optional session ID for contextual chat */
  session_id?: string;

  /** Whether to stream the response in chunks */
  stream?: boolean;

  /** Whether to include patient context in processing */
  include_context?: boolean;
}

/**
 * Interface representing a chat ask request to the new streaming API
 *
 * @interface ChatAskRequest
 * @description Defines the structure for requests sent to the /api/v1/chat/ask endpoint
 * which handles session-based chat with document context
 *
 * @example
 * ```typescript
 * const chatAskRequest: ChatAskRequest = {
 *   session_id: 'd31b6cfd-b230-4693-8fbd-04edf36cf6e2',
 *   user_id: 'pedro',
 *   document_id: '68754a44c0010413757d6a39',
 *   question: 'Hola, ¿cómo puedo ayudarte?'
 * };
 * ```
 */
export interface ChatAskRequest {
  /** Session ID obtained from chat/sessions API */
  session_id: string;

  /** User ID for the chat session */
  user_id: string;

  /** Document ID for context */
  document_id: string;

  /** Question/message from the user */
  question: string;
}

/**
 * Interface representing streaming response chunks from the chat API
 *
 * @interface ChatStreamChunk
 * @description Defines the structure for streaming response chunks from /api/v1/chat/ask
 * which provides real-time AI responses with different chunk types
 *
 * @example
 * ```typescript
 * // Start chunk
 * const startChunk: ChatStreamChunk = {
 *   type: 'start',
 *   interaction_id: 'a7b5614c-dd9d-47f8-9404-64629f947cac',
 *   session_id: 'd31b6cfd-b230-4693-8fbd-04edf36cf6e2',
 *   question: 'Hola',
 *   started_at: '2025-07-14T17:10:18.855515'
 * };
 *
 * // Content chunk
 * const contentChunk: ChatStreamChunk = {
 *   type: 'content',
 *   content: 'Hola',
 *   interaction_id: 'a7b5614c-dd9d-47f8-9404-64629f947cac'
 * };
 *
 * // End chunk
 * const endChunk: ChatStreamChunk = {
 *   type: 'end',
 *   interaction_id: 'a7b5614c-dd9d-47f8-9404-64629f947cac',
 *   completed_at: '2025-07-14T17:10:21.959543'
 * };
 * ```
 */
export interface ChatStreamChunk {
  /** Type of streaming chunk */
  type: 'start' | 'content' | 'end';

  /** Unique interaction identifier */
  interaction_id: string;

  /** Session ID for context (start chunk only) */
  session_id?: string;

  /** Original question (start chunk only) */
  question?: string;

  /** Timestamp when interaction started (start chunk only) */
  started_at?: string;

  /** Content chunk text (content chunk only) */
  content?: string;

  /** Timestamp when interaction completed (end chunk only) */
  completed_at?: string;
}

/**
 * Interface representing a response from the AI chat system
 *
 * @interface ChatResponse
 * @description Defines the structure for responses received from the AI chat API
 *
 * @example
 * ```typescript
 * const response: ChatResponse = {
 *   content: 'Los síntomas de la diabetes incluyen...',
 *   metadata: {
 *     model: 'gpt-4',
 *     tokens: 180,
 *     processingTime: 2200,
 *     documents: [...]
 *   }
 * };
 *
 * // Error response example
 * const errorResponse: ChatResponse = {
 *   content: '',
 *   error: 'Unable to process request: Rate limit exceeded'
 * };
 * ```
 */
export interface ChatResponse {
  /** AI-generated response content */
  content: string;

  /** Optional metadata about the response processing */
  metadata?: ChatMetadata;

  /** Optional error message if processing failed */
  error?: string;
}

/**
 * Interface representing a streaming chunk from AI responses
 *
 * @interface StreamChunk
 * @description Defines the structure for individual chunks received during streaming responses
 *
 * @example
 * ```typescript
 * // Content chunk
 * const contentChunk: StreamChunk = {
 *   type: 'content',
 *   content: 'Los síntomas más comunes...'
 * };
 *
 * // Metadata chunk
 * const metadataChunk: StreamChunk = {
 *   type: 'metadata',
 *   metadata: {
 *     model: 'gpt-4',
 *     tokens: 150
 *   }
 * };
 *
 * // Done chunk
 * const doneChunk: StreamChunk = {
 *   type: 'done'
 * };
 *
 * // Error chunk
 * const errorChunk: StreamChunk = {
 *   type: 'error',
 *   error: 'Network timeout occurred'
 * };
 * ```
 */
export interface StreamChunk {
  /** Type of chunk being received */
  type: 'content' | 'metadata' | 'error' | 'done';

  /** Partial content for content chunks */
  content?: string;

  /** Metadata information for metadata chunks */
  metadata?: ChatMetadata;

  /** Error message for error chunks */
  error?: string;
}

/**
 * Interface representing a chat session in the medical system
 *
 * @interface ChatSession
 * @description Defines the structure for chat sessions that link patients with documents
 * and maintain conversation context for medical consultations
 *
 * @example
 * ```typescript
 * const session: ChatSession = {
 *   session_id: 'd31b6cfd-b230-4693-8fbd-04edf36cf6e2',
 *   user_id: 'pedro',
 *   document_id: '68754a44c0010413757d6a39',
 *   session_name: 'Consulta María Pérez',
 *   is_active: true,
 *   created_at: '2025-07-14T17:04:11.781842',
 *   last_interaction_at: '2025-07-14T17:04:11.781842',
 *   interaction_count: 0
 * };
 * ```
 */
export interface ChatSession {
  /** Unique session identifier */
  session_id: string;

  /** User ID who created the session */
  user_id: string;

  /** Document ID associated with the session */
  document_id: string;

  /** Human-readable session name */
  session_name: string;

  /** Whether the session is currently active */
  is_active: boolean;

  /** ISO timestamp when the session was created */
  created_at: string;

  /** ISO timestamp of the last interaction */
  last_interaction_at: string;

  /** Number of interactions in this session */
  interaction_count: number;
}

/**
 * Interface representing a request to create a new chat session
 *
 * @interface ChatSessionRequest
 * @description Defines the structure for creating new chat sessions
 *
 * @example
 * ```typescript
 * const sessionRequest: ChatSessionRequest = {
 *   user_id: 'pedro',
 *   document_id: '68754a44c0010413757d6a39',
 *   session_name: 'Consulta María Pérez'
 * };
 * ```
 */
export interface ChatSessionRequest {
  /** User ID creating the session */
  user_id: string;

  /** Document ID to associate with the session */
  document_id: string;

  /** Human-readable session name */
  session_name: string;
}

/**
 * Interface representing a response from chat session operations
 *
 * @interface ChatSessionResponse
 * @description Defines the structure for responses from chat session API endpoints
 *
 * @example
 * ```typescript
 * const response: ChatSessionResponse = {
 *   session_id: 'd31b6cfd-b230-4693-8fbd-04edf36cf6e2',
 *   user_id: 'pedro',
 *   document_id: '68754a44c0010413757d6a39',
 *   session_name: 'Consulta María Pérez',
 *   is_active: true,
 *   created_at: '2025-07-14T17:04:11.781842',
 *   last_interaction_at: '2025-07-14T17:04:11.781842',
 *   interaction_count: 0
 * };
 * ```
 */
export interface ChatSessionResponse extends ChatSession {}
