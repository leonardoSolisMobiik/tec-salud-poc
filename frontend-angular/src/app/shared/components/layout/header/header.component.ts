import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { UiStateService, MedicalStateService } from '@core/services';
import { Patient } from '@core/models';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
        
        <!-- 🚨 DROPDOWN DE NAVEGACIÓN DESHABILITADO TEMPORALMENTE -->
        <!-- <div class="nav-dropdown" style="position: relative; z-index: 9999;">
          <button class="nav-dropdown-trigger" 
                  (click)="toggleNavDropdown()"
                  style="background: #ff6b6b !important; color: white !important; padding: 12px 20px !important; border: 3px solid #000 !important; border-radius: 8px !important; font-weight: bold !important; font-size: 16px !important; cursor: pointer !important;">
            📋 MENÚ NAVEGACIÓN
          </button>
          
          <div class="nav-dropdown-menu" 
               *ngIf="isNavDropdownOpen"
               style="position: absolute !important; top: 100% !important; right: 0 !important; background: white !important; border: 3px solid #000 !important; border-radius: 8px !important; box-shadow: 0 8px 16px rgba(0,0,0,0.3) !important; padding: 10px !important; min-width: 250px !important; z-index: 9999 !important;">
            
            <a routerLink="/chat" 
               (click)="closeNavDropdown()"
               class="nav-dropdown-item"
               style="display: flex !important; align-items: center !important; gap: 10px !important; padding: 12px 16px !important; margin: 4px 0 !important; background: lime !important; color: black !important; text-decoration: none !important; border: 2px solid #000 !important; border-radius: 4px !important; font-weight: bold !important; transition: all 0.2s !important;">
              <span style="font-size: 1.5rem !important;">🩺</span>
              <span>Copiloto Médico</span>
            </a>
            
            <a routerLink="/dashboard" 
               (click)="closeNavDropdown()"
               class="nav-dropdown-item"
               style="display: flex !important; align-items: center !important; gap: 10px !important; padding: 12px 16px !important; margin: 4px 0 !important; background: cyan !important; color: black !important; text-decoration: none !important; border: 2px solid #000 !important; border-radius: 4px !important; font-weight: bold !important; transition: all 0.2s !important;">
              <span style="font-size: 1.5rem !important;">📊</span>
              <span>Dashboard</span>
            </a>
            
            <a routerLink="/patients" 
               (click)="closeNavDropdown()"
               class="nav-dropdown-item"
               style="display: flex !important; align-items: center !important; gap: 10px !important; padding: 12px 16px !important; margin: 4px 0 !important; background: orange !important; color: black !important; text-decoration: none !important; border: 2px solid #000 !important; border-radius: 4px !important; font-weight: bold !important; transition: all 0.2s !important;">
              <span style="font-size: 1.5rem !important;">👥</span>
              <span>Gestión Pacientes</span>
            </a>
            
            <a routerLink="/documents" 
               (click)="closeNavDropdown()"
               class="nav-dropdown-item"
               style="display: flex !important; align-items: center !important; gap: 10px !important; padding: 12px 16px !important; margin: 4px 0 !important; background: magenta !important; color: white !important; text-decoration: none !important; border: 2px solid #000 !important; font-weight: bold !important; transition: all 0.2s !important;">
              <span style="font-size: 1.5rem !important;">📄</span>
              <span>Documentos</span>
            </a>
            
            <hr style="margin: 10px 0 !important; border: 1px solid #000 !important;">
            
            <div style="padding: 8px 16px !important; background: #f0f0f0 !important; border-radius: 4px !important; font-weight: bold !important; color: #333 !important; font-size: 14px !important;">
              🚧 Próximamente: Subir Documentos
            </div>
          </div>
        </div> -->
        
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
    
    /* 📱 MOBILE STYLES - TASK-UI-004 */
    @media (max-width: 767px) {
      .app-header {
        padding: 0 var(--bmb-spacing-m, 1rem);
        gap: var(--bmb-spacing-s, 0.75rem);
        height: 60px;
        flex-wrap: wrap;
      }
      
      .menu-toggle {
        padding: var(--touch-spacing, 12px);
        min-width: var(--touch-target-min, 44px);
        min-height: var(--touch-target-min, 44px);
        
        .menu-icon {
          font-size: 1.5rem;
        }
      }
      
      .subtitle {
        display: none;
      }
      
      .app-title {
        font-size: 1rem !important;
      }
      
      .patient-badge {
        padding: var(--bmb-spacing-xs, 0.5rem) var(--bmb-spacing-s, 0.75rem);
        border-radius: var(--bmb-radius-s, 0.5rem);
        
        .patient-icon {
          font-size: 1.2rem;
        }
        
        .patient-name {
          font-size: 0.875rem;
        }
        
        .patient-meta {
          font-size: 0.75rem;
        }
      }
      
      .header-actions {
        gap: var(--bmb-spacing-xs, 0.5rem);
      }
      
      .action-btn {
        min-width: var(--touch-target-min, 44px);
        min-height: var(--touch-target-min, 44px);
        padding: var(--touch-spacing, 12px);
        
        .action-icon {
          font-size: 1.3rem;
        }
      }
      
      .user-avatar {
        width: 36px;
        height: 36px;
        font-size: 0.8rem;
      }
      
      .user-name {
        display: none;
      }
    }
    
    /* 📱 TABLET STYLES - TASK-UI-004 OPTIMIZACIÓN */
    @media (min-width: 768px) and (max-width: 1024px) {
      .app-header {
        height: 64px;
        padding: 0 var(--bmb-spacing-l, 1.5rem);
        gap: var(--bmb-spacing-m, 1rem);
      }
      
      .app-title {
        font-size: 1.2rem !important;
      }
      
      .subtitle {
        font-size: 0.875rem;
      }
      
      .patient-badge {
        padding: var(--bmb-spacing-s, 0.75rem) var(--bmb-spacing-m, 1rem);
        
        .patient-icon {
          font-size: 1.4rem;
        }
        
        .patient-name {
          font-size: 1rem;
        }
        
        .patient-meta {
          font-size: 0.875rem;
        }
      }
      
      .action-btn {
        min-width: var(--touch-target-min, 44px);
        min-height: var(--touch-target-min, 44px);
      }
      
      .user-avatar {
        width: 40px;
        height: 40px;
      }
      
      .user-name {
        display: none;
      }
    }
    
    /* 📱 DESKTOP STYLES - TASK-UI-004 */
    @media (min-width: 1025px) {
      .app-header {
        height: 68px;
        padding: 0 var(--bmb-spacing-xl, 2rem);
      }
      
      .user-name {
        display: block;
      }
    }
    
    /* 🖱️ TOUCH DEVICE OPTIMIZATIONS - TASK-UI-004 */
    @media (hover: none) and (pointer: coarse) {
      .menu-toggle:active {
        background: var(--medical-background);
        transform: scale(0.95);
      }
      
      .action-btn:active {
        background: var(--medical-background);
        transform: scale(0.95);
      }
      
      .user-menu:active {
        background: var(--medical-background);
        transform: scale(0.98);
      }
      
      .clear-context:active {
        background: var(--medical-critical);
        color: white;
        transform: scale(0.9);
      }
    }
    
    /* 🚨 ESTILOS DROPDOWN NAVEGACIÓN */
    .nav-dropdown {
      position: relative;
      z-index: 9999;
    }
    
    .nav-dropdown-trigger {
      background: #ff6b6b !important;
      color: white !important;
      padding: 12px 20px !important;
      border: 3px solid #000 !important;
      border-radius: 8px !important;
      font-weight: bold !important;
      font-size: 16px !important;
      cursor: pointer !important;
      transition: all 0.3s !important;
      
      &:hover {
        background: #ff5252 !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2) !important;
      }
    }
    
    .nav-dropdown-menu {
      position: absolute !important;
      top: 100% !important;
      right: 0 !important;
      background: white !important;
      border: 3px solid #000 !important;
      border-radius: 8px !important;
      box-shadow: 0 8px 16px rgba(0,0,0,0.3) !important;
      padding: 10px !important;
      min-width: 250px !important;
      z-index: 9999 !important;
      animation: dropdownFadeIn 0.3s ease-out !important;
    }
    
    .nav-dropdown-item {
      display: flex !important;
      align-items: center !important;
      gap: 10px !important;
      padding: 12px 16px !important;
      margin: 4px 0 !important;
      text-decoration: none !important;
      border: 2px solid #000 !important;
      border-radius: 4px !important;
      font-weight: bold !important;
      transition: all 0.2s !important;
      
      &:hover {
        transform: translateX(5px) !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
      }
    }
    
    @keyframes dropdownFadeIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `]
})
export class HeaderComponent implements OnInit {
  activePatient$: Observable<Patient | null>;
  isMobile$: Observable<boolean>;
  isNavDropdownOpen = false;
  
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
  
  toggleNavDropdown(): void {
    this.isNavDropdownOpen = !this.isNavDropdownOpen;
  }
  
  closeNavDropdown(): void {
    this.isNavDropdownOpen = false;
  }
}