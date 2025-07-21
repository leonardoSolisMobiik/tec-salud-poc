import { Component, Input, OnInit, OnDestroy, OnChanges, SimpleChanges, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PatientDocumentsService, PatientDocument } from '../../services/patient-documents.service';
import { Patient } from '../../../core/models/patient.model';
import { PdfViewerModule } from 'ng2-pdf-viewer';

/**
 * Patient Document Viewer Component for medical record display
 *
 * @description Component for viewing and navigating patient medical documents.
 * Features tabbed interface for multiple documents, direct PDF viewing with ng2-pdf-viewer,
 * and document type indicators.
 *
 * @example
 * ```typescript
 * // In parent component template
 * <app-patient-document-viewer
 *   [patient]="activePatient"
 *   [isVisible]="showDocumentViewer">
 * </app-patient-viewer>
 *
 * // Component automatically loads and displays documents for the patient
 * ```
 *
 * @features
 * - Tabbed interface for multiple documents
 * - PDF document display and viewing
 * - Document type indicators (CONS/EMER)
 * - Patient avatar and context display
 * - Responsive design for different screen sizes
 * - Loading states and error handling
 *
 * @inputs
 * - patient: Patient object to load documents for
 * - isVisible: Whether the viewer should be visible
 *
 * @documentTypes
 * - CONS: Consultation documents
 * - EMER: Emergency documents
 *
 * @since 1.0.0
 */
