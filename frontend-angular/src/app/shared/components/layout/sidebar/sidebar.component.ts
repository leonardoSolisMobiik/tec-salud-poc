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
    console.log('🎯 PASO 1: Método selectPatient iniciado para:', patient.name);
    console.log('🎯 PASO 1a: ID del paciente:', patient.id);
    
    // 1. Activar el paciente en el estado
    console.log('🎯 PASO 2: Llamando a setActivePatient...');
    this.medicalStateService.setActivePatient(patient);
    console.log('🎯 PASO 2a: setActivePatient ejecutado');
    
    // 2. Verificar que se guardó correctamente
    const activePatientValue = this.medicalStateService.activePatientValue;
    console.log('🎯 PASO 3: Verificando paciente activo guardado:', activePatientValue?.name);
    
    // 3. Mostrar notificación
    console.log('🎯 PASO 4: Mostrando toast de confirmación...');
    this.uiStateService.showSuccessToast(`✅ Paciente ${patient.name} seleccionado - Navegando al chat`);
    console.log('🎯 PASO 4a: Toast mostrado');
    
    // 4. ⚡ NAVEGACIÓN INTELIGENTE: Solo navegar si no está en chat
    console.log('🎯 PASO 5: Verificando navegación...');
    console.log('🎯 PASO 5a: URL actual:', window.location.pathname);
    
    const currentUrl = window.location.pathname;
    const isAlreadyInChat = currentUrl === '/chat';
    
    if (isAlreadyInChat) {
      console.log('✅ ÉXITO: Ya está en el chat, no es necesario navegar');
      console.log('🎯 PASO 6: Chat ya activo para:', patient.name);
      
      // Verificar el estado del paciente inmediatamente
      setTimeout(() => {
        const finalPatient = this.medicalStateService.activePatientValue;
        console.log('🎯 PASO 7: Verificación final - paciente activo:', finalPatient?.name);
        console.log('🎯 PASO 7a: Chat habilitado correctamente');
      }, 100);
    } else {
      console.log('🎯 PASO 5b: Navegando a /chat desde:', currentUrl);
      
      this.router.navigate(['/chat']).then((success) => {
        console.log('🎯 PASO 6: Resultado de navegación - éxito:', success);
        console.log('🎯 PASO 6a: URL actual después de navegar:', window.location.pathname);
        
        if (success) {
          console.log('✅ ÉXITO: Navegación al chat exitosa para:', patient.name);
          
          // Verificar una vez más el estado del paciente
          setTimeout(() => {
            const finalPatient = this.medicalStateService.activePatientValue;
            console.log('🎯 PASO 7: Verificación final - paciente activo:', finalPatient?.name);
            console.log('🎯 PASO 7a: Chat debería estar habilitado ahora');
          }, 100);
        } else {
          console.error('❌ FALLO: La navegación retornó false');
        }
      }).catch((error) => {
        console.error('❌ ERROR: Error al navegar al chat:', error);
        this.uiStateService.showErrorToast('Error al abrir el chat');
      });
    }
    
    console.log('🎯 PASO 8: selectPatient terminado (navegación en curso...)');
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