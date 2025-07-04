import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-patient-management',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="patients-container">
      <div class="patients-header">
        <a routerLink="/dashboard">← Volver</a>
        <h1>Gestión de Pacientes</h1>
      </div>
      <div class="patients-content">
        <p>La gestión de pacientes se implementará aquí.</p>
        <p>Utilizará los endpoints del backend:</p>
        <ul>
          <li>GET /api/v1/patients</li>
          <li>GET /api/v1/patients/search</li>
          <li>GET /api/v1/patients/:id</li>
        </ul>
      </div>
    </div>
  `,
  styles: [`
    .patients-container {
      min-height: 100vh;
      background: var(--medical-background);
    }
    
    .patients-header {
      padding: 1rem 2rem;
      background: var(--medical-surface);
      border-bottom: 1px solid var(--medical-divider);
      display: flex;
      align-items: center;
      gap: 2rem;
      
      a {
        color: var(--medical-blue);
        text-decoration: none;
      }
      
      h1 {
        margin: 0;
        color: var(--medical-blue);
      }
    }
    
    .patients-content {
      padding: 2rem;
      
      ul {
        margin-top: 1rem;
        padding-left: 2rem;
        
        li {
          margin: 0.5rem 0;
          font-family: monospace;
          color: var(--medical-text-secondary);
        }
      }
    }
  `]
})
export class PatientManagementComponent { }