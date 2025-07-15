import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, map, tap, retry } from 'rxjs/operators';
import { environment } from '@environments/environment';
import {
  Pill,
  CreatePillRequest,
  UpdatePillRequest,
  PillResponse,
  PillsListResponse
} from '../models';

/**
 * Service for managing Pills (Quick Questions) operations
 *
 * @description Provides methods for creating, reading, updating, and deleting
 * quick question pills through the REST API. Includes local state management
 * and error handling for seamless UI integration.
 *
 * @example
 * ```typescript
 * constructor(private pillsService: PillsService) {}
 *
 * // Create a new pill
 * const newPill: CreatePillRequest = {
 *   starter: 'Diagnóstico',
 *   text: 'Realizar diagnóstico inicial completo',
 *   icon: '🩺',
 *   category: 'diagnosis',
 *   priority: 1
 * };
 *
 * this.pillsService.createPill(newPill).subscribe(pill => {
 *   console.log('Pill created:', pill);
 * });
 *
 * // Load all pills
 * this.pillsService.loadPills().subscribe(pills => {
 *   console.log('All pills:', pills);
 * });
 * ```
 *
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class PillsService {
  /** Base API URL from environment configuration */
  private readonly apiUrl = environment.apiUrl;

  /** Default HTTP headers for API requests */
  private readonly headers = new HttpHeaders({
    'Content-Type': 'application/json'
  });

  /** BehaviorSubject to track current pills state */
  private readonly pillsSubject = new BehaviorSubject<Pill[]>([]);

  /** Observable for pills state changes */
  public readonly pills$ = this.pillsSubject.asObservable();

  /** BehaviorSubject to track loading state */
  private readonly loadingSubject = new BehaviorSubject<boolean>(false);

  /** Observable for loading state changes */
  public readonly loading$ = this.loadingSubject.asObservable();

  /** BehaviorSubject to track error state */
  private readonly errorSubject = new BehaviorSubject<string | null>(null);

  /** Observable for error state changes */
  public readonly error$ = this.errorSubject.asObservable();

  /**
   * Creates an instance of PillsService
   *
   * @param http - Angular HttpClient for making HTTP requests
   */
  constructor(private http: HttpClient) {
    this.log('PillsService initialized with:', {
      apiUrl: this.apiUrl,
      environment: environment.production ? 'production' : 'development'
    });
  }

  // ========== Public Methods ==========

  /**
   * Loads all pills from the API
   *
   * @returns Observable containing array of pills
   *
   * @example
   * ```typescript
   * this.pillsService.loadPills().subscribe({
   *   next: (pills) => console.log('Loaded pills:', pills.length),
   *   error: (error) => console.error('Failed to load pills:', error)
   * });
   * ```
   */
  loadPills(limit: number = 100, skip: number = 0): Observable<Pill[]> {
    this.setLoading(true);
    this.clearError();

    return this.http.get<PillsListResponse>(`${this.apiUrl}/api/v1/pills/?limit=${limit}&skip=${skip}`, {
      headers: this.headers
    }).pipe(
      retry(environment.retryAttempts || 1),
      map(response => {
        this.log('loadPills response:', response);
        return response.pills || [];
      }),
      tap(pills => {
        this.pillsSubject.next(pills);
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false);
        return this.handleError('Error loading pills', error);
      })
    );
  }

  /**
   * Creates a new pill
   *
   * @param pillData - Data for the new pill
   * @returns Observable containing the created pill
   *
   * @example
   * ```typescript
   * const newPill: CreatePillRequest = {
   *   starter: 'Síntomas',
   *   text: 'Analizar síntomas del paciente',
   *   icon: '📋',
   *   category: 'symptoms',
   *   priority: 1
   * };
   *
   * this.pillsService.createPill(newPill).subscribe({
   *   next: (pill) => console.log('Created pill:', pill),
   *   error: (error) => console.error('Failed to create pill:', error)
   * });
   * ```
   */
    createPill(pillData: CreatePillRequest): Observable<Pill> {
    this.setLoading(true);
    this.clearError();

    // Ensure data types match the API exactly as in your curl
    const requestPayload = {
      starter: String(pillData.starter).trim(),
      text: String(pillData.text).trim(),
      icon: String(pillData.icon),
      category: String(pillData.category),
      priority: Number(pillData.priority), // Explicitly convert to number
      is_active: pillData.is_active !== undefined ? pillData.is_active : true
    };

    this.log('🚀 Creating pill with payload:', requestPayload);
    console.log('📤 Raw request data:', JSON.stringify(requestPayload, null, 2));

    return this.http.post<any>(`${this.apiUrl}/api/v1/pills/`, requestPayload, {
      headers: this.headers
    }).pipe(
      retry(environment.retryAttempts || 1),
      map(response => {
        this.log('✅ createPill response:', response);

        // Handle different response formats from the API
        if (response.error || (response.success === false)) {
          throw new Error(response.error || response.message || 'Unknown error');
        }

        // Return the pill data (may be directly in response or in response.data)
        const pillData = response.data || response;

        if (!pillData) {
          throw new Error('No pill data returned from server');
        }

        return pillData;
      }),
      tap(newPill => {
        // Add the new pill to local state
        const currentPills = this.pillsSubject.value;
        this.pillsSubject.next([...currentPills, newPill]);
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false);
        return this.handleError('Error creating pill', error);
      })
    );
  }

  /**
   * Updates an existing pill
   *
   * @param pillData - Updated pill data including ID
   * @returns Observable containing the updated pill
   *
   * @example
   * ```typescript
   * const updatedPill: UpdatePillRequest = {
   *   id: 'pill-123',
   *   text: 'Updated question text',
   *   priority: 2
   * };
   *
   * this.pillsService.updatePill(updatedPill).subscribe({
   *   next: (pill) => console.log('Updated pill:', pill),
   *   error: (error) => console.error('Failed to update pill:', error)
   * });
   * ```
   */
  updatePill(pillData: UpdatePillRequest): Observable<Pill> {
    this.setLoading(true);
    this.clearError();

    const { id, ...updateData } = pillData;

    // Ensure data types match the API requirements
    const requestPayload = {
      starter: String(updateData.starter || '').trim(),
      text: String(updateData.text || '').trim(),
      icon: String(updateData.icon || ''),
      category: String(updateData.category || ''),
      priority: Number(updateData.priority || 1),
      is_active: updateData.is_active !== undefined ? updateData.is_active : true
    };

    this.log('🚀 Updating pill with payload:', requestPayload);
    console.log('📤 Update request data:', JSON.stringify(requestPayload, null, 2));

    return this.http.put<any>(`${this.apiUrl}/api/v1/pills/${id}`, requestPayload, {
      headers: this.headers
    }).pipe(
      retry(environment.retryAttempts || 1),
      map(response => {
        this.log('✅ updatePill response:', response);

        // Handle different response formats from the API
        if (response.error || (response.success === false)) {
          throw new Error(response.error || response.message || 'Unknown error');
        }

        // Return the pill data (may be directly in response or in response.data)
        const pillData = response.data || response;

        if (!pillData) {
          throw new Error('No pill data returned from server');
        }

        return pillData;
      }),
      tap(updatedPill => {
        // Update the pill in local state
        const currentPills = this.pillsSubject.value;
        const updatedPillId = updatedPill.id || (updatedPill as any).pill_id;
        const index = currentPills.findIndex(p => {
          const currentPillId = p.id || (p as any).pill_id;
          return currentPillId === updatedPillId;
        });
        if (index !== -1) {
          const newPills = [...currentPills];
          newPills[index] = updatedPill;
          this.pillsSubject.next(newPills);
        }
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false);
        return this.handleError('Error updating pill', error);
      })
    );
  }

  /**
   * Deletes a pill by ID
   *
   * @param pillId - ID of the pill to delete
   * @returns Observable with success message
   *
   * @example
   * ```typescript
   * this.pillsService.deletePill('pill-123').subscribe({
   *   next: (message) => console.log('Deleted:', message),
   *   error: (error) => console.error('Failed to delete pill:', error)
   * });
   * ```
   */
  deletePill(pillId: string): Observable<string> {
    this.setLoading(true);
    this.clearError();

    return this.http.delete<PillResponse>(`${this.apiUrl}/api/v1/pills/${pillId}`, {
      headers: this.headers
    }).pipe(
      retry(environment.retryAttempts || 1),
      map(response => {
        this.log('deletePill response:', response);

        if (!response.success && response.error) {
          throw new Error(response.error);
        }

        return response.message || 'Pill deleted successfully';
      }),
      tap(() => {
        // Remove the pill from local state
        const currentPills = this.pillsSubject.value;
        const filteredPills = currentPills.filter(p => {
          const currentPillId = p.id || (p as any).pill_id;
          return currentPillId !== pillId;
        });
        this.pillsSubject.next(filteredPills);
        this.setLoading(false);
      }),
      catchError(error => {
        this.setLoading(false);
        return this.handleError('Error deleting pill', error);
      })
    );
  }

  /**
   * Gets a specific pill by ID
   *
   * @param pillId - ID of the pill to retrieve
   * @returns Observable containing the pill
   *
   * @example
   * ```typescript
   * this.pillsService.getPillById('pill-123').subscribe({
   *   next: (pill) => console.log('Found pill:', pill),
   *   error: (error) => console.error('Pill not found:', error)
   * });
   * ```
   */
  getPillById(pillId: string): Observable<Pill> {
    this.clearError();

    return this.http.get<PillResponse>(`${this.apiUrl}/api/v1/pills/${pillId}`, {
      headers: this.headers
    }).pipe(
      retry(environment.retryAttempts || 1),
      map(response => {
        this.log('getPillById response:', response);

        if (!response.success && response.error) {
          throw new Error(response.error);
        }

        if (!response.data) {
          throw new Error('Pill not found');
        }

        return response.data;
      }),
      catchError(error => {
        return this.handleError('Error getting pill', error);
      })
    );
  }

  /**
   * Gets the current pills array synchronously
   *
   * @returns Current array of pills
   *
   * @example
   * ```typescript
   * const currentPills = this.pillsService.getCurrentPills();
   * console.log('Current pills count:', currentPills.length);
   * ```
   */
  getCurrentPills(): Pill[] {
    return this.pillsSubject.value;
  }

  /**
   * Clears all pills from local state
   *
   * @example
   * ```typescript
   * this.pillsService.clearPills();
   * ```
   */
  clearPills(): void {
    this.pillsSubject.next([]);
    this.clearError();
  }

  // ========== Private Helper Methods ==========

  /**
   * Sets the loading state
   *
   * @private
   * @param loading - Whether the service is currently loading
   */
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Sets an error message
   *
   * @private
   * @param message - Error message to set
   */
  private setError(message: string): void {
    this.errorSubject.next(message);
  }

  /**
   * Clears the current error state
   *
   * @private
   */
  private clearError(): void {
    this.errorSubject.next(null);
  }

  /**
   * Handles API errors consistently
   *
   * @private
   * @param context - Context description for the error
   * @param error - The error object from HTTP request
   * @returns Observable that throws a formatted error
   */
  private handleError(context: string, error: any): Observable<never> {
    let errorMessage = `${context}: `;

    if (error.error?.detail) {
      errorMessage += error.error.detail;
    } else if (error.error?.error) {
      errorMessage += error.error.error;
    } else if (error.message) {
      errorMessage += error.message;
    } else {
      errorMessage += 'Unknown error occurred';
    }

    this.log(`❌ ${context}:`, error);
    this.setError(errorMessage);

    return throwError(() => new Error(errorMessage));
  }

  /**
   * Logs messages in development mode
   *
   * @private
   * @param message - Message to log
   * @param data - Optional data to log
   */
  private log(message: string, data?: any): void {
    if (!environment.production) {
      console.log(`🏥 [PillsService] ${message}`, data || '');
    }
  }
}
