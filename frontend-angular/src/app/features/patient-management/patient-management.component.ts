import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * Patient Management component - COMMENTED OUT
 * 
 * @description This component has been temporarily disabled as requested.
 * The patient management functionality is not available in the current version.
 * 
 * @todo Re-enable when patient management features are needed
 */
@Component({
  selector: 'app-patient-management',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="global-container">
      <div class="global-header">
        <div class="header-top">
          <button 
            class="global-back-button"
            (click)="goBack()"
            title="Volver al dashboard">
            <span class="back-icon">←</span>
            <span class="back-text">Volver</span>
          </button>
          
          <div class="title-container">
            <h1 class="main-title">👥 Gestión de Pacientes</h1>
            <div class="main-subtitle">
              Administra la información de los pacientes del sistema
            </div>
          </div>
        </div>
      </div>
      
      <div class="patients-placeholder">
        <h2>⚠️ Funcionalidad Deshabilitada</h2>
        <p>La gestión de pacientes ha sido temporalmente deshabilitada.</p>
        <p>Esta funcionalidad no está disponible en la versión actual.</p>
        <div class="placeholder-actions">
          <a routerLink="/dashboard" class="back-button">
            🏠 Volver al Dashboard
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .patients-container {
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }
    
    .patients-header {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid var(--medical-primary);
    }
    
    .patients-header a {
      color: var(--medical-primary);
      text-decoration: none;
      font-weight: 600;
      padding: 8px 16px;
      background: var(--medical-background);
      border-radius: var(--bmb-radius-s);
      transition: all 0.2s;
    }
    
    .patients-header a:hover {
      background: var(--medical-primary);
      color: white;
    }
    
    .patients-header h1 {
      color: var(--medical-primary);
      margin: 0;
      font-size: 2rem;
    }
    
    .patients-placeholder {
      background: #fff3cd;
      padding: 40px;
      border-radius: var(--bmb-radius-m);
      text-align: center;
      border: 2px solid #ffc107;
    }
    
    .patients-placeholder h2 {
      color: #856404;
      margin-bottom: 20px;
      font-size: 1.5rem;
    }
    
    .patients-placeholder p {
      color: #856404;
      font-size: 1.1rem;
      margin-bottom: 15px;
    }
    
    .placeholder-actions {
      margin-top: 30px;
    }
    
    .back-button {
      display: inline-block;
      padding: 12px 24px;
      background: var(--medical-primary);
      color: white;
      text-decoration: none;
      border-radius: var(--bmb-radius-s);
      font-weight: 600;
      transition: all 0.2s;
    }
    
    .back-button:hover {
      background: var(--medical-primary-dark);
      transform: translateY(-2px);
    }
    
    /* ✅ RESPONSIVE LAYOUT FOR SMALL SCREENS */
    @media (max-width: 950px) {
      .patients-container {
        padding: var(--bmb-spacing-s) !important;
      }
      
      /* ✅ FORCE MOBILE HEADER LAYOUT */
      .patients-header {
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: var(--bmb-spacing-s) !important;
        padding: var(--bmb-spacing-m) !important;
        
        .back-button {
          margin-right: 0 !important;
          margin-bottom: var(--bmb-spacing-s) !important;
          order: 1 !important;
          background: var(--general_contrasts-15) !important;
          border: 1px solid var(--general_contrasts-container-outline) !important;
          border-radius: var(--bmb-radius-s) !important;
          padding: var(--bmb-spacing-s) var(--bmb-spacing-m) !important;
          color: var(--general_contrasts-100) !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          text-decoration: none !important;
          display: flex !important;
          align-items: center !important;
          gap: var(--bmb-spacing-xs) !important;
          border: none !important;
          
          &:hover {
            background: var(--general_contrasts-25) !important;
            transform: translateX(-4px) !important;
          }
        }
        
        h1 {
          order: 2 !important;
          text-align: center !important;
          font-size: 1.3rem !important;
          margin: 0 !important;
        }
      }
    }
  `]
})
export class PatientManagementComponent {
  // Component has been commented out and is not available in the current version
  
  goBack(): void {
    window.history.back();
  }
}