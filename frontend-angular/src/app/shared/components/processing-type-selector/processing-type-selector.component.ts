import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface ProcessingOption {
  value: string;
  label: string;
  description: string;
  icon: string;
  benefits: string[];
  recommended?: boolean;
  useCase: string;
}

@Component({
  selector: 'app-processing-type-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="processing-type-selector">
      <label class="selector-label">⚙️ Tipo de Procesamiento</label>
      <p class="selector-description">
        Selecciona cómo quieres procesar tus documentos médicos
      </p>
      
      <div class="processing-options">
        <div 
          *ngFor="let option of processingOptions"
          class="processing-option"
          [class.selected]="selectedType === option.value"
          [class.recommended]="option.recommended"
          (click)="selectOption(option.value)">
          
          <div class="option-header">
            <div class="option-icon">{{ option.icon }}</div>
            <div class="option-content">
              <h4 class="option-title">
                {{ option.label }}
                <span *ngIf="option.recommended" class="recommended-badge">Recomendado</span>
              </h4>
              <p class="option-description">{{ option.description }}</p>
              <p class="option-use-case">{{ option.useCase }}</p>
            </div>
            <div class="option-selector">
              <div class="radio-button" [class.active]="selectedType === option.value">
                <div class="radio-inner"></div>
              </div>
            </div>
          </div>
          
          <div class="option-benefits" *ngIf="selectedType === option.value">
            <h5>✨ Características:</h5>
            <ul>
              <li *ngFor="let benefit of option.benefits">{{ benefit }}</li>
            </ul>
          </div>
        </div>
      </div>
      
      <!-- Processing Info Panel -->
      <div class="processing-info" *ngIf="selectedType">
        <div class="info-card">
          <h3>📋 Configuración Seleccionada</h3>
          <div class="info-content">
            <div class="info-item">
              <span class="info-icon">{{ getSelectedOption()?.icon }}</span>
              <div class="info-details">
                <div class="info-title">{{ getSelectedOption()?.label }}</div>
                <div class="info-subtitle">{{ getSelectedOption()?.useCase }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .processing-type-selector {
      margin-bottom: var(--bmb-spacing-l);
    }

    .selector-label {
      display: block;
      font-weight: 600;
      color: var(--general_contrasts-100);
      margin-bottom: var(--bmb-spacing-xs);
      font-size: 1rem;
    }

    .selector-description {
      color: var(--general_contrasts-75);
      font-size: 0.875rem;
      margin: 0 0 var(--bmb-spacing-m) 0;
      line-height: 1.4;
    }

    .processing-options {
      display: flex;
      flex-direction: column;
      gap: var(--bmb-spacing-s);
      margin-bottom: var(--bmb-spacing-l);
    }

    .processing-option {
      border: 2px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-m);
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      background: var(--general_contrasts-5);
      
      &:hover {
        border-color: rgba(var(--color-blue-tec), 0.7);
        background: rgba(var(--color-blue-tec), 0.05);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(var(--color-blue-tec), 0.15);
      }
      
      &.selected {
        border-color: rgb(var(--color-blue-tec));
        background: rgba(var(--color-blue-tec), 0.1);
        box-shadow: 0 4px 16px rgba(var(--color-blue-tec), 0.25);
        transform: translateY(-1px);
      }
      
      &.recommended {
        border-color: var(--semantic-success);
        background: rgba(76, 175, 80, 0.05);
        
        &:hover {
          border-color: var(--semantic-success);
          background: rgba(76, 175, 80, 0.1);
        }
        
        &.selected {
          border-color: var(--semantic-success);
          background: rgba(76, 175, 80, 0.15);
          box-shadow: 0 4px 16px rgba(76, 175, 80, 0.3);
        }
      }
    }

    .option-header {
      display: flex;
      align-items: flex-start;
      gap: var(--bmb-spacing-m);
      
      .option-icon {
        font-size: 2rem;
        filter: grayscale(0.3);
        flex-shrink: 0;
      }
      
      .option-content {
        flex: 1;
        
        .option-title {
          margin: 0 0 var(--bmb-spacing-xs) 0;
          color: var(--general_contrasts-100);
          font-size: 1.1rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: var(--bmb-spacing-s);
          
          .recommended-badge {
            background: var(--semantic-success);
            color: white;
            font-size: 0.7rem;
            padding: 2px var(--bmb-spacing-xs);
            border-radius: var(--bmb-radius-full);
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
        }
        
        .option-description {
          margin: 0 0 var(--bmb-spacing-xs) 0;
          color: var(--general_contrasts-75);
          font-size: 0.875rem;
          line-height: 1.4;
        }
        
        .option-use-case {
          margin: 0;
          color: var(--general_contrasts-60);
          font-size: 0.8rem;
          font-style: italic;
          line-height: 1.3;
        }
      }
      
      .option-selector {
        flex-shrink: 0;
        margin-top: 2px;
        
        .radio-button {
          width: 20px;
          height: 20px;
          border: 2px solid var(--general_contrasts-container-outline);
          border-radius: 50%;
          background: var(--general_contrasts-15);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          
          &.active {
            border-color: rgb(var(--color-blue-tec));
            background: rgb(var(--color-blue-tec));
            
            .radio-inner {
              width: 8px;
              height: 8px;
              background: white;
              border-radius: 50%;
            }
          }
        }
      }
    }

    .option-benefits {
      margin-top: var(--bmb-spacing-m);
      padding-top: var(--bmb-spacing-m);
      border-top: 1px solid var(--general_contrasts-container-outline);
      animation: expandBenefits 0.3s ease-out;
      
      h5 {
        margin: 0 0 var(--bmb-spacing-s) 0;
        color: var(--general_contrasts-100);
        font-size: 0.875rem;
        font-weight: 600;
      }
      
      ul {
        margin: 0;
        padding-left: var(--bmb-spacing-m);
        
        li {
          color: var(--general_contrasts-75);
          font-size: 0.875rem;
          line-height: 1.4;
          margin-bottom: var(--bmb-spacing-xs);
          
          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    .processing-info {
      margin-top: var(--bmb-spacing-m);
      
      .info-card {
        background: linear-gradient(135deg, 
          rgba(var(--color-blue-tec), 0.1) 0%, 
          rgba(var(--color-blue-tec), 0.05) 100%
        );
        border: 1px solid rgba(var(--color-blue-tec), 0.3);
        border-radius: var(--bmb-radius-m);
        padding: var(--bmb-spacing-m);
        
        h3 {
          margin: 0 0 var(--bmb-spacing-m) 0;
          color: var(--general_contrasts-100);
          font-size: 1rem;
          font-weight: 600;
        }
        
        .info-content {
          .info-item {
            display: flex;
            align-items: center;
            gap: var(--bmb-spacing-m);
            
            .info-icon {
              font-size: 1.5rem;
              filter: grayscale(0.2);
            }
            
            .info-details {
              .info-title {
                color: var(--general_contrasts-100);
                font-weight: 600;
                font-size: 0.9rem;
                margin-bottom: 2px;
              }
              
              .info-subtitle {
                color: var(--general_contrasts-75);
                font-size: 0.8rem;
                font-style: italic;
              }
            }
          }
        }
      }
    }

    @keyframes expandBenefits {
      from {
        opacity: 0;
        max-height: 0;
        padding-top: 0;
      }
      to {
        opacity: 1;
        max-height: 200px;
        padding-top: var(--bmb-spacing-m);
      }
    }

    @media (max-width: 768px) {
      .option-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--bmb-spacing-s);
        
        .option-selector {
          align-self: flex-end;
          margin-top: 0;
        }
      }
      
      .processing-option {
        padding: var(--bmb-spacing-s);
      }
      
      .option-content {
        .option-title {
          font-size: 1rem;
          flex-wrap: wrap;
        }
      }
    }
  `]
})
export class ProcessingTypeSelectorComponent {
  @Input() selectedType: string = '';
  @Output() typeChange = new EventEmitter<string>();

  processingOptions: ProcessingOption[] = [
    {
      value: 'vectorized',
      label: 'Vectorización',
      description: 'Convierte documentos en vectores para búsqueda semántica inteligente',
      icon: '🔍',
      useCase: 'Ideal para búsquedas rápidas y análisis de contenido',
      benefits: [
        'Búsqueda semántica ultrarrápida',
        'Encuentra conceptos relacionados automáticamente',
        'Análisis de similitud entre documentos',
        'Respuestas basadas en contexto médico',
        'Optimizado para volúmenes grandes'
      ]
    },
    {
      value: 'complete',
      label: 'Almacenamiento Completo',
      description: 'Guarda el documento completo para contexto integral y visualización',
      icon: '📄',
      useCase: 'Perfecto para revisar documentos completos y detalles específicos',
      benefits: [
        'Acceso a documento completo original',
        'Contexto médico integral preservado',
        'Visualización y descarga directa',
        'Referencias exactas y citas textuales',
        'Ideal para casos complejos'
      ]
    },
    {
      value: 'both',
      label: 'Procesamiento Híbrido',
      description: 'Combina vectorización y almacenamiento completo para máxima flexibilidad',
      icon: '⚡',
      useCase: 'La opción más completa para usuarios avanzados',
      recommended: true,
      benefits: [
        'Búsqueda semántica + documento completo',
        'Máxima flexibilidad de uso',
        'Respuestas precisas con referencias exactas',
        'Análisis avanzado y visualización',
        'Preparado para cualquier caso de uso médico'
      ]
    }
  ];

  selectOption(value: string): void {
    this.selectedType = value;
    this.typeChange.emit(value);
  }

  getSelectedOption(): ProcessingOption | undefined {
    return this.processingOptions.find(option => option.value === this.selectedType);
  }
} 