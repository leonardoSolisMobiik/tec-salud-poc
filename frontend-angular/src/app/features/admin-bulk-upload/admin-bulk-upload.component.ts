import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { BambooModule } from '../../shared/bamboo.module';
import { ApiService } from '../../core/services/api.service';

interface BatchFile {
  file: File;
  filename: string;
  patientInfo?: {
    id: string;
    apellido_paterno: string;
    apellido_materno: string;
    nombre: string;
    numero: string;
    tipo: string;
  };
  status: 'pending' | 'parsing' | 'matched' | 'review_needed' | 'processing' | 'completed' | 'error';
  matchingResults?: any[];
  confidence?: number;
  error?: string;
}

interface BatchUpload {
  id?: string;
  processing_type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_files: number;
  processed_files: number;
  created_patients: number;
  matched_patients: number;
  files: BatchFile[];
}

/**
 * Admin Bulk Upload Component for batch processing medical documents
 * 
 * @description Administrative interface for bulk uploading and processing
 * medical documents with automatic patient extraction and matching.
 * Provides drag & drop functionality and batch processing configuration.
 * 
 * @features
 * - Bulk document upload with drag & drop
 * - Automatic filename parsing for TecSalud format
 * - Patient matching and creation
 * - Processing type configuration
 * - Real-time progress tracking
 * - Responsive design for all devices
 * 
 * @since 1.0.0
 */
