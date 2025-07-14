import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { UiStateService, MedicalStateService } from '@core/services';
import { Patient } from '@core/models';

/**
 * Header Component for application navigation and patient context
 * 
 * @description Top navigation header that displays patient context when active,
 * provides mobile menu toggle, navigation dropdown, and quick actions.
 * Adapts its layout based on patient selection and device type.
 * 
 * @example
 * ```typescript
 * // Used in app-shell layout
 * <app-header></app-header>
 * 
 * // Automatically displays:
 * // - Patient context when patient is selected
 * // - Default app title when no patient
 * // - Mobile menu toggle on small screens
 * // - Navigation dropdown for app sections
 * ```
 * 
 * @features
 * - Patient context display with clear action
 * - Mobile-responsive menu toggle
 * - Navigation dropdown with app sections
 * - Notification indicator (placeholder)
 * - Professional medical styling
 * - Responsive design for all devices
 * 
 * @states
 * - Default: Shows app title and subtitle
 * - Patient Active: Shows patient info and context actions
 * - Mobile: Shows hamburger menu for sidebar toggle
 * 
 * @navigation
 * - Dashboard: System overview
 * - Chat Médico: AI medical consultation
 * - Administración: Admin features (bulk upload, pills management)
 * - Documentos: Document upload and management
 * 
 * @since 1.0.0
 */
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
        
        <!-- Dropdown de navegación con administración de pastillas -->
        <div class="nav-dropdown" style="position: relative; z-index: 9999;">
          <button class="nav-dropdown-trigger" 
                  (click)="toggleNavDropdown()"
                  style="background: var(--medical-blue) !important; color: white !important; padding: 12px 20px !important; border: none !important; border-radius: var(--bmb-radius-m, 1rem) !important; font-weight: 600 !important; font-size: 14px !important; cursor: pointer !important; transition: all 0.3s ease !important; box-shadow: 0 2px 8px rgba(var(--color-blue-tec), 0.2) !important;">
            ⚙️ Configuración
          </button>
          
          <div class="nav-dropdown-menu" 
               *ngIf="isNavDropdownOpen"
               style="position: absolute !important; top: 100% !important; right: 0 !important; background: var(--medical-surface) !important; border: 1px solid var(--medical-divider) !important; border-radius: var(--bmb-radius-m, 1rem) !important; box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important; padding: 8px !important; min-width: 280px !important; z-index: 9999 !important; backdrop-filter: blur(10px) !important;">
            
            <a routerLink="/chat" 
               (click)="closeNavDropdown()"
               class="nav-dropdown-item"
               style="display: flex !important; align-items: center !important; gap: 12px !important; padding: 12px 16px !important; margin: 4px 0 !important; background: transparent !important; color: var(--medical-text-primary) !important; text-decoration: none !important; border-radius: var(--bmb-radius-s) !important; font-weight: 500 !important; transition: all 0.2s !important;">
              <span style="font-size: 1.25rem !important;">🩺</span>
              <span>Copiloto Médico</span>
            </a>
            
            <a routerLink="/dashboard" 
               (click)="closeNavDropdown()"
               class="nav-dropdown-item"
               style="display: flex !important; align-items: center !important; gap: 12px !important; padding: 12px 16px !important; margin: 4px 0 !important; background: transparent !important; color: var(--medical-text-primary) !important; text-decoration: none !important; border-radius: var(--bmb-radius-s) !important; font-weight: 500 !important; transition: all 0.2s !important;">
              <span style="font-size: 1.25rem !important;">📊</span>
              <span>Dashboard</span>
            </a>
            
            <!-- COMMENTED OUT: Patient Management functionality -->
            <!-- <a routerLink="/patients" 
               (click)="closeNavDropdown()"
               class="nav-dropdown-item"
               style="display: flex !important; align-items: center !important; gap: 12px !important; padding: 12px 16px !important; margin: 4px 0 !important; background: transparent !important; color: var(--medical-text-primary) !important; text-decoration: none !important; border-radius: var(--bmb-radius-s) !important; font-weight: 500 !important; transition: all 0.2s !important;">
              <span style="font-size: 1.25rem !important;">👥</span>
              <span>Gestión Pacientes</span>
            </a> -->
            
            <a routerLink="/documents" 
               (click)="closeNavDropdown()"
               class="nav-dropdown-item"
               style="display: flex !important; align-items: center !important; gap: 12px !important; padding: 12px 16px !important; margin: 4px 0 !important; background: transparent !important; color: var(--medical-text-primary) !important; text-decoration: none !important; border-radius: var(--bmb-radius-s) !important; font-weight: 500 !important; transition: all 0.2s !important;">
              <span style="font-size: 1.25rem !important;">📄</span>
              <span>Documentos</span>
            </a>
            
            <hr style="margin: 8px 0 !important; border: none !important; border-top: 1px solid var(--medical-divider) !important;">
            
            <div style="padding: 8px 16px !important; color: var(--medical-text-secondary) !important; font-size: 12px !important; font-weight: 600 !important; text-transform: uppercase !important; letter-spacing: 0.5px !important;">
              Administración
            </div>
            
            <a routerLink="/admin-pills" 
               (click)="closeNavDropdown()"
               class="nav-dropdown-item"
               style="display: flex !important; align-items: center !important; gap: 12px !important; padding: 12px 16px !important; margin: 4px 0 !important; background: transparent !important; color: var(--medical-text-primary) !important; text-decoration: none !important; border-radius: var(--bmb-radius-s) !important; font-weight: 500 !important; transition: all 0.2s !important;">
              <span style="font-size: 1.25rem !important;">💊</span>
              <span>Gestión de Pastillas</span>
            </a>
          </div>
        </div>
        
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
      background: var(--medical-blue) !important;
      color: white !important;
      padding: 12px 20px !important;
      border: none !important;
      border-radius: var(--bmb-radius-m, 1rem) !important;
      font-weight: 600 !important;
      font-size: 14px !important;
      cursor: pointer !important;
      transition: all 0.3s ease !important;
      box-shadow: 0 2px 8px rgba(var(--color-blue-tec), 0.2) !important;
      
      &:hover {
        background: rgba(var(--color-blue-tec), 0.9) !important;
        transform: translateY(-2px) !important;
        box-shadow: 0 4px 12px rgba(var(--color-blue-tec), 0.3) !important;
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
      gap: 12px !important;
      padding: 12px 16px !important;
      margin: 4px 0 !important;
      background: transparent !important;
      color: var(--medical-text-primary) !important;
      text-decoration: none !important;
      border-radius: var(--bmb-radius-s) !important;
      font-weight: 500 !important;
      transition: all 0.2s ease !important;
      
      &:hover {
        background: var(--medical-context-active) !important;
        color: var(--medical-blue) !important;
        transform: translateX(4px) !important;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
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
  /** Observable for currently active patient */
  activePatient$: Observable<Patient | null>;
  
  /** Observable for mobile device state */
  isMobile$: Observable<boolean>;
  
  /** State for navigation dropdown visibility */
  isNavDropdownOpen = false;
  
  /**
   * Creates an instance of HeaderComponent
   * 
   * @param uiState - UI state service for responsive behavior
   * @param medicalState - Medical state service for patient context
   * 
   * @description Initializes observables for patient context and mobile state
   */
  constructor(
    private uiState: UiStateService,
    private medicalState: MedicalStateService
  ) {
    this.activePatient$ = this.medicalState.activePatient$;
    this.isMobile$ = this.uiState.isMobile$;
  }
  
  /**
   * Component initialization lifecycle hook
   * 
   * @description No specific initialization needed as component
   * is reactive to state service changes
   */
  ngOnInit(): void {}
  
  /**
   * Toggles the sidebar open/closed state
   * 
   * @description Delegates to UI state service to toggle sidebar visibility.
   * Primarily used on mobile devices where sidebar is hidden by default.
   * 
   * @example
   * ```typescript
   * // Called when mobile menu button is clicked
   * toggleSidebar(); // Sidebar slides in/out
   * ```
   */
  toggleSidebar(): void {
    this.uiState.toggleSidebar();
  }
  
  /**
   * Clears the current patient context
   * 
   * @description Removes the active patient selection and shows a success toast.
   * Resets the application to default state without patient context.
   * 
   * @example
   * ```typescript
   * // Called when user clicks clear context button
   * clearPatientContext(); // Patient context removed, toast shown
   * ```
   */
  clearPatientContext(): void {
    this.medicalState.setActivePatient(null);
    this.uiState.showSuccessToast('Contexto del paciente limpiado');
  }

  /**
   * Toggles the navigation dropdown visibility
   * 
   * @description Opens or closes the navigation dropdown menu that contains
   * links to different application sections.
   * 
   * @example
   * ```typescript
   * // Called when navigation button is clicked
   * toggleNavDropdown(); // Dropdown appears/disappears
   * ```
   */
  toggleNavDropdown(): void {
    this.isNavDropdownOpen = !this.isNavDropdownOpen;
  }
  
  /**
   * Closes the navigation dropdown
   * 
   * @description Explicitly closes the navigation dropdown, typically called
   * when user clicks outside or selects a navigation option.
   * 
   * @example
   * ```typescript
   * // Called when user clicks outside dropdown or selects option
   * closeNavDropdown(); // Dropdown closes
   * ```
   */
  closeNavDropdown(): void {
    this.isNavDropdownOpen = false;
  }
}