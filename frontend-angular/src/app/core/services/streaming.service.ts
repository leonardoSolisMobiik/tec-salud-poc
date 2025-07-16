import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ChatRequest, StreamChunk } from '../models';

/**
 * Service for handling streaming responses from AI chat endpoints
 *
 * @description Manages real-time streaming connections to the backend AI services.
 * Handles Server-Sent Events (SSE) style streaming, chunk processing, and error handling.
 * Uses NgZone for proper Angular change detection during streaming operations.
 *
 * @example
 * ```typescript
 * constructor(private streamingService: StreamingService) {}
 *
 * // Stream medical chat response
 * const chatRequest: ChatRequest = {
 *   messages: [{ role: 'user', content: '¿Cuáles son los síntomas?' }],
 *   patient_id: 'patient-123',
 *   stream: true
 * };
 *
 * this.streamingService.streamMedicalChat(chatRequest).subscribe({
 *   next: (chunk) => {
 *     if (chunk.type === 'content') {
 *       console.log('New content:', chunk.content);
 *     } else if (chunk.type === 'done') {
 *       console.log('Streaming completed');
 *     }
 *   },
 *   error: (error) => console.error('Stream error:', error),
 *   complete: () => console.log('Stream finished')
 * });
 * ```
 *
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class StreamingService {
  /** Base API URL from environment configuration */
  private readonly apiUrl = environment.apiUrl;

  /**
   * Creates an instance of StreamingService
   *
   * @param zone - Angular NgZone for proper change detection during async operations
   */
  constructor(private zone: NgZone) {}

  /**
   * Creates a streaming connection to the medical chat endpoint
   *
   * @param request - Chat request containing messages and optional patient context
   * @returns Observable that emits stream chunks as they arrive from the AI
   *
   * @description Establishes a streaming connection to the backend AI service using
   * the Fetch API with AbortController for cancellation. Processes Server-Sent Events
   * style responses and emits parsed chunks through an Observable stream.
   *
   * @example
   * ```typescript
   * const request: ChatRequest = {
   *   messages: [
   *     { role: 'user', content: 'Evalúa estos síntomas: fiebre, dolor de cabeza' }
   *   ],
   *   patient_id: 'patient-456',
   *   include_context: true,
   *   stream: true
   * };
   *
   * this.streamingService.streamMedicalChat(request).subscribe({
   *   next: (chunk) => {
   *     switch (chunk.type) {
   *       case 'content':
   *         // Handle incremental content
   *         this.appendToMessage(chunk.content);
   *         break;
   *       case 'done':
   *         // Handle completion
   *         this.finalizeMessage();
   *         break;
   *       case 'error':
   *         // Handle errors
   *         this.showError(chunk.error);
   *         break;
   *     }
   *   },
   *   error: (error) => {
   *     console.error('Streaming failed:', error);
   *   }
   * });
   * ```
   *
   * @throws Will emit error if network request fails or response cannot be processed
   */
  streamMedicalChat(request: ChatRequest): Observable<StreamChunk> {
    return new Observable(observer => {
      const abortController = new AbortController();

      fetch(`${this.apiUrl}/chat/medical/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
        signal: abortController.signal
      })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error('Response body is not readable');
        }

        const decoder = new TextDecoder();
        let streamComplete = false;

        /**
         * Processes the streaming response chunks
         *
         * @private
         * @description Reads chunks from the stream, parses Server-Sent Events format,
         * and emits appropriate StreamChunk objects. Handles content chunks and completion signals.
         */
        const processStream = async () => {
          try {
            while (true && !streamComplete) {
              const { done, value } = await reader.read();

              if (done) {
                console.log('📡 Reader done, breaking loop');
                this.zone.run(() => {
                  observer.complete();
                });
                break;
              }

              const chunk = decoder.decode(value);
              console.log('📥 Raw chunk received:', chunk.length, 'bytes');

              // Parse Server-Sent Events format - find all data: lines
              const dataRegex = /data: ({[^}]+})/g;
              let match;

              while ((match = dataRegex.exec(chunk)) !== null) {
                const data = match[1];
                console.log('📊 Found data:', data);

                try {
                  const parsed = JSON.parse(data);
                  console.log('✅ Parsed:', parsed);

                  if (parsed.content !== undefined && parsed.content !== '') {
                    console.log('✅ Emitting chunk:', parsed.content);
                    this.zone.run(() => {
                      observer.next({
                        type: 'content',
                        content: parsed.content
                      });
                    });
                  } else if (parsed.is_complete) {
                    console.log('✅ Streaming complete');
                    this.zone.run(() => {
                      observer.next({ type: 'done' });
                    });
                    streamComplete = true;
                    break;
                  }
                } catch (e) {
                  console.error('❌ Parse error:', e);
                  console.error('   Data was:', data);
                  this.zone.run(() => {
                    observer.next({
                      type: 'error',
                      error: `Parse error: ${e instanceof Error ? e.message : 'Unknown error'}`
                    });
                  });
                }
              }
            }

            console.log('🏁 Stream processing finished');
          } catch (error) {
            this.zone.run(() => {
              console.error('Stream processing error:', error);
              observer.error(error);
            });
          }
        };

        processStream();
      })
      .catch(error => {
        this.zone.run(() => {
          observer.error(error);
        });
      });

      /**
       * Cleanup function called when Observable is unsubscribed
       *
       * @description Aborts the fetch request to prevent memory leaks
       * and clean up resources when the component unsubscribes
       */
      return () => {
        abortController.abort();
      };
    });
  }
}
