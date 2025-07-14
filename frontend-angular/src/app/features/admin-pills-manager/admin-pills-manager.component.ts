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
          <div class="header-back-row">
            <button
              class="global-back-button"
              (click)="goBack()"
              title="Volver al dashboard">
              <span class="back-icon">←</span>
              <span class="back-text">Volver</span>
            </button>
          </div>

          <div class="header-title-row">
            <div class="title-container">
              <h1 class="main-title">💊 Gestión de Pastillas</h1>
              <div class="main-subtitle">
                Administra las pastillas de preguntas rápidas para el chat médico
              </div>
            </div>

            <div class="header-actions">
              <button class="add-btn" (click)="openCreateModal()">
                <span class="btn-icon">➕</span>
                <span class="btn-text">Nueva Pastilla</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Premium Pills List -->
      <div class="admin-content">
        <div class="pills-section">
          <h3 class="section-title">💊 Pastillas Disponibles</h3>

          <!-- Premium Pills List -->
          <div class="pills-list" *ngIf="pills.length > 0">
            <div
              *ngFor="let pill of pills; trackBy: trackByPill"
              class="pill-item"
              [class]="'priority-' + pill.priority">

              <!-- Pill Icon & Info -->
              <div class="pill-info">
                <div class="pill-icon-container">
                  <span class="pill-icon">{{ pill.icon }}</span>
                </div>
                <div class="pill-content">
                  <div class="pill-text">{{ pill.text }}</div>
                  <div class="pill-meta">
                    <span class="category-badge" [class]="'category-' + pill.category">
                      {{ getCategoryLabel(pill.category) }}
                    </span>
                    <span class="priority-indicator" [class]="'priority-' + pill.priority">
                      {{ getPriorityLabel(pill.priority) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Pill Actions -->
              <div class="pill-actions">
                <button
                  class="action-button edit-button"
                  (click)="openEditModal(pill)"
                  title="Editar pastilla">
                  <span class="action-icon">✏️</span>
                  <span class="action-text">Editar</span>
                </button>
                <button
                  class="action-button delete-button"
                  (click)="openDeleteModal(pill)"
                  title="Eliminar pastilla">
                  <span class="action-icon">🗑️</span>
                  <span class="action-text">Eliminar</span>
                </button>
              </div>

            </div>
          </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="pills.length === 0">
            <div class="empty-icon">💊</div>
            <h3 class="empty-title">No hay pastillas configuradas</h3>
            <p class="empty-subtitle">Crea tu primera pastilla para empezar a configurar preguntas rápidas</p>
            <button class="empty-action-btn" (click)="openCreateModal()">
              <span class="btn-icon">➕</span>
              <span class="btn-text">Crear Primera Pastilla</span>
            </button>
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
    /* 🎨 ADMIN PILLS MANAGER - PREMIUM LIST DESIGN */

    .admin-content {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 var(--bmb-spacing-l);
    }

    .pills-section {
      background: var(--general_contrasts-surface);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-l);
      padding: var(--bmb-spacing-l);
      box-shadow: var(--medical-shadow);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: var(--medical-shadow-hover);
      }

      .section-title {
        color: var(--general_contrasts-text-primary);
        font-size: var(--text-2xl);
        font-weight: var(--font-bold);
        margin: 0 0 var(--bmb-spacing-l) 0;
        text-align: center;
        font-family: var(--font-display);
        background: linear-gradient(135deg,
          rgb(var(--color-blue-tec)) 0%,
          rgb(var(--color-mariner-100)) 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
    }

    /* 📋 PREMIUM PILLS LIST */
    .pills-list {
      display: flex;
      flex-direction: column;
      gap: var(--bmb-spacing-m);
    }

    .pill-item {
      background: var(--general_contrasts-15);
      border: 1px solid var(--general_contrasts-container-outline);
      border-radius: var(--bmb-radius-m);
      padding: var(--bmb-spacing-m);
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-m);
      transition: all 0.3s ease;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      border-left: none;
      border-right: none;

      &:hover {
        background: rgba(var(--color-blue-tec), 0.15);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(var(--color-blue-tec), 0.15);
      }
    }

    .pill-info {
      display: flex;
      align-items: center;
      gap: var(--bmb-spacing-m);
      flex: 1;
      min-width: 0;

      .pill-icon-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 48px;
        height: 48px;
        background: rgba(var(--color-blue-tec), 0.1);
        border: 1px solid rgba(var(--color-blue-tec), 0.2);
        border-radius: var(--bmb-radius-m);
        flex-shrink: 0;

        .pill-icon {
          font-size: var(--text-xl);
        }
      }

      .pill-content {
        flex: 1;
        min-width: 0;

        .pill-text {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          color: var(--general_contrasts-text-primary);
          margin-bottom: var(--bmb-spacing-xs);
          line-height: var(--leading-tight);
          word-wrap: break-word;
          overflow-wrap: break-word;
        }

        .pill-meta {
          display: flex;
          align-items: center;
          gap: var(--bmb-spacing-s);
          flex-wrap: wrap;

          .category-badge {
            padding: var(--bmb-spacing-xs) var(--bmb-spacing-s);
            border-radius: var(--bmb-radius-s);
            font-size: var(--text-xs);
            font-weight: var(--font-semibold);
            text-transform: uppercase;
            letter-spacing: 0.5px;

            &.category-symptoms {
              background: rgba(244, 67, 54, 0.1);
              color: var(--semantic-error);
              border: 1px solid rgba(244, 67, 54, 0.2);
            }

            &.category-diagnosis {
              background: rgba(var(--color-blue-tec), 0.1);
              color: rgba(var(--color-blue-tec), 1);
              border: 1px solid rgba(var(--color-blue-tec), 0.2);
            }

            &.category-treatment {
              background: rgba(76, 175, 80, 0.1);
              color: var(--semantic-success);
              border: 1px solid rgba(76, 175, 80, 0.2);
            }

            &.category-general {
              background: rgba(158, 158, 158, 0.1);
              color: var(--general_contrasts-75);
              border: 1px solid rgba(158, 158, 158, 0.2);
            }
          }

          .priority-indicator {
            padding: var(--bmb-spacing-xs) var(--bmb-spacing-s);
            border-radius: var(--bmb-radius-s);
            font-size: var(--text-xs);
            font-weight: var(--font-bold);
            text-transform: uppercase;
            letter-spacing: 0.5px;

            &.priority-high {
              background: rgba(244, 67, 54, 0.1);
              color: var(--semantic-error);
            }

            &.priority-medium {
              background: rgba(var(--color-blue-tec), 0.1);
              color: rgba(var(--color-blue-tec), 1);
            }

            &.priority-low {
              background: rgba(76, 175, 80, 0.1);
              color: var(--semantic-success);
            }
          }
        }
      }
    }

    .pill-actions {
      display: flex;
      gap: var(--bmb-spacing-s);
      flex-shrink: 0;

      .action-button {
        display: flex;
        align-items: center;
        gap: var(--bmb-spacing-xs);
        padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
        border: 1px solid var(--general_contrasts-container-outline);
        border-radius: var(--bmb-radius-s);
        background: var(--general_contrasts-surface);
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: var(--text-sm);
        font-weight: var(--font-medium);

        .action-icon {
          font-size: var(--text-sm);
        }

        .action-text {
          font-size: var(--text-sm);
        }

        &.edit-button {
          color: rgba(var(--color-blue-tec), 1);
          border-color: rgba(var(--color-blue-tec), 0.2);

          &:hover {
            background: rgba(var(--color-blue-tec), 0.1);
            border-color: rgba(var(--color-blue-tec), 0.4);
            transform: translateY(-1px);
          }
        }

        &.delete-button {
          color: var(--semantic-error);
          border-color: rgba(244, 67, 54, 0.2);

          &:hover {
            background: rgba(244, 67, 54, 0.1);
            border-color: rgba(244, 67, 54, 0.4);
            transform: translateY(-1px);
          }
        }
      }
    }

    /* 🚫 EMPTY STATE */
    .empty-state {
      text-align: center;
      padding: var(--bmb-spacing-xxl) var(--bmb-spacing-l);

      .empty-icon {
        font-size: 4rem;
        margin-bottom: var(--bmb-spacing-l);
        opacity: 0.6;
      }

      .empty-title {
        font-size: var(--text-xl);
        font-weight: var(--font-bold);
        color: var(--general_contrasts-text-primary);
        margin: 0 0 var(--bmb-spacing-s) 0;
        font-family: var(--font-display);
      }

      .empty-subtitle {
        font-size: var(--text-lg);
        color: var(--general_contrasts-text-secondary);
        margin: 0 0 var(--bmb-spacing-l) 0;
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
        line-height: var(--leading-relaxed);
      }

      .empty-action-btn {
        display: flex;
        align-items: center;
        gap: var(--bmb-spacing-s);
        padding: var(--bmb-spacing-m) var(--bmb-spacing-xl);
        background: linear-gradient(135deg,
          rgba(var(--color-blue-tec), 1) 0%,
          rgba(var(--color-blue-tec), 0.9) 100%
        );
        color: white;
        border: none;
        border-radius: var(--bmb-radius-m);
        font-size: var(--text-lg);
        font-weight: var(--font-semibold);
        cursor: pointer;
        transition: all 0.3s ease;
        margin: 0 auto;
        box-shadow: 0 4px 12px rgba(var(--color-blue-tec), 0.3);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(var(--color-blue-tec), 0.4);
        }

        .btn-icon {
          font-size: var(--text-lg);
        }
      }
    }

    /* 📱 RESPONSIVE DESIGN */
    @media (max-width: 950px) {
      .admin-content {
        padding: 0 var(--bmb-spacing-s);
      }

      .pills-section {
        padding: var(--bmb-spacing-m);

        .section-title {
          font-size: var(--text-xl);
        }

        .pills-count {
          flex-direction: column;
          gap: var(--bmb-spacing-xs);

          .count-number {
            font-size: var(--text-lg);
          }

          .count-label {
            font-size: var(--text-xs);
          }
        }
      }

      .pills-list {
        gap: var(--bmb-spacing-s);
      }

      .pill-item {
        flex-direction: column;
        align-items: stretch;
        gap: var(--bmb-spacing-s);
        padding: var(--bmb-spacing-s);

        .pill-info {
          flex-direction: row;
          align-items: flex-start;

          .pill-icon-container {
            width: 40px;
            height: 40px;

            .pill-icon {
              font-size: var(--text-lg);
            }
          }

          .pill-content {
            .pill-text {
              font-size: var(--text-lg);
              margin-bottom: var(--bmb-spacing-xs);
            }

            .pill-meta {
              flex-direction: column;
              align-items: flex-start;
              gap: var(--bmb-spacing-xs);
            }
          }
        }

        .pill-actions {
          justify-content: center;
          flex-wrap: wrap;

          .action-button {
            flex: 1;
            min-width: 120px;
            justify-content: center;

            .action-text {
              display: block;
            }
          }
        }
      }

      .empty-state {
        padding: var(--bmb-spacing-xl) var(--bmb-spacing-s);

        .empty-icon {
          font-size: 3rem;
        }

        .empty-title {
          font-size: var(--text-lg);
        }

        .empty-subtitle {
          font-size: var(--text-lg);
        }

        .empty-action-btn {
          width: 100%;
          max-width: 300px;
          justify-content: center;
        }
      }
    }

    @media (max-width: 1200px) and (min-width: 951px) {
      .admin-content {
        max-width: 1000px;
      }

      .pill-item {
        .pill-actions {
          .action-text {
            display: none;
          }
        }
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
