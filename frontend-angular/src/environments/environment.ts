/**
 * Development environment configuration for TecSalud Medical Assistant
 * 
 * @description Environment settings optimized for local development including
 * extended timeouts, debug logging, and development-specific API endpoints.
 * 
 * @example
 * ```typescript
 * import { environment } from '@environments/environment';
 * 
 * // Used throughout the application
 * const apiUrl = environment.apiUrl; // 'http://localhost:8000'
 * const timeout = environment.apiTimeout; // 30000ms
 * 
 * if (environment.debug.showApiLogs) {
 *   console.log('API request:', data);
 * }
 * ```
 * 
 * @configuration
 * - Local development server (localhost:8000)
 * - Extended timeout for debugging (30s)
 * - Multiple retry attempts for unstable dev environment
 * - Full API logging enabled
 * 
 * @since 1.0.0
 */
export const environment = {
  /** Development environment flag */
  production: false,
  
  /** Local development API server URL */
  apiUrl: 'http://localhost:8000',
  
  /** Extended timeout for development (30 seconds) */
  apiTimeout: 30000,
  
  /** Multiple retry attempts for unstable dev environment */
  retryAttempts: 3,
  
  /** Debug configuration for development */
  debug: {
    /** Enable comprehensive API request/response logging */
    showApiLogs: true
  }
};