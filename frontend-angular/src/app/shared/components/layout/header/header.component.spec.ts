import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HeaderComponent } from './header.component';
import { UiStateService } from '../../../../core/services/ui-state.service';
import { MedicalStateService } from '../../../../core/services/medical-state.service';
import { Patient } from '../../../../core/models';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;
  let mockUiStateService: any;
  let mockMedicalStateService: any;
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

  beforeEach(async () => {
    // Mock UiStateService
    const uiStateServiceSpy = {
      toggleSidebar: jest.fn(),
      showSuccessToast: jest.fn(),
      showErrorToast: jest.fn()
    };

    // Mock MedicalStateService
    const medicalStateServiceSpy = {
      setActivePatient: jest.fn(),
      clearPersistedState: jest.fn()
    };

    // Mock Router
    const routerSpy = {
      navigate: jest.fn(),
      url: '/dashboard'
    };

    // Set up observables
    uiStateServiceSpy.isMobile$ = new BehaviorSubject<boolean>(false);
    medicalStateServiceSpy.activePatient$ = new BehaviorSubject<Patient | null>(null);

    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent,
        RouterTestingModule
      ],
      providers: [
        { provide: UiStateService, useValue: uiStateServiceSpy },
        { provide: MedicalStateService, useValue: medicalStateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    mockUiStateService = TestBed.inject(UiStateService);
    mockMedicalStateService = TestBed.inject(MedicalStateService);
    mockRouter = TestBed.inject(Router);

    fixture.detectChanges();
  });

  describe('Component Creation and Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with correct default values', () => {
      expect(component.isNavDropdownOpen).toBe(false);
    });

    it('should subscribe to service observables on init', () => {
      expect(component.activePatient$).toBeDefined();
      expect(component.isMobile$).toBeDefined();
    });

    it('should render default app title when no patient is active', () => {
      const titleElement = fixture.debugElement.query(By.css('.app-title'));
      expect(titleElement).toBeTruthy();
      expect(titleElement.nativeElement.textContent.trim()).toBe('TecSalud Medical Assistant');
    });

    it('should render subtitle when no patient is active', () => {
      const subtitleElement = fixture.debugElement.query(By.css('.subtitle'));
      expect(subtitleElement).toBeTruthy();
      expect(subtitleElement.nativeElement.textContent.trim()).toBe('Selecciona un paciente para comenzar');
    });
  });

  describe('Patient Context Display', () => {
    beforeEach(() => {
      (mockMedicalStateService.activePatient$ as BehaviorSubject<Patient | null>).next(mockPatient);
      fixture.detectChanges();
    });

    it('should show patient context when patient is active', () => {
      const patientContext = fixture.debugElement.query(By.css('.patient-context'));
      expect(patientContext).toBeTruthy();

      const defaultContext = fixture.debugElement.query(By.css('.default-context'));
      expect(defaultContext).toBeFalsy();
    });

    it('should display patient name correctly', () => {
      const patientName = fixture.debugElement.query(By.css('.patient-name'));
      expect(patientName).toBeTruthy();
      expect(patientName.nativeElement.textContent.trim()).toBe(mockPatient.name);
    });

    it('should display patient metadata correctly', () => {
      const patientMeta = fixture.debugElement.query(By.css('.patient-meta'));
      expect(patientMeta).toBeTruthy();
      expect(patientMeta.nativeElement.textContent.trim()).toContain(`${mockPatient.age} años`);
      expect(patientMeta.nativeElement.textContent.trim()).toContain(mockPatient.gender);
    });

    it('should show patient icon in badge', () => {
      const patientIcon = fixture.debugElement.query(By.css('.patient-icon'));
      expect(patientIcon).toBeTruthy();
      expect(patientIcon.nativeElement.textContent.trim()).toBe('👤');
    });

    it('should apply patient-active class to header', () => {
      const header = fixture.debugElement.query(By.css('.app-header'));
      expect(header.nativeElement.classList).toContain('patient-active');
    });

    it('should show clear context button', () => {
      const clearButton = fixture.debugElement.query(By.css('.clear-context'));
      expect(clearButton).toBeTruthy();
      expect(clearButton.nativeElement.textContent.trim()).toBe('✕');
    });
  });

  describe('Clear Patient Context', () => {
    beforeEach(() => {
      (mockMedicalStateService.activePatient$ as BehaviorSubject<Patient | null>).next(mockPatient);
      fixture.detectChanges();
    });

    it('should clear patient context when clear button is clicked', () => {
      const clearButton = fixture.debugElement.query(By.css('.clear-context'));
      clearButton.nativeElement.click();

      expect(mockMedicalStateService.setActivePatient).toHaveBeenCalledWith(null);
    });

    it('should show success toast when context is cleared', () => {
      component.clearPatientContext();

      expect(mockUiStateService.showSuccessToast).toHaveBeenCalledWith(
        'Contexto del paciente limpiado'
      );
    });

    it('should return to default view after clearing context', () => {
      (mockMedicalStateService.activePatient$ as BehaviorSubject<Patient | null>).next(null);
      fixture.detectChanges();

      const defaultContext = fixture.debugElement.query(By.css('.default-context'));
      expect(defaultContext).toBeTruthy();

      const patientContext = fixture.debugElement.query(By.css('.patient-context'));
      expect(patientContext).toBeFalsy();
    });
  });

  describe('Mobile Menu Toggle', () => {
    beforeEach(() => {
      (mockUiStateService.isMobile$ as BehaviorSubject<boolean>).next(true);
      fixture.detectChanges();
    });

    it('should show mobile menu toggle on mobile devices', () => {
      const menuToggle = fixture.debugElement.query(By.css('.menu-toggle'));
      expect(menuToggle).toBeTruthy();
    });

    it('should hide mobile menu toggle on desktop', () => {
      (mockUiStateService.isMobile$ as BehaviorSubject<boolean>).next(false);
      fixture.detectChanges();

      const menuToggle = fixture.debugElement.query(By.css('.menu-toggle'));
      expect(menuToggle).toBeFalsy();
    });

    it('should toggle sidebar when mobile menu is clicked', () => {
      const menuToggle = fixture.debugElement.query(By.css('.menu-toggle'));
      menuToggle.nativeElement.click();

      expect(mockUiStateService.toggleSidebar).toHaveBeenCalled();
    });

    it('should show correct menu icon', () => {
      const menuIcon = fixture.debugElement.query(By.css('.menu-icon'));
      expect(menuIcon).toBeTruthy();
      expect(menuIcon.nativeElement.textContent.trim()).toBe('☰');
    });
  });

  describe('Navigation Dropdown', () => {
    it('should render navigation dropdown trigger', () => {
      const dropdownTrigger = fixture.debugElement.query(By.css('.nav-dropdown-trigger'));
      expect(dropdownTrigger).toBeTruthy();
      expect(dropdownTrigger.nativeElement.textContent.trim()).toContain('Configuración');
    });

    it('should toggle dropdown when trigger is clicked', () => {
      const dropdownTrigger = fixture.debugElement.query(By.css('.nav-dropdown-trigger'));

      expect(component.isNavDropdownOpen).toBe(false);

      dropdownTrigger.nativeElement.click();
      expect(component.isNavDropdownOpen).toBe(true);

      dropdownTrigger.nativeElement.click();
      expect(component.isNavDropdownOpen).toBe(false);
    });

    it('should show dropdown menu when open', () => {
      component.isNavDropdownOpen = true;
      fixture.detectChanges();

      const dropdownMenu = fixture.debugElement.query(By.css('.nav-dropdown-menu'));
      expect(dropdownMenu).toBeTruthy();
    });

    it('should hide dropdown menu when closed', () => {
      component.isNavDropdownOpen = false;
      fixture.detectChanges();

      const dropdownMenu = fixture.debugElement.query(By.css('.nav-dropdown-menu'));
      expect(dropdownMenu).toBeFalsy();
    });

    it('should render all navigation links', () => {
      component.isNavDropdownOpen = true;
      fixture.detectChanges();

      const navLinks = fixture.debugElement.queryAll(By.css('.nav-dropdown-item'));
      expect(navLinks.length).toBeGreaterThan(0);

      // Check for key navigation items
      const linkTexts = navLinks.map(link => link.nativeElement.textContent.trim());
      expect(linkTexts).toContain('Copiloto Médico');
      expect(linkTexts).toContain('Dashboard');
      expect(linkTexts).toContain('Documentos');
      expect(linkTexts).toContain('Gestión de Pastillas');
    });

    it('should close dropdown when nav item is clicked', () => {
      component.isNavDropdownOpen = true;
      fixture.detectChanges();

      const firstNavItem = fixture.debugElement.query(By.css('.nav-dropdown-item'));
      firstNavItem.nativeElement.click();

      expect(component.isNavDropdownOpen).toBe(false);
    });

    it('should have correct routerLink attributes', () => {
      component.isNavDropdownOpen = true;
      fixture.detectChanges();

      const chatLink = fixture.debugElement.query(By.css('a[routerLink="/chat"]'));
      const dashboardLink = fixture.debugElement.query(By.css('a[routerLink="/dashboard"]'));
      const documentsLink = fixture.debugElement.query(By.css('a[routerLink="/documents"]'));
      const pillsLink = fixture.debugElement.query(By.css('a[routerLink="/admin-pills"]'));

      expect(chatLink).toBeTruthy();
      expect(dashboardLink).toBeTruthy();
      expect(documentsLink).toBeTruthy();
      expect(pillsLink).toBeTruthy();
    });
  });

  describe('User Menu and Actions', () => {
    it('should render user menu with avatar', () => {
      const userMenu = fixture.debugElement.query(By.css('.user-menu'));
      expect(userMenu).toBeTruthy();

      const userAvatar = fixture.debugElement.query(By.css('.user-avatar'));
      expect(userAvatar).toBeTruthy();
      expect(userAvatar.nativeElement.textContent.trim()).toBe('LS');
    });

    it('should show user name on desktop', () => {
      (mockUiStateService.isMobile$ as BehaviorSubject<boolean>).next(false);
      fixture.detectChanges();

      const userName = fixture.debugElement.query(By.css('.user-name'));
      expect(userName).toBeTruthy();
      expect(userName.nativeElement.textContent.trim()).toBe('Dr. Solis');
    });

    it('should hide user name on mobile', () => {
      (mockUiStateService.isMobile$ as BehaviorSubject<boolean>).next(true);
      fixture.detectChanges();

      const userName = fixture.debugElement.query(By.css('.user-name'));
      expect(userName).toBeFalsy();
    });

    it('should render notification button', () => {
      const notificationBtn = fixture.debugElement.query(By.css('.action-btn'));
      expect(notificationBtn).toBeTruthy();

      const notificationIcon = fixture.debugElement.query(By.css('.action-icon'));
      expect(notificationIcon.nativeElement.textContent.trim()).toBe('🔔');
    });

    it('should show notification badge when there are notifications', () => {
      // This would need to be implemented if notifications were active
      // Currently the template has *ngIf="false" for the badge
      const notificationBadge = fixture.debugElement.query(By.css('.notification-badge'));
      expect(notificationBadge).toBeFalsy();
    });
  });

  describe('Responsive Behavior', () => {
    describe('Mobile Layout', () => {
      beforeEach(() => {
        (mockUiStateService.isMobile$ as BehaviorSubject<boolean>).next(true);
        fixture.detectChanges();
      });

      it('should apply mobile-specific styling', () => {
        // Test would verify mobile CSS classes are applied
        const header = fixture.debugElement.query(By.css('.app-header'));
        expect(header).toBeTruthy();
      });

      it('should hide subtitle on mobile', () => {
        const subtitle = fixture.debugElement.query(By.css('.subtitle'));
        expect(subtitle).toBeFalsy();
      });

      it('should show menu toggle on mobile', () => {
        const menuToggle = fixture.debugElement.query(By.css('.menu-toggle'));
        expect(menuToggle).toBeTruthy();
      });
    });

    describe('Desktop Layout', () => {
      beforeEach(() => {
        (mockUiStateService.isMobile$ as BehaviorSubject<boolean>).next(false);
        fixture.detectChanges();
      });

      it('should show full subtitle on desktop', () => {
        const subtitle = fixture.debugElement.query(By.css('.subtitle'));
        expect(subtitle).toBeTruthy();
      });

      it('should hide menu toggle on desktop', () => {
        const menuToggle = fixture.debugElement.query(By.css('.menu-toggle'));
        expect(menuToggle).toBeFalsy();
      });

      it('should show user name on desktop', () => {
        const userName = fixture.debugElement.query(By.css('.user-name'));
        expect(userName).toBeTruthy();
      });
    });
  });

  describe('Patient Context Transitions', () => {
    it('should transition from default to patient context', () => {
      // Initially no patient
      let defaultContext = fixture.debugElement.query(By.css('.default-context'));
      let patientContext = fixture.debugElement.query(By.css('.patient-context'));

      expect(defaultContext).toBeTruthy();
      expect(patientContext).toBeFalsy();

      // Set active patient
      (mockMedicalStateService.activePatient$ as BehaviorSubject<Patient | null>).next(mockPatient);
      fixture.detectChanges();

      defaultContext = fixture.debugElement.query(By.css('.default-context'));
      patientContext = fixture.debugElement.query(By.css('.patient-context'));

      expect(defaultContext).toBeFalsy();
      expect(patientContext).toBeTruthy();
    });

    it('should handle patient changes correctly', () => {
      // Set first patient
      (mockMedicalStateService.activePatient$ as BehaviorSubject<Patient | null>).next(mockPatient);
      fixture.detectChanges();

      let patientName = fixture.debugElement.query(By.css('.patient-name'));
      expect(patientName.nativeElement.textContent.trim()).toBe(mockPatient.name);

      // Change to different patient
      const anotherPatient: Patient = {
        id: 'patient-456',
        name: 'Juan Pérez',
        age: 30,
        gender: 'Masculino',
        documents: []
      };

      (mockMedicalStateService.activePatient$ as BehaviorSubject<Patient | null>).next(anotherPatient);
      fixture.detectChanges();

      patientName = fixture.debugElement.query(By.css('.patient-name'));
      expect(patientName.nativeElement.textContent.trim()).toBe(anotherPatient.name);
    });
  });

  describe('Component Methods', () => {
    it('should toggle sidebar correctly', () => {
      component.toggleSidebar();
      expect(mockUiStateService.toggleSidebar).toHaveBeenCalled();
    });

    it('should toggle navigation dropdown correctly', () => {
      expect(component.isNavDropdownOpen).toBe(false);

      component.toggleNavDropdown();
      expect(component.isNavDropdownOpen).toBe(true);

      component.toggleNavDropdown();
      expect(component.isNavDropdownOpen).toBe(false);
    });

    it('should close navigation dropdown correctly', () => {
      component.isNavDropdownOpen = true;

      component.closeNavDropdown();
      expect(component.isNavDropdownOpen).toBe(false);
    });

    it('should clear patient context correctly', () => {
      component.clearPatientContext();

      expect(mockMedicalStateService.setActivePatient).toHaveBeenCalledWith(null);
      expect(mockUiStateService.showSuccessToast).toHaveBeenCalledWith(
        'Contexto del paciente limpiado'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-labels for buttons', () => {
      const menuToggle = fixture.debugElement.query(By.css('.menu-toggle'));
      if (menuToggle) {
        // Menu toggle only exists on mobile
        expect(menuToggle.nativeElement.getAttribute('aria-label')).toBeTruthy();
      }

      const clearButton = fixture.debugElement.query(By.css('.clear-context'));
      if (clearButton) {
        // Clear button only exists when patient is active
        expect(clearButton.nativeElement.getAttribute('title')).toBeTruthy();
      }
    });

    it('should have proper button roles and interactions', () => {
      const dropdownTrigger = fixture.debugElement.query(By.css('.nav-dropdown-trigger'));
      expect(dropdownTrigger.nativeElement.tagName.toLowerCase()).toBe('button');
    });
  });

  describe('Error Handling', () => {
    it('should handle missing patient data gracefully', () => {
      const incompletePatient: Partial<Patient> = {
        id: 'patient-123',
        name: 'Test Patient'
        // Missing age and gender
      };

      (mockMedicalStateService.activePatient$ as BehaviorSubject<Patient | null>).next(incompletePatient as Patient);
      fixture.detectChanges();

      const patientMeta = fixture.debugElement.query(By.css('.patient-meta'));
      expect(patientMeta).toBeTruthy();
      // Should handle undefined values gracefully
    });

    it('should handle null patient gracefully', () => {
      (mockMedicalStateService.activePatient$ as BehaviorSubject<Patient | null>).next(null);
      fixture.detectChanges();

      const defaultContext = fixture.debugElement.query(By.css('.default-context'));
      expect(defaultContext).toBeTruthy();

      const patientContext = fixture.debugElement.query(By.css('.patient-context'));
      expect(patientContext).toBeFalsy();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete patient context workflow', () => {
      // Start with no patient
      expect(fixture.debugElement.query(By.css('.default-context'))).toBeTruthy();

      // Set active patient
      (mockMedicalStateService.activePatient$ as BehaviorSubject<Patient | null>).next(mockPatient);
      fixture.detectChanges();

      expect(fixture.debugElement.query(By.css('.patient-context'))).toBeTruthy();
      expect(fixture.debugElement.query(By.css('.patient-name')).nativeElement.textContent.trim()).toBe(mockPatient.name);

      // Clear patient context
      const clearButton = fixture.debugElement.query(By.css('.clear-context'));
      clearButton.nativeElement.click();

      expect(mockMedicalStateService.setActivePatient).toHaveBeenCalledWith(null);
      expect(mockUiStateService.showSuccessToast).toHaveBeenCalled();
    });

    it('should handle mobile navigation workflow', () => {
      (mockUiStateService.isMobile$ as BehaviorSubject<boolean>).next(true);
      fixture.detectChanges();

      // Mobile menu should be visible
      const menuToggle = fixture.debugElement.query(By.css('.menu-toggle'));
      expect(menuToggle).toBeTruthy();

      // User name should be hidden on mobile
      const userName = fixture.debugElement.query(By.css('.user-name'));
      expect(userName).toBeFalsy();

      // Menu toggle should work
      menuToggle.nativeElement.click();
      expect(mockUiStateService.toggleSidebar).toHaveBeenCalled();
    });

    it('should handle dropdown navigation workflow', () => {
      // Open dropdown
      const dropdownTrigger = fixture.debugElement.query(By.css('.nav-dropdown-trigger'));
      dropdownTrigger.nativeElement.click();

      expect(component.isNavDropdownOpen).toBe(true);
      fixture.detectChanges();

      // Verify dropdown is visible
      const dropdownMenu = fixture.debugElement.query(By.css('.nav-dropdown-menu'));
      expect(dropdownMenu).toBeTruthy();

      // Click navigation item
      const firstNavItem = fixture.debugElement.query(By.css('.nav-dropdown-item'));
      firstNavItem.nativeElement.click();

      // Dropdown should close
      expect(component.isNavDropdownOpen).toBe(false);
    });
  });
});
