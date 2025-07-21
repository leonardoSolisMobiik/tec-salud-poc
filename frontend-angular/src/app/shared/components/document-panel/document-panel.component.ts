import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { Patient } from '../../../core/models/patient.model';
import { PatientDocumentViewerComponent } from './patient-document-viewer.component';
import { PatientDocumentsService, PatientDocument } from '../../services/patient-documents.service';

/**
 * Document Panel Component for medical records display
 *
 * @description Side panel component that displays medical documents and records
 * for the currently active patient. Features collapsible design, patient context
 * awareness, and integration with the patient document viewer.
 *
 * @example
 * ```typescript
 * // In parent component template
 * <app-document-panel
 *   [activePatient]="currentPatient"
 *   [isCollapsed]="documentPanelCollapsed"
 *   (toggleCollapse)="onDocumentPanelToggle($event)">
 * </app-document-panel>
 *
 * // In parent component
 * onDocumentPanelToggle(isCollapsed: boolean) {
 *   this.documentPanelCollapsed = isCollapsed;
 * }
 * ```
 *
 * @features
 * - Collapsible side panel design
 * - Patient-specific document listing
 * - Document count display
 * - Patient initials avatar
 * - Responsive design with mobile support
 * - Integration with document viewer
 *
 * @inputs
 * - activePatient: Current patient for document context
 * - isCollapsed: Whether panel should be collapsed
 *
 * @outputs
 * - toggleCollapse: Emits when panel collapse state changes
 *
 * @since 1.0.0
 */
@Component({
  selector: 'app-document-panel',
  standalone: true,
  imports: [CommonModule, PatientDocumentViewerComponent],
  templateUrl: './document-panel.component.html',
  styleUrls: ['./document-panel.component.scss']
})
export class DocumentPanelComponent implements OnInit, OnDestroy {
  /** Current patient for document context */
  @Input() activePatient: Patient | null = null;

  /** Whether the panel should be collapsed */
  @Input() isCollapsed: boolean = true;

  /** Emits when panel collapse state changes */
  @Output() toggleCollapse = new EventEmitter<boolean>();

  /** Number of documents available for the current patient */
  documentCount: number = 0;

  /** Subject for component cleanup */
  private destroy$ = new Subject<void>();

  /**
   * Creates an instance of DocumentPanelComponent
   *
   * @param patientDocumentsService - Service for patient document management
   */
  constructor(
    private patientDocumentsService: PatientDocumentsService
  ) {}

  /**
   * Component initialization lifecycle hook
   *
   * @description Updates document count on component initialization
   */
  ngOnInit(): void {
    this.updateDocumentCount();
  }

  /**
   * Component destruction lifecycle hook
   *
   * @description Cleans up subscriptions to prevent memory leaks
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Input changes lifecycle hook
   *
   * @description Updates document count when patient changes
   */
  ngOnChanges(): void {
    this.updateDocumentCount();
  }

  /**
   * Toggles the panel between collapsed and expanded states
   *
   * @description Changes panel state and emits the new collapse state
   *
   * @example
   * ```typescript
   * // Called when user clicks collapse/expand button
   * togglePanel(); // Panel state changes and event is emitted
   * ```
   */
  togglePanel(): void {
    this.isCollapsed = !this.isCollapsed;
    this.toggleCollapse.emit(this.isCollapsed);
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
   * // Patient: "Juan Pérez García"
   * getPatientInitials(); // Returns "JP"
   *
   * // No patient
   * getPatientInitials(); // Returns "?"
   * ```
   */
  getPatientInitials(): string {
    if (!this.activePatient?.name) return '?';
    return this.activePatient.name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  /**
   * Updates the document count for the current patient
   *
   * @private
   * @description Fetches and updates the count of documents available for the active patient.
   * Sets count to 0 if no patient is selected or on error.
   */
  private updateDocumentCount(): void {
    if (!this.activePatient) {
      this.documentCount = 0;
      return;
    }

    this.patientDocumentsService.mapPatientToDocuments(this.activePatient)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (documents) => {
          this.documentCount = documents.length;
        },
        error: (error) => {
          console.error('Error obteniendo conteo de documentos:', error);
          this.documentCount = 0;
        }
      });
  }

  /**
   * Handles document viewer close event
   *
   * @description Closes the panel when document viewer is closed
   */
  onDocumentViewerClose(): void {
    this.togglePanel();
  }
}
