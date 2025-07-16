import { Component, Output, EventEmitter, OnInit, OnDestroy, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Observable, interval } from 'rxjs';
import { takeUntil, startWith, map } from 'rxjs/operators';
import { QuickQuestion, QuickQuestionsService } from '../../services/quick-questions.service';
import { Patient } from '@core/models';
import { PillsService } from '@core/services';
import { Pill } from '@core/models';
import { finalize } from 'rxjs/operators';

/**
 * Quick Pills component for contextual medical question suggestions
 *
 * @description Displays contextual quick questions as interactive pills/buttons
 * above the chat input. Questions are automatically filtered based on patient
 * context and medical priorities, with optional rotation and progress indicators.
 *
 * @example
 * ```typescript
 * // In parent component template
 * <app-quick-pills
 *   [patient]="activePatient"
 *   [showRotationIndicator]="true"
 *   (questionSelected)="onQuestionSelected($event)">
 * </app-quick-pills>
 *
 * // In parent component
 * onQuestionSelected(questionText: string) {
 *   console.log('User selected question:', questionText);
 *   this.processQuickQuestion(questionText);
 * }
 * ```
 *
 * @features
 * - Contextual questions based on patient demographics
 * - Priority-based visual styling (high/medium/low)
 * - Automatic question rotation with progress indicator
 * - Responsive grid layout with medical-themed icons
 * - Integration with QuickQuestionsService
 * - Smooth animations and transitions
 *
 * @inputs
 * - patient: Patient | null - Current patient for contextual filtering
 * - showRotationIndicator: boolean - Whether to show rotation progress bar
 *
 * @outputs
 * - questionSelected: EventEmitter<string> - Emitted when user clicks a question pill
 *
 * @since 1.0.0
 */
