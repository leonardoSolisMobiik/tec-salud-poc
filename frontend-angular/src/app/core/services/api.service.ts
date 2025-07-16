import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, retry, timeout } from 'rxjs/operators';
import { environment } from '@environments/environment';
import {
  Patient,
  PatientSearchResult,
  PatientSearchParams,
  PatientDocument,
  DocumentSearchResponse,
  ChatRequest,
  ChatResponse,
  ChatAskRequest,
  ChatStreamChunk,
  ChatSession,
  ChatSessionRequest,
  ChatSessionResponse,
  HealthCheckResponse,
  AzureOpenAIHealthResponse,
  PatientInteraction,
  ApiResponse,
  BatchUploadRequest,
  BatchUploadResponse,
  DocumentUploadResponse
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
   * @deprecated This method uses the old /patients/ endpoint which is no longer available.
   * Use searchPatients() or searchPatientsWithParams() instead.
   *
   * Retrieves paginated list of patients
   *
   * @param page - Page number (1-based indexing)
   * @param perPage - Number of patients per page
   * @returns Observable containing patient search results with pagination metadata
   *
   * @example
   * ```typescript
   * // DEPRECATED - Use searchPatients instead:
   * // apiService.getPatients(1, 20).subscribe(result => {
   * //   console.log(`Found ${result.total} patients`);
   * //   console.log('Patients:', result.patients);
   * // });
   *
   * // NEW - Use searchPatients:
   * apiService.searchPatients('user-123', '', 20, 0).subscribe(patients => {
   *   console.log(`Found ${patients.length} patients`);
   * });
   * ```
   */
  getPatients(page = 1, perPage = 20): Observable<PatientSearchResult> {
    // This endpoint no longer exists in the backend
    console.warn('⚠️ getPatients() is deprecated. Use searchPatients() instead.');

    // Return empty result to prevent 404 errors
    return of({
      patients: [],
      total: 0,
      page: page,
      per_page: perPage
    });
  }

      /**
   * Searches for patients using fuzzy matching
   *
   * @param userId - User ID for authentication and authorization
   * @param query - Search term to find patients
   * @param limit - Maximum number of results (default: 20)
   * @param skip - Number of results to skip for pagination (default: 0)
   * @param minSimilarity - Minimum similarity score for fuzzy matching (default: 0.3)
   * @param includeScore - Whether to include similarity scores in response (default: true)
   * @returns Observable array of matching patients
   *
   * @example
   * ```typescript
   * // Basic search
   * apiService.searchPatients('pedro', 'Juan').subscribe(patients => {
   *   console.log(`Found ${patients.length} patients matching "Juan"`);
   * });
   *
   * // Advanced search with parameters
   * apiService.searchPatients('pedro', 'Andrea', 10, 0, 0.5, true).subscribe(patients => {
   *   console.log('Search results with scores:', patients);
   * });
   * ```
   */
  searchPatients(
    userId: string,
    query: string,
    limit: number = 20,
    skip: number = 0,
    minSimilarity: number = 0.3,
    includeScore: boolean = true
  ): Observable<Patient[]> {
    const params = new URLSearchParams({
      user_id: userId,
      search_term: query,
      limit: limit.toString(),
      skip: skip.toString(),
      min_similarity: minSimilarity.toString(),
      include_score: includeScore.toString()
    });

    const url = `${this.apiUrl}/search/patients?${params.toString()}`;
    this.log('Making search request to:', url);

    return this.http.get<DocumentSearchResponse>(url, { headers: this.headers }).pipe(
      timeout(environment.apiTimeout || 30000),
      map(result => {
        this.log('searchPatients response:', result);
        return this.convertDocumentsToPatients(result);
      }),
      retry(environment.retryAttempts || 1),
      catchError(error => {
        this.log('searchPatients error:', error);
        return this.handleError(error);
      })
    );
  }

  /**
   * Searches for patients using structured search parameters
   *
   * @param searchParams - Structured search parameters including user_id
   * @returns Observable array of matching patients
   *
   * @example
   * ```typescript
   * const params: PatientSearchParams = {
   *   user_id: 'pedro',
   *   search_term: 'Andrea',
   *   limit: 10,
   *   min_similarity: 0.5,
   *   include_score: true
   * };
   *
   * apiService.searchPatientsWithParams(params).subscribe(patients => {
   *   console.log('Search results:', patients);
   * });
   * ```
   */
  searchPatientsWithParams(searchParams: PatientSearchParams): Observable<Patient[]> {
    const params = new URLSearchParams({
      user_id: searchParams.user_id,
      search_term: searchParams.search_term,
      limit: (searchParams.limit || 20).toString(),
      skip: (searchParams.skip || 0).toString(),
      min_similarity: (searchParams.min_similarity || 0.3).toString(),
      include_score: (searchParams.include_score !== undefined ? searchParams.include_score : true).toString()
    });

    const url = `${this.apiUrl}/search/patients?${params.toString()}`;
    this.log('Making search request to:', url);

    return this.http.get<DocumentSearchResponse>(url, { headers: this.headers }).pipe(
      timeout(environment.apiTimeout || 30000),
      map(result => {
        this.log('searchPatientsWithParams response:', result);
        return this.convertDocumentsToPatients(result);
      }),
      retry(environment.retryAttempts || 1),
      catchError(error => {
        this.log('searchPatientsWithParams error:', error);
        return this.handleError(error);
      })
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
      `${this.apiUrl}/patients/${patientId}`,
      { headers: this.headers }
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Records patient interaction in the backend
   *
   * @param patientId - Patient identifier
   * @param interaction - Interaction details
   * @returns Observable with success message
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
  recordPatientInteraction(patientId: string, interaction: PatientInteraction): Observable<{message: string}> {
    // TODO: Implement when backend endpoint /patients/{id}/interaction is available
    // const params = new URLSearchParams({
    //   interaction_type: interaction.interaction_type || 'view',
    //   summary: interaction.summary || `Doctor accessed patient record`,
    //   doctor_id: '1' // TODO: Obtener del auth cuando esté implementado
    // });

    // return this.http.post<{message: string}>(
          //   `${this.apiUrl}/patients/${patientId}/interaction?${params.toString()}`,
    //   {}, // Empty body since backend expects query params
    //   { headers: this.headers }
    // ).pipe(
    //   catchError(this.handleError)
    // );

    // Return mock success response for now
    return of({message: 'Interaction recorded (mock - endpoint not implemented)'});
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
              `${this.apiUrl}/chat/medical`,
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
              `${this.apiUrl}/chat/analyze-case`,
      { patient_id: patientId, query },
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ========== Chat Session Management ==========

  /**
   * Creates a new chat session for a patient and document
   *
   * @param sessionRequest - Session creation request with user_id, document_id, and session_name
   * @returns Observable with the created session data
   *
   * @example
   * ```typescript
   * const sessionRequest: ChatSessionRequest = {
   *   user_id: 'pedro',
   *   document_id: '68754a44c0010413757d6a39',
   *   session_name: 'Consulta María Pérez'
   * };
   *
   * apiService.createChatSession(sessionRequest).subscribe(session => {
   *   console.log('Session created:', session.session_id);
   * });
   * ```
   */
  createChatSession(sessionRequest: ChatSessionRequest): Observable<ChatSessionResponse> {
    return this.http.post<ChatSessionResponse>(
      `${this.apiUrl}/chat/sessions`,
      sessionRequest,
      { headers: this.headers }
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Retrieves a chat session by ID
   *
   * @param sessionId - Unique session identifier
   * @returns Observable with session data
   *
   * @example
   * ```typescript
   * apiService.getChatSession('d31b6cfd-b230-4693-8fbd-04edf36cf6e2').subscribe(session => {
   *   console.log('Session:', session.session_name);
   * });
   * ```
   */
  getChatSession(sessionId: string): Observable<ChatSessionResponse> {
    return this.http.get<ChatSessionResponse>(
      `${this.apiUrl}/chat/sessions/${sessionId}`,
      { headers: this.headers }
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  /**
   * Sends a chat message and receives streaming response
   *
   * @param chatAskRequest - Chat request with session, user, document, and question
   * @returns Observable of streaming response chunks
   *
   * @description Sends a chat message to the AI and receives a streaming response
   * with real-time content chunks. Handles Server-Sent Events (SSE) streaming.
   *
   * @example
   * ```typescript
   * const request: ChatAskRequest = {
   *   session_id: 'd31b6cfd-b230-4693-8fbd-04edf36cf6e2',
   *   user_id: 'pedro',
   *   document_id: '68754a44c0010413757d6a39',
   *   question: 'Hola, ¿cómo estás?'
   * };
   *
   * this.apiService.sendChatMessage(request)
   *   .subscribe(chunk => {
   *     if (chunk.type === 'content') {
   *       console.log('Content:', chunk.content);
   *     }
   *   });
   * ```
   */
  sendChatMessage(chatAskRequest: ChatAskRequest): Observable<ChatStreamChunk> {
    return new Observable<ChatStreamChunk>(observer => {
      // Create the request body
      const requestBody = {
        session_id: chatAskRequest.session_id,
        user_id: chatAskRequest.user_id,
        document_id: chatAskRequest.document_id,
        question: chatAskRequest.question
      };

      // Make POST request to the streaming endpoint
      fetch(`${this.apiUrl}/chat/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify(requestBody)
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No reader available');
        }

        const readStream = async () => {
          try {
            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                observer.complete();
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split('\n');

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  const data = line.substring(6);
                  if (data.trim()) {
                    try {
                      const streamChunk: ChatStreamChunk = JSON.parse(data);
                      observer.next(streamChunk);

                      // Complete when we receive the end chunk
                      if (streamChunk.type === 'end') {
                        observer.complete();
                        return;
                      }
                    } catch (parseError) {
                      console.error('Error parsing streaming chunk:', parseError);
                    }
                  }
                }
              }
            }
          } catch (error) {
            observer.error(error);
          }
        };

        readStream();
      })
      .catch(error => {
        observer.error(error);
      });
    });
  }

  /**
   * Lists all chat sessions for a user
   *
   * @param userId - User identifier
   * @returns Observable with array of sessions
   *
   * @example
   * ```typescript
   * apiService.getChatSessions('pedro').subscribe(sessions => {
   *   console.log('User sessions:', sessions.length);
   * });
   * ```
   */
  getChatSessions(userId: string): Observable<ChatSessionResponse[]> {
    return this.http.get<ChatSessionResponse[]>(
      `${this.apiUrl}/chat/sessions?user_id=${userId}`,
      { headers: this.headers }
    ).pipe(
      retry(1),
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
  uploadDocument(formData: FormData): Observable<DocumentUploadResponse> {
    return this.http.post<DocumentUploadResponse>(
      `${this.apiUrl}/documents/upload`,
      formData
    ).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Uploads multiple documents in a single batch operation
   *
   * @param batchRequest - Batch upload request with files and metadata
   * @returns Observable with batch upload response
   *
   * @description Sends multiple files to the batch upload endpoint for processing.
   * The API processes all files and returns individual results for each file.
   *
   * @example
   * ```typescript
   * const batchRequest: BatchUploadRequest = {
   *   files: [file1, file2, file3],
   *   user_id: 'pedro',
   *   batch_description: 'Expedientes médicos enero 2024',
   *   batch_tags: 'enero,2024,consultas'
   * };
   *
   * apiService.uploadDocumentBatch(batchRequest).subscribe({
   *   next: (response) => {
   *     console.log('Batch upload completed:', response.batch_id);
   *     console.log('Successful uploads:', response.successful_uploads);
   *     console.log('Failed uploads:', response.failed_uploads);
   *   },
   *   error: (error) => {
   *     console.error('Batch upload failed:', error);
   *   }
   * });
   * ```
   */
  uploadDocumentBatch(batchRequest: BatchUploadRequest): Observable<BatchUploadResponse> {
    const formData = new FormData();

    // Add files to FormData
    batchRequest.files.forEach(file => {
      formData.append('files', file);
    });

    // Add metadata
    formData.append('user_id', batchRequest.user_id);

    if (batchRequest.batch_description) {
      formData.append('batch_description', batchRequest.batch_description);
    }

    if (batchRequest.batch_tags) {
      formData.append('batch_tags', batchRequest.batch_tags);
    }

    return this.http.post<BatchUploadResponse>(
      `${this.apiUrl}/documents/upload/batch`,
      formData
    ).pipe(
      timeout(300000), // 5 minutes timeout for batch operations
      retry(1),
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

    const url = `${this.apiUrl}/documents/${params.toString() ? '?' + params.toString() : ''}`;

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
      `${this.apiUrl}/documents/${documentId}`,
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
      `${this.apiUrl}/documents/search`,
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
      `${this.apiUrl}/documents/${documentId}`,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ========== Patient Documents ==========

  /**
   * Gets documents for a specific patient by name
   *
   * @param patientName - Name of the patient to search documents for
   * @param params - Optional search parameters
   * @returns Observable with document search response
   *
   * @example
   * ```typescript
   * apiService.getPatientDocuments('GARZA TIJERINA, MARIA ESTHER', {
   *   user_id: 'pedro',
   *   limit: 20,
   *   skip: 0
   * }).subscribe(response => {
   *   console.log('Found documents:', response.documents);
   * });
   * ```
   */
  getPatientDocuments(patientName: string, params?: {
    user_id?: string;
    limit?: number;
    skip?: number;
  }): Observable<DocumentSearchResponse> {
    const searchParams = new URLSearchParams({
      user_id: params?.user_id || 'pedro',
      limit: (params?.limit || 20).toString(),
      skip: (params?.skip || 0).toString()
    });

    const encodedName = encodeURIComponent(patientName);
    const url = `${this.apiUrl}/search/patients/${encodedName}/documents?${searchParams.toString()}`;

    return this.http.get<DocumentSearchResponse>(url, { headers: this.headers }).pipe(
      catchError(this.handleError)
    );
  }

  // ========== Patient Interaction (Disabled) ==========

  // ========== Generic HTTP Methods ==========

  /**
   * Generic GET request method
   *
   * @param url - API endpoint URL (relative to base URL)
   * @returns Observable with response data
   *
   * @example
   * ```typescript
   * apiService.get('/custom-endpoint').subscribe(data => {
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
   * apiService.post('/items', payload).subscribe(result => {
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
   * apiService.put('/items/123', updates).subscribe(result => {
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
   * apiService.delete('/items/123').subscribe(result => {
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
      `${this.apiUrl}/health`,
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
      `${this.apiUrl}/health/azure-openai`,
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

  /**
   * Converts DocumentSearchResponse to Patient array
   *
   * @private
   * @param response - Document search response from API
   * @returns Array of Patient objects
   *
   * @description Groups documents by patient and creates Patient objects
   * with associated documents and extracted medical information
   */
  private convertDocumentsToPatients(response: DocumentSearchResponse): Patient[] {
    console.log('🔄 convertDocumentsToPatients called with:', response);

    if (!response.documents || response.documents.length === 0) {
      console.log('⚠️ No documents found in response');
      return [];
    }

    console.log(`📄 Processing ${response.documents.length} documents`);

    // Group documents by patient (expediente)
    const patientGroups = new Map<string, PatientDocument[]>();

    response.documents.forEach((doc, index) => {
      console.log(`📋 Processing document ${index + 1}:`, {
        expediente: doc.expediente,
        nombre_paciente: doc.nombre_paciente,
        similarity_score: doc.similarity_score
      });

      const expediente = doc.expediente;
      if (!patientGroups.has(expediente)) {
        patientGroups.set(expediente, []);
      }
      patientGroups.get(expediente)!.push(doc);
    });

    console.log(`👥 Grouped into ${patientGroups.size} patients`);

    // Convert groups to Patient objects
    const patients: Patient[] = [];

    patientGroups.forEach((documents, expediente) => {
      console.log(`🏥 Processing patient group for expediente: ${expediente}`);

      // Use the first document to extract patient information
      const firstDoc = documents[0];
      console.log('📝 First document for patient:', {
        nombre_paciente: firstDoc.nombre_paciente,
        expediente: firstDoc.expediente,
        extracted_text_preview: firstDoc.extracted_text.substring(0, 200) + '...'
      });

      // Extract age from the text if available
      const ageMatch = firstDoc.extracted_text.match(/Edad:\s*(\d+)/);
      const age = ageMatch ? parseInt(ageMatch[1]) : 0;
      console.log('👶 Extracted age:', age, 'from match:', ageMatch);

      // Extract gender from the text
      const genderMatch = firstDoc.extracted_text.match(/Sexo:\s*(Mujer|Hombre|Masculino|Femenino)/i);
      let gender: 'M' | 'F' | 'Otro' = 'Otro';
      if (genderMatch) {
        const genderText = genderMatch[1].toLowerCase();
        if (genderText === 'mujer' || genderText === 'femenino') {
          gender = 'F';
        } else if (genderText === 'hombre' || genderText === 'masculino') {
          gender = 'M';
        }
      }
      console.log('⚧️ Extracted gender:', gender, 'from match:', genderMatch);

      // Extract birth date from the text
      const birthDateMatch = firstDoc.extracted_text.match(/Fecha de nacimiento:\s*(\d{1,2}-\w{3}-\d{4})/);
      let birthDate = '';
      if (birthDateMatch) {
        // Convert date format from "18-Mar-1946" to "1946-03-18"
        const dateStr = birthDateMatch[1];
        const dateParts = dateStr.split('-');
        const monthMap: { [key: string]: string } = {
          'Ene': '01', 'Feb': '02', 'Mar': '03', 'Abr': '04',
          'May': '05', 'Jun': '06', 'Jul': '07', 'Ago': '08',
          'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dic': '12'
        };
        const month = monthMap[dateParts[1]] || '01';
        birthDate = `${dateParts[2]}-${month}-${dateParts[0].padStart(2, '0')}`;
      }
      console.log('🎂 Extracted birth date:', birthDate, 'from match:', birthDateMatch);

      // Extract phone from the text
      const phoneMatch = firstDoc.extracted_text.match(/Teléfono:\s*(\d+)/);
      const phone = phoneMatch ? phoneMatch[1] : undefined;
      console.log('📞 Extracted phone:', phone, 'from match:', phoneMatch);

      // Calculate highest similarity score
      const maxSimilarity = Math.max(...documents.map(doc => doc.similarity_score));
      const bestMatch = documents.find(doc => doc.similarity_score === maxSimilarity);
      console.log('🎯 Max similarity:', maxSimilarity, 'Best match type:', bestMatch?.match_type);

      const patient: Patient = {
        id: expediente,
        name: firstDoc.nombre_paciente,
        age: age,
        gender: gender,
        birth_date: birthDate,
        phone: phone,
        medical_record_number: expediente,
        created_at: firstDoc.created_at,
        updated_at: firstDoc.updated_at,
        similarity_score: maxSimilarity,
        match_type: bestMatch?.match_type || 'unknown',
        documents: documents
      };

      console.log('🏥 Created patient object:', {
        id: patient.id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        similarity_score: patient.similarity_score,
        documents_count: patient.documents?.length
      });

      patients.push(patient);
    });

    // Sort by similarity score (highest first)
    patients.sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0));

    console.log('✅ Final converted patients:', patients.length);
    console.log('📋 Patients summary:', patients.map(p => ({
      id: p.id,
      name: p.name,
      age: p.age,
      similarity_score: p.similarity_score
    })));

    this.log('Converted documents to patients:', patients);
    return patients;
  }

  /**
   * Get platform overview statistics
   *
   * @description Retrieves comprehensive platform statistics including document counts,
   * processing metrics, user activity, and system performance data.
   *
   * @returns Observable with platform statistics
   * @since 1.0.0
   *
   * @example
   * ```typescript
   * this.apiService.getPlatformStatistics().subscribe(stats => {
   *   console.log('Total documents:', stats.total_documents);
   *   console.log('Active users:', stats.active_users);
   * });
   * ```
   */
  getPlatformStatistics(): Observable<any> {
    const url = `${this.apiUrl}/statistics/platform/overview`;

    console.log('📊 Fetching platform statistics from:', url);

    return this.http.get<any>(url, { headers: this.headers })
      .pipe(
        retry(2),
        timeout(10000),
        catchError(this.handleError),
        map(response => {
          console.log('✅ Platform statistics retrieved:', response);
          return response;
        })
      );
  }
}
