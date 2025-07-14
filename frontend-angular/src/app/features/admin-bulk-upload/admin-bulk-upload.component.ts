import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { BambooModule } from '../../shared/bamboo.module';
import { ApiService } from '../../core/services/api.service';

/**
 * Interface for batch file processing
 * 
 * @interface BatchFile
 * @description Represents a file in the batch upload process with
 * patient information, processing status, and progress tracking.
 */
interface BatchFile {
  /** The actual file object */
  file: File;
  
  /** Original filename */
  filename: string;
  
  /** Extracted patient information from filename */
  patientInfo?: {
    /** Patient ID */
    id: string;
    /** Patient's paternal surname */
    apellido_paterno: string;
    /** Patient's maternal surname */
    apellido_materno: string;
    /** Patient's first name */
    nombre: string;
    /** Medical record number */
    numero: string;
    /** Document type (CONS/EMER) */
    tipo: string;
  };
  
  /** Current processing status */
  status: 'pending' | 'processing' | 'completed' | 'error';
  
  /** Processing progress (0-100) */
  progress: number;
  
  /** Processing start time */
  startTime?: Date;
  
  /** Processing completion time */
  completedTime?: Date;
  
  /** Error message if processing failed */
  error?: string;
  
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number;
}

/**
 * Interface for batch upload session
 * 
 * @interface BatchUpload
 * @description Represents a complete batch upload session with
 * overall status, progress tracking, and file collection.
 */
interface BatchUpload {
  /** Unique batch ID */
  id?: string;
  
  /** Overall batch status */
  status: 'pending' | 'processing' | 'completed' | 'failed';
  
  /** Total number of files in batch */
  total_files: number;
  
  /** Number of files currently processed */
  processed_files: number;
  
  /** Number of files successfully completed */
  completed_files: number;
  
  /** Number of files with errors */
  error_files: number;
  
  /** Array of batch files */
  files: BatchFile[];
  
  /** Batch processing start time */
  startTime?: Date;
  
  /** Estimated total processing time */
  estimatedTotalTime?: number;
}

/**
 * Admin Bulk Upload Component for batch processing medical documents
 * 
 * @description Administrative interface for bulk uploading and processing
 * medical documents with automatic patient extraction and matching.
 * Provides drag & drop functionality and batch processing configuration.
 * 
 * @example
 * ```typescript
 * // Used in admin route
 * // Route: '/admin-bulk-upload'
 * <app-admin-bulk-upload></app-admin-bulk-upload>
 * 
 * // Provides:
 * // - Drag & drop file upload
 * // - Batch processing of medical documents
 * // - Patient information extraction
 * // - Progress tracking and error handling
 * ```
 * 
 * @features
 * - Bulk document upload with drag & drop
 * - Automatic filename parsing for TecSalud format
 * - Patient information extraction from filenames
 * - Batch processing with progress tracking
 * - Error handling and retry mechanisms
 * - Real-time progress indicators
 * - File validation and filtering
 * - Responsive design for mobile devices
 * 
 * @fileNameFormat
 * Expected format: `{ID}_{APELLIDO_PATERNO}, {APELLIDO_MATERNO}_{NOMBRE}_{NUMERO}_{TIPO}.pdf`
 * Example: `3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf`
 * 
 * @supportedTypes
 * - PDF documents (.pdf)
 * - Images (.jpg, .jpeg, .png)
 * - Office documents (.doc, .docx)
 * 
 * @processingStates
 * - pending: File queued for processing
 * - processing: Currently being processed
 * - completed: Successfully processed
 * - error: Processing failed
 * 
 * @since 1.0.0
 */
