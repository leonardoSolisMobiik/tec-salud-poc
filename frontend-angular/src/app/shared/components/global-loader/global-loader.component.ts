import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { UiStateService } from '@core/services';
import { trigger, transition, style, animate } from '@angular/animations';

/**
 * Global Loader Component for application-wide loading states
 * 
 * @description Full-screen overlay loader that displays during global loading operations.
 * Features animated spinner, backdrop blur, and responsive design. Automatically
 * shows/hides based on UI state service loading state.
 * 
 * @example
 * ```typescript
 * // In app.component.html
 * <app-global-loader></app-global-loader>
 * 
 * // Trigger loading from any service/component
 * this.uiState.startLoading('data-fetch');
 * // Loader automatically appears
 * 
 * // Stop loading
 * this.uiState.stopLoading('data-fetch');
 * // Loader automatically disappears
 * ```
 * 
 * @features
 * - Full-screen overlay with backdrop blur
 * - Multi-ring animated spinner
 * - Fade in/out animations
 * - Responsive design for mobile devices
 * - Automatically controlled by UiStateService
 * - Medical-themed styling
 * 
 * @animations
 * - fadeIn: Smooth fade in/out transitions (200ms)
 * - spin: Continuous rotation animation for spinner rings
 * 
 * @usage
 * - Place once in app.component.html
 * - Control via UiStateService loading methods
 * - Automatically handles multiple concurrent loading states
 * 
 * @since 1.0.0
 */
@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="loader-overlay" 
         *ngIf="isLoading$ | async"
         [@fadeIn]>
      <div class="loader-content">
        <div class="loader-spinner">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>
        <div class="loader-text">
          <h3>Procesando...</h3>
          <p>Por favor espere mientras completamos su solicitud</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loader-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 3000;
    }
    
    .loader-content {
      background: var(--medical-surface);
      border-radius: 16px;
      padding: 3rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2rem;
      max-width: 400px;
      width: 90%;
    }
    
    .loader-spinner {
      width: 64px;
      height: 64px;
      position: relative;
    }
    
    .spinner-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border: 3px solid transparent;
      border-radius: 50%;
      animation: spin 1.5s cubic-bezier(0.5, 0, 0.5, 1) infinite;
      
      &:nth-child(1) {
        border-top-color: var(--medical-blue);
        animation-delay: -0.45s;
      }
      
      &:nth-child(2) {
        border-right-color: var(--medical-success);
        animation-delay: -0.3s;
      }
      
      &:nth-child(3) {
        border-bottom-color: var(--medical-warning);
        animation-delay: -0.15s;
      }
      
      &:nth-child(4) {
        border-left-color: var(--medical-blue);
      }
    }
    
    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
    
    .loader-text {
      text-align: center;
      
      h3 {
        margin: 0 0 0.5rem;
        color: var(--medical-text-primary);
        font-size: 1.25rem;
        font-weight: 600;
      }
      
      p {
        margin: 0;
        color: var(--medical-text-secondary);
        font-size: 0.9375rem;
      }
    }
    
    /* Mobile Styles */
    @media (max-width: 768px) {
      .loader-content {
        padding: 2rem;
      }
      
      .loader-spinner {
        width: 48px;
        height: 48px;
      }
      
      .loader-text {
        h3 {
          font-size: 1.125rem;
        }
        
        p {
          font-size: 0.875rem;
        }
      }
    }
  `],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('200ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class GlobalLoaderComponent implements OnInit {
  /** Observable for loading state from UI service */
  isLoading$: Observable<boolean>;
  
  /**
   * Creates an instance of GlobalLoaderComponent
   * 
   * @param uiState - UI state service for loading state management
   * 
   * @description Initializes the component with loading state observable
   * from the UI state service for automatic show/hide behavior.
   */
  constructor(private uiState: UiStateService) {
    this.isLoading$ = this.uiState.isLoading$;
  }
  
  /**
   * Component initialization lifecycle hook
   * 
   * @description No specific initialization needed as component
   * is purely reactive to UI state service changes.
   */
  ngOnInit(): void {}
}