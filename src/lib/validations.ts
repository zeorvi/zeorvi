import { z } from 'zod';

// Validaciones de autenticación
export const loginSchema = z.object({
  username: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Debe contener al menos una mayúscula, una minúscula y un número'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

// Validaciones de reservas
export const reservationSchema = z.object({
  restaurantId: z.string().min(1, 'ID del restaurante requerido'),
  clientName: z.string().min(2, 'Nombre del cliente requerido'),
  clientPhone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Teléfono inválido'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe estar en formato YYYY-MM-DD'),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Hora debe estar en formato HH:MM'),
  people: z.number().min(1, 'Mínimo 1 persona').max(20, 'Máximo 20 personas'),
  location: z.string().optional(),
  notes: z.string().max(500, 'Notas no pueden exceder 500 caracteres').optional()
});

export const updateReservationSchema = z.object({
  id: z.string().min(1, 'ID de reserva requerido'),
  status: z.enum(['pendiente', 'confirmada', 'cancelada', 'completada']),
  notes: z.string().max(500, 'Notas no pueden exceder 500 caracteres').optional()
});

// Validaciones de mesas
export const tableSchema = z.object({
  id: z.string().min(1, 'ID de mesa requerido'),
  name: z.string().min(1, 'Nombre de mesa requerido'),
  capacity: z.number().min(1, 'Capacidad mínima de 1 persona').max(20, 'Capacidad máxima de 20 personas'),
  location: z.string().min(1, 'Ubicación requerida'),
  status: z.enum(['libre', 'ocupada', 'reservada'])
});

export const updateTableStatusSchema = z.object({
  tableId: z.string().min(1, 'ID de mesa requerido'),
  status: z.enum(['libre', 'ocupada', 'reservada']),
  clientName: z.string().optional(),
  clientPhone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Teléfono inválido').optional(),
  reservationId: z.string().optional()
});

// Validaciones de restaurantes
export const restaurantSchema = z.object({
  name: z.string().min(2, 'Nombre del restaurante requerido'),
  email: z.string().email('Email inválido'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Teléfono inválido'),
  address: z.string().min(10, 'Dirección completa requerida'),
  type: z.enum(['restaurante', 'bar', 'cafeteria', 'fast_food', 'fine_dining']),
  capacity: z.number().min(10, 'Capacidad mínima de 10 personas'),
  openingHours: z.object({
    monday: z.object({ open: z.string(), close: z.string() }).optional(),
    tuesday: z.object({ open: z.string(), close: z.string() }).optional(),
    wednesday: z.object({ open: z.string(), close: z.string() }).optional(),
    thursday: z.object({ open: z.string(), close: z.string() }).optional(),
    friday: z.object({ open: z.string(), close: z.string() }).optional(),
    saturday: z.object({ open: z.string(), close: z.string() }).optional(),
    sunday: z.object({ open: z.string(), close: z.string() }).optional()
  })
});

// Validaciones de clientes
export const clientSchema = z.object({
  name: z.string().min(2, 'Nombre del cliente requerido'),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/, 'Teléfono inválido'),
  email: z.string().email('Email inválido').optional(),
  notes: z.string().max(500, 'Notas no pueden exceder 500 caracteres').optional()
});

// Validaciones de webhooks
export const twilioWebhookSchema = z.object({
  From: z.string(),
  To: z.string(),
  Body: z.string(),
  MessageType: z.string().optional()
});

export const retellWebhookSchema = z.object({
  event: z.string(),
  call_id: z.string(),
  agent_id: z.string(),
  data: z.record(z.any()).optional()
});

// Validaciones de configuración
export const configSchema = z.object({
  restaurantId: z.string().min(1, 'ID del restaurante requerido'),
  twilioNumber: z.string().optional(),
  retellAgentId: z.string().optional(),
  airtableBaseId: z.string().optional(),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(true),
  autoConfirmReservations: z.boolean().default(false)
});

// Helper para validar datos
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(`Validation error: ${result.error.issues.map(i => i.message).join(', ')}`);
  }
  return result.data;
};

// Types derivados de los schemas
export type LoginData = z.infer<typeof loginSchema>;
export type ChangePasswordData = z.infer<typeof changePasswordSchema>;
export type ReservationData = z.infer<typeof reservationSchema>;
export type UpdateReservationData = z.infer<typeof updateReservationSchema>;
export type TableData = z.infer<typeof tableSchema>;
export type UpdateTableStatusData = z.infer<typeof updateTableStatusSchema>;
export type RestaurantData = z.infer<typeof restaurantSchema>;
export type ClientData = z.infer<typeof clientSchema>;
export type TwilioWebhookData = z.infer<typeof twilioWebhookSchema>;
export type RetellWebhookData = z.infer<typeof retellWebhookSchema>;
export type ConfigData = z.infer<typeof configSchema>;
