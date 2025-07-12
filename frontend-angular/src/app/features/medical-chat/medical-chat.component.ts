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
  encapsulation: ViewEncapsulation.None, // Permite que nuestros estilos sobrescriban los globales
  template: `
    <!-- Main chat container with unique class -->
    <div class="tecsalud-medical-chat-container">
      <!-- Header -->
      <div class="tecsalud-chat-header">
        <div class="tecsalud-patient-info" *ngIf="activePatient">
          <div class="tecsalud-patient-avatar">
            {{ activePatient.name.charAt(0) }}
          </div>
          <div class="tecsalud-patient-details">
            <h3>{{ activePatient.name }}</h3>
            <p>ID: {{ activePatient.id }}</p>
          </div>
        </div>
        <div class="tecsalud-no-patient" *ngIf="!activePatient">
          Selecciona un paciente para comenzar
        </div>
      </div>

      <!-- Messages area -->
      <div class="tecsalud-chat-main" #messagesContainer>
        <div class="tecsalud-welcome-section" *ngIf="!activePatient">
          <div class="tecsalud-hero-content">
            <h2>Asistente Médico IA</h2>
            <p>Selecciona un paciente para comenzar la consulta</p>
          </div>
        </div>

        <!-- Messages -->
        <div class="tecsalud-messages-list" *ngIf="activePatient">
          <div 
            *ngFor="let message of chatMessages; trackBy: trackMessage"
            class="tecsalud-message-wrapper"
            [class.tecsalud-user-message-wrapper]="message.role === 'user'"
            [class.tecsalud-assistant-message-wrapper]="message.role === 'assistant'"
          >
            <div class="tecsalud-message-bubble"
                 [class.tecsalud-user-bubble]="message.role === 'user'"
                 [class.tecsalud-assistant-bubble]="message.role === 'assistant'">
              <div class="tecsalud-message-text" [innerHTML]="formatMessageContent(message.content)"></div>
              <div class="tecsalud-message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>
              
          <!-- Streaming message -->
          <div class="tecsalud-message-wrapper tecsalud-assistant-message-wrapper" *ngIf="isStreaming">
            <div class="tecsalud-message-bubble tecsalud-assistant-bubble tecsalud-streaming">
              <div class="tecsalud-message-text" [innerHTML]="formatMessageContent(streamingMessage)"></div>
              <div class="tecsalud-message-time">Escribiendo...</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="tecsalud-chat-footer" *ngIf="activePatient">
        <div class="tecsalud-input-section">
          <div class="tecsalud-input-container">
            <textarea
              [(ngModel)]="currentMessage"
              (keydown.enter)="onEnterPressed($event)"
              (input)="onInputChange($event)"
              placeholder="Describe los síntomas o haz una pregunta médica..."
              class="tecsalud-message-input"
              rows="3"
              [disabled]="isStreaming"
            ></textarea>
            <div class="tecsalud-input-footer">
              <div class="tecsalud-char-count">
                {{ currentMessage.length }}/1000
              </div>
              <button
                (click)="sendMessage()"
                [disabled]="!canSendMessage"
                class="tecsalud-send-button"
              >
                Enviar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* RESET COMPLETO PARA EL CONTENEDOR PRINCIPAL */
    .tecsalud-medical-chat-container {
      all: initial !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
      display: flex !important;
      flex-direction: column !important;
      height: 100vh !important;
      max-height: 100vh !important;
      background: #f5f7fa !important;
      position: relative !important;
      overflow: hidden !important;
      box-sizing: border-box !important;
    }

    /* RESET PARA TODOS LOS ELEMENTOS DENTRO */
    .tecsalud-medical-chat-container * {
      box-sizing: border-box !important;
    }

    /* HEADER */
    .tecsalud-chat-header {
      flex-shrink: 0 !important;
      padding: 20px !important;
      background: white !important;
      border-bottom: 1px solid #e0e0e0 !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
      z-index: 10 !important;
    }

    .tecsalud-patient-info {
      display: flex !important;
      align-items: center !important;
      gap: 15px !important;
    }

    .tecsalud-patient-avatar {
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
      flex-shrink: 0 !important;
    }

    .tecsalud-patient-details h3 {
      margin: 0 !important;
      color: #333 !important;
      font-size: 1.1rem !important;
      font-weight: 600 !important;
    }

    .tecsalud-patient-details p {
      margin: 5px 0 0 0 !important;
      color: #666 !important;
      font-size: 0.9rem !important;
    }

    .tecsalud-no-patient {
      text-align: center !important;
      color: #666 !important;
      font-size: 1.1rem !important;
    }

    /* MAIN CHAT AREA */
    .tecsalud-chat-main {
      flex: 1 !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      padding: 20px !important;
      background: #f5f7fa !important;
      position: relative !important;
    }

    .tecsalud-welcome-section {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: 100% !important;
    }

    .tecsalud-hero-content {
      text-align: center !important;
      background: white !important;
      padding: 40px !important;
      border-radius: 20px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    }

    .tecsalud-hero-content h2 {
      color: #333 !important;
      margin: 0 0 10px 0 !important;
      font-size: 1.5rem !important;
    }

    .tecsalud-hero-content p {
      color: #666 !important;
      margin: 0 !important;
    }

    /* MENSAJES - ESTRUCTURA ESPECÍFICA */
    .tecsalud-messages-list {
      max-width: 800px !important;
      margin: 0 auto !important;
      padding: 0 !important;
    }

    .tecsalud-message-wrapper {
      margin-bottom: 20px !important;
      display: flex !important;
      align-items: flex-start !important;
      clear: both !important;
      width: 100% !important;
    }

    .tecsalud-user-message-wrapper {
      justify-content: flex-end !important;
      flex-direction: row !important;
    }

    .tecsalud-assistant-message-wrapper {
      justify-content: flex-start !important;
      flex-direction: row !important;
    }

    /* CHAT BUBBLES - MUY ESPECÍFICOS */
    .tecsalud-message-bubble {
      max-width: 70% !important;
      min-width: 100px !important;
      padding: 12px 16px !important;
      border-radius: 18px !important;
      word-wrap: break-word !important;
      overflow-wrap: break-word !important;
      position: relative !important;
      display: block !important;
      clear: both !important;
    }

    .tecsalud-user-bubble {
      background: #2196F3 !important;
      color: white !important;
      border: 2px solid #1976D2 !important;
      margin-left: auto !important;
      margin-right: 0 !important;
    }

    .tecsalud-assistant-bubble {
      background: white !important;
      color: #333 !important;
      border: 2px solid #e0e0e0 !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
      margin-left: 0 !important;
      margin-right: auto !important;
    }

    .tecsalud-streaming {
      border-color: #4CAF50 !important;
      animation: tecsalud-pulse 1.5s infinite !important;
    }

    @keyframes tecsalud-pulse {
      0%, 100% { 
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
      }
      50% { 
        box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3) !important;
      }
    }

    .tecsalud-message-text {
      line-height: 1.5 !important;
      word-wrap: break-word !important;
      margin: 0 !important;
      font-size: 0.95rem !important;
    }

    .tecsalud-message-time {
      font-size: 0.75rem !important;
      opacity: 0.7 !important;
      margin-top: 8px !important;
      text-align: right !important;
    }

    .tecsalud-user-bubble .tecsalud-message-time {
      color: rgba(255, 255, 255, 0.8) !important;
    }

    .tecsalud-assistant-bubble .tecsalud-message-time {
      color: #666 !important;
    }

    /* FOOTER */
    .tecsalud-chat-footer {
      flex-shrink: 0 !important;
      padding: 20px !important;
      background: white !important;
      border-top: 1px solid #e0e0e0 !important;
      z-index: 10 !important;
    }

    .tecsalud-input-section {
      max-width: 800px !important;
      margin: 0 auto !important;
    }

    .tecsalud-input-container {
      border: 2px solid #e0e0e0 !important;
      border-radius: 15px !important;
      background: white !important;
      transition: all 0.3s ease !important;
      overflow: hidden !important;
    }

    .tecsalud-input-container:focus-within {
      border-color: #2196F3 !important;
      box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1) !important;
    }

    .tecsalud-message-input {
      width: 100% !important;
      border: none !important;
      outline: none !important;
      padding: 15px !important;
      font-size: 1rem !important;
      resize: none !important;
      background: transparent !important;
      font-family: inherit !important;
      color: #333 !important;
      line-height: 1.4 !important;
    }

    .tecsalud-message-input::placeholder {
      color: #999 !important;
    }

    .tecsalud-input-footer {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      padding: 10px 15px !important;
      border-top: 1px solid #f0f0f0 !important;
      background: #fafafa !important;
    }

    .tecsalud-char-count {
      color: #666 !important;
      font-size: 0.8rem !important;
    }

    .tecsalud-send-button {
      background: #2196F3 !important;
      color: white !important;
      border: none !important;
      border-radius: 8px !important;
      padding: 10px 20px !important;
      font-size: 0.9rem !important;
      font-weight: 500 !important;
      cursor: pointer !important;
      transition: all 0.3s ease !important;
      min-width: 80px !important;
    }

    .tecsalud-send-button:hover:not(:disabled) {
      background: #1976D2 !important;
      transform: translateY(-1px) !important;
      box-shadow: 0 4px 8px rgba(33, 150, 243, 0.3) !important;
    }

    .tecsalud-send-button:disabled {
      background: #ccc !important;
      cursor: not-allowed !important;
      transform: none !important;
      box-shadow: none !important;
    }

    /* RESPONSIVE */
    @media (max-width: 768px) {
      .tecsalud-message-bubble {
        max-width: 85% !important;
      }
      
      .tecsalud-chat-header {
        padding: 15px !important;
      }
      
      .tecsalud-chat-main {
        padding: 15px !important;
      }
      
      .tecsalud-chat-footer {
        padding: 15px !important;
      }
    }

    /* OVERRIDE PARA ESTILOS GLOBALES PROBLEMÁTICOS */
    .tecsalud-medical-chat-container .send-btn-premium {
      all: unset !important;
    }

    .tecsalud-medical-chat-container .premium-card {
      all: unset !important;
    }

    /* ASEGURAR QUE LOS BUBBLES SEAN VISIBLES */
    .tecsalud-message-bubble {
      opacity: 1 !important;
      visibility: visible !important;
      display: block !important;
      z-index: 1 !important;
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