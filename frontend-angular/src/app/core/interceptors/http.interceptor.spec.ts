/**
 * Unit tests for HttpConfigInterceptor
 *
 * @description Tests for HTTP request interception including header injection,
 * CORS headers in development, and request logging
 *
 * @since 1.0.0
 */

import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpConfigInterceptor } from './http.interceptor';
import { environment } from '@environments/environment';

describe('HttpConfigInterceptor', () => {
  let httpClient: HttpClient;
  let httpMock: HttpTestingController;
  let originalEnvironment: any;
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    // Store original environment
    originalEnvironment = { ...environment };

    // Spy on console.log for logging tests
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        {
          provide: HTTP_INTERCEPTORS,
          useClass: HttpConfigInterceptor,
          multi: true
        }
      ]
    });

    httpClient = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Restore original environment
    Object.assign(environment, originalEnvironment);
    httpMock.verify();
  });

  it('should be created', () => {
    const interceptor = new HttpConfigInterceptor();
    expect(interceptor).toBeTruthy();
  });

  describe('Standard Headers', () => {
    it('should add standard headers to GET requests', () => {
      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');

      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');

      req.flush({});
    });

    it('should add standard headers to POST requests', () => {
      const testData = { test: 'data' };

      httpClient.post('/api/test', testData).subscribe();

      const req = httpMock.expectOne('/api/test');

      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
      expect(req.request.body).toEqual(testData);

      req.flush({});
    });

    it('should add standard headers to PUT requests', () => {
      const testData = { id: 1, name: 'Updated' };

      httpClient.put('/api/test/1', testData).subscribe();

      const req = httpMock.expectOne('/api/test/1');

      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');

      req.flush({});
    });

    it('should add standard headers to DELETE requests', () => {
      httpClient.delete('/api/test/1').subscribe();

      const req = httpMock.expectOne('/api/test/1');

      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');

      req.flush({});
    });

    it('should preserve existing headers while adding standard ones', () => {
      const customHeaders = { 'Custom-Header': 'custom-value' };

      httpClient.get('/api/test', { headers: customHeaders }).subscribe();

      const req = httpMock.expectOne('/api/test');

      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
      expect(req.request.headers.get('Custom-Header')).toBe('custom-value');

      req.flush({});
    });
  });

  describe('Development Environment - CORS Headers', () => {
    beforeEach(() => {
      // Set environment to development with debug enabled
      environment.debug = { showApiLogs: true };
    });

    it('should add CORS headers when debug.showApiLogs is true', () => {
      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');

      expect(req.request.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(req.request.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS');
      expect(req.request.headers.get('Access-Control-Allow-Headers')).toBe('Origin, X-Requested-With, Content-Type, Accept, Authorization');

      req.flush({});
    });

    it('should add both standard and CORS headers in development', () => {
      httpClient.post('/api/test', { data: 'test' }).subscribe();

      const req = httpMock.expectOne('/api/test');

      // Standard headers
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');

      // CORS headers
      expect(req.request.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(req.request.headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, OPTIONS');
      expect(req.request.headers.get('Access-Control-Allow-Headers')).toBe('Origin, X-Requested-With, Content-Type, Accept, Authorization');

      req.flush({});
    });
  });

  describe('Production Environment - No CORS Headers', () => {
    beforeEach(() => {
      // Set environment to production (no debug or debug.showApiLogs = false)
      environment.debug = { showApiLogs: false };
    });

    it('should not add CORS headers when debug.showApiLogs is false', () => {
      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');

      // Standard headers should be present
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');

      // CORS headers should not be present
      expect(req.request.headers.get('Access-Control-Allow-Origin')).toBeNull();
      expect(req.request.headers.get('Access-Control-Allow-Methods')).toBeNull();
      expect(req.request.headers.get('Access-Control-Allow-Headers')).toBeNull();

      req.flush({});
    });

    it('should not add CORS headers when debug is undefined', () => {
      environment.debug = undefined;

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');

      // Standard headers should be present
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');

      // CORS headers should not be present
      expect(req.request.headers.get('Access-Control-Allow-Origin')).toBeNull();
      expect(req.request.headers.get('Access-Control-Allow-Methods')).toBeNull();
      expect(req.request.headers.get('Access-Control-Allow-Headers')).toBeNull();

      req.flush({});
    });
  });

  describe('Request Logging', () => {
    beforeEach(() => {
      environment.debug = { showApiLogs: true };
      consoleSpy.mockClear();
    });

    it('should log request details when debug.showApiLogs is true', () => {
      const testData = { name: 'Test Patient', age: 30 };

      httpClient.post('/api/patients', testData).subscribe();

      const req = httpMock.expectOne('/api/patients');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[HTTP Interceptor] Request:',
        expect.objectContaining({
          method: 'POST',
          url: '/api/patients',
          headers: expect.any(Object),
          body: testData
        })
      );

      req.flush({});
    });

    it('should log GET request without body', () => {
      httpClient.get('/api/patients').subscribe();

      const req = httpMock.expectOne('/api/patients');

      expect(consoleSpy).toHaveBeenCalledWith(
        '[HTTP Interceptor] Request:',
        expect.objectContaining({
          method: 'GET',
          url: '/api/patients',
          headers: expect.any(Object),
          body: null
        })
      );

      req.flush({});
    });

    it('should not log requests when debug.showApiLogs is false', () => {
      environment.debug = { showApiLogs: false };

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');

      expect(consoleSpy).not.toHaveBeenCalled();

      req.flush({});
    });

    it('should not log requests when debug is undefined', () => {
      environment.debug = undefined;

      httpClient.get('/api/test').subscribe();

      const req = httpMock.expectOne('/api/test');

      expect(consoleSpy).not.toHaveBeenCalled();

      req.flush({});
    });

    it('should log multiple requests separately', () => {
      httpClient.get('/api/patients').subscribe();
      httpClient.post('/api/sessions', { user_id: 'test' }).subscribe();

      const getReq = httpMock.expectOne('/api/patients');
      const postReq = httpMock.expectOne('/api/sessions');

      expect(consoleSpy).toHaveBeenCalledTimes(2);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[HTTP Interceptor] Request:',
        expect.objectContaining({
          method: 'GET',
          url: '/api/patients'
        })
      );

      expect(consoleSpy).toHaveBeenCalledWith(
        '[HTTP Interceptor] Request:',
        expect.objectContaining({
          method: 'POST',
          url: '/api/sessions',
          body: { user_id: 'test' }
        })
      );

      getReq.flush({});
      postReq.flush({});
    });
  });

  describe('Request Cloning and Pass-through', () => {
    it('should not modify the original request object', () => {
      const originalRequest = httpClient.get('/api/test');
      const originalUrl = '/api/test';

      originalRequest.subscribe();

      const req = httpMock.expectOne('/api/test');

      // The interceptor should clone the request, not modify the original
      expect(req.request.url).toBe(originalUrl);
      expect(req.request.headers.get('Content-Type')).toBe('application/json');

      req.flush({});
    });

    it('should pass request through to next handler', () => {
      httpClient.get('/api/test').subscribe();

      // If the request is passed through correctly, we should be able to expect it
      const req = httpMock.expectOne('/api/test');
      expect(req.request.method).toBe('GET');
      expect(req.request.url).toBe('/api/test');

      req.flush({ success: true });
    });

    it('should maintain request body for POST requests', () => {
      const requestBody = {
        patient_id: 'patient-123',
        message: 'Test message'
      };

      httpClient.post('/api/chat', requestBody).subscribe();

      const req = httpMock.expectOne('/api/chat');

      expect(req.request.body).toEqual(requestBody);
      expect(req.request.method).toBe('POST');

      req.flush({});
    });

    it('should handle requests with query parameters', () => {
      httpClient.get('/api/patients', { params: { page: '1', limit: '10' } }).subscribe();

      const req = httpMock.expectOne('/api/patients?page=1&limit=10');

      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');

      req.flush({});
    });
  });

  describe('Error Handling', () => {
    it('should not interfere with error responses', () => {
      let errorResponse: any = null;

      httpClient.get('/api/test').subscribe({
        next: () => {},
        error: (error) => {
          errorResponse = error;
        }
      });

      const req = httpMock.expectOne('/api/test');
      req.flush('Server Error', { status: 500, statusText: 'Internal Server Error' });

      expect(errorResponse).toBeTruthy();
      expect(errorResponse.status).toBe(500);
    });

    it('should add headers even to requests that will fail', () => {
      httpClient.get('/api/test').subscribe({
        error: () => {} // Handle the expected error
      });

      const req = httpMock.expectOne('/api/test');

      // Headers should be added even though request will fail
      expect(req.request.headers.get('Content-Type')).toBe('application/json');
      expect(req.request.headers.get('Accept')).toBe('application/json');
      expect(req.request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');

      req.flush('Error', { status: 404, statusText: 'Not Found' });
    });
  });
});
