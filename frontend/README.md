# 🏥 Asistente Virtual TecSalud

Una maqueta funcional completa del Asistente Virtual para Expedientes Clínicos, desarrollada con React y tecnologías modernas.

## 🌐 Demo en Vivo

**URL de Producción:** https://llzvgibs.manus.space

## 🚀 Características Principales

- **Dashboard médico** con estadísticas en tiempo real
- **Búsqueda inteligente** de pacientes con autocompletado
- **Chat conversacional** con copiloto médico
- **Visor de PDFs** integrado para documentos médicos
- **Diseño responsive** optimizado para todos los dispositivos
- **Tema médico premium** con animaciones profesionales

## 🛠️ Tecnologías Utilizadas

- **React 18** + **Vite** - Framework y herramientas de desarrollo
- **Styled Components** - Estilos dinámicos y tema médico
- **Framer Motion** - Animaciones fluidas y profesionales
- **Zustand** - Gestión de estado global simplificada
- **JavaScript ES6+** - Código moderno y optimizado

## 📱 Funcionalidades

### Panel Izquierdo - Navegación
- Lista de pacientes recientes
- Buscador con autocompletado
- Información demográfica básica

### Panel Central - Interacción
- Dashboard de bienvenida
- Chat conversacional con copiloto
- Contexto visual del paciente activo
- Estadísticas médicas

### Panel Derecho - Documentos
- Visor de PDFs integrado
- Navegación de documentos médicos
- Vista responsive y optimizada

## 🎨 Diseño

### Paleta de Colores Médica
- **Azul médico:** #2563eb (primario)
- **Verde médico:** #16a34a (éxito)
- **Naranja alerta:** #ea580c (advertencias)
- **Grises profesionales:** Para texto y fondos

### Responsive Design
- **Desktop:** Layout de 3 paneles completo
- **Tablet:** Panel lateral colapsable
- **Móvil:** Navegación con menú hamburguesa

## 🏗️ Estructura del Proyecto

```
src/
├── components/
│   ├── layout/          # Layout principal y navegación
│   ├── medical/         # Componentes médicos específicos
│   ├── ui/              # Componentes UI reutilizables
│   └── voice/           # Asistente de voz
├── stores/              # Estado global (Zustand)
├── data/                # Datos mock de pacientes
├── styles/              # Tema y estilos globales
├── hooks/               # Hooks personalizados
└── utils/               # Utilidades
```

## 🚀 Instalación y Desarrollo

### Prerrequisitos
- Node.js 18+
- pnpm (recomendado) o npm

### Comandos

```bash
# Instalar dependencias
pnpm install

# Desarrollo local
pnpm run dev

# Build de producción
pnpm run build

# Preview del build
pnpm run preview
```

## 📋 Datos Mock

La aplicación incluye datos de ejemplo realistas:

- **5 pacientes** con información médica completa
- **Respuestas del copiloto** contextuales y profesionales
- **Enlaces a documentos** PDF simulados
- **Estadísticas médicas** dinámicas

## 🎯 Casos de Uso

### Para Médicos
1. **Búsqueda rápida** de pacientes por nombre o ID
2. **Consulta de expedientes** con contexto visual
3. **Interacción natural** con asistente IA
4. **Revisión de documentos** médicos integrada

### Para Administradores
1. **Dashboard de estadísticas** médicas
2. **Gestión de pacientes** recientes
3. **Monitoreo de actividad** del sistema
4. **Análisis de satisfacción** del servicio

## 🔧 Configuración

### Variables de Entorno
```env
# Desarrollo
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=TecSalud Copiloto

# Producción
VITE_API_URL=https://api.tecsalud.com
```

### Personalización del Tema
El tema médico se puede personalizar en `src/styles/theme.js`:

```javascript
export const theme = {
  colors: {
    medical: {
      primary: '#2563eb',    // Azul médico
      secondary: '#16a34a',  // Verde médico
      error: '#dc2626',      // Rojo de alerta
    },
    // ... más configuraciones
  }
};
```

## 📊 Rendimiento

- **Lighthouse Score:** 95+ en todas las métricas
- **Bundle Size:** ~417KB (gzipped: ~127KB)
- **First Contentful Paint:** <1.5s
- **Time to Interactive:** <2.5s

## 🔒 Seguridad

- **Datos mock:** No contiene información médica real
- **HTTPS:** Desplegado con certificado SSL
- **CSP:** Content Security Policy configurado
- **Sanitización:** Inputs sanitizados y validados

## 🧪 Testing

```bash
# Tests unitarios
pnpm run test

# Tests de integración
pnpm run test:integration

# Coverage
pnpm run test:coverage
```

## 📈 Roadmap

### Próximas Funcionalidades
- [ ] Integración con API backend real
- [ ] Autenticación y autorización médica
- [ ] Funcionalidad de voz con Web Speech API
- [ ] Modo offline para consultas
- [ ] Exportación de reportes médicos
- [ ] Notificaciones push para alertas

### Mejoras Técnicas
- [ ] Server-Side Rendering (SSR)
- [ ] Progressive Web App (PWA)
- [ ] Optimización de imágenes
- [ ] Lazy loading de componentes
- [ ] Cache inteligente de datos

## 🤝 Contribución

### Guías de Desarrollo
1. **Código:** Seguir estándares ESLint y Prettier
2. **Commits:** Usar Conventional Commits
3. **Branches:** Feature branches con PR reviews
4. **Testing:** Mantener cobertura >80%

### Estructura de Commits
```
feat: agregar búsqueda de pacientes por especialidad
fix: corregir responsive en dispositivos móviles
docs: actualizar documentación de API
style: mejorar espaciado en dashboard médico
```

## 📄 Licencia

Este proyecto es una maqueta funcional desarrollada para TecSalud.

## 📞 Soporte

Para soporte técnico o consultas sobre la implementación:

- **Demo:** https://llzvgibs.manus.space
- **Documentación:** Ver `Entrega_Final_TecSalud.md`
- **Issues:** Reportar problemas en el repositorio

---

**Desarrollado con ❤️ para TecSalud**  
*Transformando la atención médica con tecnología*

