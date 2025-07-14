# 🎨 Guía de Restauración de Bamboo Design System

## 📋 Estado Actual

**Fecha:** 2025-01-07  
**Problema:** Error de proyección en `BmbCardComponent` - ✅ RESUELTO  
**Solución:** Actualización a Bamboo DS v1.5.5
**Estado:** Bamboo Cards funcionando correctamente

## 🚨 Error Original

```
ERROR TypeError: Cannot read properties of null (reading '15')
at ɵɵprojectionDef (core.mjs:25920:34)
at BmbCardComponent_Template (ti-tecnologico-de-monterrey-oficial-ds-ng.mjs:7467:14)
```

## 📍 Archivos Modificados

### 1. `sidebar.component.html`
- **Cambio:** `<bmb-card>` → `<div class="patient-card-html">`
- **Líneas:** 67-85

### 2. `sidebar.component.scss`
- **Cambio:** Activado estilos `.patient-card-html`
- **Líneas:** 143-161

### 3. `sidebar.component.ts`
- **Cambio:** Comentario en import BambooModule
- **Líneas:** 8

## 🔧 Pasos para Restaurar Bamboo

### Paso 1: Verificar que el error esté solucionado
```bash
# Instalar última versión de Bamboo
npm update @ti-tecnologico-de-monterrey-oficial/ds-ng
```

### Paso 2: Restaurar HTML template
```html
<!-- Cambiar de: -->
<div class="patient-card-wrapper patient-card-html">

<!-- A: -->
<bmb-card class="patient-card-wrapper patient-card-bamboo">
```

### Paso 3: Restaurar estilos CSS
```scss
// Reactivar estilos .patient-card-bamboo
// Desactivar estilos .patient-card-html
```

### Paso 4: Verificar importaciones
```typescript
// Asegurar que BambooModule esté importado correctamente
import { BambooModule } from '../../../bamboo.module';
```

## 📝 Template de Restauración

```html
<bmb-card
  *ngFor="let patient of recentPatients; trackBy: trackByPatientId"
  [class]="getPatientCardClasses(patient)"
  (click)="selectPatient(patient)"
  class="patient-card-wrapper patient-card-bamboo">
  
  <div class="patient-content">
    <!-- Avatar -->
    <div class="patient-avatar">
      {{ getPatientInitials(patient) }}
    </div>
    
    <!-- Patient Info -->
    <div class="patient-info">
      <div class="patient-name">{{ patient.name }}</div>
      <div class="patient-id">ID: {{ patient.id }}</div>
    </div>
    
    <!-- Status Badge -->
    <span *ngIf="isPatientActive(patient)" class="active-badge-simple">
      ✅ Activo
    </span>
  </div>
  
</bmb-card>
```

## 🧪 Testing

### Verificar que funcione:
1. Los pacientes se muestran correctamente
2. Los estilos hover funcionan
3. La selección de pacientes funciona
4. No hay errores en consola

### Comandos de verificación:
```bash
# Compilar sin errores
ng build --configuration development

# Verificar en navegador
# - No errors in console
# - Cards render correctly
# - Hover effects work
# - Click functionality works
```

## 📞 Contacto

Si el problema persiste:
- Revisar documentación oficial de Bamboo DS
- Contactar equipo de TecSalud
- Considerar usar versión anterior de Bamboo

---

**Nota:** Esta es una solución temporal. El objetivo es restaurar completamente Bamboo Design System para cumplir con los requerimientos del cliente. 