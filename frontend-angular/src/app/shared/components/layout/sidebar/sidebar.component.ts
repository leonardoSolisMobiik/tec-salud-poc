import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router'; // ⚡ AGREGAR: Para navegación al chat
import { Subject, takeUntil, debounceTime } from 'rxjs';
import { MedicalStateService } from '@core/services';
import { UiStateService } from '@core/services';
import { Patient } from '@core/models';
import { BambooModule } from '../../../bamboo.module'; // ✅ BAMBOO REACTIVADO - Versión 1.5.5 corrige errores de proyección

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    BambooModule // ✅ BAMBOO REQUERIDO POR CLIENTE
  ],
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  // Data properties
  recentPatients: Patient[] = [];
  searchResults: string[] = [];
  isSearching = false;

  constructor(
    public uiStateService: UiStateService,
    private medicalStateService: MedicalStateService,
    private router: Router // ⚡ AGREGAR: Para navegación al chat
  ) {
    // Setup search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      takeUntil(this.destroy$)
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Search input event handlers
  onSearchInputChange(query: string): void {
    this.searchSubject.next(query);
  }

  clearSearch(): void {
    this.searchResults = [];
    // Clear search results by searching with empty string
    this.medicalStateService.searchPatients('');
  }

  private performSearch(query: string): void {
    if (!query.trim()) {
      this.searchResults = [];
      return;
    }

    // The service handles the async operation and updates searchResults via observable
    this.medicalStateService.searchPatients(query);
  }

  // UI interaction methods
  toggleSidebar(): void {
    this.uiStateService.toggleSidebar();
  }

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

  // Utility methods
  trackByPatientId(index: number, patient: Patient): string {
    return patient.id;
  }

  getPatientInitials(patient: Patient): string {
    return patient.name
      .split(' ')
      .map((word: string) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  isPatientActive(patient: Patient): boolean {
    const activePatient = this.medicalStateService.activePatientValue;
    return activePatient?.id === patient.id;
  }

  getPatientCardClasses(patient: Patient): string {
    const baseClasses = 'patient-card';
    const activeClasses = this.isPatientActive(patient) ? 'active' : '';
    return `${baseClasses} ${activeClasses}`;
  }

  getCollapsedPatientClasses(patient: Patient): string {
    const baseClasses = 'collapsed-patient-avatar';
    const activeClasses = this.isPatientActive(patient) ? 'active' : '';
    return `${baseClasses} ${activeClasses}`;
  }
}