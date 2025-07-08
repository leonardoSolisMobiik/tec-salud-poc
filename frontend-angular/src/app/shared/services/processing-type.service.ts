import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface ProcessingTypeInfo {
  value: string;
  label: string;
  description: string;
  icon: string;
  isVectorizationEnabled: boolean;
  isCompleteStorageEnabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ProcessingTypeService {
  private defaultType = 'both'; // Recommended default
  private selectedTypeSubject = new BehaviorSubject<string>(this.defaultType);
  
  selectedType$: Observable<string> = this.selectedTypeSubject.asObservable();

  private processingTypes: ProcessingTypeInfo[] = [
    {
      value: 'vectorized',
      label: 'Vectorización',
      description: 'Búsqueda semántica inteligente',
      icon: '🔍',
      isVectorizationEnabled: true,
      isCompleteStorageEnabled: false
    },
    {
      value: 'complete',
      label: 'Almacenamiento Completo',
      description: 'Contexto integral preservado',
      icon: '📄',
      isVectorizationEnabled: false,
      isCompleteStorageEnabled: true
    },
    {
      value: 'both',
      label: 'Procesamiento Híbrido',
      description: 'Máxima flexibilidad',
      icon: '⚡',
      isVectorizationEnabled: true,
      isCompleteStorageEnabled: true
    }
  ];

  constructor() {}

  setSelectedType(type: string): void {
    if (this.isValidType(type)) {
      this.selectedTypeSubject.next(type);
    }
  }

  getSelectedType(): string {
    return this.selectedTypeSubject.value;
  }

  getProcessingTypeInfo(type: string): ProcessingTypeInfo | undefined {
    return this.processingTypes.find(pt => pt.value === type);
  }

  getProcessingTypeLabel(type: string): string {
    const info = this.getProcessingTypeInfo(type);
    return info ? info.label : type;
  }

  isVectorizationEnabled(type?: string): boolean {
    const currentType = type || this.getSelectedType();
    const info = this.getProcessingTypeInfo(currentType);
    return info ? info.isVectorizationEnabled : false;
  }

  isCompleteStorageEnabled(type?: string): boolean {
    const currentType = type || this.getSelectedType();
    const info = this.getProcessingTypeInfo(currentType);
    return info ? info.isCompleteStorageEnabled : false;
  }

  private isValidType(type: string): boolean {
    return this.processingTypes.some(pt => pt.value === type);
  }

  getRecommendedType(): string {
    return 'both'; // Hybrid processing is recommended
  }

  getProcessingTypeDescription(type: string): string {
    const info = this.getProcessingTypeInfo(type);
    return info ? info.description : '';
  }

  getProcessingTypeIcon(type: string): string {
    const info = this.getProcessingTypeInfo(type);
    return info ? info.icon : '📄';
  }

  // Helper method to get processing capabilities as a readable string
  getProcessingCapabilities(type: string): string {
    const isVectorization = this.isVectorizationEnabled(type);
    const isComplete = this.isCompleteStorageEnabled(type);

    if (isVectorization && isComplete) {
      return 'Búsqueda semántica + Almacenamiento completo';
    } else if (isVectorization) {
      return 'Solo búsqueda semántica';
    } else if (isComplete) {
      return 'Solo almacenamiento completo';
    } else {
      return 'Sin procesamiento especial';
    }
  }

  // Validation helper for API calls
  validateProcessingType(type: string): boolean {
    return this.isValidType(type);
  }

  // Reset to default
  resetToDefault(): void {
    this.setSelectedType(this.defaultType);
  }
} 