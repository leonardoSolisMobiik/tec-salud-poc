import { Component, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
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
  template: `
    <!-- 🚨 BANNER ULTRA MEGA VISIBLE -->
    <div class="mega-banner" id="bamboo-banner">
      <div class="mega-banner-content">
        <span class="mega-icon">🚨</span>
        <span class="mega-text">¡¡¡ BAMBOO TOKENS FUNCIONANDO !!!</span>
        <span class="mega-icon">🚨</span>
            </div>
          </div>
          
    <!-- 🚨 BANNER SÚPER VISIBLE -->
    <div class="verification-banner">
      <div class="banner-content">
        <span class="banner-icon">🎯</span>
        <span class="banner-text">BAMBOO TOKENS ACTIVADOS</span>
        <span class="banner-icon">✨</span>
            </div>
            </div>

    <!-- Main chat container -->
    <div class="chat-container">
      <!-- Header -->
      <div class="chat-header">
        <div class="patient-info" *ngIf="activePatient">
          <div class="patient-avatar">
            {{ activePatient.name.charAt(0) }}
            </div>
          <div class="patient-details">
            <h3>{{ activePatient.name }}</h3>
            <p>ID: {{ activePatient.id }}</p>
              </div>
              </div>
        <div class="no-patient" *ngIf="!activePatient">
          Selecciona un paciente para comenzar
              </div>
          </div>

      <!-- Messages area -->
      <div class="chat-main" #messagesContainer>
        <div class="welcome-section" *ngIf="!activePatient">
          <div class="hero-content">
            <h2>Asistente Médico IA</h2>
            <p>Selecciona un paciente para comenzar la consulta</p>
              </div>
        </div>

        <!-- Messages -->
        <div class="messages-list" *ngIf="activePatient">
          <div 
            *ngFor="let message of chatMessages; trackBy: trackMessage"
            [class]="'message-item ' + (message.role === 'user' ? 'user-message' : 'assistant-message')"
          >
            <div class="message-content">
              <div class="message-text" [innerHTML]="formatMessageContent(message.content)"></div>
              <div class="message-time">{{ formatTime(message.timestamp) }}</div>
            </div>
          </div>
              
          <!-- Streaming message -->
          <div class="message-item assistant-message" *ngIf="isStreaming">
            <div class="message-content">
              <div class="message-text" [innerHTML]="formatMessageContent(streamingMessage)"></div>
              <div class="message-time">Escribiendo...</div>
            </div>
          </div>
        </div>

      <!-- Footer -->
      <div class="chat-footer" *ngIf="activePatient">
        <div class="input-section">
          <div class="input-container">
            <textarea
              [(ngModel)]="currentMessage"
              (keydown.enter)="onEnterPressed($event)"
              (input)="onInputChange($event)"
              placeholder="Describe los síntomas o haz una pregunta médica..."
              class="message-input"
              rows="3"
              [disabled]="isStreaming"
            ></textarea>
            <div class="input-footer">
              <div class="char-count">
                {{ currentMessage.length }}/1000
              </div>
              <button
                (click)="sendMessage()"
                [disabled]="!canSendMessage"
                class="send-btn-premium"
              >
                <span class="premium-text">ENVIAR</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* 🚨 MEGA BANNER ULTRA VISIBLE */
    .mega-banner {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      width: 100vw !important;
      height: 40px !important;
      background: linear-gradient(90deg, #2196F3, #1976D2, #2196F3) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 999999 !important;
      border-bottom: 2px solid #1976D2 !important;
    }

    .mega-banner-content {
      display: flex !important;
      align-items: center !important;
      gap: 15px !important;
      color: white !important;
      font-weight: 600 !important;
      font-size: 0.9rem !important;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5) !important;
      letter-spacing: 1px !important;
    }

    .mega-icon {
      font-size: 1rem !important;
    }

    .mega-text {
      font-size: 0.9rem !important;
    }

    /* 🚨 BANNER SÚPER VISIBLE */
    .verification-banner {
      position: fixed !important;
      top: 40px !important;
      left: 0 !important;
      right: 0 !important;
      height: 30px !important;
      background: linear-gradient(90deg, #4CAF50, #45a049, #4CAF50) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 99999 !important;
    }

    .banner-content {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      color: white !important;
      font-weight: 600 !important;
      font-size: 0.8rem !important;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3) !important;
    }

    .banner-icon {
      font-size: 1rem !important;
    }

    .banner-text {
      letter-spacing: 1px !important;
    }

    /* CONTENEDOR PRINCIPAL */
    .chat-container {
      display: flex !important;
      flex-direction: column !important;
      height: 100vh !important;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%) !important;
      margin-top: 70px !important;
    }

    /* HEADER */
    .chat-header {
      padding: 20px !important;
      background: white !important;
      border-bottom: 1px solid #e0e0e0 !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
    }

    .patient-info {
      display: flex !important;
      align-items: center !important;
      gap: 15px !important;
    }

    .patient-avatar {
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

    .patient-details h3 {
      margin: 0 !important;
      color: #333 !important;
    }

    .patient-details p {
      margin: 5px 0 0 0 !important;
      color: #666 !important;
      font-size: 0.9rem !important;
    }

    /* ÁREA DE MENSAJES */
    .chat-main {
      flex: 1 !important;
      overflow-y: auto !important;
      padding: 20px !important;
    }

    .welcome-section {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: 100% !important;
    }

    .hero-content {
      text-align: center !important;
      background: white !important;
      padding: 40px !important;
      border-radius: 20px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1) !important;
    }

    .hero-content h2 {
      color: #333 !important;
      margin-bottom: 10px !important;
    }

    .hero-content p {
      color: #666 !important;
    }

    /* MENSAJES */
    .messages-list {
      max-width: 800px !important;
      margin: 0 auto !important;
    }

    .message-item {
      margin-bottom: 20px !important;
    }

    .user-message {
      display: flex !important;
      justify-content: flex-end !important;
    }

    .assistant-message {
      display: flex !important;
      justify-content: flex-start !important;
    }

    .message-content {
      max-width: 70% !important;
      padding: 15px 20px !important;
      border-radius: 20px !important;
      background: white !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
    }

    .user-message .message-content {
      background: #2196F3 !important;
      color: white !important;
    }

    .message-text {
      line-height: 1.5 !important;
    }

    .message-time {
      font-size: 0.75rem !important;
      opacity: 0.7 !important;
      margin-top: 5px !important;
    }

    /* FOOTER */
    .chat-footer {
      padding: 20px !important;
      background: white !important;
      border-top: 1px solid #e0e0e0 !important;
    }

    .input-section {
      max-width: 800px !important;
      margin: 0 auto !important;
    }

    .input-container {
      border: 2px solid #e0e0e0 !important;
      border-radius: 15px !important;
      background: white !important;
      transition: all 0.3s ease !important;
    }

    .input-container:focus-within {
      border-color: #2196F3 !important;
      box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1) !important;
    }

    .message-input {
      width: 100% !important;
      border: none !important;
      outline: none !important;
      padding: 15px !important;
      font-size: 1rem !important;
      resize: none !important;
      background: transparent !important;
    }

    .message-input::placeholder {
      color: #999 !important;
    }

    .input-footer {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      padding: 10px 15px !important;
      border-top: 1px solid #f0f0f0 !important;
    }

    .char-count {
      color: #666 !important;
      font-size: 0.8rem !important;
    }

    /* 🚀 BOTÓN MEGA ULTRA VISIBLE */
    .send-btn-premium {
      min-width: 160px !important;
      height: 60px !important;
      background: linear-gradient(45deg, #FF0000, #FF4500, #FF6B35, #FF4500, #FF0000) !important;
      border: 4px solid #FF0000 !important;
      border-radius: 30px !important;
      cursor: pointer !important;
      transition: all 0.3s ease !important;
      box-shadow: 0 0 30px rgba(255, 0, 0, 0.8) !important;
      animation: buttonMegaPulse 1s infinite !important;
      transform: scale(1.3) !important;
      position: relative !important;
      z-index: 9999 !important;
    }

    .send-btn-premium:hover {
      transform: scale(1.5) !important;
      box-shadow: 0 0 50px rgba(255, 0, 0, 1) !important;
    }

    .send-btn-premium:disabled {
      opacity: 0.5 !important;
      cursor: not-allowed !important;
      transform: scale(1) !important;
      animation: none !important;
    }

    .premium-text {
      color: white !important;
      font-size: 1.2rem !important;
      font-weight: 900 !important;
      text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8) !important;
      letter-spacing: 2px !important;
      text-transform: uppercase !important;
    }

    @keyframes buttonMegaPulse {
      0%, 100% {
        box-shadow: 0 0 30px rgba(255, 0, 0, 0.8) !important;
        background: linear-gradient(45deg, #FF0000, #FF4500, #FF6B35, #FF4500, #FF0000) !important;
      }
      50% {
        box-shadow: 0 0 50px rgba(255, 0, 0, 1) !important;
        background: linear-gradient(45deg, #FF4500, #FF6B35, #FFFF00, #FF6B35, #FF4500) !important;
      }
    }

    /* RESPONSIVE */
    @media (max-width: 768px) {
      .chat-container {
        margin-top: 120px !important;
      }
      
      .mega-banner {
        height: 60px !important;
      }
      
      .verification-banner {
        height: 50px !important;
        top: 60px !important;
      }
      
      .mega-banner-content {
        font-size: 1.5rem !important;
      }
      
      .banner-content {
        font-size: 1.2rem !important;
      }
      
      .banner-icon {
        font-size: 1.5rem !important;
      }
      
      .message-content {
        max-width: 85% !important;
      }
      
      .send-btn-premium {
        min-width: 140px !important;
        height: 50px !important;
      }
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