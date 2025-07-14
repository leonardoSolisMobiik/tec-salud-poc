import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

/**
 * Interface for Quick Pill data structure
 * 
 * @interface QuickPillData
 * @description Defines the structure for quick pill items with unique ID,
 * text content, visual icon, category classification, and priority level.
 */
interface QuickPillData {
  /** Unique identifier for the pill */
  id: string;
  
  /** Text content or question template */
  text: string;
  
  /** Icon emoji for visual representation */
  icon: string;
  
  /** Category classification (symptoms, diagnosis, etc.) */
  category: string;
  
  /** Priority level (high, medium, low) */
  priority: string;
}

/**
 * Interface for pill form data
 * 
 * @interface PillFormData
 * @description Structure for form input data when creating or editing pills.
 * Similar to QuickPillData but without ID (generated automatically).
 */
interface PillFormData {
  /** Text content or question template */
  text: string;
  
  /** Icon emoji for visual representation */
  icon: string;
  
  /** Category classification */
  category: string;
  
  /** Priority level */
  priority: string;
}

/**
 * Admin Pills Manager Component for managing quick question templates
 * 
 * @description Administrative interface for managing quick pill templates
 * used in the medical chat system. Provides full CRUD operations for
 * organizing and maintaining question templates by category and priority.
 * 
 * @example
 * ```typescript
 * // Used in admin route
 * // Route: '/admin-pills'
 * <app-admin-pills-manager></app-admin-pills-manager>
 * 
 * // Provides:
 * // - List of existing pills with categorization
 * // - Create new pill with form modal
 * // - Edit existing pill in-place
 * // - Delete pill with confirmation
 * // - Category and priority management
 * ```
 * 
 * @features
 * - CRUD operations for quick pill templates
 * - Category-based organization (symptoms, diagnosis, treatment, etc.)
 * - Priority-based sorting (high, medium, low)
 * - Modal forms for create/edit operations
 * - Icon selection from predefined medical icons
 * - Responsive table layout with hover effects
 * - Confirmation dialogs for destructive actions
 * - Local storage persistence
 * 
 * @categories
 * - symptoms: Symptom-related questions
 * - diagnosis: Diagnostic inquiries
 * - treatment: Treatment recommendations
 * - urgency: Urgency assessments
 * - history: Medical history questions
 * - general: General medical questions
 * 
 * @priorities
 * - high: Critical/urgent questions
 * - medium: Standard questions
 * - low: Optional/supplementary questions
 * 
 * @since 1.0.0
 */
