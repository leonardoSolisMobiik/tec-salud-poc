/**
 * Unit tests for DashboardComponent
 *
 * @description Tests for the main dashboard including health checks,
 * toast notifications, and component initialization
 *
 * @since 1.0.0
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { DashboardComponent } from './dashboard.component';
import { ApiService, UiStateService } from '@core/services';
import { of, throwError } from 'rxjs';
import { Component } from '@angular/core';

// Mock components for routing tests
@Component({
  template: '<div>Mock Chat Component</div>'
})
class MockChatComponent { }

@Component({
  template: '<div>Mock Documents Component</div>'
})
class MockDocumentsComponent { }

@Component({
  template: '<div>Mock Admin Pills Component</div>'
})
class MockAdminPillsComponent { }

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let apiServiceMock: any;
  let uiStateServiceMock: any;

  const mockHealthResponse = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.2.3'
  };

  beforeEach(async () => {
    const apiServiceSpy = {
      checkHealth: jest.fn().mockReturnValue(of(mockHealthResponse))
    };
    const uiStateServiceSpy = {
      showSuccessToast: jest.fn()
    };

    await TestBed.configureTestingModule({
      imports: [
        DashboardComponent,
        RouterTestingModule.withRoutes([
          { path: 'chat', component: MockChatComponent },
          { path: 'documents', component: MockDocumentsComponent },
          { path: 'admin-pills', component: MockAdminPillsComponent }
        ])
      ],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: UiStateService, useValue: uiStateServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    apiServiceMock = apiServiceSpy;
    uiStateServiceMock = uiStateServiceSpy;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should have initial backend status as "Verificando..."', () => {
      expect(component.backendStatus).toBe('Verificando...');
    });

    it('should call checkBackendStatus on ngOnInit', () => {
      jest.spyOn(component, 'checkBackendStatus');
      component.ngOnInit();
      expect(component.checkBackendStatus).toHaveBeenCalled();
    });
  });

  describe('Backend Health Check', () => {
    it('should update backend status on successful health check', () => {
      apiServiceMock.checkHealth.mockReturnValue(of(mockHealthResponse));

      component.checkBackendStatus();

      expect(apiServiceMock.checkHealth).toHaveBeenCalled();
      expect(component.backendStatus).toBe('Conectado ✓ - v1.2.3');
    });

    it('should handle health check errors', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      apiServiceMock.checkHealth.mockReturnValue(throwError(() => new Error('Network error')));

      component.checkBackendStatus();

      expect(apiServiceMock.checkHealth).toHaveBeenCalled();
      expect(component.backendStatus).toBe('No disponible');
      expect(consoleSpy).toHaveBeenCalledWith('Backend health check failed:', expect.any(Error));
    });

    it('should handle health check on component initialization', () => {
      apiServiceMock.checkHealth.mockReturnValue(of(mockHealthResponse));

      component.ngOnInit();

      expect(apiServiceMock.checkHealth).toHaveBeenCalled();
      expect(component.backendStatus).toBe('Conectado ✓ - v1.2.3');
    });

    it('should extract version from health response', () => {
      const healthResponseWithoutVersion = {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };

      apiServiceMock.checkHealth.mockReturnValue(of(healthResponseWithoutVersion as any));

      component.checkBackendStatus();

      expect(component.backendStatus).toBe('Conectado ✓ - vundefined');
    });
  });

  describe('Toast Notifications', () => {
    it('should show success toast when testToast is called', () => {
      component.testToast();

      expect(uiStateServiceMock.showSuccessToast).toHaveBeenCalledWith(
        '¡El sistema de notificaciones funciona correctamente!'
      );
    });

    it('should not throw error when testToast is called multiple times', () => {
      expect(() => {
        component.testToast();
        component.testToast();
        component.testToast();
      }).not.toThrow();

      expect(uiStateServiceMock.showSuccessToast).toHaveBeenCalledTimes(3);
    });
  });

  describe('Template Rendering', () => {
    beforeEach(() => {
      apiServiceMock.checkHealth.mockReturnValue(of(mockHealthResponse));
    });

    it('should render dashboard title', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('h1')?.textContent).toContain('TecSalud Medical Assistant');
    });

    it('should render subtitle', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('p')?.textContent)
        .toContain('Sistema de Asistente Médico con IA');
    });

    it('should render action cards section', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const quickActionsTitle = compiled.querySelector('.quick-actions h2');
      expect(quickActionsTitle?.textContent).toContain('Acciones Rápidas');
    });

    it('should render medical chat action card', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const chatCard = compiled.querySelector('a[routerLink="/chat"]');
      expect(chatCard?.textContent).toContain('Chat Médico IA');
      expect(chatCard?.textContent).toContain('Consulta médica asistida por inteligencia artificial');
    });

    it('should render documents management card', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const documentsCard = compiled.querySelector('a[routerLink="/documents"]');
      expect(documentsCard?.textContent).toContain('Gestión de Documentos');
      expect(documentsCard?.textContent).toContain('Administra documentos médicos y análisis');
    });

    it('should render admin pills management card', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const adminCard = compiled.querySelector('a[routerLink="/admin-pills"]');
      expect(adminCard?.textContent).toContain('Gestión de Pastillas');
      expect(adminCard?.textContent).toContain('Configura preguntas rápidas para el chat médico');
    });

    it('should render system status section', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const statusSection = compiled.querySelector('.system-status');
      expect(statusSection?.querySelector('h3')?.textContent).toContain('Estado del Sistema');
    });

    it('should display backend status', () => {
      component.backendStatus = 'Conectado ✓ - v1.2.3';
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const statusText = compiled.querySelector('.system-status p');
      expect(statusText?.textContent).toContain('Backend: Conectado ✓ - v1.2.3');
    });

    it('should render test toast button', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const testButton = compiled.querySelector('.test-btn') as HTMLButtonElement;
      expect(testButton?.textContent).toContain('Probar Toast');
    });

    it('should call testToast when test button is clicked', () => {
      jest.spyOn(component, 'testToast');
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const testButton = compiled.querySelector('.test-btn') as HTMLButtonElement;
      testButton.click();

      expect(component.testToast).toHaveBeenCalled();
    });
  });

  describe('Router Navigation', () => {
    it('should have correct router links', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const chatLink = compiled.querySelector('a[routerLink="/chat"]');
      const documentsLink = compiled.querySelector('a[routerLink="/documents"]');
      const adminLink = compiled.querySelector('a[routerLink="/admin-pills"]');

      expect(chatLink).toBeTruthy();
      expect(documentsLink).toBeTruthy();
      expect(adminLink).toBeTruthy();
    });

    it('should have proper CSS classes for action cards', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement as HTMLElement;
      const actionCards = compiled.querySelectorAll('.action-card');
      expect(actionCards.length).toBe(3);

      const adminCard = compiled.querySelector('a[routerLink="/admin-pills"]');
      expect(adminCard?.classList).toContain('admin-card');
    });
  });

  describe('Error Handling', () => {
    it('should handle multiple consecutive health check failures', () => {
      const consoleSpy = jest.spyOn(console, 'error');
      apiServiceMock.checkHealth.mockReturnValue(throwError(() => new Error('Network error')));

      // Call multiple times
      component.checkBackendStatus();
      component.checkBackendStatus();
      component.checkBackendStatus();

      expect(component.backendStatus).toBe('No disponible');
      expect(consoleSpy).toHaveBeenCalledTimes(3);
    });

    it('should recover from error state on successful health check', () => {
      const consoleSpy = jest.spyOn(console, 'error');

      // First call fails
      apiServiceMock.checkHealth.mockReturnValue(throwError(() => new Error('Network error')));
      component.checkBackendStatus();
      expect(component.backendStatus).toBe('No disponible');

              // Second call succeeds
        apiServiceMock.checkHealth.mockReturnValue(of(mockHealthResponse));
      component.checkBackendStatus();
      expect(component.backendStatus).toBe('Conectado ✓ - v1.2.3');
    });
  });

  describe('Component Lifecycle', () => {
    it('should complete initialization without errors', () => {
      apiServiceMock.checkHealth.mockReturnValue(of(mockHealthResponse));

      expect(() => {
        component.ngOnInit();
        fixture.detectChanges();
      }).not.toThrow();
    });

    it('should maintain state consistency after initialization', () => {
      apiServiceMock.checkHealth.mockReturnValue(of(mockHealthResponse));

      component.ngOnInit();
      fixture.detectChanges();

      expect(component.backendStatus).toBe('Conectado ✓ - v1.2.3');
      expect(apiServiceMock.checkHealth).toHaveBeenCalledTimes(1);
    });
  });
});
