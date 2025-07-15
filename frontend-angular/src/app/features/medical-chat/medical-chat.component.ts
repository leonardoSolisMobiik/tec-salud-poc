import { Component, OnInit, OnDestroy, AfterViewChecked, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatMessage, ChatRequest, ChatAskRequest } from '@core/models';
import { MedicalStateService, ChatSessionService, StreamingService, ApiService } from '@core/services';
import { ChangeDetectorRef } from '@angular/core';
import { Patient } from '@core/models/patient.model';
import { Router, NavigationEnd } from '@angular/router';

/**
 * Medical Chat Component for AI-powered medical consultations
 *
 * @description Main chat interface for medical consultations with AI assistant.
 * Handles patient context, message history, streaming responses, and responsive design.
 * Integrates with MedicalStateService for state management and StreamingService for real-time AI responses.
 *
 * @features
 * - Patient-contextual conversations
 * - Real-time streaming AI responses
 * - Responsive design (mobile, tablet, desktop)
 * - Message formatting with medical content support
 * - Quick action buttons for common medical queries
 * - Auto-scrolling message container
 * - Character limit validation
 *
 * @example
 * ```typescript
 * // Used in template:
 * <app-medical-chat></app-medical-chat>
 *
 * // Component automatically handles:
 * // 1. Patient selection from MedicalStateService
 * // 2. Message history per patient
 * // 3. Streaming AI responses
 * // 4. Responsive UI adaptations
 * ```
 *
 * @since 1.0.0
 */
