import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { UiStateService, MedicalStateService } from '@core/services';
import { Patient } from '@core/models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="app-header" [class.patient-active]="activePatient$ | async">
      <!-- Mobile Menu Toggle -->
      <button class="menu-toggle" 
              (click)="toggleSidebar()"
              *ngIf="isMobile$ | async">
        <span class="menu-icon">☰</span>
      </button>
      
      <!-- Active Patient Context -->
      <div class="patient-context" *ngIf="activePatient$ | async as patient">
        <div class="patient-badge">
          <span class="patient-icon">👤</span>
          <div class="patient-details">
            <span class="patient-name">{{ patient.name }}</span>
            <span class="patient-meta">{{ patient.age }} años • {{ patient.gender }}</span>
          </div>
        </div>
        <button class="clear-context" 
                (click)="clearPatientContext()"
                title="Limpiar contexto del paciente">
          ✕
        </button>
      </div>
      
      <!-- Default State -->
      <div class="default-context" *ngIf="!(activePatient$ | async)">
        <h1 class="app-title">TecSalud Medical Assistant</h1>
        <span class="subtitle">Selecciona un paciente para comenzar</span>
      </div>
      
      <!-- Actions -->
      <div class="header-actions">
        <button class="action-btn" title="Notificaciones">
          <span class="action-icon">🔔</span>
          <span class="notification-badge" *ngIf="false">3</span>
        </button>
        <button class="action-btn" title="Configuración">
          <span class="action-icon">⚙️</span>
        </button>
        <div class="user-menu">
          <div class="user-avatar">LS</div>
          <span class="user-name" *ngIf="!(isMobile$ | async)">Dr. Solis</span>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .app-header {
      height: 64px;
      background: var(--medical-surface);
      border-bottom: 1px solid var(--medical-divider);
      display: flex;
      align-items: center;
      padding: 0 1.5rem;
      gap: 1.5rem;
      transition: all 0.3s ease;
      
      &.patient-active {
        background: var(--medical-context-active);
        border-bottom-color: var(--medical-blue);
      }
    }
    
    .menu-toggle {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: var(--medical-text-primary);
      
      .menu-icon {
        font-size: 1.5rem;
      }
    }
    
    .patient-context {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .patient-badge {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 1rem;
      background: var(--medical-surface);
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      
      .patient-icon {
        font-size: 1.5rem;
      }
    }
    
    .patient-details {
      display: flex;
      flex-direction: column;
      
      .patient-name {
        font-weight: 600;
        color: var(--medical-blue);
      }
      
      .patient-meta {
        font-size: 0.875rem;
        color: var(--medical-text-secondary);
      }
    }
    
    .clear-context {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: var(--medical-text-secondary);
      transition: all 0.2s;
      
      &:hover {
        color: var(--medical-critical);
        transform: scale(1.1);
      }
    }
    
    .default-context {
      flex: 1;
      
      .app-title {
        margin: 0;
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--medical-blue);
      }
      
      .subtitle {
        font-size: 0.875rem;
        color: var(--medical-text-secondary);
        margin-left: 1rem;
      }
    }
    
    .header-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .action-btn {
      background: none;
      border: none;
      padding: 0.5rem;
      cursor: pointer;
      color: var(--medical-text-secondary);
      position: relative;
      transition: color 0.2s;
      
      &:hover {
        color: var(--medical-blue);
      }
      
      .action-icon {
        font-size: 1.25rem;
      }
    }
    
    .notification-badge {
      position: absolute;
      top: 0;
      right: 0;
      background: var(--medical-critical);
      color: white;
      font-size: 0.625rem;
      padding: 0.125rem 0.375rem;
      border-radius: 10px;
      min-width: 18px;
      text-align: center;
    }
    
    .user-menu {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.5rem 0.75rem;
      border-radius: 8px;
      cursor: pointer;
      transition: background 0.2s;
      
      &:hover {
        background: var(--medical-background);
      }
    }
    
    .user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--medical-blue);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.875rem;
      font-weight: 600;
    }
    
    .user-name {
      font-size: 0.9375rem;
      font-weight: 500;
      color: var(--medical-text-primary);
    }
    
    /* Mobile Styles */
    @media (max-width: 768px) {
      .app-header {
        padding: 0 1rem;
        gap: 1rem;
      }
      
      .subtitle {
        display: none;
      }
      
      .app-title {
        font-size: 1.125rem !important;
      }
      
      .patient-badge {
        padding: 0.375rem 0.75rem;
        
        .patient-icon {
          font-size: 1.25rem;
        }
        
        .patient-name {
          font-size: 0.9375rem;
        }
        
        .patient-meta {
          font-size: 0.75rem;
        }
      }
    }
    
    /* Tablet Styles */
    @media (min-width: 768px) and (max-width: 1024px) {
      .user-name {
        display: none;
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  activePatient$: Observable<Patient | null>;
  isMobile$: Observable<boolean>;
  
  constructor(
    private uiState: UiStateService,
    private medicalState: MedicalStateService
  ) {
    this.activePatient$ = this.medicalState.activePatient$;
    this.isMobile$ = this.uiState.isMobile$;
  }
  
  ngOnInit(): void {}
  
  toggleSidebar(): void {
    this.uiState.toggleSidebar();
  }
  
  clearPatientContext(): void {
    this.medicalState.setActivePatient(null);
    this.uiState.showSuccessToast('Contexto del paciente limpiado');
  }
}