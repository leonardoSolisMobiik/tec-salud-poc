import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importar componentes DISPONIBLES en Bamboo DS v1.5.5
import { 
  BmbCardComponent,          // ✅ Cards para pacientes - ERROR RESUELTO
  BmbCardButtonComponent,    // ✅ Botones de card con estilos Bamboo
  BmbBadgeComponent,         // ✅ Badges para status
  BmbIconComponent,          // ✅ Iconografía estándar
  BmbToastComponent,         // ✅ Notificaciones
  BmbLoaderComponent,        // ✅ Estados de carga
  BmbDividerComponent,       // ✅ Separadores
  BmbContainerComponent,     // ✅ Contenedores
  // BmbInputComponent,         // ❌ No disponible - usar input nativo con estilos
  // BmbSelectComponent,        // ❌ No disponible - usar select nativo con estilos
  // BmbTextareaComponent,      // ❌ No disponible - usar textarea nativo con estilos
  // BmbButtonComponent,        // ❌ No disponible - usar BmbCardButtonComponent
  // BmbSearchInputComponent,   // ❌ Removido - usar input nativo con estilos
} from '@ti-tecnologico-de-monterrey-oficial/ds-ng';

// Import our custom medical icon component
import { MedicalIconComponent } from './components/icons/medical-icon.component';

// COMPONENTES BAMBOO DISPONIBLES
const BAMBOO_COMPONENTS = [
  BmbCardComponent,           // ✅ Cards para contenido
  BmbCardButtonComponent,     // ✅ Botones estandarizados
  BmbBadgeComponent,          // ✅ Badges de estado
  BmbIconComponent,           // ✅ Iconografía
  BmbToastComponent,          // ✅ Notificaciones
  BmbLoaderComponent,         // ✅ Loading states
  BmbDividerComponent,        // ✅ Separadores
  BmbContainerComponent,      // ✅ Contenedores
];

const CUSTOM_COMPONENTS = [
  MedicalIconComponent
];

/**
 * Bamboo Design System integration module for TecSalud Medical Assistant
 * 
 * @description Integrates Tecnológico de Monterrey's Bamboo Design System
 * components with the medical application. Provides standardized components
 * that ensure consistency across the entire application.
 * 
 * @example
 * ```typescript
 * // Import in feature modules that need Bamboo components
 * @NgModule({
 *   imports: [BambooModule],
 *   declarations: [MedicalFeatureComponent]
 * })
 * export class MedicalFeatureModule { }
 * 
 * // Use in templates - CORRECT WAY
 * <bmb-card>
 *   <bmb-badge type="success">Activo</bmb-badge>
 *   <bmb-card-button (click)="action()">Acción</bmb-card-button>
 * </bmb-card>
 * 
 * // For inputs/selects - use native elements with Bamboo CSS classes
 * <select class="bamboo-select">...</select>
 * <input class="bamboo-input" />
 * ```
 * 
 * @availableComponents
 * - BmbCardComponent: Card container for medical content display
 * - BmbCardButtonComponent: Standardized buttons with Bamboo styling
 * - BmbBadgeComponent: Status badges for medical alerts
 * - BmbIconComponent: Standard iconography system
 * - BmbToastComponent: Notification system
 * - BmbLoaderComponent: Loading states
 * - BmbDividerComponent: Content separation
 * - BmbContainerComponent: Layout containers
 * - MedicalIconComponent: Custom medical iconography
 * 
 * @note For form elements (inputs, selects, textareas), use native HTML elements
 * with Bamboo CSS classes until more components are available in the package
 * 
 * @version Bamboo DS v1.5.5 (verified compatibility)
 * @stability All components are production-ready
 * 
 * @since 1.0.0
 */
@NgModule({
  imports: [
    CommonModule,
    ...BAMBOO_COMPONENTS,
    ...CUSTOM_COMPONENTS
  ],
  exports: [
    ...BAMBOO_COMPONENTS,
    ...CUSTOM_COMPONENTS
  ]
})
export class BambooModule {
  /**
   * Creates an instance of BambooModule
   * 
   * @description Initializes the Bamboo Design System integration
   * with all available components for medical application use.
   * 
   * @note This module can be safely imported multiple times across
   * feature modules that need Bamboo components.
   */
} 