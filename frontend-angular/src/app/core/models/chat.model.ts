export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
  metadata?: ChatMetadata;
}

export interface ChatMetadata {
  model?: string;
  tokens?: number;
  processingTime?: number;
  documents?: DocumentReference[];
  coordinator?: CoordinatorInfo;
}

export interface DocumentReference {
  document_id: string;
  title: string;
  page?: number;
  relevance_score?: number;
}

export interface CoordinatorInfo {
  classification: string;
  agent_used: string;
  patient_context_used: boolean;
  confidence?: number;
}

export interface ChatRequest {
  messages: ChatMessage[];
  patient_id?: string;
  stream?: boolean;
  include_context?: boolean;
}

export interface ChatResponse {
  content: string;
  metadata?: ChatMetadata;
  error?: string;
}

export interface StreamChunk {
  type: 'content' | 'metadata' | 'error' | 'done';
  content?: string;
  metadata?: ChatMetadata;
  error?: string;
}