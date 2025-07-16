import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import { PillsService } from '@core/services';
import { Pill, CreatePillRequest } from '@core/models';

/**
 * Interface for pill form data
 *
 * @interface PillFormData
 * @description Structure for form input data when creating or editing pills.
 * Extends CreatePillRequest with optional fields for editing.
 */
interface PillFormData {
  /** Initial starter text or template */
  starter: string;

  /** Text content or question template */
  text: string;

  /** Icon emoji for visual representation */
  icon: string;

  /** Category classification */
  category: string;

  /** Priority level (alta = highest priority) */
  priority: 'alta' | 'media' | 'baja' | '';
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
          </div>
        </div>
      </div>

      <!-- Premium Pills List -->
      <div class="admin-content">
        <div class="pills-section">
          <div class="section-header">
          <h3 class="section-title">💊 Pastillas Disponibles</h3>
            <button class="add-btn secondary" [disabled]="isLoading" (click)="openCreateModal()">
              <span class="btn-icon">{{ isLoading ? '⏳' : '➕' }}</span>
              <span class="btn-text">{{ isLoading ? 'Cargando...' : 'Nueva Pastilla' }}</span>
            </button>
          </div>

          <!-- Loading State -->
          <div class="loading-state" *ngIf="isLoading">
            <div class="loading-container">
              <div class="loading-spinner">
                <div class="spinner"></div>
              </div>
              <div class="loading-text">
                <h3>🔄 Cargando pastillas...</h3>
                <p>Obteniendo datos del servidor</p>
              </div>
            </div>
          </div>

          <!-- Premium Pills List -->
          <div class="pills-list" *ngIf="!isLoading && pills.length > 0">
                          <div
                *ngFor="let pill of pills; trackBy: trackByPill"
                class="pill-item"
                [class]="getPriorityClass(pill.priority)">

              <!-- Pill Icon & Info -->
              <div class="pill-info">
                <div class="pill-icon-container">
                  <span class="pill-icon">{{ pill.icon }}</span>
                </div>
                <div class="pill-content">
                  <div class="pill-starter">{{ pill.starter }}</div>
                  <div class="pill-text">{{ pill.text }}</div>
                  <div class="pill-meta">
                    <span class="category-badge" [class]="'category-' + pill.category">
                      {{ getCategoryLabel(pill.category) }}
                    </span>
                    <span class="priority-indicator" [class]="getPriorityClass(pill.priority)">
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

          <!-- Error State -->
          <div class="error-state" *ngIf="!isLoading && errorMessage">
            <div class="error-icon">⚠️</div>
            <h3 class="error-title">Error al cargar pastillas</h3>
            <p class="error-subtitle">{{ errorMessage }}</p>
          </div>

