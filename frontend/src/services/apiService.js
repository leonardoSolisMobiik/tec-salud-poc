/**
 * API Service
 * Handles all communication with the TecSalud backend
 */

const API_BASE_URL = 'http://localhost:8000/api/v1';

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Helper method for making requests
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Chat endpoints
  async sendMedicalChat(messages, options = {}) {
    const payload = {
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      model_type: options.modelType || 'gpt-4o',
      temperature: options.temperature || 0.1,
      max_tokens: options.maxTokens || 2048,
      patient_id: options.patientId || null,
      include_context: options.includeContext !== false,
      stream: false
    };

    return this.request('/chat/medical', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async sendQuickQuery(messages, options = {}) {
    const payload = {
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      model_type: 'gpt-4o',
      temperature: options.temperature || 0.3,
      max_tokens: 1024,
      stream: false
    };

    return this.request('/chat/quick', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async analyzeMedicalCase(messages, options = {}) {
    const payload = {
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      model_type: 'gpt-4o',
      temperature: 0.1,
      max_tokens: options.maxTokens || 4096,
      patient_id: options.patientId || null,
      include_context: options.includeContext !== false,
      stream: false
    };

    return this.request('/chat/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Streaming chat
  async sendMedicalChatStream(messages, options = {}) {
    const payload = {
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      model_type: options.modelType || 'gpt-4o',
      temperature: options.temperature || 0.1,
      max_tokens: options.maxTokens || 2048,
      patient_id: options.patientId || null,
      include_context: options.includeContext !== false
    };

    console.log('🚀 Sending streaming request with payload:', payload);

    const response = await fetch(`${this.baseURL}/chat/medical/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let streamComplete = false;

    while (true && !streamComplete) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('📡 Reader done, breaking loop');
        break;
      }
      
      const chunk = decoder.decode(value);
      console.log('📥 Raw chunk received:', chunk.length, 'bytes');
      
      // The issue is that events are coming with literal \n\n not actual newlines
      // Let's handle this differently - use regex to find all data: lines
      const dataRegex = /data: ({[^}]+})/g;
      let match;
      
      while ((match = dataRegex.exec(chunk)) !== null) {
        const data = match[1];
        console.log('📊 Found data:', data);
        
        try {
          const parsed = JSON.parse(data);
          console.log('✅ Parsed:', parsed);
          
          if (parsed.content !== undefined && parsed.content !== '') {
            console.log('✅ Chunk:', parsed.content);
            options.onChunk(parsed.content);
          } else if (parsed.is_complete) {
            console.log('✅ Streaming complete');
            streamComplete = true;
            break;
          }
        } catch (e) {
          console.error('❌ Parse error:', e.message);
          console.error('   Data was:', data);
        }
      }
    }
    
    console.log('🏁 Stream processing finished');
  }

  // Patient endpoints
  async getPatients(limit = 10, offset = 0) {
    return this.request(`/patients?limit=${limit}&offset=${offset}`);
  }

  async getRecentPatients(limit = 10, doctorId = 1) {
    return this.request(`/patients/recent?limit=${limit}&doctor_id=${doctorId}`);
  }

  async searchPatients(query, limit = 10, offset = 0) {
    return this.request(`/patients/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`);
  }

  async recordPatientInteraction(patientId, interactionType = 'view', summary = null, doctorId = 1) {
    const payload = {
      interaction_type: interactionType,
      doctor_id: doctorId
    };
    if (summary) {
      payload.summary = summary;
    }
    
    return this.request(`/patients/${patientId}/interaction`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getPatient(patientId) {
    return this.request(`/patients/${patientId}`);
  }

  async getPatientDocuments(patientId, documentType = null, limit = 20) {
    let url = `/patients/${patientId}/documents?limit=${limit}`;
    if (documentType) {
      url += `&document_type=${encodeURIComponent(documentType)}`;
    }
    return this.request(url);
  }

  async getPatientTimeline(patientId, limit = 50) {
    return this.request(`/patients/${patientId}/timeline?limit=${limit}`);
  }

  async getPatientSummary(patientId) {
    return this.request(`/patients/${patientId}/summary`);
  }

  // Document endpoints
  async uploadDocument(file, patientId, documentType = 'general', title = null) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientId);
    formData.append('document_type', documentType);
    if (title) {
      formData.append('title', title);
    }

    const response = await fetch(`${this.baseURL}/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Upload failed: ${response.status}`);
    }

    return await response.json();
  }

  async analyzeDocument(documentId, analysisType = 'summary', includeContext = true) {
    const payload = {
      document_id: documentId,
      analysis_type: analysisType,
      include_context: includeContext
    };

    return this.request('/documents/analyze', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getDocument(documentId) {
    return this.request(`/documents/${documentId}`);
  }

  async deleteDocument(documentId) {
    return this.request(`/documents/${documentId}`, {
      method: 'DELETE',
    });
  }

  async listDocuments(patientId = null, documentType = null, limit = 20, offset = 0) {
    let url = `/documents?limit=${limit}&offset=${offset}`;
    if (patientId) {
      url += `&patient_id=${encodeURIComponent(patientId)}`;
    }
    if (documentType) {
      url += `&document_type=${encodeURIComponent(documentType)}`;
    }
    return this.request(url);
  }

  async searchDocuments(query, patientId = null, documentType = null, limit = 10) {
    const payload = {
      query,
      patient_id: patientId,
      document_type: documentType,
      limit
    };

    return this.request('/documents/search', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Health check endpoints
  async healthCheck() {
    return this.request('/health');
  }

  async detailedHealthCheck() {
    return this.request('/health/detailed');
  }

  async azureOpenAIHealth() {
    return this.request('/health/azure-openai');
  }

  async chromaHealth() {
    return this.request('/health/chroma');
  }

  // Available models
  async getAvailableModels() {
    return this.request('/chat/models');
  }
}

// Create singleton instance
const apiService = new ApiService();

export default apiService;

