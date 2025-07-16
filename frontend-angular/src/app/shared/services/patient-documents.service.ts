import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { PatientDocument as ApiPatientDocument } from '../../core/models/patient.model';

/**
 * Interface representing a patient document in the medical system
 *
 * @interface PatientDocument
 * @description Defines the structure for medical documents including PDFs,
 * images, and other clinical files associated with patients
 *
 * @example
 * ```typescript
 * const document: PatientDocument = {
 *   id: 'doc_001',
 *   fileName: '4000365732_CASTRO_FLORES_RAFAEL_AARON_6001465670_CONS.pdf',
 *   displayName: 'Historia Clínica - Consulta',
 *   type: 'CONS',
 *   patientId: 'ARTURO001',
 *   patientName: 'Arturo Herrera',
 *   url: 'https://storage.example.com/documents/doc_001.pdf',
 *   uploadDate: new Date('2024-01-15')
 * };
 * ```
 */
export interface PatientDocument {
  /** Unique document identifier */
  id: string;

  /** Original file name as stored in the system */
  fileName: string;

  /** Human-readable display name for the document */
  displayName: string;

  /** Document type: CONS (Consulta), EMER (Emergencia), LAB (Laboratorio), RAD (Radiología), CIR (Cirugía), INT (Interconsulta), HOSP (Hospitalización), FARM (Farmacia), IMAGEN (Imagen Médica), REPORTE (Reporte Médico) */
  type: 'CONS' | 'EMER' | 'LAB' | 'RAD' | 'CIR' | 'INT' | 'HOSP' | 'FARM' | 'IMAGEN' | 'REPORTE';

  /** Patient ID this document belongs to */
  patientId: string;

  /** Patient name for easy reference */
  patientName: string;

  /** URL to access the document file */
  url: string;

  /** Optional upload date */
  uploadDate?: Date;
}

/**
 * Interface representing a group of documents for a specific patient
 *
 * @interface PatientDocumentGroup
 * @description Used for organizing and displaying documents grouped by patient
 *
 * @example
 * ```typescript
 * const documentGroup: PatientDocumentGroup = {
 *   patientId: 'ARTURO001',
 *   patientName: 'Arturo Herrera',
 *   documents: [document1, document2, document3]
 * };
 * ```
 */
export interface PatientDocumentGroup {
  /** Patient ID for the group */
  patientId: string;

  /** Patient name for the group */
  patientName: string;

  /** Array of documents belonging to this patient */
  documents: PatientDocument[];
}

