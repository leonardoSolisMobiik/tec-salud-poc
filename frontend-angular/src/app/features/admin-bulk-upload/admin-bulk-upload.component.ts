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
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100 for progress bar
  startTime?: Date;
  completedTime?: Date;
  error?: string;
  estimatedTimeRemaining?: number; // in seconds
}

interface BatchUpload {
  id?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  total_files: number;
  processed_files: number;
  completed_files: number;
  error_files: number;
  files: BatchFile[];
  startTime?: Date;
  estimatedTotalTime?: number;
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
              Procesamiento automático con OCR → OneLake + Cosmos DB
            </div>
          </div>
        </div>
      </div>

      <!-- Premium Upload Interface -->
      <div class="premium-upload-interface">
        <div class="upload-row">
          <!-- Compact Drop Zone -->
          <div 
            class="compact-drop-zone"
          [class.drag-over]="isDragOver"
          [class.has-files]="batchFiles.length > 0"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()">
          
            <div class="drop-icon">📁</div>
            <div class="drop-info">
              <div class="drop-title">Seleccionar Expedientes</div>
              <div class="drop-subtitle">PDF • Formato TecSalud</div>
          </div>
          
          <input 
            #fileInput
            type="file"
            multiple
              accept=".pdf"
            (change)="onFileSelected($event)"
            style="display: none;">
        </div>

          <!-- Process Controls -->
          <div class="process-controls">
            <div class="files-count" *ngIf="batchFiles.length > 0">
              <span class="count-number">{{ batchFiles.length }}</span>
              <span class="count-label">archivos listos</span>
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
      <div class="files-list-container" *ngIf="batchFiles.length > 0">
        <div class="list-header">
          <div class="header-title">
            <span class="title-text">Expedientes en Cola</span>
            <span class="title-count">{{ batchFiles.length }}</span>
            </div>
              <button 
            *ngIf="!isProcessing && hasPendingFiles()"
            class="clear-pending-btn"
            (click)="clearPendingFiles()">
            Limpiar pendientes
              </button>
            </div>

        <div class="list-content">
          <div 
            *ngFor="let file of batchFiles; trackBy: trackByFile; let i = index"
            class="file-row"
            [class.processing]="file.status === 'processing'"
            [class.completed]="file.status === 'completed'"
            [class.error]="file.status === 'error'">
            
            <div class="row-index">{{ i + 1 }}</div>
            
                          <div class="file-info">
                <div class="file-name" [title]="file.filename">
                  {{ truncateFilename(file.filename, 60) }}
          </div>
              <div class="patient-info" *ngIf="file.patientInfo">
                {{ file.patientInfo.apellido_paterno }} {{ file.patientInfo.apellido_materno }}, {{ file.patientInfo.nombre }}
          </div>
          </div>
            
            <div class="status-info">
              <div class="status-indicator" [ngSwitch]="file.status">
                <span *ngSwitchCase="'pending'" class="status pending">⏳</span>
                <span *ngSwitchCase="'processing'" class="status processing">
                  <span class="spinner">⚡</span>
                </span>
                <span *ngSwitchCase="'completed'" class="status completed">✅</span>
                <span *ngSwitchCase="'error'" class="status error">❌</span>
        </div>

              <div class="status-text" [ngSwitch]="file.status">
                <span *ngSwitchCase="'pending'">Pendiente</span>
                <span *ngSwitchCase="'processing'">Procesando OCR...</span>
                <span *ngSwitchCase="'completed'">Completado</span>
                <span *ngSwitchCase="'error'">Error</span>
        </div>
      </div>

            <div class="action-info">
              <button 
                *ngIf="file.status === 'pending' && !isProcessing"
                class="remove-file-btn"
                (click)="removeFile(file)"
                title="Eliminar">
                ×
              </button>
              
              <span *ngIf="file.status === 'processing' && file.estimatedTimeRemaining" 
                    class="time-remaining">
                ~{{ file.estimatedTimeRemaining }}s
              </span>
              
