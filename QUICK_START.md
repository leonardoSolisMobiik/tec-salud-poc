# 🚀 TecSalud - Guía de Instalación Rápida

## ⚡ Instalación Express (5 minutos)

### 1. Prerrequisitos
- Docker y Docker Compose instalados
- Cuenta de Azure OpenAI activa

### 2. Configuración Rápida
```bash
# Clonar repositorio
git clone <repository-url>
cd tecsalud-fullstack

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de Azure OpenAI

# Iniciar aplicación
docker-compose up -d
```

### 3. Acceso
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/v1/health

## 🔧 Configuración Mínima Requerida

### Variables de Entorno Esenciales
```env
# Azure OpenAI (OBLIGATORIO)
AZURE_OPENAI_API_KEY=tu_api_key_aqui
AZURE_OPENAI_ENDPOINT=https://tu-recurso.openai.azure.com/
AZURE_OPENAI_GPT4O_DEPLOYMENT=gpt-4o
AZURE_OPENAI_GPT4O_MINI_DEPLOYMENT=gpt-4o-mini
AZURE_OPENAI_EMBEDDING_DEPLOYMENT=text-embedding-3-large
```

## 📋 Verificación de Instalación

### 1. Verificar Servicios
```bash
docker-compose ps
```
Todos los servicios deben estar "Up"

### 2. Verificar API
```bash
curl http://localhost:8000/api/v1/health
```
Debe retornar `{"status": "healthy"}`

### 3. Verificar Frontend
Abrir http://localhost:3000 - debe cargar la interfaz

## 🔍 Solución de Problemas Comunes

### Error: "Azure OpenAI service unavailable"
- Verificar API key y endpoint en `.env`
- Confirmar que los deployments existen en Azure

### Error: "Chroma connection failed"
- Reiniciar contenedor: `docker-compose restart chroma`
- Verificar logs: `docker-compose logs chroma`

### Error: "Frontend no carga"
- Verificar que el backend esté corriendo
- Revisar logs: `docker-compose logs frontend`

## 📞 Soporte Rápido

### Logs Útiles
```bash
# Ver todos los logs
docker-compose logs

# Logs específicos
docker-compose logs backend
docker-compose logs frontend
docker-compose logs chroma
```

### Reinicio Completo
```bash
docker-compose down
docker-compose up -d
```

### Limpiar y Reinstalar
```bash
docker-compose down -v
docker-compose up -d --build
```

## 🎯 Primeros Pasos

1. **Seleccionar Paciente**: Usar la búsqueda en el sidebar
2. **Hacer Consulta**: Ir a "Asistente IA" y escribir consulta médica
3. **Subir Documento**: Ir a "Documentos" y arrastrar archivo PDF
4. **Buscar en Expedientes**: Usar búsqueda semántica en documentos

## 📚 Recursos Adicionales

- **Documentación Completa**: Ver `README.md`
- **API Docs**: http://localhost:8000/docs
- **Ejemplos de Uso**: Ver carpeta `examples/`
- **Troubleshooting**: Ver `TROUBLESHOOTING.md`

