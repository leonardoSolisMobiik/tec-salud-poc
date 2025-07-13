import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

/**
 * HTTP Interceptor for configuring requests with global headers and logging
 * 
 * @description Intercepts all HTTP requests to add standard headers, CORS headers
 * for development environment, and request logging when debug mode is enabled.
 * 
 * @example
 * ```typescript
 * // Registered in app.config.ts
 * providers: [
 *   provideHttpClient(
 *     withInterceptors([HttpConfigInterceptor])
 *   )
 * ]
 * 
 * // Automatically applied to all HTTP requests
 * this.http.get('/api/patients').subscribe(...); // Headers added automatically
 * ```
 * 
 * @implements {HttpInterceptor}
 * @since 1.0.0
 */
@Injectable()
export class HttpConfigInterceptor implements HttpInterceptor {
  
  /**
   * Intercepts HTTP requests to add configuration and logging
   * 
   * @param req - The outgoing HTTP request
   * @param next - The next interceptor in the chain or the HTTP handler
   * @returns Observable of the HTTP event
   * 
   * @description Adds standard headers to all requests including Content-Type,
   * Accept, and X-Requested-With. In development mode with debug logging enabled,
   * also adds CORS headers and logs request details to console.
   * 
   * @example
   * ```typescript
   * // This method is called automatically by Angular for every HTTP request
   * // Original request gets these headers added:
   * // - Content-Type: application/json
   * // - Accept: application/json  
   * // - X-Requested-With: XMLHttpRequest
   * // 
   * // In development with debug enabled, also adds:
   * // - Access-Control-Allow-Origin: *
   * // - Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
   * // - Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization
   * ```
   */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    
    // Clone the request to add headers
    const configuredRequest = req.clone({
      setHeaders: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        // Add CORS headers for development
        ...(environment.debug?.showApiLogs && {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
        })
      }
    });

    // Log request in development
    if (environment.debug?.showApiLogs) {
      console.log('[HTTP Interceptor] Request:', {
        method: configuredRequest.method,
        url: configuredRequest.url,
        headers: configuredRequest.headers,
        body: configuredRequest.body
      });
    }

    return next.handle(configuredRequest);
  }
} 