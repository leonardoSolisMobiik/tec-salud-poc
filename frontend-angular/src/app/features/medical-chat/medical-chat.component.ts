import { Component, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatMessage } from '@core/models';
import { MedicalStateService, StreamingService } from '@core/services';

// Import available Bamboo Components
import { 
  BmbCardComponent,
} from '@ti-tecnologico-de-monterrey-oficial/ds-ng';

@Component({
  selector: 'app-medical-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BmbCardComponent,
  ],
  template: `
    <div class="medical-chat-container">
      <!-- Header -->
      <header class="medical-header">
        <div class="header-content">
          <div class="header-left">
            <div class="medical-logo">🏥</div>
            <div class="header-title">
              <h1>TecSalud Medical AI</h1>
              <p>Powered by Bamboo Design System</p>
            </div>
          </div>
          
          <div class="header-right" *ngIf="activePatient">
            <div class="patient-info">
              👤 {{ activePatient.name }}
            </div>
            <div class="status-info">
              <span *ngIf="!isStreaming" class="status ready">✅ Listo</span>
              <span *ngIf="isStreaming" class="status processing">⏳ Procesando...</span>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Chat Area -->
      <main class="chat-main" #messagesContainer>
        <!-- Welcome State -->
        <div *ngIf="chatMessages.length === 0" class="welcome-section">
          
          <!-- Hero Card -->
          <bmb-card class="hero-card">
            <div class="hero-content">
              <div class="hero-icon">🤖</div>
              <h2>Asistente Médico Inteligente</h2>
              <p>Sistema avanzado de IA médica integrado con Bamboo Design System para una experiencia consistente con los estándares de TecSalud</p>
            </div>
          </bmb-card>

          <!-- Feature Cards -->
          <div class="features-grid">
            <bmb-card class="feature-card">
              <div class="feature-content">
                <div class="feature-icon">🎨</div>
                <h3>Bamboo DS</h3>
                <span class="feature-badge success">✅ Integrado</span>
                <p>Cards funcionando correctamente</p>
              </div>
            </bmb-card>

            <bmb-card class="feature-card">
              <div class="feature-content">
                <div class="feature-icon">👥</div>
                <h3>Pacientes</h3>
                <span class="feature-badge info">📊 {{ recentPatients.length }} disponibles</span>
                <p>Base de datos SQLite</p>
              </div>
            </bmb-card>

            <bmb-card class="feature-card">
              <div class="feature-content">
                <div class="feature-icon">🔗</div>
                <h3>Backend</h3>
                <span class="feature-badge success">✅ FastAPI activo</span>
                <p>Puerto 8000 conectado</p>
              </div>
            </bmb-card>

            <bmb-card class="feature-card">
              <div class="feature-content">
                <div class="feature-icon">🧠</div>
                <h3>IA Médica</h3>
                <span class="feature-badge primary">⭐ Azure OpenAI</span>
                <p>Streaming en tiempo real</p>
              </div>
            </bmb-card>
          </div>

          <!-- Call to Action -->
          <bmb-card *ngIf="!activePatient" class="cta-card">
            <div class="cta-content">
              <span class="cta-icon">ℹ️</span>
              <div>
                <h4>🚀 ¡Listo para comenzar!</h4>
                <p>Selecciona un paciente en el sidebar para activar el asistente médico con IA</p>
              </div>
            </div>
          </bmb-card>
        </div>

        <!-- Chat Messages -->
        <div class="chat-messages" *ngIf="chatMessages.length > 0">
          <div *ngFor="let message of chatMessages; trackBy: trackMessage" 
               class="message-wrapper"
               [class.user-message]="message.role === 'user'"
               [class.assistant-message]="message.role === 'assistant'">
            
            <bmb-card class="message-card">
              <!-- Message Header -->
              <div class="message-header">
                <div class="message-author">
                  <span class="author-avatar" 
                        [class.user]="message.role === 'user'"
                        [class.assistant]="message.role === 'assistant'">
                    {{ message.role === 'user' ? '👤' : '🤖' }}
                  </span>
                  <span class="author-name">
                    {{ message.role === 'user' ? 'Dr. Usuario' : 'Asistente IA' }}
                  </span>
                </div>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>
              
              <!-- Message Content -->
              <div class="message-content" [innerHTML]="formatMessageContent(message.content)"></div>

              <!-- Message Actions -->
              <div class="message-actions" *ngIf="message.role === 'assistant'">
                <button class="action-btn" (click)="copyMessage(message.content)" title="Copiar">📋</button>
                <button class="action-btn" (click)="likeMessage(message)" title="Me gusta">👍</button>
                <button class="action-btn" (click)="repeatMessage(message)" title="Repetir">🔄</button>
              </div>
            </bmb-card>
          </div>

          <!-- Streaming Message -->
          <div *ngIf="isStreaming" class="message-wrapper assistant-message streaming">
            <bmb-card class="message-card">
              <div class="message-header">
                <div class="message-author">
                  <span class="author-avatar assistant">🤖</span>
                  <span class="author-name">Asistente IA</span>
                </div>
                <span class="processing-badge">⏳ Procesando...</span>
              </div>
              
              <div class="message-content">
                <div class="thinking-indicator">
                  <div class="pulse-dots">
                    <span></span><span></span><span></span>
                  </div>
                  <span>Analizando con IA médica...</span>
                </div>
              </div>
            </bmb-card>
          </div>
        </div>
      </main>

      <!-- Input Area -->
      <footer class="chat-footer">
        <!-- Quick Actions -->
        <div class="quick-actions" *ngIf="activePatient">
          <button *ngFor="let action of quickActions" 
                  class="quick-btn"
                  (click)="useQuickAction(action)"
                  [disabled]="isStreaming">
            {{ action.label }}
          </button>
        </div>

        <!-- Input Section -->
        <div class="input-section">
          <div class="input-container">
            <textarea
              [(ngModel)]="currentMessage"
              (keydown.enter)="onEnterPressed($event)"
              (input)="onInputChange($event)"
              placeholder="Describe los síntomas del paciente o haz una consulta médica..."
              rows="3"
              class="message-input"
              [disabled]="isStreaming || !activePatient"
              #messageInput>
            </textarea>
            
            <div class="input-footer">
              <span class="char-count">{{ currentMessage.length }}/2000 caracteres</span>
              <button
                class="send-btn"
                [class.active]="canSendMessage"
                (click)="sendMessage()"
                [disabled]="!canSendMessage">
                <span *ngIf="!isStreaming">📤 Enviar</span>
                <span *ngIf="isStreaming">⏳ Enviando...</span>
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .medical-chat-container {
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: #f8f9fa;
    }

    /* Header */
    .medical-header {
      background: linear-gradient(135deg, #0066cc 0%, #004d99 100%);
      color: white;
      padding: 1rem 2rem;
      box-shadow: 0 2px 8px rgba(0, 102, 204, 0.3);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .medical-logo {
      font-size: 2rem;
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .header-title h1 {
      margin: 0;
      font-size: 1.5rem;
      font-weight: 700;
    }

    .header-title p {
      margin: 0;
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .header-right {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .patient-info {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: 600;
    }

    .status {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .status.ready {
      background: rgba(76, 175, 80, 0.2);
      color: #4caf50;
    }

    .status.processing {
      background: rgba(255, 152, 0, 0.2);
      color: #ff9800;
    }

    /* Main Chat Area */
    .chat-main {
      flex: 1;
      overflow-y: auto;
      padding: 2rem;
      background: #f8f9fa;
    }

    /* Welcome Section */
    .welcome-section {
      max-width: 1000px;
      margin: 0 auto;
    }

    .hero-card {
      margin-bottom: 2rem;
      border: 2px solid #0066cc;
    }

    .hero-content {
      text-align: center;
      padding: 2rem;
    }

    .hero-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .hero-content h2 {
      margin: 0 0 1rem 0;
      color: #0066cc;
      font-size: 2rem;
      font-weight: 700;
    }

    .hero-content p {
      margin: 0;
      color: #666;
      font-size: 1.1rem;
      line-height: 1.6;
    }

    /* Feature Cards Grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }

    .feature-card {
      border: 1px solid #e5e7eb;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .feature-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 102, 204, 0.15);
    }

    .feature-content {
      text-align: center;
      padding: 1.5rem;
    }

    .feature-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .feature-content h3 {
      margin: 0 0 0.5rem 0;
      color: #333;
      font-size: 1.25rem;
      font-weight: 600;
    }

    .feature-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 500;
      margin-bottom: 0.75rem;
    }

    .feature-badge.success {
      background: #e8f5e8;
      color: #2e7d32;
    }

    .feature-badge.info {
      background: #e3f2fd;
      color: #1976d2;
    }

    .feature-badge.primary {
      background: #e8f0fe;
      color: #0066cc;
    }

    .feature-content p {
      margin: 0;
      color: #666;
      font-size: 0.875rem;
    }

    /* Call to Action */
    .cta-card {
      border: 2px solid #ff9800;
      background: #fff8e1;
    }

    .cta-content {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.5rem;
    }

    .cta-icon {
      font-size: 2rem;
    }

    .cta-content h4 {
      margin: 0 0 0.5rem 0;
      color: #e65100;
      font-size: 1.25rem;
    }

    .cta-content p {
      margin: 0;
      color: #f57c00;
      font-size: 1rem;
    }

    /* Chat Messages */
    .chat-messages {
      max-width: 800px;
      margin: 0 auto;
    }

    .message-wrapper {
      margin-bottom: 1.5rem;
    }

    .user-message {
      margin-left: 20%;
    }

    .assistant-message {
      margin-right: 20%;
    }

    .message-card {
      border: 1px solid #e5e7eb;
    }

    .user-message .message-card {
      border-color: #0066cc;
      background: #f0f7ff;
    }

    .assistant-message .message-card {
      border-color: #e5e7eb;
      background: white;
    }

    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #f0f0f0;
    }

    .message-author {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .author-avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }

    .author-avatar.user {
      background: #e3f2fd;
    }

    .author-avatar.assistant {
      background: #f3e5f5;
    }

    .author-name {
      font-weight: 600;
      color: #333;
      font-size: 0.875rem;
    }

    .message-time {
      font-size: 0.75rem;
      color: #666;
    }

    .message-content {
      line-height: 1.6;
      color: #333;
      margin-bottom: 0.75rem;
    }

    .message-actions {
      display: flex;
      gap: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid #f0f0f0;
    }

    .action-btn {
      background: none;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 0.25rem 0.5rem;
      cursor: pointer;
      font-size: 0.75rem;
      transition: background 0.2s;
    }

    .action-btn:hover {
      background: #f5f5f5;
    }

    /* Streaming Animation */
    .thinking-indicator {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #666;
    }

    .pulse-dots {
      display: flex;
      gap: 0.25rem;
    }

    .pulse-dots span {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #0066cc;
      animation: pulse 1.4s infinite;
    }

    .pulse-dots span:nth-child(2) {
      animation-delay: 0.2s;
    }

    .pulse-dots span:nth-child(3) {
      animation-delay: 0.4s;
    }

    @keyframes pulse {
      0%, 80%, 100% {
        opacity: 0.3;
        transform: scale(0.8);
      }
      40% {
        opacity: 1;
        transform: scale(1);
      }
    }

    /* Footer */
    .chat-footer {
      background: white;
      border-top: 1px solid #e5e7eb;
      padding: 1rem 2rem;
    }

    .quick-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
      justify-content: center;
    }

    .quick-btn {
      background: #f8f9fa;
      border: 1px solid #e5e7eb;
      border-radius: 20px;
      padding: 0.5rem 1rem;
      cursor: pointer;
      font-size: 0.875rem;
      transition: all 0.2s;
    }

    .quick-btn:hover:not(:disabled) {
      background: #e3f2fd;
      border-color: #0066cc;
      color: #0066cc;
    }

    .quick-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Input Section */
    .input-section {
      max-width: 800px;
      margin: 0 auto;
    }

    .input-container {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      transition: border-color 0.2s;
    }

    .input-container:focus-within {
      border-color: #0066cc;
    }

    .message-input {
      width: 100%;
      border: none;
      outline: none;
      padding: 1rem;
      font-size: 1rem;
      line-height: 1.5;
      resize: none;
      font-family: inherit;
    }

    .message-input:disabled {
      background: #f5f5f5;
      color: #999;
    }

    .input-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 1rem;
      background: #f8f9fa;
      border-top: 1px solid #e5e7eb;
    }

    .char-count {
      font-size: 0.75rem;
      color: #666;
    }

    .send-btn {
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 8px;
      padding: 0.75rem 1.5rem;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }

    .send-btn:hover:not(:disabled) {
      background: #0052a3;
      transform: translateY(-1px);
    }

    .send-btn:disabled {
      background: #ccc;
      cursor: not-allowed;
      transform: none;
    }

    .send-btn.active {
      background: #0066cc;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .chat-main {
        padding: 1rem;
      }
      
      .chat-footer {
        padding: 1rem;
      }
      
      .user-message {
        margin-left: 10%;
      }
      
      .assistant-message {
        margin-right: 10%;
      }
      
      .features-grid {
        grid-template-columns: 1fr;
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
    this.currentMessage = '';

    // Start streaming response
    this.medicalStateService.startStreaming();
    
    // Enhanced AI simulation with medical context
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        role: 'assistant',
        content: `**Análisis Médico para ${this.activePatient.name}**

Basándome en la información proporcionada, puedo ofrecerte las siguientes recomendaciones:

**🔍 Evaluación Inicial:**
- La descripción de síntomas requiere un análisis más detallado
- Es importante considerar el historial médico del paciente

**📋 Recomendaciones:**
1. **Examen físico** completo enfocado en el área de interés
2. **Signos vitales** y evaluación del estado general
3. **Estudios complementarios** según indicación clínica

**⚠️ Consideraciones importantes:**
- Esta es una herramienta de apoyo diagnóstico
- La evaluación presencial del paciente es fundamental
- Ante cualquier emergencia, dirigirse inmediatamente a urgencias

**💡 Próximos pasos sugeridos:**
¿Te gustaría que profundice en algún aspecto específico del caso?`,
        timestamp: new Date()
      };
      
      this.medicalStateService.addMessage(aiResponse);
      this.medicalStateService.finishStreaming();
    }, 3000);
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
    // Basic markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
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