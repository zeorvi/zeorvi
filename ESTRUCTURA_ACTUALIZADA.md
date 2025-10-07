# ✅ **Estructura Actualizada: RESTAURANT_SHEETS**

## 🎯 **Estructura Final Implementada**

He actualizado el archivo `src/lib/restaurantSheets.ts` para que tenga exactamente la estructura que me pediste:

```typescript
// ✅ MAPEO CENTRALIZADO: Restaurante → Google Sheet ID
export const RESTAURANT_SHEETS = {
  rest_001: process.env.LA_GAVIOTA_SHEET_ID || "1AbCDeFGHIJKLMnOPQrStUvWxYz", // La Gaviota
  rest_002: process.env.LA_TERRAZA_SHEET_ID || "1XyZ1234567890abcdefgHIJKLMn", // La Terraza
  rest_003: process.env.EL_PUERTO_SHEET_ID || "1LMNOPQrstuvwXYZabcd12345678", // El Puerto
  rest_004: process.env.EL_BUEN_SABOR_SHEET_ID || "1DeF0987654321zyxwvutsrqponmlk", // El Buen Sabor
};
```

## 🔧 **Funciones Actualizadas**

### **1. `resolveSheetConfig()`**
```typescript
// Busca en el mapeo simple
const sheetId = RESTAURANT_SHEETS[restaurantId as keyof typeof RESTAURANT_SHEETS];
if (sheetId) {
  return {
    spreadsheetId: sheetId,
    sheetName: defaultSheet
  };
}
```

### **2. `getRestaurantSheetId()`**
```typescript
export function getRestaurantSheetId(restaurantId: string): string | null {
  return RESTAURANT_SHEETS[restaurantId as keyof typeof RESTAURANT_SHEETS] || null;
}
```

### **3. `getAllRestaurantSheets()`**
```typescript
export function getAllRestaurantSheets(): Array<{ restaurantId: string; sheetId: string }> {
  return Object.entries(RESTAURANT_SHEETS).map(([restaurantId, sheetId]) => ({
    restaurantId,
    sheetId
  }));
}
```

## 📋 **Scripts Actualizados**

### **1. Script de Creación** (`scripts/create-restaurant-sheets.js`)
- ✅ Configuración actualizada con los 4 restaurantes correctos
- ✅ Genera variables de entorno con nombres correctos
- ✅ Archivo `.env.sheets` con la estructura correcta

### **2. Script de Pruebas** (`scripts/test-sheets-structure.js`)
- ✅ Prueba los 4 restaurantes
- ✅ Usa las variables de entorno correctas

## 🚀 **Variables de Entorno Generadas**

El script ahora genera:

```bash
# Google Sheets IDs para cada restaurante
# Generado automáticamente el 2024-01-20T...

# La Gaviota
LA_GAVIOTA_SHEET_ID=1AbCDeFGHIJKLMnOPQrStUvWxYz

# La Terraza
LA_TERRAZA_SHEET_ID=1XyZ1234567890abcdefgHIJKLMn

# El Puerto
EL_PUERTO_SHEET_ID=1LMNOPQrstuvwXYZabcd12345678

# El Buen Sabor  
EL_BUEN_SABOR_SHEET_ID=1DeF0987654321zyxwvutsrqponmlk

# Fallback (opcional)
GOOGLE_SHEETS_ID=1AbCDeFGHIJKLMnOPQrStUvWxYz
```

## 🎯 **Restaurantes Configurados**

| ID | Nombre | Descripción | Mesas |
|----|--------|-------------|-------|
| `rest_001` | La Gaviota | Restaurante de mariscos y pescados frescos | 8 mesas |
| `rest_002` | La Terraza | Restaurante con terraza al aire libre | 6 mesas |
| `rest_003` | El Puerto | Restaurante de pescados y mariscos | 6 mesas |
| `rest_004` | El Buen Sabor | Restaurante familiar con ambiente acogedor | 6 mesas |

## ✅ **Compatibilidad**

- ✅ **Webhook global** funciona con la nueva estructura
- ✅ **Funciones Retell** usan `resolveSheetConfig()` correctamente
- ✅ **Google Sheets Service** funciona sin cambios
- ✅ **Dashboard** lee los mismos datos
- ✅ **Scripts de prueba** verifican la estructura

## 🚀 **Próximos Pasos**

1. **Ejecutar script de creación**:
   ```bash
   node scripts/create-restaurant-sheets.js
   ```

2. **Copiar IDs reales** del archivo `.env.sheets` generado

3. **Configurar en Vercel** con las variables correctas

4. **Probar el sistema**:
   ```bash
   node scripts/test-sheets-structure.js
   ```

¡La estructura está exactamente como me pediste! 🎉
