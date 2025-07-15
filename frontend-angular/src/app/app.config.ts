import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app.routes';
import { HttpConfigInterceptor } from './core/interceptors/http.interceptor';

/**
 * Main application configuration for TecSalud Medical Assistant
 *
 * @description Defines the core Angular configuration including routing, HTTP client,
 * animations, interceptors, and other essential providers for the medical application.
 *
 * @example
 * ```typescript
 * // Used in main.ts to bootstrap the application
 * import { appConfig } from './app/app.config';
 *
 * bootstrapApplication(AppComponent, appConfig)
 *   .catch((err) => console.error(err));
 * ```
 *
 * @features
 * - Zone.js change detection with event coalescing for performance
 * - Router configuration with lazy-loaded routes
 * - HTTP client with custom interceptors
 * - Animations support for UI transitions
 * - Global HTTP interceptor for headers and logging
 *
 * @since 1.0.0
 */
export const appConfig: ApplicationConfig = {
  providers: [
    /** Zone.js change detection with performance optimizations */
    provideZoneChangeDetection({ eventCoalescing: true }),

    /** Router with application routes and lazy loading */
    provideRouter(routes),

    /** HTTP client for API communications */
    provideHttpClient(),

    /** Animations support for UI components */
    provideAnimations(),

    /** HTTP interceptor for global request/response processing */
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpConfigInterceptor,
      multi: true
    }
  ]
};
