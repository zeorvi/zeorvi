# ✅ DEPLOYMENT COMPLETADO - PASOS FINALES

## 🎉 ¡Tu app está en https://zeorvi.com!

---

## 🔴 3 PASOS PARA ACTIVAR (15 minutos total)

### PASO 1: Generar JWT Secret (2 min)

Abre PowerShell y ejecuta:

```powershell
$bytes = New-Object byte[] 32
[Security.Cryptography.RNGCryptoServiceProvider]::Create().GetBytes($bytes)
$secret = [Convert]::ToBase64String($bytes)
Write-Host "Tu JWT_SECRET es:"
Write-Host $secret -ForegroundColor Green
Write-Host ""
Write-Host "Cópialo ahora ↑"
```

Copia el resultado.

---

### PASO 2: Configurar Variables en Vercel (10 min)

Ve a: https://vercel.com/zeorvis-projects/zeorvi/settings/environment-variables

Agrega estas variables (clic en "Add New" para cada una):

| Nombre | Valor |
|--------|-------|
| `DATABASE_URL` | `postgresql://postgres.rjalwnbkknjqdxzwatrw:TU-PASSWORD@aws-1-eu-west-2.pooler.supabase.com:6543/postgres` |
| `JWT_SECRET` | El que generaste en Paso 1 |
| `RETELL_API_KEY` | Tu API key de Retell |
| `GOOGLE_CLIENT_EMAIL` | `zeorvi@zeorvi.iam.gserviceaccount.com` |
| `GOOGLE_PRIVATE_KEY` | Ver archivo `google-credentials.json` (campo "private_key") |
| `GOOGLE_PROJECT_ID` | `zeorvi` |
| `NEXT_PUBLIC_BASE_URL` | `https://zeorvi.com` |
| `NEXT_PUBLIC_API_URL` | `https://zeorvi.com/api` |

**Para Environment**: Selecciona **Production** en todas

---

### PASO 3: Compartir Google Sheet (2 min)

1. Abre: https://docs.google.com/spreadsheets/d/115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4/edit
2. Clic en "Compartir"
3. Email: `zeorvi@zeorvi.iam.gserviceaccount.com`
4. Rol: **Editor**
5. Desmarcar "Notificar"
6. "Compartir"

---

## 🔄 PASO 4: Redeploy (1 min)

Ejecuta en tu terminal:

```bash
cd c:\Users\Administrador01\Documents\restaurante-ai-platform
vercel --prod --yes
```

Espera 2 minutos...

---

## ✅ VERIFICACIÓN

Después del redeploy, prueba:

1. **Abre en navegador**: https://zeorvi.com
2. **Health check**: https://zeorvi.com/api/health (debería mostrar `{"status":"ok"}`)
3. **Login**: https://zeorvi.com/login

---

## 📞 LINKS IMPORTANTES

- **Tu App**: https://zeorvi.com
- **Vercel Dashboard**: https://vercel.com/zeorvis-projects/zeorvi
- **Google Sheet La Gaviota**: https://docs.google.com/spreadsheets/d/115x4UoUrtTxaG1vYzCReKaOonu7-5CTv4f9Oxe3e_J4/edit

---

## 🎯 CHECKLIST

- [ ] Generar JWT_SECRET
- [ ] Configurar 8 variables en Vercel
- [ ] Compartir Google Sheet
- [ ] Redeploy
- [ ] Verificar que https://zeorvi.com funcione
- [ ] Verificar health check
- [ ] ¡Listo para usar!

---

**Tiempo estimado total: 15 minutos**
**Después de esto, tu app estará 100% funcional** ✨

