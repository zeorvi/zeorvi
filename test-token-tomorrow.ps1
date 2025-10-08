$body = @{
    name = "verificar_disponibilidad"
    agent_id = "agent_2082fc7a622cdbd22441b22060"
    parameters = @{
        fecha = "{{tomorrow}}"
        hora = "21:00"
        personas = 2
    }
} | ConvertTo-Json -Depth 3

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PRUEBA: Token {{tomorrow}}" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Request enviado:" -ForegroundColor Yellow
Write-Host $body -ForegroundColor Gray
Write-Host ""

try {
    $response = Invoke-RestMethod -Uri "https://www.zeorvi.com/api/retell/functions" -Method Post -ContentType "application/json" -Body $body
    
    Write-Host "✅ RESPUESTA EXITOSA:" -ForegroundColor Green
    Write-Host ""
    $responseJson = $response | ConvertTo-Json -Depth 5
    Write-Host $responseJson -ForegroundColor White
    Write-Host ""
    
    if ($response.success -eq $true) {
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "✅ TOKEN CONVERTIDO CORRECTAMENTE" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "Token original: {{tomorrow}}" -ForegroundColor Yellow
        Write-Host "Fecha convertida: $($response.fecha)" -ForegroundColor Cyan
        Write-Host "Restaurante ID: $($response.restaurantId)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ ERROR EN LA RESPUESTA" -ForegroundColor Red
        Write-Host "Error: $($response.error)" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ ERROR:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