@Component({
  selector: 'app-admin-pills-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="global-container">
      <!-- Header siguiendo patrón existente -->
      <div class="global-header">
        <div class="header-top">
          <button 
            class="global-back-button"
            (click)="goBack()"
            title="Volver al dashboard">
            <span class="back-icon">←</span>
            <span class="back-text">Volver</span>
          </button>
          
          <div class="title-container">
            <h1 class="main-title">💊 Gestión de Pastillas</h1>
            <div class="main-subtitle">
              Administra las pastillas de preguntas rápidas para el chat médico
            </div>
          </div>
        </div>
        
        <div class="header-actions">
          <button class="add-btn" (click)="openCreateModal()">
            <span class="btn-icon">➕</span>
            <span class="btn-text">Nueva Pastilla</span>
          </button>
        </div>
      </div>

      <!-- Tabla simple siguiendo patrón existente -->
      <div class="admin-content">
        <div class="global-admin-panel pills-table-container">
          
          <!-- Vista de tabla para pantallas grandes -->
          <table class="pills-table desktop-view" *ngIf="pills.length > 0">
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

          <!-- Vista de tarjetas para pantallas pequeñas -->
          <div class="pills-cards mobile-view" *ngIf="pills.length > 0">
            <div class="pill-card" *ngFor="let pill of pills; trackBy: trackByPill">
              
              <!-- Card Header -->
              <div class="card-header">
                <div class="pill-icon">{{ pill.icon }}</div>
                <div class="pill-text">{{ pill.text }}</div>
              </div>
              
              <!-- Card Content -->
              <div class="card-content">
                <div class="pill-info">
                  <div class="info-item">
                    <span class="info-label">Categoría:</span>
                    <span class="category-badge" [class]="'category-' + pill.category">
                      {{ getCategoryLabel(pill.category) }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">Prioridad:</span>
                    <span class="priority-badge" [class]="'priority-' + pill.priority">
                      {{ getPriorityLabel(pill.priority) }}
                    </span>
                  </div>
                </div>
                
                <!-- Card Actions -->
                <div class="card-actions">
                  <button class="action-btn edit-btn" (click)="openEditModal(pill)">
                    <span>✏️</span>
                    <span>Editar</span>
                  </button>
                  <button class="action-btn delete-btn" (click)="openDeleteModal(pill)">
                    <span>🗑️</span>
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
              
            </div>
          </div>

          <div class="empty-state" *ngIf="pills.length === 0">
            <p>No hay pastillas configuradas.</p>
            <button class="add-btn" (click)="openCreateModal()">➕ Crear Primera Pastilla</button>
          </div>
        </div>
      </div>

      <!-- Modal Create/Edit usando sistema estandarizado -->
      <div class="modal-overlay" *ngIf="showFormModal" (click)="closeFormModal()">
        <div class="modal-content modal-md" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">{{ isEditMode ? '✏️ Editar Pastilla' : '➕ Nueva Pastilla' }}</h3>
            <button class="modal-close" (click)="closeFormModal()">✕</button>
          </div>

          <div class="modal-body">
            <form class="modal-form" (ngSubmit)="savePill()" #pillForm="ngForm">
              <div class="form-group">
                <label class="form-label" for="pillText">Texto de la pregunta: *</label>
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
                <label class="form-label" for="pillIcon">Icono: *</label>
                <div class="icon-selector">
                  <input
                    type="text"
                    id="pillIcon"
                    name="pillIcon"
                    [(ngModel)]="formData.icon"
                    required
                    maxlength="2"
                    placeholder="🩺"
                    class="form-input">
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
                  <label class="form-label" for="pillCategory">Categoría: *</label>
                  <select
                    id="pillCategory"
                    name="pillCategory"
                    [(ngModel)]="formData.category"
                    required
                    class="form-select">
                    <option value="general">General</option>
                    <option value="emergency">Emergencia</option>
                    <option value="prevention">Prevención</option>
                    <option value="medication">Medicación</option>
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for="pillPriority">Prioridad: *</label>
                  <select
                    id="pillPriority"
                    name="pillPriority"
                    [(ngModel)]="formData.priority"
                    required
                    class="form-select">
                    <option value="high">Alta</option>
                    <option value="medium">Media</option>
                    <option value="low">Baja</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeFormModal()">
              <span>❌</span>
              <span>Cancelar</span>
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="!pillForm.valid" (click)="savePill()">
              <span>💾</span>
              <span>Guardar</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Delete usando sistema estandarizado -->
      <div class="modal-overlay" *ngIf="showDeleteModal" (click)="closeDeleteModal()">
        <div class="modal-content modal-sm modal-danger" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h3 class="modal-title">🗑️ Eliminar Pastilla</h3>
            <button class="modal-close" (click)="closeDeleteModal()">✕</button>
          </div>

          <div class="modal-body">
            <div class="confirmation-content">
              <div class="warning-icon">⚠️</div>
              <p class="confirmation-message">¿Estás seguro de eliminar esta pastilla?</p>
              <div class="item-preview" *ngIf="pillToDelete">
                <span class="preview-icon">{{ pillToDelete.icon }}</span>
                <span class="preview-text">"{{ pillToDelete.text }}"</span>
              </div>
              <p class="warning-text">Esta acción no se puede deshacer.</p>
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="closeDeleteModal()">
              <span>❌</span>
              <span>Cancelar</span>
            </button>
            <button type="button" class="btn btn-danger" (click)="confirmDelete()">
              <span>🗑️</span>
              <span>Sí, eliminar</span>
            </button>
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

    /* 🎯 RESET Y DEBUG DE TABLA */
    .pills-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: auto; /* Auto para distribución natural */
    }
    
    .pills-table *,
    .pills-table *::before,
    .pills-table *::after {
      box-sizing: border-box;
    }
      
    .pills-table th {
      background: linear-gradient(135deg, #f8fafb 0%, #f1f5f9 100%);
      padding: 1rem;
      text-align: left;
      font-weight: 600;
      color: var(--medical-text-primary);
      border-bottom: 1px solid var(--medical-divider);
      position: relative;
      vertical-align: middle;
    }
    
    /* DEBUG: Anchos específicos para cada columna */
    .pills-table th:nth-child(1) {
      width: 10%;
      text-align: center;
    }
    
    .pills-table th:nth-child(2) {
      width: 40%;
      text-align: left;
    }
    
    .pills-table th:nth-child(3) {
      width: 20%;
      text-align: center;
    }
    
    .pills-table th:nth-child(4) {
      width: 15%;
      text-align: center;
    }
    
    .pills-table th:nth-child(5) {
      width: 15%;
      text-align: center;
    }
      
    .pills-table td {
      padding: 1rem;
      border-bottom: 1px solid var(--medical-divider);
      vertical-align: middle;
      position: relative;
    }
    
    /* DEBUG: Alineación de celdas de datos */
    .pills-table td:nth-child(1) {
      text-align: center;
      font-size: 1.5rem;
    }
    
    .pills-table td:nth-child(2) {
      text-align: left;
      font-weight: 500;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }
    
    .pills-table td:nth-child(3) {
      text-align: center;
    }
    
    .pills-table td:nth-child(4) {
      text-align: center;
    }
    
    .pills-table td:nth-child(5) {
      text-align: center;
    }
      
    .pills-table tbody tr:hover {
      background: var(--medical-context-active);
    }

    /* Clases específicas removidas - Ahora se usan nth-child para mayor precisión */

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

    /* 🎯 FORM ROW - ESPECÍFICO DEL COMPONENTE */
    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--bmb-spacing-m);
    }

    @media (max-width: 950px) {
      .form-row {
        grid-template-columns: 1fr;
      }
    }

    /* 📱 VISTA MÓVIL - TARJETAS RESPONSIVE */
    .mobile-view {
      display: none; /* Oculto por defecto, se muestra en móvil */
    }
    
    .pills-cards {
      display: flex;
      flex-direction: column;
      gap: var(--bmb-spacing-m);
    }

    .pill-card {
      background: var(--general_contrasts-15);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-m);
      transition: all 0.3s ease;
      
      &:hover {
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        transform: translateY(-2px);
      }
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-m);
      margin-bottom: var(--bmb-spacing-m);
      padding-bottom: var(--bmb-spacing-m);
      border-bottom: 1px solid var(--general_contrasts-25);
      
      .pill-icon {
        font-size: 2rem;
        min-width: 50px;
        text-align: center;
      }
      
      .pill-text {
        flex: 1;
        font-weight: 600;
        color: var(--general_contrasts-100);
        font-size: 1.1rem;
        line-height: 1.4;
      }
    }

    .card-content {
      .pill-info {
        margin-bottom: var(--bmb-spacing-m);
        
        .info-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--bmb-spacing-s);
          
          .info-label {
            font-weight: 500;
            color: var(--general_contrasts-75);
            font-size: 0.9rem;
          }
        }
      }
      
      .card-actions {
        display: flex;
        gap: var(--bmb-spacing-s);
        
        .action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--bmb-spacing-xs);
          padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
          border-radius: var(--bmb-radius-s);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border: none;
          font-size: 0.9rem;
          
          &.edit-btn {
            background: rgba(var(--color-blue-tec), 0.1);
            color: rgb(var(--color-blue-tec));
            
            &:hover {
              background: rgba(var(--color-blue-tec), 0.2);
              transform: translateY(-1px);
            }
          }
          
          &.delete-btn {
            background: rgba(244, 67, 54, 0.1);
            color: #EF4444;
            
            &:hover {
              background: rgba(244, 67, 54, 0.2);
              transform: translateY(-1px);
            }
          }
        }
      }
    }

    /* 📱 RESPONSIVE BREAKPOINTS */
    @media (max-width: 950px) {
      .desktop-view {
        display: none !important; /* Ocultar tabla en móvil */
      }
      
      .mobile-view {
        display: block !important; /* Mostrar tarjetas en móvil */
      }
      
      .global-admin-panel {
        padding: var(--bmb-spacing-m) !important;
      }
    }

    @media (min-width: 951px) {
      .desktop-view {
        display: table !important; /* Mostrar tabla en desktop */
      }
      
      .mobile-view {
        display: none !important; /* Ocultar tarjetas en desktop */
      }
    }

    /* 🎯 ICON SELECTOR - ESPECÍFICO DEL COMPONENTE */
    .icon-selector {
      .icon-options {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: var(--bmb-spacing-s);
        margin-top: var(--bmb-spacing-s);
      }

      .icon-option {
        aspect-ratio: 1;
        border: 2px solid var(--general_contrasts-25);
        border-radius: var(--bmb-radius-s);
        background: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: var(--text-xl);
        transition: all 0.2s ease;

        &:hover {
          border-color: rgb(var(--color-blue-tec));
          background: rgba(var(--color-blue-tec), 0.05);
          transform: scale(1.05);
        }

        &.selected {
          border-color: rgb(var(--color-blue-tec));
          background: rgba(var(--color-blue-tec), 0.1);
        }
      }
    }

    /* 📱 RESPONSIVE ESPECÍFICO */
    @media (max-width: 950px) {
      .icon-selector .icon-options {
        grid-template-columns: repeat(6, 1fr);
      }
    }

    /* 🎯 PILLS TABLE - ESTILOS SIMPLES PARA DEPURACIÓN */
    .pills-table {
      tbody tr {
        transition: background-color 0.2s ease;
        
        &:hover {
          background-color: rgba(var(--color-blue-tec), 0.05) !important;
        }
      }
    }
    
    /* 📱 MOBILE CARDS - ESTILOS SIMPLES PARA DEPURACIÓN */
    .pill-card {
      transition: background-color 0.2s ease;
      
      &:hover {
        background-color: rgba(var(--color-blue-tec), 0.05) !important;
      }
    }
  `]
})
export class AdminPillsManagerComponent implements OnInit, OnDestroy {
  /** Subject for managing component subscriptions cleanup */
  private destroy$ = new Subject<void>();

  /** Array of quick pill data items */
  pills: QuickPillData[] = [];
  
  /** Form modal visibility state */
  showFormModal = false;
  
  /** Delete confirmation modal visibility state */
  showDeleteModal = false;
  
  /** Flag indicating if form is in edit mode */
  isEditMode = false;
  
  /** Reference to pill being deleted */
  pillToDelete: QuickPillData | null = null;
  
  /** ID of pill being edited */
  editingPillId: string | null = null;

  /** Form data for creating/editing pills */
  formData: PillFormData = {
    text: '',
    icon: '',
    category: '',
    priority: ''
  };

  /** Available medical icons for pill selection */
  iconOptions = ['🩺', '💊', '📋', '🏥', '🔬', '🚨', '📝', '⏰', '🤒', '💉', '📊', '⚠️', '🛡️', '🤱', '👶', '👴', '📸', '📈', '👨‍⚕️'];

  /**
   * Creates an instance of AdminPillsManagerComponent
   * 
   * @description Initializes the component with default form state
   */
  constructor() {}

  /**
   * Component initialization lifecycle hook
   * 
   * @description Loads existing pills from localStorage on component initialization
   */
  ngOnInit(): void {
    this.loadPills();
  }

  /**
   * Component destruction lifecycle hook
   * 
   * @description Cleans up subscriptions to prevent memory leaks
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Loads pills from mock data
   * 
   * @private
   * @description Initializes the pills array with default medical templates
   * for demonstration purposes. In production, this would load from a service or API.
   */
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

  /**
   * Opens the create pill modal
   * 
   * @description Sets up the form for creating a new pill by resetting
   * form data and opening the modal in create mode
   * 
   * @example
   * ```typescript
   * this.openCreateModal(); // Opens modal for new pill creation
   * ```
   */
  openCreateModal(): void {
    this.isEditMode = false;
    this.resetForm();
    this.showFormModal = true;
  }

  /**
   * Opens the edit pill modal
   * 
   * @param pill - The pill to edit
   * 
   * @description Sets up the form for editing an existing pill by
   * populating form data and opening the modal in edit mode
   * 
   * @example
   * ```typescript
   * this.openEditModal(existingPill); // Opens modal for editing
   * ```
   */
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

  /**
   * Opens the delete confirmation modal
   * 
   * @param pill - The pill to delete
   * 
   * @description Sets up the delete confirmation modal with
   * reference to the pill to be deleted
   * 
   * @example
   * ```typescript
   * this.openDeleteModal(pillToDelete); // Opens delete confirmation
   * ```
   */
  openDeleteModal(pill: QuickPillData): void {
    this.pillToDelete = pill;
    this.showDeleteModal = true;
  }

  /**
   * Closes the form modal
   * 
   * @description Hides the form modal and resets form data
   */
  closeFormModal(): void {
    this.showFormModal = false;
    this.resetForm();
  }

  /**
   * Closes the delete confirmation modal
   * 
   * @description Hides the delete modal and clears delete reference
   */
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.pillToDelete = null;
  }

  /**
   * Resets the form to default values
   * 
   * @private
   * @description Clears all form data and resets to default state
   */
  private resetForm(): void {
    this.formData = {
      text: '',
      icon: '',
      category: '',
      priority: ''
    };
    this.editingPillId = null;
  }

  /**
   * Selects an icon for the pill
   * 
   * @param icon - The icon emoji to select
   * 
   * @description Updates the form data with the selected icon
   * 
   * @example
   * ```typescript
   * this.selectIcon('💊'); // Sets pill icon to medicine emoji
   * ```
   */
  selectIcon(icon: string): void {
    this.formData.icon = icon;
  }

  /**
   * Saves the pill (create or update)
   * 
   * @description Handles both creating new pills and updating existing ones
   * based on the current form mode. Uses mock data for demonstration.
   * 
   * @example
   * ```typescript
   * this.savePill(); // Saves current form data as new or updated pill
   * ```
   */
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

  /**
   * Confirms and executes pill deletion
   * 
   * @description Removes the selected pill from the array using mock data
   * 
   * @example
   * ```typescript
   * this.confirmDelete(); // Deletes the pill and closes modal
   * ```
   */
  confirmDelete(): void {
    if (this.pillToDelete) {
      // Delete pill (mock)
      this.pills = this.pills.filter(p => p.id !== this.pillToDelete!.id);
      this.closeDeleteModal();
    }
  }

  /**
   * Gets the display label for a category
   * 
   * @param category - The category key
   * @returns Localized category label
   * 
   * @description Converts category keys to user-friendly Spanish labels
   * 
   * @example
   * ```typescript
   * this.getCategoryLabel('symptoms'); // Returns "Síntomas"
   * ```
   */
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

  /**
   * Gets the display label for a priority
   * 
   * @param priority - The priority key
   * @returns Localized priority label
   * 
   * @description Converts priority keys to user-friendly Spanish labels
   * 
   * @example
   * ```typescript
   * this.getPriorityLabel('high'); // Returns "Alta"
   * ```
   */
  getPriorityLabel(priority: string): string {
    const labels: { [key: string]: string } = {
      'high': 'Alta',
      'medium': 'Media',
      'low': 'Baja'
    };
    return labels[priority] || priority;
  }

  /**
   * TrackBy function for pills list optimization
   * 
   * @param index - Array index (unused)
   * @param pill - Pill object
   * @returns Unique identifier for the pill
   * 
   * @description Helps Angular track pills for efficient DOM updates
   */
  trackByPill(index: number, pill: QuickPillData): string {
    return pill.id;
  }
  
  /**
   * Navigates back to the previous page
   * 
   * @description Uses browser history to go back to the previous page
   * 
   * @example
   * ```typescript
   * this.goBack(); // Navigates back in browser history
   * ```
   */
  goBack(): void {
    window.history.back();
  }
} 