import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Interface defining processing type configuration for medical documents
 * 
 * @interface ProcessingTypeInfo
 * @description Defines the structure for document processing types including
 * vectorization and storage options for medical document handling
 */
export interface ProcessingTypeInfo {
  /** Unique identifier for the processing type */
  value: string;
  
  /** Human-readable label for UI display */
  label: string;
  
  /** Detailed description of the processing type */
  description: string;
  
  /** Icon representation for UI */
  icon: string;
  
  /** Whether semantic search vectorization is enabled */
  isVectorizationEnabled: boolean;
  
  /** Whether complete document storage is enabled */
  isCompleteStorageEnabled: boolean;
}

/**
 * Service for managing document processing type selection and configuration
 * 
 * @description Handles the selection and management of different document processing
 * types for medical documents including vectorization for semantic search and
 * complete storage for full context preservation.
 * 
 * @example
 * ```typescript
 * constructor(private processingService: ProcessingTypeService) {}
 * 
 * // Set processing type
 * this.processingService.setSelectedType('both');
 * 
 * // Check capabilities
 * const canVectorize = this.processingService.isVectorizationEnabled();
 * const canStore = this.processingService.isCompleteStorageEnabled();
 * 
 * // Get processing info
 * const info = this.processingService.getProcessingTypeInfo('vectorized');
 * console.log(info.description); // 'Búsqueda semántica inteligente'
 * 
 * // Listen to changes
 * this.processingService.selectedType$.subscribe(type => {
 *   console.log('Processing type changed:', type);
 * });
 * ```
 * 
 * @features
 * - Vectorization for semantic search of medical content
 * - Complete storage for full context preservation
 * - Hybrid processing combining both approaches
 * - Reactive state management with observables
 * - Validation and capability checking
 * 
 * @since 1.0.0
 */
@Injectable({
  providedIn: 'root'
})
export class ProcessingTypeService {
  /** Default recommended processing type */
  private defaultType = 'both';
  
  /** Subject for reactive processing type management */
  private selectedTypeSubject = new BehaviorSubject<string>(this.defaultType);
  
  /** Observable for processing type changes */
  selectedType$: Observable<string> = this.selectedTypeSubject.asObservable();

