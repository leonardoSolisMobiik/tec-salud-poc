/**
 * Interface representing a patient in the medical system
 *
 * @interface Patient
 * @description Defines the structure for patient data including personal information,
 * contact details, and metadata for medical records management
 *
 * @example
 * ```typescript
 * const patient: Patient = {
 *   id: 'patient-123',
 *   name: 'Juan Pérez',
 *   age: 45,
 *   gender: 'M',
 *   birth_date: '1978-03-15',
 *   phone: '+52-555-0123',
 *   email: 'juan.perez@email.com',
 *   medical_record_number: 'MR-789456'
 * };
 * ```
 */
export interface Patient {
  /** Unique patient identifier */
  id: string;

  /** Full patient name */
  name: string;

  /** Patient age in years */
  age: number;

  /** Patient gender (M: Male, F: Female, Otro: Other) */
  gender: 'M' | 'F' | 'Otro';

  /** Birth date in ISO format (YYYY-MM-DD) */
  birth_date: string;

  /** Optional phone number with country code */
  phone?: string;

  /** Optional email address */
  email?: string;

  /** Optional physical address */
  address?: string;

  /** Optional medical record number for hospital identification */
  medical_record_number?: string;

  /** Record creation timestamp in ISO format */
  created_at?: string;

  /** Record last update timestamp in ISO format */
  updated_at?: string;

  /** Optional similarity score from search results */
  similarity_score?: number;

  /** Optional match type from search results */
  match_type?: string;

  /** Associated documents for this patient */
  documents?: PatientDocument[];
}

/**
 * Interface representing a document in the medical system
 *
 * @interface PatientDocument
 * @description Defines the structure for medical document data including file information,
 * processing status, and extracted medical information
 */
export interface PatientDocument {
  /** Unique document identifier */
  document_id: string;

  /** Processing identifier */
  processing_id: string;

  /** Original filename */
  filename: string;

  /** MIME content type */
  content_type: string;

  /** File size in bytes */
  file_size: number;

  /** User ID who uploaded the document */
  user_id: string;

  /** Azure storage information */
  storage_info: {
    blob_name: string;
    blob_url: string;
    container_name: string;
  };

  /** Extracted text content from the document */
  extracted_text: string;

  /** Processing status */
  processing_status: string;

  /** Batch processing information */
  batch_info: {
    batch_id: string;
    batch_index: number;
    batch_timestamp: string;
    batch_description: string | null;
    is_batch_document: boolean;
  };

  /** Optional document description */
  description: string | null;

  /** Document tags */
  tags: string[];

  /** Medical record number (expediente) */
  expediente: string;

  /** Patient name extracted from document */
  nombre_paciente: string;

  /** Episode number */
  numero_episodio: string;

  /** Document category (CONS, EMER, etc.) */
  categoria: string;

  /** Whether medical info extraction was successful */
  medical_info_valid: boolean;

  /** Medical info extraction error if any */
  medical_info_error: string | null;

  /** Document creation timestamp */
  created_at: string;

  /** Document last update timestamp */
  updated_at: string;

  /** Similarity score from search */
  similarity_score: number;

  /** Match type from search */
  match_type: string;
}

/**
 * Interface representing the complete search response from the API
 *
 * @interface DocumentSearchResponse
 * @description Defines the structure for document search responses including pagination
 * and search metadata
 */
export interface DocumentSearchResponse {
  /** Search term used */
  search_term: string;

  /** Normalized search term */
  normalized_term: string;

  /** Total number of documents found */
  total_found: number;

  /** Array of matching documents */
  documents: PatientDocument[];

  /** Maximum number of results requested */
  limit: number;

  /** Number of results skipped */
  skip: number;

  /** Number of results returned */
  returned_count: number;

  /** Whether there are more results available */
  has_next: boolean;

  /** Whether there are previous results available */
  has_prev: boolean;

  /** Current page number */
  current_page: number;

  /** Total number of pages */
  total_pages: number;

  /** Search strategies used by the backend */
  search_strategies_used: string[];

  /** Minimum similarity threshold used */
  min_similarity_threshold: number;

  /** Search timestamp */
  search_timestamp: string;
}

/**
 * Interface representing fuzzy search parameters for patient search
 *
 * @interface PatientSearchParams
 * @description Defines the structure for patient search parameters with fuzzy matching
 *
 * @example
 * ```typescript
 * const searchParams: PatientSearchParams = {
 *   user_id: 'pedro',
 *   search_term: 'Andrea',
 *   limit: 20,
 *   skip: 0,
 *   min_similarity: 0.3,
 *   include_score: true
 * };
 * ```
 */
export interface PatientSearchParams {
  /** User ID for authentication and authorization */
  user_id: string;

  /** Search term to find patients by name, ID, etc. */
  search_term: string;

  /** Maximum number of results to return (default: 20) */
  limit?: number;

  /** Number of results to skip for pagination (default: 0) */
  skip?: number;

  /** Minimum similarity score for fuzzy matching (default: 0.3) */
  min_similarity?: number;

  /** Whether to include similarity scores in response (default: true) */
  include_score?: boolean;
}

/**
 * Interface representing paginated patient search results
 *
 * @interface PatientSearchResult
 * @description Defines the structure for patient search responses with pagination metadata
 *
 * @example
 * ```typescript
 * const searchResult: PatientSearchResult = {
 *   patients: [patient1, patient2, patient3],
 *   total: 150,
 *   page: 1,
 *   per_page: 20
 * };
 *
 * console.log(`Showing ${searchResult.patients.length} of ${searchResult.total} patients`);
 * console.log(`Page ${searchResult.page}, ${searchResult.per_page} per page`);
 * ```
 */
export interface PatientSearchResult {
  /** Array of patient objects matching the search criteria */
  patients: Patient[];

  /** Total number of patients matching the search */
  total: number;

  /** Current page number (1-based) */
  page: number;

  /** Number of patients per page */
  per_page: number;
}

/**
 * Interface representing a patient interaction for audit and analytics
 *
 * @interface PatientInteraction
 * @description Defines the structure for patient interaction records including
 * interaction type, summary, and metadata for tracking medical consultations
 *
 * @example
 * ```typescript
 * const interaction: PatientInteraction = {
 *   interaction_type: 'chat',
 *   summary: 'Doctor accessed patient record from main interface',
 *   timestamp: '2024-01-15T10:30:00Z'
 * };
 * ```
 */
export interface PatientInteraction {
  /** Type of interaction (view, chat, document_access, etc.) */
  interaction_type: string;

  /** Brief description of the interaction */
  summary: string;

  /** Optional timestamp of when the interaction occurred */
  timestamp?: string;
}