          <!-- Empty State -->
          <div class="empty-state" *ngIf="!isLoading && !errorMessage && pills.length === 0">
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
            <form class="modal-form" (ngSubmit)="savePill(); $event.preventDefault();" #pillForm="ngForm">
              <div class="form-group">
                <label class="form-label" for="pillStarter">Texto inicial: *</label>
                <input
                  type="text"
                  id="pillStarter"
                  name="pillStarter"
                  [(ngModel)]="formData.starter"
                  required
                  maxlength="50"
                  placeholder="Ej: Diagnóstico, Síntomas, Medicamentos"
                  class="form-input">
              </div>

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
                <label class="form-label">Icono: *</label>
                <!-- Hidden input for form validation -->
                <input type="hidden" [(ngModel)]="formData.icon" required name="pillIcon">
                <div class="icon-selector">
                  <div class="selected-icon-display" *ngIf="formData.icon">
                    <span class="current-icon">{{ formData.icon }}</span>
                    <span class="icon-label">Icono seleccionado</span>
                  </div>
                  <div class="icon-message" *ngIf="!formData.icon">
                    Selecciona un icono de la lista
                  </div>
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
                    <option value="" disabled>Selecciona una categoría</option>
                    <option value="general">General</option>
                    <option value="medico">Médico</option>
                    <option value="emergencia">Emergencia</option>
                    <option value="consulta">Consulta</option>
                    <option value="laboratorio">Laboratorio</option>
                    <option value="radiologia">Radiología</option>
                    <option value="farmacia">Farmacia</option>
                    <option value="administrativo">Administrativo</option>
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
                    <option value="" disabled>Selecciona una prioridad</option>
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
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
            <button type="button" class="btn btn-primary" [disabled]="!pillForm.valid" (click)="savePill()" [title]="!pillForm.valid ? 'Complete todos los campos para continuar' : ''">
              <span>💾</span>
              <span>{{ isEditMode ? 'Actualizar' : 'Guardar' }}</span>
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
      padding: var(--bmb-spacing-m) var(--bmb-spacing-l) calc(var(--bmb-spacing-xxl) * 2) var(--bmb-spacing-l);
      box-sizing: border-box;
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

      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--bmb-spacing-l);
        gap: var(--bmb-spacing-m);
        flex-wrap: wrap;

        @media (max-width: 768px) {
          flex-direction: column;
          align-items: stretch;
          gap: var(--bmb-spacing-s);
        }
      }

      .section-title {
        color: var(--general_contrasts-text-primary);
        font-size: var(--text-2xl);
        font-weight: var(--font-bold);
        margin: 0;
        font-family: var(--font-display);
        background: linear-gradient(135deg,
          rgb(var(--color-blue-tec)) 0%,
          rgb(var(--color-mariner-100)) 100%
        );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .add-btn {
        display: flex;
        align-items: center;
        gap: var(--bmb-spacing-xs);
        padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
        background: linear-gradient(135deg,
          rgb(var(--color-blue-tec)) 0%,
          rgb(var(--color-mariner-100)) 100%
        );
        color: white;
        border: none;
        border-radius: var(--bmb-radius-m);
        font-weight: var(--font-medium);
        font-size: var(--text-sm);
        cursor: pointer;
        transition: all 0.3s ease;
        box-shadow: 0 2px 8px rgba(var(--color-blue-tec), 0.2);
        white-space: nowrap;

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(var(--color-blue-tec), 0.3);
        }

        &:active {
          transform: translateY(0);
        }

        &.secondary {
          background: var(--general_contrasts-surface);
          color: rgb(var(--color-blue-tec));
          border: 1px solid rgb(var(--color-blue-tec));
          box-shadow: 0 2px 8px rgba(var(--color-blue-tec), 0.1);

          &:hover {
            background: rgba(var(--color-blue-tec), 0.05);
          }
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none !important;
          box-shadow: 0 2px 8px rgba(var(--color-blue-tec), 0.1) !important;

          &:hover {
            transform: none !important;
            background: var(--general_contrasts-surface) !important;
          }
        }

        .btn-icon {
          font-size: var(--text-base);
        }

        .btn-text {
          font-size: var(--text-sm);
        }
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

        .pill-starter {
          font-size: var(--text-sm);
          font-weight: var(--font-bold);
          color: rgb(var(--color-blue-tec));
          margin-bottom: var(--bmb-spacing-xxs);
          text-transform: capitalize;
          opacity: 0.9;
          letter-spacing: 0.25px;
        }

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

    /* 🔄 LOADING STATE */
    .loading-state {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: var(--bmb-spacing-xxl) var(--bmb-spacing-l);
      min-height: 300px;

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--bmb-spacing-l);
      }

      .loading-spinner {
        display: flex;
        justify-content: center;
        align-items: center;

        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid rgba(var(--color-blue-tec), 0.1);
          border-left: 4px solid rgba(var(--color-blue-tec), 1);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      }

      .loading-text {
        text-align: center;

        h3 {
          font-size: var(--text-xl);
          font-weight: var(--font-bold);
          color: var(--general_contrasts-text-primary);
          margin: 0 0 var(--bmb-spacing-s) 0;
          font-family: var(--font-display);
        }

        p {
          font-size: var(--text-lg);
          color: var(--general_contrasts-text-secondary);
          margin: 0;
          line-height: var(--leading-relaxed);
        }
      }
    }

    /* ⚠️ ERROR STATE */
    .error-state {
      text-align: center;
      padding: var(--bmb-spacing-xxl) var(--bmb-spacing-l);

      .error-icon {
        font-size: 4rem;
        margin-bottom: var(--bmb-spacing-l);
        opacity: 0.8;
      }

      .error-title {
        font-size: var(--text-xl);
        font-weight: var(--font-bold);
        color: var(--status-error);
        margin: 0 0 var(--bmb-spacing-s) 0;
        font-family: var(--font-display);
      }

      .error-subtitle {
        font-size: var(--text-lg);
        color: var(--general_contrasts-text-secondary);
        margin: 0 0 var(--bmb-spacing-l) 0;
        max-width: 400px;
        margin-left: auto;
        margin-right: auto;
        line-height: var(--leading-relaxed);
      }

      .error-action-btn {
        display: flex;
        align-items: center;
        gap: var(--bmb-spacing-s);
        padding: var(--bmb-spacing-m) var(--bmb-spacing-xl);
        background: linear-gradient(135deg,
          var(--status-error) 0%,
          rgba(var(--status-error), 0.9) 100%
        );
        color: white;
        border: none;
        border-radius: var(--bmb-radius-m);
        font-size: var(--text-lg);
        font-weight: var(--font-semibold);
        cursor: pointer;
        transition: all 0.3s ease;
        margin: 0 auto;
        box-shadow: 0 4px 12px rgba(var(--status-error), 0.3);

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(var(--status-error), 0.4);
        }

        .btn-icon {
          font-size: var(--text-lg);
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

    /* 🎯 ICON SELECTOR STYLES */
    .icon-selector {
      .icon-message {
        padding: var(--bmb-spacing-s);
        text-align: center;
        color: var(--general_contrasts-text-secondary);
        font-size: var(--text-sm);
        font-style: italic;
        border: 1px dashed var(--general_contrasts-container-outline);
        border-radius: var(--bmb-radius-s);
        margin-bottom: var(--bmb-spacing-s);
      }

      .selected-icon-display {
        display: flex;
        align-items: center;
        gap: var(--bmb-spacing-s);
        margin-bottom: var(--bmb-spacing-s);
        padding: var(--bmb-spacing-s);
        border: 1px solid rgb(var(--color-blue-tec));
        border-radius: var(--bmb-radius-s);
        background: rgba(var(--color-blue-tec), 0.1);

        .current-icon {
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 40px;
          background: var(--general_contrasts-surface);
          border-radius: var(--bmb-radius-s);
          box-shadow: 0 2px 4px rgba(var(--color-blue-tec), 0.2);
        }

        .icon-label {
          font-size: var(--text-sm);
          color: rgb(var(--color-blue-tec));
          font-weight: var(--font-medium);
        }
      }

      .icon-options {
        display: flex;
        flex-wrap: wrap;
        gap: var(--bmb-spacing-s);
        padding: var(--bmb-spacing-s);
        border: 1px solid var(--general_contrasts-container-outline);
        border-radius: var(--bmb-radius-s);
        background: var(--general_contrasts-surface);
      }

      .icon-option {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 44px;
        height: 44px;
        border: 1px solid var(--general_contrasts-container-outline);
        border-radius: var(--bmb-radius-s);
        background: var(--general_contrasts-surface);
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 22px;
        padding: 0;

        &:hover {
          border-color: rgb(var(--color-blue-tec));
          background: rgba(var(--color-blue-tec), 0.1);
          transform: scale(1.05);
        }

        &.selected {
          border-color: rgb(var(--color-blue-tec));
          background: rgba(var(--color-blue-tec), 0.2);
          box-shadow: 0 2px 6px rgba(var(--color-blue-tec), 0.4);
          transform: scale(1.05);
        }

        &:active {
          transform: scale(0.98);
        }
      }
    }

    /* 🔘 MODAL BUTTON STYLES */
    .modal-footer {
      display: flex;
      gap: var(--bmb-spacing-s);
      justify-content: flex-end;
      padding: var(--bmb-spacing-l);
      border-top: 1px solid var(--general_contrasts-container-outline);

      .btn {
        display: flex;
        align-items: center;
        gap: var(--bmb-spacing-xs);
        padding: var(--bmb-spacing-s) var(--bmb-spacing-m);
        border: none;
        border-radius: var(--bmb-radius-s);
        font-weight: var(--font-medium);
        font-size: var(--text-sm);
        cursor: pointer;
        transition: all 0.3s ease;

        &.btn-secondary {
          background: var(--general_contrasts-container-outline);
          color: var(--general_contrasts-text-secondary);

          &:hover {
            background: var(--general_contrasts-text-secondary);
            color: var(--general_contrasts-surface);
          }
        }

        &.btn-primary {
          background: rgb(var(--color-blue-tec));
          color: white;
          box-shadow: 0 2px 8px rgba(var(--color-blue-tec), 0.3);

          &:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(var(--color-blue-tec), 0.4);
          }

          &:disabled {
            background: var(--general_contrasts-container-outline);
            color: var(--general_contrasts-text-disabled);
            cursor: not-allowed;
            opacity: 0.6;
            transform: none;
            box-shadow: none;

            &:hover {
              transform: none;
              box-shadow: none;
            }
          }
        }

        &:active:not(:disabled) {
          transform: translateY(0);
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

  /** Loading state */
  isLoading = false;

  /** Error message */
  errorMessage: string | null = null;

  /** Array of quick pill data items */
  pills: Pill[] = [];

  /** Form modal visibility state */
  showFormModal = false;

  /** Delete confirmation modal visibility state */
  showDeleteModal = false;

  /** Flag indicating if form is in edit mode */
  isEditMode = false;

  /** Reference to pill being deleted */
  pillToDelete: Pill | null = null;

  /** ID of pill being edited */
  editingPillId: string | null = null;

  /** Form data for creating/editing pills */
  formData: PillFormData = {
    starter: '',
    text: '',
    icon: '',
    category: '',
    priority: '' as any  // No default priority - will be empty for validation
  };

  /** Available medical icons for pill selection */
  iconOptions = ['🩺', '💊', '📋', '🏥', '🔬', '🚨', '📝', '⏰', '🤒', '💉', '📊', '⚠️', '🛡️', '🤱', '👶', '👴', '📸', '📈', '👨‍⚕️'];

  /**
   * Creates an instance of AdminPillsManagerComponent
   *
   * @description Initializes the component with default form state
   */
  constructor(private pillsService: PillsService) {}

  /**
   * Component initialization lifecycle hook
   *
   * @description Loads existing pills from localStorage on component initialization
   */
  ngOnInit(): void {
    this.loadPillsFromAPI();
    this.setupSubscriptions();
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
   * Loads pills from API
   *
   * @description Fetches pills from the backend API and updates local state
   */
  loadPillsFromAPI(): void {
    // Clear previous error state
    this.errorMessage = null;
    this.pillsService.loadPills(100, 0)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (loadedPills) => {
          this.pills = loadedPills;
          console.log('✅ Pills cargados exitosamente:', this.pills);
        },
        error: (error) => {
          console.error('❌ Error cargando pills:', error);
          this.errorMessage = 'Error al cargar las pastillas';
        }
      });
  }

  /**
   * Sets up component subscriptions
   *
   * @private
   * @description Establishes reactive subscriptions for loading and error states
   */
  private setupSubscriptions(): void {
    // Subscribe to loading state
    this.pillsService.loading$
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.isLoading = loading;
      });

    // Subscribe to error state
    this.pillsService.error$
      .pipe(takeUntil(this.destroy$))
      .subscribe(error => {
        this.errorMessage = error;
      });
  }

  /**
   * Loads mock data as fallback
   *
   * @private
   * @description Initializes the pills array with default medical templates
   * when API is not available.
   */
  private loadMockData(): void {
    this.pills = [
          { id: 'q1', starter: 'Diagnóstico', text: 'Realizar diagnóstico inicial', icon: '🩺', category: 'diagnosis', priority: 'alta' },
    { id: 'q2', starter: 'Medicamentos', text: 'Revisar medicamentos', icon: '💊', category: 'medication', priority: 'media' },
    { id: 'q3', starter: 'Síntomas', text: 'Analizar síntomas', icon: '📋', category: 'symptoms', priority: 'alta' },
    { id: 'q4', starter: 'Especialista', text: 'Recomendar especialista', icon: '🏥', category: 'treatment', priority: 'media' },
    { id: 'q5', starter: 'Urgencia', text: 'Evalúa la urgencia de este caso', icon: '🚨', category: 'emergency', priority: 'alta' },
    { id: 'q6', starter: 'Exámenes', text: 'Qué exámenes clínicos recomiendas', icon: '🔬', category: 'tests', priority: 'media' }
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
  openEditModal(pill: Pill): void {
    this.isEditMode = true;
    this.editingPillId = pill.id || (pill as any).pill_id || null;
    this.formData = {
      starter: pill.starter,
      text: pill.text,
      icon: pill.icon,
      category: pill.category,
      priority: pill.priority // Keep as string
    };

    console.log('✏️ Opening edit modal for pill:', pill);
    console.log('✏️ Form data loaded:', this.formData);
    console.log('✏️ Priority type after load:', typeof this.formData.priority);

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
  openDeleteModal(pill: Pill): void {
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
      starter: '',
      text: '',
      icon: '',
      category: '',
      priority: '' as any  // No default priority - will be empty for validation
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
    console.log('🔥 savePill() method called!');
    console.log('🔥 Current formData:', this.formData);
    console.log('🔥 isEditMode:', this.isEditMode);
    console.log('🔥 editingPillId:', this.editingPillId);

    // Clear previous errors
    this.errorMessage = null;

    // Comprehensive form validation
    if (!this.formData.starter.trim()) {
      console.log('❌ Validation failed: Missing starter text');
      this.errorMessage = 'El texto inicial es requerido';
      return;
    }

    if (!this.formData.text.trim()) {
      console.log('❌ Validation failed: Missing question text');
      this.errorMessage = 'El texto de la pregunta es requerido';
      return;
    }

    if (!this.formData.icon.trim()) {
      console.log('❌ Validation failed: Missing icon');
      this.errorMessage = 'Debes seleccionar un icono';
      return;
    }

    if (!this.formData.category.trim()) {
      console.log('❌ Validation failed: Missing category');
      this.errorMessage = 'Debes seleccionar una categoría';
      return;
    }

    if (!this.formData.priority) {
      console.log('❌ Validation failed: Missing priority');
      this.errorMessage = 'Debes seleccionar una prioridad';
      return;
    }

    // Validate priority is a valid string
    const validPriorities = ['alta', 'media', 'baja'];
    if (!validPriorities.includes(this.formData.priority)) {
      console.log('❌ Validation failed: Invalid priority');
      this.errorMessage = 'La prioridad debe ser Alta, Media o Baja';
      return;
    }

    console.log('✅ Validation passed');
    console.log('💊 FormData before processing:', this.formData);
    console.log('💊 Priority type:', typeof this.formData.priority, 'Value:', this.formData.priority);

    if (this.isEditMode && this.editingPillId) {
      // Update existing pill via API
      const updateData = {
        id: this.editingPillId,
        starter: this.formData.starter.trim(),
        text: this.formData.text.trim(),
          icon: this.formData.icon,
          category: this.formData.category,
        priority: this.formData.priority,
        is_active: true
        };

      console.log('✏️ Updating pill with data:', updateData);

      this.pillsService.updatePill(updateData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            console.log('🔄 finalize() called for update operation');
            this.closeFormModal();
          })
        )
        .subscribe({
          next: (updatedPill) => {
            console.log('✅ Pill updated successfully:', updatedPill);
            // Reload pills from API to show the updated pill
            this.loadPillsFromAPI();
            // Pills state is automatically updated by service
          },
          error: (error) => {
            console.error('❌ Error updating pill:', error);
            this.errorMessage = `Error al actualizar: ${error.message}`;
          }
        });
    } else {
      // Create new pill via API
      const createData: CreatePillRequest = {
        starter: this.formData.starter.trim(),
        text: this.formData.text.trim(),
        icon: this.formData.icon,
        category: this.formData.category,
        priority: this.formData.priority
      };

      this.pillsService.createPill(createData)
        .pipe(
          takeUntil(this.destroy$),
          finalize(() => {
            console.log('🔄 finalize() called for create operation');
    this.closeFormModal();
          })
        )
        .subscribe({
          next: (newPill) => {
            console.log('✅ Pill created successfully:', newPill);
            // Reload pills from API to show the new pill
            this.loadPillsFromAPI();
            // Close modal
            this.closeFormModal();
          },
          error: (error) => {
            console.error('❌ Error creating pill:', error);
            this.errorMessage = `Error al crear: ${error.message}`;
          }
        });
    }

    console.log('🔚 savePill() method finished executing');
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
    console.log('🔥 confirmDelete() called');
    console.log('📋 pillToDelete:', this.pillToDelete);

    if (!this.pillToDelete) {
      console.error('❌ No pill to delete');
      return;
    }

    // Check for both id and pill_id fields (API inconsistency)
    const pillId = this.pillToDelete.id || (this.pillToDelete as any).pill_id;
    if (!pillId) {
      console.error('❌ Pill has no ID or pill_id:', this.pillToDelete);
      return;
    }

    console.log('🚀 Starting deletion of pill:', pillId);

    this.pillsService.deletePill(pillId)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          console.log('🏁 Delete operation finished, closing modal');
      this.closeDeleteModal();
        })
      )
      .subscribe({
        next: (message) => {
          console.log('✅ Pill deleted successfully:', message);
          // Reload pills from API to reflect the deletion
          this.loadPillsFromAPI();
          // Pills state is automatically updated by service
        },
        error: (error) => {
          console.error('❌ Error deleting pill:', error);
          this.errorMessage = `Error al eliminar: ${error.message}`;
        }
      });
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
      'general': 'General',
      'medico': 'Médico',
      'emergencia': 'Emergencia',
      'consulta': 'Consulta',
      'laboratorio': 'Laboratorio',
      'radiologia': 'Radiología',
      'farmacia': 'Farmacia',
      'administrativo': 'Administrativo',
      // Legacy categories for backward compatibility
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
      'alta': 'Alta',
      'media': 'Media',
      'baja': 'Baja'
    };
    return labels[priority] || 'Media';
  }

  /**
   * Gets the CSS class for a priority level
   *
   * @param priority - The priority string value
   * @returns CSS class name for styling
   *
   * @description Maps priority string values to CSS class names
   * for consistent styling across the application.
   *
   * @example
   * ```typescript
   * this.getPriorityClass('alta'); // Returns "priority-high"
   * ```
   */
  getPriorityClass(priority: string): string {
    const classes: { [key: string]: string } = {
      'alta': 'priority-high',
      'media': 'priority-medium',
      'baja': 'priority-low'
    };
    return classes[priority] || 'priority-medium';
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
  trackByPill(index: number, pill: Pill): string {
    const pillId = pill.id || (pill as any).pill_id;
    return pillId || `pill-${index}`;
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
