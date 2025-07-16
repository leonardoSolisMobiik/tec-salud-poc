import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject, BehaviorSubject, debounceTime, distinctUntilChanged, takeUntil, map, startWith, combineLatest } from 'rxjs';

import { UIStateService } from '../../../core/services/ui-state.service';
import { MedicalStateService } from '../../../core/services/medical-state.service';
import { Patient } from '../../../core/models/chat.model';

/**
 * Sidebar Component
 *
 * @description Medical sidebar component for patient navigation and search functionality.
 * Provides collapsible patient list with search capabilities and responsive behavior.
 *
 * @features
 * - Patient search with real-time filtering
 * - Responsive sidebar collapse/expand
 * - Patient selection and navigation
 * - Loading states management
 * - Keyboard navigation support
 *
 * @example
 * ```html
 * <app-sidebar></app-sidebar>
 * ```
 *
 * @since 1.0.0
 */
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar/sidebar.component.html',
  styleUrls: ['./sidebar/sidebar.component.scss'],
  standalone: true,
  imports: []
})
export class SidebarComponent implements OnInit, OnDestroy {
  // Services
  private readonly uiStateService = inject(UIStateService);
  private readonly medicalStateService = inject(MedicalStateService);
  private readonly router = inject(Router);

  // Component state
  searchQuery = '';
  private searchSubject = new BehaviorSubject<string>('');
  private destroy$ = new Subject<void>();

  // Observables
  patients$: Observable<Patient[]>;
  filteredPatients$: Observable<Patient[]>;
  selectedPatient$: Observable<Patient | null>;
  isSearching$: Observable<boolean>;
  isSidebarCollapsed$: Observable<boolean>;

  constructor() {
    // Initialize observables
    this.patients$ = this.medicalStateService.availablePatients$;
    this.selectedPatient$ = this.medicalStateService.selectedPatient$;
    this.isSearching$ = this.searchSubject.pipe(
      map(query => query.length > 0)
    );
    this.isSidebarCollapsed$ = this.uiStateService.isSidebarCollapsed$;

    // Setup filtered patients with search
    this.filteredPatients$ = combineLatest([
      this.patients$,
      this.searchSubject.pipe(
        debounceTime(300),
        distinctUntilChanged(),
        startWith('')
      )
    ]).pipe(
      map(([patients, searchQuery]) =>
        this.filterPatients(patients, searchQuery)
      )
    );
  }

  ngOnInit(): void {
    // Component initialization logic if needed
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Handle search input changes
   */
  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.searchSubject.next(query);
  }

  /**
   * Select a patient and navigate to chat
   */
  selectPatient(patient: Patient): void {
    this.medicalStateService.selectPatient(patient);

    // Navigate to medical chat if not already there
    if (!this.router.url.includes('/medical-chat')) {
      this.router.navigate(['/medical-chat']);
    }

    // Auto-collapse sidebar on mobile after selection
    if (window.innerWidth < 768) {
      this.uiStateService.setSidebarCollapsed(true);
    }
  }

  /**
   * Toggle sidebar collapse state
   */
  toggleSidebar(): void {
    this.uiStateService.toggleSidebar();
  }

  /**
   * Check if patient is currently selected
   */
  isPatientSelected(patient: Patient): boolean {
    const selected = this.medicalStateService.selectedPatient$.getValue();
    return selected?.expediente === patient.expediente;
  }

  /**
   * Clear search query
   */
  clearSearch(): void {
    this.searchQuery = '';
    this.searchSubject.next('');
  }

  /**
   * Filter patients based on search query
   */
  private filterPatients(patients: Patient[], searchQuery: string): Patient[] {
    if (!searchQuery.trim()) {
      return patients;
    }

    const query = searchQuery.toLowerCase().trim();
    return patients.filter(patient =>
      patient.nombre.toLowerCase().includes(query) ||
      patient.expediente.toLowerCase().includes(query)
    );
  }

  /**
   * Track function for ngFor optimization
   */
  trackByPatient(index: number, patient: Patient): string {
    return patient.expediente;
  }
}
