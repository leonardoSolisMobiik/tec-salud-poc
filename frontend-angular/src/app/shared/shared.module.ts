import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

/**
 * Shared module for reusable components and modules
 * 
 * @description Provides commonly used Angular modules and shared components
 * that can be imported by feature modules throughout the medical application.
 * Follows the shared module pattern for code reusability.
 * 
 * @example
 * ```typescript
 * // Import in feature modules
 * @NgModule({
 *   imports: [SharedModule],
 *   declarations: [SomeFeatureComponent]
 * })
 * export class FeatureModule { }
 * ```
 * 
 * @exports
 * - CommonModule: Basic Angular directives (ngIf, ngFor, etc.)
 * - ReactiveFormsModule: Reactive form handling for medical forms
 * - FormsModule: Template-driven forms for simple inputs
 * - RouterModule: Navigation and routing utilities
 * 
 * @pattern Shared Module Pattern
 * @description Centralizes common imports and exports to reduce duplication
 * across feature modules and maintain consistency.
 * 
 * @usage
 * - Import in feature modules that need common functionality
 * - Do NOT import in AppModule (use CoreModule instead)
 * - Ideal for feature modules that need forms, routing, and common directives
 * 
 * @since 1.0.0
 */
@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule
  ],
  exports: [
    /** Basic Angular directives and pipes */
    CommonModule,
    
    /** Reactive forms for complex medical forms */
    ReactiveFormsModule,
    
    /** Template-driven forms for simple inputs */
    FormsModule,
    
    /** Router directives and services */
    RouterModule
  ]
})
export class SharedModule {
  /**
   * Creates an instance of SharedModule
   * 
   * @description Initializes the shared module with common Angular modules.
   * This module can be safely imported multiple times across feature modules.
   */
}