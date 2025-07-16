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
    health: '/health',
    /** Azure OpenAI service health check endpoint */
    healthAzure: '/health/azure-openai',

    /**
     * Patient management endpoints
     */
    /** Base patients endpoint for listing and creating patients */
    patients: '/patients',
    /** Patient search endpoint for finding patients by query with fuzzy matching */
    patientSearch: '/search/patients',
    /**
     * Dynamic endpoint for specific patient operations
     * @param id - Patient unique identifier
     * @returns Formatted endpoint URL for patient operations
     */
    patientById: (id: string) => `/patients/${id}`,
    // patientInteraction: (id: string) => `/patients/${id}/interaction`, // TODO: Endpoint not implemented in backend

    /**
     * Chat and AI communication endpoints
     */
    /** Medical chat endpoint for AI consultations with patient context */
    medicalChat: '/chat/medical',
    /** Quick chat endpoint for general medical queries without patient context */
    quickChat: '/chat/quick',
    /** Case analysis endpoint for AI-powered patient case analysis */
    analyzeCase: '/chat/analyze-case',
    /** Streaming chat endpoint for real-time AI responses */
    streamChat: '/chat/stream',

    /**
     * Document management endpoints
     */
    /** Base documents endpoint for listing and searching documents */
    documents: '/documents',
    /** Document upload endpoint for file uploads */
    documentUpload: '/documents/upload',
    /**
     * Dynamic endpoint for specific document operations
     * @param id - Document unique identifier
     * @returns Formatted endpoint URL for document operations
     */
    documentById: (id: string) => `/documents/${id}`,
    /** Document search endpoint for content-based document search */
    documentSearch: '/documents/search',

    /**
     * Administration endpoints
     */
    /** Admin users management endpoint */
    adminUsers: '/admin/users',
    /** Admin reports generation endpoint */
    adminReports: '/admin/reports',
    /** Admin bulk upload endpoint for batch operations */
    adminBulkUpload: '/admin/bulk-upload',

    /**
     * Analytics and reporting endpoints
     */
    /** Base analytics endpoint for system metrics */
    analytics: '/analytics',
    /** Usage analytics endpoint for application usage statistics */
    analyticsUsage: '/analytics/usage',
    /** Analytics reports endpoint for detailed reporting */
    analyticsReports: '/analytics/reports'
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
