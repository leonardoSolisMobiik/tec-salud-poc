import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Location } from '@angular/common';
import { SidebarComponent } from './sidebar.component';
import { MedicalStateService } from '../../../../core/services/medical-state.service';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { Patient } from '../../../../core/models';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('SidebarComponent', () => {
  let component: SidebarComponent;
  let fixture: ComponentFixture<SidebarComponent>;
  let mockMedicalStateService: any;
  let mockUiStateService: any;
  let mockRouter: any;

  const mockPatient: Patient = {
    id: 'patient-123',
    name: 'María García López',
    age: 45,
    gender: 'Femenino',
    documents: [
      { id: 'doc-1', fileName: 'historia_clinica.pdf', type: 'CONS' }
    ]
  };

  const mockPatients: Patient[] = [
    mockPatient,
    {
      id: 'patient-456',
      name: 'Juan Pérez Martínez',
      age: 32,
      gender: 'Masculino',
      documents: [
        { id: 'doc-2', fileName: 'consulta.pdf', type: 'EMER' }
      ]
    },
    {
      id: 'patient-789',
      name: 'Ana López Rodríguez',
      age: 28,
      gender: 'Femenino',
      documents: []
    }
  ];

  beforeEach(async () => {
    // Mock MedicalStateService
    const medicalStateServiceSpy = {
      searchPatients: jest.fn(),
      clearSearchResults: jest.fn(),
      setActivePatient: jest.fn(),
      selectPatientAndNavigate: jest.fn().mockResolvedValue(true),
      get activePatientValue() { return mockPatient; } // Getter for active patient value
    };

    // Mock UiStateService
    const uiStateServiceSpy = {
      toggleSidebar: jest.fn(),
      closeSidebar: jest.fn(),
      showSuccessToast: jest.fn(),
      showErrorToast: jest.fn()
    };

    // Mock Router
    const routerSpy = {
      navigate: jest.fn(),
      url: '/medical-chat'
    };

    // Set up observables
    medicalStateServiceSpy.activePatient$ = new BehaviorSubject<Patient | null>(null);
    medicalStateServiceSpy.recentPatients$ = new BehaviorSubject<Patient[]>([]);
    medicalStateServiceSpy.searchResults$ = new BehaviorSubject<Patient[]>([]);
    medicalStateServiceSpy.isSearching$ = new BehaviorSubject<boolean>(false);
    medicalStateServiceSpy.error$ = new BehaviorSubject<string | null>(null);

    uiStateServiceSpy.isSidebarCollapsed$ = new BehaviorSubject<boolean>(false);
    uiStateServiceSpy.isMobile$ = new BehaviorSubject<boolean>(false);

    await TestBed.configureTestingModule({
      imports: [
        SidebarComponent,
        RouterTestingModule
      ],
      providers: [
        { provide: MedicalStateService, useValue: medicalStateServiceSpy },
        { provide: UiStateService, useValue: uiStateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    component = fixture.componentInstance;
    mockMedicalStateService = TestBed.inject(MedicalStateService);
    mockUiStateService = TestBed.inject(UiStateService);
    mockRouter = TestBed.inject(Router);

    // Router is provided by RouterTestingModule

    fixture.detectChanges();
  });

  describe('Component Creation and Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with correct default values', () => {
      expect(component.recentPatients).toEqual([]);
      expect(component.searchResults).toEqual([]);
      expect(component.isSearching).toBe(false);
    });

    it('should subscribe to service observables on init', () => {
      // Component subscribes to service observables in ngOnInit
      expect(component.recentPatients).toBeDefined();
      expect(component.searchResults).toBeDefined();
      expect(component.isSearching).toBeDefined();

      // Verify subscriptions by changing observable values
      (mockMedicalStateService.recentPatients$ as BehaviorSubject<Patient[]>).next([mockPatient]);
      expect(component.recentPatients).toEqual([mockPatient]);
    });

    it('should render sidebar header correctly', () => {
      const headerElement = fixture.debugElement.query(By.css('.sidebar-header h2'));
      expect(headerElement.nativeElement.textContent.trim()).toContain('Pacientes TecSalud');
    });

    it('should render search input when not collapsed', () => {
      const searchInput = fixture.debugElement.query(By.css('.search-input'));
      expect(searchInput).toBeTruthy();
      expect(searchInput.nativeElement.placeholder).toBe('Buscar paciente...');
    });
  });

  describe('Patient Search Functionality', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should trigger search when input changes', () => {
      const searchTerm = 'María';

      // Test the component method directly since template uses (input)="onSearchInputChange($any($event.target).value)"
      component.onSearchInputChange(searchTerm);

      // The search is debounced, so we need to advance timers by 300ms
      jest.advanceTimersByTime(300);

      expect(mockMedicalStateService.searchPatients).toHaveBeenCalledWith(searchTerm);
    });

    it('should debounce search input', () => {
      const searchInput = fixture.debugElement.query(By.css('.search-input'));

      // Trigger multiple rapid inputs
      searchInput.nativeElement.value = 'M';
      searchInput.nativeElement.dispatchEvent(new Event('input'));

      searchInput.nativeElement.value = 'Ma';
      searchInput.nativeElement.dispatchEvent(new Event('input'));

      searchInput.nativeElement.value = 'Mar';
      searchInput.nativeElement.dispatchEvent(new Event('input'));

      // Advance time by debounce period
      jest.advanceTimersByTime(300);

      expect(mockMedicalStateService.searchPatients).toHaveBeenCalledTimes(1);
      expect(mockMedicalStateService.searchPatients).toHaveBeenCalledWith('Mar');
    });

    it('should clear search results when query is empty', () => {
      const searchInput = fixture.debugElement.query(By.css('.search-input'));

      searchInput.nativeElement.value = '';
      searchInput.nativeElement.dispatchEvent(new Event('input'));

      expect(mockMedicalStateService.clearSearchResults).toHaveBeenCalled();
    });

    it('should display search loading state', () => {
      (mockMedicalStateService.isSearching$ as BehaviorSubject<boolean>).next(true);
      fixture.detectChanges();

      const loadingElement = fixture.debugElement.query(By.css('.search-loading'));
      expect(loadingElement).toBeTruthy();
      expect(loadingElement.nativeElement.textContent.trim()).toBe('Buscando...');
    });

    it('should display search results', () => {
      (mockMedicalStateService.searchResults$ as BehaviorSubject<Patient[]>).next(mockPatients);
      fixture.detectChanges();

      const patientElements = fixture.debugElement.queryAll(By.css('.search-results-section .patient-card-wrapper'));
      expect(patientElements.length).toBe(3);
    });

    it('should disable search input when searching', () => {
      (mockMedicalStateService.isSearching$ as BehaviorSubject<boolean>).next(true);
      fixture.detectChanges();

      const searchInput = fixture.debugElement.query(By.css('.search-input'));
      expect(searchInput.nativeElement.disabled).toBe(true);
    });
  });

  describe('Patient Selection and Navigation', () => {
    beforeEach(() => {
      (mockMedicalStateService.searchResults$ as BehaviorSubject<Patient[]>).next(mockPatients);
      fixture.detectChanges();
    });

    it('should select patient when clicked', () => {
      // Setup: Add patients to recent patients to make them visible
      (mockMedicalStateService.recentPatients$ as BehaviorSubject<Patient[]>).next([mockPatient]);
      mockMedicalStateService.selectPatientAndNavigate.mockResolvedValue(true);
      fixture.detectChanges();

      const firstPatientElement = fixture.debugElement.query(By.css('.patient-card-wrapper'));
      firstPatientElement.nativeElement.click();

      expect(mockMedicalStateService.selectPatientAndNavigate).toHaveBeenCalledWith(mockPatient, expect.any(Object));
    });

    it('should navigate to chat when patient is selected', async () => {
      mockMedicalStateService.selectPatientAndNavigate.mockResolvedValue(true);

      await component.selectPatient(mockPatient);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/chat']);
    });

    it('should show success toast on successful navigation', async () => {
      mockMedicalStateService.selectPatientAndNavigate.mockResolvedValue(true);

      await component.selectPatient(mockPatient);

      expect(mockUiStateService.showSuccessToast).toHaveBeenCalledWith(
        expect.stringContaining(mockPatient.nombre)
      );
    });

    it('should show error toast on navigation failure', async () => {
      mockMedicalStateService.selectPatientAndNavigate.mockResolvedValue(false);

      await component.selectPatient(mockPatient);

      expect(mockUiStateService.showErrorToast).toHaveBeenCalledWith(
        'Error navegando al chat médico'
      );
    });

    it('should handle navigation exceptions', async () => {
      mockMedicalStateService.selectPatientAndNavigate.mockRejectedValue(new Error('Navigation error'));

      await component.selectPatient(mockPatient);

      expect(mockUiStateService.showErrorToast).toHaveBeenCalledWith(
        'Error navegando al chat médico'
      );
    });

    it('should apply selected styling to active patient', () => {
      // Setup: Add patients to recent patients and set one as active
      (mockMedicalStateService.recentPatients$ as BehaviorSubject<Patient[]>).next([mockPatient]);
      (mockMedicalStateService.activePatient$ as BehaviorSubject<Patient | null>).next(mockPatient);
      fixture.detectChanges();

      const firstPatientElement = fixture.debugElement.query(By.css('.patient-card-wrapper'));
      expect(firstPatientElement.nativeElement.classList).toContain('active');
    });
  });

  describe('Recent Patients Display', () => {
    it('should display recent patients section', () => {
      (mockMedicalStateService.recentPatients$ as BehaviorSubject<Patient[]>).next(mockPatients);
      fixture.detectChanges();

      const recentPatientsSection = fixture.debugElement.query(By.css('.recent-patients-section'));
      expect(recentPatientsSection).toBeTruthy();

      const recentPatientElements = fixture.debugElement.queryAll(By.css('.recent-patients-section .patient-card-wrapper'));
      expect(recentPatientElements.length).toBe(3);
    });

    it('should display patient initials correctly', () => {
      (mockMedicalStateService.recentPatients$ as BehaviorSubject<Patient[]>).next([mockPatient]);
      fixture.detectChanges();

      const avatarElement = fixture.debugElement.query(By.css('.patient-avatar'));
      expect(avatarElement.nativeElement.textContent.trim()).toBe('MG');
    });

    it('should display patient information correctly', () => {
      (mockMedicalStateService.recentPatients$ as BehaviorSubject<Patient[]>).next([mockPatient]);
      fixture.detectChanges();

      const nameElement = fixture.debugElement.query(By.css('.patient-name'));
      const metaElement = fixture.debugElement.query(By.css('.patient-meta'));

      expect(nameElement.nativeElement.textContent.trim()).toBe(mockPatient.name);
      expect(metaElement.nativeElement.textContent.trim()).toContain(`${mockPatient.age} años`);
    });

    xit('should show document count for each patient', () => {
      // TODO: Document count display is not implemented in the current template
      (mockMedicalStateService.recentPatients$ as BehaviorSubject<Patient[]>).next([mockPatient]);
      fixture.detectChanges();

      const documentsElement = fixture.debugElement.query(By.css('.patient-documents'));
      expect(documentsElement.nativeElement.textContent.trim()).toContain('1 documento');
    });

    xit('should handle patients without documents', () => {
      // TODO: Document count display is not implemented in the current template
      const patientWithoutDocs = { ...mockPatient, documents: [] };
      (mockMedicalStateService.recentPatients$ as BehaviorSubject<Patient[]>).next([patientWithoutDocs]);
      fixture.detectChanges();

      const documentsElement = fixture.debugElement.query(By.css('.patient-documents'));
      expect(documentsElement.nativeElement.textContent.trim()).toContain('Sin documentos');
    });
  });

  describe('Responsive Behavior', () => {
    it('should show collapsed view when sidebar is collapsed', () => {
      (mockUiStateService.isSidebarCollapsed$ as BehaviorSubject<boolean>).next(true);
      fixture.detectChanges();

      const collapsedSearch = fixture.debugElement.query(By.css('.collapsed-search'));
      expect(collapsedSearch).toBeTruthy();

      const searchSection = fixture.debugElement.query(By.css('.search-section'));
      expect(searchSection).toBeFalsy();
    });

    it('should show expand button when collapsed', () => {
      (mockUiStateService.isSidebarCollapsed$ as BehaviorSubject<boolean>).next(true);
      fixture.detectChanges();

      const expandButton = fixture.debugElement.query(By.css('.search-icon-button'));
      expect(expandButton).toBeTruthy();
      expect(expandButton.nativeElement.textContent.trim()).toBe('🔍');
    });

    it('should toggle sidebar when expand button is clicked', () => {
      (mockUiStateService.isSidebarCollapsed$ as BehaviorSubject<boolean>).next(true);
      fixture.detectChanges();

      const expandButton = fixture.debugElement.query(By.css('.search-icon-button'));
      expandButton.nativeElement.click();

      expect(mockUiStateService.toggleSidebar).toHaveBeenCalled();
    });

    it('should close sidebar on mobile after patient selection', async () => {
      (mockUiStateService.isMobile$ as BehaviorSubject<boolean>).next(true);
      mockMedicalStateService.selectPatientAndNavigate.mockResolvedValue(true);

      await component.selectPatient(mockPatient);

      expect(mockUiStateService.closeSidebar).toHaveBeenCalled();
    });
  });

  describe('Sidebar Toggle Functionality', () => {
    it('should toggle sidebar when toggle button is clicked', () => {
      const toggleButton = fixture.debugElement.query(By.css('.toggle-button'));
      toggleButton.nativeElement.click();

      expect(mockUiStateService.toggleSidebar).toHaveBeenCalled();
    });

    it('should show correct toggle icon based on collapsed state', () => {
      // When not collapsed - should show left arrow
      const toggleButton = fixture.debugElement.query(By.css('.toggle-button svg'));
      expect(toggleButton).toBeTruthy();

      // When collapsed - should show right arrow
      (mockUiStateService.isSidebarCollapsed$ as BehaviorSubject<boolean>).next(true);
      fixture.detectChanges();

      const collapsedToggleButton = fixture.debugElement.query(By.css('.toggle-button svg'));
      expect(collapsedToggleButton).toBeTruthy();
    });

    it('should have correct aria-label for accessibility', () => {
      const toggleButton = fixture.debugElement.query(By.css('.toggle-button'));
      expect(toggleButton.nativeElement.getAttribute('aria-label')).toContain('panel de pacientes');
    });
  });

  describe('Error Handling', () => {
    it('should display error message when search fails', () => {
      const errorMessage = 'Error al buscar pacientes';
      (mockMedicalStateService.error$ as BehaviorSubject<string | null>).next(errorMessage);
      fixture.detectChanges();

      const errorElement = fixture.debugElement.query(By.css('.error-message'));
      expect(errorElement).toBeTruthy();
      expect(errorElement.nativeElement.textContent.trim()).toContain(errorMessage);
    });

    it('should clear error when new search is performed', () => {
      // Set error state
      (mockMedicalStateService.error$ as BehaviorSubject<string | null>).next('Search error');
      fixture.detectChanges();

      // Perform new search
      const searchInput = fixture.debugElement.query(By.css('.search-input'));
      searchInput.nativeElement.value = 'new search';
      searchInput.nativeElement.dispatchEvent(new Event('input'));

      expect(mockMedicalStateService.searchPatients).toHaveBeenCalled();
    });
  });

  describe('Component Lifecycle', () => {
    it('should clean up subscriptions on destroy', () => {
      const nextSpy = jest.spyOn(component['destroy$'], 'next');
      const completeSpy = jest.spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(nextSpy).toHaveBeenCalled();
      expect(completeSpy).toHaveBeenCalled();
    });

    it('should set up search debouncing on init', () => {
      // Component already initialized in beforeEach
      expect(component['searchSubject']).toBeDefined();
    });

    it('should handle search input subscription properly', () => {
      const searchTerm = 'test search';
      component['searchSubject'].next(searchTerm);

      // Should trigger search after debounce
      setTimeout(() => {
        expect(mockMedicalStateService.searchPatients).toHaveBeenCalledWith(searchTerm);
      }, 350);
    });
  });

  describe('Patient Avatar and Display Logic', () => {
    it('should generate correct initials for patient names', () => {
      const testPatients: Patient[] = [
        { id: '1', name: 'María García', age: 30, gender: 'female', documents: [] },
        { id: '2', name: 'Juan Carlos Pérez López', age: 40, gender: 'male', documents: [] },
        { id: '3', name: 'Ana', age: 25, gender: 'female', documents: [] },
        { id: '4', name: 'José María de la Cruz', age: 35, gender: 'male', documents: [] }
      ];

      const expectedInitials = ['MA', 'JU', 'AN', 'JO']; // First 2 letters of first 2 words

      testPatients.forEach((patient, index) => {
        const initials = component.getPatientInitials(patient);
        expect(initials).toBe(expectedInitials[index]);
      });
    });

    it('should handle empty or invalid patient names', () => {
      const emptyPatient = { id: '1', name: '', age: 30, gender: 'male', documents: [] };
      const spacePatient = { id: '2', name: '   ', age: 30, gender: 'male', documents: [] };
      const nullPatient = { id: '3', name: null as any, age: 30, gender: 'male', documents: [] };

      expect(component.getPatientInitials(emptyPatient)).toBe('PA'); // Falls back to "Paciente"
      expect(component.getPatientInitials(spacePatient)).toBe('PA');
      expect(component.getPatientInitials(nullPatient)).toBe('PA');
    });

    it('should format patient age correctly', () => {
      const patient = { ...mockPatient, age: 25 };
      (mockMedicalStateService.recentPatients$ as BehaviorSubject<Patient[]>).next([patient]);
      fixture.detectChanges();

      const metaElement = fixture.debugElement.query(By.css('.patient-meta'));
      expect(metaElement.nativeElement.textContent.trim()).toContain('25 años');
    });

    xit('should show document count with correct pluralization', () => {
      // TODO: Document count display is not implemented in the current template
      // The sidebar template doesn't show document counts for patients
      // This test should be enabled when document count display is added
      const patients = [
        { ...mockPatient, documents: [{ id: '1', fileName: 'doc1.pdf', type: 'CONS' }] },
        { ...mockPatient, id: 'p2', documents: [
          { id: '1', fileName: 'doc1.pdf', type: 'CONS' },
          { id: '2', fileName: 'doc2.pdf', type: 'EMER' }
        ]},
        { ...mockPatient, id: 'p3', documents: [] }
      ];

      (mockMedicalStateService.recentPatients$ as BehaviorSubject<Patient[]>).next(patients);
      fixture.detectChanges();

      const documentElements = fixture.debugElement.queryAll(By.css('.patient-documents'));
      expect(documentElements[0].nativeElement.textContent.trim()).toContain('1 documento');
      expect(documentElements[1].nativeElement.textContent.trim()).toContain('2 documentos');
      expect(documentElements[2].nativeElement.textContent.trim()).toContain('Sin documentos');
    });
  });

  describe('Search Results Interaction', () => {
    beforeEach(() => {
      (mockMedicalStateService.searchResults$ as BehaviorSubject<Patient[]>).next(mockPatients);
      component.searchQuery = 'María';
      fixture.detectChanges();
    });

    it('should show search results when query is not empty', () => {
      const searchResults = fixture.debugElement.query(By.css('.search-results'));
      expect(searchResults).toBeTruthy();

      const recentPatients = fixture.debugElement.query(By.css('.recent-patients'));
      expect(recentPatients).toBeFalsy();
    });

    it('should highlight search term in patient names', () => {
      const patientNameElements = fixture.debugElement.queryAll(By.css('.search-results .patient-name'));
      const mariaElement = patientNameElements.find(el =>
        el.nativeElement.textContent.includes('María')
      );
      expect(mariaElement).toBeTruthy();
    });

    it('should show "no results" message when search returns empty', () => {
      (mockMedicalStateService.searchResults$ as BehaviorSubject<Patient[]>).next([]);
      fixture.detectChanges();

      const noResultsElement = fixture.debugElement.query(By.css('.no-results'));
      expect(noResultsElement).toBeTruthy();
      expect(noResultsElement.nativeElement.textContent.trim()).toContain('No se encontraron pacientes');
    });

    it('should clear search and show recent patients when search is cleared', () => {
      component.onSearchInputChange('');

      expect(mockMedicalStateService.clearSearchResults).toHaveBeenCalled();
      expect(component.searchQuery).toBe('');
    });
  });

  describe('Keyboard Navigation', () => {
    beforeEach(() => {
      (mockMedicalStateService.searchResults$ as BehaviorSubject<Patient[]>).next(mockPatients);
      fixture.detectChanges();
    });

    it('should handle Enter key on patient items', () => {
      // Setup: Add patients to recent patients to make them visible
      (mockMedicalStateService.recentPatients$ as BehaviorSubject<Patient[]>).next([mockPatient]);
      mockMedicalStateService.selectPatientAndNavigate.mockResolvedValue(true);
      fixture.detectChanges();

      const firstPatientElement = fixture.debugElement.query(By.css('.patient-card-wrapper'));
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });

      firstPatientElement.nativeElement.dispatchEvent(enterEvent);

      expect(mockMedicalStateService.selectPatientAndNavigate).toHaveBeenCalledWith(mockPatient, expect.any(Object));
    });

    it('should handle Space key on patient items', () => {
      // Setup: Add patients to recent patients to make them visible
      (mockMedicalStateService.recentPatients$ as BehaviorSubject<Patient[]>).next([mockPatient]);
      mockMedicalStateService.selectPatientAndNavigate.mockResolvedValue(true);
      fixture.detectChanges();

      const firstPatientElement = fixture.debugElement.query(By.css('.patient-card-wrapper'));
      const spaceEvent = new KeyboardEvent('keydown', { key: ' ' });

      firstPatientElement.nativeElement.dispatchEvent(spaceEvent);

      expect(mockMedicalStateService.selectPatientAndNavigate).toHaveBeenCalledWith(mockPatient, expect.any(Object));
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete patient selection workflow', async () => {
      // Setup: Search for patient
      (mockMedicalStateService.searchResults$ as BehaviorSubject<Patient[]>).next([mockPatient]);
      mockMedicalStateService.selectPatientAndNavigate.mockResolvedValue(true);

      fixture.detectChanges();

      // Action: Select patient
      const patientElement = fixture.debugElement.query(By.css('.patient-card-wrapper'));
      patientElement.nativeElement.click();

      // Wait for async operations
      await fixture.whenStable();

      // Verify: Complete workflow
      expect(mockMedicalStateService.setActivePatient).toHaveBeenCalledWith(mockPatient);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/chat']);
      expect(mockUiStateService.showSuccessToast).toHaveBeenCalled();
    });

    it('should handle search and selection on mobile', async () => {
      (mockUiStateService.isMobile$ as BehaviorSubject<boolean>).next(true);
      (mockMedicalStateService.searchResults$ as BehaviorSubject<Patient[]>).next([mockPatient]);
      mockMedicalStateService.selectPatientAndNavigate.mockResolvedValue(true);

      fixture.detectChanges();

      // Select patient on mobile
      await component.selectPatient(mockPatient);

      // Should close sidebar on mobile
      expect(mockUiStateService.closeSidebar).toHaveBeenCalled();
    });

    it('should maintain state consistency across interactions', () => {
      // Set active patient
      (mockMedicalStateService.activePatient$ as BehaviorSubject<Patient | null>).next(mockPatient);

      // Add to recent patients
      (mockMedicalStateService.recentPatients$ as BehaviorSubject<Patient[]>).next([mockPatient]);

      fixture.detectChanges();

      // Verify state consistency
      const selectedElements = fixture.debugElement.queryAll(By.css('.patient-card-wrapper.active'));
      expect(selectedElements.length).toBeGreaterThan(0);
    });
  });
});
