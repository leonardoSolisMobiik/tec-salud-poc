/**
 * Generic API response wrapper interface
 * 
 * @template T - Type of the response data
 * @interface ApiResponse
 * @description Standard wrapper for all API responses providing consistent structure
 * for data, error handling, and status information across the application
 * 
 * @example
 * ```typescript
 * // Success response
 * const successResponse: ApiResponse<Patient[]> = {
 *   data: [patient1, patient2],
 *   status: 200,
 *   message: 'Patients retrieved successfully'
 * };
 * 
 * // Error response
 * const errorResponse: ApiResponse<null> = {
 *   error: 'Patient not found',
 *   status: 404,
 *   message: 'The requested patient could not be found'
 * };
 * ```
 */
export interface ApiResponse<T> {
  /** Response data of the specified type (present on success) */
  data?: T;
  
  /** Error message (present on failure) */
  error?: string;
  
  /** Human-readable message describing the response */
  message?: string;
  
  /** HTTP status code of the response */
  status: number;
}

/**
 * Interface representing the health check response from the API
 * 
 * @interface HealthCheckResponse
 * @description Defines the structure for API health check responses including
 * system status, version information, and service availability status
 * 
 * @example
 * ```typescript
 * const healthCheck: HealthCheckResponse = {
 *   status: 'healthy',
 *   version: '1.0.0',
 *   timestamp: '2024-01-15T10:30:00Z',
 *   services: {
 *     database: true,
 *     azure_openai: true,
 *     chroma: false
 *   }
 * };
 * 
 * // Check if all services are healthy
 * const allHealthy = Object.values(healthCheck.services || {}).every(Boolean);
 * ```
 */
export interface HealthCheckResponse {
  /** Overall system health status ('healthy', 'degraded', 'unhealthy') */
  status: string;
  
  /** API version string */
  version: string;
  
  /** ISO timestamp of the health check */
  timestamp: string;
  
  /** Optional detailed status of individual services */
  services?: {
    /** Database connectivity status */
    database: boolean;
    /** Azure OpenAI service availability */
    azure_openai: boolean;
    /** Chroma vector database status */
    chroma: boolean;
  };
}

/**
 * Interface representing Azure OpenAI specific health check response
 * 
 * @interface AzureOpenAIHealthResponse
 * @description Defines the structure for Azure OpenAI service health checks
 * including model availability and deployment status information
 * 
 * @example
 * ```typescript
 * const aiHealthCheck: AzureOpenAIHealthResponse = {
 *   status: 'healthy',
 *   gpt4o_available: true,
 *   gpt4o_mini_available: true,
 *   embeddings_available: false,
 *   models_info: {
 *     'gpt-4o': {
 *       deployment_name: 'gpt-4o-prod',
 *       status: 'running'
 *     },
 *     'gpt-4o-mini': {
 *       deployment_name: 'gpt-4o-mini-dev',
 *       status: 'running'
 *     }
 *   }
 * };
 * 
 * // Check if medical chat is available
 * if (aiHealthCheck.gpt4o_available) {
 *   console.log('Medical chat service is available');
 * }
 * ```
 */
export interface AzureOpenAIHealthResponse {
  /** Overall Azure OpenAI service status */
  status: string;
  
  /** Whether GPT-4o model is available for medical consultations */
  gpt4o_available: boolean;
  
  /** Whether GPT-4o Mini model is available for quick queries */
  gpt4o_mini_available: boolean;
  
  /** Whether embedding models are available for document search */
  embeddings_available: boolean;
  
  /** Optional detailed information about deployed models */
  models_info?: {
    /** Model configuration keyed by model name */
    [key: string]: {
      /** Azure deployment name for the model */
      deployment_name: string;
      /** Current status of the model deployment */
      status: string;
    };
  };
}

/**
 * Interface representing error responses from the API
 * 
 * @interface ErrorResponse
 * @description Standardized error response structure for handling API errors
 * consistently across the application with detailed error information
 * 
 * @example
 * ```typescript
 * const errorResponse: ErrorResponse = {
 *   error: 'Validation failed',
 *   detail: 'Patient ID must be a valid UUID format',
 *   status_code: 400,
 *   timestamp: '2024-01-15T10:30:00Z'
 * };
 * 
 * // Handle different error types
 * switch (errorResponse.status_code) {
 *   case 400:
 *     console.error('Bad request:', errorResponse.detail);
 *     break;
 *   case 404:
 *     console.error('Not found:', errorResponse.error);
 *     break;
 *   case 500:
 *     console.error('Server error:', errorResponse.error);
 *     break;
 * }
 * ```
 */
export interface ErrorResponse {
  /** Brief error message describing what went wrong */
  error: string;
  
  /** Optional detailed explanation of the error */
  detail?: string;
  
  /** HTTP status code associated with the error */
  status_code: number;
  
  /** Optional ISO timestamp when the error occurred */
  timestamp?: string;
}