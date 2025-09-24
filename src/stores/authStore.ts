import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { logger, logAuth } from '@/lib/logger'

interface UserMapping {
  id: string
  username: string
  email: string
  role: 'admin' | 'restaurant'
  restaurantId?: string
  restaurantName?: string
  isActive: boolean
  mustChangePassword: boolean
  profile?: {
    firstName?: string
    lastName?: string
    phone?: string
    avatar?: string
  }
}

interface AuthState {
  // Estado
  user: UserMapping | null
  isAuthenticated: boolean
  loading: boolean
  token: string | null
  
  // Acciones
  setUser: (user: UserMapping | null) => void
  setLoading: (loading: boolean) => void
  setToken: (token: string | null) => void
  login: (user: UserMapping, token: string) => void
  logout: () => void
  updateProfile: (profile: Partial<UserMapping['profile']>) => void
  
  // Getters computados
  isAdmin: boolean
  isRestaurant: boolean
  displayName: string
  needsPasswordChange: boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      loading: true,
      token: null,

      // Getters computados
      get isAdmin() {
        return get().user?.role === 'admin'
      },
      get isRestaurant() {
        return get().user?.role === 'restaurant'
      },
      get displayName() {
        const user = get().user
        if (user?.profile?.firstName && user?.profile?.lastName) {
          return `${user.profile.firstName} ${user.profile.lastName}`
        }
        return user?.restaurantName || user?.username || 'Usuario'
      },
      get needsPasswordChange() {
        return get().user?.mustChangePassword || false
      },

      // Acciones
      setUser: (user) => {
        set({ user, isAuthenticated: !!user })
        
        if (user) {
          logAuth('user_set', user.id, { email: user.email })
        }
      },

      setLoading: (loading) => {
        set({ loading })
      },

      setToken: (token) => {
        set({ token })
        
        // Guardar token en localStorage para middleware
        if (typeof window !== 'undefined') {
          if (token) {
            localStorage.setItem('auth-token', token)
            // También como cookie para el middleware
            document.cookie = `auth-token=${token}; path=/; max-age=${24 * 60 * 60}` // 24 horas
          } else {
            localStorage.removeItem('auth-token')
            document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
          }
        }
      },

      login: (user, token) => {
        set({
          user,
          isAuthenticated: true,
          loading: false,
          token
        })

        // Guardar token
        get().setToken(token)

        logAuth('login_success', user.id, {
          email: user.email,
          role: user.role,
          restaurantId: user.restaurantId
        })

        logger.info('User logged in successfully', {
          userId: user.id,
          role: user.role,
          restaurantId: user.restaurantId
        })
      },

      logout: () => {
        const currentUser = get().user
        
        set({
          user: null,
          isAuthenticated: false,
          loading: false,
          token: null
        })

        // Limpiar token
        get().setToken(null)

        if (currentUser) {
          logAuth('logout', currentUser.id)
          logger.info('User logged out', { userId: currentUser.id })
        }
      },

      updateProfile: (profile) => {
        const currentUser = get().user
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            profile: { ...currentUser.profile, ...profile }
          }
          
          set({ user: updatedUser })
          
          logger.info('User profile updated', {
            userId: currentUser.id,
            updatedFields: Object.keys(profile || {})
          })
        }
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Solo persistir datos seguros (no tokens sensibles)
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Configurar estado después de rehidratar
        if (state) {
          state.loading = false
          
          // Recuperar token del localStorage si existe
          if (typeof window !== 'undefined') {
            const token = localStorage.getItem('auth-token')
            if (token) {
              state.token = token
            }
          }
        }
      },
    }
  )
)
