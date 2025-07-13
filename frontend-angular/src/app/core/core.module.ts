import { NgModule, Optional, SkipSelf } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { 
  ApiService, 
  MedicalStateService, 
  StreamingService, 
  UiStateService 
} from './services';

/**
 * Core module for TecSalud Medical Assistant
 * 
 * @description Central module that provides singleton services for the entire
 * medical application. Implements the singleton pattern to ensure services
 * are loaded only once and shared across the application.
 * 
 * @example
 * ```typescript
 * // Import only in AppModule (singleton pattern)
 * @NgModule({
 *   imports: [CoreModule],
 *   // ...
 * })
 * export class AppModule { }
 * ```
 * 
 * @provides
 * - ApiService: Backend API communication
 * - MedicalStateService: Medical workflow state management
 * - StreamingService: Real-time AI response streaming
 * - UiStateService: Global UI state and notifications
 * 
 * @pattern Singleton Module Pattern
 * @description Prevents multiple instances of core services by throwing
 * an error if the module is imported more than once.
 * 
 * @security
 * - Ensures singleton pattern for security-sensitive services
 * - Prevents service duplication that could lead to data inconsistency
 * 
 * @since 1.0.0
 */
@NgModule({
  imports: [
    CommonModule,
    HttpClientModule
  ],
  providers: [
    ApiService,
    MedicalStateService,
    StreamingService,
    UiStateService
  ]
})
export class CoreModule {
  /**
   * Creates an instance of CoreModule with singleton enforcement
   * 
   * @param parentModule - Optional parent CoreModule instance
   * @throws Error if CoreModule is already loaded (singleton violation)
   * 
   * @description Enforces the singleton pattern by preventing multiple
   * instances of the CoreModule. This ensures that core services like
   * ApiService and MedicalStateService are created only once.
   * 
   * @example
   * ```typescript
   * // Correct usage - import only in AppModule
   * @NgModule({
   *   imports: [CoreModule]
   * })
   * export class AppModule { }
   * 
   * // Incorrect - will throw error
   * @NgModule({
   *   imports: [CoreModule] // ERROR: CoreModule already loaded
   * })
   * export class FeatureModule { }
   * ```
   */
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it in the AppModule only');
    }
  }
}