              <span *ngIf="file.status === 'completed' && file.completedTime" 
                    class="time-completed">
                {{ formatCompletionTime(file.completedTime) }}
              </span>
              
              <span *ngIf="file.status === 'error'" 
                    class="error-text" 
                    [title]="file.error">
                Error
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
    /* 🎨 PREMIUM CONTAINER - OPTIMIZED SPACING */
    .admin-bulk-container {
      height: 100vh; /* ✅ FIXED HEIGHT FOR PROPER SCROLL */
      max-height: 100vh;
      background: linear-gradient(135deg, 
        var(--general_contrasts-15) 0%, 
        var(--general_contrasts-5) 100%
      );
      padding: var(--bmb-spacing-l);
      padding-bottom: 60px; /* ✅ REDUCED BOTTOM PADDING */
      overflow-y: auto; /* ✅ SCROLL ONLY WHEN NEEDED */
      overflow-x: hidden;
      scroll-behavior: smooth;
      
      /* ✅ SUBTLE SCROLLBAR LIKE OTHER SCREENS */
      &::-webkit-scrollbar {
        width: 8px; /* ✅ STANDARD WIDTH */
      }
      
      &::-webkit-scrollbar-track {
        background: transparent; /* ✅ TRANSPARENT TRACK */
      }
      
      &::-webkit-scrollbar-thumb {
        background: var(--general_contrasts-50); /* ✅ SUBTLE COLOR */
        border-radius: 4px;
        
        &:hover {
          background: var(--general_contrasts-75); /* ✅ SUBTLE HOVER */
        }
      }
      
      /* ✅ FIREFOX STYLING */
      scrollbar-width: thin;
      scrollbar-color: var(--general_contrasts-50) transparent;
    }

    /* 📱 MODERN HEADER */
    .admin-header {
      margin-bottom: var(--bmb-spacing-l);
      
      .header-top {
        display: flex;
        align-items: center;
        gap: var(--bmb-spacing-l);
        
        .back-button {
          display: flex;
          align-items: center;
          gap: var(--bmb-spacing-xs);
          background: var(--general_contrasts-input-background);
          border: 1px solid var(--general_contrasts-container-outline);
          border-radius: var(--bmb-radius-s);
          padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
          color: var(--general_contrasts-100);
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          
          &:hover {
            background: var(--general_contrasts-25);
            transform: translateX(-2px);
          }
        }
        
        .header-content {
          flex: 1;
          text-align: center;
          
          .admin-title {
            font-size: 1.8rem;
            font-weight: 700;
            color: var(--general_contrasts-100);
            margin: 0 0 var(--bmb-spacing-xs) 0;
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
            font-size: 1rem;
            margin: 0;
            max-width: 500px;
            margin: 0 auto;
          }
        }
      }
    }

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

    .compact-drop-zone {
        display: flex;
      align-items: center;
        gap: var(--bmb-spacing-m);
      padding: var(--bmb-spacing-m);
      border: 2px dashed var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-s);
      background: var(--general_contrasts-15);
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 300px;
      
      &:hover {
        border-color: rgb(var(--color-blue-tec));
        background: rgba(var(--color-blue-tec), 0.05);
        transform: translateY(-1px);
      }
      
      &.drag-over {
        border-color: rgb(var(--color-blue-tec));
        background: rgba(var(--color-blue-tec), 0.1);
        border-style: solid;
      }
      
      &.has-files {
        border-color: var(--semantic-success);
        background: rgba(76, 175, 80, 0.05);
      }
      
      .drop-icon {
        font-size: 2rem;
        opacity: 0.8;
        flex-shrink: 0;
      }
      
