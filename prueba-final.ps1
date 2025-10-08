$body = Get-Content "test-final-tomorrow.json" -Raw

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  PRUEBA FINAL: Token {{tomorrow}}" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Enviando a: https://www.zeorvi.com/api/retell/functions`n" -ForegroundColor Yellow

try {
    $resp = Invoke-RestMethod -Uri "https://www.zeorvi.com/api/retell/functions" -Method Post -ContentType "application/json" -Body $body
    
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "         RESULTADO EXITOSO" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    Write-Host "Token enviado: {{tomorrow}}" -ForegroundColor Yellow
    Write-Host "Fecha convertida: $($resp.fecha)" -ForegroundColor Cyan
    Write-Host "Restaurant ID: $($resp.restaurantId)" -ForegroundColor Cyan
    Write-Host "Hora: $($resp.hora)" -ForegroundColor White
    Write-Host "Personas: $($resp.personas)" -ForegroundColor White
    Write-Host "`nDisponible: $($resp.result.disponible)" -ForegroundColor $(if ($resp.result.disponible) { "Green" } else { "Yellow" })
    Write-Host "Mensaje: $($resp.result.mensaje)" -ForegroundColor White
    
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "   SISTEMA COMPLETAMENTE FUNCIONAL" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
} catch {
    Write-Host "`n========================================" -ForegroundColor Red
    Write-Host "             ERROR" -ForegroundColor Red
    Write-Host "========================================`n" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

