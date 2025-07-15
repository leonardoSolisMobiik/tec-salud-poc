/**
 * Models module exports
 *
 * @description Centralized export point for all data models and interfaces
 * used throughout the TecSalud application. Provides clean import paths
 * for type definitions related to patients, chat, API responses, and more.
 *
 * @example
 * ```typescript
 * // Import specific models
 * import { Patient, ChatMessage, ApiResponse } from '@core/models';
 *
 * // Use imported types
 * const patient: Patient = { id: '123', name: 'Juan Pérez', age: 45, gender: 'M' };
 * const message: ChatMessage = { role: 'user', content: 'Hello', timestamp: new Date() };
 * const response: ApiResponse<Patient> = { data: patient, status: 200 };
 * ```
 *
 * @module ModelsModule
 * @since 1.0.0
 */

/** Patient-related models and interfaces */
export * from './patient.model';

/** Chat and communication models */
export * from './chat.model';

/** API response and error models */
export * from './api.model';

/** Pill models for quick questions functionality */
export * from './pill.model';
