import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

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

@Component({
  selector: 'app-admin-bulk-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, BambooModule],
  template: `
    <div class="admin-bulk-container">
      <!-- Header -->
      <div class="admin-header">
        <button 
          class="back-button"
          (click)="goBack()"
          title="Volver">
          ← Volver
        </button>
        <h1 class="admin-title">🔧 Admin: Carga Masiva de Expedientes</h1>
        <div class="admin-subtitle">
          Procesamiento automático de expedientes TecSalud con extracción de pacientes
        </div>
      </div>

      <!-- Configuration Panel -->
      <div class="config-panel">
        <h3>⚙️ Configuración de Procesamiento</h3>
        
        <div class="config-row">
          <label class="config-label">🔄 Tipo de Procesamiento:</label>
          <select 
            class="bamboo-select"
            [(ngModel)]="selectedProcessingType">
            <option value="vectorized">🔍 Solo Vectorización (Búsqueda semántica)</option>
            <option value="complete">📄 Solo Almacenamiento Completo</option>
            <option value="both">⚡ Híbrido (Recomendado)</option>
          </select>
        </div>

        <div class="config-row">
          <label class="config-label">📋 Tipo de Documento por Defecto:</label>
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
            <h3>Arrastra múltiples expedientes TecSalud aquí</h3>
            <p>Formato: ID_APELLIDO APELLIDO, NOMBRE_NUM_TIPO.pdf</p>
            <div class="example-filename">
              <strong>Ejemplo:</strong> 3000003799_GARZA TIJERINA, MARIA ESTHER_6001467010_CONS.pdf
            </div>
            <div class="bulk-benefits">
              <span class="benefit">✅ Extracción automática de pacientes</span>
              <span class="benefit">✅ Matching inteligente</span>
              <span class="benefit">✅ Procesamiento masivo</span>
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
        <button 
          *ngIf="batchFiles.length > 0 && !isProcessing"
          class="start-batch-button"
          (click)="startBatchProcessing()">
          🚀 Procesar {{ batchFiles.length }} Expediente(s)
        </button>
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
    .admin-bulk-container {
      min-height: 100vh;
      background: linear-gradient(135deg, 
        var(--general_contrasts-15) 0%, 
        var(--general_contrasts-5) 100%
      );
      padding: var(--bmb-spacing-l);
    }

    .admin-header {
      text-align: center;
      margin-bottom: var(--bmb-spacing-xl);
      
      .back-button {
        position: absolute;
        top: var(--bmb-spacing-l);
        left: var(--bmb-spacing-l);
        background: var(--general_contrasts-15);
        border: 1px solid var(--general_contrasts-container-outline);
        border-radius: var(--bmb-radius-s);
        padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
        color: var(--general_contrasts-100);
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          background: var(--general_contrasts-25);
          transform: translateX(-4px);
        }
      }
      
      .admin-title {
        font-size: 2.2rem;
        font-weight: 700;
        color: var(--general_contrasts-100);
        margin: 0 0 var(--bmb-spacing-s) 0;
        font-family: var(--font-display);
        background: linear-gradient(135deg, 
          rgb(var(--color-blue-tec)) 0%, 
          rgb(var(--color-mariner-100)) 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .admin-subtitle {
        color: var(--general_contrasts-75);
        font-size: 1.1rem;
        margin: 0;
      }
    }

    .config-panel {
      background: linear-gradient(135deg, 
        rgba(var(--color-blue-tec), 0.08) 0%, 
        rgba(var(--color-blue-tec), 0.03) 100%
      );
      border: 1px solid rgba(var(--color-blue-tec), 0.2);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-l);
      margin-bottom: var(--bmb-spacing-xl);
      max-width: 800px;
      margin-left: auto;
      margin-right: auto;
      
      h3 {
        color: var(--general_contrasts-100);
        margin: 0 0 var(--bmb-spacing-l) 0;
        font-size: 1.3rem;
        font-weight: 600;
      }
    }

    .config-row {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-m);
      margin-bottom: var(--bmb-spacing-m);
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .config-label {
        min-width: 200px;
        font-weight: 600;
        color: var(--general_contrasts-100);
        font-size: 1rem;
      }
      
      .bamboo-select {
        flex: 1;
        padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
        border: 1px solid var(--general_contrasts-container-outline);
        border-radius: var(--bmb-radius-s);
        background: var(--general_contrasts-input-background);
        color: var(--general_contrasts-100);
        font-size: 1rem;
        
        &:focus {
          outline: none;
          border-color: rgb(var(--color-blue-tec));
          box-shadow: 0 0 0 2px rgba(var(--color-blue-tec), 0.2);
        }
      }
    }

    .bulk-upload-section {
      max-width: 1000px;
      margin: 0 auto var(--bmb-spacing-xl) auto;
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
      }
      
      &:hover {
        border-color: rgb(var(--color-blue-tec));
        background: linear-gradient(135deg, 
          var(--general_contrasts-15) 0%, 
          rgb(var(--color-mariner-50)) 100%
        );
        transform: translateY(-6px);
        
        &::before {
          left: 100%;
        }
      }
      
      &.drag-over {
        border-color: rgb(var(--color-blue-tec));
        background: rgb(var(--color-mariner-50));
        transform: scale(1.02);
        border-width: 4px;
      }
      
      &.has-files {
        border-color: var(--semantic-success);
        background: rgba(76, 175, 80, 0.1);
      }
    }

    .drop-zone-content {
      .bulk-icon {
        font-size: 5rem;
        margin-bottom: var(--bmb-spacing-l);
        opacity: 0.8;
      }
      
      h3 {
        color: var(--general_contrasts-100);
        margin: 0 0 var(--bmb-spacing-s) 0;
        font-size: 1.8rem;
        font-weight: 600;
      }
      
      p {
        color: var(--general_contrasts-75);
        margin: 0 0 var(--bmb-spacing-m) 0;
        font-size: 1.1rem;
      }
      
      .example-filename {
        background: rgba(var(--color-blue-tec), 0.1);
        border-radius: var(--bmb-radius-s);
        padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
        margin: var(--bmb-spacing-m) 0;
        font-family: monospace;
        font-size: 0.9rem;
        color: var(--general_contrasts-100);
        word-break: break-all;
      }
      
      .bulk-benefits {
        display: flex;
        justify-content: center;
        gap: var(--bmb-spacing-l);
        margin-top: var(--bmb-spacing-l);
        flex-wrap: wrap;
        
        .benefit {
          background: var(--semantic-success);
          color: white;
          padding: var(--bmb-spacing-xs) var(--bmb-spacing-s);
          border-radius: var(--bmb-radius-s);
          font-size: 0.875rem;
          font-weight: 500;
        }
      }
    }

    .start-batch-button {
      width: 100%;
      max-width: 400px;
      margin: var(--bmb-spacing-l) auto 0 auto;
      display: block;
      background: linear-gradient(135deg, 
        var(--semantic-success) 0%, 
        #45A049 100%
      );
      color: white;
      border: none;
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-l) var(--bmb-spacing-xl);
      font-size: 1.2rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
      
      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 30px rgba(76, 175, 80, 0.5);
      }
    }

    .files-preview {
      max-width: 1200px;
      margin: 0 auto var(--bmb-spacing-xl) auto;
      
      .preview-title {
        color: var(--general_contrasts-100);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--bmb-spacing-l);
        text-align: center;
      }
    }

    .files-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
      gap: var(--bmb-spacing-l);
    }

    .file-preview-card {
      background: var(--general_contrasts-15);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-l);
      transition: all 0.3s ease;
      
      &.status-matched {
        border-color: var(--semantic-success);
        background: rgba(76, 175, 80, 0.1);
      }
      
      &.status-review_needed {
        border-color: var(--semantic-warning);
        background: rgba(255, 152, 0, 0.1);
      }
      
      &.status-processing {
        border-color: rgb(var(--color-blue-tec));
        background: rgba(var(--color-blue-tec), 0.1);
      }
      
      &.status-completed {
        border-color: var(--semantic-success);
        background: rgba(76, 175, 80, 0.15);
      }
      
      &.status-error {
        border-color: var(--semantic-error);
        background: rgba(244, 67, 54, 0.1);
      }
    }

    .file-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--bmb-spacing-m);
      
      .file-name {
        font-weight: 600;
        color: var(--general_contrasts-100);
        font-size: 0.9rem;
        word-break: break-all;
        flex: 1;
        margin-right: var(--bmb-spacing-s);
      }
    }

    .status-badge {
      padding: var(--bmb-spacing-xs) var(--bmb-spacing-s);
      border-radius: var(--bmb-radius-s);
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;
      
      &.pending { background: var(--general_contrasts-25); color: var(--general_contrasts-100); }
      &.parsing { background: rgb(var(--color-blue-tec)); color: white; }
      &.matched { background: var(--semantic-success); color: white; }
      &.review { background: var(--semantic-warning); color: white; }
      &.processing { background: rgb(var(--color-blue-tec)); color: white; }
      &.completed { background: var(--semantic-success); color: white; }
      &.error { background: var(--semantic-error); color: white; }
    }

    .patient-info {
      margin-bottom: var(--bmb-spacing-m);
      
      .info-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--bmb-spacing-xs);
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .info-label {
          color: var(--general_contrasts-75);
          font-size: 0.875rem;
          font-weight: 500;
          min-width: 80px;
        }
        
        .info-value {
          color: var(--general_contrasts-100);
          font-size: 0.875rem;
          font-weight: 600;
          text-align: right;
          flex: 1;
        }
      }
    }

    .processing-summary, .results-summary {
      max-width: 800px;
      margin: 0 auto var(--bmb-spacing-xl) auto;
      background: var(--general_contrasts-15);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-l);
      
      .summary-title, .results-title {
        color: var(--general_contrasts-100);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--bmb-spacing-l);
        text-align: center;
      }
    }

    .progress-stats, .results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: var(--bmb-spacing-m);
      margin-bottom: var(--bmb-spacing-l);
    }

    .stat-card, .result-card {
      text-align: center;
      padding: var(--bmb-spacing-m);
      border-radius: var(--bmb-radius-s);
      
      .stat-number, .result-number {
        font-size: 2rem;
        font-weight: 700;
        color: var(--general_contrasts-100);
        margin-bottom: var(--bmb-spacing-xs);
      }
      
      .stat-label, .result-label {
        color: var(--general_contrasts-75);
        font-size: 0.875rem;
        font-weight: 500;
      }
    }

    .stat-card {
      background: rgba(var(--color-blue-tec), 0.1);
      border: 1px solid rgba(var(--color-blue-tec), 0.2);
    }

    .result-card {
      &.success {
        background: rgba(76, 175, 80, 0.1);
        border: 1px solid rgba(76, 175, 80, 0.3);
      }
      
      &.info {
        background: rgba(var(--color-blue-tec), 0.1);
        border: 1px solid rgba(var(--color-blue-tec), 0.2);
      }
      
      .result-icon {
        font-size: 1.5rem;
        margin-bottom: var(--bmb-spacing-xs);
      }
    }

    .progress-bar {
      width: 100%;
      height: 12px;
      background: var(--general_contrasts-25);
      border-radius: var(--bmb-radius-full);
      overflow: hidden;
      
      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, 
          var(--semantic-success) 0%, 
          #45A049 100%
        );
        transition: width 0.3s ease;
      }
    }

    .next-actions {
      display: flex;
      gap: var(--bmb-spacing-m);
      justify-content: center;
      margin-top: var(--bmb-spacing-l);
      
      button {
        padding: var(--bmb-spacing-m) var(--bmb-spacing-l);
        border-radius: var(--bmb-radius-s);
        border: none;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &.test-search-button {
          background: rgb(var(--color-blue-tec));
          color: white;
          
          &:hover {
            background: rgb(var(--color-mariner-100));
            transform: translateY(-2px);
          }
        }
        
        &.start-new-button {
          background: var(--semantic-success);
          color: white;
          
          &:hover {
            background: #45A049;
            transform: translateY(-2px);
          }
        }
      }
    }

    .remove-button {
      background: var(--semantic-error);
      color: white;
      border: none;
      border-radius: var(--bmb-radius-s);
      padding: var(--bmb-spacing-xs) var(--bmb-spacing-s);
      font-size: 0.875rem;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: #d32f2f;
        transform: translateY(-1px);
      }
    }

    @media (max-width: 768px) {
      .config-row {
        flex-direction: column;
        align-items: flex-start;
        
        .config-label {
          min-width: auto;
          margin-bottom: var(--bmb-spacing-xs);
        }
      }
      
      .files-grid {
        grid-template-columns: 1fr;
      }
      
      .progress-stats, .results-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      
      .next-actions {
        flex-direction: column;
      }
    }
  `]
})
export class AdminBulkUploadComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);

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
          
          // Create FormData for upload
          const formData = new FormData();
          formData.append('file', batchFile.file);
          formData.append('processing_type', this.selectedProcessingType);
          formData.append('document_type', this.defaultDocumentType);
          formData.append('original_filename', batchFile.filename);
          
          // Add patient info if parsed
          if (batchFile.patientInfo) {
            formData.append('patient_data', JSON.stringify(batchFile.patientInfo));
          }

          // Upload document (using existing endpoint)
          const response = await this.apiService.post('/documents/upload', formData).toPromise();
          
          batchFile.status = 'completed';
          this.batchUpload.processed_files++;
          
          if (response.patient_created) {
            this.batchUpload.created_patients++;
          } else {
            this.batchUpload.matched_patients++;
          }
          
        } catch (error) {
          console.error('❌ Error processing file:', batchFile.filename, error);
          batchFile.status = 'error';
          batchFile.error = 'Error al procesar el archivo';
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
    this.router.navigate(['/']);
  }

  trackByFile(index: number, batchFile: BatchFile): string {
    return batchFile.filename;
  }
} 