@Component({
  selector: 'app-quick-pills',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Loading state - only show during initial load -->
    <div *ngIf="isLoading" class="loading-state">
      <div class="loading-container">
        <div class="loading-spinner">
          <div class="spinner"></div>
        </div>
        <div class="loading-text">
          <h3>🔄 Cargando pastillas...</h3>
          <p>Obteniendo preguntas rápidas</p>
        </div>
      </div>
    </div>

    <!-- Pills loaded from API - only show if we have pills -->
    <div class="quick-pills-container" *ngIf="!isLoading && !errorMessage && currentQuestions.length > 0">
      <!-- Pastillas con diseño premium sutil -->
      <div class="quick-pills-grid">
        <button
          *ngFor="let question of currentQuestions; trackBy: trackByQuestion"
          class="quick-pill-btn"
          [class.priority-high]="question.priority === 'high'"
          [class.priority-medium]="question.priority === 'medium'"
          [class.priority-low]="question.priority === 'low'"
          (click)="onPillClick(question)"
          [disabled]="isRotating">

          <span class="pill-icon">{{ question.icon }}</span>
          <span class="pill-text">{{ question.text }}</span>
        </button>
      </div>

      <!-- Indicador de rotación sutil -->
      <div class="rotation-indicator" *ngIf="showRotationIndicator">
        <div class="progress-bar">
          <div class="progress-fill" [style.width.%]="rotationProgress"></div>
        </div>
      </div>
    </div>

    <!-- No pills state - don't show anything if no pills available -->
    <!-- This ensures the component is completely hidden when no pills exist -->
  `,
  styles: [`
    /* Quick Pills Container */
    .quick-pills-container {
      margin-bottom: var(--bmb-spacing-s, 0.5rem);
      opacity: 0;
      transform: translateY(10px);
      animation: fadeInUp 0.3s ease-out forwards;
    }

    @keyframes fadeInUp {
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    /* Grid premium adaptativo - reutiliza patrón existente */
    .quick-pills-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: var(--bmb-spacing-xs, 0.5rem);
      margin-bottom: var(--bmb-spacing-xs, 0.5rem);
    }

    /* Pastillas premium sutiles - basado en .quick-action-btn existente */
    .quick-pill-btn {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-xs, 0.5rem);
      padding: var(--bmb-spacing-xs, 0.5rem) var(--bmb-spacing-s, 0.75rem);

      /* Reutiliza exactamente el mismo patrón del chat-input.component.ts */
      background: linear-gradient(135deg,
        rgba(var(--general_contrasts-surface), 0.9) 0%,
        rgba(var(--general_contrasts-surface), 0.8) 100%
      );
      border: 1px solid rgba(var(--general_contrasts-container-outline), 0.2);
      border-radius: var(--bmb-radius-m, 1rem);

      font-size: 0.8rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(5px);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: var(--bmb-radius-m, 1rem);
        background: linear-gradient(135deg,
          rgba(var(--color-blue-tec), 0.1) 0%,
          rgba(var(--color-blue-tec), 0.05) 100%
        );
        opacity: 0;
        transition: opacity 0.3s ease;
      }

      &:hover:not(:disabled) {
        /* Reutiliza el mismo efecto hover del chat-input.component.ts */
        background: linear-gradient(135deg,
          rgba(var(--color-blue-tec), 0.1) 0%,
          rgba(var(--color-blue-tec), 0.05) 100%
        );
        border-color: rgba(var(--color-blue-tec), 0.3);
        color: rgb(var(--color-blue-tec));
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(var(--color-blue-tec), 0.1);

        &::before {
          opacity: 1;
        }
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);

        &::before {
          opacity: 0;
        }
      }
    }

    /* Variaciones sutiles de prioridad */
    .quick-pill-btn.priority-high {
      border-color: rgba(239, 68, 68, 0.2);

      &:hover:not(:disabled) {
        border-color: rgba(239, 68, 68, 0.4);
        color: rgb(239, 68, 68);

        &::before {
          background: linear-gradient(135deg,
            rgba(239, 68, 68, 0.1) 0%,
            rgba(239, 68, 68, 0.05) 100%
          );
        }
      }
    }

    .quick-pill-btn.priority-medium {
      border-color: rgba(245, 158, 11, 0.2);

      &:hover:not(:disabled) {
        border-color: rgba(245, 158, 11, 0.4);
        color: rgb(245, 158, 11);

        &::before {
          background: linear-gradient(135deg,
            rgba(245, 158, 11, 0.1) 0%,
            rgba(245, 158, 11, 0.05) 100%
          );
        }
      }
    }

    .quick-pill-btn.priority-low {
      border-color: rgba(16, 185, 129, 0.2);

      &:hover:not(:disabled) {
        border-color: rgba(16, 185, 129, 0.4);
        color: rgb(16, 185, 129);

        &::before {
          background: linear-gradient(135deg,
            rgba(16, 185, 129, 0.1) 0%,
            rgba(16, 185, 129, 0.05) 100%
          );
        }
      }
    }

    /* Iconos y texto premium */
    .pill-icon {
      font-size: 1rem;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
      flex-shrink: 0;
    }

    .pill-text {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      position: relative;
      z-index: 1;
    }

    /* Indicador de rotación muy sutil */
    .rotation-indicator {
      display: flex;
      justify-content: center;
      opacity: 0.6;
    }

    .progress-bar {
      width: 60px;
      height: 2px;
      background: rgba(var(--general_contrasts-container-outline), 0.3);
      border-radius: 1px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg,
        rgba(var(--color-blue-tec), 0.6) 0%,
        rgba(var(--color-blue-tec), 0.4) 100%
      );
      transition: width 0.1s ease;
    }

    /* Responsive - reutiliza el patrón del chat-input.component.ts */
    @media (max-width: 768px) {
      .quick-pills-grid {
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: var(--bmb-spacing-xs, 0.5rem);
      }

      .quick-pill-btn {
        font-size: 0.75rem;
        padding: var(--bmb-spacing-xs, 0.5rem);

        .pill-icon {
          font-size: 0.9rem;
        }
      }
    }

    @media (max-width: 480px) {
      .quick-pills-grid {
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      }

      .pill-text {
        font-size: 0.7rem;
      }
    }

    /* Loading state */
    .quick-pills-container.loading {
      opacity: 1;
    }

    /* 🔄 LOADING STATE */
    .loading-state {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: var(--bmb-spacing-l) var(--bmb-spacing-m);
      min-height: 120px;

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--bmb-spacing-m);
      }
    }

    .loading-spinner {
      display: flex;
      justify-content: center;
      align-items: center;

      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid rgba(var(--color-blue-tec), 0.1);
        border-left: 4px solid rgba(var(--color-blue-tec), 1);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    }

    .loading-text {
      text-align: center;

      h3 {
        font-size: 1rem;
        font-weight: 600;
        color: var(--general_contrasts-text-primary);
        margin: 0 0 0.25rem 0;
      }

      p {
        font-size: 0.875rem;
        color: var(--general_contrasts-text-secondary);
        margin: 0;
      }
    }





    /* Error state */
    .quick-pills-container.error {
      opacity: 1;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-xs, 0.5rem);
      padding: var(--bmb-spacing-s, 0.75rem);
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: var(--bmb-radius-m, 1rem);
      color: rgb(239, 68, 68);
      font-size: 0.8rem;
    }

    .error-icon {
      font-size: 1rem;
    }

    .error-text {
      font-weight: 500;
    }
  `]
})
export class QuickPillsComponent implements OnInit, OnDestroy, OnChanges {
  /** Current patient for contextual question filtering */
  @Input() patient: Patient | null = null;

  /** Whether to display rotation progress indicator */
  @Input() showRotationIndicator: boolean = false;

  /** Event emitted when user selects a question pill */
  @Output() questionSelected = new EventEmitter<string>();

  /** Subject for handling component destruction */
  private destroy$ = new Subject<void>();

  /** Currently displayed quick questions */
  currentQuestions: QuickQuestion[] = [];

  /** Flag indicating if questions are currently rotating */
  isRotating = false;

  /** Current rotation progress percentage (0-100) */
  rotationProgress = 0;

  /** Timer reference for rotation progress animation */
  private progressTimer: any;

  /** Loading state for API pills */
  isLoading = false;

  /** Error message for failed API requests */
  errorMessage: string | null = null;

  /** Flag to track if pills have been loaded at least once */
  private pillsLoadedOnce = false;

  /**
   * Creates an instance of QuickPillsComponent
   *
   * @param quickQuestionsService - Service for managing contextual questions
   * @param pillsService - Service for managing pills from API
   */
  constructor(
    private quickQuestionsService: QuickQuestionsService,
    private pillsService: PillsService
  ) {}

  /**
   * Component initialization lifecycle method
   *
   * @description Sets up question subscription and starts rotation progress tracking
   */
  ngOnInit(): void {
    this.loadPillsFromAPI();
    this.subscribeToQuestions();
    this.startRotationProgress();
  }

  /**
   * Component cleanup lifecycle method
   *
   * @description Cleans up subscriptions, timers, and stops question rotation
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.clearProgressTimer();
    this.quickQuestionsService.stopRotation();
  }

  /**
   * Component changes lifecycle method
   *
   * @description No longer reloads pills on patient change - pills are loaded once on init
   */
  ngOnChanges(): void {
    // Pills are now loaded only once on component initialization
    // No need to reload on patient changes
  }

  /**
   * Loads pills from API and converts them to QuickQuestion format
   *
   * @description Fetches pills from the real API and converts them for display
   * Only loads once during component lifecycle
   */
  private loadPillsFromAPI(): void {
    // Don't reload if already loaded once
    if (this.pillsLoadedOnce) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = null;

    this.pillsService.loadPills(8, 0) // Load up to 8 pills
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.isLoading = false;
          this.pillsLoadedOnce = true;
        })
      )
      .subscribe({
        next: (pills) => {
          console.log('✅ Pills loaded from API:', pills);
          if (pills && pills.length > 0) {
            const quickQuestions = this.convertPillsToQuickQuestions(pills);
            this.currentQuestions = quickQuestions;
          } else {
            console.log('ℹ️ No pills available from API');
            this.currentQuestions = [];
          }
        },
        error: (error) => {
          console.error('❌ Error loading pills:', error);
          this.errorMessage = 'Error al cargar las pastillas';
          this.currentQuestions = [];
        }
      });
  }

  /**
   * Converts Pill objects to QuickQuestion format
   *
   * @param pills - Array of pills from API
   * @returns Array of quick questions
   */
  private convertPillsToQuickQuestions(pills: Pill[]): QuickQuestion[] {
    return pills.map(pill => {
             // Map priority strings to QuickQuestion priority format
       let priority: 'high' | 'medium' | 'low' = 'medium';
       if (pill.priority === 'alta') priority = 'high';
       else if (pill.priority === 'media') priority = 'medium';
       else if (pill.priority === 'baja') priority = 'low';
       else priority = 'medium'; // Default fallback

      // Map categories to valid QuickQuestion categories
      let category: QuickQuestion['category'] = 'diagnosis';
      switch (pill.category.toLowerCase()) {
        case 'diagnosis': category = 'diagnosis'; break;
        case 'symptoms': category = 'symptoms'; break;
        case 'treatment': category = 'treatment'; break;
        case 'medication': category = 'medication'; break;
        case 'tests': category = 'tests'; break;
        case 'emergency': category = 'emergency'; break;
        case 'follow-up': category = 'follow-up'; break;
        case 'prevention': category = 'prevention'; break;
        default: category = 'diagnosis'; break;
    }

      const pillId = pill.id || (pill as any).pill_id || `pill-${Math.random()}`;

      return {
        id: pillId,
        text: pill.text,
        icon: pill.icon,
        category: category,
        priority: priority,
        contextual: true,
        ageRelevant: false,
        genderRelevant: false
      } as QuickQuestion;
    });
  }

  private subscribeToQuestions(): void {
    // No longer needed - pills are loaded once from API only
    // Keeping method for future fallback implementation if needed
  }

  private startRotationProgress(): void {
    this.clearProgressTimer();
    this.rotationProgress = 0;

    this.progressTimer = setInterval(() => {
      this.rotationProgress += 1;
      if (this.rotationProgress >= 100) {
        this.rotationProgress = 0;
      }
    }, 100); // 100ms intervals for smooth progress
  }

  private resetRotationProgress(): void {
    this.rotationProgress = 0;
  }

  private clearProgressTimer(): void {
    if (this.progressTimer) {
      clearInterval(this.progressTimer);
    }
  }

  onPillClick(question: QuickQuestion): void {
    // Reutiliza la misma lógica de insertQuickAction del chat-input.component.ts
    this.questionSelected.emit(question.text);
  }

  trackByQuestion(index: number, question: QuickQuestion): string {
    return question.id;
  }
}
