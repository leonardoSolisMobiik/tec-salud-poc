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
    <div style="display: flex; flex-direction: column; height: 100vh; background: #f5f7fa; font-family: Arial, sans-serif;">
      <!-- Header fijo -->
      <div style="padding: 20px; background: white; border-bottom: 1px solid #e0e0e0; flex-shrink: 0;">
        <div *ngIf="activePatient" style="display: flex; align-items: center; gap: 15px;">
          <div style="width: 50px; height: 50px; border-radius: 50%; background: #2196F3; color: white; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; font-weight: bold;">
            {{ activePatient.name.charAt(0) }}
          </div>
          <div>
            <h3 style="margin: 0; color: #333; font-size: 1.1rem; font-weight: 600;">{{ activePatient.name }}</h3>
            <p style="margin: 5px 0 0 0; color: #666; font-size: 0.9rem;">ID: {{ activePatient.id }}</p>
          </div>
        </div>
        <div *ngIf="!activePatient" style="text-align: center; color: #666; font-size: 1.1rem;">
          Selecciona un paciente para comenzar
        </div>
      </div>

      <!-- Área de mensajes -->
      <div #messagesContainer style="flex: 1; overflow-y: auto; padding: 20px; background: #f5f7fa;">
        <div *ngIf="!activePatient" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center;">
          <h2 style="color: #333; margin: 0 0 10px 0; font-size: 1.5rem;">Asistente Médico IA</h2>
          <p style="color: #666; margin: 0;">Selecciona un paciente para comenzar</p>
        </div>

        <div *ngIf="activePatient" style="max-width: 800px; margin: 0 auto;">
          <!-- Mensajes existentes -->
          <div *ngFor="let message of chatMessages; trackBy: trackMessage" 
               style="margin-bottom: 15px; display: flex; width: 100%; clear: both;"
               [style.justify-content]="message.role === 'user' ? 'flex-end' : 'flex-start'">
            <div [style.background]="message.role === 'user' ? '#2196F3' : 'white'"
                 [style.color]="message.role === 'user' ? 'white' : '#333'"
                 [style.border]="message.role === 'user' ? '1px solid #1976D2' : '1px solid #e0e0e0'"
                 [style.margin-left]="message.role === 'user' ? 'auto' : '0'"
                 [style.margin-right]="message.role === 'user' ? '0' : 'auto'"
                 style="max-width: 70%; min-width: 100px; padding: 12px 16px; border-radius: 18px; word-wrap: break-word; display: block; position: relative; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); opacity: 1; visibility: visible; z-index: 100;">
              <div style="line-height: 1.4; word-wrap: break-word; margin: 0; font-size: 0.95rem;" [innerHTML]="formatMessageContent(message.content)"></div>
              <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 5px; text-align: right;"
                   [style.color]="message.role === 'user' ? 'rgba(255, 255, 255, 0.8)' : '#666'">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>
              
          <!-- Mensaje en streaming -->
          <div *ngIf="isStreaming" style="margin-bottom: 15px; display: flex; width: 100%; clear: both; justify-content: flex-start;">
            <div style="background: white; color: #333; border: 1px solid #4CAF50; margin-right: auto; max-width: 70%; min-width: 100px; padding: 12px 16px; border-radius: 18px; word-wrap: break-word; display: block; position: relative; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); opacity: 1; visibility: visible; z-index: 100; animation: pulse-animation 1.5s infinite;">
              <div style="line-height: 1.4; word-wrap: break-word; margin: 0; font-size: 0.95rem;" [innerHTML]="formatMessageContent(streamingMessage)"></div>
              <div style="font-size: 0.75rem; opacity: 0.7; margin-top: 5px; text-align: right; color: #666;">Escribiendo...</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input área -->
      <div *ngIf="activePatient" style="padding: 20px; background: white; border-top: 1px solid #e0e0e0; flex-shrink: 0;">
        <div style="max-width: 800px; margin: 0 auto; display: flex; gap: 10px; align-items: flex-end;">
          <textarea
            [(ngModel)]="currentMessage"
            (keydown.enter)="onEnterPressed($event)"
            placeholder="Escribe tu mensaje..."
            [disabled]="isStreaming"
            style="flex: 1; border: 1px solid #e0e0e0; border-radius: 10px; padding: 12px; font-size: 1rem; resize: none; min-height: 20px; max-height: 120px; background: white; color: #333; outline: none; font-family: inherit;">
          </textarea>
          <button
            (click)="sendMessage()"
            [disabled]="!canSendMessage"
            [style.background]="!canSendMessage ? '#ccc' : '#2196F3'"
            [style.cursor]="!canSendMessage ? 'not-allowed' : 'pointer'"
            style="color: white; border: none; border-radius: 10px; padding: 12px 20px; font-size: 0.9rem; transition: all 0.3s ease;">
            Enviar
          </button>
        </div>
      </div>
    </div>

    <style>
      @keyframes pulse-animation {
        0%, 100% { 
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        50% { 
          box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
        }
      }
    </style>
  `,
  styles: []
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