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
          <button 
            class="global-back-button"
            (click)="goBack()"
            title="Volver">
            <span class="back-icon">←</span>
            <span class="back-text">Volver</span>
          </button>
          <div class="title-container">
            <h1 class="main-title">📤 Subir Expedientes Médicos</h1>
            <div class="main-subtitle">
              Vectorización automática con IA para búsqueda inteligente
            </div>
          </div>
        </div>
      </div>

      <!-- Upload Area -->
      <div class="upload-section">
        
        <!-- Drag & Drop Zone usando sistema estandarizado -->
        <div 
          class="drop-zone-full"
          [class.drag-over]="isDragOver"
          [class.has-files]="selectedFiles.length > 0"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()">
          
          <div class="drop-icon">📁</div>
          <h3 class="drop-title">Arrastra documentos aquí</h3>
          <p class="drop-subtitle">o haz clic para seleccionar archivos</p>
          <div class="format-badges">
            <span class="format-badge">PDF</span>
            <span class="format-badge">DOCX</span>
            <span class="format-badge">TXT</span>
          </div>
          
          <input 
            #fileInput
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt"
            (change)="onFileSelected($event)"
            class="file-input-hidden">
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
      </div>

      <!-- File List -->
      <div class="files-section" *ngIf="uploads.length > 0">
        <h3 class="files-title">📋 Archivos Seleccionados</h3>
        
        <div class="file-list">
          <div 
            *ngFor="let upload of uploads; trackBy: trackByFile"
            class="file-item"
            [class]="'status-' + upload.status">
            
            <!-- File Info -->
            <div class="file-info">
              <div class="file-name">{{ upload.file.name }}</div>
              <div class="file-details">
                {{ getFileSize(upload.file.size) }} • 
                {{ upload.document_type }} • 
                {{ getPatientName(upload.patient_id) }}
              </div>
            </div>

            <!-- Status & Progress -->
            <div class="file-status">
              <div *ngIf="upload.status === 'pending'" class="status-pending">
                ⏳ Pendiente
              </div>
              
              <div *ngIf="upload.status === 'uploading'" class="status-uploading">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    [style.width.%]="upload.progress">
                  </div>
                </div>
                <span>{{ upload.progress }}%</span>
              </div>
              
              <div *ngIf="upload.status === 'success'" class="status-success">
                ✅ Completado
              </div>
              
              <div *ngIf="upload.status === 'error'" class="status-error">
                ❌ Error: {{ upload.error }}
              </div>
            </div>

            <!-- Actions -->
            <div class="file-actions">
              <button 
                *ngIf="upload.status === 'pending'"
                class="remove-button"
                (click)="removeFile(upload)"
                title="Eliminar archivo">
                🗑️
              </button>
            </div>

          </div>
        </div>
      </div>

      <!-- Results Summary -->
      <div class="results-section" *ngIf="uploadResults.length > 0">
        <h3 class="results-title">📊 Resultados de Vectorización</h3>
        
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
    .document-upload-container {
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
      box-sizing: border-box;
      -webkit-overflow-scrolling: touch;
      scroll-behavior: smooth;
    }

    .upload-header {
      margin-bottom: var(--bmb-spacing-xl);
      
      .header-top {
        display: flex;
        align-items: center;
        margin-bottom: var(--bmb-spacing-m);
      }
      
      .back-button {
        background: var(--general_contrasts-15);
        border: 1px solid var(--general_contrasts-container-outline);
        border-radius: var(--bmb-radius-s);
        padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
        color: var(--general_contrasts-100);
        cursor: pointer;
        transition: all 0.3s ease;
        margin-right: var(--bmb-spacing-l);
        
        &:hover {
          background: var(--general_contrasts-25);
          transform: translateX(-4px);
        }
      }
      
      .title-container {
        flex: 1;
        text-align: center;
        
        .upload-title {
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
        
        .upload-subtitle {
          color: var(--general_contrasts-75);
          font-size: 1.1rem;
          margin: 0;
          line-height: 1.4;
          max-width: 600px;
          margin: 0 auto;
        }
      }
    }

    .upload-section {
      max-width: 800px;
      margin: 0 auto var(--bmb-spacing-xl) auto;
    }

    /* 🗑️ Estilos eliminados - Ahora usa .drop-zone-full global */

    .config-panel {
      background: var(--general_contrasts-15);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-l);
      margin-top: var(--bmb-spacing-l);
      
      .config-section {
        margin-bottom: var(--bmb-spacing-m);
        
        .config-label {
          display: block;
          font-weight: 600;
          color: var(--general_contrasts-100);
          margin-bottom: var(--bmb-spacing-s);
          font-size: 1rem;
        }
        
        .bamboo-select {
          width: 100%;
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
    }

    .upload-button {
      width: 100%;
      background: linear-gradient(135deg, 
        var(--buttons-primary-normal) 0%, 
        var(--buttons-primary-hover) 100%
      );
      color: white;
      border: none;
      border-radius: var(--bmb-radius-s);
      padding: var(--bmb-spacing-m) var(--bmb-spacing-l);
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(var(--color-blue-tec), 0.3);
      
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
      max-width: 800px;
      margin: 0 auto var(--bmb-spacing-xl) auto;
      
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

    /* 🎯 FILES LIST - HOVER SIMPLE SIGUIENDO PATRÓN DE ADMIN-PILLS-MANAGER */
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
      
      /* Estados base con colores */
      &.status-success {
        border-color: var(--semantic-success);
        background: rgba(76, 175, 80, 0.1);
      }
      
      &.status-error {
        border-color: var(--semantic-error);
        background: rgba(244, 67, 54, 0.1);
      }
      
      &.status-uploading {
        border-color: rgb(var(--color-blue-tec));
        background: rgba(var(--color-blue-tec), 0.1);
      }
      
      /* Hover effect siguiendo patrón de admin-pills-manager */
      &:hover {
        background: var(--medical-context-active);
      }
    }

    .file-info {
      flex: 1;
      min-width: 0;
      
      .file-name {
        font-weight: 600;
        color: var(--general_contrasts-100);
        margin-bottom: var(--bmb-spacing-xs);
        word-wrap: break-word;
        overflow-wrap: break-word;
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
        
        span {
          font-size: 0.75rem;
          color: rgb(var(--color-blue-tec));
          font-weight: 600;
        }
      }
      
      .status-success {
        color: var(--semantic-success);
        font-size: 0.875rem;
        font-weight: 600;
      }
      
      .status-error {
        color: var(--semantic-error);
        font-size: 0.875rem;
        font-weight: 600;
      }
    }

    .file-actions {
      display: flex;
      gap: var(--bmb-spacing-s);
      
      .remove-button {
        background: none;
        border: 1px solid var(--general_contrasts-container-outline);
        padding: var(--bmb-spacing-xs);
        border-radius: var(--bmb-radius-s);
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 0.875rem;
        color: var(--general_contrasts-75);
        
        &:hover {
          background: rgba(244, 67, 54, 0.1);
          border-color: rgba(244, 67, 54, 0.3);
          color: var(--semantic-error);
        }
      }
    }



    .results-section {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
      
      .results-title {
        color: var(--general_contrasts-100);
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: var(--bmb-spacing-l);
      }
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

    /* 📱 AGGRESSIVE RESPONSIVE FIXES */
    @media (max-width: 950px) {
      .document-upload-container {
        height: 100vh !important;
        max-height: 100vh !important;
        padding: var(--bmb-spacing-s) !important;
        padding-bottom: 150px !important;
        overflow-y: auto !important;
      }
      
      /* ✅ FORCE MOBILE HEADER */
      .upload-header {
        margin-bottom: var(--bmb-spacing-m) !important;
        
        .header-top {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: var(--bmb-spacing-s) !important;
          
          .back-button {
            margin-right: 0 !important;
            margin-bottom: var(--bmb-spacing-s) !important;
            order: 1 !important;
          }
          
          .title-container {
            order: 2 !important;
            text-align: center !important;
            
            .upload-title {
              font-size: 1.3rem !important;
              margin-bottom: var(--bmb-spacing-xs) !important;
            }
            
            .upload-subtitle {
              font-size: 0.9rem !important;
            }
          }
        }
      }
      
      /* ✅ FORCE MOBILE UPLOAD SECTION */
      .upload-section {
        margin: 0 auto !important;
        margin-bottom: var(--bmb-spacing-l) !important;
        padding: 0 !important;
        
        /* 🗑️ Estilos eliminados - Ahora usa .drop-zone-full global con responsive */
        
        /* ✅ FORCE MOBILE CONFIG PANEL */
        .config-panel {
          display: flex !important;
          flex-direction: column !important;
          gap: var(--bmb-spacing-m) !important;
          padding: var(--bmb-spacing-m) !important;
          background: var(--general_contrasts-15) !important;
          border-radius: var(--bmb-radius-m) !important;
          margin-bottom: var(--bmb-spacing-m) !important;
          
          .config-section {
            width: 100% !important;
            margin-bottom: var(--bmb-spacing-s) !important;
            
            .config-label {
              font-size: 0.9rem !important;
              margin-bottom: var(--bmb-spacing-xs) !important;
            }
            
            .bamboo-select {
              width: 100% !important;
              padding: var(--bmb-spacing-s) !important;
              font-size: 0.9rem !important;
            }
          }
          
          .upload-button {
            width: 100% !important;
            padding: var(--bmb-spacing-m) !important;
            font-size: 1rem !important;
            margin-top: var(--bmb-spacing-s) !important;
            order: 3 !important;
          }
        }
      }
      
      /* ✅ FORCE MOBILE FILES SECTION */
      .files-section {
        margin: 0 auto !important;
        margin-bottom: var(--bmb-spacing-l) !important;
        padding: 0 !important;
        
        .files-title {
          font-size: 1.2rem !important;
          margin-bottom: var(--bmb-spacing-m) !important;
        }
        
        .file-list {
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
              
              .file-name {
                font-size: 0.9rem !important;
                margin-bottom: var(--bmb-spacing-xs) !important;
                word-break: break-word !important;
              }
              
              .file-details {
                font-size: 0.8rem !important;
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
                
                .progress-bar {
                  width: 60px !important;
                  height: 4px !important;
                }
                
                span {
                  font-size: 0.75rem !important;
                }
              }
            }
            
            .file-actions {
              order: 3 !important;
              display: flex !important;
              justify-content: center !important;
              width: 100% !important;
              
              .remove-button {
                padding: var(--bmb-spacing-s) !important;
                font-size: 0.9rem !important;
              }
            }
          }
        }
      }
      
      /* ✅ FORCE MOBILE RESULTS SECTION */
      .results-section {
        margin: 0 auto !important;
        padding: var(--bmb-spacing-m) !important;
        background: var(--general_contrasts-15) !important;
        border-radius: var(--bmb-radius-m) !important;
        
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
    
    /* 🖥️ MEDIUM SCREEN FIXES */
    @media (max-width: 1200px) and (min-width: 951px) {
      .upload-section {
        max-width: 700px !important;
        
        .config-panel {
          padding: var(--bmb-spacing-m) !important;
          
          .config-section {
            .bamboo-select {
              font-size: 0.9rem !important;
            }
          }
          
          .upload-button {
            font-size: 1rem !important;
            padding: var(--bmb-spacing-s) var(--bmb-spacing-l) !important;
          }
        }
      }
      
      .files-section {
        max-width: 700px !important;
        
        .file-item {
          padding: var(--bmb-spacing-s) !important;
          
          .file-info {
            .file-name {
              font-size: 0.9rem !important;
            }
            
            .file-details {
              font-size: 0.8rem !important;
            }
          }
        }
      }
      
      .results-section {
        max-width: 700px !important;
        
        .results-summary {
          gap: var(--bmb-spacing-l) !important;
        }
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
          processing_type: 'vectorized', // Default processing type for document upload
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