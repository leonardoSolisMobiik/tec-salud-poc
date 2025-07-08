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
    /* 🎯 PREMIUM CHAT INPUT CON TOKENS BAMBOO */
    .chat-input-container {
      background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.95) 0%, 
        rgba(255, 255, 255, 0.9) 100%
      );
      border-top: 2px solid rgba(var(--general_contrasts-container-outline), 0.2);
      padding: var(--bmb-spacing-m);
      backdrop-filter: blur(10px);
      position: relative;
      
      /* Efecto glass superior */
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, 
          transparent 0%, 
          rgba(var(--color-blue-tec), 0.3) 50%, 
          transparent 100%
        );
      }
    }
    
    /* 🎨 CONTEXT WARNING PREMIUM */
    .context-warning {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-s);
      padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
      background: linear-gradient(135deg, 
        rgba(255, 243, 205, 0.9) 0%, 
        rgba(255, 243, 205, 0.8) 100%
      );
      border: 1px solid rgba(255, 234, 167, 0.5);
      border-radius: var(--bmb-radius-m);
      color: #856404;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: var(--bmb-spacing-m);
      backdrop-filter: blur(5px);
      box-shadow: 0 2px 8px rgba(255, 152, 0, 0.1);
      
      .warning-icon {
        font-size: 1.2rem;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
      }
    }
    
    /* 🎯 INPUT SECTION PREMIUM */
    .input-section {
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      
      &.disabled {
        opacity: 0.6;
        pointer-events: none;
        transform: scale(0.98);
      }
    }
    
    /* 🎨 INPUT WRAPPER PREMIUM */
    .input-wrapper {
      display: flex;
      background: linear-gradient(135deg, 
        rgba(255, 255, 255, 0.95) 0%, 
        rgba(255, 255, 255, 0.9) 100%
      );
      border: 2px solid rgba(var(--general_contrasts-container-outline), 0.2);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-s);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, 
          transparent 0%, 
          rgba(var(--color-blue-tec), 0.3) 50%, 
          transparent 100%
        );
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      &:focus-within {
        border-color: rgba(var(--color-blue-tec), 0.4);
        box-shadow: 
          0 0 0 3px rgba(var(--color-blue-tec), 0.1),
          0 4px 12px rgba(var(--color-blue-tec), 0.15);
        transform: translateY(-2px);
        
        &::before {
          opacity: 1;
        }
      }
    }
    
    /* 🎯 MESSAGE INPUT PREMIUM */
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
      font-weight: 500;
      color: rgb(var(--general_contrasts-text-primary));
      padding: var(--bmb-spacing-xs);
      
      &::placeholder {
        color: rgb(var(--general_contrasts-text-secondary));
        font-weight: 400;
      }
      
      &:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }
    }
    
    /* 🎨 INPUT ACTIONS PREMIUM */
    .input-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: var(--bmb-spacing-s);
      margin-left: var(--bmb-spacing-s);
    }
    
    .char-count {
      font-size: 0.75rem;
      color: rgb(var(--general_contrasts-text-secondary));
      font-weight: 500;
      
      &.near-limit {
        color: #f44336;
        font-weight: 600;
        animation: pulse-warning 2s infinite;
      }
    }
    
    @keyframes pulse-warning {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    /* 🎯 SEND BUTTON PREMIUM */
    .send-button {
      background: linear-gradient(135deg, 
        rgb(var(--color-blue-tec)) 0%, 
        rgb(var(--color-blue-tec)) 100%
      );
      color: white;
      border: none;
      border-radius: var(--bmb-radius-full);
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 1.1rem;
      box-shadow: 0 2px 8px rgba(var(--color-blue-tec), 0.3);
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: var(--bmb-radius-full);
        background: linear-gradient(135deg, 
          rgba(255, 255, 255, 0.2) 0%, 
          rgba(255, 255, 255, 0.1) 100%
        );
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      &:hover:not(:disabled) {
        background: linear-gradient(135deg, 
          rgba(var(--color-blue-tec), 0.9) 0%, 
          rgba(var(--color-blue-tec), 0.8) 100%
        );
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 4px 12px rgba(var(--color-blue-tec), 0.4);
        
        &::before {
          opacity: 1;
        }
      }
      
      &:disabled {
        background: rgba(var(--general_contrasts-container-outline), 0.5);
        cursor: not-allowed;
        transform: none;
        box-shadow: none;
        
        &::before {
          opacity: 0;
        }
      }
      
      .loading-spinner {
        animation: spin 1s linear infinite;
        font-size: 1rem;
      }
    }
    
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    /* 🎨 QUICK ACTIONS PREMIUM */
    .quick-actions {
      display: flex;
      gap: var(--bmb-spacing-s);
      margin-top: var(--bmb-spacing-m);
      flex-wrap: wrap;
      justify-content: center;
    }
    
    .quick-action-btn {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-s);
      padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
      background: linear-gradient(135deg, 
        rgba(var(--general_contrasts-surface), 0.9) 0%, 
        rgba(var(--general_contrasts-surface), 0.8) 100%
      );
      border: 1px solid rgba(var(--general_contrasts-container-outline), 0.2);
      border-radius: var(--bmb-radius-full);
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(5px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: var(--bmb-radius-full);
        background: linear-gradient(135deg, 
          rgba(var(--color-blue-tec), 0.1) 0%, 
          rgba(var(--color-blue-tec), 0.05) 100%
        );
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      
      &:hover:not(:disabled) {
        background: linear-gradient(135deg, 
          rgba(var(--color-blue-tec), 0.1) 0%, 
          rgba(var(--color-blue-tec), 0.05) 100%
        );
        border-color: rgba(var(--color-blue-tec), 0.3);
        color: rgb(var(--color-blue-tec));
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(var(--color-blue-tec), 0.15);
        
        &::before {
          opacity: 1;
        }
      }
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
        
        &::before {
          opacity: 0;
        }
      }
      
      .action-icon {
        font-size: 1.1rem;
        filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
      }
      
      .action-text {
        white-space: nowrap;
        position: relative;
        z-index: 1;
      }
    }
    
    /* 🎨 MOBILE RESPONSIVE PREMIUM */
    @media (max-width: 768px) {
      .chat-input-container {
        padding: var(--bmb-spacing-s);
      }
      
      .input-wrapper {
        padding: var(--bmb-spacing-xs);
      }
      
      .send-button {
        width: 40px;
        height: 40px;
        font-size: 1rem;
      }
      
      .quick-actions {
        justify-content: center;
        gap: var(--bmb-spacing-xs);
      }
      
      .quick-action-btn {
        font-size: 0.8rem;
        padding: var(--bmb-spacing-xs) var(--bmb-spacing-s);
        
        .action-icon {
          font-size: 1rem;
        }
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
}
} 