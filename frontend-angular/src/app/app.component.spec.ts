import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Component } from '@angular/core';
import { AppComponent } from './app.component';

/**
 * Mock component for AppShell to avoid complex dependencies in tests
 * 
 * @description Provides a simple mock implementation of the app shell
 * component to isolate the AppComponent during unit testing
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  template: '<div>Mock App Shell</div>'
})
class MockAppShellComponent {}

/**
 * Test suite for AppComponent
 * 
 * @description Unit tests for the main application component including
 * component creation, title verification, and shell rendering
 */
describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ]
    })
    .overrideComponent(AppComponent, {
      set: {
        imports: [MockAppShellComponent],
        template: '<app-shell></app-shell>'
      }
    })
    .compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have the correct title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('TecSalud Medical Assistant');
  });

  it('should render app shell', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('div')?.textContent).toContain('Mock App Shell');
  });
});
