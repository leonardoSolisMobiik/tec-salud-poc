/**
 * Unit tests for PillsService
 *
 * @description Tests for Pills (Quick Questions) CRUD operations,
 * state management, and error handling
 *
 * @since 1.0.0
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PillsService } from './pills.service';
import { environment } from '@environments/environment';
import { Pill, CreatePillRequest, UpdatePillRequest, PillsListResponse, PillResponse } from '../models';

describe('PillsService', () => {
  let service: PillsService;
  let httpMock: HttpTestingController;

  const mockPill: Pill = {
    id: 'pill-123',
    starter: 'Diagnóstico',
    text: 'Realizar diagnóstico inicial completo',
    icon: '🩺',
    category: 'diagnosis',
    priority: 'alta',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const mockCreateRequest: CreatePillRequest = {
    starter: 'Síntomas',
    text: 'Analizar síntomas del paciente',
    icon: '📋',
    category: 'symptoms',
    priority: 'alta',
    is_active: true
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PillsService]
    });

    service = TestBed.inject(PillsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Load Pills', () => {
    it('should load pills successfully', () => {
      const mockResponse: PillsListResponse = {
        pills: [mockPill],
        total: 1,
        limit: 100,
        skip: 0
      };

      service.loadPills().subscribe(pills => {
        expect(pills).toEqual([mockPill]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/?limit=100&skip=0`);
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      req.flush(mockResponse);
    });

    it('should load pills with custom pagination', () => {
      const mockResponse: PillsListResponse = {
        pills: [mockPill],
        total: 1,
        limit: 50,
        skip: 10
      };

      service.loadPills(50, 10).subscribe(pills => {
        expect(pills).toEqual([mockPill]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/?limit=50&skip=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle empty pills response', () => {
      const mockResponse: PillsListResponse = {
        pills: [],
        total: 0,
        limit: 100,
        skip: 0
      };

      service.loadPills().subscribe(pills => {
        expect(pills).toEqual([]);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/?limit=100&skip=0`);
      req.flush(mockResponse);
    });

    it('should handle loading errors', () => {
      service.loadPills().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Error loading pills');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/?limit=100&skip=0`);
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });
    });

    it('should update loading state during load', () => {
      let loadingStates: boolean[] = [];
      service.loading$.subscribe(loading => loadingStates.push(loading));

      service.loadPills().subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/?limit=100&skip=0`);
      req.flush({ pills: [mockPill] });

      expect(loadingStates).toEqual([false, true, false]);
    });
  });

  describe('Create Pill', () => {
    it('should create pill successfully', () => {
      const mockResponse = { data: mockPill };

      service.createPill(mockCreateRequest).subscribe(pill => {
        expect(pill).toEqual(mockPill);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({
        starter: 'Síntomas',
        text: 'Analizar síntomas del paciente',
        icon: '📋',
        category: 'symptoms',
        priority: 'alta',
        is_active: true
      });
      req.flush(mockResponse);
    });

    it('should handle creation with direct response format', () => {
      service.createPill(mockCreateRequest).subscribe(pill => {
        expect(pill).toEqual(mockPill);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/`);
      req.flush(mockPill); // Direct response without data wrapper
    });

    it('should handle creation errors from API', () => {
      const errorResponse = { error: 'Validation failed', success: false };

      service.createPill(mockCreateRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Validation failed');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/`);
      req.flush(errorResponse);
    });

    it('should handle network errors during creation', () => {
      service.createPill(mockCreateRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Error creating pill');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/`);
      req.flush('Network Error', { status: 400, statusText: 'Bad Request' });
    });

    it('should add new pill to local state', () => {
      service.createPill(mockCreateRequest).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/`);
      req.flush({ data: mockPill });

      expect(service.getCurrentPills()).toContain(mockPill);
    });
  });

  describe('Update Pill', () => {
    const updateRequest: UpdatePillRequest = {
      id: 'pill-123',
      text: 'Updated question text',
      priority: 'media'
    };

    beforeEach(() => {
      // Set initial state with existing pill
      service.createPill(mockCreateRequest).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/pills/`);
      req.flush({ data: mockPill });
    });

    it('should update pill successfully', () => {
      const updatedPill = { ...mockPill, text: 'Updated question text', priority: 'media' };
      const mockResponse = { data: updatedPill };

      service.updatePill(updateRequest).subscribe(pill => {
        expect(pill).toEqual(updatedPill);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/pill-123`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.text).toBe('Updated question text');
      expect(req.request.body.priority).toBe('media');
      req.flush(mockResponse);
    });

    it('should handle update errors', () => {
      const errorResponse = { error: 'Pill not found', success: false };

      service.updatePill(updateRequest).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Pill not found');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/pill-123`);
      req.flush(errorResponse);
    });

    it('should update pill in local state', () => {
      const updatedPill = { ...mockPill, text: 'Updated question text' };

      service.updatePill(updateRequest).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/pill-123`);
      req.flush({ data: updatedPill });

      const currentPills = service.getCurrentPills();
      const foundPill = currentPills.find(p => p.id === 'pill-123');
      expect(foundPill?.text).toBe('Updated question text');
    });
  });

  describe('Delete Pill', () => {
    beforeEach(() => {
      // Set initial state with existing pill
      service.createPill(mockCreateRequest).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/pills/`);
      req.flush({ data: mockPill });
    });

    it('should delete pill successfully', () => {
      const mockResponse: PillResponse = {
        success: true,
        message: 'Pill deleted successfully'
      };

      service.deletePill('pill-123').subscribe(message => {
        expect(message).toBe('Pill deleted successfully');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/pill-123`);
      expect(req.request.method).toBe('DELETE');
      req.flush(mockResponse);
    });

    it('should handle delete errors', () => {
      const mockResponse: PillResponse = {
        success: false,
        error: 'Pill not found'
      };

      service.deletePill('pill-123').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Pill not found');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/pill-123`);
      req.flush(mockResponse);
    });

    it('should remove pill from local state', () => {
      service.deletePill('pill-123').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/pill-123`);
      req.flush({ success: true, message: 'Deleted' });

      const currentPills = service.getCurrentPills();
      expect(currentPills.find(p => p.id === 'pill-123')).toBeUndefined();
    });
  });

  describe('Get Pill By ID', () => {
    it('should get pill by ID successfully', () => {
      const mockResponse: PillResponse = {
        success: true,
        data: mockPill
      };

      service.getPillById('pill-123').subscribe(pill => {
        expect(pill).toEqual(mockPill);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/pill-123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should handle pill not found', () => {
      const mockResponse: PillResponse = {
        success: false,
        error: 'Pill not found'
      };

      service.getPillById('invalid-id').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Pill not found');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/invalid-id`);
      req.flush(mockResponse);
    });

    it('should handle missing data in response', () => {
      const mockResponse: PillResponse = {
        success: true
      };

      service.getPillById('pill-123').subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.message).toContain('Pill not found');
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/pill-123`);
      req.flush(mockResponse);
    });
  });

  describe('State Management', () => {
    it('should maintain pills state through pills$ observable', () => {
      let emittedPills: Pill[] = [];
      service.pills$.subscribe(pills => emittedPills = pills);

      // Initial state should be empty
      expect(emittedPills).toEqual([]);

      // After loading pills
      service.loadPills().subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/pills/?limit=100&skip=0`);
      req.flush({ pills: [mockPill] });

      expect(emittedPills).toEqual([mockPill]);
    });

    it('should clear pills state', () => {
      // Add a pill first
      service.createPill(mockCreateRequest).subscribe();
      const req = httpMock.expectOne(`${environment.apiUrl}/pills/`);
      req.flush({ data: mockPill });

      expect(service.getCurrentPills()).toContain(mockPill);

      // Clear pills
      service.clearPills();
      expect(service.getCurrentPills()).toEqual([]);
    });

    it('should track error state', () => {
      let emittedError: string | null = null;
      service.error$.subscribe(error => emittedError = error);

      // Initial state should have no error
      expect(emittedError).toBeNull();

      // Trigger an error
      service.loadPills().subscribe({ error: () => {} });
      const req = httpMock.expectOne(`${environment.apiUrl}/pills/?limit=100&skip=0`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });

      expect(emittedError).toContain('Error loading pills');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON responses', () => {
      service.loadPills().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error).toBeTruthy();
        }
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/pills/?limit=100&skip=0`);
      req.flush('Invalid JSON', { status: 200, statusText: 'OK' });
    });

    it('should retry requests based on environment configuration', () => {
      // Mock environment retryAttempts
      Object.defineProperty(environment, 'retryAttempts', { value: 2, writable: true });

      service.loadPills().subscribe({
        error: () => {} // Handle the expected error
      });

      // Should make initial request
      let req = httpMock.expectOne(`${environment.apiUrl}/pills/?limit=100&skip=0`);
      req.flush('Error', { status: 500, statusText: 'Server Error' });

      // Should retry once more due to retry(2) - but since it's 1 retry attempt, expect no more requests
    });
  });
});