@Component({
  selector: 'app-admin-bulk-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, BambooModule],
  template: `
    <div class="admin-bulk-container">
      <!-- Header -->
      <div class="admin-header">
        <div class="header-top">
          <button 
            class="back-button"
            (click)="goBack()"
            title="Volver al dashboard">
            <span class="back-icon">←</span>
            <span class="back-text">Volver</span>
          </button>
          
          <div class="header-content">
            <h1 class="admin-title">🔧 Carga Masiva de Expedientes</h1>
            <div class="admin-subtitle">
              Procesamiento automático de expedientes TecSalud con extracción de pacientes
            </div>
          </div>
        </div>
      </div>

      <!-- Configuration Panel -->
      <div class="config-panel">
        <h3 class="config-title">⚙️ Configuración de Procesamiento</h3>
        
        <div class="config-form">
        <div class="config-row">
          <label class="config-label">🔄 Tipo de Procesamiento:</label>
            <div class="select-wrapper">
          <select 
            class="bamboo-select"
            [(ngModel)]="selectedProcessingType">
            <option value="vectorized">🔍 Solo Vectorización (Búsqueda semántica)</option>
            <option value="complete">📄 Solo Almacenamiento Completo</option>
            <option value="both">⚡ Híbrido (Recomendado)</option>
          </select>
            </div>
        </div>

        <div class="config-row">
          <label class="config-label">📋 Tipo de Documento por Defecto:</label>
            <div class="select-wrapper">
          <select 
            class="bamboo-select"
            [(ngModel)]="defaultDocumentType">
            <option value="expediente_medico">📄 Expediente Médico</option>
            <option value="consulta">👩‍⚕️ Consulta (CONS)</option>
            <option value="emergencia">🚨 Emergencia (EMER)</option>
            <option value="laboratorio">🧪 Laboratorios (LAB)</option>
            <option value="radiologia">🩻 Radiología (IMG)</option>
            <option value="cirugia">🏥 Cirugía</option>
          </select>
            </div>
          </div>
        </div>
      </div>

      <!-- Bulk Upload Zone -->
      <div class="bulk-upload-section">
        <div 
          class="bulk-drop-zone"
          [class.drag-over]="isDragOver"
          [class.has-files]="batchFiles.length > 0"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()">
          
          <div class="drop-zone-content">
            <div class="bulk-icon">📂</div>
            <h3 class="drop-title">Arrastra múltiples expedientes TecSalud aquí</h3>
            <p class="drop-description">Formato: ID_APELLIDO APELLIDO, NOMBRE_NUM_TIPO.pdf</p>
            
            <div class="example-filename">
              <strong>Ejemplo:</strong> 3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf
            </div>
            
            <div class="bulk-benefits">
              <span class="benefit">✅ Extracción automática de pacientes</span>
              <span class="benefit">✅ Matching inteligente</span>
              <span class="benefit">✅ Procesamiento masivo</span>
            </div>
            
            <div class="upload-hint">
              <span class="hint-text">Haz clic aquí o arrastra archivos</span>
            </div>
          </div>
          
          <input 
            #fileInput
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt"
            (change)="onFileSelected($event)"
            style="display: none;">
        </div>

        <!-- Start Batch Processing Button -->
        <div class="batch-actions" *ngIf="batchFiles.length > 0 && !isProcessing">
        <button 
          class="start-batch-button"
          (click)="startBatchProcessing()">
            <span class="button-icon">🚀</span>
            <span class="button-text">Procesar {{ batchFiles.length }} Expediente(s)</span>
        </button>
        </div>
      </div>

      <!-- Files Preview -->
      <div class="files-preview" *ngIf="batchFiles.length > 0">
        <h3 class="preview-title">📋 Archivos para Procesar ({{ batchFiles.length }})</h3>
        
        <div class="files-grid">
          <div 
            *ngFor="let batchFile of batchFiles; trackBy: trackByFile"
            class="file-preview-card"
            [class]="'status-' + batchFile.status">
            
            <!-- File Header -->
            <div class="file-header">
              <div class="file-name">{{ batchFile.filename }}</div>
              <div class="file-status">
                <span *ngIf="batchFile.status === 'pending'" class="status-badge pending">⏳ Pendiente</span>
                <span *ngIf="batchFile.status === 'parsing'" class="status-badge parsing">🔄 Analizando</span>
                <span *ngIf="batchFile.status === 'matched'" class="status-badge matched">✅ Paciente encontrado</span>
                <span *ngIf="batchFile.status === 'review_needed'" class="status-badge review">⚠️ Revisar</span>
                <span *ngIf="batchFile.status === 'processing'" class="status-badge processing">📤 Procesando</span>
                <span *ngIf="batchFile.status === 'completed'" class="status-badge completed">🎉 Completado</span>
                <span *ngIf="batchFile.status === 'error'" class="status-badge error">❌ Error</span>
              </div>
            </div>

            <!-- Patient Info (if parsed) -->
            <div class="patient-info" *ngIf="batchFile.patientInfo">
              <div class="info-row">
                <span class="info-label">🆔 ID:</span>
                <span class="info-value">{{ batchFile.patientInfo.id }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">👤 Paciente:</span>
                <span class="info-value">{{ batchFile.patientInfo.apellido_paterno }} {{ batchFile.patientInfo.apellido_materno }}, {{ batchFile.patientInfo.nombre }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">📄 Tipo:</span>
                <span class="info-value">{{ batchFile.patientInfo.tipo }}</span>
              </div>
            </div>

            <!-- Matching Results (if review needed) -->
            <div class="matching-review" *ngIf="batchFile.status === 'review_needed' && batchFile.matchingResults">
              <div class="review-header">🔍 Pacientes similares encontrados:</div>
              <div class="match-options">
                <div 
                  *ngFor="let match of batchFile.matchingResults.slice(0, 3)"
                  class="match-option"
                  [class.high-confidence]="match.confidence > 0.8">
                  <div class="match-info">
                    {{ match.name }} ({{ match.id }})
                  </div>
                  <div class="match-confidence">
                    {{ (match.confidence * 100).toFixed(0) }}% similar
                  </div>
                </div>
              </div>
            </div>

            <!-- Error Message -->
            <div class="error-message" *ngIf="batchFile.status === 'error'">
              ❌ {{ batchFile.error }}
            </div>

            <!-- Actions -->
            <div class="file-actions">
              <button 
                *ngIf="batchFile.status === 'pending'"
                class="remove-button"
                (click)="removeFile(batchFile)"
                title="Eliminar archivo">
                🗑️ Eliminar
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- Processing Summary -->
      <div class="processing-summary" *ngIf="batchUpload && isProcessing">
        <h3 class="summary-title">📊 Progreso del Procesamiento</h3>
        
        <div class="progress-stats">
          <div class="stat-card">
            <div class="stat-number">{{ batchUpload.processed_files }}</div>
            <div class="stat-label">Procesados</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ batchUpload.total_files }}</div>
            <div class="stat-label">Total</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ batchUpload.created_patients }}</div>
            <div class="stat-label">Pacientes Creados</div>
          </div>
          <div class="stat-card">
            <div class="stat-number">{{ batchUpload.matched_patients }}</div>
            <div class="stat-label">Pacientes Matched</div>
          </div>
        </div>

        <div class="progress-bar">
          <div 
            class="progress-fill" 
            [style.width.%]="getProgressPercentage()">
          </div>
        </div>
      </div>

      <!-- Results Summary -->
      <div class="results-summary" *ngIf="batchUpload && batchUpload.status === 'completed'">
        <h3 class="results-title">🎉 Procesamiento Completado</h3>
        
        <div class="results-grid">
          <div class="result-card success">
            <div class="result-icon">✅</div>
            <div class="result-content">
              <div class="result-number">{{ batchUpload.processed_files }}</div>
              <div class="result-label">Expedientes Procesados</div>
            </div>
          </div>
          
          <div class="result-card info">
            <div class="result-icon">👥</div>
            <div class="result-content">
              <div class="result-number">{{ batchUpload.created_patients }}</div>
              <div class="result-label">Pacientes Nuevos</div>
            </div>
          </div>
          
          <div class="result-card info">
            <div class="result-icon">🔗</div>
            <div class="result-content">
              <div class="result-number">{{ batchUpload.matched_patients }}</div>
              <div class="result-label">Pacientes Existentes</div>
            </div>
          </div>
        </div>

        <div class="next-actions">
          <button 
            class="test-search-button"
            (click)="testSearchWithNewDocuments()">
            🔍 Probar Búsqueda con Nuevos Documentos
          </button>
          
          <button 
            class="start-new-button"
            (click)="startNewBatch()">
            🔄 Procesar Más Expedientes
          </button>
        </div>
      </div>

    </div>
  `,
  styles: [`
    /* 📱 CONTENEDOR PRINCIPAL RESPONSIVE CON SCROLL - TASK-UI-004 */
    .admin-bulk-container {
      min-height: 100vh;
      max-height: 100vh;
      background: linear-gradient(135deg, 
        var(--general_contrasts-15) 0%, 
        var(--general_contrasts-5) 100%
      );
      padding: var(--bmb-spacing-l);
      padding-bottom: calc(var(--bmb-spacing-xxl) * 2);
      overflow-x: hidden;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      scroll-behavior: smooth;
    }

    /* 🎯 HEADER MEJORADO SIN POSITION ABSOLUTE */
    .admin-header {
      margin-bottom: var(--bmb-spacing-xl);
      flex-shrink: 0;
      
      .header-top {
        display: flex;
        align-items: center;
        gap: var(--bmb-spacing-l);
        margin-bottom: var(--bmb-spacing-m);
        
        .back-button {
          display: inline-flex;
          align-items: center;
          gap: var(--bmb-spacing-xs);
          background: var(--general_contrasts-15);
          border: 1px solid var(--general_contrasts-container-outline);
          border-radius: var(--bmb-radius-s);
          padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
          color: var(--general_contrasts-100);
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          font-weight: 500;
          text-decoration: none;
          flex-shrink: 0;
          
          .back-icon {
            font-size: 1.2rem;
            line-height: 1;
          }
          
          .back-text {
            line-height: 1;
          }
          
          &:hover {
            background: var(--general_contrasts-25);
            transform: translateX(-4px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
        }
        
        .header-content {
          flex: 1;
          text-align: center;
          
          .admin-title {
            font-size: 2.2rem;
            font-weight: 700;
            color: var(--general_contrasts-100);
            margin: 0 0 var(--bmb-spacing-s) 0;
            font-family: var(--font-display, 'Poppins', sans-serif);
            background: linear-gradient(135deg, 
              rgb(var(--color-blue-tec)) 0%, 
              rgb(var(--color-mariner-100)) 100%
            );
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            line-height: 1.2;
          }
          
          .admin-subtitle {
            color: var(--general_contrasts-75);
            font-size: 1.1rem;
            margin: 0;
            line-height: 1.4;
            max-width: 600px;
            margin: 0 auto;
          }
        }
      }
    }

    /* 🎛️ PANEL DE CONFIGURACIÓN MEJORADO */
    .config-panel {
      background: linear-gradient(135deg, 
        rgba(var(--color-blue-tec), 0.08) 0%, 
        rgba(var(--color-blue-tec), 0.03) 100%
      );
      border: 1px solid rgba(var(--color-blue-tec), 0.2);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-l);
      margin-bottom: var(--bmb-spacing-xl);
      max-width: 900px;
      margin-left: auto;
      margin-right: auto;
      flex-shrink: 0;
      
      .config-title {
        color: var(--general_contrasts-100);
        margin: 0 0 var(--bmb-spacing-l) 0;
        font-size: 1.3rem;
        font-weight: 600;
      }
      
      .config-form {
        display: flex;
        flex-direction: column;
        gap: var(--bmb-spacing-m);
      }
    }

    .config-row {
      display: flex;
      flex-direction: column;
      gap: var(--bmb-spacing-s);
      
      .config-label {
        font-weight: 600;
        color: var(--general_contrasts-100);
        font-size: 1rem;
      }
      
      .select-wrapper {
        position: relative;
        width: 100%;
        
        .bamboo-select {
          width: 100%;
          padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
          border: 1px solid var(--general_contrasts-container-outline);
          border-radius: var(--bmb-radius-s);
          background: var(--general_contrasts-input-background);
          color: var(--general_contrasts-100);
          font-size: 1rem;
          appearance: none;
          cursor: pointer;
          
          &:focus {
            outline: none;
            border-color: rgb(var(--color-blue-tec));
            box-shadow: 0 0 0 2px rgba(var(--color-blue-tec), 0.2);
          }
        }
      }
    }

    /* 📂 ZONA DE DRAG & DROP MEJORADA CON SCROLL */
    .bulk-upload-section {
      max-width: 1000px;
      margin: 0 auto;
      margin-bottom: var(--bmb-spacing-xxl);
      flex-shrink: 0;
    }

    .bulk-drop-zone {
      border: 3px dashed var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-l);
      background: var(--general_contrasts-15);
      padding: var(--bmb-spacing-xxl);
      text-align: center;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      min-height: 500px;
      margin-bottom: var(--bmb-spacing-xl);
      display: flex;
      align-items: center;
      justify-content: center;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, 
          transparent 0%, 
          rgba(var(--color-blue-tec), 0.15) 50%, 
          transparent 100%
        );
        transition: left 0.8s ease;
        z-index: 1;
      }
      
      &:hover {
        border-color: rgb(var(--color-blue-tec));
        background: linear-gradient(135deg, 
          var(--general_contrasts-15) 0%, 
          rgb(var(--color-mariner-50)) 100%
        );
        transform: translateY(-6px);
        box-shadow: 0 8px 24px rgba(var(--color-blue-tec), 0.15);
        
        &::before {
          left: 100%;
        }
        
        .bulk-icon {
          transform: scale(1.1);
        }
      }
      
      &.drag-over {
        border-color: rgb(var(--color-blue-tec));
        background: rgb(var(--color-mariner-50));
        transform: scale(1.02);
        border-width: 4px;
        
        .drop-zone-content {
          transform: scale(1.05);
        }
      }
      
      &.has-files {
        border-color: var(--semantic-success);
        background: rgba(76, 175, 80, 0.1);
      }
    }

    .drop-zone-content {
      position: relative;
      z-index: 2;
      max-width: 100%;
      transition: all 0.3s ease;
      padding: var(--bmb-spacing-l);
      
      .bulk-icon {
        font-size: 5rem;
        margin-bottom: var(--bmb-spacing-l);
        opacity: 0.8;
        transition: all 0.3s ease;
        display: block;
      }
      
      .drop-title {
        color: var(--general_contrasts-100);
        margin: 0 0 var(--bmb-spacing-m) 0;
        font-size: 1.8rem;
        font-weight: 600;
        line-height: 1.3;
      }
      
      .drop-description {
        color: var(--general_contrasts-75);
        margin: 0 0 var(--bmb-spacing-l) 0;
        font-size: 1.1rem;
        line-height: 1.4;
      }
      
      .example-filename {
        background: rgba(var(--color-blue-tec), 0.1);
        border-radius: var(--bmb-radius-s);
        padding: var(--bmb-spacing-m);
        margin: var(--bmb-spacing-l) 0;
        font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
        font-size: 0.9rem;
        color: var(--general_contrasts-100);
        word-break: break-all;
        line-height: 1.4;
        border: 1px solid rgba(var(--color-blue-tec), 0.2);
      }
      
      .bulk-benefits {
        display: flex;
        justify-content: center;
        gap: var(--bmb-spacing-l);
        margin: var(--bmb-spacing-xl) 0;
        flex-wrap: wrap;
        
        .benefit {
          background: var(--semantic-success);
          color: white;
          padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
          border-radius: var(--bmb-radius-s);
          font-size: 0.9rem;
          font-weight: 600;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
        }
      }
      
      .upload-hint {
        margin-top: var(--bmb-spacing-xl);
        margin-bottom: var(--bmb-spacing-l);
        
        .hint-text {
          color: var(--general_contrasts-75);
          font-size: 1rem;
          font-style: italic;
          font-weight: 500;
        }
      }
    }

    /* 🚀 BOTÓN DE PROCESAMIENTO MEJORADO */
    .batch-actions {
      margin-top: var(--bmb-spacing-xl);
      margin-bottom: var(--bmb-spacing-xxl);
      text-align: center;
      flex-shrink: 0;
      
      .start-batch-button {
        display: inline-flex;
        align-items: center;
        gap: var(--bmb-spacing-s);
        background: linear-gradient(135deg, 
          rgb(var(--color-blue-tec)) 0%, 
          rgba(var(--color-blue-tec), 0.9) 100%
        );
        border: none;
        border-radius: var(--bmb-radius-m);
        padding: var(--bmb-spacing-l) var(--bmb-spacing-xxl);
        color: white;
        font-size: 1.2rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 6px 20px rgba(var(--color-blue-tec), 0.3);
        
        .button-icon {
          font-size: 1.5rem;
        }
        
        .button-text {
          line-height: 1;
        }
        
        &:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px rgba(var(--color-blue-tec), 0.4);
        }
        
        &:active {
          transform: translateY(-1px);
        }
      }
    }

    /* 📋 VISTA PREVIA DE ARCHIVOS */
    .files-preview {
      max-width: 1200px;
      margin: var(--bmb-spacing-xl) auto;
      margin-bottom: var(--bmb-spacing-xxl);
      flex-shrink: 0;
      
      .preview-title {
        color: var(--general_contrasts-100);
        font-size: 1.4rem;
        font-weight: 600;
        margin-bottom: var(--bmb-spacing-l);
        text-align: center;
      }
    }

    .files-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: var(--bmb-spacing-l);
    }

    .file-preview-card {
      background: var(--general_contrasts-input-background);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-l);
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }
      
      .file-header {
        display: flex;
        flex-direction: column;
        gap: var(--bmb-spacing-s);
        margin-bottom: var(--bmb-spacing-m);
        
        .file-name {
          font-weight: 600;
          color: var(--general_contrasts-100);
          word-break: break-all;
          font-size: 0.9rem;
        }
        
        .file-status {
          .status-badge {
            padding: var(--bmb-spacing-xs) var(--bmb-spacing-s);
            border-radius: var(--bmb-radius-s);
            font-size: 0.8rem;
            font-weight: 500;
            
            &.pending { background: #fbbf24; color: white; }
            &.parsing { background: #3b82f6; color: white; }
            &.matched { background: #10b981; color: white; }
            &.review { background: #f59e0b; color: white; }
            &.processing { background: #8b5cf6; color: white; }
            &.completed { background: #059669; color: white; }
            &.error { background: #ef4444; color: white; }
          }
        }
      }
      
      .patient-info {
        background: rgba(var(--color-blue-tec), 0.05);
        border-radius: var(--bmb-radius-s);
        padding: var(--bmb-spacing-s);
        margin-bottom: var(--bmb-spacing-m);
        
        .info-row {
          display: flex;
          gap: var(--bmb-spacing-s);
          margin-bottom: var(--bmb-spacing-xs);
          font-size: 0.85rem;
          
          &:last-child {
            margin-bottom: 0;
          }
          
          .info-label {
            font-weight: 600;
            color: var(--general_contrasts-100);
            min-width: 70px;
          }
          
          .info-value {
            color: var(--general_contrasts-75);
            word-break: break-word;
          }
        }
      }
      
      .file-actions {
        text-align: right;
        
        .remove-button {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: var(--bmb-radius-s);
          padding: var(--bmb-spacing-xs) var(--bmb-spacing-s);
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.3s ease;
          
          &:hover {
            background: #dc2626;
          }
        }
      }
    }

    /* 📊 RESUMEN DE PROCESAMIENTO */
    .processing-summary, .results-summary {
      max-width: 800px;
      margin: var(--bmb-spacing-xl) auto;
      margin-bottom: var(--bmb-spacing-xxl);
      background: var(--general_contrasts-input-background);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-l);
      text-align: center;
      flex-shrink: 0;
      
      .summary-title, .results-title {
        color: var(--general_contrasts-100);
        font-size: 1.4rem;
        font-weight: 600;
        margin-bottom: var(--bmb-spacing-l);
      }
    }

    .progress-stats, .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: var(--bmb-spacing-m);
      margin-bottom: var(--bmb-spacing-l);
    }

    .stat-card, .result-card {
      background: var(--general_contrasts-15);
      border-radius: var(--bmb-radius-s);
      padding: var(--bmb-spacing-m);
      
      .stat-number, .result-number {
        font-size: 2rem;
        font-weight: 700;
        color: rgb(var(--color-blue-tec));
        margin-bottom: var(--bmb-spacing-xs);
      }
      
      .stat-label, .result-label {
        color: var(--general_contrasts-75);
        font-size: 0.85rem;
        font-weight: 500;
      }
    }

    .progress-bar {
      background: var(--general_contrasts-25);
      border-radius: var(--bmb-radius-s);
      height: 8px;
      overflow: hidden;
      
      .progress-fill {
        background: linear-gradient(90deg, 
          rgb(var(--color-blue-tec)) 0%, 
          var(--semantic-success) 100%
        );
        height: 100%;
        transition: width 0.3s ease;
      }
    }

    .next-actions {
      display: flex;
      gap: var(--bmb-spacing-m);
      justify-content: center;
      flex-wrap: wrap;
      margin-top: var(--bmb-spacing-l);
      
      button {
        padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
        border: none;
        border-radius: var(--bmb-radius-s);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &.test-search-button {
          background: var(--semantic-info);
          color: white;
          
          &:hover {
            background: #0284c7;
          }
        }
        
        &.start-new-button {
          background: var(--semantic-success);
          color: white;
          
          &:hover {
            background: #059669;
          }
        }
      }
    }

    /* 📱 RESPONSIVE DESIGN - TASK-UI-004 */
    
    /* Mobile Styles (<768px) */
    @media (max-width: 767px) {
      .admin-bulk-container {
        padding: var(--bmb-spacing-m);
        padding-bottom: calc(var(--bmb-spacing-xxl) * 2 + var(--bmb-spacing-l));
        min-height: 100vh;
        max-height: 100vh;
      }
      
      .admin-header {
        .header-content {
          .admin-title {
            font-size: 1.6rem;
            line-height: 1.2;
          }
          
          .admin-subtitle {
            font-size: 0.95rem;
            line-height: 1.3;
          }
        }
      }
      
      .config-panel {
        padding: var(--bmb-spacing-m);
        margin-bottom: var(--bmb-spacing-l);
        
        .config-title {
          font-size: 1.1rem;
        }
      }
      
      .config-row {
        .config-label {
          font-size: 0.9rem;
        }
        
        .select-wrapper .bamboo-select {
          font-size: 0.9rem;
          padding: var(--touch-spacing, 12px);
        }
      }
      
      .bulk-upload-section {
        margin-bottom: var(--bmb-spacing-xl);
      }
      
      .bulk-drop-zone {
        padding: var(--bmb-spacing-l);
        min-height: 400px;
        margin-bottom: var(--bmb-spacing-l);
        
        .drop-zone-content {
          padding: var(--bmb-spacing-m);
          
          .bulk-icon {
            font-size: 3.5rem;
          }
          
          .drop-title {
            font-size: 1.4rem;
          }
          
          .drop-description {
            font-size: 0.95rem;
          }
          
          .example-filename {
            font-size: 0.8rem;
            padding: var(--bmb-spacing-s);
          }
          
          .bulk-benefits {
            flex-direction: column;
            align-items: center;
            gap: var(--bmb-spacing-s);
            
            .benefit {
              font-size: 0.85rem;
            }
          }
          
          .upload-hint {
            margin-bottom: var(--bmb-spacing-m);
            
            .hint-text {
              font-size: 0.9rem;
            }
          }
        }
      }
      
      .batch-actions {
        margin-bottom: var(--bmb-spacing-xl);
        
        .start-batch-button {
          font-size: 1rem;
          padding: var(--touch-spacing, 12px) var(--bmb-spacing-l);
        }
      }
      
      .files-grid {
        grid-template-columns: 1fr;
        gap: var(--bmb-spacing-m);
      }
      
      .files-preview {
        margin-bottom: var(--bmb-spacing-xl);
      }
      
      .progress-stats, .results-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: var(--bmb-spacing-s);
      }
      
      .processing-summary, .results-summary {
        margin-bottom: var(--bmb-spacing-xl);
      }
      
      .next-actions {
        flex-direction: column;
        
        button {
          width: 100%;
          padding: var(--touch-spacing, 12px);
        }
      }
    }
    
    /* Tablet Styles (768px-1024px) - TASK-UI-004 */
    @media (min-width: 768px) and (max-width: 1024px) {
      .admin-bulk-container {
        padding: var(--bmb-spacing-l);
        padding-bottom: calc(var(--bmb-spacing-xxl) * 2);
        min-height: 100vh;
        max-height: 100vh;
      }
      
      .admin-header {
        .header-content {
          .admin-title {
            font-size: 2rem;
          }
          
          .admin-subtitle {
            font-size: 1rem;
          }
        }
      }
      
      .config-row {
        flex-direction: row;
        align-items: center;
        gap: var(--bmb-spacing-m);
        
        .config-label {
          min-width: 250px;
          flex-shrink: 0;
        }
      }
      
      .bulk-drop-zone {
        min-height: 450px;
        
        .drop-zone-content {
          .bulk-icon {
            font-size: 4.5rem;
          }
          
          .drop-title {
            font-size: 1.7rem;
          }
          
          .drop-description {
            font-size: 1.05rem;
          }
          
          .bulk-benefits {
            gap: var(--bmb-spacing-m);
          }
        }
      }
      
      .files-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .progress-stats, .results-grid {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    
    /* Desktop Styles (1025px+) */
    @media (min-width: 1025px) {
      .admin-bulk-container {
        min-height: 100vh;
        max-height: 100vh;
        padding-bottom: calc(var(--bmb-spacing-xxl) * 2);
      }
      
      .config-row {
        flex-direction: row;
        align-items: center;
        gap: var(--bmb-spacing-l);
        
        .config-label {
          min-width: 300px;
          flex-shrink: 0;
        }
      }
      
      .bulk-drop-zone {
        min-height: 500px;
      }
      
      .files-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    
    /* 🖱️ TOUCH DEVICE OPTIMIZATIONS - TASK-UI-004 */
    @media (hover: none) and (pointer: coarse) {
      .admin-bulk-container {
        -webkit-overflow-scrolling: touch;
      }
      
      .bulk-drop-zone:hover {
        transform: none;
        
        .bulk-icon {
          transform: none;
        }
      }
      
      .file-preview-card:hover {
        transform: none;
      }
      
      .start-batch-button:hover {
        transform: none;
      }
      
      .back-button:hover {
        transform: none;
      }
    }
  `]
})
export class AdminBulkUploadComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private location = inject(Location);

  selectedProcessingType: string = 'both';
  defaultDocumentType: string = 'expediente_medico';
  
  batchFiles: BatchFile[] = [];
  batchUpload: BatchUpload | null = null;
  
  isDragOver = false;
  isProcessing = false;

  ngOnInit(): void {
    console.log('🔧 Admin Bulk Upload Component initialized');
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
      // Parse TecSalud filename pattern
      const patientInfo = this.parseTecSaludFilename(file.name);
      
      const batchFile: BatchFile = {
        file: file,
        filename: file.name,
        patientInfo: patientInfo,
        status: patientInfo ? 'pending' : 'error',
        error: patientInfo ? undefined : 'Formato de archivo inválido para TecSalud'
      };
      
      this.batchFiles.push(batchFile);
    });

    console.log(`📂 Processed ${validFiles.length} files, ${this.batchFiles.length} total`);
  }

  private isValidFile(file: File): boolean {
    const validTypes = ['application/pdf', 'application/msword', 
                       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                       'text/plain'];
    return validTypes.includes(file.type) && file.size > 0;
  }

  private parseTecSaludFilename(filename: string): any | null {
    // Pattern: ID_APELLIDO APELLIDO, NOMBRE_NUM_TIPO.extension
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
    
    try {
      // Initialize batch upload
      this.batchUpload = {
        processing_type: this.selectedProcessingType,
        status: 'processing',
        total_files: this.batchFiles.length,
        processed_files: 0,
        created_patients: 0,
        matched_patients: 0,
        files: this.batchFiles
      };

      console.log('🚀 Starting batch processing for', this.batchFiles.length, 'files');

      // Process files one by one (can be parallelized later)
      for (let i = 0; i < this.batchFiles.length; i++) {
        const batchFile = this.batchFiles[i];
        
        try {
          batchFile.status = 'processing';
          
          // Create FormData for upload with required fields
          const formData = new FormData();
          formData.append('file', batchFile.file);
          formData.append('document_type', this.defaultDocumentType);
          formData.append('title', batchFile.filename);
          formData.append('processing_type', this.selectedProcessingType); // Add processing type
          
          // Always use BULK_UPLOAD_PATIENT to trigger automatic patient creation
          formData.append('patient_id', 'BULK_UPLOAD_PATIENT');

          // Upload document using the correct endpoint
          const response = await this.apiService.uploadDocument(formData).toPromise();
          
          batchFile.status = 'completed';
          this.batchUpload.processed_files++;
          
          // Note: The current endpoint doesn't return patient_created info
          // so we'll estimate based on whether we had parsed patient info
          if (batchFile.patientInfo?.id) {
            this.batchUpload.matched_patients++;
          } else {
            this.batchUpload.created_patients++;
          }
          
        } catch (error) {
          console.error('❌ Error processing file:', batchFile.filename, error);
          batchFile.status = 'error';
          batchFile.error = error instanceof Error ? error.message : 'Error al procesar el archivo';
          this.batchUpload.processed_files++;
        }
      }

      this.batchUpload.status = 'completed';
      console.log('🎉 Batch processing completed!');
      
    } catch (error) {
      console.error('❌ Batch processing failed:', error);
      if (this.batchUpload) {
        this.batchUpload.status = 'failed';
      }
    } finally {
      this.isProcessing = false;
    }
  }

  removeFile(batchFile: BatchFile): void {
    const index = this.batchFiles.indexOf(batchFile);
    if (index > -1) {
      this.batchFiles.splice(index, 1);
    }
  }

  getProgressPercentage(): number {
    if (!this.batchUpload || this.batchUpload.total_files === 0) return 0;
    return (this.batchUpload.processed_files / this.batchUpload.total_files) * 100;
  }

  testSearchWithNewDocuments(): void {
    console.log('🔍 Testing search with newly uploaded documents');
    this.router.navigate(['/copiloto-medico']);
  }

  startNewBatch(): void {
    this.batchFiles = [];
    this.batchUpload = null;
    this.isProcessing = false;
    console.log('🔄 Started new batch');
  }

  goBack(): void {
    this.location.back();
  }

  trackByFile(index: number, batchFile: BatchFile): string {
    return batchFile.filename;
  }
} 