@Component({
  selector: 'app-admin-bulk-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, BambooModule],
  template: `
    <div class="global-container">
      <!-- Header -->
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
            <h1 class="main-title">🔧 Carga Masiva de Expedientes</h1>
            <div class="main-subtitle">
              Procesamiento automático con OCR → OneLake + Cosmos DB
            </div>
          </div>
        </div>
      </div>

      <!-- Premium Upload Interface -->
      <div class="premium-upload-interface">
        <div class="upload-row">
          <!-- Compact Drop Zone usando sistema estandarizado -->
          <div 
            class="drop-zone-compact"
          [class.drag-over]="isDragOver"
          [class.has-files]="batchFiles.length > 0"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()">
          
            <div class="drop-icon">📁</div>
            <div class="drop-content">
              <div class="drop-title">Seleccionar Expedientes</div>
              <div class="drop-subtitle">
                <span class="format-badge">PDF</span>
                <span> • Formato TecSalud</span>
            </div>
          </div>
          
          <input 
            #fileInput
            type="file"
            multiple
              accept=".pdf"
            (change)="onFileSelected($event)"
              class="file-input-hidden">
        </div>

          <!-- Process Controls -->
          <div class="process-controls">
            <div class="file-counter" *ngIf="batchFiles.length > 0">
              <span class="count-number">{{ batchFiles.length }}</span>
              <span class="count-label">expedientes</span>
            </div>
            
        <button 
              *ngIf="batchFiles.length > 0 && !isProcessing"
              class="premium-process-btn"
          (click)="startBatchProcessing()">
              <span class="btn-icon">🚀</span>
              <span class="btn-text">Procesar Lote</span>
        </button>
            
            <div *ngIf="isProcessing" class="processing-indicator">
              <div class="spinner-icon">⏳</div>
              <span class="processing-text">Procesando...</span>
        </div>
      </div>
              </div>
            </div>

      <!-- Global Progress Section -->
      <div class="global-progress-section" *ngIf="isProcessing || batchUpload?.status === 'completed'">
        <div class="progress-header">
          <div class="progress-info">
            <h3 class="progress-title">Procesamiento de Lote</h3>
            <div class="progress-stats">
              <span class="stat">{{ batchUpload?.completed_files || 0 }} de {{ batchUpload?.total_files || 0 }} completados</span>
              <span class="percentage">{{ getOverallProgress() | number:'1.0-0' }}%</span>
              </div>
              </div>
            </div>

        <div class="progress-bar-global">
          <div 
            class="progress-fill-global" 
            [style.width.%]="getOverallProgress()">
                  </div>
                  </div>
        
        <div class="progress-details" *ngIf="hasErrors()">
          <span class="errors-info">{{ batchUpload?.error_files }} archivo(s) con errores</span>
              </div>
            </div>

        <!-- Files List -->
        <div class="files-section" *ngIf="batchFiles.length > 0">
          <h3 class="files-title">📋 Expedientes Seleccionados</h3>
          
          <div class="file-list">
            <div 
              *ngFor="let file of batchFiles; trackBy: trackByFile"
              class="file-item"
              [class]="'status-' + file.status">
              
              <!-- File Info -->
              <div class="file-info">
                <div class="file-name">{{ truncateFilename(file.filename, 60) }}</div>
                <div class="file-details">
                  {{ file.patientInfo?.apellido_paterno }} {{ file.patientInfo?.apellido_materno }}, {{ file.patientInfo?.nombre }}
        </div>
      </div>

              <!-- Status & Progress -->
              <div class="file-status">
                <div *ngIf="file.status === 'pending'" class="status-pending">
                  ⏳ Pendiente
        </div>

                <div *ngIf="file.status === 'processing'" class="status-uploading">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
                      [style.width.%]="file.progress">
          </div>
        </div>
                  <span>{{ file.progress }}%</span>
      </div>

                <div *ngIf="file.status === 'completed'" class="status-success">
                  ✅ Completado
                </div>
                
                <div *ngIf="file.status === 'error'" class="status-error">
                  ❌ Error
            </div>
          </div>
          
              <!-- Actions -->
              <div class="file-actions">
                <button 
                  *ngIf="file.status === 'pending' && !isProcessing"
                  class="remove-button"
                  (click)="removeFile(file)"
                  title="Eliminar archivo">
                  🗑️
                </button>
                
                <span *ngIf="file.status === 'processing' && file.estimatedTimeRemaining" 
                      class="time-remaining">
                  ~{{ file.estimatedTimeRemaining }}s
                </span>
                
                <span *ngIf="file.status === 'completed' && file.completedTime" 
                      class="time-completed">
                  {{ formatCompletionTime(file.completedTime) }}
                </span>
          </div>
          
            </div>
          </div>
        </div>

      <!-- Reduced spacing before completion summary when processing -->
      <div style="height: 10px;"></div>

      <!-- Completion Summary -->
      <div class="completion-summary" *ngIf="batchUpload?.status === 'completed'" style="margin-bottom: 30px !important;">
        <div class="success-content">
          <div class="success-icon">🎉</div>
          <div class="success-info">
            <h3 class="success-title">¡Procesamiento Completado!</h3>
            <p class="success-subtitle">
              {{ batchUpload?.completed_files }} expedientes procesados exitosamente
                          <span *ngIf="hasErrors()">
              • {{ batchUpload?.error_files }} con errores
            </span>
            </p>
          </div>
        </div>

        <div class="completion-actions">
          <button 
            class="action-btn primary"
            (click)="testSearchWithNewDocuments()">
            <span class="btn-icon">🔍</span>
            <span class="btn-text">Probar en Chat Médico</span>
          </button>
          <button 
            class="action-btn secondary"
            (click)="startNewBatch()">
            <span class="btn-icon">🔄</span>
            <span class="btn-text">Procesar Más Expedientes</span>
          </button>
        </div>
      </div>

      <!-- ✅ REDUCED BOTTOM SPACER -->
      <div style="height: 40px; width: 100%;"></div>

    </div>
  `,
  styles: [`
    /* 🎨 COMPONENTE ESPECÍFICO - BULK UPLOAD */

    /* 🎨 PREMIUM UPLOAD INTERFACE */
    .premium-upload-interface {
      margin-bottom: var(--bmb-spacing-l);
      
      .upload-row {
        display: grid;
        grid-template-columns: 1fr auto;
        gap: var(--bmb-spacing-l);
          align-items: center;
        background: var(--general_contrasts-input-background);
          border: 1px solid var(--general_contrasts-container-outline);
        border-radius: var(--bmb-radius-m);
        padding: var(--bmb-spacing-l);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          
          &:hover {
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
          }
        }
          }
          
    /* 🗑️ Estilos eliminados - Ahora usa .drop-zone-compact global */

    /* 🎯 PROCESS CONTROLS */
    .process-controls {
        display: flex;
        flex-direction: column;
      align-items: center;
        gap: var(--bmb-spacing-m);
    }

    .premium-process-btn {
      background: linear-gradient(135deg, rgb(var(--color-blue-tec)) 0%, rgba(var(--color-blue-tec), 0.9) 100%);
      color: white;
        border: none;
      padding: var(--bmb-spacing-m) var(--bmb-spacing-xl);
        border-radius: var(--bmb-radius-m);
        font-weight: 600;
          cursor: pointer;
        transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(var(--color-blue-tec), 0.3);
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-s);
      font-size: 1rem;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(var(--color-blue-tec), 0.4);
        }
        
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
        }
      }

    .processing-indicator {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-s);
      padding: var(--bmb-spacing-m);
      background: rgba(var(--color-blue-tec), 0.1);
      border-radius: var(--bmb-radius-m);
      color: rgb(var(--color-blue-tec));
      font-weight: 500;
      
      .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(var(--color-blue-tec), 0.3);
        border-top: 2px solid rgb(var(--color-blue-tec));
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* 📊 GLOBAL PROGRESS SECTION */
    .global-progress-section {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid rgba(var(--color-blue-tec), 0.2);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-l);
        margin-bottom: var(--bmb-spacing-l);
      
      .progress-header {
        margin-bottom: var(--bmb-spacing-m);
        
        .progress-info {
        display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
        gap: var(--bmb-spacing-s);
        
          .progress-title {
            font-size: 1.5rem;
            font-weight: 700;
        color: var(--general_contrasts-100);
            margin: 0;
      }
      
          .progress-stats {
        display: flex;
            gap: var(--bmb-spacing-m);
            align-items: center;
            
            .stat {
          font-size: 1rem;
              color: var(--general_contrasts-75);
          font-weight: 500;
            }
            
            .percentage {
              font-size: 1.5rem;
              font-weight: 700;
              color: rgb(var(--color-blue-tec));
            }
          }
        }
      }
      
      .progress-bar-global {
        width: 100%;
        height: 12px;
        background: var(--general_contrasts-25);
        border-radius: var(--bmb-radius-full);
        overflow: hidden;
        margin-bottom: var(--bmb-spacing-m);
        
        .progress-fill-global {
          height: 100%;
          background: linear-gradient(90deg, 
          rgb(var(--color-blue-tec)) 0%, 
            var(--buttons-primary-hover) 100%
          );
          transition: width 0.5s ease;
        }
      }
      
      .progress-details {
        text-align: center;
        
        .errors-info {
          color: var(--semantic-error);
          font-size: 0.875rem;
          font-weight: 500;
        }
      }
    }

    /* 📋 FILES LIST - CONSISTENTE CON DOCUMENT-UPLOAD */
    .files-section {
      margin-bottom: var(--bmb-spacing-l);
      
      .files-title {
        color: var(--general_contrasts-100);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--bmb-spacing-l);
        text-align: center;
      }
    }

    .file-list {
      display: flex;
      flex-direction: column;
      gap: var(--bmb-spacing-m);
    }

    .file-item {
      background: var(--general_contrasts-15);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-m);
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-m);
      transition: all 0.3s ease;
      
      &.status-completed {
        border-color: var(--semantic-success);
        background: rgba(76, 175, 80, 0.1);
      }
      
      &.status-error {
        border-color: var(--semantic-error);
        background: rgba(244, 67, 54, 0.1);
      }
      
      &.status-processing {
        border-color: rgb(var(--color-blue-tec));
        background: rgba(var(--color-blue-tec), 0.1);
      }
      
      /* Hover effect siguiendo patrón de admin-pills-manager */
      &:hover {
        background: var(--medical-context-active);
        cursor: pointer;
      }
    }

    .file-info {
      flex: 1;
        
        .file-name {
          font-weight: 600;
          color: var(--general_contrasts-100);
        margin-bottom: var(--bmb-spacing-xs);
          }
          
      .file-details {
        font-size: 0.875rem;
            color: var(--general_contrasts-75);
      }
    }

    .file-status {
      min-width: 120px;
      text-align: center;
      
      .status-pending {
        color: var(--general_contrasts-75);
        font-size: 0.875rem;
    }

      .status-uploading {
    .progress-bar {
          width: 80px;
          height: 6px;
      background: var(--general_contrasts-25);
          border-radius: var(--bmb-radius-full);
      overflow: hidden;
          margin-bottom: var(--bmb-spacing-xs);
      
      .progress-fill {
            height: 100%;
        background: linear-gradient(90deg, 
          rgb(var(--color-blue-tec)) 0%, 
              var(--buttons-primary-hover) 100%
        );
        transition: width 0.3s ease;
      }
    }

        span {
          font-size: 0.75rem;
          color: rgb(var(--color-blue-tec));
            font-weight: 600;
        }
      }
      
      .status-success {
        color: var(--semantic-success);
        font-weight: 600;
      }
      
      .status-error {
        color: var(--semantic-error);
        font-size: 0.75rem;
        }
      }
      
      .file-actions {
        .remove-button {
        background: none;
          border: none;
          cursor: pointer;
        padding: var(--bmb-spacing-xs);
        border-radius: var(--bmb-radius-s);
        transition: background 0.2s ease;
          
          &:hover {
          background: rgba(244, 67, 54, 0.1);
          }
        }
        
      .time-remaining,
      .time-completed {
        font-size: 0.75rem;
        color: var(--general_contrasts-75);
      }
    }

    /* 🎉 COMPLETION SUMMARY */
    .completion-summary {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid rgba(var(--color-blue-tec), 0.2);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-l);
        margin-bottom: var(--bmb-spacing-l);
        
      .success-content {
        display: flex;
        align-items: center;
      gap: var(--bmb-spacing-m);
      margin-bottom: var(--bmb-spacing-l);
        
        .success-icon {
          font-size: 3rem;
        }
        
        .success-info {
          flex: 1;
          
          .success-title {
            font-size: 1.5rem;
        font-weight: 700;
            color: var(--general_contrasts-100);
            margin: 0 0 var(--bmb-spacing-xs) 0;
      }
      
          .success-subtitle {
        color: var(--general_contrasts-75);
            margin: 0;
          }
        }
      }
      
      .completion-actions {
      display: flex;
      gap: var(--bmb-spacing-m);
      
        .action-btn {
          padding: var(--bmb-spacing-m) var(--bmb-spacing-l);
        border-radius: var(--bmb-radius-s);
        font-weight: 500;
        cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
            align-items: center;
            gap: var(--bmb-spacing-s);
        
          &.primary {
            background: rgb(var(--color-blue-tec));
          color: white;
            border: none;
          
          &:hover {
              background: rgba(var(--color-blue-tec), 0.9);
              transform: translateY(-2px);
        }
      }
      
          &.secondary {
            background: var(--general_contrasts-15);
            color: var(--general_contrasts-100);
            border: 1px solid var(--general_contrasts-container-outline);
          
          &:hover {
              background: var(--general_contrasts-25);
              transform: translateY(-2px);
            }
          }
        }
      }
    }
    
    /* 📱 RESPONSIVE DESIGN */
    @media (max-width: 950px) {
      .upload-row {
        grid-template-columns: 1fr !important;
        gap: var(--bmb-spacing-m) !important;
        
        .compact-drop-zone {
          min-width: auto !important;
          justify-content: center !important;
      }
      
        .process-controls {
          align-items: center !important;
          
          .premium-process-btn {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      }
      
      .global-progress-section {
        padding: var(--bmb-spacing-m) !important;
        
        .progress-header {
          .progress-info {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            gap: var(--bmb-spacing-s) !important;
            
            .progress-title {
              font-size: 1.2rem !important;
          }
          
            .progress-stats {
              flex-direction: column !important;
              gap: var(--bmb-spacing-xs) !important;
              
              .stat {
                font-size: 0.9rem !important;
      }
      
              .percentage {
                font-size: 1.3rem !important;
      }
    }
          }
        }
      }
      
      .file-list {
        gap: var(--bmb-spacing-s) !important;
      }
      
      .file-item {
        flex-direction: column !important;
        align-items: stretch !important;
        gap: var(--bmb-spacing-s) !important;
        text-align: center !important;
        
        .file-info {
          order: 1;
      }
      
        .file-status {
          order: 2;
          min-width: auto !important;
      }
      
        .file-actions {
          order: 3;
      }
    }
    
      .completion-summary {
        .success-content {
          flex-direction: column !important;
          text-align: center !important;
      }
      
        .completion-actions {
          flex-direction: column !important;
          
          .action-btn {
            width: 100% !important;
            justify-content: center !important;
          }
        }
      }
    }

    /* 🎯 FILES LIST - HOVER SIMPLE SIGUIENDO PATRÓN DE ADMIN-PILLS-MANAGER */
    .file-item {
      &:hover {
        background: var(--medical-context-active);
        cursor: pointer;
      }
    }
  `]
})
export class AdminBulkUploadComponent implements OnInit {
  /** API service for backend communication */
  private apiService = inject(ApiService);
  
