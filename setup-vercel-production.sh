#!/bin/bash

# ============================================
# Script para configurar variables de entorno en Vercel
# ============================================

echo "🚀 Configurando variables de entorno en Vercel..."
echo ""

# ============================================
# 1. DATABASE_URL
# ============================================
echo "📊 DATABASE_URL"
echo "Copia tu URL de Supabase:"
echo "Supabase Dashboard > Project Settings > Database > Connection String"
echo ""
vercel env add DATABASE_URL production

# ============================================
# 2. JWT_SECRET
# ============================================
echo ""
echo "🔒 JWT_SECRET"
echo "Generando JWT secret seguro..."
JWT_SECRET=$(openssl rand -base64 32)
echo $JWT_SECRET | vercel env add JWT_SECRET production
echo "✅ JWT_SECRET configurado"

# ============================================
# 3. RETELL_API_KEY
# ============================================
echo ""
echo "🤖 RETELL_API_KEY"
echo "Copia tu API Key de Retell AI:"
echo "https://app.retellai.com/ > Settings > API Keys"
echo ""
vercel env add RETELL_API_KEY production

# ============================================
# 4. GOOGLE SHEETS
# ============================================
echo ""
echo "📊 GOOGLE_CLIENT_EMAIL"
echo "zeorvi@zeorvi.iam.gserviceaccount.com" | vercel env add GOOGLE_CLIENT_EMAIL production
echo "✅ GOOGLE_CLIENT_EMAIL configurado"

echo ""
echo "📊 GOOGLE_PRIVATE_KEY"
echo "Pegando private key de Google..."
cat google-credentials.json | jq -r '.private_key' | vercel env add GOOGLE_PRIVATE_KEY production
echo "✅ GOOGLE_PRIVATE_KEY configurado"

echo ""
echo "📊 GOOGLE_PROJECT_ID"
echo "zeorvi" | vercel env add GOOGLE_PROJECT_ID production
echo "✅ GOOGLE_PROJECT_ID configurado"

# ============================================
# 5. APP URLs
# ============================================
echo ""
echo "🌐 NEXT_PUBLIC_BASE_URL"
echo "https://zeorvi.com" | vercel env add NEXT_PUBLIC_BASE_URL production
echo "✅ NEXT_PUBLIC_BASE_URL configurado"

echo ""
echo "🌐 NEXT_PUBLIC_API_URL"
echo "https://zeorvi.com/api" | vercel env add NEXT_PUBLIC_API_URL production
echo "✅ NEXT_PUBLIC_API_URL configurado"

# ============================================
# 6. NODE_ENV
# ============================================
echo ""
echo "⚙️  NODE_ENV"
echo "production" | vercel env add NODE_ENV production
echo "✅ NODE_ENV configurado"

# ============================================
# Finalizado
# ============================================
echo ""
echo "✨ ¡Configuración completada!"
echo ""
echo "📋 Próximos pasos:"
echo "1. Hacer redeploy: vercel --prod"
echo "2. Compartir Google Sheets con: zeorvi@zeorvi.iam.gserviceaccount.com"
echo "3. Configurar webhooks de Retell AI"
echo ""

