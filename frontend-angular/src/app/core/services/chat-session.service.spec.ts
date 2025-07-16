/**
 * Unit tests for ChatSessionService
 *
 * @description Tests for chat session management including creation,
 * retrieval, and state management for medical patient sessions
 *
 * @since 1.0.0
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ChatSessionService } from './chat-session.service';
import { ApiService } from './api.service';
import { ChatSession, ChatSessionRequest, Patient, PatientDocument } from '../models';
import { of, throwError } from 'rxjs';

describe('ChatSessionService', () => {
  let service: ChatSessionService;
  let httpMock: HttpTestingController;
  let apiServiceMock: any;

  const mockPatient: Patient = {
    id: 'patient-123',
    name: 'Juan Pérez',
    age: 35,
    gender: 'male',
    documents: [
      {
        document_id: 'doc-123',
        filename: 'test.pdf',
        file_type: 'application/pdf',
        file_size: 1024,
        upload_date: new Date().toISOString(),
        processing_status: 'completed'
      }
    ]
  };

  const mockChatSession: ChatSession = {
    session_id: 'session-123',
    user_id: 'pedro',
    document_id: 'doc-123',
    session_name: 'Consulta Juan Pérez',
    created_at: new Date().toISOString(),
    status: 'active'
  };

  beforeEach(() => {
    const apiServiceSpy = {
      createChatSession: jest.fn(),
      getChatSession: jest.fn(),
      getChatSessions: jest.fn()
    };

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        ChatSessionService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(ChatSessionService);
    httpMock = TestBed.inject(HttpTestingController);
    apiServiceMock = TestBed.inject(ApiService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Session Creation', () => {
    it('should create session for patient with document', () => {
      apiServiceMock.createChatSession.mockReturnValue(of(mockChatSession));

      service.createSessionForPatient(mockPatient).subscribe(session => {
        expect(session).toEqual(mockChatSession);
        expect(service.getActiveSession()).toEqual(mockChatSession);
      });

      expect(apiServiceMock.createChatSession).toHaveBeenCalledWith({
        user_id: 'pedro',
        document_id: 'doc-123',
        session_name: 'Consulta Juan Pérez'
      });
    });

    it('should use provided document for session creation', () => {
      const specificDocument: PatientDocument = {
        document_id: 'doc-456',
        filename: 'specific.pdf',
        file_type: 'application/pdf',
        file_size: 2048,
        upload_date: new Date().toISOString(),
        processing_status: 'completed'
      };

      apiServiceMock.createChatSession.mockReturnValue(of(mockChatSession));

      service.createSessionForPatient(mockPatient, specificDocument).subscribe();

      expect(apiServiceMock.createChatSession).toHaveBeenCalledWith({
        user_id: 'pedro',
        document_id: 'doc-456',
        session_name: 'Consulta Juan Pérez'
      });
    });

    it('should handle error when patient has no documents', () => {
      const patientWithoutDocs: Patient = {
        ...mockPatient,
        documents: []
      };

      service.createSessionForPatient(patientWithoutDocs).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toBe('No document available for session creation');
        }
      });
    });

    it('should create custom session with provided request', () => {
      const customRequest: ChatSessionRequest = {
        user_id: 'doctor1',
        document_id: 'doc-789',
        session_name: 'Emergency Consultation'
      };

      apiServiceMock.createChatSession.mockReturnValue(of(mockChatSession));

      service.createSession(customRequest).subscribe(session => {
        expect(session).toEqual(mockChatSession);
      });

      expect(apiServiceMock.createChatSession).toHaveBeenCalledWith(customRequest);
    });

    it('should handle API errors during session creation', () => {
      const error = new Error('API Error');
      apiServiceMock.createChatSession.mockReturnValue(throwError(() => error));

      service.createSessionForPatient(mockPatient).subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err).toEqual(error);
        }
      });
    });
  });

  describe('Session Management', () => {
    it('should set active session', () => {
      service.setActiveSession(mockChatSession);
      expect(service.getActiveSession()).toEqual(mockChatSession);
    });

    it('should emit active session changes', () => {
      let emittedSession: ChatSession | null = null;
      service.activeSession$.subscribe(session => {
        emittedSession = session;
      });

      service.setActiveSession(mockChatSession);
      expect(emittedSession).toEqual(mockChatSession);
    });

    it('should clear active session', () => {
      service.setActiveSession(mockChatSession);
      service.clearActiveSession();
      expect(service.getActiveSession()).toBeNull();
    });

    it('should get session by ID', () => {
      apiServiceMock.getChatSession.mockReturnValue(of(mockChatSession));

      service.getSessionById('session-123').subscribe(session => {
        expect(session).toEqual(mockChatSession);
      });

      expect(apiServiceMock.getChatSession).toHaveBeenCalledWith('session-123');
    });

    it('should get user sessions', () => {
      const mockSessions = [mockChatSession];
      apiServiceMock.getChatSessions.mockReturnValue(of(mockSessions));

      service.getUserSessions().subscribe(sessions => {
        expect(sessions).toEqual(mockSessions);
      });

      expect(apiServiceMock.getChatSessions).toHaveBeenCalledWith('pedro');
    });

    it('should get user sessions with custom user ID', () => {
      const mockSessions = [mockChatSession];
      apiServiceMock.getChatSessions.mockReturnValue(of(mockSessions));

      service.getUserSessions('doctor1').subscribe(sessions => {
        expect(sessions).toEqual(mockSessions);
      });

      expect(apiServiceMock.getChatSessions).toHaveBeenCalledWith('doctor1');
    });
  });

  describe('Session Utilities', () => {
    it('should check if has active session', () => {
      expect(service.hasActiveSession()).toBe(false);

      service.setActiveSession(mockChatSession);
      expect(service.hasActiveSession()).toBe(true);

      service.clearActiveSession();
      expect(service.hasActiveSession()).toBe(false);
    });

    it('should get active session ID', () => {
      expect(service.getActiveSessionId()).toBeNull();

      service.setActiveSession(mockChatSession);
      expect(service.getActiveSessionId()).toBe('session-123');

      service.clearActiveSession();
      expect(service.getActiveSessionId()).toBeNull();
    });

    it('should get session info for debugging', () => {
      // Test without active session
      let info = service.getSessionInfo();
      expect(info).toEqual({
        hasActiveSession: false,
        activeSessionId: null,
        activeSessionName: null
      });

      // Test with active session
      service.setActiveSession(mockChatSession);
      info = service.getSessionInfo();
      expect(info).toEqual({
        hasActiveSession: true,
        activeSessionId: 'session-123',
        activeSessionName: 'Consulta Juan Pérez'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle session retrieval errors', () => {
      const error = new Error('Session not found');
      apiServiceMock.getChatSession.mockReturnValue(throwError(() => error));

      service.getSessionById('invalid-id').subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err).toEqual(error);
        }
      });
    });

    it('should handle user sessions retrieval errors', () => {
      const error = new Error('Network error');
      apiServiceMock.getChatSessions.mockReturnValue(throwError(() => error));

      service.getUserSessions().subscribe({
        next: () => fail('should have failed'),
        error: (err) => {
          expect(err).toEqual(error);
        }
      });
    });
  });
});
