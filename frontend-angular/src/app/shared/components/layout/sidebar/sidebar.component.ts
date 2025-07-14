import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { MedicalStateService } from '@core/services';
import { UiStateService } from '@core/services';
import { Patient } from '@core/models';
import { BambooModule } from '../../../bamboo.module';

/**
 * Sidebar Component for patient navigation and search
 * 
 * @description Main navigation sidebar that provides patient search functionality,
 * recent patients list, and responsive collapsible behavior. Integrates with
 * Bamboo Design System components and medical state management.
 * 
 * @example
 * ```typescript
 * // Used in app-shell layout
 * <app-sidebar></app-sidebar>
 * 
 * // Automatically provides:
 * // - Patient search with debouncing
 * // - Recent patients list with selection
 * // - Responsive collapse/expand behavior
 * // - Navigation to medical chat on patient selection
 * ```
 * 
 * @features
 * - Debounced patient search functionality
 * - Recent patients list with avatar initials
 * - Patient selection with automatic navigation
 * - Responsive collapsible design
 * - Active patient highlighting
 * - Bamboo Design System integration
 * - Mobile-optimized touch interactions
 * 
 * @responsive
 * - Mobile: Auto-collapse, overlay behavior
 * - Tablet: Reduced width, persistent
 * - Desktop: Full width, always visible
 * 
 * @interactions
 * - Search: Debounced typing triggers patient search
 * - Selection: Patient click navigates to chat with context
 * - Toggle: Header button controls sidebar visibility
 * 
 * @since 1.0.0
 */
