# Script de prueba para verificar las APIs en producción

Write-Host "🧪 PRUEBAS DE PRODUCCIÓN - ZEORVI.COM" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "https://www.zeorvi.com"
$hoy = Get-Date
$manana = $hoy.AddDays(1).ToString("yyyy-MM-dd")

Write-Host "📅 Fecha de hoy: $($hoy.ToString('yyyy-MM-dd'))" -ForegroundColor Yellow
Write-Host "📅 Fecha de mañana: $manana" -ForegroundColor Yellow
Write-Host ""

# Test 1: Health Check
Write-Host "1️⃣  Test: Health Check" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method Get -ErrorAction Stop
    Write-Host "   ✅ Health check OK" -ForegroundColor Green
    Write-Host "   Response: $($response | ConvertTo-Json -Compress)" -ForegroundColor Gray
} catch {
    Write-Host "   ❌ Health check failed: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 2: Verificar disponibilidad (POST con fecha real)
Write-Host "2️⃣  Test: Verificar Disponibilidad (POST - fecha real)" -ForegroundColor Green
try {
    $body = @{
        restaurantId = "rest_003"
        fecha = $manana
        hora = "20:00"
        personas = 4
        zona = "Salón Principal"
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/google-sheets/disponibilidad" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "   ✅ Verificación de disponibilidad OK" -ForegroundColor Green
    Write-Host "   Disponible: $($response.disponible)" -ForegroundColor Yellow
    Write-Host "   Mensaje: $($response.mensaje)" -ForegroundColor Yellow
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 3: Obtener horarios
Write-Host "3️⃣  Test: Obtener Horarios" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/google-sheets/horarios?restaurantId=rest_003" -Method Get -ErrorAction Stop
    Write-Host "   ✅ Horarios obtenidos OK" -ForegroundColor Green
    Write-Host "   Cantidad de horarios: $($response.horarios.Count)" -ForegroundColor Yellow
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 4: Obtener mesas
Write-Host "4️⃣  Test: Obtener Mesas" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/google-sheets/mesas?restaurantId=rest_003" -Method Get -ErrorAction Stop
    Write-Host "   ✅ Mesas obtenidas OK" -ForegroundColor Green
    Write-Host "   Cantidad de mesas: $($response.mesas.Count)" -ForegroundColor Yellow
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 5: Obtener días cerrados
Write-Host "5️⃣  Test: Obtener Días Cerrados" -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/google-sheets/dias-cerrados?restaurantId=rest_003" -Method Get -ErrorAction Stop
    Write-Host "   ✅ Días cerrados obtenidos OK" -ForegroundColor Green
    Write-Host "   Días cerrados: $($response.diasCerrados -join ', ')" -ForegroundColor Yellow
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 6: Función de Retell - obtener_horarios_y_dias_cerrados
Write-Host "6️⃣  Test: Retell Function - obtener_horarios_y_dias_cerrados" -ForegroundColor Green
try {
    $body = @{
        name = "obtener_horarios_y_dias_cerrados"
        parameters = @{}
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/retell/functions" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "   ✅ Función ejecutada OK" -ForegroundColor Green
    Write-Host "   Días cerrados: $($response.result.diasCerrados -join ', ')" -ForegroundColor Yellow
    Write-Host "   Horarios: $($response.result.horarios.Count) registros" -ForegroundColor Yellow
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Test 7: Función de Retell - verificar_disponibilidad (con "mañana")
Write-Host "7️⃣  Test: Retell Function - verificar_disponibilidad (normalización de fecha)" -ForegroundColor Green
try {
    $body = @{
        name = "verificar_disponibilidad"
        parameters = @{
            fecha = "mañana"
            hora = "20:00"
            personas = 4
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/retell/functions" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "   ✅ Función ejecutada OK" -ForegroundColor Green
    Write-Host "   Fecha normalizada a: $($response.fecha)" -ForegroundColor Yellow
    Write-Host "   Disponible: $($response.result.disponible)" -ForegroundColor Yellow
    Write-Host "   Mensaje: $($response.result.mensaje)" -ForegroundColor Yellow
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "   Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Red
    }
}
Write-Host ""

# Test 8: Función de Retell - verificar_disponibilidad (grupo grande)
Write-Host "8️⃣  Test: Retell Function - grupo grande (>6 personas)" -ForegroundColor Green
try {
    $body = @{
        name = "verificar_disponibilidad"
        parameters = @{
            fecha = $manana
            hora = "20:00"
            personas = 8
        }
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/api/retell/functions" -Method Post -Body $body -ContentType "application/json" -ErrorAction Stop
    Write-Host "   ✅ Función ejecutada OK" -ForegroundColor Green
    Write-Host "   Disponible: $($response.result.disponible)" -ForegroundColor Yellow
    Write-Host "   Mensaje: $($response.result.mensaje)" -ForegroundColor Yellow
    if ($response.result.mensaje -match "compañero") {
        Write-Host "   ✅ Detectó grupo grande correctamente!" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# Resumen final
Write-Host ""
Write-Host "🎯 RESUMEN DE PRUEBAS" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Pruebas completadas" -ForegroundColor Green
Write-Host "📅 Fecha de prueba: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray
Write-Host ""
Write-Host "🔗 URLs principales:" -ForegroundColor Yellow
Write-Host "   • API Health: $baseUrl/api/health"
Write-Host "   • Retell Functions: $baseUrl/api/retell/functions"
Write-Host "   • Google Sheets API: $baseUrl/api/google-sheets/*"
Write-Host ""
Write-Host "📞 Ahora puedes hacer una llamada real al agente!" -ForegroundColor Green
Write-Host "   Número de prueba: 689460069" -ForegroundColor Yellow
Write-Host ""

