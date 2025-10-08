# 📞 GUÍA DE PRUEBA - LLAMADA REAL AL AGENTE

## 🎯 Objetivo
Verificar que todas las mejoras implementadas funcionan correctamente en producción.

---

## ✅ PRUEBAS A REALIZAR

### 1️⃣ **Prueba: Fecha "mañana"**
**Qué decir:**
> "Hola, quiero reservar para mañana a las 8 de la noche para 4 personas."

**Qué debe pasar:**
- ✅ El agente convierte "mañana" a la fecha real (2025-10-09)
- ✅ Convierte "las 8 de la noche" a 20:00
- ✅ Llama a `obtener_horarios_y_dias_cerrados()`
- ✅ Llama a `verificar_disponibilidad()` con la fecha correcta
- ✅ Si hay disponibilidad, confirma la reserva
- ✅ Si no hay, ofrece alternativas

---

### 2️⃣ **Prueba: Día específico (viernes)**
**Qué decir:**
> "Quiero reservar para el viernes a las 9 para 2 personas."

**Qué debe pasar:**
- ✅ Calcula automáticamente qué fecha es el próximo viernes
- ✅ Convierte "las 9" a 21:00
- ✅ Verifica disponibilidad
- ✅ Confirma o sugiere alternativas

---

### 3️⃣ **Prueba: Grupo grande (más de 6 personas)**
**Qué decir:**
> "Somos 8 personas, queremos cenar mañana a las 9."

**Qué debe pasar:**
- ✅ El agente detecta que son más de 6 personas
- ✅ Responde algo como: "Para grupos de 8 personas, la reserva debe gestionarla un compañero"
- ✅ Ofrece transferir la llamada

---

### 4️⃣ **Prueba: Día cerrado (lunes o martes)**
**Qué decir:**
> "Puedo reservar para el lunes?"

**Qué debe pasar:**
- ✅ El agente consulta los días cerrados
- ✅ Responde: "Lo siento, los lunes cerramos. ¿Le viene bien otro día?"
- ✅ NO menciona todos los días abiertos (debe ser breve)

---

### 5️⃣ **Prueba: Cancelación de reserva**
**Qué decir:**
> "Quiero cancelar mi reserva."

**Qué debe pasar:**
- ✅ Pregunta por el nombre
- ✅ Llama a `buscar_reserva()`
- ✅ Llama a `cancelar_reserva()`
- ✅ Confirma la cancelación

---

### 6️⃣ **Prueba: Transferir llamada**
**Qué decir:**
> "Quiero hablar con alguien del restaurante."

**Qué debe pasar:**
- ✅ Responde: "Por supuesto, le paso con un compañero que le atenderá personalmente"
- ✅ Llama a `transferir_llamada()`

---

## 🔍 QUÉ VERIFICAR EN LOS LOGS DE RETELL AI

Después de cada llamada, revisa en Retell AI Dashboard:

### ✅ Logs exitosos deberían mostrar:
```json
{
  "function_name": "obtener_horarios_y_dias_cerrados",
  "result": {
    "success": true,
    "diasCerrados": ["lunes", "martes"],
    "horarios": [...]
  }
}

{
  "function_name": "verificar_disponibilidad",
  "parameters": {
    "fecha": "2025-10-09",  // ← Fecha real, NO token
    "hora": "20:00",        // ← Formato correcto
    "personas": 4
  },
  "result": {
    "success": true,
    "disponible": true,
    "mensaje": "Mesa disponible"
  }
}

{
  "function_name": "crear_reserva",
  "result": {
    "success": true,
    "ID": "RES_xxx",
    "mensaje": "Reserva confirmada..."
  }
}
```

### ❌ SI VES ERRORES:
```json
{
  "error": "Fecha inválida o no resuelta"
}
// O
{
  "fecha": "{{tomorrow}}"  // ← MAL: token sin resolver
}
// O
{
  "disponible": false,
  "mensaje": "Error calculando disponibilidad"
}
```

**Acción:** Avísame y revisaremos qué está fallando.

---

## 📊 VERIFICAR EN GOOGLE SHEETS

Después de crear una reserva exitosa, verifica:

1. Ve a tu Google Sheet de La Gaviota
2. Abre la pestaña **"Reservas"**
3. Debería aparecer una nueva fila con:
   - ✅ Fecha correcta (2025-10-09)
   - ✅ Hora correcta (20:00)
   - ✅ Cliente: Tu nombre
   - ✅ Teléfono: 689460069
   - ✅ Personas: 4
   - ✅ Estado: confirmada

---

## 🎯 CHECKLIST FINAL

Marca lo que funcione correctamente:

- [ ] Interpreta "mañana" correctamente
- [ ] Interpreta "viernes" correctamente
- [ ] Convierte "las 8" a 20:00 automáticamente
- [ ] NO dice "las 20:00" al cliente (dice "las 8")
- [ ] Detecta días cerrados (lunes/martes)
- [ ] Rechaza grupos >6 personas sugiriendo transferencia
- [ ] Verifica disponibilidad en Google Sheets
- [ ] Crea reservas en Google Sheets correctamente
- [ ] Cancela reservas correctamente
- [ ] Transfiere llamadas cuando se pide
- [ ] Es breve y conciso (no repite información innecesaria)
- [ ] NO menciona zonas a menos que el cliente las pida

---

## 📞 NÚMERO DE PRUEBA

**Tu número:** `689460069`

Llama a tu agente de Retell AI y prueba los escenarios anteriores.

---

## 🚨 SI ALGO FALLA

1. **Copia los logs completos de Retell AI** (Tool Invocations + Tool Results)
2. **Haz screenshot de Google Sheets** si no aparece la reserva
3. **Anota qué dijiste exactamente** vs. qué hizo el agente
4. Envíame todo eso y lo corregiré inmediatamente

---

## ✅ URL DE PRODUCCIÓN

Una vez termine el deploy de Vercel, las funciones estarán en:

```
https://www.zeorvi.com/api/retell/functions
```

Asegúrate de que esta URL esté configurada en tu agente de Retell AI.

---

¡Listo para probar! 🚀

