import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProcessingTypeSelectorComponent } from '../../shared/components/processing-type-selector/processing-type-selector.component';
import { ProcessingTypeService } from '../../shared/services/processing-type.service';

/**
 * Processing choice component for document processing type selection
 * 
 * @description Provides a user interface for selecting document processing methods
 * with real-time capability information and file count display. Integrates with
 * the ProcessingTypeService to manage processing options and user preferences.
 * 
 * @example
 * ```typescript
 * // In parent component template
 * <app-processing-choice
 *   [fileCount]="selectedFiles.length"
 *   [initialType]="'complete'"
 *   (processingTypeChange)="onProcessingTypeSelected($event)">
 * </app-processing-choice>
 * 
 * // In parent component
 * onProcessingTypeSelected(type: string) {
 *   console.log('Processing type selected:', type);
 *   this.processingType = type;
 * }
 * ```
 * 
 * @features
 * - Visual processing type selector with descriptions
 * - Real-time capability display based on selection
 * - File count indicator
 * - Semantic search and complete storage status indicators
 * - Responsive design with medical styling
 * 
 * @inputs
 * - fileCount: number - Number of files selected for processing
 * - initialType: string - Initial processing type to select
 * 
 * @outputs
 * - processingTypeChange: EventEmitter<string> - Emitted when processing type changes
 * 
 * @since 1.0.0
 */
@Component({
  selector: 'app-processing-choice',
  standalone: true,
  imports: [CommonModule, ProcessingTypeSelectorComponent],
  template: `
    <div class="processing-choice-wrapper">
      <app-processing-type-selector
        [selectedType]="selectedProcessingType"
        (typeChange)="onProcessingTypeChange($event)">
      </app-processing-type-selector>
      
      <!-- Quick Info Panel -->
      <div class="quick-info" *ngIf="selectedProcessingType">
        <div class="info-row">
          <span class="info-label">Capacidades:</span>
          <span class="info-value">{{ getProcessingCapabilities() }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Archivos seleccionados:</span>
          <span class="info-value">{{ fileCount }} documentos</span>
        </div>
        <div class="info-row" *ngIf="isVectorizationEnabled()">
          <span class="info-label">Búsqueda semántica:</span>
          <span class="info-value enabled">✅ Habilitada</span>
        </div>
        <div class="info-row" *ngIf="isCompleteStorageEnabled()">
          <span class="info-label">Almacenamiento completo:</span>
          <span class="info-value enabled">✅ Habilitado</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .processing-choice-wrapper {
      margin-bottom: var(--bmb-spacing-l);
    }

    .quick-info {
      background: linear-gradient(135deg, 
        rgba(var(--color-blue-tec), 0.08) 0%, 
        rgba(var(--color-blue-tec), 0.03) 100%
      );
      border: 1px solid rgba(var(--color-blue-tec), 0.2);
      border-radius: var(--bmb-radius-s);
      padding: var(--bmb-spacing-m);
      margin-top: var(--bmb-spacing-m);
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--bmb-spacing-xs);
      
      &:last-child {
        margin-bottom: 0;
      }
    }

    .info-label {
      color: var(--general_contrasts-75);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .info-value {
      color: var(--general_contrasts-100);
      font-size: 0.875rem;
      font-weight: 600;
      
      &.enabled {
        color: var(--semantic-success);
      }
    }

    @media (max-width: 768px) {
      .info-row {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--bmb-spacing-xs);
      }
    }
  `]
})
export class ProcessingChoiceComponent implements OnInit {
  /** Number of files selected for processing */
  @Input() fileCount: number = 0;
  
  /** Initial processing type to select on component load */
  @Input() initialType: string = 'both';
  
  /** Event emitted when processing type selection changes */
  @Output() processingTypeChange = new EventEmitter<string>();

  /** Currently selected processing type */
  selectedProcessingType: string = '';

  /**
   * Creates an instance of ProcessingChoiceComponent
   * 
   * @param processingTypeService - Service for managing processing type logic
   */
  constructor(private processingTypeService: ProcessingTypeService) {}

  /**
   * Component initialization lifecycle method
   * 
   * @description Sets the initial processing type, updates the service state,
   * and emits the initial selection to the parent component.
   */
  ngOnInit(): void {
    // Initialize with the provided initial type or service default
    this.selectedProcessingType = this.initialType || this.processingTypeService.getRecommendedType();
    
    // Emit initial type
    this.processingTypeChange.emit(this.selectedProcessingType);
  }

  /**
   * Handles processing type selection changes
   * 
   * @param type - The newly selected processing type
   * 
   * @description Updates the component state, service state, and notifies
   * the parent component of the processing type change.
   */
  onProcessingTypeChange(type: string): void {
    this.selectedProcessingType = type;
    this.processingTypeService.setSelectedType(type);
    this.processingTypeChange.emit(type);
  }

  /**
   * Gets the description text for the current processing type
   * 
   * @returns Description string explaining the processing capabilities
   * 
   * @description Retrieves the human-readable description of the selected
   * processing type from the ProcessingTypeService for display to users.
   */
  getProcessingCapabilities(): string {
    return this.processingTypeService.getProcessingCapabilities(this.selectedProcessingType);
  }

  /**
   * Checks if semantic search is enabled for the current processing type
   * 
   * @returns True if semantic search capabilities are enabled
   * 
   * @description Determines whether the selected processing type includes
   * semantic search functionality for document analysis.
   */
  isVectorizationEnabled(): boolean {
    return this.processingTypeService.isVectorizationEnabled(this.selectedProcessingType);
  }

  /**
   * Checks if complete document storage is enabled for the current processing type
   * 
   * @returns True if complete storage capabilities are enabled
   * 
   * @description Determines whether the selected processing type includes
   * full document storage for comprehensive document management.
   */
  isCompleteStorageEnabled(): boolean {
    return this.processingTypeService.isCompleteStorageEnabled(this.selectedProcessingType);
  }
} 