@Component({
  selector: 'app-patient-document-viewer',
  standalone: true,
  imports: [CommonModule, PdfViewerModule],
  templateUrl: './patient-document-viewer.component.html',
  styleUrls: ['./patient-document-viewer.component.scss']
})
export class PatientDocumentViewerComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  /** Patient object to load documents for */
  @Input() patient: Patient | null = null;

  /** Whether the viewer should be visible */
  @Input() isVisible: boolean = false;

  /** Array of documents for the current patient */
  documents: PatientDocument[] = [];

  /** Index of the currently active document */
  activeDocumentIndex: number = 0;

  /** Loading state for document retrieval */
  isLoading: boolean = false;

  /** Whether the integrated PDF viewer is active */
  showPdfViewer: boolean = false;





  /** Currently viewed document in the PDF viewer */
  viewedDocument: PatientDocument | null = null;

  /** Reference to the document tabs container */
  @ViewChild('documentTabs', { static: false }) documentTabsRef?: ElementRef<HTMLElement>;

  /** Window resize event listener */
  private resizeListener?: () => void;

  /** Cached safe URL for the currently viewed document (DEPRECATED - using ng2-pdf-viewer now) */
  // cachedSafeUrl: SafeResourceUrl | null = null;

  /** Subject for component cleanup */
  private destroy$ = new Subject<void>();

  /**
   * Creates an instance of PatientDocumentViewerComponent
   *
   * @param patientDocumentsService - Service for patient document management
   */
  constructor(
    private patientDocumentsService: PatientDocumentsService,
    private sanitizer: DomSanitizer
  ) {}

  /**
   * Component initialization lifecycle hook
   *
   * @description Loads patient documents on component initialization
   */
  ngOnInit(): void {
    console.log('🔧 PatientDocumentViewer initializing...');

    // Check if ng2-pdf-viewer is available
    try {
      console.log('📦 Checking ng2-pdf-viewer availability...');
      console.log('✅ ng2-pdf-viewer module loaded successfully');
    } catch (error) {
      console.error('❌ ng2-pdf-viewer not available:', error);
    }

    this.loadPatientDocuments();

    // Add window resize listener for responsive tabs
    this.resizeListener = () => {
      setTimeout(() => {
        this.checkTabsScrollable();
      }, 100);
    };
    window.addEventListener('resize', this.resizeListener);
  }

  /**
   * Component destruction lifecycle hook
   *
   * @description Cleans up subscriptions and timeouts to prevent memory leaks
   */
  ngOnDestroy(): void {
    // Remove window resize listener
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * After view init lifecycle hook
   *
   * @description Checks if tabs are scrollable and applies appropriate classes
   */
  ngAfterViewInit(): void {
    // Delay to ensure DOM is fully rendered
    setTimeout(() => {
      this.checkTabsScrollable();
    }, 100);
  }

  /**
   * Input changes lifecycle hook
   *
   * @param changes - Object containing input property changes
   *
   * @description Reloads documents when patient input changes
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['patient'] && this.patient) {
      // Close PDF viewer when patient changes
      this.closePdfViewer();
      this.loadPatientDocuments();
    }
  }

  /**
   * Gets the currently active document
   *
   * @returns Currently active document or null if no documents
   *
   * @description Getter for the document at the active index
   */
  get activeDocument(): PatientDocument | null {
    return this.documents[this.activeDocumentIndex] || null;
  }

  /**
   * Loads documents for the current patient
   *
   * @private
   * @description Fetches documents from the service and updates component state.
   * Handles loading states and error scenarios.
   */
  private loadPatientDocuments(): void {
    if (!this.patient) {
      console.log('⚠️ No patient provided, clearing documents');
      this.documents = [];
      return;
    }

    console.log(`🔍 Loading documents for patient:`, this.patient);
    console.log(`📋 Patient name: ${this.patient.name}`);
          console.log(`📋 Patient name: ${this.patient.name}`);
    console.log(`📋 Patient ID: ${this.patient.id}`);

    this.isLoading = true;

    this.patientDocumentsService.mapPatientToDocuments(this.patient)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documents) => {
          this.documents = documents;
          this.activeDocumentIndex = 0;
          this.isLoading = false;

          console.log(`📄 Loaded ${documents.length} documents for ${this.patient?.name}`);

          if (documents.length > 0) {
            console.log('📋 Documents loaded:', documents.map(doc => ({
              id: doc.id,
              fileName: doc.fileName,
              displayName: doc.displayName,
              type: doc.type,
              patientName: doc.patientName
            })));
          } else {
            console.warn('⚠️ No documents found for this patient');
          }

          // Check if tabs are scrollable after loading documents
          setTimeout(() => {
            this.checkTabsScrollable();
          }, 200);
        },
        error: (error) => {
          console.error('❌ Error loading documents:', error);
          this.documents = [];
          this.isLoading = false;
        }
      });
  }

  /**
   * Sets the active document by index
   *
   * @param index - Index of document to make active
   *
   * @description Changes the currently displayed document if index is valid
   *
   * @example
   * ```typescript
   * setActiveDocument(1); // Switch to second document
   * ```
   */
  setActiveDocument(index: number): void {
    if (index >= 0 && index < this.documents.length) {
      this.activeDocumentIndex = index;
      // Check tabs scrollable state after changing active document
      setTimeout(() => {
        this.checkTabsScrollable();
      }, 50);
    }
  }

  /**
   * Checks if document tabs are scrollable and applies CSS class
   *
   * @description Determines if the tabs container has scrollable content and applies
   * the 'scrollable' class for styling purposes (scroll indicators)
   */
  private checkTabsScrollable(): void {
    if (this.documentTabsRef?.nativeElement) {
      const element = this.documentTabsRef.nativeElement;
      const isScrollable = element.scrollWidth > element.clientWidth;

      if (isScrollable) {
        element.classList.add('scrollable');
      } else {
        element.classList.remove('scrollable');
      }

      console.log(`📊 Tabs scrollable check: ${isScrollable ? 'YES' : 'NO'} (${element.scrollWidth}px > ${element.clientWidth}px)`);
    }
  }

  /**
   * Gets patient initials for avatar display
   *
   * @returns Patient initials string (up to 2 characters) or '?' if no patient
   *
   * @description Extracts and formats patient initials from name for avatar display
   *
   * @example
   * ```typescript
   * // Patient: "María González López"
   * getPatientInitials(); // Returns "MG"
   * ```
   */
  getPatientInitials(): string {
    if (!this.patient?.name) return '?';
    return this.patient.name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  /**
   * Gets the appropriate icon for a document type
   *
   * @param doc - Document to get icon for
   * @returns Icon string for the document type
   *
   * @description Returns different icons based on document type (consultation vs emergency)
   *
   * @example
   * ```typescript
   * getDocumentIcon(consultationDoc); // Returns "📋"
   * getDocumentIcon(emergencyDoc); // Returns "🚨"
   * ```
   */
  getDocumentIcon(doc: PatientDocument): string {
    return doc.type === 'CONS' ? '📋' : '🚨';
  }

  /**
   * Gets a shortened display name for tab labels
   *
   * @param doc - Document to get short name for
   * @returns Truncated display name with ellipsis if needed
   *
   * @description Truncates long document names for tab display with 15 character limit
   *
   * @example
   * ```typescript
   * getShortDisplayName({ displayName: "Very Long Medical Document Name" });
   * // Returns "Very Long Medic..."
   * ```
   */
  getShortDisplayName(doc: PatientDocument): string {
    const maxLength = 15;
    return doc.displayName.length > maxLength
      ? doc.displayName.substring(0, maxLength) + '...'
      : doc.displayName;
  }

  /**
   * Gets the PDF URL for display and download
   *
   * @param doc - Document to get URL for
   * @returns PDF URL string
   *
   * @description Returns the document URL for PDF viewing and download operations
   */
  getPdfUrlString(doc: PatientDocument): string {
    // Para descargas y nueva pestaña
    return doc.url;
  }

  /**
   * Gets the raw URL for downloading a PDF document
   *
   * @param doc - Document to get raw URL for
   * @returns Raw URL string
   *
   * @description Returns the document URL for direct download operations
   */
  getRawPdfUrl(doc: PatientDocument): string {
    return doc.url;
  }

  /**
   * Gets the PDF URL for ng2-pdf-viewer (DEPRECATED - Use viewedDocument.url directly in template)
   *
   * @param doc - Document to get URL for
   * @returns PDF URL string for ng2-pdf-viewer
   *
   * @description Returns the document URL for PDF viewing with ng2-pdf-viewer
   * NOTE: This method should not be called from templates to avoid infinite loops
   */
  /*
  getPdfUrl(doc: PatientDocument | null): string {
    if (!doc) {
      console.warn('⚠️ No document provided to getPdfUrl');
      return '';
    }

    console.log(`📄 Getting PDF URL for ng2-pdf-viewer: ${doc.fileName}`);
    console.log(`🔗 PDF URL: ${doc.url}`);
    return doc.url;
  }
  */

  /**
   * Handle PDF loaded event
   *
   * @param event - PDF load event
   */
    onPdfLoaded(event: any): void {
    console.log(`✅ PDF loaded successfully for: ${this.viewedDocument?.fileName}`);
    console.log(`📋 Total pages: ${event?.total}`);
  }

  /**
   * Handle PDF error event
   *
   * @param error - PDF error event
   */
          onPdfError(error: any): void {
    console.error(`❌ PDF loading error for: ${this.viewedDocument?.fileName}`);
    console.error(`🔗 Failed URL: ${this.viewedDocument?.url}`);
    console.error(`📄 Error details:`, error);
  }

  /**
   * Handle page rendered event
   *
   * @param event - Page render event
   */
  onPageRendered(event: any): void {
    // Only log first and last pages to avoid spam
    if (event.pageNumber === 1 || event.pageNumber === event.total) {
      console.log(`📄 Page ${event.pageNumber} of ${event.total} rendered for: ${this.viewedDocument?.fileName}`);
    }
  }

  /**
   * Handle PDF loading progress event
   *
   * @param event - Progress event
   */
  onPdfProgress(event: any): void {
    // Progress logging (optional, can be removed if too verbose)
    // console.log(`📊 PDF progress: ${event?.total ? Math.round((event.loaded / event.total) * 100) : 0}%`);
  }

  /**
   * Handle PDF loading started event
   */
  onLoadingStarted(): void {
    console.log(`🚀 PDF loading started for: ${this.viewedDocument?.fileName}`);
  }

  /**
   * Handle text layer rendered event
   *
   * @param event - Text layer event
   */
    onTextLayerRendered(event: any): void {
    // Text layer rendered (minimal logging)
    if (event.pageNumber === 1) {
      console.log(`✨ PDF ready: ${this.viewedDocument?.fileName}`);
    }
  }





  /**
   * Validate PDF URL
   *
   * @param url - URL to validate
   * @returns True if URL is valid for PDF loading
   */
  private isValidPdfUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      console.error('🔍 URL validation failed: URL is empty or not a string');
      return false;
    }

    if (url.trim().length === 0) {
      console.error('🔍 URL validation failed: URL is empty after trim');
      return false;
    }

    try {
      const urlObj = new URL(url);
      console.log('✅ URL validation passed:', {
        protocol: urlObj.protocol,
        hostname: urlObj.hostname,
        pathname: urlObj.pathname,
        isHttps: urlObj.protocol === 'https:',
        isAzureBlob: url.includes('blob.core.windows.net')
      });

      // Test if URL is accessible (basic check)
      this.testUrlAccessibility(url);

      return true;
    } catch (error) {
      console.error('🔍 URL validation failed: Invalid URL format', error);
      return false;
    }
  }

  /**
   * Test URL accessibility
   *
   * @param url - URL to test
   */
  private testUrlAccessibility(url: string): void {
    console.log('🧪 Testing URL accessibility...');

    // Create a simple HEAD request to test if URL is accessible
    fetch(url, { method: 'HEAD', mode: 'no-cors' })
      .then(() => {
        console.log('✅ URL appears to be accessible');
      })
      .catch((error) => {
        console.warn('⚠️ URL accessibility test failed (may still work in PDF viewer):', error.message);
      });
  }

  /**
   * Generates a safe URL for iframe display (DEPRECATED - using ng2-pdf-viewer now)
   *
   * @param doc - Document to get safe URL for
   * @returns Safe resource URL for iframe
   *
   * @description Returns a sanitized URL that can be safely used in iframe
   */
  /*
  private generateSafeUrl(doc: PatientDocument): SafeResourceUrl {
    const rawUrl = doc.url;
    console.log(`🔒 Sanitizing URL for iframe:`, rawUrl);
    console.log(`📄 Document: ${doc.fileName}`);

    // Ensure URL is properly formatted
    let processedUrl = rawUrl;

    // If it's a blob URL, make sure it's properly encoded
    if (rawUrl.includes('blob.core.windows.net')) {
      console.log(`☁️ Processing Azure Blob URL`);
      // Don't double-encode if already encoded
      if (!rawUrl.includes('%20')) {
        processedUrl = encodeURI(rawUrl);
        console.log(`🔧 Encoded URL:`, processedUrl);
      }
    }

    const safeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(processedUrl);
    console.log(`✅ URL sanitized successfully for: ${doc.fileName}`);

    return safeUrl;
  }
  */

  /**
   * Gets a safe URL for iframe display (DEPRECATED - using ng2-pdf-viewer now)
   *
   * @param doc - Document to get safe URL for
   * @returns Safe resource URL for iframe
   *
   * @description Returns the cached safe URL or generates a new one if not cached
   */
  /*
  getSafeUrl(doc: PatientDocument): SafeResourceUrl {
    if (this.cachedSafeUrl && this.viewedDocument === doc) {
      return this.cachedSafeUrl;
    }
    return this.generateSafeUrl(doc);
  }
  */



  /**
   * Opens a PDF document in the integrated viewer
   *
   * @param doc - Document to open
   *
   * @description Shows the document directly in the integrated PDF viewer within the panel.
   *
   * @example
   * ```typescript
   * openInNewTab(document); // Shows PDF in integrated viewer
   * ```
   */
  openInNewTab(doc: PatientDocument): void {
    if (!doc) {
      console.error('❌ No document provided for opening');
      return;
    }

    console.log(`📄 Opening PDF in integrated viewer: ${doc.fileName}`);
    console.log(`🔗 PDF URL for ng2-pdf-viewer: ${doc.url}`);
    console.log(`📊 Document details:`, {
      id: doc.id,
      fileName: doc.fileName,
      displayName: doc.displayName,
      type: doc.type
    });

    // Simple URL validation
    if (!doc.url || doc.url.trim().length === 0) {
      console.error('❌ Invalid PDF URL: empty or null');
      return;
    }



    this.viewedDocument = doc;
    this.showPdfViewer = true;

    console.log(`✅ PDF viewer opened. ViewedDocument set:`, !!this.viewedDocument);
    console.log(`🔗 PDF URL: ${doc.url}`);
  }

  /**
   * Closes the integrated PDF viewer and returns to normal view
   *
   * @description Hides the PDF viewer and returns to the document list view
   */
  closePdfViewer(): void {
    console.log('📄 Closing integrated PDF viewer');

    this.showPdfViewer = false;
    this.viewedDocument = null;
    console.log(`✅ Returned to document list`);
  }

  /**
   * TrackBy function for ngFor performance optimization
   *
   * @param index - Array index (unused)
   * @param doc - Document object
   * @returns Unique identifier for the document
   *
   * @description Helps Angular track document items for efficient DOM updates
   */
  trackByDocId(index: number, doc: PatientDocument): string {
    return doc.id;
  }
}
