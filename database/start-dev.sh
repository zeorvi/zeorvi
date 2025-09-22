#!/bin/bash
# Script para iniciar la base de datos en desarrollo

echo "🚀 Iniciando infraestructura de base de datos propia..."
echo "📦 Reemplazando Firebase completamente"

# Verificar que Docker esté instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker no está instalado. Por favor instala Docker Desktop."
    exit 1
fi

# Verificar que Docker Compose esté disponible
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose no está disponible."
    exit 1
fi

echo "🔧 Iniciando servicios de base de datos..."

# Iniciar servicios
docker-compose up -d postgres redis

echo "⏳ Esperando que los servicios estén listos..."
sleep 10

# Verificar que PostgreSQL esté listo
echo "🔍 Verificando PostgreSQL..."
until docker-compose exec postgres pg_isready -U admin -d restaurant_platform; do
  echo "⏳ Esperando PostgreSQL..."
  sleep 2
done

# Verificar que Redis esté listo
echo "🔍 Verificando Redis..."
until docker-compose exec redis redis-cli ping; do
  echo "⏳ Esperando Redis..."
  sleep 2
done

echo "✅ Base de datos lista!"
echo ""
echo "📊 Servicios disponibles:"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo ""
echo "🔗 Conexiones:"
echo "   DATABASE_URL=postgresql://admin:secure_restaurant_2024@localhost:5432/restaurant_platform"
echo "   REDIS_URL=redis://localhost:6379"
echo ""
echo "🎯 Para conectar desde la aplicación:"
echo "   npm run dev"
echo ""
echo "🛑 Para parar los servicios:"
echo "   docker-compose down"
echo ""
echo "🗑️ Para limpiar todo (CUIDADO - borra datos):"
echo "   docker-compose down -v"

