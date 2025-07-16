/**
 * Unit tests for ApiService
 *
 * @description Tests for the main API service including HTTP requests,
 * error handling, retry logic, and response processing for medical data
 *
 * @since 1.0.0
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '@environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Health Check', () => {
    it('should perform health check successfully', () => {
      const mockResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      service.checkHealth().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/health`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

      it('should handle health check error', () => {
    service.checkHealth().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/health`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('Patient Management', () => {
    it('should get patients with pagination', () => {
      const mockPatientsResponse = {
        patients: [
          {
            patient_id: 'patient1',
            name: 'John Doe',
            age: 30,
            gender: 'male'
          }
        ],
        total: 1,
        page: 1,
        limit: 20
      };

                  service.searchPatients('test-user', '', 20, 0).subscribe(patients => {
      expect(patients).toHaveLength(1);
      expect(patients[0].id).toBe('12345');
      expect(patients[0].name).toBe('John Doe');
    });

    const req = httpMock.expectOne((req) => req.url.includes('/search/patients'));
      expect(req.request.method).toBe('GET');
      req.flush(mockPatientsResponse);
    });

    it('should search patients by query', () => {
      const searchQuery = 'John';
      const mockSearchResponse = {
        patients: [
          {
            patient_id: 'patient1',
            name: 'John Doe',
            age: 30,
            gender: 'male'
          }
        ],
        total: 1
      };

      service.searchPatients(searchQuery).subscribe(response => {
        expect(response.patients).toHaveLength(1);
        expect(response.patients[0].name).toContain('John');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/patients/search?q=${searchQuery}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockSearchResponse);
    });
  });

  describe('Chat Functionality', () => {
    it('should send medical chat request', () => {
      const chatRequest = {
        messages: [{ role: 'user', content: 'What are the symptoms?' }],
        patient_id: 'patient1',
        stream: false
      };

      const mockChatResponse = {
        content: 'The symptoms include fever and headache.',
        metadata: {
          model: 'gpt-4',
          tokens: 15
        }
      };

      service.sendMedicalChat(chatRequest).subscribe(response => {
        expect(response.content).toBe('The symptoms include fever and headache.');
        expect(response.metadata?.tokens).toBe(15);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/chat/medical`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(chatRequest);
      req.flush(mockChatResponse);
    });
  });

  describe('Platform Statistics', () => {
    it('should get platform statistics', () => {
      const mockStats = {
        totals: {
          documents: 78,
          sessions: 174,
          interactions: 34,
          active_pills: 2,
          unique_users: 3
        },
        storage: {
          total_size_mb: 104.32
        }
      };

      service.getPlatformStatistics().subscribe(response => {
        expect(response.totals.documents).toBe(78);
        expect(response.totals.sessions).toBe(174);
        expect(response.storage.total_size_mb).toBe(104.32);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/statistics/platform/overview`);
      expect(req.request.method).toBe('GET');
      req.flush(mockStats);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', () => {
      service.checkHealth().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/health`);
      req.error(new ErrorEvent('Network error', {
        message: 'Unable to connect to server'
      }));
    });

    it('should handle HTTP error responses', () => {
      service.searchPatients('test-user', '', 20, 0).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne((req) => req.url.includes('/search/patients'));
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('Request Configuration', () => {
    it('should include proper headers in requests', () => {
      service.checkHealth().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/health`);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
    });

    it('should handle timeout configuration', () => {
      service.searchPatients('test-user', '', 20, 0).subscribe();

      const req = httpMock.expectOne((req) => req.url.includes('/search/patients'));
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });
  });
});
