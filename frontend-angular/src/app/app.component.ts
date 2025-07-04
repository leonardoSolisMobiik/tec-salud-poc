import { Component, OnInit, OnDestroy, AfterViewChecked, ViewChild, ElementRef, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';
import { trigger, state, style, transition, animate } from '@angular/animations';

// Core services
import { MedicalStateService, ApiService, StreamingService } from '@core/services';
import { Patient, ChatMessage } from '@core/models';

// Bamboo Components
import { BmbCardComponent } from '@ti-tecnologico-de-monterrey-oficial/ds-ng';

// Pipes
import { MarkdownPipe } from './shared/pipes/markdown.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BmbCardComponent,
    MarkdownPipe
  ],
  animations: [
    trigger('slideInOut', [
      state('in', style({transform: 'translateX(0)'})),
      transition('void => *', [
        style({transform: 'translateX(-100%)'}),
        animate(300)
      ])
    ])
  ],
  template: `
    <div class="app-container">
      <!-- Sidebar Panel -->
      <div class="sidebar-panel" [class.collapsed]="sidebarCollapsed">
        <!-- Header -->
        <div class="sidebar-header" *ngIf="!sidebarCollapsed">
          <div class="header-content">
            <div class="logo-container">
              <div class="logo">T</div>
              <div class="brand-info">
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
          <!-- Search -->
          <div class="search-container">
            <input 
              class="search-input"
              placeholder="Buscar paciente..."
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange()"
              type="text"
            />
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
              <bmb-card 
                *ngFor="let patient of patientsToShow; trackBy: trackPatient"
                class="patient-card"
                [class.active]="activePatient?.id === patient.id"
                (click)="selectPatient(patient)"
                type="normal">
                <div class="patient-content">
                  <div class="patient-avatar">
                    {{getPatientInitials(patient)}}
                  </div>
                  <div class="patient-info">
                    <div class="patient-name">{{patient.name}}</div>
                                         <div class="patient-meta">
                       <span class="patient-age">{{patient.age}} años</span>
                       <span class="patient-gender">{{patient.gender === 'M' ? 'Masculino' : patient.gender === 'F' ? 'Femenino' : 'Otro'}}</span>
                     </div>
                   </div>
                   <div class="patient-status" [class.active]="activePatient?.id === patient.id">
                     Activo
                   </div>
                </div>
              </bmb-card>
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
            <div *ngIf="activePatient" class="patient-indicator">
              <div class="patient-avatar-small">{{getPatientInitials(activePatient)}}</div>
              <div class="patient-info-small">
                <div class="name">{{activePatient.name}}</div>
                <div class="context">Contexto activo</div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Chat Content -->
        <div class="chat-container">
          <div class="chat-area">
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
                       <div class="streaming-text" [title]="'Length: ' + streamingMessage.length">{{ streamingMessage }}<span *ngIf="streamingMessage.length === 0">Pensando...</span></div>
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
                  class="send-button"
                  [class.loading]="isLoading">
                  <span *ngIf="!isLoading">Enviar</span>
                  <span *ngIf="isLoading">Enviando...</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .app-container {
      display: grid;
      grid-template-columns: 320px 1fr;
      height: 100vh;
      overflow: hidden;
      transition: grid-template-columns 0.3s ease;
    }
    
    .app-container:has(.sidebar-panel.collapsed) {
      grid-template-columns: 60px 1fr;
    }
    
    /* Sidebar Styles */
    .sidebar-panel {
      background: #ffffff;
      border-right: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: all 0.3s ease;
    }
    
    .sidebar-header {
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      background: #ffffff;
    }
    
    .header-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    
    .logo-container {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }
    
    .logo {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: #0066cc;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 16px;
    }
    
    .brand-title {
      color: #111827;
      font-size: 18px;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .brand-subtitle {
      color: #6b7280;
      font-size: 14px;
      margin: 0;
    }
    
    .medical-icon {
      font-size: 16px;
    }
    
    .collapse-btn {
      background: transparent;
      border: none;
      color: #6b7280;
      cursor: pointer;
      padding: 8px;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
    }
    
    .collapse-btn:hover {
      background: #f3f4f6;
    }
    
    .collapse-btn svg {
      width: 18px;
      height: 18px;
    }
    
    .sidebar-header-collapsed {
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
      background: #ffffff;
      display: flex;
      justify-content: center;
    }
    
    .expand-btn {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 18px;
      border: none;
      cursor: pointer;
      box-shadow: 0 2px 8px rgba(0, 102, 204, 0.3);
      transition: all 0.2s ease;
    }
    
    .expand-btn:hover {
      transform: scale(1.05);
    }
    
    .sidebar-content {
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .search-container {
      padding: 12px 16px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    
    .search-input {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s ease;
      margin-bottom: 12px;
    }
    
    .search-input:focus {
      border-color: #0066cc;
      box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
    }
    
    .patients-container {
      padding: 12px 8px;
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    
    .patients-title {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin: 0 0 16px 0;
      padding: 0 8px;
    }
    
    .patients-list {
      flex: 1;
      overflow: auto;
      padding-bottom: 12px;
    }
    
    .patient-card {
      margin-bottom: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .patient-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 102, 204, 0.15);
    }
    
    .patient-card.active {
      border-color: #0066cc;
      background-color: #f0f7ff;
      box-shadow: 0 2px 8px rgba(0, 102, 204, 0.2);
    }
    
    .patient-content {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
    }
    
    .patient-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #0066cc;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }
    
    .patient-info {
      flex: 1;
    }
    
    .patient-name {
      font-weight: 600;
      color: #111827;
      margin-bottom: 4px;
    }
    
    .patient-meta {
      display: flex;
      gap: 8px;
      font-size: 12px;
      color: #6b7280;
    }
    
    .patient-status {
      font-size: 12px;
      padding: 4px 8px;
      border-radius: 12px;
      background: #f3f4f6;
      color: #6b7280;
    }
    
    .patient-status.active {
      background: #dcfce7;
      color: #16a34a;
    }
    
    .loading-state, .error-state, .no-results {
      text-align: center;
      padding: 40px 16px;
      color: #6b7280;
    }
    
    .loading-spinner {
      width: 24px;
      height: 24px;
      border: 2px solid #e5e7eb;
      border-top: 2px solid #0066cc;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 12px;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    .no-results svg {
      width: 32px;
      height: 32px;
      margin-bottom: 12px;
    }
    
    .sidebar-collapsed-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      background: linear-gradient(180deg, #f9fafb 0%, #ffffff 100%);
    }
    
    .collapsed-search {
      padding: 12px;
      display: flex;
      justify-content: center;
    }
    
    .search-btn {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #6b7280;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.2s ease;
    }
    
    .search-btn:hover {
      transform: scale(1.05);
    }
    
    .search-btn svg {
      width: 16px;
      height: 16px;
    }
    
    .collapsed-patients {
      flex: 1;
      padding: 0 8px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      align-items: center;
    }
    
    .collapsed-patient {
      position: relative;
      display: flex;
      justify-content: center;
      padding: 8px;
      cursor: pointer;
    }
    
    .collapsed-avatar {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      background: #ffffff;
      border: 2px solid #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #0066cc;
      font-weight: 600;
      font-size: 14px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }
    
    .collapsed-patient.active .collapsed-avatar {
      background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
      color: white;
      border: none;
      box-shadow: 0 4px 12px rgba(0, 102, 204, 0.4);
    }
    
    .active-indicator {
      position: absolute;
      bottom: -2px;
      right: -2px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #10b981;
      border: 2px solid #ffffff;
      box-shadow: 0 2px 4px rgba(16, 185, 129, 0.4);
    }
    
    /* Main Panel Styles */
    .main-panel {
      background: #f9fafb;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .main-header {
      padding: 16px;
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .main-title {
      font-size: 24px;
      font-weight: 600;
      color: #111827;
      margin: 0;
    }
    
    .main-subtitle {
      color: #6b7280;
      font-size: 14px;
      margin: 0;
    }
    
    .patient-indicator {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      background: #f0f7ff;
      border-radius: 8px;
    }
    
    .patient-avatar-small {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #0066cc;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 12px;
    }
    
    .patient-info-small .name {
      font-weight: 600;
      color: #111827;
      font-size: 14px;
    }
    
    .patient-info-small .context {
      color: #0066cc;
      font-size: 12px;
    }
    
    .chat-container {
      flex: 1;
      padding: 16px;
      overflow: hidden;
    }
    
    .chat-area {
      background: #ffffff;
      border-radius: 12px;
      height: 100%;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border: 1px solid #e5e7eb;
    }
    
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    }
    
    .welcome-message {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #f0f7ff;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .welcome-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 18px;
      flex-shrink: 0;
      box-shadow: 0 4px 12px rgba(0, 102, 204, 0.4);
    }
    
    .welcome-title {
      font-weight: 600;
      color: #0052a3;
      margin-bottom: 4px;
    }
    
    .welcome-status {
      font-size: 12px;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .welcome-text {
      color: #111827;
      line-height: 1.5;
    }
    
    .message-wrapper {
      margin-bottom: 16px;
    }
    
    .message {
      display: flex;
      gap: 12px;
    }
    
    .message.user {
      flex-direction: row-reverse;
    }
    
    .message-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      font-size: 14px;
      flex-shrink: 0;
    }
    
    .message.user .message-avatar {
      background: #e5e7eb;
      color: #111827;
    }
    
    .message.assistant .message-avatar {
      background: #0066cc;
      color: white;
    }
    
    .message-content {
      flex: 1;
      max-width: 70%;
    }
    
    .message-bubble {
      padding: 12px;
      border-radius: 8px;
      color: #111827;
    }
    
    .message.user .message-bubble {
      background: #f0f7ff;
    }
    
    .message.assistant .message-bubble {
      background: #f9fafb;
    }
    
    .streaming-text {
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.6;
      color: #111827;
    }
    
    .cursor-blink {
      display: inline-block;
      width: 8px;
      height: 1em;
      background: #0066cc;
      animation: blink 1s infinite;
      margin-left: 2px;
    }
    
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
    
    .loading-message {
      text-align: center;
      padding: 20px;
      color: #6b7280;
    }
    
    .loading-dots {
      display: flex;
      justify-content: center;
      gap: 4px;
      margin-bottom: 8px;
    }
    
    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #0066cc;
      animation: dot-pulse 1.5s infinite;
    }
    
    .dot:nth-child(2) {
      animation-delay: 0.2s;
    }
    
    .dot:nth-child(3) {
      animation-delay: 0.4s;
    }
    
    @keyframes dot-pulse {
      0%, 80%, 100% { transform: scale(0.8); opacity: 0.5; }
      40% { transform: scale(1.2); opacity: 1; }
    }
    
    .input-area {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      background: #ffffff;
    }
    
    .input-container {
      display: flex;
      gap: 12px;
    }
    
    .message-input {
      flex: 1;
      padding: 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s ease;
    }
    
    .message-input:focus {
      border-color: #0066cc;
      box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
    }
    
    .message-input:disabled {
      background: #f9fafb;
      color: #9ca3af;
      cursor: not-allowed;
    }
    
    .send-button {
      padding: 12px 24px;
      background: #0066cc;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    
    .send-button:hover:not(:disabled) {
      background: #0052a3;
      transform: translateY(-1px);
    }
    
    .send-button:disabled {
      background: #9ca3af;
      cursor: not-allowed;
      transform: none;
    }
    
    .send-button.loading {
      position: relative;
      overflow: hidden;
    }
    
    .send-button.loading::after {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      animation: loading-shine 1.5s infinite;
    }
    
    @keyframes loading-shine {
      0% { left: -100%; }
      100% { left: 100%; }
    }
    
    /* Responsive */
    @media (max-width: 768px) {
      .app-container {
        grid-template-columns: 1fr;
      }
      
      .sidebar-panel {
        display: none;
      }
      
      .message-content {
        max-width: 85%;
      }
    }
  `]
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
    private ngZone: NgZone
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

    // Remove all streaming message subscriptions - manage completely locally
    // this.medicalStateService.streamingMessage$.subscribe(...);
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
  

}
