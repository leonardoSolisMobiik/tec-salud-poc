import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { UiStateService, Toast } from '@core/services';
import { trigger, transition, style, animate, state } from '@angular/animations';

/**
 * Toast Container Component for displaying notification messages
 * 
 * @description Fixed-position container that displays toast notifications
 * with different types (success, error, warning, info). Features automatic
 * positioning, slide-in animations, and manual dismiss functionality.
 * 
 * @example
 * ```typescript
 * // In app.component.html
 * <app-toast-container></app-toast-container>
 * 
 * // Trigger toasts from any service/component
 * this.uiState.showSuccessToast('Operation completed successfully!');
 * this.uiState.showErrorToast('An error occurred');
 * this.uiState.showWarningToast('Please check your input');
 * this.uiState.showInfoToast('Information message');
 * ```
 * 
 * @features
 * - Four toast types: success, error, warning, info
 * - Slide-in/out animations from right side
 * - Color-coded left border and icons
 * - Manual dismiss with close button
 * - Responsive positioning (top-right desktop, bottom mobile)
 * - Medical-themed styling consistent with app design
 * - Automatic stacking for multiple toasts
 * 
 * @positioning
 * - Desktop: Top-right corner (80px from top, 20px from right)
 * - Mobile: Bottom of screen (20px from all sides)
 * 
 * @animations
 * - slideIn: Smooth horizontal slide transition (300ms enter, 200ms leave)
 * 
 * @usage
 * - Place once in app.component.html
 * - Control via UiStateService toast methods
 * - Automatically handles multiple concurrent toasts
 * 
 * @since 1.0.0
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let toast of toasts$ | async" 
           class="toast"
           [class.success]="toast.type === 'success'"
           [class.error]="toast.type === 'error'"
           [class.warning]="toast.type === 'warning'"
           [class.info]="toast.type === 'info'"
           [@slideIn]>
        <div class="toast-content">
          <span class="toast-icon">{{ getIcon(toast.type) }}</span>
          <span class="toast-message">{{ toast.message }}</span>
        </div>
        <button class="toast-close" (click)="removeToast(toast.id)">✕</button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 80px;
      right: 20px;
      z-index: 2000;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 400px;
    }
    
    .toast {
      background: var(--medical-surface);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      display: flex;
      align-items: center;
      padding: 1rem;
      gap: 0.75rem;
      min-width: 300px;
      border-left: 4px solid transparent;
      
      &.success {
        border-left-color: var(--medical-success);
        
        .toast-icon {
          color: var(--medical-success);
        }
      }
      
      &.error {
        border-left-color: var(--medical-critical);
        
        .toast-icon {
          color: var(--medical-critical);
        }
      }
      
      &.warning {
        border-left-color: var(--medical-warning);
        
        .toast-icon {
          color: var(--medical-warning);
        }
      }
      
      &.info {
        border-left-color: var(--medical-blue);
        
        .toast-icon {
          color: var(--medical-blue);
        }
      }
    }
    
    .toast-content {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }
    
    .toast-icon {
      font-size: 1.25rem;
    }
    
    .toast-message {
      flex: 1;
      font-size: 0.9375rem;
      color: var(--medical-text-primary);
    }
    
    .toast-close {
      background: none;
      border: none;
      padding: 0.25rem;
      cursor: pointer;
      color: var(--medical-text-secondary);
      font-size: 1.125rem;
      line-height: 1;
      opacity: 0.6;
      transition: opacity 0.2s;
      
      &:hover {
        opacity: 1;
      }
    }
    
    /* Mobile Styles */
    @media (max-width: 768px) {
      .toast-container {
        top: auto;
        bottom: 20px;
        left: 20px;
        right: 20px;
        max-width: none;
      }
      
      .toast {
        min-width: auto;
      }
    }
  `],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ 
          transform: 'translateX(100%)',
          opacity: 0 
        }),
        animate('300ms ease-out', style({ 
          transform: 'translateX(0)',
          opacity: 1 
        }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ 
          transform: 'translateX(100%)',
          opacity: 0 
        }))
      ])
    ])
  ]
})
export class ToastContainerComponent implements OnInit {
  /** Observable stream of current toast notifications */
  toasts$: Observable<Toast[]>;
  
  /**
   * Creates an instance of ToastContainerComponent
   * 
   * @param uiState - UI state service for toast management
   * 
   * @description Initializes the component with toast observable
   * from the UI state service for reactive toast display.
   */
  constructor(private uiState: UiStateService) {
    this.toasts$ = this.uiState.toasts$;
  }
  
  /**
   * Component initialization lifecycle hook
   * 
   * @description No specific initialization needed as component
   * is purely reactive to UI state service toast changes.
   */
  ngOnInit(): void {}
  
  /**
   * Removes a specific toast notification
   * 
   * @param toastId - Unique identifier of the toast to remove
   * 
   * @description Delegates to UI state service to remove a toast
   * by its unique ID. Triggers slide-out animation.
   * 
   * @example
   * ```typescript
   * removeToast('toast-123'); // Removes toast with ID 'toast-123'
   * ```
   */
  removeToast(toastId: string): void {
    this.uiState.removeToast(toastId);
  }
  
  /**
   * Gets the appropriate icon for a toast type
   * 
   * @param type - The toast type (success, error, warning, info)
   * @returns Icon string for the toast type
   * 
   * @description Maps toast types to their corresponding visual icons
   * for consistent user experience across all notification types.
   * 
   * @example
   * ```typescript
   * getIcon('success'); // Returns "✓"
   * getIcon('error'); // Returns "✗"
   * getIcon('warning'); // Returns "⚠"
   * getIcon('info'); // Returns "ℹ"
   * ```
   */
  getIcon(type: Toast['type']): string {
    const icons = {
      success: '✓',
      error: '✗',
      warning: '⚠',
      info: 'ℹ'
    };
    return icons[type];
  }
}