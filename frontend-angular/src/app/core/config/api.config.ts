import { environment } from '@environments/environment';

export const API_CONFIG = {
  baseUrl: environment.apiUrl,
  timeout: environment.apiTimeout || 30000,
  retryAttempts: environment.retryAttempts || 1,
  
  // API Endpoints
  endpoints: {
    // Health Check
    health: '/api/v1/health',
    healthAzure: '/api/v1/health/azure-openai',
    
    // Patients
    patients: '/api/v1/patients',
    patientSearch: '/api/v1/patients/search',
    patientById: (id: string) => `/api/v1/patients/${id}`,
    patientInteraction: (id: string) => `/api/v1/patients/${id}/interaction`,
    
    // Chat
    medicalChat: '/api/v1/chat/medical',
    quickChat: '/api/v1/chat/quick',
    analyzeCase: '/api/v1/chat/analyze-case',
    streamChat: '/api/v1/chat/stream',
    
    // Documents
    documents: '/api/v1/documents',
    documentUpload: '/api/v1/documents/upload',
    documentById: (id: string) => `/api/v1/documents/${id}`,
    documentSearch: '/api/v1/documents/search',
    
    // Admin
    adminUsers: '/api/v1/admin/users',
    adminReports: '/api/v1/admin/reports',
    adminBulkUpload: '/api/v1/admin/bulk-upload',
    
    // Analytics
    analytics: '/api/v1/analytics',
    analyticsUsage: '/api/v1/analytics/usage',
    analyticsReports: '/api/v1/analytics/reports'
  },
  
  // Request Headers
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  
  // Development settings
  development: {
    mockData: environment.enableMockData || false,
    enableLogging: environment.enableLogging || false,
    enableDebug: environment.debug?.showApiLogs || false
  }
}; 