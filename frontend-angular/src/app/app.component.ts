import { Component, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef, ChangeDetectorRef, NgZone, CUSTOM_ELEMENTS_SCHEMA, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, filter } from 'rxjs/operators';

import { Patient } from './core/models/patient.model';
import { ChatMessage } from './core/models/chat.model';
import { MedicalStateService } from './core/services/medical-state.service';
import { ApiService } from './core/services/api.service';
import { StreamingService } from './core/services/streaming.service';
import { MarkdownPipe } from './shared/pipes/markdown.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe, RouterOutlet],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    <div class="app-container">
      <!-- Sidebar Panel -->
      <div class="sidebar-panel" [class.collapsed]="sidebarCollapsed">
        <!-- Normal Header -->
        <div class="sidebar-header" *ngIf="!sidebarCollapsed">
          <div class="header-content">
            <div class="logo-container">
              <div class="logo">T</div>
              <div>
                <h2 class="brand-title">
                  <span class="medical-icon">🩺</span>
                  TecSalud
                </h2>
                <p class="brand-subtitle">Asistente Virtual</p>
              </div>
            </div>
            <button class="collapse-btn" (click)="sidebarCollapsed = !sidebarCollapsed">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Collapsed Header -->
        <div class="sidebar-header-collapsed" *ngIf="sidebarCollapsed">
          <button class="expand-btn" (click)="sidebarCollapsed = false">T</button>
        </div>
        
        <!-- Main Content -->
        <div class="sidebar-content" *ngIf="!sidebarCollapsed">
          <!-- Search with Bamboo Tokens -->
          <div class="search-container">
            <div class="bamboo-search-group">
            <input 
                class="search-input bamboo-search-input"
              placeholder="Buscar paciente..."
                name="searchInput"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange()"
                [disabled]="isSearching"
              type="text"
            />
              <button 
                *ngIf="searchQuery"
                class="bamboo-clear-button"
                (click)="clearSearch()"
                title="Limpiar búsqueda">
                ✕
              </button>
            </div>
          </div>
          
          <!-- Patients List -->
          <div class="patients-container">
            <h3 class="patients-title">
              {{searchQuery ? (isSearching ? 'Buscando...' : 'Resultados (' + patientsToShow.length + ')') : 'Pacientes Recientes'}}
            </h3>
            
            <div class="patients-list">
              <!-- Loading -->
              <div *ngIf="isSearching" class="loading-state">
                <div class="loading-spinner"></div>
                <p>Buscando pacientes...</p>
              </div>
              
              <!-- Error -->
              <div *ngIf="searchError" class="error-state">
                <p>{{searchError}}</p>
              </div>
              
              <!-- No Results -->
              <div *ngIf="!isSearching && !searchError && patientsToShow.length === 0 && searchQuery" class="no-results">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"/>
                  <path d="m21 21-4.35-4.35"/>
                </svg>
                <p>No se encontraron pacientes</p>
              </div>
              
              <!-- Patient Cards -->
              <div 
                *ngFor="let patient of patientsToShow; trackBy: trackPatient"
                class="patient-card-html"
                [class.active]="activePatient?.id === patient.id"
                (click)="selectPatient(patient)">
                <div class="patient-content">
                  <div class="patient-avatar">
                    {{getPatientInitials(patient)}}
                  </div>
                  <div class="patient-info">
                    <div class="patient-name">{{patient.name}}</div>
                    <div class="patient-id">{{patient.age}} años • {{patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Femenino' : 'Otro'}}</div>
                     </div>
                  <div class="active-badge" *ngIf="activePatient?.id === patient.id">
                     Activo
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Collapsed Content -->
        <div class="sidebar-collapsed-content" *ngIf="sidebarCollapsed">
          <!-- Search Button -->
          <div class="collapsed-search">
            <button class="search-btn" (click)="sidebarCollapsed = false">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
          </div>
          
          <!-- Recent Patients -->
          <div class="collapsed-patients">
            <div 
              *ngFor="let patient of recentPatients.slice(0, 5); let i = index"
              class="collapsed-patient"
              [class.active]="activePatient?.id === patient.id"
              (click)="selectPatient(patient)"
              [title]="patient.name">
              <div class="collapsed-avatar">
                {{getPatientInitials(patient)}}
              </div>
              <div *ngIf="activePatient?.id === patient.id" class="active-indicator"></div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Main Panel -->
      <div class="main-panel">
        <!-- Header -->
        <div class="main-header">
          <div class="header-info">
            <h1 class="main-title">Copiloto Médico</h1>
            <p class="main-subtitle">Asistente Virtual TecSalud</p>
          </div>
          <div class="header-actions">
            <div *ngIf="activePatient" class="patient-context-horizontal">
              <div class="patient-avatar-small">{{getPatientInitials(activePatient!)}}</div>
              <span class="patient-name">{{activePatient!.name}}</span>
              <span class="patient-separator">•</span>
              <span class="patient-context">Contexto activo</span>
              </div>
            
            <!-- ⚙️ NAVIGATION DROPDOWN - USANDO CLASES CSS CON TOKENS BAMBOO -->
            <div class="nav-dropdown-container">
              <button class="nav-dropdown-toggle" 
                      (click)="toggleNavDropdown()"
                      title="Menú de navegación">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="gear-icon">
                  <defs>
                    <linearGradient id="gearGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style="stop-color:#0066cc;stop-opacity:1" />
                      <stop offset="100%" style="stop-color:#004499;stop-opacity:1" />
                    </linearGradient>
                    <filter id="gearShadow">
                      <feGaussianBlur in="SourceAlpha" stdDeviation="1"/>
                      <feOffset dx="0" dy="1" result="offsetblur"/>
                      <feFlood flood-color="rgba(0,0,0,0.2)"/>
                      <feComposite in2="offsetblur" operator="in"/>
                      <feMerge>
                        <feMergeNode/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  <path d="M12 8C9.79 8 8 9.79 8 12C8 14.21 9.79 16 12 16C14.21 16 16 14.21 16 12C16 9.79 14.21 8 12 8ZM12 14C10.9 14 10 13.1 10 12C10 10.9 10.9 10 12 10C13.1 10 14 10.9 14 12C14 13.1 13.1 14 12 14Z" fill="url(#gearGradient)" filter="url(#gearShadow)"/>
                  <path d="M19.43 12.98C19.47 12.66 19.5 12.34 19.5 12C19.5 11.66 19.47 11.34 19.43 11.02L21.54 9.37C21.73 9.22 21.78 8.95 21.66 8.73L19.66 5.27C19.54 5.05 19.27 4.97 19.05 5.05L16.56 6.05C16.04 5.65 15.48 5.32 14.87 5.07L14.49 2.42C14.46 2.18 14.25 2 14 2H10C9.75 2 9.54 2.18 9.51 2.42L9.13 5.07C8.52 5.32 7.96 5.66 7.44 6.05L4.95 5.05C4.72 4.96 4.46 5.05 4.34 5.27L2.34 8.73C2.21 8.95 2.27 9.22 2.46 9.37L4.57 11.02C4.53 11.34 4.5 11.67 4.5 12C4.5 12.33 4.53 12.66 4.57 12.98L2.46 14.63C2.27 14.78 2.21 15.05 2.34 15.27L4.34 18.73C4.46 18.95 4.73 19.03 4.95 18.95L7.44 17.95C7.96 18.35 8.52 18.68 9.13 18.93L9.51 21.58C9.54 21.82 9.75 22 10 22H14C14.25 22 14.46 21.82 14.49 21.58L14.87 18.93C15.48 18.68 16.04 18.34 16.56 17.95L19.05 18.95C19.28 19.04 19.54 18.95 19.66 18.73L21.66 15.27C21.78 15.05 21.73 14.78 21.54 14.63L19.43 12.98Z" fill="url(#gearGradient)" filter="url(#gearShadow)"/>
                </svg>
              </button>
              
              <!-- 📋 DROPDOWN MENU SIMPLE -->
              <div *ngIf="isNavDropdownOpen" class="simple-dropdown" (click)="closeNavDropdown()">
                <div class="dropdown-content" (click)="$event.stopPropagation()">
                  <div class="dropdown-header">
                    <h3>Navegación</h3>
            </div>
                  
                  <button class="dropdown-item" (click)="navigateTo('/chat')">
                    <span class="dropdown-icon">🩺</span>
                    <div class="dropdown-text">
                      <div class="dropdown-title">Copiloto Médico</div>
                      <div class="dropdown-subtitle">Asistente inteligente</div>
          </div>
                  </button>
                  
                  <button class="dropdown-item" (click)="navigateTo('/dashboard')">
                    <span class="dropdown-icon">📊</span>
                    <div class="dropdown-text">
                      <div class="dropdown-title">Dashboard</div>
                      <div class="dropdown-subtitle">Panel de control</div>
        </div>
                  </button>
                  
                  <button class="dropdown-item" (click)="navigateTo('/patients')">
                    <span class="dropdown-icon">👥</span>
                    <div class="dropdown-text">
                      <div class="dropdown-title">Gestión Pacientes</div>
                      <div class="dropdown-subtitle">Base de datos</div>
                    </div>
                  </button>
                  
                  <button class="dropdown-item" (click)="navigateTo('/test-bamboo')">
                    <span class="dropdown-icon">🧪</span>
                    <div class="dropdown-text">
                      <div class="dropdown-title">Test Bamboo</div>
                      <div class="dropdown-subtitle">Pruebas de componentes</div>
                    </div>
                  </button>
                  
                  <div class="dropdown-separator"></div>
                  
                  <button class="dropdown-item" (click)="navigateTo('/documents')">
                    <span class="dropdown-icon">📄</span>
                    <div class="dropdown-text">
                      <div class="dropdown-title">Subir Documentos</div>
                      <div class="dropdown-subtitle">Vectorización automática</div>
                    </div>
                  </button>
                  
                  <button class="dropdown-item" (click)="navigateTo('/documents/list')">
                    <span class="dropdown-icon">📋</span>
                    <div class="dropdown-text">
                      <div class="dropdown-title">Gestión Documentos</div>
                      <div class="dropdown-subtitle">Ver documentos vectorizados</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Chat Content / Router Outlet -->
        <div class="chat-container">
          
          <!-- 🎯 ROUTER OUTLET PARA PÁGINAS DE NAVEGACIÓN -->
          <router-outlet *ngIf="shouldShowRouterOutlet"></router-outlet>
          
          <div class="chat-area" *ngIf="!shouldShowRouterOutlet">
            <!-- Messages Area -->
            <div class="messages-area" #messagesArea>
              <!-- Welcome Message -->
              <div *ngIf="currentChat.length === 0" class="welcome-message">
                <div class="welcome-avatar">
                  <span class="heart-icon">💖</span>
                </div>
                <div class="welcome-content">
                  <div class="welcome-title">Copiloto Médico</div>
                  <div class="welcome-status">• En línea</div>
                  <div class="welcome-text">
                    {{activePatient 
                      ? '¡Hola! Soy tu Copiloto médico. Tengo acceso al expediente completo de ' + activePatient.name + '. ¿En qué puedo ayudarte hoy? Puedo consultar laboratorios, medicamentos, diagnósticos, estudios de imagen y más.'
                      : '👋 Hola, soy tu Copiloto médico. Selecciona un paciente del panel izquierdo para comenzar a consultar su expediente.'
                    }}
                  </div>
                </div>
              </div>
              
              <!-- Chat Messages -->
              <div *ngFor="let message of currentChat; trackBy: trackMessage" class="message-wrapper">
                <div class="message" [class.user]="message.role === 'user'" [class.assistant]="message.role === 'assistant'">
                  <div class="message-avatar">
                    <span *ngIf="message.role === 'user'">👤</span>
                    <span *ngIf="message.role === 'assistant'">AI</span>
                  </div>
                                     <div class="message-content">
                     <div class="message-bubble">
                       <div *ngIf="message.role === 'assistant'" [innerHTML]="message.content | markdown"></div>
                       <div *ngIf="message.role === 'user'">{{message.content}}</div>
                     </div>
                   </div>
                </div>
              </div>
              
              <!-- Streaming Message -->
              <div *ngIf="isStreaming" class="message-wrapper">
                <div class="message assistant">
                  <div class="message-avatar">
                    <span>AI</span>
                  </div>
                                     <div class="message-content">
                     <div class="message-bubble">
                      <div class="streaming-text" [title]="'Length: ' + streamingMessage.length">
                        {{ streamingMessage }}
                        <span *ngIf="streamingMessage.length === 0" class="thinking-text">
                          <span class="thinking-icon">🧠</span>
                          Pensando
                          <span class="thinking-dots">
                            <span class="thinking-dot">.</span>
                            <span class="thinking-dot">.</span>
                            <span class="thinking-dot">.</span>
                          </span>
                        </span>
                      </div>
                       <span class="cursor-blink">|</span>
                     </div>
                   </div>
                </div>
              </div>
              
              <!-- Loading -->
              <div *ngIf="isLoading && !isStreaming" class="loading-message">
                <div class="loading-dots">
                  <div class="dot"></div>
                  <div class="dot"></div>
                  <div class="dot"></div>
                </div>
                <p>Procesando consulta...</p>
              </div>
            </div>
            
            <!-- Input Area -->
            <div class="input-area">
              <div class="input-container">
                <input
                  #messageInput
                  name="messageInput"
                  [(ngModel)]="inputMessage"
                  (keypress)="onKeyPress($event)"
                  [disabled]="isLoading || !activePatient"
                  [placeholder]="activePatient ? 'Pregunta sobre el expediente...' : 'Selecciona un paciente primero...'"
                  class="message-input"
                  type="text"
                />
                <button
                  (click)="sendMessage()"
                  [disabled]="!inputMessage.trim() || !activePatient || isLoading"
                  class="send-button-premium"
                  [class.loading]="isLoading">
                  <div class="btn-content-premium">
                    <!-- ✈️ ÍCONO VECTORIAL DEL AVIÓN -->
                    <svg *ngIf="!isLoading" class="airplane-icon" viewBox="0 0 32 32" fill="none">
                      <defs>
                        <!-- Gradiente premium para el avión -->
                        <linearGradient id="planeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" style="stop-color:rgba(255,255,255,0.9);stop-opacity:1" />
                          <stop offset="100%" style="stop-color:rgba(255,255,255,0.7);stop-opacity:1" />
                        </linearGradient>
                        <!-- Sombra difuminada -->
                        <filter id="planeShadow">
                          <feGaussianBlur in="SourceAlpha" stdDeviation="2"/>
                          <feOffset dx="1" dy="1" result="offsetblur"/>
                          <feFlood flood-color="rgba(0,0,0,0.3)"/>
                          <feComposite in2="offsetblur" operator="in"/>
                          <feMerge>
                            <feMergeNode/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
                      
                      <!-- Estelas animadas de fondo -->
                      <g class="plane-trails">
                        <path d="M2 8L8 10" stroke="url(#planeGradient)" stroke-width="3" stroke-linecap="round" opacity="0.3" class="trail-1"/>
                        <path d="M3 12L10 14" stroke="url(#planeGradient)" stroke-width="2.5" stroke-linecap="round" opacity="0.4" class="trail-2"/>
                        <path d="M5 16L12 17" stroke="url(#planeGradient)" stroke-width="2" stroke-linecap="round" opacity="0.5" class="trail-3"/>
                      </g>
                      
                      <!-- Cuerpo principal del avión con sombra -->
                      <path d="M28 3L3 13L11 16L18 9L13 23L18 26L28 3Z" 
                            fill="url(#planeGradient)" 
                            stroke="rgba(255,255,255,1)" 
                            stroke-width="1.5"
                            stroke-linejoin="round"
                            filter="url(#planeShadow)"
                            class="plane-body"/>
                      
                      <!-- Detalles premium -->
                      <circle cx="20" cy="7" r="1.5" fill="rgba(255,255,255,1)" opacity="0.9" class="window-1"/>
                      <circle cx="17" cy="9" r="1" fill="rgba(255,255,255,1)" opacity="0.8" class="window-2"/>
                      
                      <!-- Brillo del fuselaje -->
                      <path d="M15 8L22 5" stroke="rgba(255,255,255,0.6)" stroke-width="1" stroke-linecap="round" class="shine"/>
                    </svg>
                    
                    <!-- 🔄 ÍCONO DE CARGA PREMIUM -->
                    <div *ngIf="isLoading" class="loading-airplane">
                      <div class="rotating-plane">✈️</div>
                    </div>
                    
                    <span class="premium-btn-text">
                      {{ isLoading ? 'Volando...' : 'Enviar' }}
                    </span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesArea') messagesArea!: ElementRef;
  
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;
  
  // Component State
  sidebarCollapsed = false;
  searchQuery = '';
  debouncedSearchQuery = '';
  searchResults: Patient[] = [];
  isSearching = false;
  searchError: string | null = null;
  
  // Window reference for TypeScript
  window = window;
  
  // Chat State
  inputMessage = '';
  isLoading = false;
  streamingMessage = '';
  isStreaming = false;
  private streamingContentRef = ''; // Like React's useRef
  
  // Data State
  activePatient: Patient | null = null;
  recentPatients: Patient[] = [];
  currentChat: ChatMessage[] = [];
  
  constructor(
    private medicalStateService: MedicalStateService,
    private apiService: ApiService,
    private streamingService: StreamingService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private router: Router,
    @Inject(DOCUMENT) private document: Document
  ) {}
  
  ngOnInit() {
    this.initializeComponent();
    this.setupSubscriptions();
    this.setupSearchDebounce();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }
  
  private initializeComponent() {
    this.medicalStateService.setActivePatient(null);
    // Recent patients are loaded automatically by the service
  }
  
  private setupSubscriptions() {
    // Active Patient
    this.medicalStateService.activePatient$
      .pipe(takeUntil(this.destroy$))
      .subscribe(patient => {
        this.activePatient = patient;
      });
    
    // Recent Patients
    this.medicalStateService.recentPatients$
      .pipe(takeUntil(this.destroy$))
      .subscribe(patients => {
        this.recentPatients = patients;
      });
    
    // Chat Messages
    this.medicalStateService.currentChatMessages$
      .pipe(takeUntil(this.destroy$))
      .subscribe(messages => {
        this.currentChat = messages;
        this.shouldScrollToBottom = true;
      });
    
    // 🎯 Router Events - Control Router Outlet Visibility
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        // Show router-outlet for specific routes, hide for chat
        const showRouterOutletRoutes = ['/documents', '/documents/list', '/dashboard', '/patients', '/test-bamboo'];
        this.shouldShowRouterOutlet = showRouterOutletRoutes.some(route => event.url.startsWith(route));
      });
  }
  
  private setupSearchDebounce() {
    // Debounce search query
    const searchSubject = new Subject<string>();
    searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.debouncedSearchQuery = query;
      this.performSearch(query);
    });
    
    // Store reference for onSearchChange
    (this as any).searchSubject = searchSubject;
  }
  
  onSearchChange() {
    (this as any).searchSubject.next(this.searchQuery);
  }

  clearSearch() {
    this.searchQuery = '';
    this.onSearchChange();
  }
  
  private async performSearch(query: string) {
    if (!query.trim()) {
      this.searchResults = [];
      this.searchError = null;
      return;
    }
    
    this.isSearching = true;
    this.searchError = null;
    
    try {
      const response = await this.apiService.searchPatients(query).toPromise();
      this.searchResults = response || [];
    } catch (error) {
      console.error('❌ Search error:', error);
      this.searchError = 'Error al buscar pacientes';
      this.searchResults = [];
    } finally {
      this.isSearching = false;
    }
  }
  
  get patientsToShow(): Patient[] {
    return this.searchQuery.trim() ? this.searchResults : this.recentPatients;
  }
  
  selectPatient(patient: Patient) {
    this.medicalStateService.setActivePatient(patient);
    
    // Record interaction using ApiService directly
    this.apiService.recordPatientInteraction(patient.id, {
      interaction_type: 'chat',
      summary: `Doctor accessed patient record`,
      timestamp: new Date().toISOString()
    }).subscribe({
      next: () => {}, // Silent success
      error: (error) => console.error('❌ Error recording interaction:', error)
    });
    
    // Navigate to chat if not already there
    if (window.location.pathname !== '/chat') {
      window.location.href = '/chat';
    }
  }
  
  async sendMessage() {
    if (!this.inputMessage.trim() || !this.activePatient) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: this.inputMessage,
      timestamp: new Date()
    };

    // Add user message
    this.medicalStateService.addMessage(userMessage);

    // Clear input and set loading
    const messageToSend = this.inputMessage;
    this.inputMessage = '';
    this.isLoading = true;

    // Reset streaming content (like React's useRef)
    this.streamingContentRef = '';

    // Update UI function for streaming
    const updateUI = () => {
      this.streamingMessage = this.streamingContentRef;
      this.cdr.detectChanges();
    };

    try {
      // Prepare messages for API
      const systemMessage: ChatMessage = {
        role: 'system' as const,
        content: `Contexto del paciente: ${this.activePatient.name}, ${this.activePatient.age} años. Expediente: ${this.activePatient.medical_record_number || this.activePatient.id}`
      };

      const contextualMessages: ChatMessage[] = [
        systemMessage,
        ...this.currentChat.slice(-5),
        userMessage
      ];
      
      // Set component flag immediately
      this.isStreaming = true;
      this.streamingMessage = '';
      this.isLoading = false;
      this.cdr.detectChanges();

      // Use real streaming service
      this.streamingService.streamMedicalChat({
        messages: contextualMessages,
        patient_id: this.activePatient.id,
        include_context: true,
        stream: true
      }).subscribe({
        next: (chunk) => {
          this.ngZone.run(() => {
            if (chunk.type === 'content' && chunk.content) {
              // Accumulate content in class property (like React's useRef)
              this.streamingContentRef += chunk.content;
              updateUI(); // Update UI immediately
            } else if (chunk.type === 'done') {
              
              // Handle completion locally
              if (this.streamingContentRef) {
                const assistantMessage: ChatMessage = {
                  role: 'assistant',
                  content: this.streamingContentRef,
                  timestamp: new Date()
                };
                this.medicalStateService.addMessage(assistantMessage);
              }
              
              // Reset local streaming state
              this.isStreaming = false;
              this.streamingMessage = '';
              this.streamingContentRef = '';
              updateUI();
            } else if (chunk.type === 'error') {
              console.error('❌ Streaming error:', chunk.error);
              
              // Reset local streaming state on error
              this.isStreaming = false;
              this.streamingMessage = '';
              this.streamingContentRef = '';
              updateUI();
              
              throw new Error(chunk.error || 'Streaming error');
            }
          });
        },
        error: (error) => {
          console.error('❌ Stream error:', error);
          
          // Reset local streaming state on error
          this.isStreaming = false;
          this.streamingMessage = '';
          this.streamingContentRef = '';
          updateUI();
          
          throw error;
        },
        complete: () => {
          // Complete handler - no additional logic needed as 'done' chunk handles everything
        }
      });

    } catch (error) {
      console.error('❌ Chat error:', error);
      
      // Reset local streaming state on error
      this.isStreaming = false;
      this.streamingMessage = '';
      this.streamingContentRef = '';
      this.cdr.detectChanges();
      
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Lo siento, hubo un error al procesar tu consulta. Por favor intenta de nuevo.',
        timestamp: new Date()
      };
      this.medicalStateService.addMessage(errorMessage);
    } finally {
      this.isLoading = false;
    }
  }
  
  onKeyPress(event: KeyboardEvent) {
    if (event.key === 'Enter' && !this.isLoading) {
      this.sendMessage();
    }
  }
  
  private scrollToBottom() {
    if (this.messagesArea) {
      const element = this.messagesArea.nativeElement;
      element.scrollTop = element.scrollHeight;
    }
  }
  
  // Utility methods
  getPatientInitials(patient: Patient): string {
    return patient.name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  }
  
  trackPatient(index: number, patient: Patient): string {
    return patient.id;
  }
  
  trackMessage(index: number, message: ChatMessage): string {
    return `${index}-${message.role}-${message.content.substring(0, 10)}`;
  }
  
  // 🎯 NAVIGATION DROPDOWN - SIMPLE BOOLEAN STATE
  isNavDropdownOpen = false;
  
  // 🎯 ROUTER OUTLET CONTROL
  shouldShowRouterOutlet = false;
  
  toggleNavDropdown(): void {
    this.isNavDropdownOpen = !this.isNavDropdownOpen;
  }
  
  closeNavDropdown(): void {
    this.isNavDropdownOpen = false;
  }

  navigateTo(route: string): void {
    this.closeNavDropdown();
    this.router.navigate([route]);
  }

}
