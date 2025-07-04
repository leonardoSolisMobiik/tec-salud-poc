import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, UiStateService } from '@core/services';

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
            <h3>Chat Médico</h3>
            <p>Consulta con el asistente de IA</p>
          </a>
          <a routerLink="/patients" class="action-card">
            <h3>Gestión de Pacientes</h3>
            <p>Administra los registros de pacientes</p>
          </a>
          <a routerLink="/test-bamboo" class="action-card test-card">
            <h3>🧪 Test Bamboo</h3>
            <p>Pruebas de integración Bamboo Design System</p>
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
    
    .test-card {
      border: 2px dashed #ff9800 !important;
      background: #fff3e0 !important;
      
      h3 {
        color: #ff9800 !important;
      }
    }
  `]
})
export class DashboardComponent implements OnInit {
  backendStatus = 'Verificando...';
  
  constructor(
    private apiService: ApiService,
    private uiState: UiStateService
  ) {}
  
  ngOnInit() {
    this.checkBackendStatus();
  }
  
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
  
  testToast() {
    this.uiState.showSuccessToast('¡El sistema de notificaciones funciona correctamente!');
  }
}