  /** Router for navigation */
  private router = inject(Router);
  
  /** Location service for history navigation */
  private location = inject(Location);
  
  /** Array of files in the current batch */
  batchFiles: BatchFile[] = [];
  
  /** Current batch upload session */
  batchUpload: BatchUpload | null = null;
  
  /** Flag indicating if drag operation is over drop zone */
  isDragOver = false;
  
  /** Flag indicating if batch processing is in progress */
  isProcessing = false;

  /**
   * Component initialization lifecycle hook
   * 
   * @description Initializes the component and logs initialization
   */
  ngOnInit(): void {
    console.log('🔧 Admin Bulk Upload Component initialized - MVP Mode');
  }

  /**
   * Handles drag over events for the drop zone
   * 
   * @param event - DragEvent from the drag operation
   * 
   * @description Prevents default browser behavior and sets drag over state
   */
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  /**
   * Handles drag leave events for the drop zone
   * 
   * @param event - DragEvent from the drag operation
   * 
   * @description Prevents default browser behavior and clears drag over state
   */
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  /**
   * Handles file drop events for the drop zone
   * 
   * @param event - DragEvent containing the dropped files
   * 
   * @description Processes dropped files and adds them to batch
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = Array.from(event.dataTransfer?.files || []) as File[];
    this.processFiles(files);
  }

  /**
   * Handles file selection from file input
   * 
   * @param event - File input change event
   * 
   * @description Processes selected files and adds them to batch
   */
  onFileSelected(event: any): void {
    const files = Array.from(event.target.files || []) as File[];
    this.processFiles(files);
  }

