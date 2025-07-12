import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '@environments/environment';

@Injectable()
export class HttpConfigInterceptor implements HttpInterceptor {
  
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