/**
 * Unit tests for StreamingService
 *
 * @description Tests for AI streaming responses using Server-Sent Events (SSE),
 * fetch API integration, and stream cancellation functionality
 *
 * @since 1.0.0
 */

import { TestBed } from '@angular/core/testing';
import { NgZone } from '@angular/core';
import { StreamingService } from './streaming.service';

describe('StreamingService', () => {
  let service: StreamingService;
  let mockNgZone: any;
  let originalFetch: any;
  let originalAbortController: any;
  let mockAbortController: any;

  beforeEach(() => {
    mockAbortController = {
      abort: jest.fn(),
      signal: {}
    };

    TestBed.configureTestingModule({
      providers: [
        StreamingService
      ]
    });

    service = TestBed.inject(StreamingService);
    mockNgZone = TestBed.inject(NgZone);

    // Spy on NgZone methods after getting the real instance
    jest.spyOn(mockNgZone, 'run').mockImplementation((fn) => fn());

    // Store originals
    originalFetch = global.fetch;
    originalAbortController = global.AbortController;
  });

  afterEach(() => {
    // Restore originals
    global.fetch = originalFetch;
    global.AbortController = originalAbortController;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('streamResponse', () => {
    it('should stream response successfully', (done) => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"content": "Hello"}\n\n')
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"content": " World"}\n\n')
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined
          })
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn().mockReturnValue(mockReader)
        }
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const chunks: string[] = [];
      service.streamResponse('/api/chat', { message: 'test' }).subscribe({
        next: (chunk) => chunks.push(chunk),
        complete: () => {
          expect(chunks).toEqual(['Hello', ' World']);
          expect(global.fetch).toHaveBeenCalledWith(
            '/api/chat',
            expect.objectContaining({
              method: 'POST',
              headers: expect.objectContaining({
                'Content-Type': 'application/json'
              }),
              body: JSON.stringify({ message: 'test' }),
              signal: expect.any(Object)
            })
          );
          done();
        }
      });
    });

    it('should handle network errors', (done) => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      service.streamResponse('/api/chat', { message: 'test' }).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.message).toBe('Network error');
          done();
        }
      });
    });

    it('should handle HTTP error responses', (done) => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      service.streamResponse('/api/chat', { message: 'test' }).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.message).toContain('HTTP error! status: 500');
          done();
        }
      });
    });

    it('should handle malformed JSON in stream', (done) => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {invalid json}\n\n')
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined
          })
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn().mockReturnValue(mockReader)
        }
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      service.streamResponse('/api/chat', { message: 'test' }).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error).toBeInstanceOf(SyntaxError);
          done();
        }
      });
    });

    it('should handle empty data lines', (done) => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: \n\n')
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"content": "Valid"}\n\n')
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined
          })
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn().mockReturnValue(mockReader)
        }
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const chunks: string[] = [];
      service.streamResponse('/api/chat', { message: 'test' }).subscribe({
        next: (chunk) => chunks.push(chunk),
        complete: () => {
          expect(chunks).toEqual(['Valid']);
          done();
        }
      });
    });

    it('should cancel stream when aborted', (done) => {
      global.AbortController = jest.fn().mockImplementation(() => mockAbortController);

      const mockReader = {
        read: jest.fn().mockImplementation(() =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                done: false,
                value: new TextEncoder().encode('data: {"content": "Hello"}\n\n')
              });
            }, 100);
          })
        )
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn().mockReturnValue(mockReader)
        }
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const subscription = service.streamResponse('/api/chat', { message: 'test' }).subscribe({
        next: () => {},
        error: (error) => {
          expect(error.name).toBe('AbortError');
          done();
        }
      });

      // Cancel after starting
      setTimeout(() => {
        subscription.unsubscribe();
      }, 50);
    });

    it('should handle reader errors', (done) => {
      const mockReader = {
        read: jest.fn().mockRejectedValue(new Error('Reader error'))
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn().mockReturnValue(mockReader)
        }
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      service.streamResponse('/api/chat', { message: 'test' }).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.message).toBe('Reader error');
          done();
        }
      });
    });

    it('should use correct headers and body', (done) => {
      const mockReader = {
        read: jest.fn().mockResolvedValue({ done: true, value: undefined })
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn().mockReturnValue(mockReader)
        }
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const requestBody = {
        messages: [{ role: 'user', content: 'test' }],
        patient_id: 'patient-123'
      };

      service.streamResponse('/api/medical-chat', requestBody).subscribe({
        complete: () => {
          expect(global.fetch).toHaveBeenCalledWith(
            '/api/medical-chat',
            expect.objectContaining({
              method: 'POST',
              headers: expect.objectContaining({
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
              }),
              body: JSON.stringify(requestBody),
              signal: expect.any(Object)
            })
          );
          done();
        }
      });
    });

    it('should run stream updates in NgZone', (done) => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"content": "Test"}\n\n')
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined
          })
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn().mockReturnValue(mockReader)
        }
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      service.streamResponse('/api/chat', { message: 'test' }).subscribe({
        next: () => {
          expect(mockNgZone.run).toHaveBeenCalled();
        },
        complete: () => {
          done();
        }
      });
    });

    it('should handle multiple JSON objects in single chunk', (done) => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"content": "Hello"}\n\ndata: {"content": " World"}\n\n')
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined
          })
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn().mockReturnValue(mockReader)
        }
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const chunks: string[] = [];
      service.streamResponse('/api/chat', { message: 'test' }).subscribe({
        next: (chunk) => chunks.push(chunk),
        complete: () => {
          expect(chunks).toEqual(['Hello', ' World']);
          done();
        }
      });
    });

    it('should ignore non-data lines', (done) => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(': comment line\nevent: message\ndata: {"content": "Valid"}\n\n')
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined
          })
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn().mockReturnValue(mockReader)
        }
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const chunks: string[] = [];
      service.streamResponse('/api/chat', { message: 'test' }).subscribe({
        next: (chunk) => chunks.push(chunk),
        complete: () => {
          expect(chunks).toEqual(['Valid']);
          done();
        }
      });
    });

    it('should handle incomplete chunks across reads', (done) => {
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('data: {"con')
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode('tent": "Hello"}\n\n')
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined
          })
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn().mockReturnValue(mockReader)
        }
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const chunks: string[] = [];
      service.streamResponse('/api/chat', { message: 'test' }).subscribe({
        next: (chunk) => chunks.push(chunk),
        complete: () => {
          expect(chunks).toEqual(['Hello']);
          done();
        }
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle null response body', (done) => {
      const mockResponse = {
        ok: true,
        body: null
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      service.streamResponse('/api/chat', { message: 'test' }).subscribe({
        next: () => fail('should have errored'),
        error: (error) => {
          expect(error.message).toContain('Response body is null');
          done();
        }
      });
    });

    it('should handle empty request body', (done) => {
      const mockReader = {
        read: jest.fn().mockResolvedValue({ done: true, value: undefined })
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn().mockReturnValue(mockReader)
        }
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      service.streamResponse('/api/chat', {}).subscribe({
        complete: () => {
          expect(global.fetch).toHaveBeenCalledWith(
            '/api/chat',
            expect.objectContaining({
              body: JSON.stringify({})
            })
          );
          done();
        }
      });
    });

    it('should handle AbortController not available', (done) => {
      const originalAbortController = global.AbortController;
      delete (global as any).AbortController;

      const mockReader = {
        read: jest.fn().mockResolvedValue({ done: true, value: undefined })
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn().mockReturnValue(mockReader)
        }
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      service.streamResponse('/api/chat', { message: 'test' }).subscribe({
        complete: () => {
          expect(global.fetch).toHaveBeenCalledWith(
            '/api/chat',
            expect.objectContaining({
              signal: undefined
            })
          );
          global.AbortController = originalAbortController;
          done();
        }
      });
    });
  });

  describe('Performance', () => {
    it('should handle large streaming responses efficiently', (done) => {
      const largeContent = Array(1000).fill('x').join('');
      const mockReader = {
        read: jest.fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(`data: {"content": "${largeContent}"}\n\n`)
          })
          .mockResolvedValueOnce({
            done: true,
            value: undefined
          })
      };

      const mockResponse = {
        ok: true,
        body: {
          getReader: jest.fn().mockReturnValue(mockReader)
        }
      };

      global.fetch = jest.fn().mockResolvedValue(mockResponse);

      const startTime = performance.now();
      service.streamResponse('/api/chat', { message: 'test' }).subscribe({
        next: (chunk) => {
          expect(chunk).toBe(largeContent);
        },
        complete: () => {
          const endTime = performance.now();
          expect(endTime - startTime).toBeLessThan(100); // Should be fast
          done();
        }
      });
    });
  });
});