  /** Available processing type configurations */
  private processingTypes: ProcessingTypeInfo[] = [
    {
      value: 'vectorized',
      label: 'Búsqueda Semántica',
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

  /**
   * Creates an instance of ProcessingTypeService
   * 
   * @description Initializes the service with the default processing type
   */
  constructor() {}

  /**
   * Sets the selected processing type
   * 
   * @param type - Processing type to set ('vectorized', 'complete', or 'both')
   * 
   * @description Updates the selected processing type if valid and notifies subscribers
   * 
   * @example
   * ```typescript
   * this.processingService.setSelectedType('both');
   * this.processingService.setSelectedType('vectorized');
   * ```
   */
  setSelectedType(type: string): void {
    if (this.isValidType(type)) {
      this.selectedTypeSubject.next(type);
    }
  }

  /**
   * Gets the currently selected processing type
   * 
   * @returns Current processing type string
   * 
   * @example
   * ```typescript
   * const currentType = this.processingService.getSelectedType();
   * console.log('Current type:', currentType); // 'both'
   * ```
   */
  getSelectedType(): string {
    return this.selectedTypeSubject.value;
  }

  /**
   * Gets detailed information for a specific processing type
   * 
   * @param type - Processing type to get information for
   * @returns Processing type information object or undefined if not found
   * 
   * @example
   * ```typescript
   * const info = this.processingService.getProcessingTypeInfo('vectorized');
       * console.log(info.label); // 'Búsqueda Semántica'
   * console.log(info.description); // 'Búsqueda semántica inteligente'
   * ```
   */
  getProcessingTypeInfo(type: string): ProcessingTypeInfo | undefined {
    return this.processingTypes.find(pt => pt.value === type);
  }

  /**
   * Gets the human-readable label for a processing type
   * 
   * @param type - Processing type to get label for
   * @returns Human-readable label or the type string if not found
   * 
   * @example
   * ```typescript
   * const label = this.processingService.getProcessingTypeLabel('both');
   * console.log(label); // 'Procesamiento Híbrido'
   * ```
   */
  getProcessingTypeLabel(type: string): string {
    const info = this.getProcessingTypeInfo(type);
    return info ? info.label : type;
  }

  /**
   * Checks if vectorization is enabled for a processing type
   * 
   * @param type - Optional processing type to check (defaults to current selection)
   * @returns True if vectorization is enabled for the type
   * 
   * @description Vectorization enables semantic search capabilities for medical documents
   * 
   * @example
   * ```typescript
   * const canVectorize = this.processingService.isVectorizationEnabled('vectorized');
   * console.log(canVectorize); // true
   * 
   * const currentCanVectorize = this.processingService.isVectorizationEnabled();
   * ```
   */
  isVectorizationEnabled(type?: string): boolean {
    const currentType = type || this.getSelectedType();
    const info = this.getProcessingTypeInfo(currentType);
    return info ? info.isVectorizationEnabled : false;
  }

  /**
   * Checks if complete storage is enabled for a processing type
   * 
   * @param type - Optional processing type to check (defaults to current selection)
   * @returns True if complete storage is enabled for the type
   * 
   * @description Complete storage preserves full document context for comprehensive analysis
   * 
   * @example
   * ```typescript
   * const canStore = this.processingService.isCompleteStorageEnabled('complete');
   * console.log(canStore); // true
   * 
   * const currentCanStore = this.processingService.isCompleteStorageEnabled();
   * ```
   */
  isCompleteStorageEnabled(type?: string): boolean {
    const currentType = type || this.getSelectedType();
    const info = this.getProcessingTypeInfo(currentType);
    return info ? info.isCompleteStorageEnabled : false;
  }

  /**
   * Validates if a processing type is supported
   * 
   * @private
   * @param type - Processing type to validate
   * @returns True if the type is valid
   */
  private isValidType(type: string): boolean {
    return this.processingTypes.some(pt => pt.value === type);
  }

  /**
   * Gets the recommended processing type for medical documents
   * 
   * @returns Recommended processing type ('both' for hybrid processing)
   * 
   * @description Returns the recommended type that provides maximum flexibility
   * for medical document processing
   * 
   * @example
   * ```typescript
   * const recommended = this.processingService.getRecommendedType();
   * this.processingService.setSelectedType(recommended);
   * ```
   */
  getRecommendedType(): string {
    return 'both'; // Hybrid processing is recommended
  }

  /**
   * Gets the description for a processing type
   * 
   * @param type - Processing type to get description for
   * @returns Description string or empty string if not found
   * 
   * @example
   * ```typescript
   * const desc = this.processingService.getProcessingTypeDescription('both');
   * console.log(desc); // 'Máxima flexibilidad'
   * ```
   */
  getProcessingTypeDescription(type: string): string {
    const info = this.getProcessingTypeInfo(type);
    return info ? info.description : '';
  }

  /**
   * Gets the icon for a processing type
   * 
   * @param type - Processing type to get icon for
   * @returns Icon string or default icon if not found
   * 
   * @example
   * ```typescript
   * const icon = this.processingService.getProcessingTypeIcon('vectorized');
   * console.log(icon); // '🔍'
   * ```
   */
  getProcessingTypeIcon(type: string): string {
    const info = this.getProcessingTypeInfo(type);
    return info ? info.icon : '📄';
  }

  /**
   * Gets a human-readable description of processing capabilities
   * 
   * @param type - Processing type to get capabilities for
   * @returns Readable capabilities description
   * 
   * @description Provides a user-friendly description of what the processing type can do
   * 
   * @example
   * ```typescript
   * const capabilities = this.processingService.getProcessingCapabilities('both');
   * console.log(capabilities); // 'Búsqueda semántica + Almacenamiento completo'
   * ```
   */
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

  /**
   * Validates a processing type for API calls
   * 
   * @param type - Processing type to validate
   * @returns True if valid for API usage
   * 
   * @description Validates that a processing type is acceptable for backend API calls
   * 
   * @example
   * ```typescript
   * if (this.processingService.validateProcessingType(userInput)) {
   *   // Safe to send to API
   *   this.apiService.uploadDocument(file, userInput);
   * }
   * ```
   */
  validateProcessingType(type: string): boolean {
    return this.isValidType(type);
  }

  /**
   * Resets the processing type to the default recommended value
   * 
   * @description Resets to the default 'both' processing type
   * 
   * @example
   * ```typescript
   * this.processingService.resetToDefault();
   * // Now getSelectedType() returns 'both'
   * ```
   */
  resetToDefault(): void {
    this.setSelectedType(this.defaultType);
  }
} 