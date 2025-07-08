import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService, UiStateService } from '@core/services';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <!-- 🚨 BANNER DE PRUEBA BAMBOO EN DASHBOARD -->
    <div class="bamboo-test-banner">
      <div class="test-content">
        <span class="test-icon">🎯</span>
        <span class="test-text">BAMBOO TOKENS FUNCIONANDO EN DASHBOARD</span>
        <span class="test-icon">✨</span>
      </div>
    </div>

    <div class="dashboard-container">
      <h1>TecSalud Medical Assistant</h1>
      <p>Sistema de Asistente Médico con IA</p>
      
      <div class="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div class="action-cards">
          <a routerLink="/chat" class="action-card chat-card-mega">
            <h3>🚀 Chat Médico IA</h3>
            <p>📱 CLICK AQUÍ para ver el componente con banners súper visibles</p>
            <div class="mega-indicator">➤ VER BANNERS AQUÍ ⭐</div>
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
    /* 🚨 BANNER DE PRUEBA BAMBOO */
    .bamboo-test-banner {
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      width: 100vw !important;
      height: 70px !important;
      background: linear-gradient(90deg, #FF6B35, #F7931E, #FF6B35) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 999999 !important;
      animation: testPulse 2s infinite !important;
      border-bottom: 3px solid #FF4500 !important;
      box-shadow: 0 3px 15px rgba(255, 107, 53, 0.5) !important;
    }

    .test-content {
      display: flex !important;
      align-items: center !important;
      gap: 20px !important;
      color: white !important;
      font-weight: 900 !important;
      font-size: 1.4rem !important;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5) !important;
      letter-spacing: 2px !important;
    }

    .test-icon {
      font-size: 2rem !important;
      animation: testBounce 1s infinite !important;
    }

    .test-text {
      animation: testShimmer 2s infinite !important;
    }

    @keyframes testPulse {
      0%, 100% { 
        background: linear-gradient(90deg, #FF6B35, #F7931E, #FF6B35) !important;
        transform: scale(1) !important;
      }
      50% { 
        background: linear-gradient(90deg, #FF4500, #FF6B35, #FF4500) !important;
        transform: scale(1.02) !important;
      }
    }

    @keyframes testBounce {
      0%, 100% { transform: translateY(0) rotate(0deg) !important; }
      50% { transform: translateY(-5px) rotate(10deg) !important; }
    }

    @keyframes testShimmer {
      0% { text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5) !important; }
      50% { text-shadow: 0 0 15px rgba(255, 255, 255, 0.8) !important; }
      100% { text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5) !important; }
    }

    .dashboard-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      margin-top: 80px !important; /* Para el banner */
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

    /* 🚀 TARJETA MEGA VISIBLE PARA CHAT */
    .chat-card-mega {
      background: linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%) !important;
      border: 3px solid #2196F3 !important;
      animation: cardPulse 3s infinite !important;
      transform: scale(1.05) !important;
      box-shadow: 0 8px 25px rgba(33, 150, 243, 0.3) !important;
      
      h3 {
        color: #1976D2 !important;
        font-size: 1.5rem !important;
        text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1) !important;
      }
      
      p {
        color: #1565C0 !important;
        font-weight: 600 !important;
        margin-bottom: 10px !important;
      }
      
      .mega-indicator {
        background: linear-gradient(90deg, #FF4500, #FF6B35) !important;
        color: white !important;
        padding: 8px 15px !important;
        border-radius: 20px !important;
        font-weight: 800 !important;
        text-align: center !important;
        animation: indicatorGlow 2s infinite !important;
        letter-spacing: 1px !important;
      }
      
      &:hover {
        transform: scale(1.1) !important;
        box-shadow: 0 12px 35px rgba(33, 150, 243, 0.4) !important;
      }
    }

    @keyframes cardPulse {
      0%, 100% { 
        box-shadow: 0 8px 25px rgba(33, 150, 243, 0.3) !important;
      }
      50% { 
        box-shadow: 0 12px 35px rgba(33, 150, 243, 0.5) !important;
      }
    }

    @keyframes indicatorGlow {
      0%, 100% { 
        box-shadow: 0 0 10px rgba(255, 69, 0, 0.5) !important;
      }
      50% { 
        box-shadow: 0 0 20px rgba(255, 69, 0, 0.8) !important;
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