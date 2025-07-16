/**
 * Unit tests for MedicalStateService
 *
 * @description Tests for medical state management including patient selection,
 * chat history, streaming responses, and local storage persistence
 *
 * @since 1.0.0
 */

import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { MedicalStateService } from './medical-state.service';
import { ApiService } from './api.service';
import { ChatSessionService } from './chat-session.service';
import { Patient, ChatMessage, ChatSession } from '../models';

describe('MedicalStateService', () => {
  let service: MedicalStateService;
  let mockApiService: any;
  let mockChatSessionService: any;
  let localStorageSpy: any;

  const mockPatient: Patient = {
    id: 'patient-123',
    name: 'María García',
    age: 45,
    gender: 'Femenino',
    documents: [
      { id: 'doc-1', fileName: 'historia_clinica.pdf', type: 'CONS' }
    ]
  };

  const mockChatMessage: ChatMessage = {
    role: 'user',
    content: '¿Cuáles son los síntomas?',
    timestamp: new Date()
  };

  const mockChatSession: ChatSession = {
    session_id: 'session-123',
    session_name: 'Consulta médica',
    document_id: 'doc-1',
    user_id: 'user-1'
  };

  beforeEach(() => {
    // Mock ApiService
    const apiServiceSpy = {
      getPatients: jest.fn().mockReturnValue(of([])),
      searchPatients: jest.fn().mockReturnValue(of([])),
      getPatientById: jest.fn().mockReturnValue(of(mockPatient)),
      recordPatientInteraction: jest.fn().mockReturnValue(of({}))
    };

    // Mock ChatSessionService
    const chatSessionServiceSpy = {
      createSessionForPatient: jest.fn().mockReturnValue(of(mockChatSession)),
      clearActiveSession: jest.fn().mockReturnValue(of({}))
    };
    chatSessionServiceSpy.activeSession$ = new BehaviorSubject(null);

    // Mock localStorage
    localStorageSpy = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn()
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageSpy });

    TestBed.configureTestingModule({
      providers: [
        MedicalStateService,
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: ChatSessionService, useValue: chatSessionServiceSpy }
      ]
    });

    mockApiService = TestBed.inject(ApiService);
    mockChatSessionService = TestBed.inject(ChatSessionService);

    // Reset localStorage mock
    localStorageSpy.getItem.mockReturnValue(null);
    localStorageSpy.setItem.mockImplementation(() => {});
    localStorageSpy.removeItem.mockImplementation(() => {});

    service = TestBed.inject(MedicalStateService);
  });

  afterEach(() => {
    localStorageSpy.getItem.mockClear();
    localStorageSpy.setItem.mockClear();
    localStorageSpy.removeItem.mockClear();
  });

  describe('Component Creation and Initialization', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with default state', () => {
      service.activePatient$.subscribe(patient => {
        expect(patient).toBeNull();
      });

      service.currentChatMessages$.subscribe(messages => {
        expect(messages).toEqual([]);
      });

      service.isStreaming$.subscribe(streaming => {
        expect(streaming).toBe(false);
      });
    });

    it('should load persisted state from localStorage on initialization', () => {
      const persistedPatient = JSON.stringify(mockPatient);
      const persistedRecentPatients = JSON.stringify([mockPatient]);
      const persistedChatHistory = JSON.stringify([
        ['patient-123', [mockChatMessage]]
      ]);

      localStorageSpy.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'tecsalud_active_patient': return persistedPatient;
          case 'tecsalud_recent_patients': return persistedRecentPatients;
          case 'tecsalud_chat_history': return persistedChatHistory;
          default: return null;
        }
      });

      // Create new service instance to trigger initialization
      const newService = new MedicalStateService(mockApiService, mockChatSessionService);

      newService.activePatient$.subscribe(patient => {
        expect(patient).toEqual(mockPatient);
      });

      newService.recentPatients$.subscribe(patients => {
        expect(patients).toEqual([mockPatient]);
      });

      newService.currentChatMessages$.subscribe(messages => {
        expect(messages).toEqual([mockChatMessage]);
      });
    });

    it('should handle corrupted localStorage data gracefully', () => {
      localStorageSpy.getItem.mockReturnValue('invalid-json');

      // Should not throw error and use default state
      const newService = new MedicalStateService(mockApiService, mockChatSessionService);

      newService.activePatient$.subscribe(patient => {
        expect(patient).toBeNull();
      });
    });
  });

  describe('Patient Management', () => {
    it('should set active patient and update state', () => {
      mockChatSessionService.createSessionForPatient.mockReturnValue(of(mockChatSession));

      service.setActivePatient(mockPatient);

      service.activePatient$.subscribe(patient => {
        expect(patient).toEqual(mockPatient);
      });

      expect(mockChatSessionService.createSessionForPatient).toHaveBeenCalledWith(mockPatient);
    });

    it('should clear active patient', () => {
      service.setActivePatient(mockPatient);
      service.setActivePatient(null);

      service.activePatient$.subscribe(patient => {
        expect(patient).toBeNull();
      });

      expect(mockChatSessionService.clearActiveSession).toHaveBeenCalled();
    });

    it('should add patient to recent patients when setting as active', () => {
      mockChatSessionService.createSessionForPatient.mockReturnValue(of(mockChatSession));

      service.setActivePatient(mockPatient);

      service.recentPatients$.subscribe(patients => {
        expect(patients).toContain(mockPatient);
        expect(patients.length).toBe(1);
      });
    });

    it('should not duplicate patient in recent patients', () => {
      mockChatSessionService.createSessionForPatient.mockReturnValue(of(mockChatSession));

      service.setActivePatient(mockPatient);
      service.setActivePatient(mockPatient);

      service.recentPatients$.subscribe(patients => {
        expect(patients.length).toBe(1);
      });
    });

    it('should limit recent patients to 10', () => {
      mockChatSessionService.createSessionForPatient.mockReturnValue(of(mockChatSession));

      // Add 11 different patients
      for (let i = 0; i < 11; i++) {
        const patient = { ...mockPatient, id: `patient-${i}`, name: `Patient ${i}` };
        service.setActivePatient(patient);
      }

      service.recentPatients$.subscribe(patients => {
        expect(patients.length).toBe(10);
      });
    });

    it('should handle patient without documents gracefully', () => {
      const patientWithoutDocs = { ...mockPatient, documents: [] };

      service.setActivePatient(patientWithoutDocs);

      service.activePatient$.subscribe(patient => {
        expect(patient).toEqual(patientWithoutDocs);
      });

      expect(mockChatSessionService.createSessionForPatient).not.toHaveBeenCalled();
    });

    it('should handle session creation errors gracefully', () => {
      mockChatSessionService.createSessionForPatient.mockReturnValue(
        throwError('Session creation failed')
      );

      service.setActivePatient(mockPatient);

      service.activePatient$.subscribe(patient => {
        expect(patient).toEqual(mockPatient);
      });
    });
  });

  describe('Patient Search', () => {
    it('should search patients and update search results', () => {
      const searchResults = [mockPatient];
      mockApiService.searchPatients.mockReturnValue(of(searchResults));

      service.searchPatients('María');

      service.searchResults$.subscribe(results => {
        expect(results).toEqual(searchResults);
      });

      service.isSearching$.subscribe(searching => {
        expect(searching).toBe(false);
      });

      expect(mockApiService.searchPatients).toHaveBeenCalledWith('pedro', 'María', 50, 0);
    });

    it('should handle search errors', () => {
      mockApiService.searchPatients.mockReturnValue(throwError('Search failed'));

      service.searchPatients('María');

      service.error$.subscribe(error => {
        expect(error).toContain('Search failed');
      });

      service.isSearching$.subscribe(searching => {
        expect(searching).toBe(false);
      });
    });

    it('should clear search results', () => {
      service.searchPatients('María');
      service.searchPatients(''); // Clear search results by passing empty string

      service.searchResults$.subscribe(results => {
        expect(results).toEqual([]);
      });
    });
  });

  describe('Patient Loading by ID', () => {
    it('should load patient by ID and set as active', () => {
      mockApiService.getPatientById.mockReturnValue(of(mockPatient));
      mockChatSessionService.createSessionForPatient.mockReturnValue(of(mockChatSession));

      service.loadPatientById('patient-123');

      service.activePatient$.subscribe(patient => {
        expect(patient).toEqual(mockPatient);
      });

      expect(mockApiService.getPatientById).toHaveBeenCalledWith('patient-123');
    });

    it('should handle loading errors', () => {
      mockApiService.getPatientById.mockReturnValue(throwError('Patient not found'));

      service.loadPatientById('patient-123');

      service.error$.subscribe(error => {
        expect(error).toContain('Patient not found');
      });
    });

    // TODO: Test disabled - isLoadingPatient$ observable doesn't exist in service
    xit('should update loading state during patient loading', () => {
      mockApiService.getPatientById.mockReturnValue(of(mockPatient));

      let loadingStates: boolean[] = [];
      // service.isLoadingPatient$.subscribe(loading => {
      //   loadingStates.push(loading);
      // });

      service.loadPatientById('patient-123');

      // Should have been true during loading, then false when complete
      // expect(loadingStates).toContain(true);
      // expect(loadingStates[loadingStates.length - 1]).toBe(false);
    });
  });

  describe('Chat Message Management', () => {
    beforeEach(() => {
      mockChatSessionService.createSessionForPatient.mockReturnValue(of(mockChatSession));
      service.setActivePatient(mockPatient);
    });

    it('should add message to current chat', () => {
      service.addMessage(mockChatMessage);

      service.currentChatMessages$.subscribe(messages => {
        expect(messages).toContain(mockChatMessage);
        expect(messages.length).toBe(1);
      });
    });

    it('should not add message when no active patient', () => {
      service.setActivePatient(null);

      service.addMessage(mockChatMessage);

      service.currentChatMessages$.subscribe(messages => {
        expect(messages.length).toBe(0);
      });
    });

    it('should preserve chat history for different patients', () => {
      const message1 = { ...mockChatMessage, content: 'Message 1' };
      const message2 = { ...mockChatMessage, content: 'Message 2' };

      service.addMessage(message1);

      const anotherPatient = { ...mockPatient, id: 'patient-456', name: 'Juan Pérez' };
      service.setActivePatient(anotherPatient);
      service.addMessage(message2);

      // Switch back to first patient
      service.setActivePatient(mockPatient);

      service.currentChatMessages$.subscribe(messages => {
        expect(messages).toContain(message1);
        expect(messages.length).toBe(1);
      });
    });

    it('should clear chat history for specific patient', () => {
      service.addMessage(mockChatMessage);
      service.clearChatHistory(mockPatient.id);

      service.currentChatMessages$.subscribe(messages => {
        expect(messages.length).toBe(0);
      });
    });

    it('should clear all chat history', () => {
      service.addMessage(mockChatMessage);
      service.clearChatHistory();

      service.currentChatMessages$.subscribe(messages => {
        expect(messages.length).toBe(0);
      });
    });
  });

  describe('Streaming Management', () => {
    beforeEach(() => {
      mockChatSessionService.createSessionForPatient.mockReturnValue(of(mockChatSession));
      service.setActivePatient(mockPatient);
    });

    it('should start streaming mode', () => {
      service.startStreaming();

      service.isStreaming$.subscribe(streaming => {
        expect(streaming).toBe(true);
      });

      service.streamingMessage$.subscribe(message => {
        expect(message).toBe('');
      });
    });

    it('should update streaming message', () => {
      service.startStreaming();
      service.updateStreamingMessage('Partial response...');

      service.streamingMessage$.subscribe(message => {
        expect(message).toBe('Partial response...');
      });
    });

    it('should finish streaming and add final message', () => {
      service.startStreaming();
      service.updateStreamingMessage('Complete response');
      service.finishStreaming();

      service.isStreaming$.subscribe(streaming => {
        expect(streaming).toBe(false);
      });

      service.streamingMessage$.subscribe(message => {
        expect(message).toBe('');
      });

      service.currentChatMessages$.subscribe(messages => {
        const assistantMessage = messages.find(m => m.role === 'assistant');
        expect(assistantMessage).toBeTruthy();
        expect(assistantMessage?.content).toBe('Complete response');
      });
    });

    it('should not add empty streaming message when finishing', () => {
      service.startStreaming();
      service.finishStreaming(); // No streaming message set

      service.currentChatMessages$.subscribe(messages => {
        const assistantMessages = messages.filter(m => m.role === 'assistant');
        expect(assistantMessages.length).toBe(0);
      });
    });
  });

  describe('State Persistence', () => {
    it('should persist active patient to localStorage', () => {
      mockChatSessionService.createSessionForPatient.mockReturnValue(of(mockChatSession));

      service.setActivePatient(mockPatient);

      expect(localStorageSpy.setItem).toHaveBeenCalledWith(
        'tecsalud_active_patient',
        JSON.stringify(mockPatient)
      );
    });

    it('should persist recent patients to localStorage', () => {
      mockChatSessionService.createSessionForPatient.mockReturnValue(of(mockChatSession));

      service.setActivePatient(mockPatient);

      expect(localStorageSpy.setItem).toHaveBeenCalledWith(
        'tecsalud_recent_patients',
        JSON.stringify([mockPatient])
      );
    });

    it('should persist chat history to localStorage', () => {
      mockChatSessionService.createSessionForPatient.mockReturnValue(of(mockChatSession));

      service.setActivePatient(mockPatient);
      service.addMessage(mockChatMessage);

      expect(localStorageSpy.setItem).toHaveBeenCalledWith(
        'tecsalud_chat_history',
        expect.any(String)
      );
    });

    it('should clear persisted state', () => {
      service.clearPersistedState();

      expect(localStorageSpy.removeItem).toHaveBeenCalledWith('tecsalud_active_patient');
      expect(localStorageSpy.removeItem).toHaveBeenCalledWith('tecsalud_recent_patients');
      expect(localStorageSpy.removeItem).toHaveBeenCalledWith('tecsalud_chat_history');
    });

    it('should check if persisted state exists', () => {
      localStorageSpy.getItem.mockReturnValue('some-data');

      const hasState = service.hasPersistedState();

      expect(hasState).toBe(true);
    });

    it('should get persisted state information', () => {
      localStorageSpy.getItem.mockImplementation((key: string) => {
        switch (key) {
          case 'tecsalud_active_patient': return JSON.stringify(mockPatient);
          case 'tecsalud_recent_patients': return JSON.stringify([mockPatient]);
          case 'tecsalud_chat_history': return JSON.stringify([['patient-123', [mockChatMessage]]]);
          default: return null;
        }
      });

      const stateInfo = service.getPersistedStateInfo();

      expect(stateInfo.hasActivePatient).toBe(true);
      expect(stateInfo.recentPatientsCount).toBe(1);
      expect(stateInfo.chatHistoryEntries).toBe(1);
      expect(stateInfo.storageSize).toBeGreaterThan(0);
    });

    it('should handle localStorage errors gracefully', () => {
      localStorageSpy.setItem.mockImplementation(() => { throw new Error('localStorage error'); });
      mockChatSessionService.createSessionForPatient.mockReturnValue(of(mockChatSession));

      // Should not throw error
      expect(() => service.setActivePatient(mockPatient)).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should set and clear error state', () => {
      service.setError('Test error message');

      service.error$.subscribe(error => {
        expect(error).toBe('Test error message');
      });

      // Clear error by setting it to null
      (service as any).state$.next({
        ...(service as any).state$.value,
        error: null
      });

      service.error$.subscribe(error => {
        expect(error).toBeNull();
      });
    });

    it('should handle API service errors gracefully', () => {
      mockApiService.searchPatients.mockReturnValue(throwError('API Error'));

      service.searchPatients('test');

      service.error$.subscribe(error => {
        expect(error).toContain('API Error');
      });
    });
  });

  describe('Recent Patients Management', () => {
    it('should load recent patients from localStorage', () => {
      localStorageSpy.getItem.mockImplementation((key: string) => {
        if (key === 'tecsalud_recent_patients') {
          return JSON.stringify([mockPatient]);
        }
        return null;
      });

      const newService = new MedicalStateService(mockApiService, mockChatSessionService);

      newService.recentPatients$.subscribe(patients => {
        expect(patients).toEqual([mockPatient]);
      });
    });

    it('should handle loading recent patients errors', () => {
      localStorageSpy.getItem.mockImplementation(() => { throw new Error('localStorage error'); });

      // Should not throw and use default empty array
      const newService = new MedicalStateService(mockApiService, mockChatSessionService);

      newService.recentPatients$.subscribe(patients => {
        expect(patients).toEqual([]);
      });
    });
  });

  describe('Chat History Persistence', () => {
    it('should convert Map to Array for localStorage storage', () => {
      mockChatSessionService.createSessionForPatient.mockReturnValue(of(mockChatSession));

      service.setActivePatient(mockPatient);
      service.addMessage(mockChatMessage);

      const setItemCalls = localStorageSpy.setItem.mock.calls;
              const chatHistoryCall = setItemCalls.find(call =>
          call[0] === 'tecsalud_chat_history'
        );

      expect(chatHistoryCall).toBeTruthy();

      const storedData = JSON.parse(chatHistoryCall![1]);
      expect(Array.isArray(storedData)).toBe(true);
      expect(storedData[0]).toEqual(['patient-123', [expect.objectContaining(mockChatMessage)]]);
    });

    it('should restore Map from Array when loading from localStorage', () => {
      const chatHistoryArray = [['patient-123', [mockChatMessage]]];
      localStorageSpy.getItem.mockImplementation((key: string) => {
        if (key === 'tecsalud_chat_history') {
          return JSON.stringify(chatHistoryArray);
        }
        return null;
      });

      const newService = new MedicalStateService(mockApiService, mockChatSessionService);

      // Access private state to verify Map structure
      expect((newService as any).state$.value.chatHistory instanceof Map).toBe(true);
      expect((newService as any).state$.value.chatHistory.has('patient-123')).toBe(true);
    });
  });

  describe('Observable Streams', () => {
    it('should provide distinct values only', () => {
      mockChatSessionService.createSessionForPatient.mockReturnValue(of(mockChatSession));

      let patientUpdates = 0;
      service.activePatient$.subscribe(() => patientUpdates++);

      service.setActivePatient(mockPatient);
      service.setActivePatient(mockPatient); // Same patient

      // Should only emit initial null + one patient update
      expect(patientUpdates).toBe(2);
    });

    it('should provide access to active session from chat service', () => {
      const mockSession = { session_id: 'test-session' } as ChatSession;
      mockChatSessionService.activeSession$.next(mockSession);

      service.activeSession$.subscribe(session => {
        expect(session).toEqual(mockSession);
      });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete patient selection workflow', () => {
      mockChatSessionService.createSessionForPatient.mockReturnValue(of(mockChatSession));

      // Select patient
      service.setActivePatient(mockPatient);

      // Add messages
      const userMessage = { role: 'user', content: 'Hello', timestamp: new Date() } as ChatMessage;
      service.addMessage(userMessage);

      // Start streaming
      service.startStreaming();
      service.updateStreamingMessage('AI response...');
      service.finishStreaming();

      // Verify final state
      service.activePatient$.subscribe(patient => {
        expect(patient).toEqual(mockPatient);
      });

      service.currentChatMessages$.subscribe(messages => {
        expect(messages.length).toBe(2); // User + AI message
        expect(messages[0]).toEqual(expect.objectContaining(userMessage));
        expect(messages[1].role).toBe('assistant');
        expect(messages[1].content).toBe('AI response...');
      });

      service.isStreaming$.subscribe(streaming => {
        expect(streaming).toBe(false);
      });

      // Verify persistence
      expect(localStorageSpy.setItem).toHaveBeenCalledWith(
        'tecsalud_active_patient',
        JSON.stringify(mockPatient)
      );
    });

    it('should handle patient switching with chat history preservation', () => {
      mockChatSessionService.createSessionForPatient.mockReturnValue(of(mockChatSession));

      // Patient 1
      const patient1 = mockPatient;
      service.setActivePatient(patient1);
      service.addMessage({ role: 'user', content: 'Message 1', timestamp: new Date() });

      // Patient 2
      const patient2 = { ...mockPatient, id: 'patient-456', name: 'Ana López' };
      service.setActivePatient(patient2);
      service.addMessage({ role: 'user', content: 'Message 2', timestamp: new Date() });

      // Back to Patient 1
      service.setActivePatient(patient1);

      service.currentChatMessages$.subscribe(messages => {
        expect(messages.length).toBe(1);
        expect(messages[0].content).toBe('Message 1');
      });

      // Verify Patient 2 history is preserved
      service.setActivePatient(patient2);
      service.currentChatMessages$.subscribe(messages => {
        expect(messages.length).toBe(1);
        expect(messages[0].content).toBe('Message 2');
      });
    });
  });
});
