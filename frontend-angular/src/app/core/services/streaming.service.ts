import { Injectable, NgZone } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';
import { ChatRequest, StreamChunk } from '../models';

@Injectable({
  providedIn: 'root'
})
export class StreamingService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private zone: NgZone) {}

  /**
   * Creates a streaming connection to the medical chat endpoint
   * @param request The chat request with messages and optional patient context
   * @returns Observable that emits stream chunks
   */
  streamMedicalChat(request: ChatRequest): Observable<StreamChunk> {
    return new Observable(observer => {
      const abortController = new AbortController();

      fetch(`${this.apiUrl}/api/v1/chat/medical/stream`, {
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

        const processStream = async () => {
          try {
            while (true && !streamComplete) {
              const { done, value } = await reader.read();
              
              if (done) {
                console.log('📡 Reader done, breaking loop');
                this.zone.run(() => {
                  observer.next({ type: 'done' });
                  observer.complete();
                });
                break;
              }

              const chunk = decoder.decode(value);
              console.log('📥 Raw chunk received:', chunk.length, 'bytes');
              
              // Use the same regex as React - find all data: lines
              const dataRegex = /data: ({[^}]+})/g;
              let match;
              
              while ((match = dataRegex.exec(chunk)) !== null) {
                const data = match[1];
                console.log('📊 Found data:', data);
                
                try {
                  const parsed = JSON.parse(data);
                  console.log('✅ Parsed:', parsed);
                  
                  // Check if backend indicates completion
                  if (parsed.is_complete === true) {
                    console.log('✅ Backend indicates streaming complete');
                    this.zone.run(() => {
                      observer.next({ type: 'done' });
                    });
                    streamComplete = true;
                    break;
                  }
                  
                  // Handle content chunks
                  if (parsed.content !== undefined && parsed.content !== '') {
                    console.log('✅ Emitting chunk:', parsed.content);
                    this.zone.run(() => {
                      observer.next({
                        type: 'content',
                        content: parsed.content
                      });
                    });
                  }
                } catch (e) {
                  console.error('❌ Parse error:', e);
                  console.error('   Data was:', data);
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

      // Cleanup on unsubscribe
      return () => {
        abortController.abort();
      };
    });
  }
}