import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { BambooModule } from '../../shared/bamboo.module';
import { ApiService } from '../../core/services/api.service';
import { BatchUploadRequest, BatchUploadResponse, SuccessfulDocument, FailedDocument, ProcessingSummary } from '../../core/models';

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

  /** Warning message (e.g., medical info extraction failed but document processed) */
  warning?: string;

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
          <div class="header-back-row">
          <button
              class="global-back-button"
            (click)="goBack()"
            title="Volver al dashboard">
            <span class="back-icon">←</span>
            <span class="back-text">Volver</span>
          </button>
      </div>

          <div class="header-title-row">
            <div class="title-container">
              <h1 class="main-title">🔧 Carga Masiva de Expedientes</h1>
              <div class="main-subtitle">
                Procesamiento automático con OCR → OneLake + Cosmos DB
            </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Premium Upload Interface -->
      <div class="premium-upload-interface">
        <div class="upload-row">
          <!-- Premium Drop Zone -->
        <div
            class="premium-drop-zone"
          [class.drag-over]="isDragOver"
          [class.has-files]="batchFiles.length > 0"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()">

          <div class="drop-zone-content">
              <div class="drop-icon-container">
                <div class="drop-icon">📁</div>
            </div>

              <div class="drop-text-content">
                <h3 class="drop-title">Arrastra expedientes aquí</h3>
                <div class="drop-subtitle">
                  <span class="format-badge-premium">PDF</span>
                </div>
                <div class="drop-hint">o haz clic para seleccionar archivos</div>
            </div>

              <div class="drop-action-indicator">
                <span class="action-text">📤 Subir</span>
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
              <span class="count-label">{{ batchFiles.length === 1 ? 'expediente' : 'expedientes' }}</span>
            </div>



        <button
              *ngIf="batchFiles.length > 0 && !isProcessing"
              class="premium-process-btn"
          (click)="startBatchProcessing()">
              <span class="btn-icon">🚀</span>
              <span class="btn-text">Procesar Expedientes</span>
        </button>

            <div *ngIf="isProcessing" class="processing-indicator">
              <span class="processing-text">Procesando</span>
              <div class="processing-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
        </div>
      </div>
              </div>
              </div>
            </div>



        <!-- Files List -->
        <div class="files-section" *ngIf="batchFiles.length > 0">
          <h3 class="section-title">📋 Expedientes Seleccionados</h3>

          <!-- Premium Files List -->
          <div class="files-list">
            <div
              *ngFor="let file of batchFiles; trackBy: trackByFile"
              class="file-item"
              [class]="'status-' + file.status">

              <!-- File Icon & Info -->
              <div class="file-info">
                <div class="file-icon-container">
                  <span class="file-icon">📄</span>
                </div>
                <div class="file-content">
                  <div class="file-name">{{ truncateFilename(file.filename, 60) }}</div>
                  <div class="file-meta">
                    <span class="file-size">{{ getFileSize(file.file.size) }}</span>
                    <span class="file-type-badge" [class]="'type-' + file.patientInfo?.tipo">
                      {{ file.patientInfo?.tipo || 'UNKNOWN' }}
                    </span>
                    <span class="file-patient">{{ file.patientInfo?.apellido_paterno }} {{ file.patientInfo?.apellido_materno }}, {{ file.patientInfo?.nombre }}</span>
                  </div>
                </div>
              </div>

              <!-- File Status & Progress -->
              <div class="file-status">
                <div *ngIf="file.status === 'pending'" class="status-badge status-pending">
                  <span class="status-icon">⏳</span>
                  <span class="status-text">Pendiente</span>
                </div>

                <div *ngIf="file.status === 'processing'" class="status-badge status-processing">
                  <span class="status-text">Procesando</span>
                  <div class="processing-dots">
                    <span class="dot"></span>
                    <span class="dot"></span>
                    <span class="dot"></span>
                  </div>
                </div>

                <div *ngIf="file.status === 'completed'" class="status-badge status-success">
                  <span class="status-icon">✅</span>
                  <span class="status-text">Completado</span>
                  <div *ngIf="file.warning" class="warning-indicator" [title]="file.warning">
                    <span class="warning-icon">⚠️</span>
                  </div>
                </div>

                <div *ngIf="file.status === 'error'" class="status-badge status-error">
                  <span class="status-icon">❌</span>
                  <span class="status-text">Error</span>
                  <div *ngIf="file.error" class="error-indicator" [title]="file.error">
                    <span class="error-icon">❌</span>
                  </div>
                </div>
              </div>

              <!-- File Actions -->
              <div class="file-actions">
                <button
                  *ngIf="file.status === 'pending' && !isProcessing"
                  class="action-button remove-button"
                  (click)="removeFile(file)"
                  title="Eliminar archivo">
                  <span class="action-icon">🗑️</span>
                  <span class="action-text">Eliminar</span>
                </button>
              </div>

            </div>
          </div>
        </div>

      <!-- Reduced spacing before completion summary when processing -->
      <div style="height: 10px;"></div>

      <!-- Completion Summary -->
      <div class="completion-summary" *ngIf="batchUpload?.status === 'completed' && !hasErrorsOrWarnings()">
        <div class="success-content">
          <div class="success-info">
            <h3 class="success-title">¡Procesamiento Completado!</h3>
            <p class="success-subtitle">
              {{ batchUpload?.completed_files }} expedientes procesados exitosamente
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
      width: 100%;
      max-width: 1200px;
      margin-left: auto;
      margin-right: auto;

      .upload-row {
        display: flex;
        flex-direction: column;
        gap: var(--bmb-spacing-l);
          align-items: center;
        background: var(--general_contrasts-surface);
          border: 1px solid var(--general_contrasts-container-outline);
        border-radius: var(--bmb-radius-l);
        padding: var(--bmb-spacing-l);
        box-shadow: var(--medical-shadow);
          transition: all 0.3s ease;
        width: 100%;

          &:hover {
          box-shadow: var(--medical-shadow-hover);
          }
        }
    }

    /* 🎯 PREMIUM DROP ZONE */
    .premium-drop-zone {
      position: relative;
      background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
      border: 2px dashed var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-l);
      padding: var(--bmb-spacing-xl);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      min-height: 180px;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;

      &:hover {
        border-color: rgba(var(--color-blue-tec), 0.4);
            background: linear-gradient(135deg,
          rgba(var(--color-blue-tec), 0.02) 0%,
          rgba(var(--color-blue-tec), 0.05) 100%
            );
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(var(--color-blue-tec), 0.15);
      }

      &.drag-over {
        border-color: rgba(var(--color-blue-tec), 0.6);
        background: linear-gradient(135deg,
          rgba(var(--color-blue-tec), 0.1) 0%,
          rgba(var(--color-blue-tec), 0.15) 100%
        );
        transform: scale(1.02);
        box-shadow: 0 12px 35px rgba(var(--color-blue-tec), 0.25);
          }

      &.has-files {
        border-color: var(--semantic-success);
      background: linear-gradient(135deg,
          rgba(76, 175, 80, 0.05) 0%,
          rgba(76, 175, 80, 0.1) 100%
      );
      }
    }

    .drop-zone-content {
        display: flex;
        flex-direction: column;
      align-items: center;
        gap: var(--bmb-spacing-m);
      text-align: center;
      width: 100%;
    }

    .drop-icon-container {
      position: relative;

      .drop-icon {
        font-size: var(--text-4xl);
        opacity: 0.8;
        transition: all 0.3s ease;
        display: block;
      }
    }

    .premium-drop-zone:hover .drop-icon {
      font-size: 3rem;
      opacity: 1;
      transform: scale(1.1) rotate(5deg);
    }

    .drop-text-content {
      display: flex;
      flex-direction: column;
      gap: var(--bmb-spacing-s);
      align-items: center;

      .drop-title {
        font-size: var(--text-xl);
        font-weight: var(--font-semibold);
        color: var(--general_contrasts-text-primary);
        margin: 0;
        font-family: var(--font-display);
        line-height: var(--leading-tight);
      }

      .drop-subtitle {
        display: flex;
        align-items: center;
        gap: var(--bmb-spacing-xs);
        flex-wrap: wrap;
        justify-content: center;

        .format-badge-premium {
          background: linear-gradient(135deg,
            rgba(var(--color-blue-tec), 0.1) 0%,
            rgba(var(--color-blue-tec), 0.15) 100%
          );
          color: rgba(var(--color-blue-tec), 1);
          padding: var(--bmb-spacing-xs) var(--bmb-spacing-s);
          border-radius: var(--bmb-radius-s);
          font-size: var(--text-xs);
          font-weight: var(--font-semibold);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 1px solid rgba(var(--color-blue-tec), 0.2);
        }
      }

      .drop-hint {
        font-size: var(--text-sm);
        color: var(--general_contrasts-50);
        font-weight: var(--font-regular);
        opacity: 0.8;
        margin-top: var(--bmb-spacing-xs);
      }
    }

    .drop-action-indicator {
      position: absolute;
      top: var(--bmb-spacing-m);
      right: var(--bmb-spacing-m);
      opacity: 0;
      transition: all 0.3s ease;

      .action-text {
        background: rgba(var(--color-blue-tec), 0.1);
        color: rgba(var(--color-blue-tec), 1);
        padding: var(--bmb-spacing-xs) var(--bmb-spacing-s);
        border-radius: var(--bmb-radius-s);
        font-size: var(--text-xs);
        font-weight: var(--font-medium);
        border: 1px solid rgba(var(--color-blue-tec), 0.2);
      }
    }

    .premium-drop-zone:hover .drop-action-indicator {
      opacity: 1;
      transform: translateY(-2px);
    }

    .file-input-hidden {
      display: none;
    }

    /* 🎯 PROCESS CONTROLS */
    .process-controls {
      display: flex;
        flex-direction: column;
      align-items: center;
        gap: var(--bmb-spacing-m);
        width: 100%;
      }

    .file-counter {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--bmb-spacing-xs);
      padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
      background: rgba(var(--color-blue-tec), 0.1);
      border-radius: var(--bmb-radius-m);

      .count-number {
        font-size: var(--text-2xl);
        font-weight: var(--font-bold);
        color: rgba(var(--color-blue-tec), 1);
        line-height: 1;
        }

      .count-label {
        font-size: var(--text-sm);
        color: var(--general_contrasts-text-secondary);
        font-weight: var(--font-medium);
        }
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
      color: rgb(var(--color-blue-tec));
      font-weight: 500;
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

      .section-title {
        color: var(--general_contrasts-100);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--bmb-spacing-l);
        text-align: center;
      }


    }

    .files-list {
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
      cursor: pointer;
      position: relative;
      overflow: hidden;
      border-left: none;
      border-right: none;

      &:hover {
        background: rgba(var(--color-blue-tec), 0.15);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(var(--color-blue-tec), 0.15);
      }

      &.status-completed {
        border-color: var(--semantic-success);
        background: rgba(76, 175, 80, 0.1);

        &:hover {
          background: rgba(var(--color-blue-tec), 0.15);
        }
      }

      &.status-error {
        border-color: var(--semantic-error);
        background: rgba(244, 67, 54, 0.1);

        &:hover {
          background: rgba(var(--color-blue-tec), 0.15);
        }
      }

      &.status-processing {
        border-color: rgb(var(--color-blue-tec));
        background: rgba(var(--color-blue-tec), 0.1);

        &:hover {
          background: rgba(var(--color-blue-tec), 0.15);
        }
      }
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-m);
      flex: 1;
      min-width: 0;

        .file-icon-container {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 48px;
          height: 48px;
          background: rgba(var(--color-blue-tec), 0.1);
          border: 1px solid rgba(var(--color-blue-tec), 0.2);
          border-radius: var(--bmb-radius-m);
          flex-shrink: 0;

          .file-icon {
            font-size: var(--text-xl);
          }
        }

        .file-content {
          display: flex;
          flex-direction: column;
          gap: var(--bmb-spacing-xs);

          .file-name {
            font-weight: 600;
            color: var(--general_contrasts-100);
            word-wrap: break-word;
            overflow-wrap: break-word;
          }

          .file-meta {
            display: flex;
            align-items: center;
            gap: var(--bmb-spacing-xs);
            flex-wrap: wrap;

            .file-size {
            font-size: 0.875rem;
            color: var(--general_contrasts-75);
            }

            .file-type-badge {
              background: linear-gradient(135deg,
                rgba(var(--color-blue-tec), 0.1) 0%,
                rgba(var(--color-blue-tec), 0.15) 100%
              );
              color: rgba(var(--color-blue-tec), 1);
              padding: var(--bmb-spacing-xs) var(--bmb-spacing-s);
              border-radius: var(--bmb-radius-s);
              font-size: var(--text-xs);
              font-weight: var(--font-semibold);
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border: 1px solid rgba(var(--color-blue-tec), 0.2);
            }

            .file-patient {
              font-size: 0.875rem;
              color: var(--general_contrasts-75);
            }
          }
        }
      }

    .file-status {
      min-width: 120px;
      text-align: center;

      .status-badge {
        display: flex;
        align-items: center;
        gap: var(--bmb-spacing-xs);
        font-size: var(--text-sm);
        font-weight: var(--font-medium);
        justify-content: center;

        &.status-pending {
          color: var(--general_contrasts-75);
        }

        &.status-success {
          color: var(--semantic-success);
        }

        &.status-error {
          color: var(--semantic-error);
        }

        .status-icon {
          font-size: var(--text-sm);
        }

        .status-text {
          font-size: var(--text-sm);
          font-weight: var(--font-semibold);
        }

        .completion-time {
          font-size: var(--text-xs);
          opacity: 0.8;
          margin-top: var(--bmb-spacing-xs);
        }

        .warning-indicator {
          display: inline-flex;
          align-items: center;
          margin-left: var(--bmb-spacing-xs);
          cursor: help;

          .warning-icon {
            font-size: var(--text-sm);
            color: #ff9800;
          }
        }

        .error-indicator {
          display: inline-flex;
          align-items: center;
          margin-left: var(--bmb-spacing-xs);
          cursor: help;

          .error-icon {
            font-size: var(--text-sm);
            color: var(--semantic-error);
          }
        }
      }

      .status-uploading {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--bmb-spacing-xs);

        .progress-container {
          width: 80px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--bmb-spacing-xs);

          .progress-bar {
            width: 80px;
            height: 6px;
            background: var(--general_contrasts-25);
            border-radius: var(--bmb-radius-full);
            overflow: hidden;

            .progress-fill {
              height: 100%;
              background: linear-gradient(90deg,
                rgb(var(--color-blue-tec)) 0%,
                var(--buttons-primary-hover) 100%
              );
              transition: width 0.3s ease;
            }
          }

          .progress-text {
            font-size: 0.75rem;
            color: rgb(var(--color-blue-tec));
            font-weight: 600;
          }

          .time-remaining {
            font-size: var(--text-xs);
            color: var(--general_contrasts-75);
            opacity: 0.8;
          }
        }
      }
    }

    .file-actions {
      display: flex;
      gap: var(--bmb-spacing-s);

      .action-button {
        display: flex;
        align-items: center;
        gap: var(--bmb-spacing-xs);
        padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
        border: 1px solid var(--general_contrasts-container-outline);
        border-radius: var(--bmb-radius-s);
        background: var(--general_contrasts-surface);
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: var(--text-sm);
        font-weight: var(--font-medium);

        .action-icon {
          font-size: var(--text-sm);
        }

        .action-text {
          font-size: var(--text-sm);
        }

        &.remove-button {
          color: var(--semantic-error);
          border-color: rgba(244, 67, 54, 0.2);

          &:hover {
            background: rgba(244, 67, 54, 0.1);
            border-color: rgba(244, 67, 54, 0.4);
            transform: translateY(-1px);
          }
        }
      }
    }

    /* 🎉 COMPLETION SUMMARY */
    .completion-summary {
      background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
      border: 1px solid rgba(var(--color-blue-tec), 0.2);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-l);
        margin-bottom: var(--bmb-spacing-l);
      text-align: center;

      .success-content {
        display: flex;
        align-items: center;
        justify-content: center;
      margin-bottom: var(--bmb-spacing-l);

        .success-info {
          text-align: center;

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
      justify-content: center;
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
        flex-direction: column !important;
        gap: var(--bmb-spacing-m) !important;
        align-items: center !important;

        .premium-drop-zone {
          min-height: 140px !important;
          padding: var(--bmb-spacing-l) !important;
          width: 100% !important;

          .drop-zone-content {
            gap: var(--bmb-spacing-s) !important;
      }

          .drop-icon-container .drop-icon {
            font-size: var(--text-2xl) !important;
          }

          .drop-text-content {
          .drop-title {
              font-size: var(--text-lg) !important;
          }

            .drop-subtitle {
              flex-direction: column !important;
              gap: var(--bmb-spacing-xs) !important;
              align-items: center !important;

              .format-badge-premium {
                font-size: var(--text-xs) !important;
                padding: var(--bmb-spacing-xs) !important;
              }
            }

            .drop-hint {
              font-size: var(--text-xs) !important;
            }
        }
      }

        .process-controls {
          width: 100% !important;
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

      .files-section {
        .section-title {
          font-size: 1.2rem !important;
        }
        .files-count {
          flex-direction: column !important;
          align-items: center !important;
          gap: var(--bmb-spacing-xs) !important;
          padding: var(--bmb-spacing-s) !important;

          .count-number {
            font-size: var(--text-xl) !important;
          }
          .count-label {
            font-size: var(--text-sm) !important;
          }
        }
      }

      .files-list {
        gap: var(--bmb-spacing-s) !important;
      }

      .file-item {
        display: flex !important;
        flex-direction: column !important;
        gap: var(--bmb-spacing-s) !important;
        padding: var(--bmb-spacing-s) !important;
        align-items: stretch !important;

        .file-info {
          order: 1 !important;
          width: 100% !important;
          flex-direction: column !important;
          align-items: flex-start !important;

          .file-icon-container {
            width: 100% !important;
            justify-content: flex-start !important;
            margin-bottom: var(--bmb-spacing-xs) !important;
          }

          .file-content {
            order: 2 !important;
            width: 100% !important;

            .file-name {
              font-size: 0.9rem !important;
              margin-bottom: var(--bmb-spacing-xs) !important;
              word-break: break-word !important;
            }

            .file-meta {
              flex-direction: column !important;
              align-items: flex-start !important;
              gap: var(--bmb-spacing-xs) !important;

              .patient-name {
                font-size: 0.8rem !important;
              }

              .file-type-badge {
                font-size: var(--text-xs) !important;
                padding: var(--bmb-spacing-xs) !important;
              }

              .file-id {
                font-size: 0.8rem !important;
              }
            }
          }
        }

        .file-status {
          order: 2 !important;
          width: 100% !important;
          min-width: auto !important;
          display: flex !important;
          justify-content: center !important;
          padding: var(--bmb-spacing-xs) !important;
          background: var(--general_contrasts-25) !important;
          border-radius: var(--bmb-radius-s) !important;

          .status-badge {
            flex-direction: row !important;
            gap: var(--bmb-spacing-xs) !important;

            .completion-time {
              margin-top: 0 !important;
              margin-left: var(--bmb-spacing-xs) !important;
            }
          }

          .status-uploading {
            .progress-container {
              width: 60px !important;

              .progress-bar {
                width: 60px !important;
                height: 4px !important;
              }

              .progress-text {
                font-size: 0.75rem !important;
              }

              .time-remaining {
                font-size: var(--text-xs) !important;
              }
            }
          }
        }

        .file-actions {
          order: 3 !important;
          display: flex !important;
          justify-content: center !important;
          width: 100% !important;

          .action-button {
            padding: var(--bmb-spacing-s) !important;
            font-size: 0.9rem !important;

            .action-icon {
              font-size: 0.9rem !important;
            }

            .action-text {
              font-size: 0.9rem !important;
            }
          }
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



    /* Warning indicator styles */
    .warning-indicator {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-xs);
      margin-top: var(--bmb-spacing-xs);
      padding: var(--bmb-spacing-xs) var(--bmb-spacing-s);
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid rgba(255, 193, 7, 0.3);
      border-radius: var(--bmb-radius-s);
      font-size: var(--text-xs);
      color: #856404;
      cursor: help;
    }

    .warning-icon {
      font-size: var(--text-xs);
    }

    .warning-text {
      font-weight: var(--font-medium);
    }

    /* Processing animation styles */
    .status-processing {
      color: #1e40af;
    }



    .processing-dots {
      display: flex;
      gap: 4px;
      margin-left: var(--bmb-spacing-xs);
    }

    .processing-dots .dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: currentColor;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .processing-dots .dot:nth-child(1) {
      animation-delay: 0s;
    }

    .processing-dots .dot:nth-child(2) {
      animation-delay: 0.2s;
    }

    .processing-dots .dot:nth-child(3) {
      animation-delay: 0.4s;
      }

    @keyframes pulse {
      0%, 80%, 100% {
        opacity: 0.3;
        transform: scale(0.8);
      }
      40% {
        opacity: 1;
        transform: scale(1);
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
   * @description Processes dropped file (only one at a time)
   */
  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;

    const files = Array.from(event.dataTransfer?.files || []) as File[];
    if (files.length > 0) {
      // Clear existing files since we only allow one at a time
      this.batchFiles = [];
      this.processFiles([files[0]]); // Only take the first file
    }
  }

  /**
   * Handles file selection from file input
   *
   * @param event - File input change event
   *
   * @description Processes selected file (only one at a time)
   */
  onFileSelected(event: any): void {
    const files = Array.from(event.target.files || []) as File[];
    if (files.length > 0) {
    this.processFiles(files);
    }
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
    const validTypes = [
      'application/pdf'
    ];

    const validExtensions = ['.pdf', '.docx', '.txt'];
    const hasValidExtension = validExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension || file.size > 10 * 1024 * 1024) { // 10MB limit
      console.warn(`⚠️ Invalid file: ${file.name}`);
      return false;
    }

    return true;
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

  startBatchProcessing(): void {
    if (this.batchFiles.length === 0 || this.isProcessing) return;

    this.isProcessing = true;

    // Initialize batch upload state
      this.batchUpload = {
        status: 'processing',
        total_files: this.batchFiles.length,
        processed_files: 0,
      completed_files: 0,
      error_files: 0,
      files: this.batchFiles,
      startTime: new Date()
      };

    console.log('🚀 Starting real batch processing for', this.batchFiles.length, 'files');

    // Set all files to processing status
    this.batchFiles.forEach(file => {
      file.status = 'processing';
      file.startTime = new Date();
      file.error = undefined; // Clear any previous errors
      file.warning = undefined; // Clear any previous warnings
    });

    // Prepare batch upload request
    const batchRequest: BatchUploadRequest = {
      files: this.batchFiles.map(bf => bf.file),
      user_id: 'pedro', // TODO: Get from user service
      batch_description: `Batch upload ${new Date().toISOString()}`,
      batch_tags: 'bulk-upload,medical-documents'
    };

        try {
      // Call the real API
      this.apiService.uploadDocumentBatch(batchRequest).subscribe({
        next: (response) => {
          console.log('✅ Batch upload completed:', response);
          this.processBatchResponse(response);
        },
        error: (error) => {
          console.error('❌ Batch upload failed:', error);
          this.handleBatchError(error);
        }
      });
    } catch (error) {
      console.error('❌ Batch upload failed:', error);
      this.handleBatchError(error);
    }
  }

    /**
   * Processes the batch upload response and updates file statuses
   *
   * @param response - Batch upload response from the API
   */
  private processBatchResponse(response: BatchUploadResponse): void {
    console.log('📊 Processing batch response:', response);

    // Update batch upload info
    if (this.batchUpload) {
      this.batchUpload.id = response.batch_id;
      this.batchUpload.completed_files = response.processed_count - response.failed_count;
      this.batchUpload.error_files = response.failed_count;
      this.batchUpload.processed_files = response.processed_count;
      this.batchUpload.status = response.processing_status === 'completed' ? 'completed' : 'failed';
    }

        // Update successful documents
    response.successful_documents.forEach(doc => {
      const batchFile = this.batchFiles.find(bf => bf.filename === doc.filename);
      if (batchFile) {
        // Document was processed successfully, even if medical info extraction failed
        batchFile.status = 'completed';
        batchFile.completedTime = new Date(doc.processing_timestamp);

        // Add warning if medical info extraction failed (but document was still processed)
        if (!doc.medical_info_valid && doc.medical_info_error) {
          console.warn(`⚠️ Medical info extraction failed for ${doc.filename}: ${doc.medical_info_error}`);
          batchFile.warning = doc.medical_info_error;
        }
      }
    });

    // Update failed documents
    response.failed_documents.forEach(doc => {
      const batchFile = this.batchFiles.find(bf => bf.filename === doc.filename);
      if (batchFile) {
        batchFile.status = 'error';
        batchFile.error = doc.error;
        batchFile.completedTime = new Date();
      }
    });

    this.isProcessing = false;
    console.log('🎉 Batch processing completed successfully');
    console.log(`📈 Processing summary: ${response.processing_summary.processing_duration_seconds}s total, ${response.processing_summary.average_time_per_document}s per document`);
  }

  /**
   * Handles batch upload errors
   *
   * @param error - Error object from the API call
   */
  private handleBatchError(error: any): void {
    console.error('💥 Batch upload error:', error);

    // Update batch upload status
    if (this.batchUpload) {
      this.batchUpload.status = 'failed';
      this.batchUpload.error_files = this.batchFiles.length;
      this.batchUpload.processed_files = this.batchFiles.length;
    }

    // Set all files to error status
    this.batchFiles.forEach(file => {
      file.status = 'error';
      file.error = error.message || 'Network error during batch upload';
      file.completedTime = new Date();
      file.warning = undefined; // Clear any previous warnings
    });

      this.isProcessing = false;
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

  hasErrorsOrWarnings(): boolean {
    return this.batchFiles.some(file => file.status === 'error' || file.warning);
  }

  /**
   * Formats file size in human readable format
   */
  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

}
