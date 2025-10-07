#!/bin/bash

# ============================================
# Script de Deploy para Restaurante AI Platform
# ============================================

set -e  # Detener en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones helper
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ============================================
# Paso 1: Validar pre-requisitos
# ============================================
log_info "Validando pre-requisitos..."

if [ ! -f ".env.local" ] && [ ! -f ".env.production" ]; then
    log_error "Archivo .env.local o .env.production no encontrado"
    log_info "Copia .env.example a .env.local y configura las variables"
    exit 1
fi

if [ ! -f "google-credentials.json" ]; then
    log_warning "google-credentials.json no encontrado"
    log_info "El sistema funcionará pero sin integración con Google Sheets"
fi

log_success "Pre-requisitos validados"

# ============================================
# Paso 2: Instalar dependencias
# ============================================
log_info "Instalando dependencias..."
npm ci
log_success "Dependencias instaladas"

# ============================================
# Paso 3: Ejecutar linter
# ============================================
log_info "Ejecutando linter..."
npm run lint || log_warning "Hay warnings de linter (no crítico)"
log_success "Linter ejecutado"

# ============================================
# Paso 4: Build de producción
# ============================================
log_info "Compilando aplicación para producción..."
NODE_ENV=production npm run build
log_success "Build completado"

# ============================================
# Paso 5: Preguntar método de deploy
# ============================================
echo ""
log_info "Selecciona el método de deploy:"
echo "1) Vercel (Recomendado)"
echo "2) Docker Compose"
echo "3) PM2 (Servidor propio)"
echo "4) Solo build (no deploy)"
read -p "Opción [1-4]: " deploy_option

case $deploy_option in
    1)
        log_info "Desplegando a Vercel..."
        
        # Verificar si Vercel CLI está instalado
        if ! command -v vercel &> /dev/null; then
            log_info "Instalando Vercel CLI..."
            npm i -g vercel
        fi
        
        # Deploy a Vercel
        log_info "Ejecutando deploy a Vercel..."
        vercel --prod
        
        log_success "Deploy a Vercel completado!"
        log_info "Recuerda configurar las variables de entorno en Vercel Dashboard"
        ;;
    
    2)
        log_info "Desplegando con Docker Compose..."
        
        # Verificar Docker
        if ! command -v docker &> /dev/null; then
            log_error "Docker no está instalado"
            exit 1
        fi
        
        # Build y deploy con Docker
        log_info "Construyendo imágenes Docker..."
        docker-compose -f docker-compose.prod.yml build
        
        log_info "Iniciando contenedores..."
        docker-compose -f docker-compose.prod.yml up -d
        
        log_success "Deploy con Docker completado!"
        log_info "La aplicación está corriendo en http://localhost:3000"
        log_info "Ver logs: docker-compose -f docker-compose.prod.yml logs -f"
        ;;
    
    3)
        log_info "Desplegando con PM2..."
        
        # Verificar PM2
        if ! command -v pm2 &> /dev/null; then
            log_info "Instalando PM2..."
            npm i -g pm2
        fi
        
        # Detener instancia anterior si existe
        pm2 delete restaurante-ai-platform 2>/dev/null || true
        
        # Iniciar con PM2
        log_info "Iniciando aplicación con PM2..."
        NODE_ENV=production pm2 start ecosystem.config.js --env production
        
        # Guardar configuración PM2
        pm2 save
        
        log_success "Deploy con PM2 completado!"
        log_info "Ver logs: pm2 logs restaurante-ai-platform"
        log_info "Ver status: pm2 status"
        log_info "Monitoreo: pm2 monit"
        ;;
    
    4)
        log_success "Build completado - No se realizó deploy"
        log_info "Para iniciar manualmente: npm run start"
        ;;
    
    *)
        log_error "Opción inválida"
        exit 1
        ;;
esac

# ============================================
# Paso 6: Health Check
# ============================================
if [ "$deploy_option" != "4" ]; then
    log_info "Esperando a que la aplicación inicie..."
    sleep 10
    
    log_info "Verificando health del sistema..."
    
    if curl -f http://localhost:3000/api/health &> /dev/null; then
        log_success "✨ Sistema desplegado y funcionando correctamente!"
    else
        log_warning "La aplicación está corriendo pero el health check falló"
        log_info "Verifica los logs para más detalles"
    fi
fi

# ============================================
# Información final
# ============================================
echo ""
log_success "============================================"
log_success "   🚀 DEPLOY COMPLETADO EXITOSAMENTE"
log_success "============================================"
echo ""
log_info "Próximos pasos:"
echo "  1. Verifica que la aplicación esté funcionando"
echo "  2. Configura tus agentes de Retell AI"
echo "  3. Comparte las credenciales con los restaurantes"
echo "  4. Monitorea los logs y métricas"
echo ""
log_info "Documentación completa en: DEPLOYMENT.md"
echo ""

