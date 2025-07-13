/**
 * Interceptors module exports
 * 
 * @description Centralized export point for all HTTP interceptors used in the
 * TecSalud application. Provides clean import paths for middleware that processes
 * HTTP requests and responses globally across the application.
 * 
 * @example
 * ```typescript
 * // Import interceptors for app configuration
 * import { HttpConfigInterceptor } from '@core/interceptors';
 * 
 * // Register in app.config.ts
 * export const appConfig: ApplicationConfig = {
 *   providers: [
 *     provideHttpClient(
 *       withInterceptors([HttpConfigInterceptor])
 *     )
 *   ]
 * };
 * ```
 * 
 * @module InterceptorsModule
 * @since 1.0.0
 */

/** HTTP configuration interceptor for global request/response handling */
export * from './http.interceptor'; 