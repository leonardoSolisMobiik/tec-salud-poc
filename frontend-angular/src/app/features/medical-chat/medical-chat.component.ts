import { Component, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatMessage, ChatRequest } from '@core/models';
import { MedicalStateService, StreamingService } from '@core/services';

// Import available Bamboo Components
// (Currently none used in this component)

@Component({
  selector: 'app-medical-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  encapsulation: ViewEncapsulation.None,
  template: `
    <div class="chat-container-main">
      <!-- Header -->
      <div class="chat-header-main">
        <div class="patient-info-main" *ngIf="activePatient">
          <div class="patient-avatar-main">{{ activePatient.name.charAt(0) }}</div>
          <div class="patient-details-main">
            <h3>{{ activePatient.name }}</h3>
            <p>ID: {{ activePatient.id }}</p>
          </div>
        </div>
        <div class="no-patient-main" *ngIf="!activePatient">
          Selecciona un paciente para comenzar
        </div>
      </div>

      <!-- Messages -->
      <div class="chat-main-area" #messagesContainer>
        <div class="welcome-section-main" *ngIf="!activePatient">
          <h2>Asistente Médico IA</h2>
          <p>Selecciona un paciente para comenzar</p>
        </div>

        <div class="messages-container-main" *ngIf="activePatient">
          <div 
            *ngFor="let message of chatMessages; trackBy: trackMessage"
            class="message-item-main"
            [class.user-message-main]="message.role === 'user'"
            [class.assistant-message-main]="message.role === 'assistant'"
          >
            <div class="bubble-main"
                 [class.user-bubble-main]="message.role === 'user'"
                 [class.assistant-bubble-main]="message.role === 'assistant'">
              <div class="bubble-content-main" [innerHTML]="formatMessageContent(message.content)"></div>
              <div class="bubble-time-main">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>
              
          <div class="message-item-main assistant-message-main" *ngIf="isStreaming">
            <div class="bubble-main assistant-bubble-main streaming-bubble-main">
              <div class="bubble-content-main" [innerHTML]="formatMessageContent(streamingMessage)"></div>
              <div class="bubble-time-main">Escribiendo...</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input -->
      <div class="chat-footer-main" *ngIf="activePatient">
        <div class="input-container-main">
          <textarea
            [(ngModel)]="currentMessage"
            (keydown.enter)="onEnterPressed($event)"
            placeholder="Escribe tu mensaje..."
            class="message-input-main"
            [disabled]="isStreaming"
          ></textarea>
          <button
            (click)="sendMessage()"
            [disabled]="!canSendMessage"
            class="send-button-main"
          >
            Enviar
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* RESET TOTAL */
    .chat-container-main {
      all: initial !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
      display: flex !important;
      flex-direction: column !important;
      height: 100vh !important;
      background: #f5f7fa !important;
      position: relative !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    .chat-container-main * {
      box-sizing: border-box !important;
    }

    /* HEADER */
    .chat-header-main {
      padding: 20px !important;
      background: white !important;
      border-bottom: 1px solid #e0e0e0 !important;
      flex-shrink: 0 !important;
    }

    .patient-info-main {
      display: flex !important;
      align-items: center !important;
      gap: 15px !important;
    }

    .patient-avatar-main {
      width: 50px !important;
      height: 50px !important;
      border-radius: 50% !important;
      background: #2196F3 !important;
      color: white !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 1.2rem !important;
      font-weight: bold !important;
    }

    .patient-details-main h3 {
      margin: 0 !important;
      color: #333 !important;
      font-size: 1.1rem !important;
      font-weight: 600 !important;
    }

    .patient-details-main p {
      margin: 5px 0 0 0 !important;
      color: #666 !important;
      font-size: 0.9rem !important;
    }

    .no-patient-main {
      text-align: center !important;
      color: #666 !important;
      font-size: 1.1rem !important;
    }

    /* CHAT AREA */
    .chat-main-area {
      flex: 1 !important;
      overflow-y: auto !important;
      padding: 20px !important;
      background: #f5f7fa !important;
    }

    .welcome-section-main {
      display: flex !important;
      flex-direction: column !important;
      align-items: center !important;
      justify-content: center !important;
      height: 100% !important;
      text-align: center !important;
    }

    .welcome-section-main h2 {
      color: #333 !important;
      margin: 0 0 10px 0 !important;
      font-size: 1.5rem !important;
    }

    .welcome-section-main p {
      color: #666 !important;
      margin: 0 !important;
    }

    /* MESSAGES */
    .messages-container-main {
      max-width: 800px !important;
      margin: 0 auto !important;
    }

    .message-item-main {
      margin-bottom: 15px !important;
      display: flex !important;
      width: 100% !important;
      clear: both !important;
    }

    .user-message-main {
      justify-content: flex-end !important;
    }

    .assistant-message-main {
      justify-content: flex-start !important;
    }

    /* BUBBLES - FORZAR VISIBILIDAD */
    .bubble-main {
      max-width: 70% !important;
      min-width: 100px !important;
      padding: 12px 16px !important;
      border-radius: 18px !important;
      word-wrap: break-word !important;
      display: block !important;
      position: relative !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
      opacity: 1 !important;
      visibility: visible !important;
      z-index: 100 !important;
    }

    .user-bubble-main {
      background: #2196F3 !important;
      color: white !important;
      border: 1px solid #1976D2 !important;
      margin-left: auto !important;
    }

    .assistant-bubble-main {
      background: white !important;
      color: #333 !important;
      border: 1px solid #e0e0e0 !important;
      margin-right: auto !important;
    }

    .streaming-bubble-main {
      border-color: #4CAF50 !important;
      animation: pulse-animation 1.5s infinite !important;
    }

    @keyframes pulse-animation {
      0%, 100% { 
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
      }
      50% { 
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3) !important;
      }
    }

    .bubble-content-main {
      line-height: 1.4 !important;
      word-wrap: break-word !important;
      margin: 0 !important;
      font-size: 0.95rem !important;
    }

    .bubble-time-main {
      font-size: 0.75rem !important;
      opacity: 0.7 !important;
      margin-top: 5px !important;
      text-align: right !important;
    }

    .user-bubble-main .bubble-time-main {
      color: rgba(255, 255, 255, 0.8) !important;
    }

    .assistant-bubble-main .bubble-time-main {
      color: #666 !important;
    }

    /* FOOTER */
    .chat-footer-main {
      padding: 20px !important;
      background: white !important;
      border-top: 1px solid #e0e0e0 !important;
      flex-shrink: 0 !important;
    }

    .input-container-main {
      max-width: 800px !important;
      margin: 0 auto !important;
      display: flex !important;
      gap: 10px !important;
      align-items: flex-end !important;
    }

    .message-input-main {
      flex: 1 !important;
      border: 1px solid #e0e0e0 !important;
      border-radius: 10px !important;
      padding: 12px !important;
      font-size: 1rem !important;
      resize: none !important;
      min-height: 20px !important;
      max-height: 120px !important;
      background: white !important;
      color: #333 !important;
      outline: none !important;
    }

    .message-input-main:focus {
      border-color: #2196F3 !important;
      box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1) !important;
    }

    .send-button-main {
      background: #2196F3 !important;
      color: white !important;
      border: none !important;
      border-radius: 10px !important;
      padding: 12px 20px !important;
      font-size: 0.9rem !important;
      cursor: pointer !important;
      transition: all 0.3s ease !important;
    }

    .send-button-main:hover:not(:disabled) {
      background: #1976D2 !important;
    }

    .send-button-main:disabled {
      background: #ccc !important;
      cursor: not-allowed !important;
    }

    /* RESPONSIVE */
    @media (max-width: 768px) {
      .bubble-main {
        max-width: 90% !important;
      }
      
      .chat-header-main,
      .chat-main-area,
      .chat-footer-main {
        padding: 15px !important;
      }
    }

    /* OVERRIDE GLOBAL STYLES */
    .chat-container-main .send-btn-premium,
    .chat-container-main .premium-card,
    .chat-container-main .banner,
    .chat-container-main .notification {
      display: none !important;
    }
  `]
})
export class MedicalChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;
  
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  // Component state
  currentMessage = '';
  chatMessages: ChatMessage[] = [];
  isStreaming = false;
  streamingMessage = '';
  activePatient: any = null;
  recentPatients: any[] = [];

  quickActions = [
    { label: 'Síntomas', text: 'El paciente presenta los siguientes síntomas: ' },
    { label: 'Diagnóstico', text: 'Necesito ayuda con el diagnóstico diferencial para: ' },
    { label: 'Tratamiento', text: 'Recomienda opciones de tratamiento para: ' },
    { label: 'Exámenes', text: 'Qué exámenes clínicos recomiendas para evaluar: ' },
    { label: 'Urgencia', text: 'Evalúa la urgencia de este caso: ' },
    { label: 'Historial', text: 'Considerando el historial médico del paciente: ' }
  ];

  constructor(
    private medicalStateService: MedicalStateService,
    private streamingService: StreamingService
  ) {}

  ngOnInit(): void {
    console.log('🩺 ============================================');
    console.log('🩺 MedicalChatComponent ngOnInit INICIADO');
    console.log('🩺 Timestamp:', new Date().toISOString());
    console.log('🩺 URL actual:', window.location.pathname);
    console.log('🩺 ============================================');
    
    // Subscribe to active patient changes
    console.log('🩺 PASO 1: Suscribiéndose a activePatient$...');
    this.medicalStateService.activePatient$
      .pipe(takeUntil(this.destroy$))
      .subscribe((patient: any) => {
        console.log('💊 ============================================');
        console.log('💊 CHAT: Active patient subscription triggered');
        console.log('💊 Paciente recibido:', patient ? patient.name : 'NINGUNO');
        console.log('💊 ID del paciente:', patient ? patient.id : 'N/A');
        console.log('💊 Timestamp:', new Date().toISOString());
        console.log('💊 ============================================');
        
        this.activePatient = patient;
        
        if (patient) {
          console.log('✅ CHAT HABILITADO: Chat enabled for patient:', patient.name);
          console.log('✅ this.activePatient actualizado a:', this.activePatient.name);
        } else {
          console.log('⚠️ CHAT DESHABILITADO: No hay paciente activo');
          console.log('⚠️ this.activePatient actualizado a: null');
        }
      });

    // Subscribe to recent patients count
    console.log('🩺 PASO 2: Suscribiéndose a recentPatients$...');
    this.medicalStateService.recentPatients$
      .pipe(takeUntil(this.destroy$))
      .subscribe(patients => {
        console.log('👥 Pacientes recientes actualizados:', patients.length);
        this.recentPatients = patients;
      });

    // Subscribe to chat messages
    console.log('🩺 PASO 3: Suscribiéndose a currentChatMessages$...');
    this.medicalStateService.currentChatMessages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        console.log('💬 Chat messages actualizados:', messages.length);
        this.chatMessages = messages;
        this.shouldScrollToBottom = true;
      });

    // Subscribe to streaming state
    console.log('🩺 PASO 4: Suscribiéndose a isStreaming$...');
    this.medicalStateService.isStreaming$
      .pipe(takeUntil(this.destroy$))
      .subscribe(isStreaming => {
        console.log('🔄 Streaming state changed:', isStreaming);
        this.isStreaming = isStreaming;
        this.shouldScrollToBottom = true;
      });

    // Subscribe to streaming message
    console.log('🩺 PASO 5: Suscribiéndose a streamingMessage$...');
    this.medicalStateService.streamingMessage$
      .pipe(takeUntil(this.destroy$))
      .subscribe(message => {
        console.log('📝 Streaming message updated:', message.length > 0 ? 'Has content' : 'Empty');
        this.streamingMessage = message;
      });
      
    console.log('🩺 ============================================');
    console.log('🩺 MedicalChatComponent ngOnInit COMPLETADO');
    console.log('🩺 Estado inicial:');
    console.log('🩺 - activePatient:', this.activePatient?.name || 'null');
    console.log('🩺 - recentPatients:', this.recentPatients.length);
    console.log('🩺 - chatMessages:', this.chatMessages.length);
    console.log('🩺 ============================================');
    
    // ✅ Initialization complete
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }



  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get canSendMessage(): boolean {
    return this.currentMessage.trim().length > 0 && 
           !this.isStreaming && 
           this.activePatient &&
           this.currentMessage.length <= 2000;
  }

  onEnterPressed(event: any): void {
    if (event.shiftKey) {
      return; // Allow new line with Shift+Enter
    }
    
    event.preventDefault();
    if (this.canSendMessage) {
      this.sendMessage();
    }
  }

  onInputChange(event: any): void {
    // Auto-resize textarea
    const textarea = event.target as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }

  useQuickAction(action: any): void {
    if (this.activePatient) {
      this.currentMessage = `${action.text}${this.activePatient.name} - `;
    }
  }

  sendMessage(): void {
    if (!this.canSendMessage) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: this.currentMessage.trim(),
      timestamp: new Date()
    };

    this.medicalStateService.addMessage(userMessage);
    const messageContent = this.currentMessage.trim();
    this.currentMessage = '';

    // Start streaming response
    this.medicalStateService.startStreaming();
    
    // Create chat request with patient context
    const chatRequest: ChatRequest = {
      messages: [
        ...this.chatMessages,
        userMessage
      ],
      patient_id: this.activePatient?.id?.toString(),
      include_context: true,
      stream: true
    };

    console.log('🩺 Sending medical chat request:', {
      patient_id: chatRequest.patient_id,
      message_count: chatRequest.messages.length,
      last_message: messageContent
    });

    // Stream response from backend
    this.streamingService.streamMedicalChat(chatRequest).subscribe({
      next: (chunk) => {
        if (chunk.type === 'content' && chunk.content) {
          // Accumulate streaming content
          const currentStream = this.streamingMessage + chunk.content;
          this.medicalStateService.updateStreamingMessage(currentStream);
        }
        
        if (chunk.type === 'done') {
          // Add the complete response as a message
          const aiResponse: ChatMessage = {
            role: 'assistant',
            content: this.streamingMessage,
            timestamp: new Date()
          };
          
          this.medicalStateService.addMessage(aiResponse);
          this.medicalStateService.finishStreaming();
          
          console.log('✅ Medical chat response completed');
        }
        
        if (chunk.type === 'error') {
          console.error('❌ Stream error:', chunk.error);
          
          // Add error message
          const errorResponse: ChatMessage = {
            role: 'assistant',
            content: `❌ Error: ${chunk.error || 'Ocurrió un error al procesar tu consulta.'}`,
            timestamp: new Date()
          };
          
          this.medicalStateService.addMessage(errorResponse);
          this.medicalStateService.finishStreaming();
        }
      },
      error: (error) => {
        console.error('❌ Medical chat error:', error);
        
        // Add error message
        const errorResponse: ChatMessage = {
          role: 'assistant',
          content: '❌ Lo siento, ocurrió un error al procesar tu consulta. Por favor intenta nuevamente.',
          timestamp: new Date()
        };
        
        this.medicalStateService.addMessage(errorResponse);
        this.medicalStateService.finishStreaming();
      }
    });
  }

  clearChat(): void {
    if (this.activePatient) {
      this.medicalStateService.clearChatHistory(this.activePatient.id);
    }
  }

  // Message interaction methods
  copyMessage(content: string): void {
    navigator.clipboard.writeText(content);
    console.log('📋 Mensaje copiado al portapapeles');
  }

  likeMessage(message: ChatMessage): void {
    console.log('👍 Mensaje valorado positivamente:', message);
  }

  repeatMessage(message: ChatMessage): void {
    if (this.chatMessages.length > 0) {
      const lastUserMessage = [...this.chatMessages]
        .reverse()
        .find(msg => msg.role === 'user');
      
      if (lastUserMessage) {
        this.currentMessage = lastUserMessage.content;
      }
    }
  }

  // Utility methods
  trackMessage(index: number, message: ChatMessage): any {
    return message.timestamp || index;
  }

  formatTime(timestamp: Date | undefined): string {
    if (!timestamp) return '';
    return timestamp.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  formatMessageContent(content: string): string {
    if (!content) return '';
    
    // Enhanced markdown formatting for medical content
    return content
      // Headers (##)
      .replace(/^## (.*$)/gm, '<h4 style="margin: 15px 0 8px 0; color: #1976D2; font-weight: 600;">$1</h4>')
      
      // Bold text (**text**)
      .replace(/\*\*(.*?)\*\*/g, '<strong style="color: #333; font-weight: 600;">$1</strong>')
      
      // Italic text (*text*)
      .replace(/\*(.*?)\*/g, '<em style="color: #555;">$1</em>')
      
      // Lists starting with "- " or "• "
      .replace(/^[\s]*[-•]\s+(.+)$/gm, '<div style="margin: 4px 0; padding-left: 20px; position: relative;"><span style="position: absolute; left: 0; color: #2196F3; font-weight: bold;">•</span> $1</div>')
      
      // Medical values with units (e.g., "12,500 (rango normal: 4,000-10,000)")
      .replace(/(\d+[,.]?\d*)\s*(\([^)]+\))/g, '<span style="font-weight: 600; color: #1976D2;">$1</span> <span style="color: #666; font-size: 0.9em;">$2</span>')
      
      // Medical sections (text followed by colon)
      .replace(/^([A-Za-záéíóúÁÉÍÓÚ\s]+):$/gm, '<div style="margin: 12px 0 6px 0; font-weight: 600; color: #1976D2; border-bottom: 1px solid #E3F2FD; padding-bottom: 2px;">$1:</div>')
      
      // Convert line breaks to HTML breaks
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>')
      
      // Clean up multiple breaks
      .replace(/(<br>\s*){3,}/g, '<br><br>');
  }

  private scrollToBottom(): void {
    try {
      this.messagesContainer.nativeElement.scrollTop = 
        this.messagesContainer.nativeElement.scrollHeight;
    } catch (err) {
      console.error('Could not scroll to bottom:', err);
    }
  }
}