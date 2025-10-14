# Script para probar las funciones de Retell antes de configurarlas
# Uso: .\test-funciones-retell.ps1

$URL = "https://zeorvi.com/api/retell/functions/rest_003"

Write-Host "🧪 PROBANDO FUNCIONES DE RETELL" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

# Test 1: Verificar disponibilidad
Write-Host "1️⃣ VERIFICAR DISPONIBILIDAD" -ForegroundColor Yellow
$body1 = @{
    function_name = "verificar_disponibilidad"
    parameters = @{
        fecha = "2025-10-15"
        hora = "20:00"
        personas = 2
        zona = ""
    }
} | ConvertTo-Json -Depth 5

Write-Host "📤 Enviando: $body1" -ForegroundColor Gray

try {
    $response1 = Invoke-RestMethod -Uri $URL -Method POST -Body $body1 -ContentType "application/json"
    Write-Host "✅ Respuesta:" -ForegroundColor Green
    $response1 | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 2: Crear reserva
Write-Host "2️⃣ CREAR RESERVA" -ForegroundColor Yellow
$body2 = @{
    function_name = "crear_reserva"
    parameters = @{
        fecha = "2025-10-15"
        hora = "20:00"
        personas = 2
        cliente = "Juan Pérez Test"
        telefono = "+34666555444"
        turno = "Cena"
        zona = ""
        mesa = ""
        notas = "Prueba desde PowerShell"
    }
} | ConvertTo-Json -Depth 5

Write-Host "📤 Enviando: $body2" -ForegroundColor Gray

try {
    $response2 = Invoke-RestMethod -Uri $URL -Method POST -Body $body2 -ContentType "application/json"
    Write-Host "✅ Respuesta:" -ForegroundColor Green
    $response2 | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 3: Buscar reserva
Write-Host "3️⃣ BUSCAR RESERVA" -ForegroundColor Yellow
$body3 = @{
    function_name = "buscar_reserva"
    parameters = @{
        cliente = "Juan Pérez Test"
        telefono = "+34666555444"
    }
} | ConvertTo-Json -Depth 5

Write-Host "📤 Enviando: $body3" -ForegroundColor Gray

try {
    $response3 = Invoke-RestMethod -Uri $URL -Method POST -Body $body3 -ContentType "application/json"
    Write-Host "✅ Respuesta:" -ForegroundColor Green
    $response3 | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 4: Modificar reserva
Write-Host "4️⃣ MODIFICAR RESERVA" -ForegroundColor Yellow
$body4 = @{
    function_name = "modificar_reserva"
    parameters = @{
        cliente = "Juan Pérez Test"
        telefono = "+34666555444"
        nueva_hora = "21:30"
    }
} | ConvertTo-Json -Depth 5

Write-Host "📤 Enviando: $body4" -ForegroundColor Gray

try {
    $response4 = Invoke-RestMethod -Uri $URL -Method POST -Body $body4 -ContentType "application/json"
    Write-Host "✅ Respuesta:" -ForegroundColor Green
    $response4 | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n---`n"

# Test 5: Cancelar reserva
Write-Host "5️⃣ CANCELAR RESERVA" -ForegroundColor Yellow
$body5 = @{
    function_name = "cancelar_reserva"
    parameters = @{
        cliente = "Juan Pérez Test"
        telefono = "+34666555444"
    }
} | ConvertTo-Json -Depth 5

Write-Host "📤 Enviando: $body5" -ForegroundColor Gray

try {
    $response5 = Invoke-RestMethod -Uri $URL -Method POST -Body $body5 -ContentType "application/json"
    Write-Host "✅ Respuesta:" -ForegroundColor Green
    $response5 | ConvertTo-Json -Depth 5 | Write-Host -ForegroundColor Green
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "✅ PRUEBAS COMPLETADAS" -ForegroundColor Cyan