/**
 * Service for managing patient documents and medical files
 *
 * @description Provides methods for retrieving, organizing, and managing
 * patient documents including medical records, consultation notes, and
 * emergency documentation. Handles document mapping and access validation.
 *
 * @example
 * ```typescript
 * constructor(private documentService: PatientDocumentsService) {}
 *
 * // Get documents for a specific patient
 * this.documentService.getPatientDocuments('ARTURO001').subscribe(docs => {
 *   console.log('Patient documents:', docs);
 * });
 *
 * // Get documents by type
 * this.documentService.getDocumentsByType('CONS').subscribe(consultations => {
 *   console.log('Consultation documents:', consultations);
 * });
 *
 * // Get all patients with their documents
 * this.documentService.getPatientsWithDocuments().subscribe(groups => {
 *   console.log('Document groups:', groups);
 * });
 * ```
 *
 * @features
 * - Patient-specific document retrieval
 * - Document type filtering (CONS/EMER/LAB/RAD/CIR/INT/HOSP/FARM/IMAGEN/REPORTE)
 * - Patient name normalization and mapping
 * - Document access validation
 * - Grouped document organization
 *
 * @since 1.0.0
 */
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

  /**
   * Creates an instance of PatientDocumentsService
   *
   * @description Initializes the service with the document database
   */
  constructor(private apiService: ApiService) {}

  /**
   * Retrieves documents for a specific patient
   *
   * @param patientId - Unique identifier for the patient
   * @returns Observable containing array of patient documents
   *
   * @example
   * ```typescript
   * this.documentService.getPatientDocuments('ARTURO001').subscribe(docs => {
   *   console.log(`Found ${docs.length} documents for patient`);
   * });
   * ```
   */
  getPatientDocuments(patientId: string): Observable<PatientDocument[]> {
    const documents = this.documentDatabase.filter(doc => doc.patientId === patientId);
    return of(documents);
  }

  /**
   * Retrieves documents by patient name using fuzzy matching
   *
   * @param patientName - Patient name to search for
   * @returns Observable containing array of matching documents
   *
   * @example
   * ```typescript
   * this.documentService.getDocumentsByPatientName('Arturo').subscribe(docs => {
   *   console.log('Documents for patients with "Arturo":', docs);
   * });
   * ```
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
   * Retrieves a specific document by its ID
   *
   * @param documentId - Unique identifier for the document
   * @returns Observable containing the document or null if not found
   *
   * @example
   * ```typescript
   * this.documentService.getDocument('doc_001').subscribe(doc => {
   *   if (doc) {
   *     console.log('Document found:', doc.displayName);
   *   } else {
   *     console.log('Document not found');
   *   }
   * });
   * ```
   */
  getDocument(documentId: string): Observable<PatientDocument | null> {
    const document = this.documentDatabase.find(doc => doc.id === documentId);
    return of(document || null);
  }

  /**
   * Retrieves all patients with their associated documents grouped
   *
   * @returns Observable containing array of patient document groups
   *
   * @example
   * ```typescript
   * this.documentService.getPatientsWithDocuments().subscribe(groups => {
   *   groups.forEach(group => {
   *     console.log(`${group.patientName}: ${group.documents.length} documents`);
   *   });
   * });
   * ```
   */
  getPatientsWithDocuments(): Observable<PatientDocumentGroup[]> {
    const grouped = this.groupDocumentsByPatient();
    return of(grouped);
  }

  /**
   * Retrieves documents filtered by type
   *
   * @param type - Document type to filter by ('CONS' for consultation, 'EMER' for emergency, 'LAB' for laboratory, etc.)
   * @returns Observable containing array of documents of the specified type
   *
   * @example
   * ```typescript
   * this.documentService.getDocumentsByType('CONS').subscribe(consultations => {
   *   console.log(`Found ${consultations.length} consultation documents`);
   * });
   * ```
   */
  getDocumentsByType(type: 'CONS' | 'EMER' | 'LAB' | 'RAD' | 'CIR' | 'INT' | 'HOSP' | 'FARM' | 'IMAGEN' | 'REPORTE'): Observable<PatientDocument[]> {
    const documents = this.documentDatabase.filter(doc => doc.type === type);
    return of(documents);
  }

  /**
   * Maps patient objects to their associated documents with smart matching
   *
   * @param patient - Patient object with optional ID and name
   * @returns Observable containing array of documents for the patient
   *
   * @description First attempts to match by patient ID, then falls back to name matching
   * for more flexible patient-to-document associations
   *
   * @example
   * ```typescript
   * const patient = { id: 'ARTURO001', name: 'Arturo Herrera' };
   * this.documentService.mapPatientToDocuments(patient).subscribe(docs => {
   *   console.log(`Mapped ${docs.length} documents to patient`);
   * });
   * ```
   */
  mapPatientToDocuments(patient: { id?: string, name: string, nombre_paciente?: string }): Observable<PatientDocument[]> {
    // Use the real API to get patient documents
    return this.getPatientDocumentsFromAPI(patient);
  }

  /**
   * Gets patient documents from the real API using patient name
   *
   * @param patient - Patient object with name information
   * @returns Observable containing array of documents for the patient
   *
   * @description Uses the backend API endpoint to fetch real patient documents
   * and converts them to the local PatientDocument format
   */
  private getPatientDocumentsFromAPI(patient: { id?: string, name: string, nombre_paciente?: string }): Observable<PatientDocument[]> {
    // Determine which name to use for the API call
    const patientName = patient.nombre_paciente || patient.name;

    if (!patientName) {
      console.warn('⚠️ No patient name available for document search');
      return of([]);
    }

    console.log(`🔍 Searching documents for patient: "${patientName}"`);

    return this.apiService.getPatientDocuments(patientName, {
      user_id: 'pedro',
      limit: 50,
      skip: 0
    }).pipe(
      map(response => {
        console.log(`📄 API returned ${response.documents.length} documents for "${patientName}"`);
        return this.convertApiDocumentsToLocal(response.documents);
      }),
      catchError(error => {
        console.error('❌ Error fetching patient documents from API:', error);
        // Fallback to static documents if API fails
        return this.mapPatientToDocumentsStatic(patient);
      })
    );
  }

  /**
   * Converts API documents to local PatientDocument format
   *
   * @param apiDocuments - Documents from the API
   * @returns Array of local PatientDocument objects
   */
  private convertApiDocumentsToLocal(apiDocuments: ApiPatientDocument[]): PatientDocument[] {
    return apiDocuments.map(apiDoc => ({
      id: apiDoc.document_id,
      fileName: apiDoc.filename,
      displayName: this.generateDisplayName(apiDoc),
      type: this.extractDocumentType(apiDoc.categoria || apiDoc.filename),
      patientId: apiDoc.expediente,
      patientName: apiDoc.nombre_paciente,
      url: this.generateDocumentUrl(apiDoc),
      uploadDate: new Date(apiDoc.created_at)
    }));
  }

  /**
   * Generates a user-friendly display name for a document
   *
   * @param apiDoc - API document object
   * @returns User-friendly display name
   */
  private generateDisplayName(apiDoc: ApiPatientDocument): string {
    const type = this.extractDocumentType(apiDoc.categoria || apiDoc.filename);
    const episodeNumber = apiDoc.numero_episodio;

    if (type === 'CONS') {
      return `Historia Clínica - Consulta${episodeNumber ? ` #${episodeNumber}` : ''}`;
    } else if (type === 'EMER') {
      return `Atención de Emergencia${episodeNumber ? ` #${episodeNumber}` : ''}`;
    } else {
      return `Documento Médico${episodeNumber ? ` #${episodeNumber}` : ''}`;
    }
  }

  /**
   * Extracts document type from category or filename
   *
   * @param categoryOrFilename - Category or filename to extract type from
   * @returns Document type (CONS, EMER, LAB, RAD, CIR, INT, HOSP, FARM, IMAGEN, REPORTE)
   */
  private extractDocumentType(categoryOrFilename: string): 'CONS' | 'EMER' | 'LAB' | 'RAD' | 'CIR' | 'INT' | 'HOSP' | 'FARM' | 'IMAGEN' | 'REPORTE' {
    const normalized = categoryOrFilename.toUpperCase();

    if (normalized.includes('CONS')) {
      return 'CONS';
    } else if (normalized.includes('EMER')) {
      return 'EMER';
    } else if (normalized.includes('LAB')) {
      return 'LAB';
    } else if (normalized.includes('RAD')) {
      return 'RAD';
    } else if (normalized.includes('CIR')) {
      return 'CIR';
    } else if (normalized.includes('INT')) {
      return 'INT';
    } else if (normalized.includes('HOSP')) {
      return 'HOSP';
    } else if (normalized.includes('FARM')) {
      return 'FARM';
    } else if (normalized.includes('IMAGEN')) {
      return 'IMAGEN';
    } else if (normalized.includes('REPORTE')) {
      return 'REPORTE';
    } else {
      return 'CONS'; // Default to consultation
    }
  }

  /**
   * Generates URL for document access
   *
   * @param apiDoc - API document object
   * @returns URL string for document access
   */
  private generateDocumentUrl(apiDoc: ApiPatientDocument): string {
    // Priority 1: Use blob URL if available from storage
    if (apiDoc.storage_info?.blob_url) {
      console.log(`📄 Using blob URL for document: ${apiDoc.filename}`);
      return apiDoc.storage_info.blob_url;
    }

    // Priority 2: Construct URL using document ID for backend endpoint
    if (apiDoc.document_id) {
              const backendUrl = 'http://localhost:3000/api/v1'; // TODO: Use environment config
              const documentUrl = `${backendUrl}/documents/${apiDoc.document_id}`;
      console.log(`📄 Using backend document endpoint: ${apiDoc.filename} -> ${documentUrl}`);
      return documentUrl;
    }

    // Priority 3: Try to construct from filename if it exists in public assets
    if (apiDoc.filename) {
      const publicUrl = `/assets/documents/${apiDoc.filename}`;
      console.log(`📄 Using public asset URL for document: ${apiDoc.filename} -> ${publicUrl}`);
      return publicUrl;
    }

    // Fallback: Placeholder PDF
    console.warn(`⚠️ No valid URL found for document: ${apiDoc.filename}, using placeholder`);
    return 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
  }

  /**
   * Fallback method using static documents (original implementation)
   *
   * @param patient - Patient object
   * @returns Observable containing array of static documents
   */
  private mapPatientToDocumentsStatic(patient: { id?: string, name: string }): Observable<PatientDocument[]> {
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
   * Groups documents by patient for organized display
   *
   * @private
   * @returns Array of patient document groups
   *
   * @description Creates a Map-based grouping to efficiently organize documents
   * by patient ID while maintaining patient information
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
   * Normalizes strings for search operations
   *
   * @private
   * @param str - String to normalize
   * @returns Normalized string without accents, lowercase, alphanumeric only
   *
   * @description Removes accents, converts to lowercase, and strips special characters
   * for improved search matching across different input formats
   *
   * @example
   * ```typescript
   * normalizeString('José María'); // returns 'jose maria'
   * normalizeString('PÉREZ-GARCÍA'); // returns 'perez garcia'
   * ```
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
   * Generates URL for document access
   *
   * @param document - Document to generate URL for
   * @returns URL string for document access
   *
   * @description Generates appropriate URL for document viewing or download.
   * In MVP uses relative URLs, in production would use backend endpoints
   *
   * @example
   * ```typescript
   * const url = this.documentService.getDocumentUrl(document);
   * // Returns: '/api/documents/view/doc_001'
   * ```
   */
  getDocumentUrl(document: PatientDocument): string {
    // En MVP usamos URLs relativas, en producción sería del backend
    return `/api/documents/view/${document.id}`;
  }

  /**
   * Validates document access permissions
   *
   * @param documentId - Document ID to validate
   * @returns Observable containing true if document is accessible, false otherwise
   *
   * @description Checks if a document exists and is accessible to the current user.
   * In production would include proper access control validation
   *
   * @example
   * ```typescript
   * this.documentService.validateDocumentAccess('doc_001').subscribe(canAccess => {
   *   if (canAccess) {
   *     console.log('Document is accessible');
   *   } else {
   *     console.log('Document access denied');
   *   }
   * });
   * ```
   */
  validateDocumentAccess(documentId: string): Observable<boolean> {
    const document = this.documentDatabase.find(doc => doc.id === documentId);
    return of(!!document);
  }
}
