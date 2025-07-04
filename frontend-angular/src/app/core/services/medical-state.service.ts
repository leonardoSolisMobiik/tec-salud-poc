import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest, of } from 'rxjs';
import { map, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Patient, ChatMessage, PatientInteraction } from '../models';
import { ApiService } from './api.service';

interface MedicalState {
  // Patient management
  activePatient: Patient | null;
  recentPatients: Patient[];
  searchResults: Patient[];
  
  // Chat management
  chatHistory: Map<string, ChatMessage[]>;
  currentChatMessages: ChatMessage[];
  isStreaming: boolean;
  streamingMessage: string;
  
  // UI states
  isSearching: boolean;
  isLoadingPatient: boolean;
  error: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class MedicalStateService {
  // Initial state
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

  // State subjects
  private state$ = new BehaviorSubject<MedicalState>(this.initialState);

  // Public observables
  public readonly activePatient$ = this.state$.pipe(
    map(state => state.activePatient),
    distinctUntilChanged()
  );

  public readonly recentPatients$ = this.state$.pipe(
    map(state => state.recentPatients),
    distinctUntilChanged()
  );

  public readonly searchResults$ = this.state$.pipe(
    map(state => state.searchResults),
    distinctUntilChanged()
  );

  public readonly currentChatMessages$ = this.state$.pipe(
    map(state => state.currentChatMessages),
    distinctUntilChanged()
  );

  public readonly isStreaming$ = this.state$.pipe(
    map(state => state.isStreaming),
    distinctUntilChanged()
  );

  public readonly streamingMessage$ = this.state$.pipe(
    map(state => state.streamingMessage),
    distinctUntilChanged()
  );

  public readonly isSearching$ = this.state$.pipe(
    map(state => state.isSearching),
    distinctUntilChanged()
  );

  public readonly error$ = this.state$.pipe(
    map(state => state.error),
    distinctUntilChanged()
  );

  constructor(private apiService: ApiService) {
    // Load recent patients on initialization
    this.loadRecentPatients();
  }

  // ========== Patient Management ==========

  setActivePatient(patient: Patient | null): void {
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

    // Record interaction if setting a patient
    if (patient) {
      this.recordInteraction(patient.id, 'chat', `Patient context activated: ${patient.name}`);
      
      // Add to recent patients if not already there
      if (!currentState.recentPatients.find(p => p.id === patient.id)) {
        this.state$.next({
          ...this.state$.value,
          recentPatients: [patient, ...currentState.recentPatients].slice(0, 10)
        });
      }
    }
  }

  searchPatients(query: string): void {
    if (!query.trim()) {
      this.state$.next({
        ...this.state$.value,
        searchResults: [],
        isSearching: false
      });
      return;
    }

    this.state$.next({
      ...this.state$.value,
      isSearching: true,
      error: null
    });

    this.apiService.searchPatients(query).pipe(
      catchError(error => {
        this.setError(`Error searching patients: ${error.message}`);
        return of([]);
      })
    ).subscribe(patients => {
      this.state$.next({
        ...this.state$.value,
        searchResults: patients,
        isSearching: false
      });
    });
  }

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

  private loadRecentPatients(): void {
    this.apiService.getPatients(1, 10).pipe(
      map(result => {
        // The result should be PatientSearchResult with a patients array
        return result.patients || [];
      }),
      catchError(error => {
        console.error('MedicalStateService: Error loading recent patients:', error);
        return of([]);
      })
    ).subscribe(patients => {
      this.state$.next({
        ...this.state$.value,
        recentPatients: patients
      });
    });
  }

  // ========== Chat Management ==========

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

  startStreaming(): void {
    this.state$.next({
      ...this.state$.value,
      isStreaming: true,
      streamingMessage: '',
      error: null
    });
  }

  updateStreamingMessage(chunk: string): void {
    const currentState = this.state$.value;
    this.state$.next({
      ...currentState,
      streamingMessage: chunk
    });
  }

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

  private setError(error: string): void {
    this.state$.next({
      ...this.state$.value,
      error,
      isStreaming: false,
      isSearching: false,
      isLoadingPatient: false
    });
  }

  private recordInteraction(patientId: string, type: PatientInteraction['interaction_type'], summary: string): void {
    this.apiService.recordPatientInteraction(patientId, {
      interaction_type: type,
      summary,
      timestamp: new Date().toISOString()
    }).subscribe({
      next: () => {}, // Silent success
      error: (error) => console.error('❌ Error recording interaction:', error)
    });
  }

  // ========== Getters for current values ==========

  get currentState(): MedicalState {
    return this.state$.value;
  }

  get activePatientValue(): Patient | null {
    return this.state$.value.activePatient;
  }

  get isStreamingValue(): boolean {
    return this.state$.value.isStreaming;
  }
}