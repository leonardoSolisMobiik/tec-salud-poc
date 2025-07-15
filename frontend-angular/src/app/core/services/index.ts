/**
 * Services module exports
 *
 * @description Centralized export point for all injectable services used throughout
 * the TecSalud application. Provides clean import paths for business logic services,
 * state management, API communication, and UI utilities.
 *
 * @example
 * ```typescript
 * // Import specific services
 * import { ApiService, MedicalStateService, UiStateService } from '@core/services';
 *
 * // Use in component constructor
 * constructor(
 *   private apiService: ApiService,
 *   private medicalState: MedicalStateService,
 *   private uiState: UiStateService
 * ) {}
 *
 * // Use services in component methods
 * async loadPatients() {
 *   this.uiState.startLoading('patients');
 *   const patients = await this.apiService.getPatients().toPromise();
 *   this.medicalState.setActivePatient(patients[0]);
 *   this.uiState.stopLoading('patients');
 * }
 * ```
 *
 * @module ServicesModule
 * @since 1.0.0
 */

/** API communication service for backend integration */
export * from './api.service';

/** Chat session management service for patient-document contexts */
export * from './chat-session.service';

/** Medical state management service for patient and chat data */
export * from './medical-state.service';

/** Streaming service for real-time AI responses */
export * from './streaming.service';

/** UI state management service for responsive design and interactions */
export * from './ui-state.service';
