# 🚀 Inicio Rápido con Supabase

## Configuración en 3 Pasos

### 1. Configurar Supabase

```bash
npm run db:setup-supabase
```

Este script te guiará paso a paso para configurar Supabase.

### 2. Probar Conexión

```bash
npm run db:test-connection
```

Verifica que la conexión funcione correctamente.

### 3. Configurar Base de Datos

```bash
npm run db:setup
```

Crea todas las tablas y datos de ejemplo.

## 🎯 Usuarios Demo

Después del setup, puedes usar estos usuarios:

- **Admin:** `admin@restauranteia.com` / `admin123`
- **Restaurante:** `admin@elbuensabor.com` / `restaurante123`

## 🔧 Solución de Problemas

### Error de Conexión

1. Verifica que la URL de Supabase sea correcta
2. Asegúrate de que el proyecto esté activo
3. Verifica la contraseña de la base de datos

### Error de Permisos

1. Verifica que el usuario tenga permisos de creación de tablas
2. Asegúrate de usar el usuario `postgres` para el setup inicial

## 📚 Documentación Completa

Para más detalles, consulta [SUPABASE_SETUP.md](./SUPABASE_SETUP.md)

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs de error
2. Ejecuta `npm run db:test-connection`
3. Verifica la configuración en Supabase
4. Consulta la documentación completa

