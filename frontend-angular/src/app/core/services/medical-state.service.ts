import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { map, distinctUntilChanged, switchMap, catchError, tap } from 'rxjs/operators';
import { Patient, ChatMessage, PatientInteraction, ChatSession } from '../models';
import { ApiService } from './api.service';
import { ChatSessionService } from './chat-session.service';

/**
 * Constants for localStorage keys
 */
const STORAGE_KEYS = {
  ACTIVE_PATIENT: 'tecsalud_active_patient',
  RECENT_PATIENTS: 'tecsalud_recent_patients',
  CHAT_HISTORY: 'tecsalud_chat_history'
} as const;

/**
 * Interface for the complete medical application state
 *
 * @interface MedicalState
 * @description Defines the structure for managing medical data including patients,
 * chat history, and UI states specific to medical workflows
 */
interface MedicalState {
  /** Patient management */
  activePatient: Patient | null;
  recentPatients: Patient[];
  searchResults: Patient[];

  /** Chat management */
  chatHistory: Map<string, ChatMessage[]>;
  currentChatMessages: ChatMessage[];
  isStreaming: boolean;
  streamingMessage: string;

  /** UI states */
  isSearching: boolean;
  isLoadingPatient: boolean;
  error: string | null;
}

/**
 * Service for managing medical application state and patient interactions
 *
 * @description Centralized state management for medical workflows including patient selection,
 * chat history management, streaming responses, and patient search functionality.
 * Integrates with ApiService for backend communication and automatic interaction recording.
 *
 * @example
 * ```typescript
 * constructor(private medicalState: MedicalStateService) {}
 *
 * // Select a patient
 * this.medicalState.setActivePatient(patient);
 *
 * // Listen to active patient changes
 * this.medicalState.activePatient$.subscribe(patient => {
 *   console.log('Active patient:', patient?.name);
 * });
 *
 * // Search for patients
 * this.medicalState.searchPatients('John');
 *
 * // Add chat message
 * const message: ChatMessage = {
 *   role: 'user',
 *   content: 'What are the symptoms?',
 *   timestamp: new Date()
 * };
 * this.medicalState.addMessage(message);
 *
 * // Handle streaming AI responses
 * this.medicalState.startStreaming();
 * this.medicalState.updateStreamingMessage('Partial response...');
 * this.medicalState.finishStreaming();
 * ```
 *
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class MedicalStateService {
  /** Initial state configuration */
  private readonly initialState: MedicalState = {
    activePatient: null,
    recentPatients: [],
    searchResults: [],
    chatHistory: new Map(),
    currentChatMessages: [],
    isStreaming: false,
    streamingMessage: '',
    isSearching: false,
    isLoadingPatient: false,
    error: null
  };

  /** Internal state subject for reactive state management */
  private state$ = new BehaviorSubject<MedicalState>(this.initialState);

  /** Observable for active patient changes */
  public readonly activePatient$ = this.state$.pipe(
    map(state => state.activePatient),
    distinctUntilChanged()
  );

  /** Observable for recent patients list changes */
  public readonly recentPatients$ = this.state$.pipe(
    map(state => state.recentPatients),
    distinctUntilChanged()
  );

  /** Observable for patient search results changes */
  public readonly searchResults$ = this.state$.pipe(
    map(state => state.searchResults),
    distinctUntilChanged()
  );

  /** Observable for current chat messages changes */
  public readonly currentChatMessages$ = this.state$.pipe(
    map(state => state.currentChatMessages),
    distinctUntilChanged()
  );

  /** Observable for streaming state changes */
  public readonly isStreaming$ = this.state$.pipe(
    map(state => state.isStreaming),
    distinctUntilChanged()
  );

  /** Observable for streaming message content changes */
  public readonly streamingMessage$ = this.state$.pipe(
    map(state => state.streamingMessage),
    distinctUntilChanged()
  );

  /** Observable for search state changes */
  public readonly isSearching$ = this.state$.pipe(
    map(state => state.isSearching),
    distinctUntilChanged()
  );

  /** Observable for error state changes */
  public readonly error$ = this.state$.pipe(
    map(state => state.error),
    distinctUntilChanged()
  );

  /** Observable for active chat session changes */
  public get activeSession$() {
    return this.chatSessionService.activeSession$;
  }

  /**
   * Constructor - Initializes state management and loads persisted data
   *
   * @param apiService - Service for API communication
   * @param chatSessionService - Service for chat session management
   *
   * @description Initializes the medical state service with persisted data from localStorage,
   * sets up automatic state persistence, and loads recent patients from API.
   */
  constructor(
    private apiService: ApiService,
    private chatSessionService: ChatSessionService
  ) {
    this.loadPersistedState();
    this.setupStatePersistence();
    this.loadRecentPatients();
  }

  // ========== State Persistence ==========

  /**
   * Loads persisted state from localStorage
   *
   * @private
   * @description Restores the application state from localStorage including
   * active patient, recent patients, and chat history
   */
  private loadPersistedState(): void {
    try {
      // Load active patient
      const savedActivePatient = localStorage.getItem(STORAGE_KEYS.ACTIVE_PATIENT);
      const activePatient = savedActivePatient ? JSON.parse(savedActivePatient) : null;

      // Load recent patients
      const savedRecentPatients = localStorage.getItem(STORAGE_KEYS.RECENT_PATIENTS);
      const recentPatients = savedRecentPatients ? JSON.parse(savedRecentPatients) : [];

      // Load chat history
      const savedChatHistory = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      const chatHistoryArray: [string, ChatMessage[]][] = savedChatHistory ? JSON.parse(savedChatHistory) : [];
      const chatHistory = new Map<string, ChatMessage[]>(chatHistoryArray);

      // Get current messages for active patient
      const currentChatMessages: ChatMessage[] = activePatient ?
        (chatHistory.get(activePatient.id) || []) :
        [];

      // Update state with persisted data
      const currentState = this.state$.value;
      this.state$.next({
        ...currentState,
        activePatient,
        recentPatients,
        chatHistory,
        currentChatMessages
      });

      console.log('🔄 State loaded from localStorage:', {
        activePatient: activePatient?.name || 'none',
        recentPatientsCount: recentPatients.length,
        chatHistoryEntries: chatHistory.size
      });

    } catch (error) {
      console.error('❌ Error loading persisted state:', error);
      // Continue with default state if loading fails
    }
  }

  /**
   * Sets up automatic state persistence
   *
   * @private
   * @description Subscribes to state changes and automatically saves
   * relevant data to localStorage
   */
  private setupStatePersistence(): void {
    // Persist active patient changes
    this.activePatient$.pipe(
      tap(patient => {
        try {
          if (patient) {
            localStorage.setItem(STORAGE_KEYS.ACTIVE_PATIENT, JSON.stringify(patient));
            console.log('💾 Active patient saved to localStorage:', patient.name);
          } else {
            localStorage.removeItem(STORAGE_KEYS.ACTIVE_PATIENT);
            console.log('💾 Active patient cleared from localStorage');
          }
        } catch (error) {
          console.error('❌ Error saving active patient:', error);
        }
      })
    ).subscribe();

    // Persist recent patients changes
    this.recentPatients$.pipe(
      tap(patients => {
        try {
          localStorage.setItem(STORAGE_KEYS.RECENT_PATIENTS, JSON.stringify(patients));
          console.log('💾 Recent patients saved to localStorage:', patients.length);
        } catch (error) {
          console.error('❌ Error saving recent patients:', error);
        }
      })
    ).subscribe();

    // Persist chat history changes
    this.state$.pipe(
      map(state => state.chatHistory),
      distinctUntilChanged(),
      tap(chatHistory => {
        try {
          const chatHistoryArray = Array.from(chatHistory.entries());
          localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(chatHistoryArray));
          console.log('💾 Chat history saved to localStorage:', chatHistory.size, 'entries');
        } catch (error) {
          console.error('❌ Error saving chat history:', error);
        }
      })
    ).subscribe();
  }

  /**
   * Clears all persisted state
   *
   * @description Removes all saved state from localStorage and resets to initial state
   */
  public clearPersistedState(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_PATIENT);
      localStorage.removeItem(STORAGE_KEYS.RECENT_PATIENTS);
      localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);

      console.log('🧹 All persisted state cleared from localStorage');

      // Reset to initial state
      this.state$.next(this.initialState);
    } catch (error) {
      console.error('❌ Error clearing persisted state:', error);
    }
  }

  /**
   * Checks if there's persisted state available
   *
   * @returns {boolean} True if any persisted state exists
   */
  public hasPersistedState(): boolean {
    try {
      return !!(
        localStorage.getItem(STORAGE_KEYS.ACTIVE_PATIENT) ||
        localStorage.getItem(STORAGE_KEYS.RECENT_PATIENTS) ||
        localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Gets information about persisted state
   *
   * @returns Object with persisted state information
   */
  public getPersistedStateInfo(): {
    hasActivePatient: boolean;
    recentPatientsCount: number;
    chatHistoryEntries: number;
    storageSize: number;
  } {
    try {
      const activePatient = localStorage.getItem(STORAGE_KEYS.ACTIVE_PATIENT);
      const recentPatients = localStorage.getItem(STORAGE_KEYS.RECENT_PATIENTS);
      const chatHistory = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);

      const recentPatientsData = recentPatients ? JSON.parse(recentPatients) : [];
      const chatHistoryData = chatHistory ? JSON.parse(chatHistory) : [];

      const storageSize = (activePatient?.length || 0) +
                         (recentPatients?.length || 0) +
                         (chatHistory?.length || 0);

      return {
        hasActivePatient: !!activePatient,
        recentPatientsCount: recentPatientsData.length || 0,
        chatHistoryEntries: chatHistoryData.length || 0,
        storageSize
      };
    } catch (error) {
      return {
        hasActivePatient: false,
        recentPatientsCount: 0,
        chatHistoryEntries: 0,
        storageSize: 0
      };
    }
  }

  // ========== Patient Management ==========

  /**
   * Sets the active patient for medical context
   *
   * @param patient - Patient to set as active (null to clear)
   *
   * @description Sets the active patient, loads their chat history,
   * creates a chat session, and updates recent patients list.
   *
   * @example
   * ```typescript
   * // Set active patient
   * this.medicalState.setActivePatient(selectedPatient);
   *
   * // Clear active patient
   * this.medicalState.setActivePatient(null);
   * ```
   */
  setActivePatient(patient: Patient | null): void {
    console.log('🏥 MedicalStateService.setActivePatient called with:', patient?.name || 'null');

    const currentState = this.state$.value;

    // Update state
    this.state$.next({
      ...currentState,
      activePatient: patient,
      currentChatMessages: patient ?
        currentState.chatHistory.get(patient.id) || [] :
        [],
      error: null
    });

    // Log state update
    console.log('🏥 State updated - activePatient:', this.state$.value.activePatient?.name || 'null');

    // Handle patient selection
    if (patient) {
      // Create chat session for the patient
      this.createChatSessionForPatient(patient);

      // Add to recent patients if not already there
      if (!currentState.recentPatients.find(p => p.id === patient.id)) {
        this.state$.next({
          ...this.state$.value,
          recentPatients: [patient, ...currentState.recentPatients].slice(0, 10)
        });
      }
    } else {
      // Clear active session when patient is cleared
      this.chatSessionService.clearActiveSession();
    }
  }

  /**
   * Creates a chat session for the selected patient
   *
   * @private
   * @param patient - Patient to create session for
   *
   * @description Creates a chat session using the patient's first document.
   * This session will be used for contextual chat interactions.
   */
  private createChatSessionForPatient(patient: Patient): void {
    console.log('🔄 Creating chat session for patient:', patient.name);

    // Check if patient has documents
    if (!patient.documents || patient.documents.length === 0) {
      console.warn('⚠️ Patient has no documents, cannot create chat session');
      return;
    }

    // Create session using the first document
    this.chatSessionService.createSessionForPatient(patient).subscribe({
      next: (session: ChatSession) => {
        console.log('✅ Chat session created successfully:', {
          sessionId: session.session_id,
          sessionName: session.session_name,
          documentId: session.document_id
        });
      },
      error: (error) => {
        console.error('❌ Failed to create chat session:', error);
        // Don't block patient selection if session creation fails
        // The chat functionality might still work without a session
      }
    });
  }

  /**
   * Selects a patient and navigates to chat with guaranteed context preservation
   *
   * @param patient - Patient to select and activate
   * @param router - Angular Router instance for navigation
   *
   * @description Centralized method that handles patient selection and navigation
   * with guaranteed state preservation across route changes.
   *
   * @example
   * ```typescript
   * // In any component
   * this.medicalState.selectPatientAndNavigate(patient, this.router);
   * ```
   */
  selectPatientAndNavigate(patient: Patient, router: any): Promise<boolean> {
    console.log('🎯 ========================================');
    console.log('🎯 selectPatientAndNavigate started for:', patient.name);
    console.log('🎯 Current URL:', window.location.pathname);
    console.log('🎯 ========================================');

    return new Promise((resolve) => {
      // 1. Set active patient FIRST
      console.log('🎯 STEP 1: Setting active patient...');
      this.setActivePatient(patient);

      // 2. Verify patient was set
      const verifiedPatient = this.state$.value.activePatient;
      console.log('🎯 STEP 2: Verified active patient:', verifiedPatient?.name || 'NONE');

      if (!verifiedPatient) {
        console.error('❌ FAILED: Patient was not set properly');
        resolve(false);
        return;
      }

      // 3. Check if already in chat
      const currentUrl = window.location.pathname;
      const isAlreadyInChat = currentUrl === '/chat';

      if (isAlreadyInChat) {
        console.log('✅ SUCCESS: Already in chat, patient context updated');
        console.log('🎯 STEP 3: No navigation needed');
        resolve(true);
        return;
      }

      // 4. Navigate to chat
      console.log('🎯 STEP 3: Navigating to chat...');
      router.navigate(['/chat']).then((navigationSuccess: boolean) => {
        console.log('🎯 STEP 4: Navigation result:', navigationSuccess);

        if (navigationSuccess) {
          // 5. Double-check patient state after navigation
          setTimeout(() => {
            const finalPatient = this.state$.value.activePatient;
            console.log('🎯 STEP 5: Final verification - active patient:', finalPatient?.name || 'NONE');

            if (finalPatient && finalPatient.id === patient.id) {
              console.log('✅ SUCCESS: Patient selection and navigation completed');
              resolve(true);
            } else {
              console.error('❌ FAILED: Patient context lost after navigation');
              // Try to restore it
              this.setActivePatient(patient);
              resolve(false);
            }
          }, 100);
        } else {
          console.error('❌ FAILED: Navigation returned false');
          resolve(false);
        }
      }).catch((error: any) => {
        console.error('❌ ERROR: Navigation failed:', error);
        resolve(false);
      });
    });
  }

  /**
   * Gets the current navigation state for debugging
   *
   * @returns Current state information for debugging
   */
  getDebugState(): any {
    return {
      activePatient: this.state$.value.activePatient,
      recentPatientsCount: this.state$.value.recentPatients.length,
      chatHistoryCount: this.state$.value.chatHistory.size,
      currentUrl: window.location.pathname,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Searches for patients by query string with fuzzy matching
   *
   * @param query - Search query (name, ID, medical record number, etc.)
   *
   * @description Performs fuzzy search for patients using the backend API.
   * Updates the search results in the application state and handles loading states.
   * Clears results when query is empty.
   *
   * @example
   * ```typescript
   * // Search for patients named "Juan"
   * this.medicalState.searchPatients('Juan');
   *
   * // Clear search results
   * this.medicalState.searchPatients('');
   *
   * // Listen to search results
   * this.medicalState.searchResults$.subscribe(results => {
   *   console.log('Found patients:', results.length);
   * });
   * ```
   */
  searchPatients(query: string): void {
    console.log('🔍 MedicalStateService.searchPatients called with query:', query);

    if (!query.trim()) {
      console.log('🧹 Empty query, clearing search results');
      this.state$.next({
        ...this.state$.value,
        searchResults: [],
        isSearching: false
      });
      return;
    }

    console.log('🔍 MedicalStateService: Starting search for:', query);
    this.state$.next({
      ...this.state$.value,
      isSearching: true,
      error: null
    });

    // TODO: Replace with actual user authentication when implemented
    // For now, using a default user_id until authentication system is in place
    const defaultUserId = 'pedro';
    console.log('👤 Using user ID:', defaultUserId);

    this.apiService.searchPatients(defaultUserId, query).pipe(
      catchError(error => {
        console.error('❌ MedicalStateService: Search error:', error);
        this.setError(`Error searching patients: ${error.message}`);
        return of([]);
      })
    ).subscribe(patients => {
      console.log('✅ MedicalStateService: Search completed successfully');
      console.log('📋 MedicalStateService: Received patients:', patients.length);
      console.log('🏥 MedicalStateService: Patients details:', patients.map(p => ({
        id: p.id,
        name: p.name,
        age: p.age,
        similarity_score: p.similarity_score
      })));

      this.state$.next({
        ...this.state$.value,
        searchResults: patients,
        isSearching: false
      });

      console.log('🔄 MedicalStateService: State updated with search results');
      console.log('📊 MedicalStateService: Current state searchResults length:', this.state$.value.searchResults.length);
    });
  }

  /**
   * Loads a patient by ID and sets as active
   *
   * @param patientId - Unique patient identifier
   *
   * @description Fetches patient data from API and sets as active patient.
   * Updates loading state during the operation.
   *
   * @example
   * ```typescript
   * this.medicalState.loadPatientById('patient-123');
   *
   * // Listen to loading state
   * this.medicalState.isLoadingPatient$.subscribe(loading => {
   *   if (loading) {
   *     console.log('Loading patient...');
   *   }
   * });
   * ```
   */
  loadPatientById(patientId: string): void {
    this.state$.next({
      ...this.state$.value,
      isLoadingPatient: true,
      error: null
    });

    this.apiService.getPatientById(patientId).pipe(
      catchError(error => {
        this.setError(`Error loading patient: ${error.message}`);
        return of(null);
      })
    ).subscribe(patient => {
      if (patient) {
        this.setActivePatient(patient);
      }
      this.state$.next({
        ...this.state$.value,
        isLoadingPatient: false
      });
    });
  }

  /**
   * Loads recent patients for quick access
   *
   * @private
   * @description Loads recent patients from localStorage. In the future, this should be replaced
   * with a proper "recent patients" API endpoint when available.
   */
  private loadRecentPatients(): void {
    // For now, we'll rely on localStorage to populate recent patients
    // since the backend doesn't have a dedicated "recent patients" endpoint
    // and searching with empty query may not work properly

    console.log('🔄 Loading recent patients from localStorage only');

    // Recent patients are already loaded in loadPersistedState()
    // If we need to fetch fresh data, we should wait for the backend to provide
    // a proper "recent patients" or "all patients" endpoint

    // TODO: Implement when backend provides:
    // - GET /patients/recent
    // - GET /patients/all
    // - Or similar endpoint that doesn't require search parameters
  }

  // ========== Chat Management ==========

  /**
   * Adds a message to the current patient's chat history
   *
   * @param message - Chat message to add
   *
   * @description Adds a message to the active patient's chat history.
   * Requires an active patient to be selected.
   *
   * @throws Will set error state if no active patient is selected
   *
   * @example
   * ```typescript
   * const userMessage: ChatMessage = {
   *   role: 'user',
   *   content: '¿Cuáles son los síntomas?',
   *   timestamp: new Date()
   * };
   *
   * this.medicalState.addMessage(userMessage);
   *
   * // AI response message
   * const aiMessage: ChatMessage = {
   *   role: 'assistant',
   *   content: 'Los síntomas incluyen...',
   *   timestamp: new Date()
   * };
   *
   * this.medicalState.addMessage(aiMessage);
   * ```
   */
  addMessage(message: ChatMessage): void {
    const currentState = this.state$.value;
    const activePatient = currentState.activePatient;

    if (!activePatient) {
      this.setError('No active patient selected');
      return;
    }

    const patientMessages = currentState.chatHistory.get(activePatient.id) || [];
    const updatedMessages = [...patientMessages, message];

    // Update chat history
    const newChatHistory = new Map(currentState.chatHistory);
    newChatHistory.set(activePatient.id, updatedMessages);

    this.state$.next({
      ...currentState,
      chatHistory: newChatHistory,
      currentChatMessages: updatedMessages,
      streamingMessage: '',
      error: null
    });
  }

  /**
   * Starts streaming mode for AI responses
   *
   * @description Initiates streaming mode and clears any previous streaming message.
   * Use this before starting to receive streaming chunks from AI.
   *
   * @example
   * ```typescript
   * // Start streaming
   * this.medicalState.startStreaming();
   *
   * // Listen to streaming state
   * this.medicalState.isStreaming$.subscribe(streaming => {
   *   if (streaming) {
   *     console.log('AI is responding...');
   *   }
   * });
   * ```
   */
  startStreaming(): void {
    this.state$.next({
      ...this.state$.value,
      isStreaming: true,
      streamingMessage: '',
      error: null
    });
  }

  /**
   * Updates the streaming message content
   *
   * @param chunk - New chunk of streaming content
   *
   * @description Updates the current streaming message with new content.
   * Typically used to append new chunks from streaming AI responses.
   *
   * @example
   * ```typescript
   * this.medicalState.startStreaming();
   *
   * // Simulate streaming chunks
   * this.medicalState.updateStreamingMessage('Los síntomas');
   * this.medicalState.updateStreamingMessage('Los síntomas incluyen');
   * this.medicalState.updateStreamingMessage('Los síntomas incluyen fiebre...');
   *
   * this.medicalState.finishStreaming();
   * ```
   */
  updateStreamingMessage(chunk: string): void {
    const currentState = this.state$.value;
    this.state$.next({
      ...currentState,
      streamingMessage: chunk
    });
  }

  /**
   * Finishes streaming and adds complete message to chat history
   *
   * @description Completes the streaming process, adds the final message
   * to chat history, and resets streaming state.
   *
   * @example
   * ```typescript
   * // Complete streaming sequence
   * this.medicalState.startStreaming();
   * this.medicalState.updateStreamingMessage('Complete AI response...');
   * this.medicalState.finishStreaming(); // Adds message to history
   * ```
   */
  finishStreaming(): void {
    const currentState = this.state$.value;
    const activePatient = currentState.activePatient;

    if (activePatient && currentState.streamingMessage) {
      // Add the complete message to history
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: currentState.streamingMessage,
        timestamp: new Date()
      };

      this.addMessage(assistantMessage);
    }

    this.state$.next({
      ...this.state$.value,
      isStreaming: false,
      streamingMessage: ''
    });
  }

  /**
   * Clears chat history for specific patient or all patients
   *
   * @param patientId - Optional patient ID to clear specific history
   *
   * @description Clears chat history. If patientId is provided, clears only
   * that patient's history. If no patientId, clears all chat history.
   *
   * @example
   * ```typescript
   * // Clear specific patient's chat history
   * this.medicalState.clearChatHistory('patient-123');
   *
   * // Clear all chat history
   * this.medicalState.clearChatHistory();
   * ```
   */
  clearChatHistory(patientId?: string): void {
    const currentState = this.state$.value;

    if (patientId) {
      // Clear specific patient's history
      const newChatHistory = new Map(currentState.chatHistory);
      newChatHistory.delete(patientId);

      this.state$.next({
        ...currentState,
        chatHistory: newChatHistory,
        currentChatMessages: currentState.activePatient?.id === patientId ? [] : currentState.currentChatMessages
      });
    } else {
      // Clear all history
      this.state$.next({
        ...currentState,
        chatHistory: new Map(),
        currentChatMessages: []
      });
    }
  }

  // ========== Helper Methods ==========

  /**
   * Sets error state and resets loading states
   *
   * @private
   * @param error - Error message to set
   *
   * @description Internal method to handle error states and cleanup loading flags
   */
  private setError(error: string): void {
    this.state$.next({
      ...this.state$.value,
      error,
      isStreaming: false,
      isSearching: false,
      isLoadingPatient: false
    });
  }

  /**
   * Records patient interaction in the backend
   *
   * @private
   * @param patientId - Patient identifier
   * @param type - Type of interaction
   * @param summary - Interaction summary
   *
   * @description Records patient interactions for audit and analytics purposes.
   * Errors are logged but don't affect the main workflow.
   */
  private recordInteraction(patientId: string, type: PatientInteraction['interaction_type'], summary: string): void {
    // TODO: Implement when backend endpoint is available
    // this.apiService.recordPatientInteraction(patientId, {
    //   interaction_type: type,
    //   summary,
    //   timestamp: new Date().toISOString()
    // }).subscribe({
    //   next: () => {}, // Silent success
    //   error: (error) => console.error('❌ Error recording interaction:', error)
    // });
  }

  /**
   * Forces a refresh of the active patient state
   *
   * @description Triggers a new emission of the current active patient state
   * to ensure all subscribed components receive the latest state.
   * Useful for cases where navigation or component initialization might have
   * missed the initial state.
   *
   * @example
   * ```typescript
   * // Force refresh of patient state
   * this.medicalState.refreshActivePatient();
   * ```
   */
  refreshActivePatient(): void {
    const currentPatient = this.state$.value.activePatient;
    console.log('🔄 Refreshing active patient state:', currentPatient?.name || 'NONE');

    // Trigger a new emission by updating the state
    this.state$.next({
      ...this.state$.value,
      activePatient: currentPatient
    });

    console.log('🔄 Active patient state refreshed');
  }

  /**
   * Ensures patient context is properly initialized for a specific route
   *
   * @param route - The route being navigated to
   * @description Called when navigating to ensure patient context is maintained
   *
   * @example
   * ```typescript
   * // In route guards or components
   * this.medicalState.ensurePatientContext('/chat');
   * ```
   */
  ensurePatientContext(route: string): void {
    console.log('🛡️ Ensuring patient context for route:', route);

    const currentPatient = this.state$.value.activePatient;
    if (currentPatient) {
      console.log('🛡️ Patient context exists:', currentPatient.name);
      // Refresh the state to ensure all components receive it
      this.refreshActivePatient();
    } else {
      console.log('🛡️ No patient context found');
    }
  }

  // ========== Getters for current values ==========

  /**
   * Gets the current complete medical state
   *
   * @returns Current MedicalState object
   *
   * @example
   * ```typescript
   * const state = this.medicalState.currentState;
   * console.log('Active patient:', state.activePatient?.name);
   * console.log('Chat messages:', state.currentChatMessages.length);
   * ```
   */
  get currentState(): MedicalState {
    return this.state$.value;
  }

  /**
   * Gets the currently active patient
   *
   * @returns Current active patient or null
   *
   * @example
   * ```typescript
   * const patient = this.medicalState.activePatientValue;
   * if (patient) {
   *   console.log('Current patient:', patient.name);
   * }
   * ```
   */
  get activePatientValue(): Patient | null {
    return this.state$.value.activePatient;
  }

  /**
   * Gets the current streaming state
   *
   * @returns True if currently streaming an AI response
   *
   * @example
   * ```typescript
   * if (this.medicalState.isStreamingValue) {
   *   console.log('AI is currently responding...');
   * }
   * ```
   */
  get isStreamingValue(): boolean {
    return this.state$.value.isStreaming;
  }
}
