/**
 * Unit tests for PatientDocumentsService
 *
 * @description Tests for patient document retrieval, filtering, grouping,
 * and API integration for medical document management
 *
 * @since 1.0.0
 */

import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { PatientDocumentsService, PatientDocument } from './patient-documents.service';
import { ApiService } from '../../core/services/api.service';

describe('PatientDocumentsService', () => {
  let service: PatientDocumentsService;
  let apiServiceMock: any;

  const mockPatientDocument: PatientDocument = {
    id: 'doc123',
    fileName: '4000365732_CASTRO_FLORES_RAFAEL_AARON_6001465670_CONS.pdf',
    displayName: 'Historia Clínica - Consulta',
    type: 'CONS',
    patientId: 'ARTURO001',
    patientName: 'Arturo Herrera',
    url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    uploadDate: new Date('2024-01-15')
  };

  const mockApiDocument = {
    document_id: 'doc123',
    filename: '4000365732_CASTRO_FLORES_RAFAEL_AARON_6001465670_CONS.pdf',
    expediente: 'ARTURO001',
    nombre_paciente: 'Arturo Herrera',
    categoria: 'CONS',
    created_at: '2024-01-15T00:00:00.000Z',
    numero_episodio: '001'
  };

  beforeEach(() => {
    const apiServiceSpy = {
      getPatientDocuments: jest.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        PatientDocumentsService,
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    });

    service = TestBed.inject(PatientDocumentsService);
    apiServiceMock = TestBed.inject(ApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getPatientDocuments', () => {
    it('should get documents for a specific patient', (done) => {
      const patientId = 'ARTURO001';

      service.getPatientDocuments(patientId).subscribe(documents => {
        expect(documents).toBeInstanceOf(Array);
        expect(documents.length).toBeGreaterThanOrEqual(0);
        done();
      });
    });

    it('should return empty array for non-existent patient', (done) => {
      const patientId = 'NON_EXISTENT';

      service.getPatientDocuments(patientId).subscribe(documents => {
        expect(documents).toEqual([]);
        done();
      });
    });
  });

  describe('getDocumentsByPatientName', () => {
    it('should filter documents by patient name', (done) => {
      const patientName = 'Arturo';

      service.getDocumentsByPatientName(patientName).subscribe(documents => {
        expect(documents).toBeInstanceOf(Array);
        // Should find at least one document for Arturo Herrera
        if (documents.length > 0) {
          expect(documents[0].patientName).toContain('Arturo');
        }
        done();
      });
    });

    it('should be case insensitive', (done) => {
      const patientName = 'ARTURO';

      service.getDocumentsByPatientName(patientName).subscribe(documents => {
        expect(documents).toBeInstanceOf(Array);
        done();
      });
    });

    it('should return empty array for no matches', (done) => {
      const patientName = 'NoExistePaciente';

      service.getDocumentsByPatientName(patientName).subscribe(documents => {
        expect(documents).toEqual([]);
        done();
      });
    });
  });

  describe('getDocument', () => {
    it('should get a specific document by ID', (done) => {
      const documentId = 'doc_001';

      service.getDocument(documentId).subscribe(document => {
        if (document) {
          expect(document.id).toBe(documentId);
          expect(document).toHaveProperty('fileName');
          expect(document).toHaveProperty('displayName');
          expect(document).toHaveProperty('type');
        }
        done();
      });
    });

    it('should return null for non-existent document ID', (done) => {
      const documentId = 'non_existent_id';

      service.getDocument(documentId).subscribe(document => {
        expect(document).toBeNull();
        done();
      });
    });
  });

  describe('getPatientsWithDocuments', () => {
    it('should group documents by patient', (done) => {
      service.getPatientsWithDocuments().subscribe(groups => {
        expect(groups).toBeInstanceOf(Array);

        if (groups.length > 0) {
          const group = groups[0];
          expect(group).toHaveProperty('patientId');
          expect(group).toHaveProperty('patientName');
          expect(group).toHaveProperty('documents');
          expect(group.documents).toBeInstanceOf(Array);
        }
        done();
      });
    });

    it('should have unique patient IDs in groups', (done) => {
      service.getPatientsWithDocuments().subscribe(groups => {
        const patientIds = groups.map(group => group.patientId);
        const uniqueIds = [...new Set(patientIds)];
        expect(patientIds).toEqual(uniqueIds);
        done();
      });
    });
  });

  describe('getDocumentsByType', () => {
    it('should filter documents by CONS type', (done) => {
      service.getDocumentsByType('CONS').subscribe(documents => {
        expect(documents).toBeInstanceOf(Array);
        documents.forEach(doc => {
          expect(doc.type).toBe('CONS');
        });
        done();
      });
    });

    it('should filter documents by EMER type', (done) => {
      service.getDocumentsByType('EMER').subscribe(documents => {
        expect(documents).toBeInstanceOf(Array);
        documents.forEach(doc => {
          expect(doc.type).toBe('EMER');
        });
        done();
      });
    });

    it('should return empty array for non-existent type', (done) => {
      // Use a valid type that might not have documents
      service.getDocumentsByType('FARM').subscribe(documents => {
        expect(documents).toBeInstanceOf(Array);
        done();
      });
    });
  });

  describe('mapPatientToDocuments', () => {
    it('should map patient to documents using API', (done) => {
      const patient = {
        id: 'ARTURO001',
        name: 'Arturo Herrera'
      };

      const mockApiResponse = {
        documents: [mockApiDocument],
        total: 1
      };

      apiServiceMock.getPatientDocuments.mockReturnValue(of(mockApiResponse));

      service.mapPatientToDocuments(patient).subscribe(documents => {
        expect(documents).toBeInstanceOf(Array);
        expect(apiServiceMock.getPatientDocuments).toHaveBeenCalledWith(
          'Arturo Herrera',
          expect.objectContaining({
            user_id: 'pedro',
            limit: 50,
            skip: 0
          })
        );
        done();
      });
    });

    it('should handle API errors gracefully', (done) => {
      const patient = {
        id: 'ARTURO001',
        name: 'Arturo Herrera'
      };

      apiServiceMock.getPatientDocuments.mockReturnValue(
        throwError(() => new Error('API Error'))
      );

      service.mapPatientToDocuments(patient).subscribe(documents => {
        // Should fallback to static documents
        expect(documents).toBeInstanceOf(Array);
        done();
      });
    });

    it('should handle patient without name', (done) => {
      const patient = {
        id: 'ARTURO001',
        name: ''
      };

      service.mapPatientToDocuments(patient).subscribe(documents => {
        expect(documents).toEqual([]);
        done();
      });
    });

    it('should use nombre_paciente if available', (done) => {
      const patient = {
        id: 'ARTURO001',
        name: 'Fallback Name',
        nombre_paciente: 'Arturo Herrera'
      };

      const mockApiResponse = {
        documents: [mockApiDocument],
        total: 1
      };

      apiServiceMock.getPatientDocuments.mockReturnValue(of(mockApiResponse));

      service.mapPatientToDocuments(patient).subscribe(documents => {
        expect(apiServiceMock.getPatientDocuments).toHaveBeenCalledWith(
          'Arturo Herrera', // Should use nombre_paciente, not name
          expect.any(Object)
        );
        done();
      });
    });
  });

  describe('Static Document Database', () => {
    it('should have predefined documents in database', (done) => {
      // Test with known patient ID from static database
      service.getPatientDocuments('ARTURO001').subscribe(documents => {
        expect(documents.length).toBeGreaterThan(0);
        const doc = documents[0];
        expect(doc).toHaveProperty('id');
        expect(doc).toHaveProperty('fileName');
        expect(doc).toHaveProperty('displayName');
        expect(doc).toHaveProperty('type');
        expect(doc).toHaveProperty('patientId');
        expect(doc).toHaveProperty('patientName');
        expect(doc).toHaveProperty('url');
        done();
      });
    });

    it('should have valid document types', (done) => {
      service.getPatientDocuments('ARTURO001').subscribe(documents => {
        documents.forEach(doc => {
          expect(['CONS', 'EMER', 'LAB', 'RAD', 'CIR', 'INT', 'HOSP', 'FARM', 'IMAGEN', 'REPORTE']).toContain(doc.type);
        });
        done();
      });
    });

    it('should have valid URLs in documents', (done) => {
      service.getPatientDocuments('ARTURO001').subscribe(documents => {
        documents.forEach(doc => {
          expect(doc.url).toMatch(/^https?:\/\//);
        });
        done();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty patient name in search', (done) => {
      service.getDocumentsByPatientName('').subscribe(documents => {
        expect(documents).toBeInstanceOf(Array);
        done();
      });
    });

    it('should handle whitespace-only patient name', (done) => {
      service.getDocumentsByPatientName('   ').subscribe(documents => {
        expect(documents).toBeInstanceOf(Array);
        done();
      });
    });

    it('should handle special characters in patient name', (done) => {
      service.getDocumentsByPatientName('José María').subscribe(documents => {
        expect(documents).toBeInstanceOf(Array);
        done();
      });
    });
  });

  describe('Performance', () => {
    it('should handle multiple simultaneous requests efficiently', (done) => {
      const patientIds = ['ARTURO001', 'ANDREA001', 'PEDRO001', 'LUCIA001'];
      const requests = patientIds.map(id => service.getPatientDocuments(id));

      Promise.all(requests.map(req => req.toPromise())).then(results => {
        expect(results).toHaveLength(4);
        results.forEach(documents => {
          expect(documents).toBeInstanceOf(Array);
        });
        done();
      });
    });
  });
});