  private processFiles(files: File[]): void {
    const validFiles = files.filter(file => this.isValidFile(file));
    
    validFiles.forEach(file => {
      const patientInfo = this.parseTecSaludFilename(file.name);
      
      const batchFile: BatchFile = {
        file: file,
        filename: file.name,
        patientInfo: patientInfo,
        status: 'pending',
        progress: 0
      };
      
      this.batchFiles.push(batchFile);
    });

    console.log(`📂 Added ${validFiles.length} files, ${this.batchFiles.length} total in queue`);
  }

  private isValidFile(file: File): boolean {
    return file.type === 'application/pdf' && file.size > 0;
  }

  private parseTecSaludFilename(filename: string): any | null {
    const pattern = /^(\d+)_([^,]+),\s*([^_]+)_(\d+)_([A-Z]+)\./;
    const match = filename.match(pattern);
    
    if (match) {
      const [, id, apellidos, nombre, numero, tipo] = match;
      const apellidosParts = apellidos.trim().split(' ');
      
      return {
        id,
        apellido_paterno: apellidosParts[0] || '',
        apellido_materno: apellidosParts[1] || '',
        nombre: nombre.trim(),
        numero,
        tipo
      };
    }
    
    return null;
  }

  async startBatchProcessing(): Promise<void> {
    if (this.batchFiles.length === 0 || this.isProcessing) return;
    
    this.isProcessing = true;
    
      this.batchUpload = {
        status: 'processing',
        total_files: this.batchFiles.length,
        processed_files: 0,
      completed_files: 0,
      error_files: 0,
      files: this.batchFiles,
      startTime: new Date()
      };

    console.log('🚀 Starting async batch processing (MOCK) for', this.batchFiles.length, 'files');

    // Process files asynchronously with realistic timing
      for (let i = 0; i < this.batchFiles.length; i++) {
      const file = this.batchFiles[i];
      this.processFileAsync(file, i);
    }
  }

