import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Patient } from '../../../core/models/patient.model';
import { PatientDocumentViewerComponent } from './patient-document-viewer.component';
import { PatientDocumentsService, PatientDocument } from '../../services/patient-documents.service';

@Component({
  selector: 'app-document-panel',
  standalone: true,
  imports: [CommonModule, PatientDocumentViewerComponent],
  template: `
    <div class="document-panel" [class.collapsed]="isCollapsed">
      <!-- Header Normal -->
      <div class="panel-header" *ngIf="!isCollapsed">
        <div class="header-content">
          <div class="panel-info">
            <div class="panel-icon">📄</div>
            <div>
              <h2 class="panel-title">
                <span class="medical-icon">📋</span>
                Expedientes
              </h2>
              <p class="panel-subtitle">Documentos médicos</p>
            </div>
          </div>
          <button 
            class="collapse-btn" 
            (click)="togglePanel()"
            title="Contraer panel de expedientes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 19l-7-7 7-7"/>
              <path d="M21 12H3" opacity="0.6"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Header Colapsado -->
      <div class="panel-header-collapsed" *ngIf="isCollapsed">
        <button 
          class="expand-btn" 
          (click)="togglePanel()"
          title="Expandir panel de expedientes">
          📄
        </button>
      </div>
      
      <!-- Contenido Principal -->
      <div class="panel-content" *ngIf="!isCollapsed">
        <!-- Visor de documentos -->
        <div class="document-viewer-area">
          <app-patient-document-viewer
            [patient]="activePatient"
            [isVisible]="!isCollapsed"
            (close)="onDocumentViewerClose()">
          </app-patient-document-viewer>
        </div>

        <!-- Estado sin paciente -->
        <div *ngIf="!activePatient" class="no-patient-state">
          <div class="no-patient-icon">👤</div>
          <h3>Sin paciente seleccionado</h3>
          <p>Selecciona un paciente del panel izquierdo para ver sus expedientes</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .document-panel {
      background: linear-gradient(180deg, 
        var(--general_contrasts-input-background, #ffffff) 0%, 
        rgba(var(--color-mariner-50, 224, 242, 254), 0.05) 100%
      );
      border-left: 1px solid var(--general_contrasts-container-outline, #e5e7eb);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(20px);
      box-shadow: 
        inset 1px 0 0 rgba(255, 255, 255, 0.1),
        -2px 0 10px rgba(0, 0, 0, 0.05);
      position: relative;
      height: 100vh;
    }

    /* Header del panel */
    .panel-header {
      padding: var(--bmb-spacing-m, 1rem);
      border-bottom: 1px solid var(--general_contrasts-container-outline, #e5e7eb);
      background: linear-gradient(135deg, 
        var(--general_contrasts-input-background, #ffffff) 0%, 
        rgba(var(--color-mariner-50, 224, 242, 254), 0.1) 100%
      );
      backdrop-filter: blur(10px);
      position: relative;
    }

    .header-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .panel-info {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-m, 1rem);
      flex: 1;
    }

    .panel-icon {
      width: 36px;
      height: 36px;
      border-radius: var(--bmb-radius-s, 0.5rem);
      background: linear-gradient(135deg, 
        rgb(var(--color-blue-tec, 0, 57, 166)) 0%, 
        rgba(var(--color-blue-tec, 0, 57, 166), 0.8) 100%
      );
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 1.125rem;
      box-shadow: 
        0 4px 12px rgba(var(--color-blue-tec, 0, 57, 166), 0.3),
        0 2px 4px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      transition: all 0.3s ease;
    }

    .panel-title {
      color: var(--general_contrasts-100, #1f2937);
      font-size: 1.125rem;
      font-weight: 700;
      margin: 0;
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-xs, 0.5rem);
      font-family: var(--font-display, 'Poppins', sans-serif);
      line-height: 1.2;
    }

    .panel-subtitle {
      color: var(--general_contrasts-75, #6b7280);
      font-size: 0.875rem;
      margin: 0;
      font-family: var(--font-display, 'Poppins', sans-serif);
      font-weight: 500;
    }

    /* Botón de colapso */
    .collapse-btn {
      background: rgba(var(--color-blue-tec, 0, 57, 166), 0.1);
      border: 1px solid rgba(var(--color-blue-tec, 0, 57, 166), 0.2);
      color: var(--color-blue-tec, #0066cc);
      width: 32px;
      height: 32px;
      border-radius: var(--bmb-radius-s, 0.5rem);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      flex-shrink: 0;
      
      svg {
        width: 16px;
        height: 16px;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      }
      
      &:hover {
        background: rgba(var(--color-blue-tec, 0, 57, 166), 0.15);
        border-color: rgba(var(--color-blue-tec, 0, 57, 166), 0.3);
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(var(--color-blue-tec, 0, 57, 166), 0.2);
        
        svg {
          transform: translateX(1px);
        }
      }
      
      &:active {
        transform: scale(0.95);
      }
    }

    /* Header colapsado */
    .panel-header-collapsed {
      padding: var(--bmb-spacing-m, 1rem) var(--bmb-spacing-s, 0.75rem);
      border-bottom: 1px solid var(--general_contrasts-container-outline, #e5e7eb);
      background: linear-gradient(135deg, 
        var(--general_contrasts-input-background, #ffffff) 0%, 
        rgba(var(--color-mariner-50, 224, 242, 254), 0.1) 100%
      );
      backdrop-filter: blur(10px);
      display: flex;
      justify-content: center;
      align-items: center;
    }

    .expand-btn {
      background: linear-gradient(135deg, 
        rgb(var(--color-blue-tec, 0, 57, 166)) 0%, 
        rgba(var(--color-blue-tec, 0, 57, 166), 0.9) 100%
      );
      border: none;
      color: white;
      width: 40px;
      height: 40px;
      border-radius: var(--bmb-radius-m, 1rem);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 1.125rem;
      box-shadow: 
        0 4px 12px rgba(var(--color-blue-tec, 0, 57, 166), 0.3),
        0 2px 4px rgba(0, 0, 0, 0.1),
        inset 0 1px 0 rgba(255, 255, 255, 0.2);
      animation: expandPulse 3s ease-in-out infinite;
      
      &:hover {
        transform: scale(1.05);
        box-shadow: 
          0 6px 20px rgba(var(--color-blue-tec, 0, 57, 166), 0.4),
          0 3px 8px rgba(0, 0, 0, 0.15),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
      }
      
      &:active {
        transform: scale(0.95);
      }
    }

    /* Contenido del panel */
    .panel-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Indicador de paciente activo */
    .active-patient-indicator {
      padding: var(--bmb-spacing-s, 0.75rem) var(--bmb-spacing-m, 1rem);
      border-bottom: 1px solid var(--general_contrasts-container-outline, #e5e7eb);
      background: rgba(var(--color-blue-tec, 0, 57, 166), 0.03);
    }

    .patient-context-card {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-s, 0.75rem);
      padding: var(--bmb-spacing-s, 0.75rem);
      background: var(--general_contrasts-input-background, #ffffff);
      border-radius: var(--bmb-radius-s, 0.5rem);
      border: 1px solid rgba(var(--color-blue-tec, 0, 57, 166), 0.1);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .patient-avatar-small {
      width: 32px;
      height: 32px;
      border-radius: var(--bmb-radius-xs, 0.25rem);
      background: linear-gradient(135deg, 
        rgb(var(--color-blue-tec, 0, 57, 166)) 0%, 
        rgba(var(--color-blue-tec, 0, 57, 166), 0.8) 100%
      );
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.75rem;
    }

    .patient-info-small {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .patient-name-small {
      font-weight: 600;
      font-size: 0.875rem;
      color: var(--general_contrasts-text-primary, #1f2937);
      line-height: 1.2;
    }

    .document-count-small {
      font-size: 0.75rem;
      color: var(--general_contrasts-75, #6b7280);
    }

    .status-indicator {
      font-size: 1rem;
      transition: all 0.3s ease;

      &.has-docs {
        transform: scale(1.1);
      }
    }

    /* Área del visor */
    .document-viewer-area {
      flex: 1;
      overflow: hidden;
    }

    /* Estado sin paciente */
    .no-patient-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--bmb-spacing-xl, 2rem);
      text-align: center;
      color: var(--general_contrasts-75, #6b7280);

      .no-patient-icon {
        font-size: 3rem;
        margin-bottom: var(--bmb-spacing-m, 1rem);
        opacity: 0.5;
      }

      h3 {
        margin: 0 0 var(--bmb-spacing-s, 0.75rem) 0;
        color: var(--general_contrasts-text-primary, #1f2937);
        font-size: 1.125rem;
      }

      p {
        margin: 0;
        line-height: 1.5;
        max-width: 250px;
      }
    }

    /* Animaciones */
    @keyframes expandPulse {
      0%, 100% {
        box-shadow: 
          0 4px 12px rgba(var(--color-blue-tec, 0, 57, 166), 0.3),
          0 2px 4px rgba(0, 0, 0, 0.1),
          inset 0 1px 0 rgba(255, 255, 255, 0.2);
      }
      50% {
        box-shadow: 
          0 6px 20px rgba(var(--color-blue-tec, 0, 57, 166), 0.4),
          0 3px 8px rgba(0, 0, 0, 0.15),
          inset 0 1px 0 rgba(255, 255, 255, 0.3),
          0 0 0 4px rgba(var(--color-blue-tec, 0, 57, 166), 0.1);
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .panel-header {
        padding: var(--bmb-spacing-s, 0.75rem);
      }

      .panel-title {
        font-size: 1rem;
      }

      .patient-context-card {
        padding: var(--bmb-spacing-xs, 0.5rem);
      }

      .no-patient-state {
        padding: var(--bmb-spacing-m, 1rem);

        h3 {
          font-size: 1rem;
        }

        p {
          font-size: 0.875rem;
        }
      }
    }
  `]
})
export class DocumentPanelComponent implements OnInit, OnDestroy {
  @Input() activePatient: Patient | null = null;
  @Input() isCollapsed: boolean = true; // Inicia colapsado por defecto
  @Output() toggleCollapse = new EventEmitter<boolean>();

  documentCount: number = 0;
  private destroy$ = new Subject<void>();

  constructor(
    private patientDocumentsService: PatientDocumentsService
  ) {}

  ngOnInit(): void {
    this.updateDocumentCount();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(): void {
    this.updateDocumentCount();
  }

  togglePanel(): void {
    this.isCollapsed = !this.isCollapsed;
    this.toggleCollapse.emit(this.isCollapsed);
  }

  getPatientInitials(): string {
    if (!this.activePatient?.name) return '?';
    return this.activePatient.name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  private updateDocumentCount(): void {
    if (!this.activePatient) {
      this.documentCount = 0;
      return;
    }

    this.patientDocumentsService.mapPatientToDocuments(this.activePatient)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documents) => {
          this.documentCount = documents.length;
        },
        error: (error) => {
          console.error('Error obteniendo conteo de documentos:', error);
          this.documentCount = 0;
        }
      });
  }

  onDocumentViewerClose(): void {
    this.togglePanel();
  }
} 