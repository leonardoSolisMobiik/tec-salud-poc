import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface PatientDocument {
  id: string;
  fileName: string;
  displayName: string;
  type: 'CONS' | 'EMER'; // Consulta o Emergencia
  patientId: string;
  patientName: string;
  url: string; // URL para acceder al PDF
  uploadDate?: Date;
}

export interface PatientDocumentGroup {
  patientId: string;
  patientName: string;
  documents: PatientDocument[];
}

@Injectable({
  providedIn: 'root'
})
export class PatientDocumentsService {
  
  // Mapeo de PDFs reales del folder /data con nombres de pacientes del sidebar
  private readonly documentDatabase: PatientDocument[] = [
    // Arturo Herrera (paciente activo en sidebar)
    {
      id: 'doc_001',
      fileName: '4000365732_CASTRO FLORES, RAFAEL AARON_6001465670_CONS.pdf',
      displayName: 'Historia Clínica - Consulta',
      type: 'CONS',
      patientId: 'ARTURO001',
      patientName: 'Arturo Herrera',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    },
    // Andrea Pérez García
    {
      id: 'doc_002', 
      fileName: '3000017135_MARTINEZ SERRANO, MARIA CRISTINA_6001468992_CONS.pdf',
      displayName: 'Historia Clínica - Consulta',
      type: 'CONS',
      patientId: 'ANDREA001',
      patientName: 'Andrea Pérez García',
      url: 'https://www.africau.edu/images/default/sample.pdf'
    },
    // Pedro Pérez Morales
    {
      id: 'doc_003',
      fileName: '4000175978_CARDENAS GARZA, PEDRO JAVIER_2003091700_EMER.pdf',
      displayName: 'Atención de Emergencia',
      type: 'EMER',
      patientId: 'PEDRO001',
      patientName: 'Pedro Pérez Morales',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    },
    // Lucía Flores Herrera  
    {
      id: 'doc_004',
      fileName: '3000003799_GARZA TIJERINA, MARIA ESTHER_600146701_CONS.pdf',
      displayName: 'Historia Clínica - Consulta',
      type: 'CONS',
      patientId: 'LUCIA001',
      patientName: 'Lucía Flores Herrera',
      url: 'https://www.africau.edu/images/default/sample.pdf'
    },
    // Raúl Herrera Hernández
    {
      id: 'doc_005',
      fileName: '4000210686_MUZZA VILLARREAL, LOURDES_2003095302_CONS.pdf',
      displayName: 'Historia Clínica - Consulta',
      type: 'CONS',
      patientId: 'RAUL001',
      patientName: 'Raúl Herrera Hernández',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    },
    // Raúl Reyes Hernández
    {
      id: 'doc_006',
      fileName: '3000108452_ORTIZ OLIVARES, VIVIANA_2003103371_EMER.pdf',
      displayName: 'Atención de Emergencia',
      type: 'EMER',
      patientId: 'RAUL002',
      patientName: 'Raúl Reyes Hernández',
      url: 'https://www.africau.edu/images/default/sample.pdf'
    },
    // Documentos adicionales con nombres originales (para tener más variedad)
    {
      id: 'doc_007',
      fileName: '3000085592_MARTINEZ MARTINEZ, VANEZZA ALEJANDRA_2003097280_EMER.pdf',
      displayName: 'Atención de Emergencia',
      type: 'EMER',
      patientId: 'MARTINEZ002',
      patientName: 'MARTINEZ MARTINEZ, VANEZZA ALEJANDRA',
      url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
    },
    {
      id: 'doc_008',
      fileName: '3000128494_ALANIS VILLAGRAN, MARIA DE LOS ANGELES_2003091464_EMER.pdf',
      displayName: 'Atención de Emergencia', 
      type: 'EMER',
      patientId: 'ALANIS001',
      patientName: 'ALANIS VILLAGRAN, MARIA DE LOS ANGELES',
      url: 'https://www.africau.edu/images/default/sample.pdf'
    }
  ];

  constructor() {}

  /**
   * Obtiene todos los documentos de un paciente específico
   */
  getPatientDocuments(patientId: string): Observable<PatientDocument[]> {
    const documents = this.documentDatabase.filter(doc => doc.patientId === patientId);
    return of(documents);
  }

  /**
   * Obtiene documentos por nombre del paciente (fuzzy matching)
   */
  getDocumentsByPatientName(patientName: string): Observable<PatientDocument[]> {
    const normalizedSearch = this.normalizeString(patientName);
    const documents = this.documentDatabase.filter(doc => 
      this.normalizeString(doc.patientName).includes(normalizedSearch) ||
      normalizedSearch.includes(this.normalizeString(doc.patientName))
    );
    return of(documents);
  }

  /**
   * Obtiene un documento específico por ID
   */
  getDocument(documentId: string): Observable<PatientDocument | null> {
    const document = this.documentDatabase.find(doc => doc.id === documentId);
    return of(document || null);
  }

  /**
   * Obtiene todos los pacientes que tienen documentos
   */
  getPatientsWithDocuments(): Observable<PatientDocumentGroup[]> {
    const grouped = this.groupDocumentsByPatient();
    return of(grouped);
  }

  /**
   * Busca documentos por tipo (CONS o EMER)
   */
  getDocumentsByType(type: 'CONS' | 'EMER'): Observable<PatientDocument[]> {
    const documents = this.documentDatabase.filter(doc => doc.type === type);
    return of(documents);
  }

  /**
   * Mapeo inteligente desde objeto Patient del sistema
   */
  mapPatientToDocuments(patient: { id?: string, name: string }): Observable<PatientDocument[]> {
    // Primero intentar por ID si está disponible
    if (patient.id) {
      const documentsById = this.documentDatabase.filter(doc => doc.patientId === patient.id);
      if (documentsById.length > 0) {
        return of(documentsById);
      }
    }

    // Fallback: buscar por nombre (más flexible para coincidir con nombres del sidebar)
    const normalizedSearch = this.normalizeString(patient.name);
    const documents = this.documentDatabase.filter(doc => {
      const normalizedDocName = this.normalizeString(doc.patientName);
      return normalizedDocName.includes(normalizedSearch) || 
             normalizedSearch.includes(normalizedDocName);
    });
    
    return of(documents);
  }

  /**
   * Agrupa documentos por paciente
   */
  private groupDocumentsByPatient(): PatientDocumentGroup[] {
    const groupMap = new Map<string, PatientDocumentGroup>();

    this.documentDatabase.forEach(doc => {
      if (!groupMap.has(doc.patientId)) {
        groupMap.set(doc.patientId, {
          patientId: doc.patientId,
          patientName: doc.patientName,
          documents: []
        });
      }
      groupMap.get(doc.patientId)!.documents.push(doc);
    });

    return Array.from(groupMap.values());
  }

  /**
   * Normaliza strings para búsqueda (sin acentos, lowercase)
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9\s]/g, '') // Solo letras, números y espacios
      .trim();
  }

  /**
   * Obtiene URL de descarga/visualización del documento
   */
  getDocumentUrl(document: PatientDocument): string {
    // En MVP usamos URLs relativas, en producción sería del backend
    return `/api/documents/view/${document.id}`;
  }

  /**
   * Valida si un documento existe y es accesible
   */
  validateDocumentAccess(documentId: string): Observable<boolean> {
    const document = this.documentDatabase.find(doc => doc.id === documentId);
    return of(!!document);
  }
} 