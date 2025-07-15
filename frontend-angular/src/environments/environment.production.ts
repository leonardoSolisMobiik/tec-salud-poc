/**
 * Production environment configuration for TecSalud Medical Assistant
 *
 * @description Environment settings optimized for production deployment including
 * shorter timeouts, minimal logging, and production API endpoints for performance
 * and security in medical environments.
 *
 * @example
 * ```typescript
 * // Used automatically in production builds via Angular CLI
 * import { environment } from '@environments/environment';
 *
 * const apiUrl = environment.apiUrl; // 'https://api.tecsalud.com'
 * const timeout = environment.apiTimeout; // 10000ms
 *
 * // Debug logging disabled in production
 * if (environment.debug.showApiLogs) { // false
 *   console.log('No logging in production');
 * }
 * ```
 *
 * @configuration
 * - Production API server (HTTPS required for medical data)
 * - Optimized timeout for production performance (10s)
 * - Minimal retry attempts for fast failure
 * - Debug logging completely disabled for security
 *
 * @security
 * - API logging disabled to prevent sensitive data exposure
 * - HTTPS-only communication for medical data protection
 * - Optimized timeouts to prevent hanging requests
 *
 * @since 1.0.0
 */
export const environment = {
  /** Production environment flag */
  production: true,

  /** Production API server URL (HTTPS required for medical data) */
  apiUrl: 'https://ca-tsalud-dev-backend-001.nicebush-5fef3953.centralus.azurecontainerapps.io',

  /** Optimized timeout for production performance (10 seconds) */
  apiTimeout: 10000,

  /** Minimal retry attempts for fast failure in production */
  retryAttempts: 2,

  /** Debug configuration for production (security-focused) */
  debug: {
    /** API logging disabled for security and performance */
    showApiLogs: false
  }
};
