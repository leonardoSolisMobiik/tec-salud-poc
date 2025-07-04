import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BambooModule } from '../../bamboo.module';

@Component({
  selector: 'app-test-bamboo',
  standalone: true,
  imports: [CommonModule, BambooModule],
  template: `
    <div class="bamboo-test-container">
      <h2>🧪 Bamboo Test Component</h2>
      
      <!-- Test 1: Simple bmb-card -->
      <div class="test-section">
        <h3>Test 1: BmbCardComponent Simple</h3>
        <bmb-card class="test-card">
          <p>Contenido simple de prueba</p>
        </bmb-card>
      </div>
      
      <!-- Test 2: bmb-card with patient data simulation -->
      <div class="test-section">
        <h3>Test 2: BmbCardComponent con datos simulados</h3>
        <bmb-card 
          *ngFor="let patient of testPatients" 
          class="test-patient-card"
          (click)="onPatientClick(patient)">
          <div class="test-patient-content">
            <div class="avatar">{{ patient.initials }}</div>
            <div class="info">
              <div class="name">{{ patient.name }}</div>
              <div class="id">ID: {{ patient.id }}</div>
            </div>
          </div>
        </bmb-card>
      </div>
      
      <!-- Test 3: Debug info -->
      <div class="test-section">
        <h3>Test 3: Debug Info</h3>
        <p>Número de pacientes de prueba: {{ testPatients.length }}</p>
        <p>Bamboo Module cargado: {{ bambooLoaded ? 'SÍ' : 'NO' }}</p>
      </div>
    </div>
  `,
  styles: [`
    .bamboo-test-container {
      padding: 20px;
      background: #f5f5f5;
      min-height: 100vh;
    }
    
    .test-section {
      margin-bottom: 30px;
      padding: 20px;
      background: white;
      border-radius: 8px;
      border: 2px solid #e0e0e0;
    }
    
    .test-card {
      margin: 10px 0;
      padding: 15px;
      border: 1px solid #ccc;
    }
    
    .test-patient-card {
      margin: 10px 0;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .test-patient-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .test-patient-content {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #0066cc;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }
    
    .info .name {
      font-weight: 600;
      color: #333;
    }
    
    .info .id {
      font-size: 0.9em;
      color: #666;
    }
  `]
})
export class TestBambooComponent {
  bambooLoaded = true;
  
  testPatients = [
    { id: 1, name: 'Andrea Pérez García', initials: 'AP' },
    { id: 2, name: 'Arturo Herrera Sánchez', initials: 'AH' },
    { id: 3, name: 'Carmen López Martín', initials: 'CL' }
  ];
  
  onPatientClick(patient: any) {
    console.log('🧪 Test: Patient clicked:', patient);
    alert(`Paciente seleccionado: ${patient.name}`);
  }
} 