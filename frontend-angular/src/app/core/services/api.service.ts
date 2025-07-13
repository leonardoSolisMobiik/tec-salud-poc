import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { environment } from '@environments/environment';
import {
  Patient,
  PatientInteraction,
  PatientSearchResult,
  ChatRequest,
  ChatResponse,
  HealthCheckResponse,
  AzureOpenAIHealthResponse,
  ApiResponse
} from '../models';

/**
 * Service for managing API communications with the TecSalud backend
 * 
 * @description Provides methods for patient management, medical chat, document handling,
 * and health checks. Includes retry logic, error handling, and configurable timeouts.
 * 
 * @example
 * ```typescript
 * constructor(private apiService: ApiService) {}
 * 
 * // Get patients with pagination
 * this.apiService.getPatients(1, 20).subscribe(result => {
 *   console.log('Patients:', result.patients);
 * });
 * 
 * // Send medical chat request
 * const chatRequest = { messages: [...], patient_id: 'abc123' };
 * this.apiService.sendMedicalChat(chatRequest).subscribe(response => {
 *   console.log('AI Response:', response.content);
 * });
 * ```
 * 
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  /** Base API URL from environment configuration */
  private readonly apiUrl = environment.apiUrl;
  
  /** Default HTTP headers for API requests */
  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  /**
   * Creates an instance of ApiService
   * 
   * @param http - Angular HttpClient for making HTTP requests
   */
  constructor(private http: HttpClient) {
    this.log('ApiService initialized with:', { 
      apiUrl: this.apiUrl, 
      environment: environment.production ? 'production' : 'development' 
    });
  }

  // ========== Patient Management ==========
  
  /**
   * Retrieves paginated list of patients
   * 
   * @param page - Page number (1-based indexing)
   * @param perPage - Number of patients per page
   * @returns Observable containing patient search results with pagination metadata
   * 
   * @example
   * ```typescript
   * // Get first page with 20 patients
   * apiService.getPatients(1, 20).subscribe(result => {
   *   console.log(`Found ${result.total} patients`);
   *   console.log('Patients:', result.patients);
   * });
   * ```
   */
  getPatients(page = 1, perPage = 20): Observable<PatientSearchResult> {
    const url = `${this.apiUrl}/api/v1/patients/?limit=${perPage}&offset=${(page-1)*perPage}`;
    this.log('Making request to:', url);
    
    return this.http.get<PatientSearchResult>(url, { headers: this.headers }).pipe(
      timeout(environment.apiTimeout || 30000),
      map(result => {
        this.log('getPatients response:', result);
        return result;
      }),
      retry(environment.retryAttempts || 1),
      catchError(error => {
        this.log('getPatients error:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Searches for patients by query string
   * 
   * @param query - Search query (name, ID, etc.)
   * @returns Observable array of matching patients
   * 
   * @example
   * ```typescript
   * apiService.searchPatients('Juan').subscribe(patients => {
   *   console.log(`Found ${patients.length} patients matching "Juan"`);
   * });
   * ```
   */
  searchPatients(query: string): Observable<Patient[]> {
    return this.http.get<any>(
      `${this.apiUrl}/api/v1/patients/search?query=${encodeURIComponent(query)}`,
      { headers: this.headers }
    ).pipe(
      map(result => result.patients || result),
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Retrieves a specific patient by ID
   * 
   * @param patientId - Unique patient identifier
   * @returns Observable containing patient data
   * 
   * @throws Will throw an error if patient is not found
   * 
   * @example
   * ```typescript
   * apiService.getPatientById('patient-123').subscribe(patient => {
   *   console.log('Patient:', patient.name);
   * });
   * ```
   */
  getPatientById(patientId: string): Observable<Patient> {
    return this.http.get<Patient>(
      `${this.apiUrl}/api/v1/patients/${patientId}`,
      { headers: this.headers }
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Records a new interaction with a patient
   * 
   * @param patientId - Patient identifier
   * @param interaction - Interaction data (without patient_id)
   * @returns Observable with success message
   * 
   * @note Backend expects specific URL parameters and uses singular '/interaction' endpoint
   * 
   * @example
   * ```typescript
   * const interaction = {
   *   interaction_type: 'chat',
   *   summary: 'Consulta sobre síntomas'
   * };
   * apiService.recordPatientInteraction('patient-123', interaction).subscribe(result => {
   *   console.log(result.message);
   * });
   * ```
   */
  recordPatientInteraction(patientId: string, interaction: Omit<PatientInteraction, 'patient_id'>): Observable<{message: string}> {
    const params = new URLSearchParams({
      interaction_type: interaction.interaction_type || 'view',
      summary: interaction.summary || `Doctor accessed patient record`,
      doctor_id: '1' // TODO: Obtener del auth cuando esté implementado
    });
    
    return this.http.post<{message: string}>(
      `${this.apiUrl}/api/v1/patients/${patientId}/interaction?${params.toString()}`,
      {}, // Empty body since backend expects query params
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ========== Medical Chat ==========
  
  /**
   * Sends a medical chat request to AI assistant
   * 
   * @param request - Chat request containing messages and context
   * @returns Observable with AI chat response
   * 
   * @example
   * ```typescript
   * const chatRequest: ChatRequest = {
   *   messages: [{ role: 'user', content: '¿Qué síntomas presenta el paciente?' }],
   *   patient_id: 'patient-123',
   *   temperature: 0.7
   * };
   * 
   * apiService.sendMedicalChat(chatRequest).subscribe(response => {
   *   console.log('AI Response:', response.content);
   * });
   * ```
   */
  sendMedicalChat(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(
      `${this.apiUrl}/api/v1/chat/medical`,
      request,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Sends a quick query without full context
   * 
   * @param messages - Array of chat messages
   * @returns Observable with AI response
   * 
   * @example
   * ```typescript
   * const messages = [{ role: 'user', content: 'Explain hypertension symptoms' }];
   * apiService.sendQuickQuery(messages).subscribe(response => {
   *   console.log('Quick response:', response.content);
   * });
   * ```
   */
  sendQuickQuery(messages: ChatRequest['messages']): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(
      `${this.apiUrl}/api/v1/chat/quick`,
      { messages },
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Analyzes patient case history with AI
   * 
   * @param patientId - Patient identifier for context
   * @param query - Analysis query or question
   * @returns Observable with analysis results
   * 
   * @example
   * ```typescript
   * apiService.analyzeCaseHistory('patient-123', 'What are the risk factors?')
   *   .subscribe(analysis => {
   *     console.log('Case analysis:', analysis.content);
   *   });
   * ```
   */
  analyzeCaseHistory(patientId: string, query: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(
      `${this.apiUrl}/api/v1/chat/analyze-case`,
      { patient_id: patientId, query },
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ========== Document Management ==========
  
  /**
   * Uploads a document file to the server
   * 
   * @param formData - FormData containing file and metadata
   * @returns Observable with upload response
   * 
   * @note Content-Type header is automatically set by browser for FormData
   * 
   * @example
   * ```typescript
   * const formData = new FormData();
   * formData.append('file', fileInput.files[0]);
   * formData.append('patient_id', 'patient-123');
   * 
   * apiService.uploadDocument(formData).subscribe(response => {
   *   console.log('Upload successful:', response);
   * });
   * ```
   */
  uploadDocument(formData: FormData): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/api/v1/documents/upload`,
      formData
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Retrieves documents with optional filtering
   * 
   * @param patientId - Optional patient ID filter
   * @param documentType - Optional document type filter
   * @returns Observable with documents array
   * 
   * @example
   * ```typescript
   * // Get all documents for a patient
   * apiService.getDocuments('patient-123').subscribe(docs => {
   *   console.log('Patient documents:', docs);
   * });
   * 
   * // Get documents by type
   * apiService.getDocuments(undefined, 'lab_result').subscribe(docs => {
   *   console.log('Lab results:', docs);
   * });
   * ```
   */
  getDocuments(patientId?: string, documentType?: string): Observable<any> {
    let params = new URLSearchParams();
    if (patientId) params.set('patient_id', patientId);
    if (documentType) params.set('document_type', documentType);
    
    const url = `${this.apiUrl}/api/v1/documents/${params.toString() ? '?' + params.toString() : ''}`;
    
    return this.http.get<any>(url, { headers: this.headers }).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Retrieves a specific document by ID
   * 
   * @param documentId - Unique document identifier
   * @returns Observable with document data
   * 
   * @example
   * ```typescript
   * apiService.getDocumentById('doc-456').subscribe(document => {
   *   console.log('Document:', document.filename);
   * });
   * ```
   */
  getDocumentById(documentId: string): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/api/v1/documents/${documentId}`,
      { headers: this.headers }
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Searches documents by content or metadata
   * 
   * @param query - Search query string
   * @param patientId - Optional patient ID filter
   * @param documentType - Optional document type filter
   * @returns Observable with search results
   * 
   * @example
   * ```typescript
   * apiService.searchDocuments('diabetes', 'patient-123', 'medical_record')
   *   .subscribe(results => {
   *     console.log('Found documents:', results);
   *   });
   * ```
   */
  searchDocuments(query: string, patientId?: string, documentType?: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/api/v1/documents/search`,
      { query, patient_id: patientId, document_type: documentType },
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Deletes a document by ID
   * 
   * @param documentId - Document identifier to delete
   * @returns Observable with deletion confirmation
   * 
   * @throws Will throw an error if document doesn't exist or deletion fails
   * 
   * @example
   * ```typescript
   * apiService.deleteDocument('doc-456').subscribe(result => {
   *   console.log('Document deleted successfully');
   * });
   * ```
   */
  deleteDocument(documentId: string): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/api/v1/documents/${documentId}`,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ========== Generic HTTP Methods ==========
  
  /**
   * Generic GET request method
   * 
   * @param url - API endpoint URL (relative to base URL)
   * @returns Observable with response data
   * 
   * @example
   * ```typescript
   * apiService.get('/api/v1/custom-endpoint').subscribe(data => {
   *   console.log('Custom data:', data);
   * });
   * ```
   */
  get(url: string): Observable<any> {
    this.log('GET request to:', `${this.apiUrl}${url}`);
    return this.http.get<any>(
      `${this.apiUrl}${url}`,
      { headers: this.headers }
    ).pipe(
      timeout(environment.apiTimeout || 30000),
      retry(environment.retryAttempts || 1),
      catchError(this.handleError)
    );
  }

  /**
   * Generic POST request method
   * 
   * @param url - API endpoint URL (relative to base URL)
   * @param data - Request body data
   * @returns Observable with response data
   * 
   * @example
   * ```typescript
   * const payload = { name: 'New Item', type: 'example' };
   * apiService.post('/api/v1/items', payload).subscribe(result => {
   *   console.log('Created:', result);
   * });
   * ```
   */
  post(url: string, data: any): Observable<any> {
    this.log('POST request to:', { url: `${this.apiUrl}${url}`, data });
    return this.http.post<any>(
      `${this.apiUrl}${url}`,
      data,
      { headers: this.headers }
    ).pipe(
      timeout(environment.apiTimeout || 30000),
      catchError(this.handleError)
    );
  }

  /**
   * Generic PUT request method
   * 
   * @param url - API endpoint URL (relative to base URL)
   * @param data - Request body data
   * @returns Observable with response data
   * 
   * @example
   * ```typescript
   * const updates = { name: 'Updated Name' };
   * apiService.put('/api/v1/items/123', updates).subscribe(result => {
   *   console.log('Updated:', result);
   * });
   * ```
   */
  put(url: string, data: any): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}${url}`,
      data,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Generic DELETE request method
   * 
   * @param url - API endpoint URL (relative to base URL)
   * @returns Observable with response data
   * 
   * @example
   * ```typescript
   * apiService.delete('/api/v1/items/123').subscribe(result => {
   *   console.log('Deleted successfully');
   * });
   * ```
   */
  delete(url: string): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}${url}`,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ========== Health Checks ==========
  
  /**
   * Checks API server health status
   * 
   * @returns Observable with health check response including status and metadata
   * 
   * @example
   * ```typescript
   * apiService.checkHealth().subscribe(health => {
   *   console.log('API Status:', health.status);
   *   console.log('Uptime:', health.uptime);
   * });
   * ```
   */
  checkHealth(): Observable<HealthCheckResponse> {
    return this.http.get<HealthCheckResponse>(
      `${this.apiUrl}/api/v1/health`,
      { headers: this.headers }
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Checks Azure OpenAI service health status
   * 
   * @returns Observable with Azure OpenAI health status
   * 
   * @example
   * ```typescript
   * apiService.checkAzureOpenAIHealth().subscribe(aiHealth => {
   *   if (aiHealth.status === 'healthy') {
   *     console.log('AI service is available');
   *   }
   * });
   * ```
   */
  checkAzureOpenAIHealth(): Observable<AzureOpenAIHealthResponse> {
    return this.http.get<AzureOpenAIHealthResponse>(
      `${this.apiUrl}/api/v1/health/azure-openai`,
      { headers: this.headers }
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  // ========== Error Handling ==========
  
  /**
   * Handles HTTP errors and transforms them into user-friendly messages
   * 
   * @private
   * @param error - HTTP error response
   * @returns Observable that throws formatted error
   * 
   * @description Processes both client-side and server-side errors,
   * extracting meaningful error messages from various response formats
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.detail || error.error?.error || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    this.log('API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  // ========== Logging ==========
  
  /**
   * Conditional logging based on environment configuration
   * 
   * @private
   * @param message - Log message
   * @param data - Optional data to log
   * 
   * @description Only logs when debug.showApiLogs is enabled in environment
   */
  private log(message: string, data?: any): void {
    if (environment.debug?.showApiLogs) {
      console.log(`[ApiService] ${message}`, data || '');
    }
  }
}