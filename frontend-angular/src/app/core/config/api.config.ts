import { environment } from '@environments/environment';

/**
 * API Configuration object for TecSalud backend communication
 * 
 * @description Centralized configuration for all API endpoints, timeouts, headers,
 * and development settings. Provides type-safe endpoint URLs and standardized
 * request configuration for the medical application.
 * 
 * @example
 * ```typescript
 * import { API_CONFIG } from '@core/config';
 * 
 * // Use configured endpoints
 * const patientsUrl = API_CONFIG.endpoints.patients;
 * const patientUrl = API_CONFIG.endpoints.patientById('patient-123');
 * 
 * // Access configuration
 * const timeout = API_CONFIG.timeout;
 * const headers = API_CONFIG.headers;
 * 
 * // Check development settings
 * if (API_CONFIG.development.enableDebug) {
 *   console.log('Debug mode enabled');
 * }
 * ```
 * 
 * @since 1.0.0
 */
export const API_CONFIG = {
  /** Base URL for API requests from environment configuration */
  baseUrl: environment.apiUrl,
  
  /** Request timeout in milliseconds (default: 30 seconds) */
  timeout: environment.apiTimeout || 30000,
  
  /** Number of retry attempts for failed requests (default: 1) */
  retryAttempts: environment.retryAttempts || 1,
  
  /**
   * API endpoint definitions organized by functional areas
   * 
   * @description Contains all API endpoint URLs used throughout the application.
   * Includes dynamic endpoint functions for parameterized URLs.
   */
  endpoints: {
    /**
     * Health check endpoints for monitoring system status
     */
    /** General API health check endpoint */
    health: '/api/v1/health',
    /** Azure OpenAI service health check endpoint */
    healthAzure: '/api/v1/health/azure-openai',
    
    /**
     * Patient management endpoints
     */
    /** Base patients endpoint for listing and creating patients */
    patients: '/api/v1/patients',
    /** Patient search endpoint for finding patients by query */
    patientSearch: '/api/v1/patients/search',
    /** 
     * Dynamic endpoint for specific patient operations
     * @param id - Patient unique identifier
     * @returns Formatted endpoint URL for patient operations
     */
    patientById: (id: string) => `/api/v1/patients/${id}`,
    /** 
     * Dynamic endpoint for patient interaction recording
     * @param id - Patient unique identifier
     * @returns Formatted endpoint URL for patient interactions
     */
    patientInteraction: (id: string) => `/api/v1/patients/${id}/interaction`,
    
    /**
     * Chat and AI communication endpoints
     */
    /** Medical chat endpoint for AI consultations with patient context */
    medicalChat: '/api/v1/chat/medical',
    /** Quick chat endpoint for general medical queries without patient context */
    quickChat: '/api/v1/chat/quick',
    /** Case analysis endpoint for AI-powered patient case analysis */
    analyzeCase: '/api/v1/chat/analyze-case',
    /** Streaming chat endpoint for real-time AI responses */
    streamChat: '/api/v1/chat/stream',
    
    /**
     * Document management endpoints
     */
    /** Base documents endpoint for listing and searching documents */
    documents: '/api/v1/documents',
    /** Document upload endpoint for file uploads */
    documentUpload: '/api/v1/documents/upload',
    /** 
     * Dynamic endpoint for specific document operations
     * @param id - Document unique identifier
     * @returns Formatted endpoint URL for document operations
     */
    documentById: (id: string) => `/api/v1/documents/${id}`,
    /** Document search endpoint for content-based document search */
    documentSearch: '/api/v1/documents/search',
    
    /**
     * Administration endpoints
     */
    /** Admin users management endpoint */
    adminUsers: '/api/v1/admin/users',
    /** Admin reports generation endpoint */
    adminReports: '/api/v1/admin/reports',
    /** Admin bulk upload endpoint for batch operations */
    adminBulkUpload: '/api/v1/admin/bulk-upload',
    
    /**
     * Analytics and reporting endpoints
     */
    /** Base analytics endpoint for system metrics */
    analytics: '/api/v1/analytics',
    /** Usage analytics endpoint for application usage statistics */
    analyticsUsage: '/api/v1/analytics/usage',
    /** Analytics reports endpoint for detailed reporting */
    analyticsReports: '/api/v1/analytics/reports'
  },
  
  /**
   * Standard HTTP headers for API requests
   * 
   * @description Default headers applied to all API requests through the HTTP interceptor.
   * Ensures consistent content type and API compatibility.
   */
  headers: {
    /** Content type for JSON API requests */
    'Content-Type': 'application/json',
    /** Accept header for JSON responses */
    'Accept': 'application/json',
    /** XMLHttpRequest header for AJAX identification */
    'X-Requested-With': 'XMLHttpRequest'
  },
  
  /**
   * Development environment specific settings
   * 
   * @description Configuration flags and settings that only apply during development.
   * Controlled by environment variables and debug flags.
   */
  development: {
    /** Whether to enable debug logging for API requests and responses */
    enableDebug: environment.debug?.showApiLogs || false
  }
}; 