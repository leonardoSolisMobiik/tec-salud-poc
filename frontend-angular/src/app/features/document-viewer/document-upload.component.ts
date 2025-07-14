import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { BambooModule } from '../../shared/bamboo.module';
import { ApiService } from '../../core/services/api.service';
import { MedicalStateService } from '../../core/services/medical-state.service';
import { Patient } from '../../core/models/patient.model';

interface ProcessingOption {
  value: string;
  label: string;
  description: string;
  icon: string;
  benefits: string[];
}

interface DocumentUpload {
  file: File;
  patient_id: string;
  document_type: string;
  processing_type: string;
  title: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  result?: any;
}

@Component({
  selector: 'app-document-upload',
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
            title="Volver">
              <span class="back-icon">←</span>
              <span class="back-text">Volver</span>
          </button>
          </div>

          <div class="header-title-row">
          <div class="title-container">
              <h1 class="main-title">📤 Subir Expedientes Médicos</h1>
              <div class="main-subtitle">
                Procesamiento inteligente de documentos médicos
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Upload Area -->
      <div class="upload-section">
        <div class="upload-row">
          <!-- Premium Drop Zone -->
        <div
            class="premium-drop-zone"
          [class.drag-over]="isDragOver"
          [class.has-files]="selectedFiles.length > 0"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()">

          <div class="drop-zone-content">
              <div class="drop-icon-container">
                <div class="drop-icon">📁</div>
              </div>

              <div class="drop-text-content">
                <h3 class="drop-title">Arrastra archivos aquí</h3>
                <div class="drop-subtitle">
                  <span class="format-badge-premium">PDF</span>
                  <span class="format-badge-premium">DOCX</span>
                  <span class="format-badge-premium">TXT</span>
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
            accept=".pdf,.docx,.doc,.txt"
            (change)="onFileSelected($event)"
              class="file-input-hidden">
          </div>
        </div>
        </div>

        <!-- Configuration Panel -->
        <div class="config-panel" *ngIf="selectedFiles.length > 0">

          <!-- Patient Selection -->
          <div class="config-section">
            <label class="config-label">👤 Paciente por Defecto</label>
            <select
              class="bamboo-select"
              [(ngModel)]="defaultPatientId">
              <option value="">Seleccionar paciente...</option>
              <option
                *ngFor="let patient of recentPatients"
                [value]="patient.id">
                {{ patient.name }} ({{ patient.id }})
              </option>
            </select>
          </div>

          <!-- Document Type -->
          <div class="config-section">
            <label class="config-label">📋 Tipo de Documento</label>
            <select
              class="bamboo-select"
              [(ngModel)]="defaultDocumentType">
              <option value="expediente_medico">📄 Expediente Médico</option>
              <option value="laboratorio">🧪 Laboratorios</option>
              <option value="radiologia">🩻 Radiología</option>
              <option value="consulta">👩‍⚕️ Consulta</option>
              <option value="cirugia">🏥 Cirugía</option>
              <option value="farmacia">💊 Farmacia</option>
              <option value="enfermeria">👩‍⚕️ Enfermería</option>
              <option value="especialidad">🔬 Especialidad</option>
            </select>
          </div>

          <!-- Upload Button -->
          <button
            class="upload-button"
            [disabled]="isUploading || !defaultPatientId"
            (click)="startUpload()">
            <span *ngIf="!isUploading">🚀 Subir {{ selectedFiles.length }} archivo(s)</span>
            <span *ngIf="isUploading">⏳ Subiendo...</span>
          </button>
      </div>

      <!-- File List -->
      <div class="files-section" *ngIf="uploads.length > 0">
        <h3 class="section-title">📋 Archivos Seleccionados</h3>

        <!-- Premium Files List -->
        <div class="files-list">
          <div
            *ngFor="let upload of uploads; trackBy: trackByFile"
            class="file-item"
            [class]="'status-' + upload.status">

            <!-- File Icon & Info -->
            <div class="file-info">
              <div class="file-icon-container">
                <span class="file-icon">📄</span>
              </div>
              <div class="file-content">
                <div class="file-name">{{ upload.file.name }}</div>
                <div class="file-meta">
                  <span class="file-size">{{ getFileSize(upload.file.size) }}</span>
                  <span class="file-type-badge" [class]="'type-' + upload.document_type">
                    {{ upload.document_type }}
                  </span>
                  <span class="file-patient">{{ getPatientName(upload.patient_id) }}</span>
                </div>
              </div>
            </div>

            <!-- File Status & Progress -->
            <div class="file-status">
              <div *ngIf="upload.status === 'pending'" class="status-badge status-pending">
                <span class="status-icon">⏳</span>
                <span class="status-text">Pendiente</span>
              </div>

              <div *ngIf="upload.status === 'uploading'" class="status-uploading">
                <div class="progress-container">
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="upload.progress"></div>
                  </div>
                  <span class="progress-text">{{ upload.progress }}%</span>
                </div>
              </div>

              <div *ngIf="upload.status === 'success'" class="status-badge status-success">
                <span class="status-icon">✅</span>
                <span class="status-text">Completado</span>
              </div>

              <div *ngIf="upload.status === 'error'" class="status-badge status-error">
                <span class="status-icon">❌</span>
                <span class="status-text">Error</span>
              </div>
            </div>

            <!-- File Actions -->
            <div class="file-actions">
              <button
                *ngIf="upload.status === 'pending'"
                class="action-button remove-button"
                (click)="removeFile(upload)"
                title="Eliminar archivo">
                <span class="action-icon">🗑️</span>
                <span class="action-text">Eliminar</span>
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- Results Summary -->
      <div class="results-section" *ngIf="uploadResults.length > 0">
                    <h3 class="results-title">📊 Resultados de Procesamiento</h3>

        <div class="results-summary">
          <div class="summary-stat">
            <span class="stat-number">{{ getSuccessCount() }}</span>
            <span class="stat-label">Exitosos</span>
          </div>
          <div class="summary-stat error">
            <span class="stat-number">{{ getErrorCount() }}</span>
            <span class="stat-label">Errores</span>
          </div>
          <div class="summary-stat">
            <span class="stat-number">{{ getTotalChunks() }}</span>
            <span class="stat-label">Chunks Creados</span>
          </div>
        </div>

        <!-- Test Search Button -->
          <button
            class="test-search-button"
          *ngIf="getSuccessCount() > 0"
            (click)="testSearch()">
            🔍 Probar Búsqueda Inteligente
          </button>
      </div>

    </div>
  `,
  styles: [`
    .upload-section {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto var(--bmb-spacing-xl) auto;

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

    .config-panel {
      background: var(--general_contrasts-15);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-m);
      width: 100%;
      max-width: 500px;
      margin: 0 auto var(--bmb-spacing-l) auto;
      display: flex;
      flex-direction: column;
      align-items: center;

      .config-section {
        margin-bottom: var(--bmb-spacing-s);
        width: 100%;
        max-width: 400px;
        display: flex;
        flex-direction: column;
        align-items: center;

        &:last-child {
          margin-bottom: 0;
        }

        .config-label {
          display: block;
          font-weight: 600;
          color: var(--general_contrasts-100);
          margin-bottom: var(--bmb-spacing-xs);
          font-size: 0.9rem;
          text-align: center;
        }

        .bamboo-select {
          width: 100%;
          max-width: 350px;
          padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
          border: 1px solid var(--general_contrasts-container-outline);
          border-radius: var(--bmb-radius-s);
          background: var(--general_contrasts-input-background);
          color: var(--general_contrasts-100);
          font-size: 0.9rem;

          &:focus {
            outline: none;
            border-color: rgb(var(--color-blue-tec));
            box-shadow: 0 0 0 2px rgba(var(--color-blue-tec), 0.2);
          }
        }
      }
    }

    .upload-button {
      width: 100%;
      max-width: 350px;
      background: linear-gradient(135deg,
        var(--buttons-primary-normal) 0%,
        var(--buttons-primary-hover) 100%
      );
      color: white;
      border: none;
      border-radius: var(--bmb-radius-s);
      padding: var(--bmb-spacing-s) var(--bmb-spacing-l);
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(var(--color-blue-tec), 0.3);
      margin-top: var(--bmb-spacing-s);

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(var(--color-blue-tec), 0.4);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
        transform: none;
      }
    }

    .files-section {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto var(--bmb-spacing-xl) auto;

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

      &.status-success {
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

      &.status-uploading {
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

    .results-section {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;

      .results-title {
        color: var(--general_contrasts-100);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--bmb-spacing-l);
      }

      .results-summary {
      display: flex;
      justify-content: center;
      gap: var(--bmb-spacing-xl);
        margin-bottom: var(--bmb-spacing-l);

        .summary-stat {
          text-align: center;

          .stat-number {
            display: block;
            font-size: 2rem;
            font-weight: 700;
          color: var(--semantic-success);
            margin-bottom: var(--bmb-spacing-xs);
          }

          .stat-label {
          font-size: 0.875rem;
            color: var(--general_contrasts-75);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        &.error .stat-number {
          color: var(--semantic-error);
          }
        }
      }
    }

    .test-search-button {
      background: linear-gradient(135deg,
        var(--semantic-success) 0%,
        #45a049 100%
      );
          color: white;
          border: none;
          border-radius: var(--bmb-radius-s);
      padding: var(--bmb-spacing-m) var(--bmb-spacing-xl);
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(76, 175, 80, 0.4);
      }
    }

    /* 📱 RESPONSIVE DESIGN */
    @media (max-width: 950px) {
      .upload-section {
        margin: 0 auto !important;
        margin-bottom: var(--bmb-spacing-l) !important;
        padding: 0 !important;

        .upload-row {
          flex-direction: column !important;
          gap: var(--bmb-spacing-m) !important;
          align-items: center !important;
        }

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

          .drop-action-indicator {
            display: none !important;
          }
        }
      }

      .config-panel {
        display: flex !important;
        flex-direction: column !important;
        gap: var(--bmb-spacing-s) !important;
        padding: var(--bmb-spacing-s) !important;
        background: var(--general_contrasts-15) !important;
        border-radius: var(--bmb-radius-m) !important;
        margin: 0 auto var(--bmb-spacing-m) auto !important;
        max-width: 100% !important;
        width: 100% !important;
        align-items: stretch !important;

        .config-section {
          width: 100% !important;
          max-width: none !important;
          margin-bottom: var(--bmb-spacing-xs) !important;
          align-items: stretch !important;

          &:last-child {
            margin-bottom: 0 !important;
          }

          .config-label {
            font-size: 0.85rem !important;
            margin-bottom: var(--bmb-spacing-xs) !important;
            text-align: left !important;
          }

            .bamboo-select {
            width: 100% !important;
            max-width: none !important;
            padding: var(--bmb-spacing-xs) var(--bmb-spacing-s) !important;
            font-size: 0.85rem !important;
          }
        }

        .upload-button {
          width: 100% !important;
          max-width: none !important;
          padding: var(--bmb-spacing-s) !important;
          font-size: 0.9rem !important;
          margin-top: var(--bmb-spacing-xs) !important;
          order: 3 !important;
        }
      }

      .files-section {
        margin: 0 auto !important;
        margin-bottom: var(--bmb-spacing-l) !important;
        padding: 0 !important;
        max-width: 100% !important;
        width: 100% !important;

        .section-title {
          font-size: 1.2rem !important;
          margin-bottom: var(--bmb-spacing-m) !important;
      }

        .files-count {
          flex-direction: column !important;
          align-items: center !important;
          gap: var(--bmb-spacing-xs) !important;
          margin-bottom: var(--bmb-spacing-m) !important;

          .count-number {
            font-size: 2rem !important;
          }

          .count-label {
            font-size: 0.8rem !important;
          }
        }

        .files-list {
          gap: var(--bmb-spacing-s) !important;

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
                flex-direction: row !important;
                justify-content: space-between !important;
                align-items: center !important;

                .file-name {
                  font-size: 0.9rem !important;
                  margin-bottom: 0 !important;
                  word-break: break-word !important;
                }

                .file-meta {
                  order: 3 !important;
                  width: auto !important;
                  flex-direction: row !important;
                  gap: var(--bmb-spacing-xs) !important;
                  align-items: center !important;
                  flex-wrap: wrap !important;

                  .file-size {
                    font-size: 0.8rem !important;
                  }

                  .file-type-badge {
                    font-size: 0.8rem !important;
                    padding: var(--bmb-spacing-xs) !important;
                  }

                  .file-patient {
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
              justify-content: space-between !important;
              align-items: center !important;
              padding: var(--bmb-spacing-xs) !important;
              background: var(--general_contrasts-25) !important;
              border-radius: var(--bmb-radius-s) !important;

              .status-uploading {
                display: flex !important;
                align-items: center !important;
                gap: var(--bmb-spacing-s) !important;

                .progress-container {
                  width: 60px !important;
                  .progress-bar {
                    width: 60px !important;
                    height: 4px !important;
                  }

                  .progress-text {
                    font-size: 0.75rem !important;
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
        }
      }

      .results-section {
        margin: 0 auto !important;
        padding: var(--bmb-spacing-m) !important;
        background: var(--general_contrasts-15) !important;
        border-radius: var(--bmb-radius-m) !important;
        max-width: 100% !important;
        width: 100% !important;

        .results-title {
          font-size: 1.2rem !important;
          margin-bottom: var(--bmb-spacing-m) !important;
        }

        .results-summary {
          display: flex !important;
          flex-direction: column !important;
          gap: var(--bmb-spacing-m) !important;
          margin-bottom: var(--bmb-spacing-l) !important;

          .summary-stat {
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            padding: var(--bmb-spacing-s) !important;
            background: var(--general_contrasts-25) !important;
            border-radius: var(--bmb-radius-s) !important;

            .stat-number {
              font-size: 1.3rem !important;
              margin-bottom: 0 !important;
            }

            .stat-label {
              font-size: 0.8rem !important;
            }
          }
      }

      .test-search-button {
          width: 100% !important;
          padding: var(--bmb-spacing-m) !important;
          font-size: 1rem !important;
        }
      }
    }

    @media (max-width: 1200px) and (min-width: 951px) {
      .upload-section {
        max-width: 1000px !important;
      }

      .config-panel {
        max-width: 450px !important;
        padding: var(--bmb-spacing-s) var(--bmb-spacing-m) !important;

        .config-section {
          .config-label {
            font-size: 0.85rem !important;
          }

          .bamboo-select {
            font-size: 0.85rem !important;
            padding: var(--bmb-spacing-xs) var(--bmb-spacing-s) !important;
          }
        }

        .upload-button {
          font-size: 0.9rem !important;
          padding: var(--bmb-spacing-xs) var(--bmb-spacing-m) !important;
        }
      }

      .files-section {
        max-width: 1000px !important;
      }

      .results-section {
        max-width: 1000px !important;
      }
    }
  `]
})
export class DocumentUploadComponent implements OnInit {
  private apiService = inject(ApiService);
  private medicalStateService = inject(MedicalStateService);
  private router = inject(Router);
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);

  selectedFiles: File[] = [];
  uploads: DocumentUpload[] = [];
  uploadResults: any[] = [];

  defaultPatientId: string = '';
  defaultDocumentType: string = 'expediente_medico';

  isDragOver = false;
  isUploading = false;

  recentPatients: Patient[] = [];

  ngOnInit(): void {
    // Load recent patients
    this.medicalStateService.recentPatients$.subscribe(patients => {
      this.recentPatients = patients;
      console.log('📋 Loaded patients for upload:', patients.length);
    });
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver = false;

    const files = Array.from(event.dataTransfer?.files || []) as File[];
    this.processFiles(files);
  }

  onFileSelected(event: any): void {
    const files = Array.from(event.target.files || []) as File[];
    this.processFiles(files);
  }

  private processFiles(files: File[]): void {
    const validFiles = files.filter(file => this.isValidFile(file));

    validFiles.forEach(file => {
      if (!this.selectedFiles.find(f => f.name === file.name && f.size === file.size)) {
        this.selectedFiles.push(file);

        const upload: DocumentUpload = {
          file,
          patient_id: this.defaultPatientId,
          document_type: this.defaultDocumentType,
          processing_type: 'complete', // Default processing type for document upload
          title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
          status: 'pending',
          progress: 0
        };

        this.uploads.push(upload);
      }
    });

    console.log(`📁 Added ${validFiles.length} files, total: ${this.selectedFiles.length}`);
  }

  private isValidFile(file: File): boolean {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'text/plain'
    ];

    const validExtensions = ['.pdf', '.docx', '.doc', '.txt'];
    const hasValidExtension = validExtensions.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension || file.size > 10 * 1024 * 1024) { // 10MB limit
      console.warn(`⚠️ Invalid file: ${file.name}`);
      return false;
    }

    return true;
  }

  async startUpload(): Promise<void> {
    if (!this.defaultPatientId || this.isUploading) return;

    this.isUploading = true;
    console.log(`🚀 Starting upload of ${this.uploads.length} files`);

    for (let upload of this.uploads) {
      if (upload.status === 'pending') {
        await this.uploadSingleFile(upload);
      }
    }

    this.isUploading = false;
    console.log('✅ Upload batch completed');
  }

  private async uploadSingleFile(upload: DocumentUpload): Promise<void> {
    upload.status = 'uploading';
    upload.progress = 0;

    try {
      console.log(`📤 Uploading: ${upload.file.name}`);

      const formData = new FormData();
      formData.append('file', upload.file);
      formData.append('patient_id', upload.patient_id);
      formData.append('document_type', upload.document_type);
      formData.append('title', upload.title);

      // Simulate progress for user feedback
      const progressInterval = setInterval(() => {
        if (upload.progress < 90) {
          upload.progress += Math.random() * 20;
          this.cdr.detectChanges();
        }
      }, 200);

      const result = await this.apiService.uploadDocument(formData).toPromise();

      clearInterval(progressInterval);
      upload.progress = 100;
      upload.status = 'success';
      upload.result = result;

      this.uploadResults.push({
        filename: upload.file.name,
        status: 'success',
        result: result
      });

      console.log(`✅ Upload successful: ${upload.file.name}`);

    } catch (error: any) {
      upload.status = 'error';
      upload.error = error.message || 'Error desconocido';

      this.uploadResults.push({
        filename: upload.file.name,
        status: 'error',
        error: error.message
      });

      console.error(`❌ Upload failed: ${upload.file.name}`, error);
    }

    this.cdr.detectChanges();
  }

  removeFile(upload: DocumentUpload): void {
    const fileIndex = this.selectedFiles.findIndex(f => f === upload.file);
    const uploadIndex = this.uploads.findIndex(u => u === upload);

    if (fileIndex > -1) this.selectedFiles.splice(fileIndex, 1);
    if (uploadIndex > -1) this.uploads.splice(uploadIndex, 1);

    console.log(`🗑️ Removed file: ${upload.file.name}`);
  }

  getFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getPatientName(patientId: string): string {
    const patient = this.recentPatients.find(p => p.id === patientId);
    return patient ? patient.name : patientId;
  }

  getSuccessCount(): number {
    return this.uploadResults.filter(r => r.status === 'success').length;
  }

  getErrorCount(): number {
    return this.uploadResults.filter(r => r.status === 'error').length;
  }

  getTotalChunks(): number {
    return this.uploadResults
      .filter(r => r.status === 'success')
      .reduce((total, r) => total + (r.result?.chunks_created || 1), 0);
  }

  testSearch(): void {
    console.log('🔍 Redirecting to chat for search test');
    this.router.navigate(['/chat']);
  }

  goBack(): void {
    this.location.back();
  }

  trackByFile(index: number, upload: DocumentUpload): string {
    return upload.file.name + upload.file.size;
  }
}