@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    BambooModule
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  /** Subject for component cleanup */
  private destroy$ = new Subject<void>();
  
  /** Subject for debounced search input */
  private searchSubject = new Subject<string>();

  /** List of recent patients for quick access */
  recentPatients: Patient[] = [];
  
  /** Array of search results converted to display strings */
  searchResults: string[] = [];
  
  /** Flag indicating if search operation is in progress */
  isSearching = false;

  /**
   * Creates an instance of SidebarComponent
   * 
   * @param uiStateService - UI state service for sidebar behavior (public for template access)
   * @param medicalStateService - Medical state service for patient data
   * @param router - Angular router for navigation
   * 
   * @description Initializes the component with debounced search functionality
   * and service dependencies for patient management and navigation.
   */
  constructor(
    public uiStateService: UiStateService,
    private medicalStateService: MedicalStateService,
    private router: Router
  ) {
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  /**
   * Component initialization lifecycle hook
   * 
   * @description Sets up subscriptions to medical state service observables
   * for recent patients, search state, and search results. Handles reactive
   * updates to component state based on service changes.
   */
  ngOnInit(): void {
    console.log('SidebarComponent initialized');
    
    // Subscribe to recent patients
    this.medicalStateService.recentPatients$
      .pipe(takeUntil(this.destroy$))
      .subscribe((patients: Patient[]) => {
        console.log('SidebarComponent: Received patients in sidebar:', patients);
        console.log('SidebarComponent: Number of patients received:', patients ? patients.length : 0);
        this.recentPatients = patients;
        console.log('SidebarComponent: this.recentPatients updated:', this.recentPatients.length);
      });

    // Subscribe to search loading state
    this.medicalStateService.isSearching$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isSearching: boolean) => {
        this.isSearching = isSearching;
      });

    // Subscribe to search results  
    this.medicalStateService.searchResults$
      .pipe(takeUntil(this.destroy$))
      .subscribe((patients: Patient[]) => {
        // Convert patients to string array for search component
        this.searchResults = patients.map((p: Patient) => `${p.name} (ID: ${p.id})`);
      });
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
   * Handles search input changes with debouncing
   * 
   * @param query - Search query string from input
   * 
   * @description Feeds search input to debounced subject to prevent
   * excessive API calls while user is typing.
   * 
   * @example
   * ```typescript
   * onSearchInputChange('Juan'); // Triggers debounced search after 300ms
   * ```
   */
  onSearchInputChange(query: string): void {
    this.searchSubject.next(query);
  }

  /**
   * Clears current search results and state
   * 
   * @description Resets search results and triggers empty search
   * to return to default state showing recent patients.
   * 
   * @example
   * ```typescript
   * clearSearch(); // Clears results and shows recent patients
   * ```
   */
  clearSearch(): void {
    this.searchResults = [];
    // Clear search results by searching with empty string
    this.medicalStateService.searchPatients('');
  }

  /**
   * Performs patient search via medical state service
   * 
   * @private
   * @param query - Search query string
   * 
   * @description Delegates search operation to medical state service
   * which handles API calls and updates observable results.
   */
  private performSearch(query: string): void {
    if (!query.trim()) {
      this.searchResults = [];
      return;
    }

    // The service handles the async operation and updates searchResults via observable
    this.medicalStateService.searchPatients(query);
  }

  /**
   * Toggles sidebar open/closed state
   * 
   * @description Delegates to UI state service to toggle sidebar visibility.
   * Used by mobile menu toggle and other UI interactions.
   * 
   * @example
   * ```typescript
   * toggleSidebar(); // Sidebar opens/closes based on current state
   * ```
   */
  toggleSidebar(): void {
    this.uiStateService.toggleSidebar();
  }

  /**
   * Selects a patient and navigates to medical chat
   * 
   * @param patient - Patient to select and activate
   * 
   * @description Sets the patient as active in medical state and navigates
   * to the medical chat interface. Shows success/error toast notifications
   * based on operation result.
   * 
   * @example
   * ```typescript
   * selectPatient(patient); // Sets active patient and navigates to chat
   * ```
   */
  selectPatient(patient: Patient): void {
    console.log('🎯 SidebarComponent.selectPatient called for:', patient.name);
    
    // Use the centralized method that guarantees state preservation
    this.medicalStateService.selectPatientAndNavigate(patient, this.router).then((success) => {
      if (success) {
        console.log('✅ Patient selection successful from sidebar:', patient.name);
        this.uiStateService.showSuccessToast(`✅ Paciente ${patient.name} seleccionado correctamente`);
      } else {
        console.error('❌ Patient selection failed from sidebar:', patient.name);
        this.uiStateService.showErrorToast(`❌ Error al seleccionar paciente ${patient.name}`);
      }
    });
  }

  /**
   * TrackBy function for ngFor performance optimization
   * 
   * @param index - Array index (unused)
   * @param patient - Patient object
   * @returns Unique identifier for the patient
   * 
   * @description Helps Angular track patient items for efficient DOM updates
   */
  trackByPatientId(index: number, patient: Patient): string {
    return patient.id;
  }

  /**
   * Gets patient initials for avatar display
   * 
   * @param patient - Patient to get initials for
   * @returns Patient initials string (up to 2 characters)
   * 
   * @description Extracts first letters from patient name words for avatar display
   * 
   * @example
   * ```typescript
   * getPatientInitials(patient); // "JD" for "John Doe"
   * ```
   */
  getPatientInitials(patient: Patient): string {
    return patient.name
      .split(' ')
      .map((word: string) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  /**
   * Checks if a patient is currently active/selected
   * 
   * @param patient - Patient to check
   * @returns True if patient is currently active
   * 
   * @description Compares patient ID with currently active patient ID
   * 
   * @example
   * ```typescript
   * isPatientActive(patient); // true if this patient is selected
   * ```
   */
  isPatientActive(patient: Patient): boolean {
    const activePatient = this.medicalStateService.activePatientValue;
    return activePatient?.id === patient.id;
  }

  /**
   * Gets CSS classes for patient card styling
   * 
   * @param patient - Patient to get classes for
   * @returns Space-separated CSS class string
   * 
   * @description Returns appropriate CSS classes including active state
   * for patient card styling in expanded sidebar view.
   * 
   * @example
   * ```typescript
   * getPatientCardClasses(patient); // "patient-card active" if selected
   * ```
   */
  getPatientCardClasses(patient: Patient): string {
    const baseClasses = 'patient-card';
    const activeClasses = this.isPatientActive(patient) ? 'active' : '';
    return `${baseClasses} ${activeClasses}`;
  }

  /**
   * Gets CSS classes for collapsed patient avatar styling
   * 
   * @param patient - Patient to get classes for
   * @returns Space-separated CSS class string
   * 
   * @description Returns appropriate CSS classes including active state
   * for patient avatar styling in collapsed sidebar view.
   * 
   * @example
   * ```typescript
   * getCollapsedPatientClasses(patient); // "collapsed-patient-avatar active"
   * ```
   */
  getCollapsedPatientClasses(patient: Patient): string {
    const baseClasses = 'collapsed-patient-avatar';
    const activeClasses = this.isPatientActive(patient) ? 'active' : '';
    return `${baseClasses} ${activeClasses}`;
  }
}