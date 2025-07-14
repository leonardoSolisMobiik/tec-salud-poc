import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

import { BambooModule } from '../../shared/bamboo.module';
import { ProcessingChoiceComponent } from './processing-choice.component';
import { ProcessingTypeService } from '../../shared/services/processing-type.service';

/**
 * Demo component for showcasing document processing type capabilities
 * 
 * @description Interactive demonstration of different document processing methods
 * including file simulation, processing type selection, and result visualization.
 * Helps users understand the differences between processing options.
 * 
 * @example
 * ```typescript
 * // Access via route
 * // URL: /processing-demo
 * ```
 * 
 * @features
 * - Interactive file simulation with various medical document types
 * - Real-time processing type comparison
 * - Visual progress simulation for processing workflows
 * - Estimated chunk count and storage size calculations
 * - Processing time simulation with realistic delays
 * - Responsive design with medical styling
 * 
 * @uiComponents
 * - File simulation controls (add/remove/clear)
 * - Processing type selector integration
 * - Progress indicators and result displays
 * - Professional medical interface styling
 * 
 * @since 1.0.0
 */
@Component({
  selector: 'app-processing-choice-demo',
  standalone: true,
  imports: [CommonModule, FormsModule, BambooModule, ProcessingChoiceComponent],
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
            <h1 class="main-title">⚡ Demostración de Tipos de Procesamiento</h1>
            <div class="main-subtitle">
              Explora las diferentes opciones de procesamiento para documentos médicos
            </div>
          </div>
        </div>
      </div>

      <!-- Demo Section -->
      <div class="demo-section">
        
        <!-- File Simulation -->
        <div class="file-simulation">
          <h2>📁 Simulación de Archivos</h2>
          <div class="file-controls">
            <button 
              class="add-file-btn"
              (click)="addSimulatedFile()"
              [disabled]="simulatedFiles.length >= 10">
              ➕ Agregar Archivo Simulado
            </button>
            <button 
              class="clear-files-btn"
              (click)="clearSimulatedFiles()"
              [disabled]="simulatedFiles.length === 0">
              🗑️ Limpiar Todo
            </button>
          </div>
          
          <div class="simulated-files" *ngIf="simulatedFiles.length > 0">
            <div 
              *ngFor="let file of simulatedFiles; trackBy: trackByFile"
              class="simulated-file">
              <span class="file-icon">{{ file.icon }}</span>
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ file.size }}</span>
              <button 
                class="remove-file"
                (click)="removeSimulatedFile(file.id)"
                title="Eliminar">
                ❌
              </button>
            </div>
          </div>
        </div>

        <!-- Processing Choice Integration -->
        <div class="processing-choice-section">
          <h2>⚙️ Selección de Tipo de Procesamiento</h2>
          
          <app-processing-choice
            [fileCount]="simulatedFiles.length"
            [initialType]="selectedProcessingType"
            (processingTypeChange)="onProcessingTypeChange($event)">
          </app-processing-choice>
        </div>

        <!-- Live Results -->
        <div class="results-section" *ngIf="selectedProcessingType">
          <h2>📊 Vista Previa de Resultados</h2>
          
          <div class="result-cards">
            
            <!-- Processing Summary -->
            <div class="result-card summary">
              <h3>📋 Resumen de Procesamiento</h3>
              <div class="summary-details">
                <div class="detail-item">
                  <span class="detail-label">Tipo seleccionado:</span>
                  <span class="detail-value">
                    {{ getProcessingTypeIcon() }} {{ getProcessingTypeLabel() }}
                  </span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Archivos a procesar:</span>
                  <span class="detail-value">{{ simulatedFiles.length }} documentos</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Capacidades:</span>
                  <span class="detail-value">{{ getProcessingCapabilities() }}</span>
                </div>
              </div>
            </div>

            <!-- Vectorization Results -->
            <div class="result-card vectorization" *ngIf="isVectorizationEnabled()">
              <h3>🔍 Búsqueda Semántica</h3>
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-icon">⚡</span>
                  <span class="feature-text">Búsquedas ultrarrápidas (< 100ms)</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🧠</span>
                  <span class="feature-text">Análisis conceptual automático</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">🔗</span>
                  <span class="feature-text">Relaciones entre documentos</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">📊</span>
                  <span class="feature-text">~{{ getEstimatedChunks() }} chunks estimados</span>
                </div>
              </div>
            </div>

            <!-- Complete Storage Results -->
            <div class="result-card storage" *ngIf="isCompleteStorageEnabled()">
              <h3>📄 Almacenamiento Completo</h3>
              <div class="feature-list">
                <div class="feature-item">
                  <span class="feature-icon">💾</span>
                  <span class="feature-text">Documentos completos preservados</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">👁️</span>
                  <span class="feature-text">Visualización directa</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">📖</span>
                  <span class="feature-text">Referencias exactas</span>
                </div>
                <div class="feature-item">
                  <span class="feature-icon">📁</span>
                  <span class="feature-text">~{{ getEstimatedStorageSize() }} de almacenamiento</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        <!-- Action Simulation -->
        <div class="action-section" *ngIf="simulatedFiles.length > 0 && selectedProcessingType">
          <h2>🚀 Simulación de Procesamiento</h2>
          
          <button 
            class="simulate-btn"
            [class.processing]="isSimulating"
            [disabled]="isSimulating"
            (click)="simulateProcessing()">
            <span *ngIf="!isSimulating">🚀 Simular Procesamiento</span>
            <span *ngIf="isSimulating">⏳ Procesando... {{ simulationProgress }}%</span>
          </button>

          <div class="simulation-results" *ngIf="simulationComplete">
            <div class="success-message">
              ✅ ¡Simulación completada exitosamente!
            </div>
            <div class="simulation-stats">
              <div class="stat-item">
                <span class="stat-label">Archivos procesados:</span>
                <span class="stat-value">{{ simulatedFiles.length }}</span>
              </div>
              <div class="stat-item" *ngIf="isVectorizationEnabled()">
                <span class="stat-label">Chunks creados:</span>
                <span class="stat-value">{{ getEstimatedChunks() }}</span>
              </div>
              <div class="stat-item" *ngIf="isCompleteStorageEnabled()">
                <span class="stat-label">Documentos almacenados:</span>
                <span class="stat-value">{{ simulatedFiles.length }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Tiempo simulado:</span>
                <span class="stat-value">{{ getSimulatedProcessingTime() }}s</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .demo-container {
      min-height: 100vh;
      background: linear-gradient(135deg, 
        var(--general_contrasts-15) 0%, 
        var(--general_contrasts-5) 100%
      );
      padding: var(--bmb-spacing-l);
    }

    .demo-header {
      text-align: center;
      margin-bottom: var(--bmb-spacing-xl);
      position: relative;
      
      .back-button {
        position: absolute;
        top: 0;
        left: 0;
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
      
      .demo-title {
        font-size: 2rem;
        font-weight: 600;
        color: var(--general_contrasts-100);
        margin: 0 0 var(--bmb-spacing-s) 0;
      }
      
      .demo-subtitle {
        color: var(--general_contrasts-75);
        font-size: 1.1rem;
        margin: 0;
      }
    }

    .demo-section {
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: var(--bmb-spacing-xl);
    }

    .file-simulation,
    .processing-choice-section,
    .results-section,
    .action-section {
      background: var(--general_contrasts-15);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-l);
      
      h2 {
        color: var(--general_contrasts-100);
        font-size: 1.3rem;
        font-weight: 600;
        margin: 0 0 var(--bmb-spacing-m) 0;
      }
    }

    .file-controls {
      display: flex;
      gap: var(--bmb-spacing-m);
      margin-bottom: var(--bmb-spacing-m);
      
      button {
        background: var(--buttons-primary-normal);
        color: white;
        border: none;
        border-radius: var(--bmb-radius-s);
        padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover:not(:disabled) {
          background: var(--buttons-primary-hover);
          transform: translateY(-2px);
        }
        
        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        &.clear-files-btn {
          background: var(--semantic-error);
          
          &:hover:not(:disabled) {
            background: darkred;
          }
        }
      }
    }

    .simulated-files {
      display: flex;
      flex-direction: column;
      gap: var(--bmb-spacing-s);
      
      .simulated-file {
        display: flex;
        align-items: center;
        gap: var(--bmb-spacing-m);
        padding: var(--bmb-spacing-s);
        background: var(--general_contrasts-5);
        border: 1px solid var(--general_contrasts-container-outline);
        border-radius: var(--bmb-radius-s);
        
        .file-icon {
          font-size: 1.2rem;
        }
        
        .file-name {
          flex: 1;
          color: var(--general_contrasts-100);
          font-weight: 500;
        }
        
        .file-size {
          color: var(--general_contrasts-75);
          font-size: 0.875rem;
        }
        
        .remove-file {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 0.8rem;
          padding: 2px;
          border-radius: var(--bmb-radius-s);
          transition: background 0.2s ease;
          
          &:hover {
            background: rgba(244, 67, 54, 0.1);
          }
        }
      }
    }

    .result-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: var(--bmb-spacing-m);
    }

    .result-card {
      background: var(--general_contrasts-5);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-m);
      
      h3 {
        color: var(--general_contrasts-100);
        font-size: 1.1rem;
        font-weight: 600;
        margin: 0 0 var(--bmb-spacing-m) 0;
      }
      
      &.summary {
        border-color: rgba(var(--color-blue-tec), 0.5);
        background: rgba(var(--color-blue-tec), 0.05);
      }
      
      &.vectorization {
        border-color: var(--semantic-success);
        background: rgba(76, 175, 80, 0.05);
      }
      
      &.storage {
        border-color: #FF9800;
        background: rgba(255, 152, 0, 0.05);
      }
    }

    .summary-details {
      display: flex;
      flex-direction: column;
      gap: var(--bmb-spacing-s);
      
      .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .detail-label {
          color: var(--general_contrasts-75);
          font-size: 0.875rem;
        }
        
        .detail-value {
          color: var(--general_contrasts-100);
          font-weight: 600;
          font-size: 0.875rem;
        }
      }
    }

    .feature-list {
      display: flex;
      flex-direction: column;
      gap: var(--bmb-spacing-s);
      
      .feature-item {
        display: flex;
        align-items: center;
        gap: var(--bmb-spacing-s);
        
        .feature-icon {
          font-size: 1rem;
        }
        
        .feature-text {
          color: var(--general_contrasts-75);
          font-size: 0.875rem;
          line-height: 1.4;
        }
      }
    }

    .simulate-btn {
      width: 100%;
      background: linear-gradient(135deg, 
        var(--semantic-success) 0%, 
        #45a049 100%
      );
      color: white;
      border: none;
      border-radius: var(--bmb-radius-s);
      padding: var(--bmb-spacing-m) var(--bmb-spacing-l);
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(76, 175, 80, 0.4);
      }
      
      &:disabled {
        opacity: 0.8;
        cursor: not-allowed;
      }
      
      &.processing {
        background: linear-gradient(135deg, 
          rgb(var(--color-blue-tec)) 0%, 
          var(--buttons-primary-hover) 100%
        );
      }
    }

    .simulation-results {
      margin-top: var(--bmb-spacing-m);
      padding: var(--bmb-spacing-m);
      background: rgba(76, 175, 80, 0.1);
      border: 1px solid var(--semantic-success);
      border-radius: var(--bmb-radius-s);
      
      .success-message {
        color: var(--semantic-success);
        font-weight: 600;
        margin-bottom: var(--bmb-spacing-m);
        text-align: center;
      }
      
      .simulation-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--bmb-spacing-s);
        
        .stat-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .stat-label {
            color: var(--general_contrasts-75);
            font-size: 0.875rem;
          }
          
          .stat-value {
            color: var(--general_contrasts-100);
            font-weight: 600;
            font-size: 0.875rem;
          }
        }
      }
    }

    /* ✅ RESPONSIVE LAYOUT FOR SMALL SCREENS */
    @media (max-width: 950px) {
      .demo-container {
        padding: var(--bmb-spacing-s) !important;
        padding-bottom: calc(var(--bmb-spacing-xxl) + var(--bmb-spacing-l)) !important;
        max-height: 100vh !important;
        overflow-y: auto !important;
      }
      
      /* ✅ FORCE MOBILE HEADER LAYOUT */
      .demo-header {
        margin-bottom: var(--bmb-spacing-m) !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: center !important;
        gap: var(--bmb-spacing-s) !important;
        text-align: center !important;
        
        .back-button {
          margin-right: 0 !important;
          margin-bottom: var(--bmb-spacing-s) !important;
          order: 1 !important;
          background: var(--general_contrasts-15) !important;
          border: 1px solid var(--general_contrasts-container-outline) !important;
          border-radius: var(--bmb-radius-s) !important;
          padding: var(--bmb-spacing-s) var(--bmb-spacing-m) !important;
          color: var(--general_contrasts-100) !important;
          cursor: pointer !important;
          transition: all 0.3s ease !important;
          text-decoration: none !important;
          display: flex !important;
          align-items: center !important;
          gap: var(--bmb-spacing-xs) !important;
          border: none !important;
          
          &:hover {
            background: var(--general_contrasts-25) !important;
            transform: translateX(-4px) !important;
          }
        }
        
        .demo-title {
          order: 2 !important;
          font-size: 1.3rem !important;
          margin: 0 !important;
        }
        
        .demo-subtitle {
          order: 3 !important;
          font-size: 0.9rem !important;
          margin: 0 !important;
        }
      }
    }

    @media (max-width: 768px) {
      .demo-container {
        padding: var(--bmb-spacing-m);
      }
      
      .demo-header .demo-title {
        font-size: 1.5rem;
      }
      
      .file-controls {
        flex-direction: column;
      }
      
      .result-cards {
        grid-template-columns: 1fr;
      }
      
      .summary-details .detail-item,
      .simulation-stats .stat-item {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--bmb-spacing-xs);
      }
    }
  `]
})
export class ProcessingChoiceDemoComponent implements OnInit {
  /** Array of simulated files for demonstration purposes */
  simulatedFiles: any[] = [];
  
  /** Currently selected processing type for simulation */
  selectedProcessingType = 'both';
  
  /** Flag indicating if processing simulation is running */
  isSimulating = false;
  
  /** Current progress of processing simulation (0-100) */
  simulationProgress = 0;
  
  /** Flag indicating if processing simulation has completed */
  simulationComplete = false;

  /** Available file types for simulation with medical document examples */
  private fileTypes = [
    { icon: '📄', extension: 'pdf', type: 'Expediente Médico' },
    { icon: '🧪', extension: 'pdf', type: 'Laboratorios' },
    { icon: '🩻', extension: 'pdf', type: 'Radiología' },
    { icon: '👩‍⚕️', extension: 'docx', type: 'Consulta' },
    { icon: '🏥', extension: 'pdf', type: 'Cirugía' },
    { icon: '💊', extension: 'txt', type: 'Farmacia' }
  ];

  /**
   * Creates an instance of ProcessingChoiceDemoComponent
   * 
   * @param router - Angular router for navigation
   * @param location - Location service for browser back navigation
   * @param processingTypeService - Service for processing type logic
   */
  constructor(
    private router: Router,
    private location: Location,
    private processingTypeService: ProcessingTypeService
  ) {}

  /**
   * Component initialization lifecycle method
   * 
   * @description Initializes the demo with 3 sample simulated files
   * to provide an immediate demonstration of processing capabilities.
   */
  ngOnInit(): void {
    // Add some initial simulated files
    this.addSimulatedFile();
    this.addSimulatedFile();
    this.addSimulatedFile();
  }

  /**
   * Adds a new simulated file to the demonstration
   * 
   * @description Creates a simulated medical document file with random
   * properties including file type, size, and name for demonstration purposes.
   * Limited to maximum of 10 files for performance reasons.
   */
  addSimulatedFile(): void {
    if (this.simulatedFiles.length >= 10) return;

    const fileType = this.fileTypes[Math.floor(Math.random() * this.fileTypes.length)];
    const patientNames = [
      'GARCIA_LOPEZ_MARIA_ELENA',
      'RODRIGUEZ_MARTINEZ_CARLOS_EDUARDO',
      'HERNANDEZ_GONZALEZ_ANA_SOFIA',
      'LOPEZ_FERNANDEZ_JOSE_ANTONIO',
      'MARTINEZ_RAMIREZ_LUCIA_FERNANDA'
    ];
    
    const patientName = patientNames[Math.floor(Math.random() * patientNames.length)];
    const expediente = '30000' + Math.floor(Math.random() * 99999).toString().padStart(5, '0');
    const docNumber = '600' + Math.floor(Math.random() * 9999999).toString().padStart(7, '0');
    
    const file = {
      id: Date.now() + Math.random(),
      icon: fileType.icon,
      name: `${expediente}_${patientName}_${docNumber}_${fileType.type.substring(0, 4).toUpperCase()}.${fileType.extension}`,
      size: this.getRandomFileSize(),
      type: fileType.type
    };

    this.simulatedFiles.push(file);
  }

  /**
   * Removes a simulated file from the demonstration
   * 
   * @param id - Unique identifier of the file to remove
   * 
   * @description Filters out the specified file from the simulated files array
   * and resets simulation completion status for fresh demonstrations.
   */
  removeSimulatedFile(id: number): void {
    this.simulatedFiles = this.simulatedFiles.filter(f => f.id !== id);
    this.simulationComplete = false;
  }

  /**
   * Clears all simulated files from the demonstration
   * 
   * @description Resets the simulated files array to empty state and clears
   * simulation completion status for starting fresh demonstrations.
   */
  clearSimulatedFiles(): void {
    this.simulatedFiles = [];
    this.simulationComplete = false;
  }

  /**
   * Handles processing type selection changes
   * 
   * @param type - The newly selected processing type
   * 
   * @description Updates the component's selected processing type and resets
   * simulation completion to reflect new processing capabilities.
   */
  onProcessingTypeChange(type: string): void {
    this.selectedProcessingType = type;
    this.simulationComplete = false;
  }

  /**
   * Simulates the document processing workflow
   * 
   * @description Runs a realistic simulation of document processing with
   * progress updates over 5 seconds to demonstrate processing flow to users.
   */
  async simulateProcessing(): Promise<void> {
    this.isSimulating = true;
    this.simulationProgress = 0;
    this.simulationComplete = false;

    // Simulate processing with progress
    const totalSteps = 100;
    const stepTime = 50; // 50ms per step = 5 second total

    for (let i = 0; i <= totalSteps; i++) {
      this.simulationProgress = i;
      await new Promise(resolve => setTimeout(resolve, stepTime));
    }

    this.isSimulating = false;
    this.simulationComplete = true;
  }

  getRandomFileSize(): string {
    const sizes = ['1.2 MB', '850 KB', '2.1 MB', '654 KB', '1.8 MB', '920 KB', '1.5 MB'];
    return sizes[Math.floor(Math.random() * sizes.length)];
  }

  getProcessingTypeLabel(): string {
    return this.processingTypeService.getProcessingTypeLabel(this.selectedProcessingType);
  }

  getProcessingTypeIcon(): string {
    return this.processingTypeService.getProcessingTypeIcon(this.selectedProcessingType);
  }

  getProcessingCapabilities(): string {
    return this.processingTypeService.getProcessingCapabilities(this.selectedProcessingType);
  }

  isVectorizationEnabled(): boolean {
    return this.processingTypeService.isVectorizationEnabled(this.selectedProcessingType);
  }

  isCompleteStorageEnabled(): boolean {
    return this.processingTypeService.isCompleteStorageEnabled(this.selectedProcessingType);
  }

  getEstimatedChunks(): number {
    return this.simulatedFiles.length * Math.floor(Math.random() * 10 + 5); // 5-15 chunks per file
  }

  getEstimatedStorageSize(): string {
    const totalMB = this.simulatedFiles.length * (Math.random() * 2 + 0.5); // 0.5-2.5 MB per file
    return totalMB > 1000 ? `${(totalMB / 1000).toFixed(1)} GB` : `${totalMB.toFixed(1)} MB`;
  }

  getSimulatedProcessingTime(): number {
    const baseTime = this.simulatedFiles.length * 0.5; // 0.5s per file base
    const processingMultiplier = this.selectedProcessingType === 'both' ? 1.5 : 
                                this.selectedProcessingType === 'vectorized' ? 1.2 : 1.0;
    return Math.round(baseTime * processingMultiplier * 10) / 10; // Round to 1 decimal
  }

  trackByFile(index: number, file: any): any {
    return file.id;
  }

  goBack(): void {
    this.location.back();
  }
} 