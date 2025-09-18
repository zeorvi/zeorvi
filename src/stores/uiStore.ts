import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  message: string
  timestamp: Date
  read: boolean
  actions?: Array<{
    label: string
    action: () => void
  }>
}

interface LoadingState {
  [key: string]: boolean
}

interface UIState {
  // Estado de la UI
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'system'
  notifications: Notification[]
  loadingStates: LoadingState
  activeView: string
  activeSubView: string
  
  // Modales y dialogs
  modals: {
    [key: string]: boolean
  }
  
  // Acciones de UI
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  
  // Acciones de notificaciones
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void
  markNotificationAsRead: (id: string) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // Acciones de loading
  setLoading: (key: string, loading: boolean) => void
  isLoading: (key: string) => boolean
  
  // Acciones de vistas
  setActiveView: (view: string) => void
  setActiveSubView: (subView: string) => void
  
  // Acciones de modales
  openModal: (key: string) => void
  closeModal: (key: string) => void
  toggleModal: (key: string) => void
  isModalOpen: (key: string) => boolean
  
  // Getters computados
  unreadNotifications: number
  hasUnreadNotifications: boolean
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      sidebarCollapsed: false,
      theme: 'system',
      notifications: [],
      loadingStates: {},
      activeView: 'dashboard',
      activeSubView: 'plano-mesas',
      modals: {},

      // Getters computados
      get unreadNotifications() {
        return get().notifications.filter(n => !n.read).length
      },
      get hasUnreadNotifications() {
        return get().unreadNotifications > 0
      },

      // Acciones de UI
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed })
      },

      setTheme: (theme) => {
        set({ theme })
        
        // Aplicar tema inmediatamente
        if (typeof window !== 'undefined') {
          const root = window.document.documentElement
          
          if (theme === 'dark') {
            root.classList.add('dark')
          } else if (theme === 'light') {
            root.classList.remove('dark')
          } else {
            // Sistema
            const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            if (isDark) {
              root.classList.add('dark')
            } else {
              root.classList.remove('dark')
            }
          }
        }
      },

      // Acciones de notificaciones
      addNotification: (notification) => {
        const newNotification: Notification = {
          ...notification,
          id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          read: false
        }

        set((state) => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50) // Máximo 50 notificaciones
        }))
      },

      markNotificationAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map(notification =>
            notification.id === id ? { ...notification, read: true } : notification
          )
        }))
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter(notification => notification.id !== id)
        }))
      },

      clearNotifications: () => {
        set({ notifications: [] })
      },

      // Acciones de loading
      setLoading: (key, loading) => {
        set((state) => ({
          loadingStates: {
            ...state.loadingStates,
            [key]: loading
          }
        }))
      },

      isLoading: (key) => {
        return get().loadingStates[key] || false
      },

      // Acciones de vistas
      setActiveView: (view) => {
        set({ activeView: view })
      },

      setActiveSubView: (subView) => {
        set({ activeSubView: subView })
      },

      // Acciones de modales
      openModal: (key) => {
        set((state) => ({
          modals: { ...state.modals, [key]: true }
        }))
      },

      closeModal: (key) => {
        set((state) => ({
          modals: { ...state.modals, [key]: false }
        }))
      },

      toggleModal: (key) => {
        set((state) => ({
          modals: { ...state.modals, [key]: !state.modals[key] }
        }))
      },

      isModalOpen: (key) => {
        return get().modals[key] || false
      },
    }),
    {
      name: 'ui-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Persistir preferencias de UI
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        activeView: state.activeView,
        activeSubView: state.activeSubView,
        // No persistir notificaciones ni estados de loading
      }),
      onRehydrateStorage: () => (state) => {
        // Aplicar tema después de rehidratar
        if (state) {
          state.setTheme(state.theme)
        }
      },
    }
  )
)

// Helper hooks para casos comunes
export const useNotifications = () => {
  const notifications = useUIStore(state => state.notifications)
  const addNotification = useUIStore(state => state.addNotification)
  const markAsRead = useUIStore(state => state.markNotificationAsRead)
  const remove = useUIStore(state => state.removeNotification)
  const clear = useUIStore(state => state.clearNotifications)
  const unreadCount = useUIStore(state => state.unreadNotifications)
  
  return {
    notifications,
    addNotification,
    markAsRead,
    remove,
    clear,
    unreadCount
  }
}

export const useLoading = () => {
  const setLoading = useUIStore(state => state.setLoading)
  const isLoading = useUIStore(state => state.isLoading)
  
  return { setLoading, isLoading }
}

export const useModal = (key: string) => {
  const isOpen = useUIStore(state => state.isModalOpen(key))
  const open = useUIStore(state => state.openModal)
  const close = useUIStore(state => state.closeModal)
  const toggle = useUIStore(state => state.toggleModal)
  
  return {
    isOpen,
    open: () => open(key),
    close: () => close(key),
    toggle: () => toggle(key)
  }
}
