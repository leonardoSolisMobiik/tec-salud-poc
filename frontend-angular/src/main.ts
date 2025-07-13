/**
 * Main entry point for TecSalud Medical Assistant Angular application
 * 
 * @description Bootstraps the Angular application with the configured providers
 * and error handling. Uses the standalone bootstrap approach for Angular 17+.
 * 
 * @example
 * ```typescript
 * // Application starts here and loads all configured services:
 * // - Router with lazy-loaded routes
 * // - HTTP client with interceptors
 * // - Medical state management
 * // - UI state management
 * // - Bamboo Design System integration
 * ```
 * 
 * @fileoverview Entry point that initializes the complete medical application
 * including all services, routing, and error handling mechanisms.
 * 
 * @since 1.0.0
 */

import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

/**
 * Bootstrap the TecSalud Medical Assistant application
 * 
 * @description Starts the Angular application with the root AppComponent
 * and all configured providers from appConfig. Includes global error handling.
 */
bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error('❌ Application bootstrap failed:', err));
