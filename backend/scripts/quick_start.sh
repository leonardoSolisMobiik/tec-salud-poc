#!/bin/bash
# 🚀 TecSalud - Quick Start Script para ChromaDB
# Inicializa las colecciones de ChromaDB y verifica el sistema

echo "🚀 TecSalud - Quick Start para ChromaDB"
echo "========================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar mensajes con colores
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Verificar si estamos en el directorio correcto
if [ ! -f "main.py" ]; then
    print_error "Ejecutar desde el directorio backend/"
    echo "Uso: cd backend && ./scripts/quick_start.sh"
    exit 1
fi

# Verificar si existe el entorno virtual
if [ ! -d "venv" ]; then
    print_warning "No se encontró entorno virtual"
    print_info "Creando entorno virtual..."
    python3 -m venv venv
fi

# Activar entorno virtual
print_info "Activando entorno virtual..."
source venv/bin/activate

# Verificar dependencias
print_info "Verificando dependencias..."
pip install -q chromadb openai python-dotenv

# Verificar archivo .env
if [ ! -f ".env" ]; then
    print_warning "No se encontró archivo .env"
    print_info "Copiando .env.example a .env"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "Configurar las variables de Azure OpenAI en .env"
    else
        print_error "No se encontró .env.example"
        exit 1
    fi
fi

# Crear directorios necesarios
print_info "Creando directorios necesarios..."
mkdir -p data/vectordb
mkdir -p data/pdfs
mkdir -p logs

# Ejecutar inicialización de ChromaDB
print_info "Inicializando colecciones de ChromaDB..."
python scripts/init_chroma_collections.py

if [ $? -eq 0 ]; then
    print_success "Colecciones inicializadas correctamente"
else
    print_error "Error en la inicialización"
    exit 1
fi

# Verificar estado
print_info "Verificando estado del sistema..."
python scripts/init_chroma_collections.py --action verify

# Mostrar resumen
echo ""
echo "📋 RESUMEN DE INICIALIZACIÓN"
echo "=============================="
print_success "ChromaDB inicializado"
print_success "Colecciones creadas"
print_success "Directorios configurados"

echo ""
echo "🔍 PRÓXIMOS PASOS"
echo "=================="
echo "1. Configurar variables de Azure OpenAI en .env"
echo "2. Ejecutar el backend: python main.py"
echo "3. Vectorizar documentos: python scripts/vectorize_documents.py /ruta/documentos"
echo "4. Probar vectorización: python scripts/test_vectorization.py"

echo ""
echo "📚 COMANDOS ÚTILES"
echo "=================="
echo "• Listar colecciones: python scripts/init_chroma_collections.py --action list"
echo "• Ver información: python scripts/init_chroma_collections.py --action info --collection expedientes_medicos"
echo "• Verificar estado: python scripts/init_chroma_collections.py --action verify"
echo ""
print_success "¡TecSalud ChromaDB está listo!" 