      .drop-info {
        flex: 1;
        
        .drop-title {
          font-size: 1rem;
          font-weight: 600;
          color: var(--general_contrasts-100);
          margin: 0 0 2px 0;
        }
        
        .drop-subtitle {
          font-size: 0.8rem;
          color: var(--general_contrasts-75);
          margin: 0;
        }
      }
    }

    .process-controls {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-m);
      
      .files-count {
        text-align: center;
        
        .count-number {
          display: block;
          font-size: 1.5rem;
          font-weight: 700;
          color: rgb(var(--color-blue-tec));
          line-height: 1;
        }
        
        .count-label {
          font-size: 0.8rem;
          color: var(--general_contrasts-75);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-top: 2px;
        }
      }
      
      .premium-process-btn {
      display: flex;
      align-items: center;
        gap: var(--bmb-spacing-s);
        background: linear-gradient(135deg, 
          rgb(var(--color-blue-tec)) 0%, 
          rgba(var(--color-blue-tec), 0.8) 100%
        );
        border: none;
        border-radius: var(--bmb-radius-s);
        padding: var(--bmb-spacing-m) var(--bmb-spacing-l);
        color: white;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 1rem;
        box-shadow: 0 4px 12px rgba(var(--color-blue-tec), 0.3);
      
      &:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(var(--color-blue-tec), 0.4);
        }
        
        .btn-icon {
          font-size: 1.2rem;
        }
        
        .btn-text {
          line-height: 1;
        }
      }
      
      .processing-indicator {
        display: flex;
        align-items: center;
        gap: var(--bmb-spacing-s);
        color: rgb(var(--color-blue-tec));
        font-weight: 600;
        
        .spinner-icon {
          animation: spin 1s linear infinite;
        }
        
        .processing-text {
          font-size: 1rem;
        }
      }
    }

    /* 📊 PREMIUM GLOBAL PROGRESS */
    .global-progress-section {
      background: var(--general_contrasts-input-background);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-m); /* ✅ REDUCED PADDING FOR COMPACTNESS */
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      margin-bottom: var(--bmb-spacing-m); /* ✅ REDUCED MARGIN */
      
      .progress-header {
        margin-bottom: var(--bmb-spacing-s); /* ✅ REDUCED MARGIN */
        
        .progress-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--bmb-spacing-m);
          
          .progress-title {
            font-size: 1.1rem; /* ✅ SMALLER TITLE */
        font-weight: 600;
            color: var(--general_contrasts-100);
            margin: 0;
          }
          
          .progress-stats {
            display: flex;
            align-items: center;
            gap: var(--bmb-spacing-m);
            
            .stat {
              font-size: 0.85rem; /* ✅ SMALLER TEXT */
        color: var(--general_contrasts-75);
              font-weight: 500;
            }
            
            .percentage {
              font-size: 1.2rem; /* ✅ SMALLER PERCENTAGE */
              font-weight: 700;
              color: rgb(var(--color-blue-tec));
            }
          }
        }
      }
      
      .progress-bar-global {
        width: 100%;
        height: 6px; /* ✅ THINNER PROGRESS BAR */
        background: var(--general_contrasts-25);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: var(--bmb-spacing-s); /* ✅ REDUCED MARGIN */
        
        .progress-fill-global {
          height: 100%;
          background: linear-gradient(90deg, 
            rgb(var(--color-blue-tec)) 0%, 
            rgb(var(--color-mariner-100)) 100%
          );
          transition: width 0.3s ease;
        }
      }
      
      .progress-details {
        .errors-info {
          color: var(--semantic-error);
          font-size: 0.8rem; /* ✅ SMALLER ERROR TEXT */
          font-weight: 500;
        }
      }
    }

    /* 📋 PREMIUM FILES LIST */
    .files-list-container {
      background: var(--general_contrasts-input-background);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-m); /* ✅ REDUCED PADDING */
      margin-bottom: var(--bmb-spacing-s); /* ✅ REDUCED BOTTOM MARGIN */
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      display: flex;
      flex-direction: column;
      max-height: 350px; /* ✅ LIMIT HEIGHT TO PREVENT OVERFLOW */
      
      .list-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--bmb-spacing-s); /* ✅ REDUCED MARGIN */
        padding-bottom: var(--bmb-spacing-s);
        border-bottom: 1px solid var(--general_contrasts-container-outline);
        
        .header-title {
          display: flex;
        align-items: center;
        gap: var(--bmb-spacing-s);
          
          .title-text {
            font-size: 1rem; /* ✅ SMALLER TITLE */
            font-weight: 600;
            color: var(--general_contrasts-100);
          }
          
          .title-count {
            background: rgb(var(--color-blue-tec));
        color: white;
            padding: 2px 6px; /* ✅ SMALLER BADGE */
            border-radius: var(--bmb-radius-s);
            font-size: 0.75rem; /* ✅ SMALLER TEXT */
        font-weight: 600;
          }
        }
        
        .clear-pending-btn {
          background: var(--general_contrasts-25);
          color: var(--general_contrasts-100);
          border: none;
          border-radius: var(--bmb-radius-s);
          padding: var(--bmb-spacing-xs) var(--bmb-spacing-s); /* ✅ SMALLER BUTTON */
          font-size: 0.8rem; /* ✅ SMALLER TEXT */
          font-weight: 500;
        cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            background: var(--general_contrasts-50);
            transform: translateY(-1px);
          }
        }
      }
      
      .list-content {
        flex: 1;
        max-height: 180px; /* ✅ REDUCED HEIGHT WHEN PROGRESS IS VISIBLE */
        overflow-y: auto;
        overflow-x: hidden;
        padding-right: 4px;
        padding-bottom: 40px; /* ✅ MORE BOTTOM SPACE */
        scroll-behavior: smooth;
        
        /* ✅ CUSTOM SCROLLBAR FOR LIST */
        &::-webkit-scrollbar {
          width: 6px;
        }
        
        &::-webkit-scrollbar-track {
          background: var(--general_contrasts-15);
          border-radius: 3px;
        }
        
        &::-webkit-scrollbar-thumb {
          background: var(--general_contrasts-50);
          border-radius: 3px;
          
          &:hover {
            background: var(--general_contrasts-75);
          }
        }
      }
    }

    /* 📄 PREMIUM FILE ROWS */
    .file-row {
      display: grid;
      grid-template-columns: auto 1fr auto auto;
      gap: var(--bmb-spacing-m);
      align-items: center;
      padding: var(--bmb-spacing-m);
      border-radius: var(--bmb-radius-s);
      transition: all 0.2s ease;
      border-left: 3px solid transparent;
      
      &:hover {
        background: var(--general_contrasts-15);
        transform: translateX(4px);
      }
      
      &.processing {
        background: rgba(var(--color-blue-tec), 0.05);
        border-left-color: rgb(var(--color-blue-tec));
        
        .spinner {
          animation: spin 1s linear infinite;
        }
      }
      
      &.completed {
        background: rgba(76, 175, 80, 0.05);
        border-left-color: var(--semantic-success);
      }
      
      &.error {
        background: rgba(244, 67, 54, 0.05);
        border-left-color: var(--semantic-error);
      }
      
      .row-index {
        font-size: 0.9rem;
        font-weight: 600;
        color: var(--general_contrasts-75);
        width: 30px;
        text-align: center;
      }
      
      .file-info {
        min-width: 0;
        
        .file-name {
          font-weight: 600;
          color: var(--general_contrasts-100);
          font-size: 0.95rem;
          line-height: 1.3;
          margin-bottom: 2px;
        }
        
        .patient-info {
            font-size: 0.8rem;
          color: var(--general_contrasts-75);
          line-height: 1.2;
        }
      }
      
      .status-info {
          display: flex;
        align-items: center;
          gap: var(--bmb-spacing-s);
        
        .status-indicator {
          .status {
            font-size: 1.2rem;
            line-height: 1;
            
            &.pending {
              opacity: 0.7;
            }
            
            &.processing {
              color: rgb(var(--color-blue-tec));
            }
            
            &.completed {
              color: var(--semantic-success);
            }
            
            &.error {
              color: var(--semantic-error);
            }
          }
        }
        
        .status-text {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--general_contrasts-75);
        }
      }
      
      .action-info {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        min-width: 80px;
        
        .remove-file-btn {
          background: var(--semantic-error);
          color: white;
          border: none;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.9rem;
          
          &:hover {
            background: #dc2626;
            transform: scale(1.1);
          }
        }
        
        .time-remaining {
          font-size: 0.8rem;
          color: rgb(var(--color-blue-tec));
        font-weight: 600;
        }
        
        .time-completed {
          font-size: 0.8rem;
          color: var(--semantic-success);
          font-weight: 500;
        }
        
        .error-text {
          font-size: 0.8rem;
          color: var(--semantic-error);
          font-weight: 500;
          cursor: help;
        }
      }
    }

    /* 🎉 MODERN COMPLETION SUMMARY */
    .completion-summary {
      background: linear-gradient(135deg, 
        rgba(76, 175, 80, 0.08) 0%, 
        rgba(76, 175, 80, 0.03) 100%
      );
      border: 1px solid rgba(76, 175, 80, 0.2);
      border-radius: var(--bmb-radius-s);
      padding: var(--bmb-spacing-m);
      margin-top: 20px !important; /* ✅ REDUCED TOP MARGIN */
      margin-bottom: 40px !important; /* ✅ REDUCED BOTTOM MARGIN */
      
      .success-content {
        display: flex;
        align-items: center;
        gap: var(--bmb-spacing-m);
        margin-bottom: var(--bmb-spacing-m);
        
        .success-icon {
          font-size: 3rem;
          flex-shrink: 0;
        }
        
        .success-info {
          flex: 1;
          
          .success-title {
            font-size: 1.3rem;
            font-weight: 600;
            color: var(--general_contrasts-100);
            margin: 0 0 var(--bmb-spacing-xs) 0;
          }
          
          .success-subtitle {
            font-size: 0.9rem;
            color: var(--general_contrasts-75);
            margin: 0;
            line-height: 1.4;
          }
        }
      }
      
      .completion-actions {
        display: flex;
        gap: var(--bmb-spacing-s);
        justify-content: center;
        margin-top: 15px; /* ✅ REDUCED TOP MARGIN FOR BUTTONS */
        
        .action-btn {
          display: flex;
          align-items: center;
          gap: var(--bmb-spacing-xs);
          padding: 12px 24px; /* ✅ LARGER PADDING FOR BETTER VISIBILITY */
          border: none;
          border-radius: var(--bmb-radius-s);
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 1rem; /* ✅ LARGER FONT SIZE */
          min-height: 48px; /* ✅ MINIMUM HEIGHT FOR TOUCH */
          
          .btn-icon {
            font-size: 1.2rem;
          }
          
          .btn-text {
            line-height: 1;
          }
          
          &.primary {
            background: rgb(var(--color-blue-tec));
            color: white;
            
            &:hover {
              background: rgba(var(--color-blue-tec), 0.9);
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(var(--color-blue-tec), 0.3);
            }
          }
          
          &.secondary {
            background: var(--general_contrasts-25);
            color: var(--general_contrasts-100);
            
            &:hover {
              background: var(--general_contrasts-50);
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
          }
        }
      }
    }

    /* 🔄 ANIMATIONS */
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    /* ✅ BOTTOM SPACER REMOVED TO PREVENT OVERLAP */

    /* 📱 IMPROVED RESPONSIVE DESIGN */
    @media (max-width: 768px) {
      .admin-bulk-container {
        padding: var(--bmb-spacing-s);
        padding-bottom: 120px; /* ✅ MORE SPACE ON MOBILE */
      }
      
      .admin-header .header-top {
        flex-direction: column;
        gap: var(--bmb-spacing-s);
        text-align: center;
        
        .header-content .admin-title {
          font-size: 1.3rem; /* ✅ SMALLER ON MOBILE */
        }
        
        .header-content .admin-subtitle {
          font-size: 0.9rem;
        }
      }
      
      /* ✅ IMPROVED UPLOAD ROW FOR MOBILE */
      .upload-row {
        grid-template-columns: 1fr !important;
        gap: var(--bmb-spacing-m);
        padding: var(--bmb-spacing-m);
        
        .compact-drop-zone {
          min-width: auto;
          justify-content: center;
          padding: var(--bmb-spacing-s);
          
          .drop-info {
            text-align: center;
            
            .drop-title {
          font-size: 0.9rem;
        }
        
            .drop-subtitle {
              font-size: 0.8rem;
            }
          }
        }
        
        /* ✅ BETTER PROCESS CONTROLS LAYOUT */
        .process-controls {
          justify-content: center;
          flex-direction: column;
          gap: var(--bmb-spacing-s);
          
          .files-count {
            text-align: center;
            order: 1;
          }
          
          .premium-process-btn {
            width: 100%; /* ✅ FULL WIDTH ON MOBILE */
            padding: var(--bmb-spacing-m);
            font-size: 1rem;
            justify-content: center;
            order: 2;
          }
          
          .processing-indicator {
            justify-content: center;
            order: 2;
          }
        }
      }
      
      /* ✅ COMPACT PROGRESS SECTION */
      .global-progress-section {
            padding: var(--bmb-spacing-s);
          
        .progress-header .progress-info {
            flex-direction: column;
            align-items: center;
            gap: var(--bmb-spacing-s);
          text-align: center;
          
          .progress-title {
            font-size: 1rem;
          }
          
          .progress-stats {
            flex-direction: column;
            gap: var(--bmb-spacing-xs);
            
            .stat {
              font-size: 0.8rem;
            }
            
            .percentage {
              font-size: 1.1rem;
            }
          }
        }
      }
      
      /* ✅ MOBILE FILE LIST - NO OVERLAPPING COLUMNS */
      .files-list-container {
        padding: var(--bmb-spacing-s);
            margin-bottom: var(--bmb-spacing-m);
            
        .list-header {
          flex-direction: column;
          align-items: stretch;
          gap: var(--bmb-spacing-s);
          
          .header-title {
            justify-content: center;
            
            .title-text {
              font-size: 0.9rem;
            }
          }
          
          .clear-pending-btn {
            width: 100%;
            padding: var(--bmb-spacing-s);
          }
        }
        
        /* ✅ MOBILE FILE ROWS - STACKED LAYOUT */
        .list-content {
          .file-row {
            display: flex !important;
            flex-direction: column !important;
            gap: var(--bmb-spacing-xs);
            padding: var(--bmb-spacing-s);
            border: 1px solid var(--general_contrasts-container-outline);
            border-radius: var(--bmb-radius-s);
            margin-bottom: var(--bmb-spacing-xs);
            
            .row-index {
              display: none; /* ✅ HIDE INDEX ON MOBILE */
            }
            
            .file-info {
              order: 1;
              
              .file-name {
                font-size: 0.85rem;
                font-weight: 600;
                margin-bottom: var(--bmb-spacing-xs);
              }
              
              .patient-info {
                font-size: 0.75rem;
              }
            }
            
            .status-info {
              order: 2;
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: var(--bmb-spacing-xs);
              background: var(--general_contrasts-15);
              border-radius: var(--bmb-radius-s);
              
              .status-indicator .status {
          font-size: 1rem;
              }
              
              .status-text {
                font-size: 0.8rem;
              }
            }
            
            .action-info {
              order: 3;
              display: flex;
              justify-content: center;
              
              .remove-file-btn {
                width: 32px;
                height: 32px;
                font-size: 1rem;
              }
              
              .time-remaining,
              .time-completed,
              .error-text {
                font-size: 0.75rem;
                text-align: center;
              }
            }
          }
        }
      }
      
      /* ✅ MOBILE COMPLETION SUMMARY */
      .completion-summary {
        margin: var(--bmb-spacing-m) 0;
        padding: var(--bmb-spacing-s) !important;
        
        .success-content {
          flex-direction: column;
          text-align: center;
        gap: var(--bmb-spacing-s);
          
          .success-icon {
            font-size: 2rem;
          }
          
          .success-info {
            .success-title {
              font-size: 1.1rem;
            }
            
            .success-subtitle {
              font-size: 0.8rem;
            }
          }
        }
        
        .completion-actions {
        flex-direction: column;
          gap: var(--bmb-spacing-s);
          margin-top: var(--bmb-spacing-s);
          
          .action-btn {
            width: 100%; /* ✅ FULL WIDTH BUTTONS */
            justify-content: center;
            padding: var(--bmb-spacing-m);
            font-size: 0.9rem;
          }
        }
      }
    }
    
    /* 🖥️ TABLET RESPONSIVE IMPROVEMENTS */
    @media (min-width: 769px) and (max-width: 1024px) {
      .upload-row {
        gap: var(--bmb-spacing-m);
        
        .compact-drop-zone {
          min-width: 200px;
        }
        
        .process-controls {
          .premium-process-btn {
            padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
            font-size: 0.9rem;
          }
        }
      }
      
      .file-row {
        .file-info .file-name {
          font-size: 0.85rem;
        }
        
        .status-info,
        .action-info {
          font-size: 0.8rem;
        }
      }
    }

    /* 📱 AGGRESSIVE RESPONSIVE FIXES */
    @media (max-width: 950px) {
      .admin-bulk-container {
        padding: var(--bmb-spacing-s) !important;
        padding-bottom: 80px !important; /* ✅ REDUCED MOBILE BOTTOM PADDING */
      }
      
      /* ✅ FORCE SINGLE COLUMN LAYOUT */
      .upload-row {
        display: flex !important;
        flex-direction: column !important;
        gap: var(--bmb-spacing-m) !important;
        padding: var(--bmb-spacing-m) !important;
        
        .compact-drop-zone {
          min-width: auto !important;
          width: 100% !important;
          justify-content: center !important;
          margin-bottom: var(--bmb-spacing-s) !important;
        }
        
        .process-controls {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          gap: var(--bmb-spacing-s) !important;
          width: 100% !important;
          
          .files-count {
            text-align: center !important;
            margin-bottom: var(--bmb-spacing-xs) !important;
          }
          
          .premium-process-btn {
            width: 100% !important;
            max-width: 300px !important;
            padding: var(--bmb-spacing-m) var(--bmb-spacing-l) !important;
            font-size: 1rem !important;
            justify-content: center !important;
          }
          
          .processing-indicator {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
          }
        }
      }
      
      /* ✅ FORCE MOBILE FILE LIST LAYOUT */
      .files-list-container {
        margin-bottom: var(--bmb-spacing-m) !important;
        padding: var(--bmb-spacing-s) !important;
        
        .list-header {
          display: flex !important;
          flex-direction: column !important;
          gap: var(--bmb-spacing-s) !important;
          
          .header-title {
            justify-content: center !important;
            text-align: center !important;
          }
          
          .clear-pending-btn {
            width: 100% !important;
            max-width: 200px !important;
            align-self: center !important;
          }
        }
        
        .list-content {
          .file-row {
            display: block !important;
            width: 100% !important;
            padding: var(--bmb-spacing-s) !important;
            margin-bottom: var(--bmb-spacing-s) !important;
            border: 1px solid var(--general_contrasts-container-outline) !important;
            border-radius: var(--bmb-radius-s) !important;
            background: var(--general_contrasts-input-background) !important;
            
            .row-index {
              display: none !important;
            }
            
            .file-info {
              display: block !important;
              width: 100% !important;
              margin-bottom: var(--bmb-spacing-s) !important;
              
              .file-name {
                display: block !important;
                font-size: 0.9rem !important;
                font-weight: 600 !important;
                margin-bottom: var(--bmb-spacing-xs) !important;
                word-break: break-word !important;
              }
              
              .patient-info {
                display: block !important;
                font-size: 0.8rem !important;
                color: var(--general_contrasts-75) !important;
              }
            }
            
            .status-info {
              display: flex !important;
              justify-content: space-between !important;
              align-items: center !important;
              width: 100% !important;
              padding: var(--bmb-spacing-xs) !important;
              background: var(--general_contrasts-25) !important;
              border-radius: var(--bmb-radius-s) !important;
              margin-bottom: var(--bmb-spacing-xs) !important;
              
              .status-indicator {
                flex-shrink: 0 !important;
              }
              
              .status-text {
                flex: 1 !important;
                text-align: right !important;
                font-size: 0.8rem !important;
              }
            }
            
            .action-info {
              display: flex !important;
              justify-content: center !important;
              width: 100% !important;
              
              .remove-file-btn,
              .time-remaining,
              .time-completed,
              .error-text {
                font-size: 0.8rem !important;
              }
            }
          }
        }
      }
      
      /* ✅ FORCE MOBILE COMPLETION LAYOUT */
      .completion-summary {
        padding: var(--bmb-spacing-m) !important;
        margin: var(--bmb-spacing-m) 0 !important;
        
        .success-content {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          text-align: center !important;
          gap: var(--bmb-spacing-s) !important;
          
          .success-icon {
            font-size: 2.5rem !important;
          }
          
          .success-info {
            width: 100% !important;
            
            .success-title {
              font-size: 1.2rem !important;
              margin-bottom: var(--bmb-spacing-xs) !important;
            }
            
            .success-subtitle {
              font-size: 0.9rem !important;
            }
          }
        }
        
        .completion-actions {
          display: flex !important;
          flex-direction: column !important;
          gap: var(--bmb-spacing-s) !important;
          margin-top: var(--bmb-spacing-m) !important;
          
          .action-btn {
            width: 100% !important;
            padding: var(--bmb-spacing-m) !important;
            font-size: 1rem !important;
            justify-content: center !important;
            min-height: 48px !important;
          }
        }
      }
      
      /* ✅ FORCE PROGRESS SECTION MOBILE */
      .global-progress-section {
        padding: var(--bmb-spacing-s) !important;
        margin-bottom: var(--bmb-spacing-m) !important;
        
        .progress-header .progress-info {
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          text-align: center !important;
          gap: var(--bmb-spacing-s) !important;
          
          .progress-title {
            font-size: 1rem !important;
          }
          
          .progress-stats {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: var(--bmb-spacing-xs) !important;
            
            .stat {
              font-size: 0.85rem !important;
            }
            
            .percentage {
              font-size: 1.3rem !important;
              font-weight: 700 !important;
            }
          }
        }
      }
    }

    /* 🖥️ MEDIUM SCREEN FIXES */
    @media (max-width: 1200px) and (min-width: 951px) {
      .upload-row {
        gap: var(--bmb-spacing-s) !important;
        
        .compact-drop-zone {
          min-width: 250px !important;
          flex: 1 !important;
        }
        
        .process-controls {
          flex-shrink: 0 !important;
          min-width: 200px !important;
          
          .premium-process-btn {
            font-size: 0.85rem !important;
            padding: var(--bmb-spacing-s) var(--bmb-spacing-m) !important;
          }
        }
      }
      
      .file-row {
        .file-info {
          .file-name {
            font-size: 0.85rem !important;
          }
          
          .patient-info {
            font-size: 0.75rem !important;
          }
        }
      }
    }
  `]
})
export class AdminBulkUploadComponent implements OnInit {
  private apiService = inject(ApiService);
  private router = inject(Router);
  private location = inject(Location);
  
  batchFiles: BatchFile[] = [];
  batchUpload: BatchUpload | null = null;
  
  isDragOver = false;
  isProcessing = false;

  ngOnInit(): void {
    console.log('🔧 Admin Bulk Upload Component initialized - MVP Mode');
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