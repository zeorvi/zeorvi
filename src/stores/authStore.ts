import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { User } from 'firebase/auth'
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
  user: User | null
  userMapping: UserMapping | null
  isAuthenticated: boolean
  loading: boolean
  token: string | null
  
  // Acciones
  setUser: (user: User | null) => void
  setUserMapping: (mapping: UserMapping | null) => void
  setLoading: (loading: boolean) => void
  setToken: (token: string | null) => void
  login: (user: User, mapping: UserMapping, token: string) => void
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
      userMapping: null,
      isAuthenticated: false,
      loading: true,
      token: null,

      // Getters computados
      get isAdmin() {
        return get().userMapping?.role === 'admin'
      },
      get isRestaurant() {
        return get().userMapping?.role === 'restaurant'
      },
      get displayName() {
        const mapping = get().userMapping
        if (mapping?.profile?.firstName && mapping?.profile?.lastName) {
          return `${mapping.profile.firstName} ${mapping.profile.lastName}`
        }
        return mapping?.restaurantName || mapping?.username || 'Usuario'
      },
      get needsPasswordChange() {
        return get().userMapping?.mustChangePassword || false
      },

      // Acciones
      setUser: (user) => {
        set({ user, isAuthenticated: !!user })
        
        if (user) {
          logAuth('user_set', user.uid, { email: user.email })
        }
      },

      setUserMapping: (mapping) => {
        set({ userMapping: mapping })
        
        if (mapping) {
          logAuth('user_mapping_set', mapping.id, { 
            role: mapping.role, 
            restaurantId: mapping.restaurantId 
          })
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

      login: (user, mapping, token) => {
        set({
          user,
          userMapping: mapping,
          isAuthenticated: true,
          loading: false,
          token
        })

        // Guardar token
        get().setToken(token)

        logAuth('login_success', user.uid, {
          email: user.email,
          role: mapping.role,
          restaurantId: mapping.restaurantId
        })

        logger.info('User logged in successfully', {
          userId: user.uid,
          role: mapping.role,
          restaurantId: mapping.restaurantId
        })
      },

      logout: () => {
        const currentUser = get().user
        
        set({
          user: null,
          userMapping: null,
          isAuthenticated: false,
          loading: false,
          token: null
        })

        // Limpiar token
        get().setToken(null)

        if (currentUser) {
          logAuth('logout', currentUser.uid)
          logger.info('User logged out', { userId: currentUser.uid })
        }
      },

      updateProfile: (profile) => {
        const currentMapping = get().userMapping
        if (currentMapping) {
          const updatedMapping = {
            ...currentMapping,
            profile: { ...currentMapping.profile, ...profile }
          }
          
          set({ userMapping: updatedMapping })
          
          logger.info('User profile updated', {
            userId: currentMapping.id,
            updatedFields: Object.keys(profile)
          })
        }
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Solo persistir datos seguros (no tokens sensibles)
        userMapping: state.userMapping,
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
