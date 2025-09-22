# Configuración del Agente para La Gaviota

## Resumen de Configuración Completada

Se ha configurado exitosamente el agente `agent_2082fc7a622cdbd22441b22060` para el restaurante **La Gaviota**.

## Archivos Modificados

### 1. `src/lib/userMapping.ts`
- **Usuario agregado:** `lagaviota`
- **Email:** `admin@lagaviota.com`
- **Restaurant ID:** `rest_003`
- **Tipo:** Marisquería
- **Agent ID:** `agent_2082fc7a622cdbd22441b22060`

### 2. `src/lib/retellConfig.ts`
- **Configuración Retell agregada** para `rest_003`
- **Agent ID:** `agent_2082fc7a622cdbd22441b22060`
- **Voice ID:** `es-ES-ElviraNeural`
- **Language:** `es-ES`
- **Restaurant Name:** La Gaviota

### 3. `src/lib/restaurantConfigs.ts`
- **Nueva configuración:** `laGaviotaConfig`
- **Restaurant ID:** `rest_003`
- **Ubicaciones:** Salón Principal, Terraza, Barra
- **Total de mesas:** 16 mesas
  - Salón Principal: 5 mesas (S1-S5)
  - Terraza: 4 mesas (T1-T4) 
  - Barra: 4 asientos (B1-B4)
- **Nuevo tipo de restaurante:** Marisquería

### 4. `scripts/setup-firebase-collections.js`
- **Restaurante agregado** a la configuración de Firebase
- **Dirección:** Paseo Marítimo 789, Valencia
- **Teléfono:** +34987654321
- **Configuración completa** de Retell y Twilio

## Detalles de la Configuración

### Mesas Configuradas

#### Salón Principal (5 mesas)
- S1: 2 personas - Mesa romántica con vista al mar
- S2: 4 personas - Mesa familiar interior  
- S3: 4 personas - Mesa familiar interior
- S4: 6 personas - Mesa para grupos
- S5: 8 personas - Mesa grande para celebraciones

#### Terraza (4 mesas)
- T1: 2 personas - Mesa romántica con vista al mar
- T2: 4 personas - Mesa familiar con vista
- T3: 4 personas - Mesa familiar con vista  
- T4: 6 personas - Mesa para grupos con vista

#### Barra (4 asientos)
- B1-B4: 1 persona cada uno - Asientos individuales en barra

### Configuración de Retell AI

- **Agent ID:** `agent_2082fc7a622cdbd22441b22060`
- **Voice:** ElviraNeural (español)
- **Webhook:** Configurado para recibir eventos de llamadas
- **Variables dinámicas:** restaurant_id y restaurant_name configuradas

### Tipo de Restaurante: Marisquería

- **Descripción:** Restaurante especializado en mariscos y pescados con terraza al mar
- **Views de Airtable:** viwReservasHoyMar, viwReservasSemanaMar, viwReservasMesMar
- **Voice Settings:** ElviraNeural, español

## Próximos Pasos

1. **Ejecutar el script de Firebase** para crear las colecciones:
   ```bash
   node scripts/setup-firebase-collections.js
   ```

2. **Verificar la configuración** en el dashboard de administración

3. **Probar el agente** con llamadas de prueba

4. **Configurar webhooks** si es necesario

## Acceso al Sistema

- **Username:** `lagaviota`
- **Email:** `admin@lagaviota.com`
- **Restaurant ID:** `rest_003`
- **Agent ID:** `agent_2082fc7a622cdbd22441b22060`

La configuración está completa y lista para usar.
