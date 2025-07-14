import { Component, Output, EventEmitter, OnInit, OnDestroy, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, Observable, interval } from 'rxjs';
import { takeUntil, startWith, map } from 'rxjs/operators';
import { QuickQuestion, QuickQuestionsService } from '../../services/quick-questions.service';
import { Patient } from '@core/models';

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
    <div class="quick-pills-container" *ngIf="currentQuestions.length > 0">
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

  /**
   * Creates an instance of QuickPillsComponent
   * 
   * @param quickQuestionsService - Service for managing contextual questions
   */
  constructor(private quickQuestionsService: QuickQuestionsService) {}

  /**
   * Component initialization lifecycle method
   * 
   * @description Sets up question subscription and starts rotation progress tracking
   */
  ngOnInit(): void {
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
   * @description Reloads contextual questions when patient input changes
   */
  ngOnChanges(): void {
    if (this.patient) {
      this.loadContextualQuestions();
    }
  }

  private subscribeToQuestions(): void {
    this.quickQuestionsService.getCurrentQuestions()
      .pipe(takeUntil(this.destroy$))
      .subscribe(questions => {
        this.currentQuestions = questions;
        this.resetRotationProgress();
      });
  }

  private loadContextualQuestions(): void {
    if (!this.patient) return;

    this.quickQuestionsService.startRotation(this.patient);
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