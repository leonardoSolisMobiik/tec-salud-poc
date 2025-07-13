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
  
  /** Last update timestamp in ISO format */
  updated_at?: string;
}

/**
 * Interface representing a patient interaction record
 * 
 * @interface PatientInteraction
 * @description Defines the structure for tracking interactions with patients
 * including chat sessions, document reviews, and medical analyses
 * 
 * @example
 * ```typescript
 * const interaction: PatientInteraction = {
 *   patient_id: 'patient-123',
 *   interaction_type: 'chat',
 *   summary: 'Consulta sobre síntomas de dolor de cabeza',
 *   timestamp: '2024-01-15T10:30:00Z',
 *   metadata: {
 *     duration: 1200,
 *     ai_model: 'gpt-4',
 *     doctor_id: 'dr-456'
 *   }
 * };
 * ```
 */
export interface PatientInteraction {
  /** Optional unique interaction identifier (set by backend) */
  id?: string;
  
  /** Patient ID this interaction belongs to */
  patient_id: string;
  
  /** Type of interaction performed */
  interaction_type: 'chat' | 'document' | 'analysis';
  
  /** Brief summary of the interaction */
  summary: string;
  
  /** Interaction timestamp in ISO format */
  timestamp: string;
  
  /** Optional additional metadata for the interaction */
  metadata?: any;
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