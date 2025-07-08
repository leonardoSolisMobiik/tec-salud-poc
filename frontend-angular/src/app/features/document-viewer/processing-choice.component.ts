import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProcessingTypeSelectorComponent } from '../../shared/components/processing-type-selector/processing-type-selector.component';
import { ProcessingTypeService } from '../../shared/services/processing-type.service';

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
  @Input() fileCount: number = 0;
  @Input() initialType: string = 'both';
  @Output() processingTypeChange = new EventEmitter<string>();

  selectedProcessingType: string = '';

  constructor(private processingTypeService: ProcessingTypeService) {}

  ngOnInit(): void {
    // Initialize with the provided initial type or service default
    this.selectedProcessingType = this.initialType || this.processingTypeService.getRecommendedType();
    
    // Emit initial type
    this.processingTypeChange.emit(this.selectedProcessingType);
  }

  onProcessingTypeChange(type: string): void {
    this.selectedProcessingType = type;
    this.processingTypeService.setSelectedType(type);
    this.processingTypeChange.emit(type);
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
} 