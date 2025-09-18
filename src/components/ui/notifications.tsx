'use client'

import { useState, useEffect } from 'react'
import { X, Bell, Check, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { Badge } from './badge'
import { useNotifications } from '@/stores/uiStore'

// Tipos de notificaciones
export type NotificationType = 'info' | 'success' | 'warning' | 'error'

export interface NotificationAction {
  label: string
  action: () => void
  variant?: 'default' | 'destructive' | 'outline'
}

export interface NotificationData {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  actions?: NotificationAction[]
  autoClose?: boolean
  duration?: number
}

// Componente de notificación individual
interface NotificationItemProps {
  notification: NotificationData
  onClose: (id: string) => void
  onMarkAsRead: (id: string) => void
  compact?: boolean
}

export function NotificationItem({ 
  notification, 
  onClose, 
  onMarkAsRead, 
  compact = false 
}: NotificationItemProps) {
  const [isVisible, setIsVisible] = useState(true)

  // Auto-close para notificaciones temporales
  useEffect(() => {
    if (notification.autoClose !== false) {
      const duration = notification.duration || 5000
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose(notification.id), 300) // Esperar animación
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [notification, onClose])

  const getIcon = () => {
    const iconProps = { className: 'h-5 w-5' }
    
    switch (notification.type) {
      case 'success':
        return <Check {...iconProps} className="h-5 w-5 text-green-500" />
      case 'error':
        return <AlertCircle {...iconProps} className="h-5 w-5 text-red-500" />
      case 'warning':
        return <AlertTriangle {...iconProps} className="h-5 w-5 text-yellow-500" />
      case 'info':
      default:
        return <Info {...iconProps} className="h-5 w-5 text-blue-500" />
    }
  }

  const getBackgroundColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
    }
  }

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => onClose(notification.id), 300)
  }

  const handleMarkAsRead = () => {
    if (!notification.read) {
      onMarkAsRead(notification.id)
    }
  }

  return (
    <div
      className={cn(
        'rounded-lg border p-4 shadow-sm transition-all duration-300 ease-in-out',
        getBackgroundColor(),
        isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
        !notification.read && 'ring-2 ring-primary/20',
        compact && 'p-3'
      )}
      onClick={handleMarkAsRead}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={cn(
                'font-medium',
                compact ? 'text-sm' : 'text-base'
              )}>
                {notification.title}
                {!notification.read && (
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Nuevo
                  </Badge>
                )}
              </h4>
              
              <p className={cn(
                'text-muted-foreground mt-1',
                compact ? 'text-xs' : 'text-sm'
              )}>
                {notification.message}
              </p>
              
              {!compact && (
                <p className="text-xs text-muted-foreground mt-2">
                  {notification.timestamp.toLocaleString()}
                </p>
              )}
            </div>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 -mt-1"
              onClick={(e) => {
                e.stopPropagation()
                handleClose()
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {notification.actions && notification.actions.length > 0 && (
            <div className="flex space-x-2 mt-3">
              {notification.actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'outline'}
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    action.action()
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Contenedor de notificaciones (Toast)
export function NotificationContainer() {
  const { notifications, remove, markAsRead } = useNotifications()
  
  // Solo mostrar las últimas 5 notificaciones no leídas
  const visibleNotifications = notifications
    .filter(n => !n.read)
    .slice(0, 5)

  if (visibleNotifications.length === 0) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-sm space-y-2">
      {visibleNotifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={remove}
          onMarkAsRead={markAsRead}
          compact
        />
      ))}
    </div>
  )
}

// Panel de notificaciones
interface NotificationsPanelProps {
  className?: string
}

export function NotificationsPanel({ className }: NotificationsPanelProps) {
  const { notifications, remove, markAsRead, clear, unreadCount } = useNotifications()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') {
      return !notification.read
    }
    return true
  }).slice(0, 50) // Limitar a 50 notificaciones

  const handleMarkAllAsRead = () => {
    notifications.forEach(notification => {
      if (!notification.read) {
        markAsRead(notification.id)
      }
    })
  }

  return (
    <div className={cn('bg-background border rounded-lg shadow-lg', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <h3 className="font-semibold">Notificaciones</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary">{unreadCount}</Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter(filter === 'all' ? 'unread' : 'all')}
            >
              {filter === 'all' ? 'Solo no leídas' : 'Todas'}
            </Button>
            
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
              >
                Marcar todas como leídas
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={clear}
            >
              Limpiar
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="max-h-96 overflow-y-auto">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay notificaciones</p>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClose={remove}
                onMarkAsRead={markAsRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// Hook para crear notificaciones fácilmente
export const useCreateNotification = () => {
  const { addNotification } = useNotifications()

  const createNotification = (
    type: NotificationType,
    title: string,
    message: string,
    options?: {
      actions?: NotificationAction[]
      autoClose?: boolean
      duration?: number
    }
  ) => {
    addNotification({
      type,
      title,
      message,
      actions: options?.actions,
      autoClose: options?.autoClose,
      duration: options?.duration
    })
  }

  return {
    success: (title: string, message: string, options?: any) => 
      createNotification('success', title, message, options),
    error: (title: string, message: string, options?: any) => 
      createNotification('error', title, message, options),
    warning: (title: string, message: string, options?: any) => 
      createNotification('warning', title, message, options),
    info: (title: string, message: string, options?: any) => 
      createNotification('info', title, message, options),
  }
}

// Notificación de reserva específica
export const useReservationNotifications = () => {
  const { success, info, warning } = useCreateNotification()

  return {
    reservationCreated: (clientName: string, date: string, time: string) => {
      success(
        'Nueva reserva creada',
        `Reserva para ${clientName} el ${date} a las ${time}`,
        { duration: 7000 }
      )
    },
    
    reservationCancelled: (clientName: string) => {
      warning(
        'Reserva cancelada',
        `La reserva de ${clientName} ha sido cancelada`,
        { duration: 5000 }
      )
    },
    
    reservationReminder: (clientName: string, time: string) => {
      info(
        'Recordatorio de reserva',
        `${clientName} tiene una reserva a las ${time}`,
        { 
          autoClose: false,
          actions: [
            {
              label: 'Ver detalles',
              action: () => {
                // Navegar a detalles de reserva
              }
            }
          ]
        }
      )
    }
  }
}
