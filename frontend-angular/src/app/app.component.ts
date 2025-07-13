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
import { QuickPillsComponent } from './features/medical-chat/components/quick-pills/quick-pills.component';
import { DocumentPanelComponent } from './shared/components/document-panel/document-panel.component';

/**
 * Main application component for TecSalud Medical Assistant
 * 
 * @description Root component that provides the complete medical assistant interface
 * including sidebar patient management, medical AI chat, navigation, and responsive design.
 * Combines chat functionality with patient context management.
 * 
 * @example
 * ```typescript
 * // Used as the root component in main.ts
 * bootstrapApplication(AppComponent, appConfig);
 * 
 * // Provides the complete medical interface:
 * // - Patient search and selection
 * // - Medical AI chat with streaming responses
 * // - Navigation to different modules
 * // - Responsive sidebar design
 * ```
 * 
 * @features
 * - **Patient Management**: Search, select, and manage patient context
 * - **Medical AI Chat**: Streaming responses with markdown support
 * - **Navigation**: Dropdown menu for all application modules
 * - **Responsive Design**: Collapsible sidebar for mobile/tablet
 * - **Real-time Updates**: Live patient search and chat streaming
 * - **Context Awareness**: Patient-specific medical consultations
 * 
 * @userInterface
 * - Collapsible sidebar with patient search
 * - Main chat area with AI responses
 * - Header with navigation and patient context
 * - Premium send button with airplane animation
 * - Loading states and error handling
 * 
 * @state
 * - activePatient: Currently selected patient for medical context
 * - currentChat: Chat message history with AI
 * - searchResults: Real-time patient search results
 * - streamingMessage: Live AI response being typed
 * - sidebarCollapsed: Responsive sidebar state
 * 
 * @since 1.0.0
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, MarkdownPipe, RouterOutlet, QuickPillsComponent, DocumentPanelComponent],
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
            <button 
              class="collapse-btn" 
              (click)="sidebarCollapsed = !sidebarCollapsed"
              title="Contraer panel lateral">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 19l-7-7 7-7"/>
                <path d="M21 12H3" opacity="0.6"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- Collapsed Header -->
        <div class="sidebar-header-collapsed" *ngIf="sidebarCollapsed">
          <button 
            class="expand-btn" 
            (click)="sidebarCollapsed = false"
            title="Expandir panel lateral">
            T
          </button>
        </div>
        
        <!-- Main Content -->
        <div class="sidebar-content" *ngIf="!sidebarCollapsed">
          <!-- Search with Bamboo Tokens -->
          <div class="search-container">
            <div class="bamboo-search-group">
            <input 
                #searchInput
                class="search-input bamboo-search-input"
              placeholder="Buscar paciente..."
                name="searchInput"
              [value]="searchQuery"
              (input)="onSearchInput($event)"
              (focus)="onSearchFocus()"
              (blur)="onSearchBlur()"
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
            <div class="patients-title-container">
              <h3 class="patients-title">
                {{searchQuery ? (isSearching ? 'Buscando...' : 'Resultados (' + patientsToShow.length + ')') : 'Pacientes Recientes'}}
              </h3>
              <button 
                *ngIf="!searchQuery"
                class="collapse-toggle-btn"
                (click)="toggleRecentPatientsCollapse()"
                [class.collapsed]="recentPatientsCollapsed"
                title="{{recentPatientsCollapsed ? 'Expandir' : 'Contraer'}} pacientes recientes">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M6 9L12 15L18 9" [attr.transform]="recentPatientsCollapsed ? 'rotate(90 12 12)' : ''"/>
                </svg>
              </button>
            </div>
            
            <div class="patients-list" *ngIf="!recentPatientsCollapsed || searchQuery">
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
                  
                  <!-- COMMENTED OUT: Patient Management functionality -->
                  <!-- <button class="dropdown-item" (click)="navigateTo('/patients')">
                    <span class="dropdown-icon">👥</span>
                    <div class="dropdown-text">
                      <div class="dropdown-title">Gestión Pacientes</div>
                      <div class="dropdown-subtitle">Base de datos</div>
                    </div>
                  </button> -->
                  

                  
                  <div class="dropdown-separator"></div>
                  
                  <button class="dropdown-item" (click)="navigateTo('/admin-bulk-upload')">
                    <span class="dropdown-icon">🔧</span>
                    <div class="dropdown-text">
                      <div class="dropdown-title">Carga Masiva</div>
                      <div class="dropdown-subtitle">Procesamiento de lotes TecSalud</div>
                    </div>
                  </button>
                  
                  <button class="dropdown-item" (click)="navigateTo('/admin-pills')">
                    <span class="dropdown-icon">💊</span>
                    <div class="dropdown-text">
                      <div class="dropdown-title">Gestión de Pastillas</div>
                      <div class="dropdown-subtitle">Configurar preguntas rápidas</div>
                    </div>
                  </button>
                  

                  
                  <button class="dropdown-item" (click)="navigateTo('/documents')">
                    <span class="dropdown-icon">📄</span>
                    <div class="dropdown-text">
                      <div class="dropdown-title">Subir Documentos</div>
                      <div class="dropdown-subtitle">Vectorización automática</div>
                    </div>
                  </button>
                  
                  <!-- DISABLED: Expedientes Vectorizados -->
                  <!--
                  <button class="dropdown-item" (click)="navigateTo('/documents/list')">
                    <span class="dropdown-icon">📋</span>
                    <div class="dropdown-text">
                      <div class="dropdown-title">Gestión Documentos</div>
                      <div class="dropdown-subtitle">Ver documentos vectorizados</div>
                    </div>
                  </button>
                  -->
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
              
              <!-- Chat Messages with Bubble Design -->
              <div *ngFor="let message of currentChat; trackBy: trackMessage" 
                   class="message-wrapper"
                   [class.user-wrapper]="message.role === 'user'"
                   [class.assistant-wrapper]="message.role === 'assistant'">
                
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
                      <div class="message-text">
                        <div *ngIf="message.role === 'assistant'" [innerHTML]="message.content | markdown"></div>
                        <div *ngIf="message.role === 'user'">{{message.content}}</div>
                      </div>
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
                    {{getCurrentTime()}}
                  </div>
                </div>
              </div>
              
              <!-- Streaming Message with Bubble Design -->
              <div *ngIf="isStreaming" class="message-wrapper assistant-wrapper">
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
                        <span *ngIf="streamingMessage">{{ streamingMessage }}</span>
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
              <!-- Quick Pills Premium - Reutiliza patrón existente -->
              <app-quick-pills 
                *ngIf="activePatient && !isLoading"
                [patient]="activePatient"
                [showRotationIndicator]="true"
                (questionSelected)="onQuickPillSelected($event)">
              </app-quick-pills>
              
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
      
      <!-- Document Panel (Derecho) -->
      <app-document-panel
        [activePatient]="activePatient"
        [isCollapsed]="documentPanelCollapsed"
        (toggleCollapse)="onDocumentPanelToggle($event)">
      </app-document-panel>
    </div>
  `,
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy, AfterViewChecked {
  /** Reference to the messages area for auto-scrolling */
  @ViewChild('messagesArea') messagesArea!: ElementRef;
  @ViewChild('searchInput') searchInput!: ElementRef;
  
  /** Subject for component cleanup and unsubscription */
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();
  private shouldScrollToBottom = false;
  
  // =====================================
  // COMPONENT STATE PROPERTIES
  // =====================================
  
  /** Whether the sidebar is collapsed (responsive design) */
  sidebarCollapsed = false;
  
  /** Whether the recent patients section is collapsed */
  recentPatientsCollapsed = false;
  
  /** Whether the document panel (right) is collapsed */
  documentPanelCollapsed = true;
  
  /** Current search query for patient lookup */
  searchQuery = '';
  
  /** Debounced search query to prevent excessive API calls */
  debouncedSearchQuery = '';
  
  /** Search results from patient lookup API */
  searchResults: Patient[] = [];
  
  /** Flag indicating if user is currently searching */
  isSearching = false;
  
  /** Flag indicating if user is currently typing in search */
  isTyping = false;
  
  /** Flag indicating if search input has focus */
  searchInputHasFocus = false;
  
  /** Current search error message, if any */
  searchError: string | null = null;
  
  /** Window reference for TypeScript compatibility */
  window = window;
  
  // =====================================
  // CHAT STATE PROPERTIES
  // =====================================
  
  /** Current message being typed by user */
  inputMessage = '';
  
  /** Loading state for API calls */
  isLoading = false;
  
  /** Current streaming message from AI (live typing effect) */
  streamingMessage = '';
  
  /** Whether AI is currently streaming a response */
  isStreaming = false;
  
  /** Internal reference for streaming content management */
  private streamingContentRef = '';
  
  // =====================================
  // DATA STATE PROPERTIES
  // =====================================
  
  /** Currently selected patient for medical context */
  activePatient: Patient | null = null;
  
  /** List of recent patients loaded on component initialization */
  recentPatients: Patient[] = [];
  
  /** List of patients to show in the UI (either search results or recent patients) */
  patientsToShow: Patient[] = [];
  
  /** Array of chat messages for the current conversation */
  currentChat: ChatMessage[] = [];
  
  /**
   * Creates an instance of AppComponent
   * 
   * @param medicalStateService - Service for medical state management
   * @param apiService - Service for API communication
   * @param streamingService - Service for AI response streaming
   * @param cdr - Angular change detector
   * @param ngZone - Angular zone for performance optimization
   * @param router - Angular router for navigation
   * @param document - Document reference for DOM manipulation
   */
  constructor(
    private medicalStateService: MedicalStateService,
    private apiService: ApiService,
    private streamingService: StreamingService,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone,
    private router: Router,
    @Inject(DOCUMENT) private document: Document
  ) {}
  
  /**
   * Component initialization lifecycle hook
   * 
   * @description Initializes all component functionality including subscriptions,
   * search debouncing, and initial state setup.
   */
  ngOnInit() {
    this.initializeComponent();
    this.setupSubscriptions();
    this.setupSearchDebounce();
  }
  
  /**
   * Component destruction lifecycle hook
   * 
   * @description Cleans up subscriptions to prevent memory leaks
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  /**
   * After view checked lifecycle hook
   * 
   * @description Handles auto-scrolling to bottom when new messages arrive
   */
  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }
  
  /**
   * Initializes component state and dependencies
   * 
   * @private
   * @description Sets up initial patient state and loads recent patients.
   * Now preserves persisted state from localStorage.
   */
  private initializeComponent() {
    // Check if there's persisted state
    const stateInfo = this.medicalStateService.getPersistedStateInfo();
    
    if (stateInfo.hasActivePatient) {
      console.log('🔄 TecSalud: Estado restaurado desde localStorage', {
        pacienteActivo: stateInfo.hasActivePatient,
        pacientesRecientes: stateInfo.recentPatientsCount,
        historialesChat: stateInfo.chatHistoryEntries,
        tamañoStorage: `${Math.round(stateInfo.storageSize / 1024)}KB`
      });
    } else {
      console.log('🆕 TecSalud: Sesión nueva iniciada');
    }
    
    // Don't clear active patient - let persistence handle it
    // Recent patients are loaded automatically by the service
  }
  
  /**
   * Sets up reactive subscriptions for component state management
   * 
   * @private
   * @description Subscribes to active patient, recent patients, and chat state changes
   */
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
        this.updatePatientsToShow();
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
        const showRouterOutletRoutes = ['/documents', '/dashboard', '/patients', '/admin-bulk-upload', '/admin-pills'];
        this.shouldShowRouterOutlet = showRouterOutletRoutes.some(route => event.url.startsWith(route));
      });
  }
  
  private setupSearchDebounce() {
    // Debounce search query
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.isTyping = false;
      this.debouncedSearchQuery = query;
      this.performSearch(query);
    });
  }
  
  onSearchInput(event: Event) {
    const target = event.target as HTMLInputElement;
    this.searchQuery = target.value;
    this.isTyping = true;
    
    // If field is completely empty, immediately show recent patients
    if (!this.searchQuery.trim()) {
      this.searchResults = [];
      this.searchError = null;
      this.isSearching = false;
      this.updatePatientsToShow();
      console.log('🔍 Campo vaciado - mostrando pacientes recientes inmediatamente');
    }
    
    // Use setTimeout to avoid blocking the input
    setTimeout(() => {
      this.searchSubject.next(this.searchQuery);
    }, 0);
  }

  onSearchFocus() {
    this.isTyping = true;
    this.searchInputHasFocus = true;
  }

  onSearchBlur() {
    this.isTyping = false;
    this.searchInputHasFocus = false;
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.searchError = null;
    this.isSearching = false;
    this.isTyping = false;
    this.updatePatientsToShow(); // Use the improved logic instead of force update
    
    // Maintain focus on the input
    if (this.searchInput?.nativeElement) {
      this.searchInput.nativeElement.value = '';
      setTimeout(() => {
        this.searchInput.nativeElement.focus();
      }, 0);
    }
    
    this.searchSubject.next('');
    console.log('🧹 Búsqueda limpiada - mostrando pacientes recientes');
  }
  
  private async performSearch(query: string) {
    if (!query.trim()) {
      this.searchResults = [];
      this.searchError = null;
      this.isSearching = false;
      this.updatePatientsToShow(); // This will now show recent patients immediately
      console.log('🔍 Búsqueda vacía - mostrando pacientes recientes');
      return;
    }
    
    this.isSearching = true;
    this.searchError = null;
    console.log('🔍 Buscando pacientes:', query);
    
    try {
      const response = await this.apiService.searchPatients(query).toPromise();
      this.searchResults = response || [];
      this.isSearching = false;
      this.updatePatientsToShow();
      console.log('✅ Búsqueda completada:', this.searchResults.length, 'resultados');
    } catch (error) {
      console.error('❌ Search error:', error);
      this.searchError = 'Error al buscar pacientes';
      this.searchResults = [];
      this.isSearching = false;
      this.updatePatientsToShow();
    }
  }
  
  private updatePatientsToShow() {
    // Only block updates when user is typing AND there's text in the search
    // Allow updates when search is empty to show recent patients
    if ((this.isTyping || this.searchInputHasFocus) && this.searchQuery.trim()) {
      return;
    }
    
    // Only update if the list would actually change
    const newList = this.searchQuery.trim() ? this.searchResults : this.recentPatients;
    if (JSON.stringify(this.patientsToShow) !== JSON.stringify(newList)) {
      this.patientsToShow = newList;
      console.log('📋 Lista de pacientes actualizada:', this.searchQuery.trim() ? 'Resultados de búsqueda' : 'Pacientes recientes', newList.length);
    }
  }
  
  private forceUpdatePatientsToShow() {
    this.patientsToShow = this.searchQuery.trim() ? this.searchResults : this.recentPatients;
  }
  
  selectPatient(patient: Patient) {
    console.log('🎯 AppComponent.selectPatient called for:', patient.name);
    
    // Use the centralized method that guarantees state preservation
    this.medicalStateService.selectPatientAndNavigate(patient, this.router).then((success) => {
      if (success) {
        console.log('✅ Patient selection successful:', patient.name);
        
        // Record interaction using ApiService directly
        this.apiService.recordPatientInteraction(patient.id, {
          interaction_type: 'chat',
          summary: `Doctor accessed patient record from main interface`,
          timestamp: new Date().toISOString()
        }).subscribe({
          next: () => {}, // Silent success
          error: (error) => console.error('❌ Error recording interaction:', error)
        });
      } else {
        console.error('❌ Patient selection failed for:', patient.name);
      }
    });
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

  /**
   * Handle quick pill selection - reutiliza patrón del chat-input.component.ts
   */
  onQuickPillSelected(questionText: string): void {
    // Reutiliza la misma lógica de insertQuickAction existente
    this.inputMessage = questionText;
    
    // Focus en el input después de un delay corto
    setTimeout(() => {
      const messageInput = document.querySelector('.message-input') as HTMLInputElement;
      if (messageInput) {
        messageInput.focus();
        messageInput.setSelectionRange(messageInput.value.length, messageInput.value.length);
      }
    }, 100);
  }

  addDocumentReference(message: string): string {
    // Agregar referencia simple a documentos si hay paciente activo
    if (this.activePatient && message.trim()) {
      return message + '\n\n📚 **Referencias disponibles:** [Ver expedientes del paciente](action:open-documents)';
    }
    return message;
  }

  openDocumentsFromChat(): void {
    if (this.documentPanelCollapsed) {
      this.toggleDocumentPanel();
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

  toggleRecentPatientsCollapse(): void {
    this.recentPatientsCollapsed = !this.recentPatientsCollapsed;
  }

  toggleDocumentPanel(): void {
    this.documentPanelCollapsed = !this.documentPanelCollapsed;
  }

  onDocumentPanelToggle(isCollapsed: boolean): void {
    this.documentPanelCollapsed = isCollapsed;
  }

  navigateTo(route: string): void {
    this.closeNavDropdown();
    this.router.navigate([route]);
  }

  onDropdownClick(route: string): void {
    this.navigateTo(route);
  }
  
  getCurrentTime(): string {
    return new Date().toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'});
  }

  /**
   * Clears all persisted state and resets the application
   * 
   * @description Useful for logout or reset functionality
   */
  clearPersistedState(): void {
    this.medicalStateService.clearPersistedState();
    console.log('🧹 Estado de la aplicación limpiado');
  }

  /**
   * Gets information about current persisted state
   * 
   * @returns Object with state persistence information
   */
  getPersistedStateInfo() {
    return this.medicalStateService.getPersistedStateInfo();
  }

  /**
   * Checks if the application has persisted state
   * 
   * @returns True if there's saved state in localStorage
   */
  hasPersistedState(): boolean {
    return this.medicalStateService.hasPersistedState();
  }

}
