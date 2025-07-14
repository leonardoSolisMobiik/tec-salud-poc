import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PatientDocumentsService, PatientDocument } from '../../services/patient-documents.service';
import { Patient } from '../../../core/models/patient.model';

@Component({
  selector: 'app-patient-document-viewer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="document-viewer-container">
      <!-- Header con info del paciente -->
      <div class="viewer-header">
        <div class="patient-info">
          <div class="patient-avatar">
            {{getPatientInitials()}}
          </div>
          <div class="patient-details">
            <h3 class="patient-name">{{patient?.name || 'Sin paciente'}}</h3>
            <p class="document-count">{{documents.length}} documento{{documents.length !== 1 ? 's' : ''}} disponible{{documents.length !== 1 ? 's' : ''}}</p>
          </div>
        </div>
        <!-- REMOVED: Close button eliminated -->
      </div>

      <!-- Tabs de documentos -->
      <div class="document-tabs" *ngIf="documents.length > 1">
        <button 
          *ngFor="let doc of documents; trackBy: trackByDocId; let i = index"
          class="tab-btn"
          [class.active]="activeDocumentIndex === i"
          (click)="setActiveDocument(i)">
          <span class="tab-icon">{{getDocumentIcon(doc)}}</span>
          <span class="tab-label">{{getShortDisplayName(doc)}}</span>
          <span class="tab-type" [class]="'type-' + doc.type.toLowerCase()">{{doc.type}}</span>
        </button>
      </div>

      <!-- Área principal del documento -->
      <div class="document-content">
        <div *ngIf="documents.length === 0" class="no-documents">
          <div class="no-docs-icon">📄</div>
          <h3>Sin documentos disponibles</h3>
          <p>No se encontraron expedientes para este paciente</p>
        </div>

        <div *ngIf="activeDocument" class="pdf-viewer-container">
          <!-- Info del documento activo -->
          <div class="document-info">
            <div class="doc-title">
              <span class="doc-icon">{{getDocumentIcon(activeDocument)}}</span>
              <span class="doc-name">{{activeDocument.displayName}}</span>
              <span class="doc-badge" [class]="'badge-' + activeDocument.type.toLowerCase()">
                {{activeDocument.type === 'CONS' ? 'Consulta' : 'Emergencia'}}
              </span>
            </div>
          </div>

          <!-- Document Preview (MVP Version) -->
          <div class="document-preview">
            <div class="document-placeholder">
              <div class="pdf-icon">📄</div>
              <h3>{{activeDocument.displayName}}</h3>
              <p class="file-info">{{activeDocument.fileName}}</p>
              <div class="document-meta">
                <span class="doc-type" [class]="'type-' + activeDocument.type.toLowerCase()">
                  {{activeDocument.type === 'CONS' ? 'Historia Clínica' : 'Atención de Emergencia'}}
                </span>
                <span class="doc-size">PDF Document</span>
              </div>
              <div class="preview-actions">
                <button class="action-btn primary" (click)="openInNewTab(activeDocument)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
                  </svg>
                  Abrir Expediente
                </button>
                <button class="action-btn secondary" (click)="downloadPdf(activeDocument)">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
                  </svg>
                  Descargar PDF
                </button>
              </div>
            </div>
          </div>


        </div>
      </div>

      <!-- Loading state -->
      <div *ngIf="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <p>Cargando expedientes...</p>
      </div>
    </div>
  `,
  styles: [`
    .document-viewer-container {
      height: 100%;
      display: flex;
      flex-direction: column;
      background: var(--general_contrasts-input-background, #ffffff);
    }

    /* Header del visor */
    .viewer-header {
      padding: var(--bmb-spacing-m, 1rem);
      border-bottom: 1px solid var(--general_contrasts-container-outline, #e5e7eb);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: linear-gradient(135deg, 
        var(--general_contrasts-input-background, #ffffff) 0%, 
        rgba(var(--color-mariner-50, 224, 242, 254), 0.05) 100%
      );
    }

    .patient-info {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-m, 1rem);
    }

    .patient-avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--bmb-radius-s, 0.5rem);
      background: linear-gradient(135deg, 
        rgb(var(--color-blue-tec, 0, 57, 166)) 0%, 
        rgba(var(--color-blue-tec, 0, 57, 166), 0.8) 100%
      );
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .patient-details {
      flex: 1;
    }

    .patient-name {
      margin: 0;
      font-size: 1rem;
      font-weight: 600;
      color: var(--general_contrasts-text-primary, #1f2937);
    }

    .document-count {
      margin: 0;
      font-size: 0.75rem;
      color: var(--general_contrasts-75, #6b7280);
    }

    /* Tabs de documentos */
    .document-tabs {
      display: flex;
      border-bottom: 1px solid var(--general_contrasts-container-outline, #e5e7eb);
      background: var(--general_contrasts-input-background, #ffffff);
      overflow-x: auto;
      min-height: 48px;
    }

    .tab-btn {
      background: none;
      border: none;
      padding: var(--bmb-spacing-s, 0.75rem) var(--bmb-spacing-m, 1rem);
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-xs, 0.5rem);
      white-space: nowrap;
      border-bottom: 2px solid transparent;
      min-width: 150px;

      &:hover {
        background: rgba(var(--color-blue-tec, 0, 57, 166), 0.05);
      }

      &.active {
        border-bottom-color: var(--color-blue-tec, #0066cc);
        background: rgba(var(--color-blue-tec, 0, 57, 166), 0.1);
      }
    }

    .tab-icon {
      font-size: 1rem;
    }

    .tab-label {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--general_contrasts-text-primary, #1f2937);
    }

    .tab-type {
      padding: 2px 6px;
      border-radius: var(--bmb-radius-xs, 0.25rem);
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;

      &.type-cons {
        background: #e8f5e8;
        color: #2d5a2d;
      }

      &.type-emer {
        background: #ffe8e8;
        color: #5a2d2d;
      }
    }

    /* Contenido del documento */
    .document-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .no-documents {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--bmb-spacing-xl, 2rem);
      text-align: center;
      color: var(--general_contrasts-75, #6b7280);

      .no-docs-icon {
        font-size: 3rem;
        margin-bottom: var(--bmb-spacing-m, 1rem);
      }

      h3 {
        margin: 0 0 var(--bmb-spacing-s, 0.75rem) 0;
        color: var(--general_contrasts-text-primary, #1f2937);
      }

      p {
        margin: 0;
      }
    }

    .pdf-viewer-container {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .document-info {
      padding: var(--bmb-spacing-s, 0.75rem) var(--bmb-spacing-m, 1rem);
      border-bottom: 1px solid var(--general_contrasts-container-outline, #e5e7eb);
      background: rgba(var(--color-blue-tec, 0, 57, 166), 0.02);
    }

    .doc-title {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-xs, 0.5rem);
    }

    .doc-icon {
      font-size: 1.125rem;
    }

    .doc-name {
      font-weight: 600;
      color: var(--general_contrasts-text-primary, #1f2937);
      flex: 1;
    }

    .doc-badge {
      padding: 4px 8px;
      border-radius: var(--bmb-radius-xs, 0.25rem);
      font-size: 0.75rem;
      font-weight: 600;

      &.badge-cons {
        background: #e8f5e8;
        color: #2d5a2d;
      }

      &.badge-emer {
        background: #ffe8e8;
        color: #5a2d2d;
      }
    }

    /* Document Preview */
    .document-preview {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--bmb-spacing-xl, 2rem);
    }

    .document-placeholder {
      background: var(--general_contrasts-input-background, #ffffff);
      border: 1px solid var(--general_contrasts-container-outline, #e5e7eb);
      border-radius: var(--bmb-radius-m, 1rem);
      padding: var(--bmb-spacing-xl, 2rem);
      text-align: center;
      max-width: 100%;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .pdf-icon {
      font-size: 4rem;
      margin-bottom: var(--bmb-spacing-m, 1rem);
      color: rgba(var(--color-blue-tec, 0, 57, 166), 0.7);
    }

    .document-placeholder h3 {
      margin: 0 0 var(--bmb-spacing-s, 0.75rem) 0;
      color: var(--general_contrasts-text-primary, #1f2937);
      font-size: 1.25rem;
      font-weight: 600;
    }

    .file-info {
      margin: 0 0 var(--bmb-spacing-m, 1rem) 0;
      color: var(--general_contrasts-75, #6b7280);
      font-size: 0.875rem;
      word-break: break-all;
    }

    .document-meta {
      display: flex;
      gap: var(--bmb-spacing-s, 0.75rem);
      justify-content: center;
      margin-bottom: var(--bmb-spacing-xl, 2rem);
      flex-wrap: wrap;
    }

    .doc-type {
      padding: 4px 12px;
      border-radius: var(--bmb-radius-s, 0.5rem);
      font-size: 0.75rem;
      font-weight: 600;

      &.type-cons {
        background: #e8f5e8;
        color: #2d5a2d;
      }

      &.type-emer {
        background: #ffe8e8;
        color: #5a2d2d;
      }
    }

    .doc-size {
      padding: 4px 12px;
      background: rgba(var(--color-blue-tec, 0, 57, 166), 0.1);
      color: rgb(var(--color-blue-tec, 0, 57, 166));
      border-radius: var(--bmb-radius-s, 0.5rem);
      font-size: 0.75rem;
      font-weight: 600;
    }

    .preview-actions {
      display: flex;
      gap: var(--bmb-spacing-s, 0.75rem);
      justify-content: center;
      flex-wrap: wrap;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-xs, 0.5rem);
      padding: var(--bmb-spacing-s, 0.75rem) var(--bmb-spacing-m, 1rem);
      border-radius: var(--bmb-radius-s, 0.5rem);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;
      font-size: 0.875rem;

      svg {
        width: 18px;
        height: 18px;
      }

      &.primary {
        background: linear-gradient(135deg, 
          rgb(var(--color-blue-tec, 0, 57, 166)) 0%, 
          rgba(var(--color-blue-tec, 0, 57, 166), 0.9) 100%
        );
        color: white;
        box-shadow: 0 4px 12px rgba(var(--color-blue-tec, 0, 57, 166), 0.3);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(var(--color-blue-tec, 0, 57, 166), 0.4);
        }
      }

      &.secondary {
        background: rgba(var(--color-blue-tec, 0, 57, 166), 0.1);
        color: rgb(var(--color-blue-tec, 0, 57, 166));
        border: 1px solid rgba(var(--color-blue-tec, 0, 57, 166), 0.2);

        &:hover {
          background: rgba(var(--color-blue-tec, 0, 57, 166), 0.15);
          transform: translateY(-1px);
        }
      }

      &:active {
        transform: scale(0.95);
      }
    }



    /* Loading state */
    .loading-state {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: var(--bmb-spacing-xl, 2rem);

      .loading-spinner {
        width: 32px;
        height: 32px;
        border: 3px solid rgba(var(--color-blue-tec, 0, 57, 166), 0.1);
        border-top: 3px solid var(--color-blue-tec, #0066cc);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: var(--bmb-spacing-m, 1rem);
      }

      p {
        color: var(--general_contrasts-75, #6b7280);
        margin: 0;
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .document-tabs {
        overflow-x: auto;
      }

      .tab-btn {
        min-width: 120px;
      }

      .pdf-controls {
        flex-wrap: wrap;
      }
    }
  `]
})
export class PatientDocumentViewerComponent implements OnInit, OnDestroy, OnChanges {
  @Input() patient: Patient | null = null;
  @Input() isVisible: boolean = false;

  documents: PatientDocument[] = [];
  activeDocumentIndex: number = 0;
  isLoading: boolean = false;
  
  private destroy$ = new Subject<void>();

  constructor(
    private patientDocumentsService: PatientDocumentsService
  ) {}

  ngOnInit(): void {
    this.loadPatientDocuments();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patient'] && this.patient) {
      this.loadPatientDocuments();
    }
  }

  get activeDocument(): PatientDocument | null {
    return this.documents[this.activeDocumentIndex] || null;
  }

  private loadPatientDocuments(): void {
    if (!this.patient) {
      this.documents = [];
      return;
    }

    this.isLoading = true;
    
    this.patientDocumentsService.mapPatientToDocuments(this.patient)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documents) => {
          this.documents = documents;
          this.activeDocumentIndex = 0;
          this.isLoading = false;
          console.log(`📄 Cargados ${documents.length} documentos para ${this.patient?.name}`);
        },
        error: (error) => {
          console.error('❌ Error cargando documentos:', error);
          this.documents = [];
          this.isLoading = false;
        }
      });
  }

  setActiveDocument(index: number): void {
    if (index >= 0 && index < this.documents.length) {
      this.activeDocumentIndex = index;
    }
  }

  getPatientInitials(): string {
    if (!this.patient?.name) return '?';
    return this.patient.name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  getDocumentIcon(doc: PatientDocument): string {
    return doc.type === 'CONS' ? '📋' : '🚨';
  }

  getShortDisplayName(doc: PatientDocument): string {
    const maxLength = 15;
    return doc.displayName.length > maxLength 
      ? doc.displayName.substring(0, maxLength) + '...'
      : doc.displayName;
  }

  getPdfUrlString(doc: PatientDocument): string {
    // Para descargas y nueva pestaña 
    return doc.url;
  }

  downloadPdf(doc: PatientDocument): void {
    const url = this.getPdfUrlString(doc);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.fileName;
    link.click();
  }

  openInNewTab(doc: PatientDocument): void {
    const url = this.getPdfUrlString(doc);
    window.open(url, '_blank');
  }

  trackByDocId(index: number, doc: PatientDocument): string {
    return doc.id;
  }
} 