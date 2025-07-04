import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, retry } from 'rxjs/operators';
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

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = environment.apiUrl;
  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  constructor(private http: HttpClient) {}

  // ========== Patient Management ==========
  
  getPatients(page = 1, perPage = 20): Observable<PatientSearchResult> {
    const url = `${this.apiUrl}/api/v1/patients/?limit=${perPage}&offset=${(page-1)*perPage}`;
    console.log('ApiService: Making request to:', url);
    
    return this.http.get<PatientSearchResult>(url, { headers: this.headers }).pipe(
      map(result => {
        console.log('ApiService: getPatients response:', result);
        return result;
      }),
      retry(1),
      catchError(error => {
        console.error('ApiService: getPatients error:', error);
        return this.handleError(error);
      })
    );
  }

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

  getPatientById(patientId: string): Observable<Patient> {
    return this.http.get<Patient>(
      `${this.apiUrl}/api/v1/patients/${patientId}`,
      { headers: this.headers }
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

  recordPatientInteraction(patientId: string, interaction: Omit<PatientInteraction, 'patient_id'>): Observable<{message: string}> {
    // ⚠️ NOTA: Backend usa /interaction (singular) y espera parámetros específicos
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
  
  sendMedicalChat(request: ChatRequest): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(
      `${this.apiUrl}/api/v1/chat/medical`,
      request,
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  sendQuickQuery(messages: ChatRequest['messages']): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(
      `${this.apiUrl}/api/v1/chat/quick`,
      { messages },
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  analyzeCaseHistory(patientId: string, query: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(
      `${this.apiUrl}/api/v1/chat/analyze-case`,
      { patient_id: patientId, query },
      { headers: this.headers }
    ).pipe(
      catchError(this.handleError)
    );
  }

  // ========== Health Checks ==========
  
  checkHealth(): Observable<HealthCheckResponse> {
    return this.http.get<HealthCheckResponse>(
      `${this.apiUrl}/api/v1/health`,
      { headers: this.headers }
    ).pipe(
      retry(1),
      catchError(this.handleError)
    );
  }

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
  
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.detail || error.error?.error || `Error Code: ${error.status}\nMessage: ${error.message}`;
    }

    console.error('API Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}