import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError, tap, switchMap } from 'rxjs/operators';
import { ChatSession, ChatSessionRequest, ChatSessionResponse, Patient, PatientDocument } from '../models';
import { ApiService } from './api.service';

/**
 * Service for managing chat sessions in the medical system
 *
 * @description Handles creation, retrieval, and management of chat sessions
 * that link patients with documents for contextual medical conversations.
 * Maintains active session state and provides session lifecycle management.
 *
 * @example
 * ```typescript
 * constructor(private chatSessionService: ChatSessionService) {}
 *
 * // Create session for patient
 * this.chatSessionService.createSessionForPatient(patient, document).subscribe(session => {
 *   console.log('Session created:', session.session_id);
 * });
 *
 * // Get current active session
 * this.chatSessionService.activeSession$.subscribe(session => {
 *   console.log('Active session:', session?.session_name);
 * });
 * ```
 *
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class ChatSessionService {
  /** Current active session */
  private activeSessionSubject = new BehaviorSubject<ChatSession | null>(null);

  /** Observable for active session changes */
  public readonly activeSession$ = this.activeSessionSubject.asObservable();

  /** Default user ID for session creation */
  private readonly DEFAULT_USER_ID = 'pedro';

  /**
   * Constructor - Initializes chat session service
   *
   * @param apiService - Service for API communication
   */
  constructor(private apiService: ApiService) {
    console.log('🔄 ChatSessionService initialized');
  }

  // ========== Session Creation ==========

  /**
   * Creates a new chat session for a patient and their first document
   *
   * @param patient - Patient to create session for
   * @param document - Primary document for the session (optional, uses first document if not provided)
   * @returns Observable with the created session
   *
   * @example
   * ```typescript
   * this.chatSessionService.createSessionForPatient(patient, document).subscribe({
   *   next: (session) => {
   *     console.log('Session created:', session.session_id);
   *   },
   *   error: (error) => {
   *     console.error('Failed to create session:', error);
   *   }
   * });
   * ```
   */
  createSessionForPatient(patient: Patient, document?: PatientDocument): Observable<ChatSession> {
    console.log('🔄 Creating session for patient:', patient.name);

    // Use provided document or first document from patient
    const targetDocument = document || patient.documents?.[0];

    if (!targetDocument) {
      console.error('❌ No document available for session creation');
      return of(null!).pipe(
        switchMap(() => {
          throw new Error('No document available for session creation');
        })
      );
    }

    const sessionRequest: ChatSessionRequest = {
      user_id: this.DEFAULT_USER_ID,
      document_id: targetDocument.document_id,
      session_name: `Consulta ${patient.name}`
    };

    console.log('📋 Session request:', sessionRequest);

    return this.apiService.createChatSession(sessionRequest).pipe(
      tap(session => {
        console.log('✅ Session created successfully:', session.session_id);
        this.setActiveSession(session);
      }),
      catchError(error => {
        console.error('❌ Error creating session:', error);
        throw error;
      })
    );
  }

  /**
   * Creates a session with custom parameters
   *
   * @param sessionRequest - Custom session creation request
   * @returns Observable with the created session
   *
   * @example
   * ```typescript
   * const request: ChatSessionRequest = {
   *   user_id: 'pedro',
   *   document_id: 'doc-123',
   *   session_name: 'Emergency Consultation'
   * };
   *
   * this.chatSessionService.createSession(request).subscribe(session => {
   *   console.log('Custom session created:', session.session_id);
   * });
   * ```
   */
  createSession(sessionRequest: ChatSessionRequest): Observable<ChatSession> {
    console.log('🔄 Creating custom session:', sessionRequest);

    return this.apiService.createChatSession(sessionRequest).pipe(
      tap(session => {
        console.log('✅ Custom session created:', session.session_id);
        this.setActiveSession(session);
      }),
      catchError(error => {
        console.error('❌ Error creating custom session:', error);
        throw error;
      })
    );
  }

  // ========== Session Management ==========

  /**
   * Sets the active session
   *
   * @param session - Session to set as active (null to clear)
   *
   * @example
   * ```typescript
   * this.chatSessionService.setActiveSession(session);
   * ```
   */
  setActiveSession(session: ChatSession | null): void {
    console.log('🎯 Setting active session:', session?.session_name || 'none');
    this.activeSessionSubject.next(session);
  }

  /**
   * Gets the current active session
   *
   * @returns Current active session or null
   *
   * @example
   * ```typescript
   * const session = this.chatSessionService.getActiveSession();
   * if (session) {
   *   console.log('Active session:', session.session_name);
   * }
   * ```
   */
  getActiveSession(): ChatSession | null {
    return this.activeSessionSubject.value;
  }

  /**
   * Retrieves a session by ID
   *
   * @param sessionId - Unique session identifier
   * @returns Observable with session data
   *
   * @example
   * ```typescript
   * this.chatSessionService.getSessionById('session-123').subscribe(session => {
   *   console.log('Retrieved session:', session.session_name);
   * });
   * ```
   */
  getSessionById(sessionId: string): Observable<ChatSession> {
    console.log('🔍 Retrieving session by ID:', sessionId);

    return this.apiService.getChatSession(sessionId).pipe(
      tap(session => {
        console.log('✅ Session retrieved:', session.session_name);
      }),
      catchError(error => {
        console.error('❌ Error retrieving session:', error);
        throw error;
      })
    );
  }

  /**
   * Lists all sessions for a user
   *
   * @param userId - User identifier (optional, defaults to default user)
   * @returns Observable with array of sessions
   *
   * @example
   * ```typescript
   * this.chatSessionService.getUserSessions().subscribe(sessions => {
   *   console.log('User sessions:', sessions.length);
   * });
   * ```
   */
  getUserSessions(userId?: string): Observable<ChatSession[]> {
    const targetUserId = userId || this.DEFAULT_USER_ID;
    console.log('🔍 Retrieving sessions for user:', targetUserId);

    return this.apiService.getChatSessions(targetUserId).pipe(
      tap(sessions => {
        console.log('✅ Retrieved sessions:', sessions.length);
      }),
      catchError(error => {
        console.error('❌ Error retrieving user sessions:', error);
        throw error;
      })
    );
  }

  // ========== Session Utilities ==========

  /**
   * Checks if there's an active session
   *
   * @returns True if there's an active session
   *
   * @example
   * ```typescript
   * if (this.chatSessionService.hasActiveSession()) {
   *   console.log('Session is active');
   * }
   * ```
   */
  hasActiveSession(): boolean {
    return this.activeSessionSubject.value !== null;
  }

  /**
   * Gets the active session ID
   *
   * @returns Active session ID or null
   *
   * @example
   * ```typescript
   * const sessionId = this.chatSessionService.getActiveSessionId();
   * if (sessionId) {
   *   console.log('Active session ID:', sessionId);
   * }
   * ```
   */
  getActiveSessionId(): string | null {
    return this.activeSessionSubject.value?.session_id || null;
  }



  /**
   * Clears the active session
   *
   * @example
   * ```typescript
   * this.chatSessionService.clearActiveSession();
   * ```
   */
  clearActiveSession(): void {
    console.log('🧹 Clearing active session');
    this.activeSessionSubject.next(null);
  }

  /**
   * Gets session information for debugging
   *
   * @returns Object with session state information
   */
  getSessionInfo(): {
    hasActiveSession: boolean;
    activeSessionId: string | null;
    activeSessionName: string | null;
  } {
    const session = this.activeSessionSubject.value;
    return {
      hasActiveSession: session !== null,
      activeSessionId: session?.session_id || null,
      activeSessionName: session?.session_name || null
    };
  }
}