@Component({
  selector: 'app-medical-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  template: `
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

        <!-- Messages with Bubble Design -->
        <div class="messages-list" *ngIf="activePatient">
          <div
            *ngFor="let message of chatMessages; trackBy: trackMessage"
            class="message-wrapper"
            [class.user-wrapper]="message.role === 'user'"
            [class.assistant-wrapper]="message.role === 'assistant'"
          >
            <!-- Avatar -->
            <div class="message-avatar"
                 [class.user-avatar]="message.role === 'user'"
                 [class.assistant-avatar]="message.role === 'assistant'">
              <span *ngIf="message.role === 'user'">👨‍⚕️</span>
              <span *ngIf="message.role === 'assistant'">🤖</span>
            </div>

            <!-- Bubble Container -->
            <div class="bubble-container">
              <!-- Speech Bubble -->
              <div class="speech-bubble"
                   [class.user-bubble]="message.role === 'user'"
                   [class.assistant-bubble]="message.role === 'assistant'">

                <!-- Message Content -->
                <div class="bubble-content">
                  <div class="message-text" [innerHTML]="formatMessageContent(message.content)"></div>
                </div>

                <!-- Bubble Tail -->
                <div class="bubble-tail"
                     [class.user-tail]="message.role === 'user'"
                     [class.assistant-tail]="message.role === 'assistant'">
                </div>
              </div>

              <!-- Timestamp -->
              <div class="message-timestamp"
                   [class.user-timestamp]="message.role === 'user'"
                   [class.assistant-timestamp]="message.role === 'assistant'">
                {{ formatTime(message.timestamp) }}
              </div>
            </div>
          </div>

          <!-- Streaming message with bubble design -->
          <div class="message-wrapper assistant-wrapper" *ngIf="isStreaming">
            <!-- Avatar -->
            <div class="message-avatar assistant-avatar">
              <span class="typing-indicator">🤖</span>
            </div>

            <!-- Bubble Container -->
            <div class="bubble-container">
              <!-- Speech Bubble -->
              <div class="speech-bubble assistant-bubble streaming-bubble">
                <!-- Message Content -->
                <div class="bubble-content">
                  <div class="message-text">
                    <span *ngIf="streamingMessage" [innerHTML]="formatMessageContent(streamingMessage)"></span>
                    <span *ngIf="!streamingMessage" class="thinking-dots">
                      <span class="dot">.</span>
                      <span class="dot">.</span>
                      <span class="dot">.</span>
                    </span>
                    <span class="typing-cursor">|</span>
                  </div>
                </div>

                <!-- Bubble Tail -->
                <div class="bubble-tail assistant-tail"></div>
              </div>

              <!-- Timestamp -->
              <div class="message-timestamp assistant-timestamp">
                Escribiendo...
              </div>
            </div>
          </div>

          <!-- STICKY SCROLL ANCHOR - This element will stick to bottom -->
          <div #scrollAnchor class="scroll-anchor" *ngIf="chatMessages.length > 0 || isStreaming"></div>
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
    /* CONTENEDOR PRINCIPAL */
    .chat-container {
      display: flex !important;
      flex-direction: column !important;
      height: 100vh !important;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%) !important;
      margin-top: 0 !important;
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

    .message-wrapper {
      display: flex !important;
      align-items: flex-start !important;
      margin-bottom: 20px !important;
      gap: 10px !important;
    }

    .user-wrapper {
      flex-direction: row-reverse !important;
    }

    .assistant-wrapper {
      flex-direction: row !important;
    }

    .message-avatar {
      width: 40px !important;
      height: 40px !important;
      border-radius: 50% !important;
      background: #e0e0e0 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 1.5rem !important;
      color: #333 !important;
      flex-shrink: 0 !important;
    }

    .user-avatar {
      background: #2196F3 !important;
      color: white !important;
    }

    .assistant-avatar {
      background: #FF9800 !important;
      color: white !important;
    }

    .bubble-container {
      display: flex !important;
      flex-direction: column !important;
      align-items: flex-start !important;
      gap: 5px !important;
    }

    .user-wrapper .bubble-container {
      align-items: flex-end !important;
    }

    .assistant-wrapper .bubble-container {
      align-items: flex-start !important;
    }

    .speech-bubble {
      max-width: 70% !important;
      padding: 15px 20px !important;
      border-radius: 20px !important;
      background: white !important;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
      position: relative !important;
    }

    .user-bubble {
      background: #2196F3 !important;
      color: white !important;
    }

    .assistant-bubble {
      background: #FF9800 !important;
      color: white !important;
    }

    .streaming-bubble {
      background: #FF9800 !important;
      color: white !important;
    }

    .bubble-tail {
      position: absolute !important;
      width: 0 !important;
      height: 0 !important;
      border-style: solid !important;
      border-width: 10px 10px 10px 0 !important;
      border-color: transparent white transparent transparent !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
    }

    .user-tail {
      right: -10px !important;
      border-width: 10px 0 10px 10px !important;
      border-color: transparent transparent transparent #2196F3 !important;
    }

    .assistant-tail {
      left: -10px !important;
      border-width: 10px 10px 10px 0 !important;
      border-color: transparent #FF9800 transparent transparent !important;
    }

    .bubble-content {
      line-height: 1.5 !important;
    }

    .message-text {
      white-space: pre-wrap !important; /* Preserve line breaks */
      word-break: break-word !important;
    }

    /* Thinking Dots Animation */
    .thinking-dots {
      display: inline-flex !important;
      align-items: center !important;
      gap: 2px !important;
    }

    .thinking-dots .dot {
      width: 4px !important;
      height: 4px !important;
      background: currentColor !important;
      border-radius: 50% !important;
      animation: thinkingPulse 1.4s infinite ease-in-out !important;
    }

    .thinking-dots .dot:nth-child(1) {
      animation-delay: -0.32s !important;
    }

    .thinking-dots .dot:nth-child(2) {
      animation-delay: -0.16s !important;
    }

    .thinking-dots .dot:nth-child(3) {
      animation-delay: 0s !important;
    }

    @keyframes thinkingPulse {
      0%, 80%, 100% {
        transform: scale(0) !important;
        opacity: 0.5 !important;
      }
      40% {
        transform: scale(1) !important;
        opacity: 1 !important;
      }
    }

    /* Typing Cursor Animation */
    .typing-cursor {
      animation: blink 1s infinite !important;
      font-weight: bold !important;
      margin-left: 2px !important;
    }

    @keyframes blink {
      0%, 50% {
        opacity: 1 !important;
      }
      51%, 100% {
        opacity: 0 !important;
      }
    }

    /* Typing Indicator Animation */
    .typing-indicator {
      animation: bounce 1.5s infinite !important;
    }

    @keyframes bounce {
      0%, 20%, 50%, 80%, 100% {
        transform: translateY(0) !important;
      }
      40% {
        transform: translateY(-5px) !important;
      }
      60% {
        transform: translateY(-3px) !important;
      }
    }

    /* Streaming Bubble Effect */
    .streaming-bubble {
      animation: streamingGlow 2s ease-in-out infinite alternate !important;
    }

    @keyframes streamingGlow {
      from {
        box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3) !important;
      }
      to {
        box-shadow: 0 4px 16px rgba(255, 152, 0, 0.6) !important;
      }
    }

    .message-timestamp {
      font-size: 0.75rem !important;
      opacity: 0.7 !important;
      margin-top: 5px !important;
    }

    .user-timestamp {
      text-align: right !important;
    }

    .assistant-timestamp {
      text-align: left !important;
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

    /* 🚀 BOTÓN PREMIUM MODERNO */
    .send-btn-premium {
      min-width: 120px !important;
      height: 45px !important;
      background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%) !important;
      border: none !important;
      border-radius: 25px !important;
      cursor: pointer !important;
      transition: all 0.3s ease !important;
      box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3) !important;
      position: relative !important;
      overflow: hidden !important;
    }

    .send-btn-premium:hover:not(:disabled) {
      transform: translateY(-2px) !important;
      box-shadow: 0 6px 20px rgba(33, 150, 243, 0.4) !important;
    }

    .send-btn-premium:disabled {
      opacity: 0.6 !important;
      cursor: not-allowed !important;
      transform: none !important;
    }

    .premium-text {
      color: white !important;
      font-size: 0.9rem !important;
      font-weight: 600 !important;
      letter-spacing: 0.5px !important;
      text-transform: uppercase !important;
    }

    /* 📱 RESPONSIVE OPTIMIZADO - TASK-UI-004 */

    /* Mobile Styles (<768px) */
    @media (max-width: 767px) {
      .chat-container {
        margin-top: 0 !important;
      }

      .message-wrapper {
        gap: 8px !important;
      }

      .message-avatar {
        width: 35px !important;
        height: 35px !important;
        font-size: 1.1rem !important;
      }

      .bubble-container {
        gap: 3px !important;
      }

      .speech-bubble {
        max-width: 85% !important;
        padding: 12px 15px !important;
      }

      .bubble-tail {
        border-width: 8px 8px 8px 0 !important;
      }

      .user-tail {
        right: -8px !important;
      }

      .assistant-tail {
        left: -8px !important;
      }

      .message-text {
        font-size: 0.9rem !important;
      }

      .message-timestamp {
        font-size: 0.6rem !important;
      }

      .send-btn-premium {
        min-width: 120px !important;
        height: var(--touch-target-min, 44px) !important;
        transform: scale(1.1) !important;
      }

      .send-btn-premium:hover {
        transform: scale(1.2) !important;
      }

      .message-input {
        font-size: 16px !important; /* Prevents zoom on iOS */
        padding: var(--touch-spacing, 12px) !important;
      }

      .input-footer {
        padding: var(--touch-spacing, 12px) !important;
      }

      .chat-header {
        padding: var(--bmb-spacing-m, 1rem) !important;
      }

      .chat-footer {
        padding: var(--bmb-spacing-m, 1rem) !important;
      }
    }

    /* Tablet Styles (768px-1024px) - TASK-UI-004 OPTIMIZACIÓN */
    @media (min-width: 768px) and (max-width: 1024px) {
      .chat-container {
        margin-top: 0 !important;
      }

      .message-wrapper {
        gap: 10px !important;
      }

      .message-avatar {
        width: 45px !important;
        height: 45px !important;
        font-size: 1.3rem !important;
      }

      .bubble-container {
        gap: 5px !important;
      }

      .speech-bubble {
        max-width: 75% !important;
        padding: 15px 20px !important;
      }

      .bubble-tail {
        border-width: 10px 10px 10px 0 !important;
      }

      .user-tail {
        right: -10px !important;
      }

      .assistant-tail {
        left: -10px !important;
      }

      .message-text {
        font-size: 1rem !important;
      }

      .message-timestamp {
        font-size: 0.75rem !important;
      }

      .send-btn-premium {
        min-width: 150px !important;
        height: 55px !important;
        transform: scale(1.2) !important;
      }

      .send-btn-premium:hover {
        transform: scale(1.3) !important;
      }

      .messages-list {
        max-width: 900px !important;
        padding: 0 var(--bmb-spacing-m, 1rem) !important;
      }

      .input-section {
        max-width: 900px !important;
      }

      .chat-header {
        padding: var(--bmb-spacing-l, 1.5rem) !important;
      }

      .chat-footer {
        padding: var(--bmb-spacing-l, 1.5rem) !important;
      }
    }

    /* Desktop Styles (1025px+) */
    @media (min-width: 1025px) {
      .message-wrapper {
        gap: 10px !important;
      }

      .message-avatar {
        width: 45px !important;
        height: 45px !important;
        font-size: 1.3rem !important;
      }

      .bubble-container {
        gap: 5px !important;
      }

      .speech-bubble {
        max-width: 70% !important;
        padding: 15px 20px !important;
      }

      .bubble-tail {
        border-width: 10px 10px 10px 0 !important;
      }

      .user-tail {
        right: -10px !important;
      }

      .assistant-tail {
        left: -10px !important;
      }

      .message-text {
        font-size: 1rem !important;
      }

      .message-timestamp {
        font-size: 0.75rem !important;
      }

      .send-btn-premium {
        min-width: 160px !important;
        height: 60px !important;
        transform: scale(1.3) !important;
      }

      .send-btn-premium:hover {
        transform: scale(1.5) !important;
      }
    }

    /* 🖱️ TOUCH DEVICE OPTIMIZATIONS - TASK-UI-004 */
    @media (hover: none) and (pointer: coarse) {
      .message-input {
        -webkit-appearance: none !important;
        border-radius: var(--medical-border-radius) !important;
      }

      .send-btn-premium:hover {
        transform: scale(1.1) !important;
      }

      .chat-main {
        -webkit-overflow-scrolling: touch !important;
        scroll-behavior: smooth !important;
      }

      .message-wrapper {
        touch-action: manipulation !important;
      }
    }

    /* SCROLL ANCHOR FOR BOTTOM POSITIONING */
    .scroll-anchor {
      height: 1px !important;
      min-height: 1px !important;
      width: 100% !important;
      position: sticky !important;
      bottom: 0 !important;
      background: transparent !important;
      pointer-events: none !important;
      z-index: 1000 !important;
      margin: 0 !important;
      padding: 0 !important;
      flex-shrink: 0 !important;
    }

    /* Force scroll container to respect sticky positioning */
    .messages-list {
      overflow-anchor: none !important;
      scroll-behavior: auto !important;
    }

    .chat-main {
      overflow-anchor: none !important;
      scroll-behavior: auto !important;
    }
  `]
})
export class MedicalChatComponent implements OnInit, OnDestroy, AfterViewChecked, AfterViewInit {
  /** ViewChild reference to the messages container for auto-scrolling */
  @ViewChild('messagesContainer') messagesContainer!: ElementRef;

  /** ViewChild reference to the scroll anchor element for bottom positioning */
  @ViewChild('scrollAnchor') scrollAnchor!: ElementRef;

  /** Subject for managing component subscriptions cleanup */
  private destroy$ = new Subject<void>();

  /** Flag to trigger scrolling to bottom after view updates */
  private shouldScrollToBottom = false;

  /** IntersectionObserver for detecting when chat container is visible */
  private scrollObserver?: IntersectionObserver;

  /** MutationObserver for detecting DOM changes in messages */
  private mutationObserver?: MutationObserver;

  /** Flag to track if component is active/visible */
  private isComponentActive = false;

  /** Current message being typed by the user */
  currentMessage = '';

  /** Array of chat messages for the current patient */
  chatMessages: ChatMessage[] = [];

  /** Whether AI is currently streaming a response */
  isStreaming = false;

  /** Current streaming message content */
  streamingMessage = '';

  /** Currently active patient for medical context */
  activePatient: any = null;

  /** Recently accessed patients for quick selection */
  recentPatients: any[] = [];

  /** Quick action templates for common medical queries */
  quickActions = [
    { label: 'Síntomas', text: 'El paciente presenta los siguientes síntomas: ' },
    { label: 'Diagnóstico', text: 'Necesito ayuda con el diagnóstico diferencial para: ' },
    { label: 'Tratamiento', text: 'Recomienda opciones de tratamiento para: ' },
    { label: 'Exámenes', text: 'Qué exámenes clínicos recomiendas para evaluar: ' },
    { label: 'Urgencia', text: 'Evalúa la urgencia de este caso: ' },
    { label: 'Historial', text: 'Considerando el historial médico del paciente: ' }
  ];

  /**
   * Creates an instance of MedicalChatComponent
   *
   * @param medicalStateService - Service for managing medical state and patient data
   * @param chatSessionService - Service for managing chat sessions
   * @param streamingService - Service for handling streaming AI responses
   */
  constructor(
    private medicalStateService: MedicalStateService,
    private chatSessionService: ChatSessionService,
    private streamingService: StreamingService,
    private apiService: ApiService,
    private cdr: ChangeDetectorRef,
    private router: Router
  ) {}

  /**
   * Component initialization lifecycle hook
   *
   * @description Sets up subscriptions to medical state observables for:
   * - Active patient changes
   * - Recent patients updates
   * - Chat messages changes
   * - Streaming state updates
   * - Real-time streaming message content
   *
   * @example
   * ```typescript
   * // Automatically called by Angular
   * // Sets up reactive data flow from MedicalStateService
   * ```
   */
  ngOnInit(): void {
    console.log('🩺 ============================================');
    console.log('🩺 MedicalChatComponent ngOnInit INICIADO');
    console.log('🩺 Timestamp:', new Date().toISOString());
    console.log('🩺 URL actual:', window.location.pathname);
    console.log('🩺 ============================================');

    // Get initial state immediately
    const initialPatient = this.medicalStateService.activePatientValue;
    console.log('🩺 Initial patient from service:', initialPatient?.name || 'NONE');

    // Subscribe to router navigation events for robust scroll handling
    this.router.events
      .pipe(takeUntil(this.destroy$))
      .subscribe(event => {
        if (event instanceof NavigationEnd) {
          if (event.url.includes('medical-chat')) {
            console.log('🔄 Navigation to medical chat detected, activating component');
            this.isComponentActive = true;

            // Restore scroll position if we have stored state
            this.restoreScrollPosition();

            // Force multiple scroll attempts
            this.forceScrollToBottomWithRetry();
          } else {
            console.log('🔄 Navigation away from medical chat detected, saving scroll state');
            this.isComponentActive = false;
            this.saveScrollPosition();
          }
        }
      });

    // Subscribe to active patient changes with immediate emission
    console.log('🩺 PASO 1: Suscribiéndose a activePatient$...');
    this.medicalStateService.activePatient$
      .pipe(takeUntil(this.destroy$))
      .subscribe((patient: any) => {
        console.log('💊 ============================================');
        console.log('💊 CHAT: Active patient subscription triggered');
        console.log('💊 Previous patient:', this.activePatient?.name || 'NONE');
        console.log('💊 New patient:', patient?.name || 'NONE');
        console.log('💊 Timestamp:', new Date().toISOString());
        console.log('💊 ============================================');

        // Update local state
        this.activePatient = patient;

        if (patient) {
          console.log('✅ CHAT HABILITADO: Chat enabled for patient:', patient.name);
          console.log('✅ Patient ID:', patient.id);
          console.log('✅ this.activePatient actualizado a:', this.activePatient.name);

          // Force scroll to bottom when patient changes
          this.forceScrollToBottomWithRetry();

          // Trigger change detection to update UI immediately
          this.cdr.detectChanges();
        } else {
          console.log('⚠️ CHAT DESHABILITADO: No hay paciente activo');
          console.log('⚠️ this.activePatient actualizado a: null');
        }
      });

    // Subscribe to recent patients count
    console.log('🩺 PASO 2: Suscribiéndose a recentPatients$...');
    this.medicalStateService.recentPatients$
      .pipe(takeUntil(this.destroy$))
      .subscribe((patients: Patient[]) => {
        console.log('👥 Recent patients updated:', patients.length);
        // Update local state if needed
      });

    // Subscribe to chat messages
    console.log('🩺 PASO 3: Suscribiéndose a currentChatMessages$...');
    this.medicalStateService.currentChatMessages$
      .pipe(takeUntil(this.destroy$))
      .subscribe((messages: ChatMessage[]) => {
        console.log('💬 Chat messages updated:', messages.length);
        this.chatMessages = messages;
        // Force scroll to bottom when messages change
        this.forceScrollToBottomWithRetry();
        this.cdr.detectChanges();
      });

    // Subscribe to streaming state
    console.log('🩺 PASO 4: Suscribiéndose a streaming state...');
    this.medicalStateService.isStreaming$
      .pipe(takeUntil(this.destroy$))
      .subscribe((streaming: boolean) => {
        console.log('📡 Streaming state:', streaming);
        this.isStreaming = streaming;
        this.cdr.detectChanges();
      });

    // Subscribe to streaming message content
    console.log('🩺 PASO 5: Suscribiéndose a streamingMessage$...');
    this.medicalStateService.streamingMessage$
      .pipe(takeUntil(this.destroy$))
      .subscribe((message: string) => {
        console.log('📡 Streaming message length:', message.length);
        this.streamingMessage = message;
        // Force scroll to bottom during streaming
        this.forceScrollToBottomWithRetry();
        this.cdr.detectChanges();
      });

    console.log('🩺 ============================================');
    console.log('🩺 MedicalChatComponent ngOnInit COMPLETED');
    console.log('🩺 Final activePatient:', this.activePatient?.name || 'NONE');
    console.log('🩺 ============================================');
  }

  /**
   * After view init lifecycle hook
   *
   * @description Ensures scroll to bottom when view is first initialized
   * Sets up IntersectionObserver and forces immediate scroll
   */
    ngAfterViewInit(): void {
    console.log('📄 ngAfterViewInit - Setting up observers and forcing scroll');

    // Set up observers for robust scroll handling
    this.setupScrollObserver();
    this.setupMutationObserver();

    // Mark component as active since view is initialized
    this.isComponentActive = true;

    // Force immediate scroll with retry mechanism
    this.forceScrollToBottomWithRetry();
  }

  /**
   * After view checked lifecycle hook
   *
   * @description Handles auto-scrolling to bottom when new messages arrive
   * or streaming content updates
   */
  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom && this.isComponentActive) {
      console.log('🔄 ngAfterViewChecked triggering scroll');
      this.immediateScrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  /**
   * Component destruction lifecycle hook
   *
   * @description Cleans up subscriptions and observers to prevent memory leaks
   */
    ngOnDestroy(): void {
    console.log('🧹 ngOnDestroy - Cleaning up observers and saving scroll state');

    // Save scroll position before destroying
    this.saveScrollPosition();

    // Clean up observers
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
    }

    this.isComponentActive = false;
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Determines if a message can be sent
   *
   * @returns True if message can be sent, false otherwise
   *
   * @description Validates that:
   * - Message has content (trimmed length > 0)
   * - Not currently streaming
   * - Patient is selected
   * - Message length is within limit (2000 chars)
   */
  get canSendMessage(): boolean {
    return this.currentMessage.trim().length > 0 &&
           !this.isStreaming &&
           this.activePatient &&
           this.currentMessage.length <= 2000;
  }

  /**
   * Handles Enter key press in message input
   *
   * @param event - Keyboard event
   *
   * @description Sends message on Enter, allows new line with Shift+Enter
   *
   * @example
   * ```typescript
   * // In template:
   * <textarea (keydown.enter)="onEnterPressed($event)">
   *
   * // Behavior:
   * // Enter -> Send message
   * // Shift+Enter -> New line
   * ```
   */
  onEnterPressed(event: any): void {
    if (event.shiftKey) {
      return; // Allow new line with Shift+Enter
    }

    event.preventDefault();
    if (this.canSendMessage) {
      this.sendMessage();
    }
  }

  /**
   * Handles input changes for auto-resizing textarea
   *
   * @param event - Input event from textarea
   *
   * @description Automatically adjusts textarea height based on content,
   * with a maximum height of 150px
   */
  onInputChange(event: any): void {
    const textarea = event.target as HTMLTextAreaElement;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    }
  }

  /**
   * Uses a quick action template in the message input
   *
   * @param action - Quick action object with label and text template
   *
   * @description Populates the message input with a pre-defined template
   * including the active patient's name
   *
   * @example
   * ```typescript
   * const action = { label: 'Síntomas', text: 'El paciente presenta los siguientes síntomas: ' };
   * this.useQuickAction(action);
   * // Result: "El paciente presenta los siguientes síntomas: Juan Pérez - "
   * ```
   */
  useQuickAction(action: any): void {
    if (this.activePatient) {
      this.currentMessage = `${action.text}${this.activePatient.name} - `;
    }
  }

  /**
   * Sends a message to the AI assistant
   *
   * @description Main method for sending medical consultation messages:
   * 1. Validates message can be sent
   * 2. Creates user message object
   * 3. Adds message to state
   * 4. Initiates streaming AI response
   * 5. Handles streaming chunks and errors
   *
   * @example
   * ```typescript
   * // Called when user clicks send button or presses Enter
   * this.sendMessage();
   *
   * // Process:
   * // 1. User message added to chat
   * // 2. Streaming AI response begins
   * // 3. Real-time chunks displayed
   * // 4. Complete response added to history
   * ```
   */
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

    // Get active session and document information
    const activeSession = this.chatSessionService.getActiveSession();

    if (!activeSession) {
      console.error('🚨 No active session found');
      this.medicalStateService.finishStreaming();

      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'No hay una sesión activa. Por favor, selecciona un paciente primero.',
        timestamp: new Date()
      };
      this.medicalStateService.addMessage(errorMessage);
      return;
    }

    // Create chat ask request for the new API
    const chatAskRequest: ChatAskRequest = {
      session_id: activeSession.session_id,
      user_id: activeSession.user_id,
      document_id: activeSession.document_id,
      question: messageContent
    };

    console.log('🩺 Sending chat ask request:', {
      session_id: chatAskRequest.session_id,
      user_id: chatAskRequest.user_id,
      document_id: chatAskRequest.document_id,
      question: chatAskRequest.question
    });

    // Stream response from new API
    this.apiService.sendChatMessage(chatAskRequest).subscribe({
      next: (chunk) => {
        console.log('📦 Received chunk:', chunk);

        if (chunk.type === 'content' && chunk.content) {
          // Accumulate streaming content
          const currentStream = this.streamingMessage + chunk.content;
          this.medicalStateService.updateStreamingMessage(currentStream);
        }

        if (chunk.type === 'end') {
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

        if (chunk.type === 'start') {
          console.log('🚀 Chat interaction started:', chunk.interaction_id);
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

  /**
   * Clears chat history for the current patient
   *
   * @description Removes all chat messages for the active patient from state
   *
   * @example
   * ```typescript
   * this.clearChat(); // Clears current patient's chat history
   * ```
   */
  /**
   * Clears the chat history for the active patient
   *
   * @description Removes all messages from the current patient's chat history
   *
   * @example
   * ```typescript
   * this.clearChat(); // Clears all messages for current patient
   * ```
   */
  clearChat(): void {
    if (this.activePatient) {
      this.medicalStateService.clearChatHistory(this.activePatient.id);
    }
  }

  /**
   * Copies message content to clipboard
   *
   * @param content - Message content to copy
   *
   * @description Uses navigator.clipboard API to copy message text
   *
   * @example
   * ```typescript
   * this.copyMessage('Diagnóstico: Hipertensión arterial');
   * // Content copied to clipboard
   * ```
   */
  copyMessage(content: string): void {
    navigator.clipboard.writeText(content);
    console.log('📋 Mensaje copiado al portapapeles');
  }

  /**
   * Records positive feedback for a message
   *
   * @param message - Message object that was liked
   *
   * @description Placeholder for message rating functionality
   */
  likeMessage(message: ChatMessage): void {
    console.log('👍 Mensaje valorado positivamente:', message);
  }

  /**
   * Repeats the last user message
   *
   * @param message - Message object to repeat (not used, finds last user message)
   *
   * @description Finds the most recent user message and puts it back in the input
   */
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

  /**
   * TrackBy function for message list optimization
   *
   * @param index - Index in the array
   * @param message - Message object
   * @returns Unique identifier for the message
   *
   * @description Improves Angular's change detection performance for message list
   */
  trackMessage(index: number, message: ChatMessage): any {
    return message.timestamp || index;
  }

  /**
   * Formats timestamp for display
   *
   * @param timestamp - Date object or undefined
   * @returns Formatted time string (HH:MM)
   *
   * @description Converts timestamp to localized time format for Spanish
   *
   * @example
   * ```typescript
   * const time = this.formatTime(new Date());
   * // Returns: "14:30"
   * ```
   */
  formatTime(timestamp: Date | undefined): string {
    if (!timestamp) return '';
    return timestamp.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Formats message content with enhanced markdown and medical formatting
   *
   * @param content - Raw message content
   * @returns HTML-formatted content string
   *
   * @description Applies comprehensive formatting for medical content including:
   * - Headers (##)
   * - Bold and italic text (**text**, *text*)
   * - Lists with bullet points
   * - Medical values with units highlighting
   * - Medical sections with styled headers
   * - Line break conversion
   *
   * @example
   * ```typescript
   * const formatted = this.formatMessageContent(`
   * ## Diagnóstico
   * **Hipertensión arterial**
   * - Presión sistólica: 150 (rango normal: 120-140)
   * - *Requiere tratamiento*
   * `);
   * // Returns: Fully formatted HTML with styles
   * ```
   */
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

  /**
   * Scrolls the messages container to the bottom
   *
   * @private
   * @description Automatically scrolls to show the latest message,
   * used when new messages arrive or during streaming. Enhanced with
   * multiple fallbacks to ensure reliable scrolling on navigation returns
   */
  private scrollToBottom(): void {
    try {
      if (this.messagesContainer?.nativeElement) {
        const container = this.messagesContainer.nativeElement;

        // Method 1: Direct scroll to bottom
        container.scrollTop = container.scrollHeight;

        // Method 2: Force scroll with requestAnimationFrame for better reliability
        requestAnimationFrame(() => {
          container.scrollTop = container.scrollHeight;

          // Method 3: Additional scroll after DOM updates to ensure it sticks
          setTimeout(() => {
            container.scrollTop = container.scrollHeight;
          }, 10);
        });

        console.log('📜 Scrolled to bottom - scrollTop:', container.scrollTop, 'scrollHeight:', container.scrollHeight);
      } else {
        console.warn('⚠️ Messages container not available for scrolling');
      }
    } catch (err) {
      console.error('Could not scroll to bottom:', err);
    }
  }

  /**
   * Forces scroll to bottom with smooth behavior
   *
   * @description Public method to force scroll to bottom, useful for navigation scenarios.
   * Enhanced with multiple attempts to ensure scroll works when returning from navigation
   */
  public forceScrollToBottom(): void {
    // Use the retry mechanism for maximum reliability
    this.forceScrollToBottomWithRetry();
  }

    /**
   * Immediately scrolls to bottom without relying on change detection flags
   *
   * @private
   * @description Direct scroll method using scroll anchor for more reliable positioning
   * Falls back to traditional scrolling if anchor is not available
   */
  private immediateScrollToBottom(): void {
    try {
      // Method 1: Use scroll anchor (most reliable)
      if (this.scrollAnchor?.nativeElement) {
        const anchor = this.scrollAnchor.nativeElement;
        anchor.scrollIntoView({
          behavior: 'auto',
          block: 'end',
          inline: 'nearest'
        });
        console.log('⚓ ANCHOR SCROLL - Using scroll anchor to bottom');
        return;
      }

      // Method 2: Fallback to traditional container scroll
      if (this.messagesContainer?.nativeElement) {
        const container = this.messagesContainer.nativeElement;

        // Force immediate scroll using multiple techniques
        container.scrollTop = container.scrollHeight;
        container.scrollTo(0, container.scrollHeight);
        container.scrollTo({
          top: container.scrollHeight,
          behavior: 'auto'
        });

        console.log('📜 FALLBACK SCROLL - scrollTop:', container.scrollTop, 'scrollHeight:', container.scrollHeight);
      } else {
        console.warn('⚠️ No scroll methods available');
      }
    } catch (err) {
      console.error('❌ Could not perform scroll:', err);
    }
  }

  /**
   * Sets up IntersectionObserver to detect when chat container becomes visible
   *
   * @private
   * @description Uses IntersectionObserver API to trigger scroll when container
   * becomes visible, useful for navigation scenarios
   */
  private setupScrollObserver(): void {
    if (!this.messagesContainer?.nativeElement || !('IntersectionObserver' in window)) {
      return;
    }

    this.scrollObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.1 && this.isComponentActive) {
          console.log('👁️ Chat container is visible, forcing scroll to bottom');
          this.forceScrollToBottomWithRetry();
        }
      });
    }, {
      threshold: [0.1, 0.5, 1.0] // Multiple thresholds for better detection
    });

    this.scrollObserver.observe(this.messagesContainer.nativeElement);
  }

  /**
   * Sets up MutationObserver to detect DOM changes in the messages container
   *
   * @private
   * @description Monitors DOM changes to automatically scroll when new messages are added
   */
  private setupMutationObserver(): void {
    if (!this.messagesContainer?.nativeElement || !('MutationObserver' in window)) {
      return;
    }

    this.mutationObserver = new MutationObserver((mutations) => {
      let shouldScroll = false;

      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          console.log('🔄 DOM mutation detected - new messages added');
          shouldScroll = true;
        }
      });

      if (shouldScroll && this.isComponentActive) {
        console.log('🔄 Triggering scroll due to DOM mutation');
        this.immediateScrollToBottom();
      }
    });

    // Observe the messages list container
    const messagesListContainer = this.messagesContainer.nativeElement.querySelector('.messages-list');
    if (messagesListContainer) {
      this.mutationObserver.observe(messagesListContainer, {
        childList: true,
        subtree: true
      });
    } else {
      // Fallback to observing the entire container
      this.mutationObserver.observe(this.messagesContainer.nativeElement, {
        childList: true,
        subtree: true
      });
    }
  }

  /**
   * Saves the current scroll position to localStorage
   *
   * @private
   * @description Stores scroll state for restoration when navigating back
   */
  private saveScrollPosition(): void {
    try {
      if (this.messagesContainer?.nativeElement && this.activePatient) {
        const container = this.messagesContainer.nativeElement;
        const scrollData = {
          patientId: this.activePatient.id,
          scrollTop: container.scrollTop,
          scrollHeight: container.scrollHeight,
          shouldBeAtBottom: container.scrollTop >= (container.scrollHeight - container.clientHeight - 50)
        };

        localStorage.setItem('medicalChatScrollState', JSON.stringify(scrollData));
        console.log('💾 Scroll position saved:', scrollData);
      }
    } catch (err) {
      console.error('❌ Failed to save scroll position:', err);
    }
  }

  /**
   * Restores the scroll position from localStorage
   *
   * @private
   * @description Restores previous scroll state, prioritizing bottom position
   */
  private restoreScrollPosition(): void {
    try {
      const scrollStateJson = localStorage.getItem('medicalChatScrollState');
      if (!scrollStateJson || !this.activePatient) {
        console.log('📍 No scroll state to restore or no active patient');
        return;
      }

      const scrollData = JSON.parse(scrollStateJson);

      if (scrollData.patientId === this.activePatient.id) {
        console.log('📍 Restoring scroll position:', scrollData);

        // If user was at bottom, always restore to bottom
        if (scrollData.shouldBeAtBottom) {
          console.log('📍 User was at bottom, forcing scroll to bottom');
          this.forceScrollToBottomWithRetry();
        }
        // Clear the saved state after restoration
        localStorage.removeItem('medicalChatScrollState');
      }
    } catch (err) {
      console.error('❌ Failed to restore scroll position:', err);
    }
  }

    /**
   * Forces scroll to bottom with multiple retry attempts
   *
   * @private
   * @description More aggressive scroll approach with multiple fallbacks
   */
  private forceScrollToBottomWithRetry(): void {
    if (!this.isComponentActive) {
      return;
    }

    console.log('🚀 Starting ultra-aggressive scroll to bottom with anchor technique');

    // Immediate attempt
    this.immediateScrollToBottom();

    // Use requestIdleCallback for non-blocking scroll attempts
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        if (this.isComponentActive) {
          this.immediateScrollToBottom();
        }
      });
    }

    // Scheduled attempts with shorter, more frequent delays
    const delays = [0, 5, 15, 30, 60, 120, 250];

    delays.forEach(delay => {
      setTimeout(() => {
        if (this.isComponentActive) {
          this.immediateScrollToBottom();
        }
      }, delay);
    });

    // Final attempts with requestAnimationFrame for perfect timing
    requestAnimationFrame(() => {
      if (this.isComponentActive) {
        this.immediateScrollToBottom();
        // Double attempt inside RAF
        setTimeout(() => {
          if (this.isComponentActive) {
            this.immediateScrollToBottom();
          }
        }, 50);
      }
    });
  }
}
