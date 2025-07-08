import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Importar componentes REQUERIDOS por cliente (v1.5.5 funciona correctamente)
import { 
  BmbCardComponent,          // ✅ Cards para pacientes - ERROR RESUELTO
  // BmbSearchInputComponent,   // ❌ Removido - Usar input nativo con estilos Bamboo
  // BmbBadgeComponent,         // Agregar después
  // BmbIconComponent,           // Agregar después
  // BmbToastComponent,          // Agregar después
  // BmbCardButtonComponent,     // Agregar después
  // BmbContainerComponent,      // Agregar después
  // BmbDividerComponent,        // Agregar después
  // BmbLoaderComponent          // Agregar después
} from '@ti-tecnologico-de-monterrey-oficial/ds-ng';

// Import our custom medical icon component
import { MedicalIconComponent } from './components/icons/medical-icon.component';

// FASE 1: Componentes funcionando correctamente con v1.5.5
const BAMBOO_COMPONENTS_PHASE_1 = [
  BmbCardComponent           // ✅ ERROR DE PROYECCIÓN RESUELTO
  // BmbSearchInputComponent    // ❌ Removido - Usar input nativo con estilos Bamboo
  // BmbBadgeComponent         // Próximo a agregar
];

const CUSTOM_COMPONENTS = [
  MedicalIconComponent
];

@NgModule({
  imports: [
    CommonModule,
    ...BAMBOO_COMPONENTS_PHASE_1,
    ...CUSTOM_COMPONENTS
  ],
  exports: [
    ...BAMBOO_COMPONENTS_PHASE_1,
    ...CUSTOM_COMPONENTS
  ]
})
export class BambooModule { } 