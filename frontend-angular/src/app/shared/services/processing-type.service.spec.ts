/**
 * Unit tests for ProcessingTypeService
 *
 * @description Tests for document processing type management including
 * type selection, validation, and capability checking
 *
 * @since 1.0.0
 */

import { TestBed } from '@angular/core/testing';
import { ProcessingTypeService, ProcessingTypeInfo } from './processing-type.service';

describe('ProcessingTypeService', () => {
  let service: ProcessingTypeService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ProcessingTypeService]
    });

    service = TestBed.inject(ProcessingTypeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize with default type "both"', () => {
      service.selectedType$.subscribe(type => {
        expect(type).toBe('both');
      });
    });

    it('should have correct default processing type configuration', () => {
      const currentType = service.getSelectedType();
      expect(currentType).toBe('both');
    });
  });

  describe('Processing Type Selection', () => {
    it('should set vectorized processing type', () => {
      service.setSelectedType('vectorized');

      service.selectedType$.subscribe(type => {
        expect(type).toBe('vectorized');
      });
    });

    it('should set complete storage processing type', () => {
      service.setSelectedType('complete');

      service.selectedType$.subscribe(type => {
        expect(type).toBe('complete');
      });
    });

    it('should set both processing type', () => {
      service.setSelectedType('both');

      service.selectedType$.subscribe(type => {
        expect(type).toBe('both');
      });
    });

    it('should emit changes when type is updated', () => {
      let emittedType: string = '';
      service.selectedType$.subscribe(type => {
        emittedType = type;
      });

      service.setSelectedType('vectorized');
      expect(emittedType).toBe('vectorized');

      service.setSelectedType('complete');
      expect(emittedType).toBe('complete');
    });

    it('should get current selected type synchronously', () => {
      service.setSelectedType('vectorized');
      expect(service.getSelectedType()).toBe('vectorized');

      service.setSelectedType('complete');
      expect(service.getSelectedType()).toBe('complete');
    });
  });

  describe('Processing Type Information', () => {
    it('should get vectorized processing type info', () => {
      const info = service.getProcessingTypeInfo('vectorized');

      expect(info).toEqual({
        value: 'vectorized',
        label: 'Búsqueda Semántica',
        description: 'Búsqueda semántica inteligente',
        icon: '🔍',
        isVectorizationEnabled: true,
        isCompleteStorageEnabled: false
      });
    });

    it('should get complete storage processing type info', () => {
      const info = service.getProcessingTypeInfo('complete');

      expect(info).toEqual({
        value: 'complete',
        label: 'Almacenamiento Completo',
        description: 'Contexto integral preservado',
        icon: '📄',
        isVectorizationEnabled: false,
        isCompleteStorageEnabled: true
      });
    });

    it('should get both processing type info', () => {
      const info = service.getProcessingTypeInfo('both');

      expect(info?.value).toBe('both');
      expect(info?.label).toContain('Híbrido');
      expect(info?.isVectorizationEnabled).toBe(true);
      expect(info?.isCompleteStorageEnabled).toBe(true);
    });

    it('should return undefined for invalid processing type', () => {
      const info = service.getProcessingTypeInfo('invalid-type');
      expect(info).toBeUndefined();
    });

    it('should validate all available processing types', () => {
      const validTypes = ['vectorized', 'complete', 'both'];

      validTypes.forEach((type: string) => {
        expect(service.validateProcessingType(type)).toBe(true);
        expect(service.getProcessingTypeInfo(type)).toBeDefined();
      });
    });
  });

  describe('Capability Checking', () => {
    it('should check vectorization capability for current type', () => {
      service.setSelectedType('vectorized');
      expect(service.isVectorizationEnabled()).toBe(true);

      service.setSelectedType('complete');
      expect(service.isVectorizationEnabled()).toBe(false);

      service.setSelectedType('both');
      expect(service.isVectorizationEnabled()).toBe(true);
    });

    it('should check complete storage capability for current type', () => {
      service.setSelectedType('vectorized');
      expect(service.isCompleteStorageEnabled()).toBe(false);

      service.setSelectedType('complete');
      expect(service.isCompleteStorageEnabled()).toBe(true);

      service.setSelectedType('both');
      expect(service.isCompleteStorageEnabled()).toBe(true);
    });

    it('should check vectorization capability for specific type', () => {
      expect(service.isVectorizationEnabled('vectorized')).toBe(true);
      expect(service.isVectorizationEnabled('complete')).toBe(false);
      expect(service.isVectorizationEnabled('both')).toBe(true);
      expect(service.isVectorizationEnabled('invalid')).toBe(false);
    });

    it('should check complete storage capability for specific type', () => {
      expect(service.isCompleteStorageEnabled('vectorized')).toBe(false);
      expect(service.isCompleteStorageEnabled('complete')).toBe(true);
      expect(service.isCompleteStorageEnabled('both')).toBe(true);
      expect(service.isCompleteStorageEnabled('invalid')).toBe(false);
    });
  });

  describe('Validation', () => {
    it('should validate correct processing types', () => {
      expect(service.validateProcessingType('vectorized')).toBe(true);
      expect(service.validateProcessingType('complete')).toBe(true);
      expect(service.validateProcessingType('both')).toBe(true);
    });

    it('should invalidate incorrect processing types', () => {
      expect(service.validateProcessingType('invalid')).toBe(false);
      expect(service.validateProcessingType('')).toBe(false);
      expect(service.validateProcessingType(null as any)).toBe(false);
      expect(service.validateProcessingType(undefined as any)).toBe(false);
    });

    it('should handle case sensitivity in validation', () => {
      expect(service.validateProcessingType('VECTORIZED')).toBe(false);
      expect(service.validateProcessingType('Complete')).toBe(false);
      expect(service.validateProcessingType('BOTH')).toBe(false);
    });
  });

  describe('Configuration Retrieval', () => {
    it('should get current processing configuration', () => {
      service.setSelectedType('vectorized');
      const currentType = service.getSelectedType();
      const config = service.getProcessingTypeInfo(currentType);

      expect(config?.value).toBe('vectorized');
      expect(config?.isVectorizationEnabled).toBe(true);
      expect(config?.isCompleteStorageEnabled).toBe(false);
    });

    it('should return undefined for invalid current type', () => {
      // Force invalid state (this shouldn't happen in normal operation)
      (service as any).selectedTypeSubject.next('invalid-type');

      const currentType = service.getSelectedType();
      const config = service.getProcessingTypeInfo(currentType);
      expect(config).toBeUndefined();
    });

    it('should check processing requirements', () => {
      service.setSelectedType('vectorized');
      expect(service.isVectorizationEnabled()).toBe(true);
      expect(service.isCompleteStorageEnabled()).toBe(false);

      service.setSelectedType('complete');
      expect(service.isVectorizationEnabled()).toBe(false);
      expect(service.isCompleteStorageEnabled()).toBe(true);

      service.setSelectedType('both');
      expect(service.isVectorizationEnabled()).toBe(true);
      expect(service.isCompleteStorageEnabled()).toBe(true);
    });
  });

  describe('State Management', () => {
    it('should maintain state consistency', () => {
      let emissionCount = 0;
      service.selectedType$.subscribe(() => {
        emissionCount++;
      });

      // Initial emission
      expect(emissionCount).toBe(1);

      service.setSelectedType('vectorized');
      expect(emissionCount).toBe(2);

      service.setSelectedType('complete');
      expect(emissionCount).toBe(3);

      // Setting same type should not emit
      service.setSelectedType('complete');
      expect(emissionCount).toBe(3);
    });

    it('should reset to default type', () => {
      service.setSelectedType('vectorized');
      service.resetToDefault();

      service.selectedType$.subscribe(type => {
        expect(type).toBe('both');
      });
    });

    it('should get default type', () => {
      expect(service.getRecommendedType()).toBe('both');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid type setting gracefully', () => {
      expect(() => {
        service.setSelectedType('invalid-type');
      }).not.toThrow();

      // Should remain unchanged or reset to default
      const currentType = service.getSelectedType();
      expect(['both', 'vectorized', 'complete']).toContain(currentType);
    });

    it('should handle null/undefined type gracefully', () => {
      expect(() => {
        service.setSelectedType(null as any);
        service.setSelectedType(undefined as any);
      }).not.toThrow();
    });
  });

  describe('Integration Scenarios', () => {
    it('should support medical document processing workflow', () => {
      // Start with default hybrid approach
      expect(service.getSelectedType()).toBe('both');
      expect(service.isVectorizationEnabled()).toBe(true);
      expect(service.isCompleteStorageEnabled()).toBe(true);

      // Switch to vectorized only for semantic search
      service.setSelectedType('vectorized');
      expect(service.isVectorizationEnabled()).toBe(true);
      expect(service.isCompleteStorageEnabled()).toBe(false);

      // Switch to complete storage for full context
      service.setSelectedType('complete');
      expect(service.isVectorizationEnabled()).toBe(false);
      expect(service.isCompleteStorageEnabled()).toBe(true);
    });

    it('should provide correct processing labels for UI', () => {
      const vectorizedInfo = service.getProcessingTypeInfo('vectorized');
      const completeInfo = service.getProcessingTypeInfo('complete');
      const bothInfo = service.getProcessingTypeInfo('both');

      expect(vectorizedInfo?.label).toContain('Semántica');
      expect(completeInfo?.label).toContain('Completo');
      expect(bothInfo?.label).toContain('Híbrido');

      expect(vectorizedInfo?.icon).toBe('🔍');
      expect(completeInfo?.icon).toBe('📄');
    });

    it('should handle rapid type switching', () => {
      const types = ['vectorized', 'complete', 'both', 'vectorized', 'both'];

      types.forEach(type => {
        service.setSelectedType(type);
        expect(service.getSelectedType()).toBe(type);
        expect(service.validateProcessingType(type)).toBe(true);
      });
    });
  });
});
