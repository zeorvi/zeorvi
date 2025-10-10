# Script para configurar las variables de Google Sheets en Vercel (PowerShell)
# Ejecutar: .\setup-google-sheets-vercel.ps1

Write-Host "🔧 Configurando Google Sheets en Vercel..." -ForegroundColor Cyan
Write-Host ""

# Leer credenciales desde google-credentials.json
$credentials = Get-Content google-credentials.json | ConvertFrom-Json

$GOOGLE_CLIENT_EMAIL = $credentials.client_email
$GOOGLE_PRIVATE_KEY = $credentials.private_key

Write-Host "Client Email: $GOOGLE_CLIENT_EMAIL" -ForegroundColor Green
Write-Host "Private Key: [HIDDEN]" -ForegroundColor Yellow
Write-Host ""

Write-Host "⚙️ Para configurar en Vercel, ejecuta estos comandos:" -ForegroundColor Cyan
Write-Host ""
Write-Host "vercel env add GOOGLE_CLIENT_EMAIL production" -ForegroundColor White
Write-Host "  (Cuando pida el valor, pega: $GOOGLE_CLIENT_EMAIL)" -ForegroundColor Gray
Write-Host ""
Write-Host "vercel env add GOOGLE_PRIVATE_KEY production" -ForegroundColor White
Write-Host "  (Cuando pida el valor, pega la private key completa)" -ForegroundColor Gray
Write-Host ""

Write-Host "O configura manualmente en:" -ForegroundColor Cyan
Write-Host "  https://vercel.com/zeorvis-projects/zeorvi/settings/environment-variables" -ForegroundColor White
Write-Host ""

Write-Host "📋 Variables a configurar:" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "GOOGLE_CLIENT_EMAIL = $GOOGLE_CLIENT_EMAIL" -ForegroundColor White
Write-Host ""
Write-Host "GOOGLE_PRIVATE_KEY =" -ForegroundColor White
Write-Host $GOOGLE_PRIVATE_KEY -ForegroundColor Gray
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host ""

