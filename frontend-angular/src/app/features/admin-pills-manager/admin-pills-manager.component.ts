import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

interface QuickPillData {
  id: string;
  text: string;
  icon: string;
  category: string;
  priority: string;
}

interface PillFormData {
  text: string;
  icon: string;
  category: string;
  priority: string;
}

@Component({
  selector: 'app-admin-pills-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="admin-container">
      <!-- Header siguiendo patrón existente -->
      <div class="admin-header">
        <a routerLink="/dashboard" class="back-link">← Volver</a>
        <h1>💊 Gestión de Pastillas Médicas</h1>
        <button class="add-btn" (click)="openCreateModal()">
          <span class="btn-icon">➕</span>
          <span class="btn-text">Nueva Pastilla</span>
        </button>
      </div>

      <!-- Tabla simple siguiendo patrón existente -->
      <div class="admin-content">
        <div class="pills-table-container">
          <table class="pills-table" *ngIf="pills.length > 0">
            <thead>
              <tr>
                <th>Icono</th>
                <th>Texto</th>
                <th>Categoría</th>
                <th>Prioridad</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let pill of pills; trackBy: trackByPill">
                <td class="icon-cell">{{ pill.icon }}</td>
                <td class="text-cell">{{ pill.text }}</td>
                <td class="category-cell">
                  <span class="category-badge" [class]="'category-' + pill.category">
                    {{ getCategoryLabel(pill.category) }}
                  </span>
                </td>
                <td class="priority-cell">
                  <span class="priority-badge" [class]="'priority-' + pill.priority">
                    {{ getPriorityLabel(pill.priority) }}
                  </span>
                </td>
                <td class="actions-cell">
                  <button class="action-btn edit-btn" (click)="openEditModal(pill)">✏️</button>
                  <button class="action-btn delete-btn" (click)="openDeleteModal(pill)">🗑️</button>
                </td>
              </tr>
            </tbody>
          </table>

          <div class="empty-state" *ngIf="pills.length === 0">
            <p>No hay pastillas configuradas.</p>
            <button class="add-btn" (click)="openCreateModal()">➕ Crear Primera Pastilla</button>
          </div>
        </div>
      </div>

      <!-- Modal Create/Edit siguiendo patrón premium -->
      <div class="modal-overlay" *ngIf="showFormModal" (click)="closeFormModal()">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>{{ isEditMode ? '✏️ Editar Pastilla' : '➕ Nueva Pastilla' }}</h3>
            <button class="close-btn" (click)="closeFormModal()">✕</button>
          </div>

          <form class="pill-form" (ngSubmit)="savePill()" #pillForm="ngForm">
            <div class="form-group">
              <label for="pillText">Texto de la pregunta: *</label>
              <input
                type="text"
                id="pillText"
                name="pillText"
                [(ngModel)]="formData.text"
                required
                maxlength="100"
                placeholder="Ej: ¿Cuáles son los síntomas principales?"
                class="form-input">
            </div>

            <div class="form-group">
              <label for="pillIcon">Icono: *</label>
              <div class="icon-selector">
                <input
                  type="text"
                  id="pillIcon"
                  name="pillIcon"
                  [(ngModel)]="formData.icon"
                  required
                  maxlength="2"
                  placeholder="🩺"
                  class="icon-input">
                <div class="icon-options">
                  <button 
                    type="button" 
                    *ngFor="let icon of iconOptions" 
                    class="icon-option"
                    [class.selected]="formData.icon === icon"
                    (click)="selectIcon(icon)">
                    {{ icon }}
                  </button>
                </div>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="pillCategory">Categoría: *</label>
                <select
                  id="pillCategory"
                  name="pillCategory"
                  [(ngModel)]="formData.category"
                  required
                  class="form-select">
                  <option value="">Seleccionar...</option>
                  <option value="diagnosis">Diagnóstico</option>
                  <option value="symptoms">Síntomas</option>
                  <option value="treatment">Tratamiento</option>
                  <option value="medication">Medicamentos</option>
                  <option value="tests">Exámenes</option>
                  <option value="emergency">Emergencia</option>
                  <option value="follow-up">Seguimiento</option>
                  <option value="prevention">Prevención</option>
                </select>
              </div>

              <div class="form-group">
                <label for="pillPriority">Prioridad: *</label>
                <select
                  id="pillPriority"
                  name="pillPriority"
                  [(ngModel)]="formData.priority"
                  required
                  class="form-select">
                  <option value="">Seleccionar...</option>
                  <option value="high">Alta</option>
                  <option value="medium">Media</option>
                  <option value="low">Baja</option>
                </select>
              </div>
            </div>

            <div class="form-actions">
              <button type="button" class="cancel-btn" (click)="closeFormModal()">❌ Cancelar</button>
              <button type="submit" class="save-btn" [disabled]="!pillForm.valid">💾 Guardar</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Modal Delete siguiendo patrón existente -->
      <div class="modal-overlay" *ngIf="showDeleteModal" (click)="closeDeleteModal()">
        <div class="modal-content delete-modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3>🗑️ Eliminar Pastilla</h3>
            <button class="close-btn" (click)="closeDeleteModal()">✕</button>
          </div>

          <div class="delete-content">
            <div class="warning-icon">⚠️</div>
            <p>¿Estás seguro de eliminar esta pastilla?</p>
            <div class="pill-preview" *ngIf="pillToDelete">
              <span class="preview-icon">{{ pillToDelete.icon }}</span>
              <span class="preview-text">"{{ pillToDelete.text }}"</span>
            </div>
            <p class="warning-text">Esta acción no se puede deshacer.</p>
          </div>

          <div class="form-actions">
            <button type="button" class="cancel-btn" (click)="closeDeleteModal()">❌ Cancelar</button>
            <button type="button" class="delete-confirm-btn" (click)="confirmDelete()">🗑️ Sí, eliminar</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Reutiliza patrones de dashboard.component.ts y patient-management.component.ts */
    .admin-container {
      min-height: 100vh;
      background: var(--medical-background);
    }

    /* Header siguiendo patrón de patient-management */
    .admin-header {
      padding: 1rem 2rem;
      background: var(--medical-surface);
      border-bottom: 1px solid var(--medical-divider);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
    }

    .back-link {
      color: var(--medical-blue);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s;
    }

    .back-link:hover {
      color: var(--color-blue-tec);
    }

    .admin-header h1 {
      flex: 1;
      margin: 0;
      color: var(--medical-blue);
      font-size: 1.5rem;
    }

    .add-btn {
      background: linear-gradient(135deg, var(--medical-blue) 0%, rgba(var(--color-blue-tec), 0.9) 100%);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: var(--bmb-radius-m, 1rem);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(var(--color-blue-tec), 0.2);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.95rem;
      white-space: nowrap;
    }

    .add-btn .btn-icon {
      font-size: 1.1rem;
      line-height: 1;
    }

    .add-btn .btn-text {
      font-weight: 600;
      color: white;
    }

    .add-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(var(--color-blue-tec), 0.3);
    }

    /* Content area */
    .admin-content {
      padding: 2rem;
    }

    /* Tabla siguiendo patrón premium */
    .pills-table-container {
      background: var(--medical-surface);
      border-radius: var(--bmb-radius-m, 1rem);
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
    }

    .pills-table {
      width: 100%;
      border-collapse: collapse;
    }
      
    .pills-table th {
      background: linear-gradient(135deg, #f8fafb 0%, #f1f5f9 100%);
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: var(--medical-text-primary);
      border-bottom: 1px solid var(--medical-divider);
    }
      
    .pills-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--medical-divider);
      vertical-align: middle;
    }
      
    .pills-table tbody tr:hover {
      background: var(--medical-context-active);
    }

    .icon-cell {
      font-size: 1.5rem;
      text-align: center;
      width: 60px;
    }

    .text-cell {
      max-width: 300px;
      font-weight: 500;
    }

    .category-cell, .priority-cell {
      text-align: center;
    }

    .category-badge, .priority-badge {
      padding: 0.25rem 0.75rem;
      border-radius: var(--bmb-radius-full);
      font-size: 0.875rem;
      font-weight: 500;
    }

    /* Badges de categoría */
    .category-diagnosis { background: #dbeafe; color: #1e40af; }
    .category-symptoms { background: #fef3c7; color: #92400e; }
    .category-treatment { background: #d1fae5; color: #065f46; }
    .category-medication { background: #e0e7ff; color: #3730a3; }
    .category-tests { background: #fce7f3; color: #be185d; }
    .category-emergency { background: #fee2e2; color: #dc2626; }
    .category-follow-up { background: #f0fdf4; color: #166534; }
    .category-prevention { background: #ecfdf5; color: #047857; }

    /* Badges de prioridad */
    .priority-high { background: #fee2e2; color: #dc2626; }
    .priority-medium { background: #fef3c7; color: #d97706; }
    .priority-low { background: #ecfdf5; color: #059669; }

    .actions-cell {
      text-align: center;
      width: 120px;
    }

    .action-btn {
      background: none;
      border: 1px solid var(--medical-divider);
      padding: 0.5rem;
      margin: 0 0.25rem;
      border-radius: var(--bmb-radius-s);
      cursor: pointer;
      transition: all 0.2s ease;
      font-size: 1rem;
    }

    .action-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .edit-btn:hover {
      background: #fef3c7;
      border-color: #d97706;
    }

    .delete-btn:hover {
      background: #fee2e2;
      border-color: #dc2626;
    }

    /* Estado vacío */
    .empty-state {
      text-align: center;
      padding: 3rem;
      color: var(--medical-text-secondary);
    }

    .empty-state .add-btn {
      margin-top: 1rem;
    }

    /* Modal siguiendo patrón premium existente */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      backdrop-filter: blur(15px);
    }

    .modal-content {
      background: #ffffff;
      border-radius: var(--bmb-radius-m, 1rem);
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), 0 10px 20px rgba(0, 0, 0, 0.25);
      max-width: 600px;
      width: 90%;
      max-height: 90vh;
      overflow-y: auto;
      animation: modalFadeIn 0.3s ease-out;
      border: 1px solid rgba(0, 0, 0, 0.1);
    }

    @keyframes modalFadeIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-30px);
        filter: blur(2px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
        filter: blur(0);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.5rem;
      border-bottom: 1px solid var(--medical-divider);
      background: linear-gradient(135deg, 
        rgba(var(--color-blue-tec), 0.03) 0%, 
        rgba(var(--color-blue-tec), 0.01) 100%
      );
      backdrop-filter: blur(10px);
    }
      
    .modal-header h3 {
      margin: 0;
      color: var(--medical-blue);
      font-weight: 600;
      font-size: 1.25rem;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--medical-text-secondary);
      padding: 0.5rem;
      border-radius: var(--bmb-radius-s);
      transition: all 0.3s ease;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
      
    .close-btn:hover {
      background: rgba(var(--color-blue-tec), 0.1);
      color: var(--medical-text-primary);
      transform: scale(1.05);
      box-shadow: 0 2px 8px rgba(var(--color-blue-tec), 0.2);
    }

    /* Form styles siguiendo patrón premium */
    .pill-form {
      padding: 1.5rem;
    }

    .form-group {
      margin-bottom: 1.5rem;
    }
      
    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: var(--medical-text-primary);
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-input, .form-select {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--medical-divider);
      border-radius: var(--bmb-radius-s);
      font-size: 1rem;
      transition: all 0.2s;
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: var(--medical-blue);
      box-shadow: 0 0 0 3px rgba(var(--color-blue-tec), 0.1);
    }

    /* Icon selector premium */
    .icon-selector {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .icon-input {
      width: 80px;
      text-align: center;
      font-size: 1.5rem;
    }

    .icon-options {
      display: grid;
      grid-template-columns: repeat(8, 1fr);
      gap: 0.5rem;
    }

    .icon-option {
      background: var(--medical-background);
      border: 1px solid var(--medical-divider);
      padding: 0.5rem;
      border-radius: var(--bmb-radius-s);
      cursor: pointer;
      font-size: 1.25rem;
      transition: all 0.2s;
    }

    .icon-option:hover, .icon-option.selected {
      background: var(--medical-blue);
      color: white;
      transform: scale(1.1);
    }

    /* Form actions */
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 1rem;
      margin-top: 2rem;
      padding-top: 1rem;
      border-top: 1px solid var(--medical-divider);
    }

    .cancel-btn, .save-btn, .delete-confirm-btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: var(--bmb-radius-s);
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .cancel-btn {
      background: var(--medical-background);
      color: var(--medical-text-secondary);
      border: 1px solid var(--medical-divider);
    }

    .cancel-btn:hover {
      background: rgba(var(--color-blue-tec), 0.05);
      border-color: rgba(var(--color-blue-tec), 0.2);
      color: var(--medical-text-primary);
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .save-btn {
      background: linear-gradient(135deg, var(--medical-blue) 0%, rgba(var(--color-blue-tec), 0.9) 100%);
      color: white;
    }

    .save-btn:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 4px 8px rgba(var(--color-blue-tec), 0.2);
    }
      
    .save-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .delete-confirm-btn {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
      color: white;
      border: 1px solid rgba(220, 38, 38, 0.3);
    }

    .delete-confirm-btn:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(220, 38, 38, 0.3);
      background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
    }

    /* Delete modal específico */
    .delete-modal {
      max-width: 450px;
    }

    .delete-content {
      padding: 2rem;
      text-align: center;
    }
      
    .delete-content .warning-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      animation: warningPulse 2s infinite;
    }

    @keyframes warningPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
      
    .delete-content p {
      margin: 1rem 0;
      color: var(--medical-text-primary);
      font-size: 1rem;
      line-height: 1.5;
    }
      
    .delete-content .warning-text {
      color: var(--medical-text-secondary);
      font-size: 0.875rem;
      font-style: italic;
    }

    .pill-preview {
      background: linear-gradient(135deg, 
        rgba(var(--color-blue-tec), 0.05) 0%, 
        rgba(var(--color-blue-tec), 0.02) 100%
      );
      padding: 1rem;
      border-radius: var(--bmb-radius-s);
      margin: 1rem 0;
      border: 1px solid rgba(var(--color-blue-tec), 0.2);
      backdrop-filter: blur(10px);
    }
      
    .pill-preview .preview-icon {
      font-size: 1.5rem;
      margin-right: 0.5rem;
    }
      
    .pill-preview .preview-text {
      font-weight: 500;
      color: var(--medical-blue);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .admin-header {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }
        
      .admin-header h1 {
        text-align: center;
        font-size: 1.25rem;
      }
      
      .pills-table {
        font-size: 0.875rem;
      }
        
      .pills-table .text-cell {
        max-width: 200px;
      }
      
      .form-row {
        grid-template-columns: 1fr;
      }
      
      .icon-options {
        grid-template-columns: repeat(6, 1fr);
      }
      
      .modal-content {
        width: 95%;
        margin: 1rem;
      }
    }
  `]
})
export class AdminPillsManagerComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Datos mock para demostración
  pills: QuickPillData[] = [];
  
  // Modal states
  showFormModal = false;
  showDeleteModal = false;
  isEditMode = false;
  pillToDelete: QuickPillData | null = null;
  editingPillId: string | null = null;

  // Form data
  formData: PillFormData = {
    text: '',
    icon: '',
    category: '',
    priority: ''
  };

  // Icon options para selector
  iconOptions = ['🩺', '💊', '📋', '🏥', '🔬', '🚨', '📝', '⏰', '🤒', '💉', '📊', '⚠️', '🛡️', '🤱', '👶', '👴', '📸', '📈', '👨‍⚕️'];

  constructor() {}

  ngOnInit(): void {
    this.loadPills();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // CRUD Operations usando mocks
  private loadPills(): void {
    // Mock data - reutiliza las pastillas del servicio existente
    this.pills = [
      { id: 'q1', text: 'Realizar diagnóstico inicial', icon: '🩺', category: 'diagnosis', priority: 'high' },
      { id: 'q2', text: 'Revisar medicamentos', icon: '💊', category: 'medication', priority: 'medium' },
      { id: 'q3', text: 'Analizar síntomas', icon: '📋', category: 'symptoms', priority: 'high' },
      { id: 'q4', text: 'Recomendar especialista', icon: '🏥', category: 'treatment', priority: 'medium' },
      { id: 'q5', text: 'Evalúa la urgencia de este caso', icon: '🚨', category: 'emergency', priority: 'high' },
      { id: 'q6', text: 'Qué exámenes clínicos recomiendas', icon: '🔬', category: 'tests', priority: 'medium' }
    ];
  }

  openCreateModal(): void {
    this.isEditMode = false;
    this.resetForm();
    this.showFormModal = true;
  }

  openEditModal(pill: QuickPillData): void {
    this.isEditMode = true;
    this.editingPillId = pill.id;
    this.formData = {
      text: pill.text,
      icon: pill.icon,
      category: pill.category,
      priority: pill.priority
    };
    this.showFormModal = true;
  }

  openDeleteModal(pill: QuickPillData): void {
    this.pillToDelete = pill;
    this.showDeleteModal = true;
  }

  closeFormModal(): void {
    this.showFormModal = false;
    this.resetForm();
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.pillToDelete = null;
  }

  private resetForm(): void {
    this.formData = {
      text: '',
      icon: '',
      category: '',
      priority: ''
    };
    this.editingPillId = null;
  }

  selectIcon(icon: string): void {
    this.formData.icon = icon;
  }

  savePill(): void {
    if (this.isEditMode && this.editingPillId) {
      // Update existing pill (mock)
      const index = this.pills.findIndex(p => p.id === this.editingPillId);
      if (index !== -1) {
        this.pills[index] = {
          ...this.pills[index],
          text: this.formData.text,
          icon: this.formData.icon,
          category: this.formData.category,
          priority: this.formData.priority
        };
      }
    } else {
      // Create new pill (mock)
      const newPill: QuickPillData = {
        id: 'q' + (this.pills.length + 1),
        text: this.formData.text,
        icon: this.formData.icon,
        category: this.formData.category,
        priority: this.formData.priority
      };
      this.pills.push(newPill);
    }

    this.closeFormModal();
  }

  confirmDelete(): void {
    if (this.pillToDelete) {
      // Delete pill (mock)
      this.pills = this.pills.filter(p => p.id !== this.pillToDelete!.id);
      this.closeDeleteModal();
    }
  }

  // Utility methods
  getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      'diagnosis': 'Diagnóstico',
      'symptoms': 'Síntomas',
      'treatment': 'Tratamiento',
      'medication': 'Medicamentos',
      'tests': 'Exámenes',
      'emergency': 'Emergencia',
      'follow-up': 'Seguimiento',
      'prevention': 'Prevención'
    };
    return labels[category] || category;
  }

  getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      'high': 'Alta',
      'medium': 'Media',
      'low': 'Baja'
    };
    return labels[priority] || priority;
  }

  trackByPill(index: number, pill: QuickPillData): string {
    return pill.id;
  }
} 