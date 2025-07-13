/**
 * Configuration module exports
 * 
 * @description Centralized export point for all configuration objects and constants
 * used throughout the TecSalud application. Provides clean import paths for
 * configuration-related modules.
 * 
 * @example
 * ```typescript
 * // Import configuration objects
 * import { API_CONFIG } from '@core/config';
 * 
 * // Use in components or services
 * const apiUrl = API_CONFIG.baseUrl;
 * const endpoint = API_CONFIG.endpoints.patients;
 * ```
 * 
 * @module ConfigModule
 * @since 1.0.0
 */
export * from './api.config'; 