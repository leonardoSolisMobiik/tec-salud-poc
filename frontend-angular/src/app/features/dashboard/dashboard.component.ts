import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, UiStateService } from '@core/services';

/**
 * Dashboard component for TecSalud Medical Assistant main interface
 * 
 * @description Main dashboard providing an overview of the medical assistant system
 * including quick actions for core functionalities, system status monitoring,
 * and navigation to different medical modules.
 * 
 * @example
 * ```typescript
 * // Used automatically via routing
 * // Route: '/dashboard' (default route)
 * ```
 * 
 * @features
 * - Quick access to medical chat AI
 * - Patient management navigation
 * - Document management access
 * - Real-time backend health monitoring
 * - System notification testing
 * - Responsive grid layout for action cards
 * 
 * @uiComponents
 * - Action cards with hover effects
 * - System status indicator
 * - Toast notification testing
 * - Professional medical styling
 * 
 * @since 1.0.0
 */
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard-container">
      <h1>TecSalud Medical Assistant</h1>
      <p>Sistema de Asistente Médico con IA</p>
      
      <div class="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div class="action-cards">
          <a routerLink="/chat" class="action-card">
            <h3>🩺 Chat Médico IA</h3>
            <p>Consulta médica asistida por inteligencia artificial</p>
          </a>
          <a routerLink="/patients" class="action-card">
            <h3>👥 Gestión de Pacientes</h3>
            <p>Administra los registros de pacientes</p>
          </a>
          <a routerLink="/documents" class="action-card">
            <h3>📄 Gestión de Documentos</h3>
            <p>Administra documentos médicos y análisis</p>
          </a>
        </div>
      </div>
      
      <div class="system-status">
        <h3>Estado del Sistema</h3>
        <p>Backend: {{ backendStatus }}</p>
        <button class="test-btn" (click)="testToast()">Probar Toast</button>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    h1 {
      color: var(--medical-blue);
      margin-bottom: 0.5rem;
    }
    
    .quick-actions {
      margin-top: 3rem;
    }
    
    .action-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
    }
    
    .action-card {
      padding: 1.5rem;
      background: var(--medical-surface);
      border: 1px solid var(--medical-divider);
      border-radius: 8px;
      text-decoration: none;
      color: inherit;
      transition: all 0.3s ease;
      
      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }
      
      h3 {
        color: var(--medical-blue);
        margin-bottom: 0.5rem;
      }
      
      p {
        color: var(--medical-text-secondary);
      }
    }


    
    .system-status {
      margin-top: 3rem;
      padding: 1rem;
      background: var(--medical-context-active);
      border-radius: 4px;
      
      .test-btn {
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background: var(--medical-blue);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        
        &:hover {
          background: var(--medical-blue);
          opacity: 0.9;
        }
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  /** Current backend connection status message */
  backendStatus = 'Verificando...';
  
  /**
   * Creates an instance of DashboardComponent
   * 
   * @param apiService - Service for backend API communication
   * @param uiState - Service for UI state management and notifications
   */
  constructor(
    private apiService: ApiService,
    private uiState: UiStateService
  ) {}
  
  /**
   * Component initialization lifecycle hook
   * 
   * @description Automatically checks backend health status when component loads
   */
  ngOnInit() {
    this.checkBackendStatus();
  }
  
  /**
   * Checks the health status of the backend API
   * 
   * @description Performs a health check against the backend API and updates
   * the status display. Shows connection status and version information.
   * 
   * @example
   * ```typescript
   * // Called automatically on init, can also be called manually
   * this.checkBackendStatus();
   * ```
   * 
   * @updates backendStatus property with current connection state
   */
  checkBackendStatus() {
    this.apiService.checkHealth().subscribe({
      next: (response) => {
        this.backendStatus = `Conectado ✓ - v${response.version}`;
      },
      error: (error) => {
        this.backendStatus = 'No disponible';
        console.error('Backend health check failed:', error);
      }
    });
  }
  
  /**
   * Tests the toast notification system
   * 
   * @description Displays a test success toast to verify the notification
   * system is working correctly. Useful for system diagnostics.
   * 
   * @example
   * ```typescript
   * // Triggered by clicking the test button
   * this.testToast();
   * ```
   * 
   * @emits Success toast notification
   */
  testToast() {
    this.uiState.showSuccessToast('¡El sistema de notificaciones funciona correctamente!');
  }
}