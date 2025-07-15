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

/**
 * Interface for batch upload request
 *
 * @interface BatchUploadRequest
 * @description Defines the structure for batch document upload requests
 * including files, user information, and batch metadata
 *
 * @example
 * ```typescript
 * const batchRequest: BatchUploadRequest = {
 *   files: [file1, file2, file3],
 *   user_id: 'pedro',
 *   batch_description: 'Expedientes médicos enero 2024',
 *   batch_tags: 'enero,2024,consultas'
 * };
 * ```
 */
export interface BatchUploadRequest {
  /** Array of files to upload */
  files: File[];

  /** User ID for the batch upload */
  user_id: string;

  /** Optional description for the batch */
  batch_description?: string;

  /** Optional tags for the batch */
  batch_tags?: string;
}

/**
 * Interface for storage information
 *
 * @interface StorageInfo
 * @description Contains information about file storage in Azure Blob Storage
 */
export interface StorageInfo {
  /** Blob name in Azure Storage */
  blob_name: string;

  /** Public URL of the stored file */
  url: string;

  /** File size in bytes */
  file_size: number;

  /** MIME content type */
  content_type: string;

  /** Storage status */
  status: string;

  /** Original index in the batch */
  original_index: number;

  /** Original filename */
  filename: string;
}

/**
 * Interface for OCR processing summary
 *
 * @interface OCRSummary
 * @description Contains OCR processing results and statistics
 */
export interface OCRSummary {
  /** Length of extracted text */
  text_length: number;

  /** Number of pages processed */
  page_count: number;

  /** Number of tables found */
  table_count: number;
}

/**
 * Interface for successful document processing
 *
 * @interface SuccessfulDocument
 * @description Represents a successfully processed document in batch upload
 */
export interface SuccessfulDocument {
  /** Document ID in database */
  document_id: string;

  /** Processing ID */
  processing_id: string;

  /** Original filename */
  filename: string;

  /** Storage information */
  storage_info: StorageInfo;

  /** OCR processing summary */
  ocr_summary: OCRSummary;

  /** Processing status */
  processing_status: string;

  /** Processing timestamp */
  processing_timestamp: string;

  /** Medical record number (if extracted) */
  expediente: string | null;

  /** Patient name (if extracted) */
  nombre_paciente: string | null;

  /** Episode number (if extracted) */
  numero_episodio: string | null;

  /** Document category (if extracted) */
  categoria: string | null;

  /** Whether medical info extraction was valid */
  medical_info_valid: boolean;

  /** Error message if medical info extraction failed */
  medical_info_error: string | null;
}

/**
 * Interface for failed document processing
 *
 * @interface FailedDocument
 * @description Represents a failed document in batch upload
 */
export interface FailedDocument {
  /** Original filename */
  filename: string;

  /** Error message */
  error: string;

  /** Original index in the batch */
  original_index: number;
}

/**
 * Interface for processing summary
 *
 * @interface ProcessingSummary
 * @description Contains performance metrics for batch processing
 */
export interface ProcessingSummary {
  /** Total processing duration in seconds */
  processing_duration_seconds: number;

  /** Average time per document */
  average_time_per_document: number;

  /** Documents processed per second */
  documents_per_second: number;

  /** Optimization strategy used */
  optimization_used: string;
}

/**
 * Interface for single document upload response
 *
 * @interface DocumentUploadResponse
 * @description Defines the structure for responses from the single document upload endpoint
 * including document processing results and extracted information
 *
 * @example
 * ```typescript
 * const uploadResponse: DocumentUploadResponse = {
 *   document_id: '6875aceb26807b3c8fda322c',
 *   processing_id: '5f776aff-8ac7-4c98-8515-4af6178247ae',
 *   filename: 'medical_report.pdf',
 *   storage_info: {},
 *   ocr_summary: {
 *     text_length: 1500,
 *     page_count: 3,
 *     table_count: 2
 *   },
 *   processing_status: 'completed',
 *   processing_timestamp: '2025-07-14T19:20:44.109634',
 *   expediente: '3000003799',
 *   nombre_paciente: 'GARZA TIJERINA, MARIA ESTHER',
 *   numero_episodio: '6001467010',
 *   categoria: 'CONS',
 *   medical_info_valid: true,
 *   medical_info_error: null
 * };
 * ```
 */
export interface DocumentUploadResponse {
  /** Unique document identifier */
  document_id: string;

  /** Processing identifier */
  processing_id: string;

  /** Original filename */
  filename: string;

  /** Storage information object */
  storage_info: Record<string, any>;

  /** OCR processing summary */
  ocr_summary: {
    /** Length of extracted text */
    text_length: number;
    /** Number of pages processed */
    page_count: number;
    /** Number of tables detected */
    table_count: number;
  };

  /** Processing status (completed, error, etc.) */
  processing_status: string;

  /** Processing timestamp in ISO format */
  processing_timestamp: string;

  /** Extracted expediente number (null if not found) */
  expediente: string | null;

  /** Extracted patient name (null if not found) */
  nombre_paciente: string | null;

  /** Extracted episode number (null if not found) */
  numero_episodio: string | null;

  /** Document category (CONS, EMER, etc.) (null if not found) */
  categoria: string | null;

  /** Whether medical information extraction was successful */
  medical_info_valid: boolean;

  /** Error message if medical info extraction failed (null if successful) */
  medical_info_error: string | null;
}

/**
 * Interface for batch upload response
 *
 * @interface BatchUploadResponse
 * @description Defines the structure for batch upload API responses
 * including overall status and individual file results
 *
 * @example
 * ```typescript
 * const batchResponse: BatchUploadResponse = {
 *   batch_id: '795b6bb2-1e1b-4b5f-969e-a41988433729',
 *   batch_timestamp: '2025-07-14T17:52:34.480289',
 *   user_id: 'pedro',
 *   total_files: 1,
 *   processed_count: 1,
 *   failed_count: 0,
 *   success_rate: 100,
 *   processing_status: 'completed',
 *   successful_documents: [...],
 *   failed_documents: []
 * };
 * ```
 */
export interface BatchUploadResponse {
  /** Unique batch identifier */
  batch_id: string;

  /** Batch processing timestamp */
  batch_timestamp: string;

  /** Batch description (if provided) */
  batch_description: string | null;

  /** User ID who initiated the batch */
  user_id: string;

  /** Total number of files in the batch */
  total_files: number;

  /** Number of processed files */
  processed_count: number;

  /** Number of failed files */
  failed_count: number;

  /** Success rate percentage */
  success_rate: number;

  /** Overall processing status */
  processing_status: string;

  /** Array of successfully processed documents */
  successful_documents: SuccessfulDocument[];

  /** Array of failed documents */
  failed_documents: FailedDocument[];

  /** Processing performance summary */
  processing_summary: ProcessingSummary;
}