  private async processFileAsync(file: BatchFile, index: number): Promise<void> {
    // Random delay to simulate real processing time (3-15 seconds)
    const processingTime = 3000 + Math.random() * 12000;
    const estimatedSeconds = Math.round(processingTime / 1000);
    
    file.status = 'processing';
    file.startTime = new Date();
    file.estimatedTimeRemaining = estimatedSeconds;
    file.progress = 0;

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      if (file.status === 'processing' && file.progress < 100) {
        file.progress = Math.min(100, file.progress + Math.random() * 15);
        
        // Update time remaining
        if (file.estimatedTimeRemaining && file.estimatedTimeRemaining > 0) {
          file.estimatedTimeRemaining = Math.max(0, file.estimatedTimeRemaining - 1);
        }
      }
    }, 1000);

    // Wait for processing to complete
    await new Promise(resolve => setTimeout(resolve, processingTime));
          
    clearInterval(progressInterval);
          
    // 85% success rate simulation
    const isSuccess = Math.random() > 0.15;
    
    if (isSuccess) {
      file.status = 'completed';
      file.progress = 100;
      file.completedTime = new Date();
      this.batchUpload!.completed_files++;
          } else {
      file.status = 'error';
      file.error = 'Error en OCR: formato no reconocido';
      this.batchUpload!.error_files++;
      }

    this.batchUpload!.processed_files++;
    
    // Check if all files are done
    if (this.batchUpload!.processed_files === this.batchUpload!.total_files) {
      this.batchUpload!.status = 'completed';
      this.isProcessing = false;
      console.log('🎉 Batch processing completed (MOCK)');
    }
  }

  removeFile(file: BatchFile): void {
    const index = this.batchFiles.indexOf(file);
    if (index > -1) {
      this.batchFiles.splice(index, 1);
    }
  }

  clearPendingFiles(): void {
    this.batchFiles = this.batchFiles.filter(file => file.status !== 'pending');
  }

  getOverallProgress(): number {
    if (!this.batchUpload || this.batchUpload.total_files === 0) return 0;
    return (this.batchUpload.processed_files / this.batchUpload.total_files) * 100;
  }

  formatCompletionTime(completedTime: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - completedTime.getTime();
    const diffSeconds = Math.round(diffMs / 1000);
    
    if (diffSeconds < 60) return `${diffSeconds}s`;
    const diffMinutes = Math.round(diffSeconds / 60);
    return `${diffMinutes}m`;
  }

  testSearchWithNewDocuments(): void {
    console.log('🔍 Navigating to medical chat to test new documents');
    this.router.navigate(['/copiloto-medico']);
  }

  startNewBatch(): void {
    this.batchFiles = [];
    this.batchUpload = null;
    this.isProcessing = false;
    console.log('🔄 Started new batch processing session');
  }

  goBack(): void {
    this.location.back();
  }

  trackByFile(index: number, file: BatchFile): string {
    return file.filename;
  }

  truncateFilename(filename: string, maxLength: number): string {
    return filename.length > maxLength ? filename.substring(0, maxLength) + '...' : filename;
  }

  hasPendingFiles(): boolean {
    return this.batchFiles.some(file => file.status === 'pending');
  }

  hasErrors(): boolean {
    return this.batchUpload?.error_files !== undefined && this.batchUpload.error_files > 0;
  }
} 