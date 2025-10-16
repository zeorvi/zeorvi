# 🔍 Debugging Mesas - La Gaviota

## Pasos para verificar:

### 1. Verificar que el servidor esté corriendo
```bash
npm run dev
```

### 2. Abrir el navegador y ir a:
```
http://localhost:3000/api/google-sheets/mesas?restaurantId=rest_003
```

### 3. Verificar la respuesta JSON

Debería devolver algo como:
```json
{
  "success": true,
  "data": [
    {
      "ID": "M1",
      "Zona": "Comedor 1",
      "Capacidad": 2,
      "Turnos": "Comida, Cena",
      "Estado": "Libre",
      "Notas": ""
    },
    ...
  ],
  "total": 8
}
```

### 4. Si no devuelve datos, verificar:

1. **Consola del servidor** - Buscar errores
2. **Network tab** en DevTools - Ver si la petición llega
3. **Variables de entorno** - Verificar GOOGLE_CLIENT_EMAIL y GOOGLE_PRIVATE_KEY

### 5. Posibles problemas:

- ❌ Variables de entorno incorrectas
- ❌ Permisos de Google Sheets
- ❌ Cache corrupto
- ❌ Error en el servicio

### 6. Solución rápida:

Si el endpoint devuelve `{"success": false}`, el problema está en:
- Autenticación con Google Sheets
- Permisos del servicio
- Configuración de credenciales

