#!/bin/bash

# Script para configurar las variables de Google Sheets en Vercel
# Ejecutar: bash setup-google-sheets-vercel.sh

echo "🔧 Configurando Google Sheets en Vercel..."
echo ""

# Leer credenciales desde google-credentials.json
GOOGLE_CLIENT_EMAIL=$(cat google-credentials.json | jq -r '.client_email')
GOOGLE_PRIVATE_KEY=$(cat google-credentials.json | jq -r '.private_key')

echo "📧 Client Email: $GOOGLE_CLIENT_EMAIL"
echo "🔑 Private Key: [HIDDEN]"
echo ""

# Configurar en Vercel (requiere Vercel CLI instalado: npm i -g vercel)
echo "⚙️ Configurando variables en Vercel..."

vercel env add GOOGLE_CLIENT_EMAIL production <<EOF
$GOOGLE_CLIENT_EMAIL
EOF

vercel env add GOOGLE_PRIVATE_KEY production <<EOF
$GOOGLE_PRIVATE_KEY
EOF

echo ""
echo "✅ Variables de Google Sheets configuradas en Vercel"
echo ""
echo "📝 Próximos pasos:"
echo "   1. Ve a https://vercel.com/zeorvis-projects/zeorvi/settings/environment-variables"
echo "   2. Verifica que las variables estén configuradas"
echo "   3. Redeploy la aplicación para que tome las nuevas variables"
echo ""

