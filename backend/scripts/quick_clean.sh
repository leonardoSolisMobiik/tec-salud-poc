#!/bin/bash
# 🧹 Quick Database Clean for TecSalud
# Limpia pacientes y documentos para empezar desde cero

echo "🧹 Cleaning TecSalud database..."
echo "🗑️ Removing all patients, documents, and vectors..."

cd "$(dirname "$0")/.."

# Activate virtual environment and run cleanup
source venv/bin/activate 2>/dev/null || echo "⚠️ Virtual environment not found, continuing..."

# Run the Python cleanup script with auto-confirmation
echo "YES" | python scripts/clean_database.py

echo "✅ Database cleaned! Ready for fresh TecSalud uploads." 