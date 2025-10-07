# ✅ Checklist de Producción - Restaurante AI Platform

## 🎯 Estado Actual del Proyecto

### ✅ Completado

- [x] **Credenciales limpias** - Todas las credenciales hardcodeadas eliminadas
- [x] **Vercel configurado** - `vercel.json` creado
- [x] **Docker preparado** - Dockerfile y docker-compose listos
- [x] **Script de deploy** - `deploy.sh` creado y listo
- [x] **WebSocket arreglado** - Singleton implementado
- [x] **Build time queries** - Queries de DB no se ejecutan en build
- [x] **Gitignore actualizado** - Protección de archivos sensibles
- [x] **Guía de deployment** - `DEPLOYMENT.md` completa
- [x] **Google Sheets** - Credenciales configuradas

---

## 📋 Pasos Finales Antes de Deployment

### 1. Variables de Entorno (15 min)

```bash
# Crear .env.local para desarrollo
cp env.example.txt .env.local

# Configurar variables críticas
DATABASE_URL=postgresql://...  # Tu Supabase URL
JWT_SECRET=$(openssl rand -base64 32)  # Generar nuevo
RETELL_API_KEY=tu-api-key
```

### 2. Configuración de Vercel (10 min)

#### En Vercel Dashboard:
1. Ir a Project Settings > Environment Variables
2. Agregar todas las variables de `.env.production.example`
3. Variables críticas:
   - `DATABASE_URL`
   - `JWT_SECRET` (generar nuevo)
   - `GOOGLE_CLIENT_EMAIL` = `zeorvi@zeorvi.iam.gserviceaccount.com`
   - `GOOGLE_PRIVATE_KEY` (de `google-credentials.json`)
   - `RETELL_API_KEY`
   - `NEXT_PUBLIC_BASE_URL` = tu dominio de Vercel

### 3. Configurar Google Sheets (5 min)

Para cada restaurante:
1. Abrir el Google Sheet
2. Clic en "Share"
3. Agregar: `zeorvi@zeorvi.iam.gserviceaccount.com`
4. Permisos: **Editor**
5. Copiar el ID del Sheet desde la URL

### 4. Test Local (10 min)

```bash
# Build local
npm run build

# Si el build falla, revisar:
# - No hay queries de DB en componentes de servidor
# - Todas las importaciones son correctas
# - No hay errores de TypeScript críticos
```

### 5. Deploy a Vercel (5 min)

```bash
# Opción A: Desde GitHub (Recomendado)
# Hacer push a main/master → Deploy automático

# Opción B: Desde CLI
npm i -g vercel
vercel login
vercel --prod
```

### 6. Verificación Post-Deploy (10 min)

```bash
# Health check
curl https://tu-dominio.vercel.app/api/health

# Debe retornar:
{
  "status": "ok",
  "timestamp": "...",
  "uptime": ...
}
```

---

## 🚨 Problemas Conocidos y Soluciones

### Problema: "Tenant or user not found" durante build

**Causa**: Queries de base de datos ejecutándose durante el build de Next.js

**Solución**: ✅ Ya arreglado
- `alertSystem.ts` usa inicialización lazy
- WebSocket usa singleton
- Queries solo se ejecutan en runtime

### Problema: "WebSocket EADDRINUSE"

**Solución**: ✅ Ya arreglado
- Implementado `websocketSingleton.ts`
- En Vercel, WebSocket está automáticamente deshabilitado

### Problema: Vercel "Module not found"

**Solución**:
```bash
# Limpiar y reconstruir
rm -rf .next node_modules
npm install
npm run build
```

---

## 🔐 Seguridad Checklist

- [ ] `JWT_SECRET` es único y seguro (32+ caracteres aleatorios)
- [ ] Contraseña de Supabase cambiada desde el valor por defecto
- [ ] `google-credentials.json` NO está commiteado en Git
- [ ] Variables de entorno configuradas en Vercel (no en código)
- [ ] CORS configurado solo para dominios permitidos
- [ ] Tasa de rate limiting configurada

---

## 📱 Configuración de Retell AI

### Crear Agente para cada Restaurante

```bash
# Ejemplo para La Gaviota
curl -X POST https://api.retellai.com/v1/create-agent \
  -H "Authorization: Bearer $RETELL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "agent_name": "La Gaviota - Asistente de Reservas",
    "voice_id": "11labs-es",
    "language": "es",
    "webhook_url": "https://tu-dominio.vercel.app/api/retell/webhook/rest_003",
    "general_prompt": "Ver PROMPT_RETELL_LA_GAVIOTA.md para el prompt completo"
  }'
```

### Obtener el Agent ID
- Guardar el `agent_id` retornado
- Actualizar en tu configuración si es necesario

---

## 📊 Monitoreo Post-Launch

### Día 1-3: Monitoreo Intensivo

```bash
# Ver logs en tiempo real
vercel logs --follow

# Check cada hora
curl https://tu-dominio.vercel.app/api/health
```

### Semana 1: Monitoreo Regular

- Revisar logs diarios
- Verificar que las reservas se crean correctamente
- Validar que Google Sheets se actualiza
- Confirmar que Retell AI está funcionando

### Métricas a Monitorear

1. **Tasa de Error** - Debe ser < 1%
2. **Tiempo de Respuesta** - Debe ser < 500ms (p95)
3. **Disponibilidad** - Debe ser > 99%
4. **Reservas Creadas** - Validar que se guardan correctamente

---

## 🎉 Launch Checklist Final

### Pre-Launch
- [ ] Build exitoso sin errores
- [ ] Todas las variables de entorno configuradas
- [ ] Google Sheets compartido con service account
- [ ] Retell AI agentes creados y configurados
- [ ] Tests manuales pasados
- [ ] Documentación completa

### Launch
- [ ] Deploy a producción exitoso
- [ ] Health check OK
- [ ] Crear reserva de prueba
- [ ] Verificar Google Sheets actualizado
- [ ] Verificar Retell AI respondiendo

### Post-Launch
- [ ] Monitoreo activo primeras 24h
- [ ] Logs sin errores críticos
- [ ] Clientes pueden hacer reservas
- [ ] Equipo del restaurante capacitado

---

## 💡 Consejos Finales

1. **Hacer backup** de la base de datos regularmente
2. **Monitorear logs** especialmente los primeros días
3. **Tener plan B** - mantener sistema manual disponible inicialmente
4. **Comunicar** con el equipo del restaurante sobre cambios
5. **Iterar rápido** - los primeros días habrán ajustes

---

## 📞 En Caso de Emergencia

### Sistema caído
```bash
# Ver logs
vercel logs --follow

# Rollback a versión anterior
vercel rollback
```

### Base de datos no conecta
- Verificar que Supabase está activo
- Revisar `DATABASE_URL` en variables de entorno
- Check de conexión desde Supabase dashboard

### Google Sheets no actualiza
- Verificar permisos del service account
- Revisar que `GOOGLE_CLIENT_EMAIL` y `GOOGLE_PRIVATE_KEY` sean correctos
- Validar que la API de Google Sheets esté habilitada

---

## ✨ ¡Listo para Producción!

Tu sistema tiene:
- ✅ Código limpio y seguro
- ✅ Configuración robusta
- ✅ Documentación completa
- ✅ Manejo de errores
- ✅ Monitoreo integrado

**Próximo paso**: ¡Deployar y lanzar! 🚀

