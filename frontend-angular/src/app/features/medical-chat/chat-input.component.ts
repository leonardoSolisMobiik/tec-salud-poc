import { Component, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, Observable } from 'rxjs';
import { Patient } from '@core/models';
import { MedicalStateService } from '@core/services';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="chat-input-container">
      <!-- Patient Context Warning -->
      <div class="context-warning" *ngIf="!(activePatient$ | async)">
        <span class="warning-icon">⚠️</span>
        <span>Selecciona un paciente para comenzar a chatear</span>
      </div>
      
      <!-- Chat Input -->
      <div class="input-section" [class.disabled]="!(activePatient$ | async) || (isStreaming$ | async)">
        <div class="input-wrapper">
          <textarea 
            class="message-input"
            [(ngModel)]="messageText"
            (keydown)="onKeyDown($event)"
                         [disabled]="((!(activePatient$ | async)) || (isStreaming$ | async)) || false"
            placeholder="Escribe tu consulta médica..."
            rows="1"
            maxlength="2000">
          </textarea>
          <div class="input-actions">
            <span class="char-count" [class.near-limit]="messageText.length > 1800">
              {{ messageText.length }}/2000
            </span>
            <button 
              class="send-button"
              [disabled]="!canSend"
              (click)="sendMessage()">
              <span *ngIf="!(isStreaming$ | async)">📤</span>
              <span *ngIf="isStreaming$ | async" class="loading-spinner">⏳</span>
            </button>
          </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="quick-actions" *ngIf="messageText.length === 0 && (activePatient$ | async)">
          <button 
            *ngFor="let action of quickActions" 
            class="quick-action-btn"
            (click)="insertQuickAction(action.text)"
            [disabled]="isStreaming$ | async">
            <span class="action-icon">{{ action.icon }}</span>
            <span class="action-text">{{ action.text }}</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-input-container {
      background: var(--medical-surface);
      border-top: 1px solid var(--medical-divider);
      padding: 1rem;
    }
    
    .context-warning {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1rem;
      background: #fff3cd;
      border: 1px solid #ffeaa7;
      border-radius: 0.5rem;
      color: #856404;
      font-size: 0.875rem;
      margin-bottom: 1rem;
      
      .warning-icon {
        font-size: 1rem;
      }
    }
    
    .input-section {
      transition: opacity 0.2s;
      
      &.disabled {
        opacity: 0.6;
        pointer-events: none;
      }
    }
    
    .input-wrapper {
      display: flex;
      background: var(--medical-background);
      border: 2px solid var(--medical-divider);
      border-radius: 1rem;
      padding: 0.75rem;
      transition: border-color 0.2s;
      
      &:focus-within {
        border-color: var(--medical-blue);
        box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
      }
    }
    
    .message-input {
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      font-size: 0.875rem;
      line-height: 1.5;
      resize: none;
      min-height: 1.5rem;
      max-height: 6rem;
      font-family: inherit;
      
      &::placeholder {
        color: var(--medical-text-secondary);
      }
      
      &:disabled {
        cursor: not-allowed;
      }
    }
    
    .input-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.5rem;
      margin-left: 0.75rem;
    }
    
    .char-count {
      font-size: 0.75rem;
      color: var(--medical-text-secondary);
      
      &.near-limit {
        color: #f44336;
        font-weight: 600;
      }
    }
    
    .send-button {
      background: var(--medical-blue);
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 1.1rem;
      
      &:hover:not(:disabled) {
        background: #1976d2;
        transform: scale(1.05);
      }
      
      &:disabled {
        background: var(--medical-divider);
        cursor: not-allowed;
        transform: none;
      }
      
      .loading-spinner {
        animation: spin 1s linear infinite;
      }
    }
    
    .quick-actions {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
      flex-wrap: wrap;
    }
    
    .quick-action-btn {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: var(--medical-background);
      border: 1px solid var(--medical-divider);
      border-radius: 1.5rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.2s;
      
      &:hover:not(:disabled) {
        background: var(--medical-context-active);
        border-color: var(--medical-blue);
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
      
      .action-icon {
        font-size: 1rem;
      }
      
      .action-text {
        white-space: nowrap;
      }
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    /* Mobile responsive */
    @media (max-width: 768px) {
      .chat-input-container {
        padding: 0.75rem;
      }
      
      .quick-actions {
        justify-content: center;
      }
      
      .quick-action-btn {
        font-size: 0.8rem;
        padding: 0.4rem 0.8rem;
      }
    }
  `]
})
export class ChatInputComponent implements OnDestroy {
  @Output() messageSent = new EventEmitter<string>();
  
  private destroy$ = new Subject<void>();
  
  messageText = '';
  
  // Observables from medical state
  activePatient$!: Observable<Patient | null>;
  isStreaming$!: Observable<boolean>;
  
  quickActions = [
    { icon: '🩺', text: 'Realizar diagnóstico inicial' },
    { icon: '💊', text: 'Revisar medicamentos' },
    { icon: '📋', text: 'Analizar síntomas' },
    { icon: '🏥', text: 'Recomendar especialista' }
  ];
  
  constructor(private medicalState: MedicalStateService) {
    this.activePatient$ = this.medicalState.activePatient$;
    this.isStreaming$ = this.medicalState.isStreaming$;
  }
  
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  get canSend(): boolean {
    return this.messageText.trim().length > 0 && 
           this.messageText.length <= 2000 &&
           this.medicalState.activePatientValue !== null &&
           !this.medicalState.isStreamingValue;
  }
  
  onKeyDown(event: KeyboardEvent): void {
    // Auto-resize textarea
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 96) + 'px';
    
    // Send message with Ctrl/Cmd + Enter
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      this.sendMessage();
    }
  }
  
  sendMessage(): void {
    if (!this.canSend) return;
    
    const message = this.messageText.trim();
    this.messageSent.emit(message);
    this.messageText = '';
    
    // Reset textarea height
    setTimeout(() => {
      const textarea = document.querySelector('.message-input') as HTMLTextAreaElement;
      if (textarea) {
        textarea.style.height = 'auto';
      }
    });
  }
  
  insertQuickAction(actionText: string): void {
    this.messageText = actionText;
    
    // Focus on textarea
    setTimeout(() => {
      const textarea = document.querySelector('.message-input') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
      }
    });
  }
} 