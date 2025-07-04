import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestBambooComponent } from './test-bamboo.component';
import { BambooModule } from '../../bamboo.module';

describe('TestBambooComponent', () => {
  let component: TestBambooComponent;
  let fixture: ComponentFixture<TestBambooComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestBambooComponent, BambooModule]
    }).compileComponents();
    
    fixture = TestBed.createComponent(TestBambooComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have test patients data', () => {
    expect(component.testPatients).toBeDefined();
    expect(component.testPatients.length).toBe(3);
    expect(component.testPatients[0].name).toBe('Andrea Pérez García');
  });

  it('should mark bamboo as loaded', () => {
    expect(component.bambooLoaded).toBe(true);
  });

  it('should render test patients', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    
    // Check that patient names are rendered
    expect(compiled.textContent).toContain('Andrea Pérez García');
    expect(compiled.textContent).toContain('Arturo Herrera Sánchez');
    expect(compiled.textContent).toContain('Carmen López Martín');
  });

  it('should render bamboo cards', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    
    // Check for bmb-card elements
    const bmbCards = compiled.querySelectorAll('bmb-card');
    expect(bmbCards.length).toBeGreaterThan(0);
  });

  it('should handle patient click', () => {
    spyOn(component, 'onPatientClick');
    spyOn(window, 'alert');
    
    const testPatient = component.testPatients[0];
    component.onPatientClick(testPatient);
    
    expect(component.onPatientClick).toHaveBeenCalledWith(testPatient);
  });

  it('should log patient clicks to console', () => {
    spyOn(console, 'log');
    
    const testPatient = component.testPatients[0];
    component.onPatientClick(testPatient);
    
    expect(console.log).toHaveBeenCalledWith('🧪 Test: Patient clicked:', testPatient);
  });
}); 