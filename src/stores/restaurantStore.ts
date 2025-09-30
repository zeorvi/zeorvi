import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { logger } from '@/lib/logger'

interface Restaurant {
  id: string
  name: string
  email: string
  phone: string
  address: string
  type: 'restaurante' | 'bar' | 'cafeteria' | 'fast_food' | 'fine_dining'
  capacity: number
  isActive: boolean
  config?: {
    twilioNumber?: string
    retellAgentId?: string
    airtableBaseId?: string
    emailNotifications: boolean
    smsNotifications: boolean
    autoConfirmReservations: boolean
  }
  openingHours?: {
    [key: string]: { open: string; close: string } | undefined
  }
}

interface RestaurantState {
  // Estado
  currentRestaurant: Restaurant | null
  restaurants: Restaurant[]
  loading: boolean
  
  // Acciones
  setCurrentRestaurant: (restaurant: Restaurant | null) => void
  setRestaurants: (restaurants: Restaurant[]) => void
  addRestaurant: (restaurant: Restaurant) => void
  updateRestaurant: (id: string, updates: Partial<Restaurant>) => void
  removeRestaurant: (id: string) => void
  setLoading: (loading: boolean) => void
  
  // Getters computados
  isOpen: (restaurant?: Restaurant) => boolean
  getCurrentHours: (restaurant?: Restaurant) => { open: string; close: string } | null
}

export const useRestaurantStore = create<RestaurantState>()(
  persist(
    (set, get) => ({
      // Estado inicial
      currentRestaurant: null,
      restaurants: [],
      loading: false,

      // Getters computados
      isOpen: (restaurant) => {
        const rest = restaurant || get().currentRestaurant
        if (!rest?.openingHours) return true // Asumimos abierto si no hay horarios

        const now = new Date()
        const today = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof rest.openingHours
        const currentTime = now.toTimeString().slice(0, 5) // HH:MM

        const hours = rest.openingHours[today]
        if (!hours) return false

        return currentTime >= hours.open && currentTime <= hours.close
      },

      getCurrentHours: (restaurant) => {
        const rest = restaurant || get().currentRestaurant
        if (!rest?.openingHours) return null

        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase() as keyof typeof rest.openingHours
        return rest.openingHours[today] || null
      },

      // Acciones
      setCurrentRestaurant: (restaurant) => {
        set({ currentRestaurant: restaurant })
        
        if (restaurant) {
          logger.info('Current restaurant set', { 
            restaurantId: restaurant.id, 
            name: restaurant.name 
          })
        }
      },

      setRestaurants: (restaurants) => {
        set({ restaurants })
        
        logger.info('Restaurants list updated', { count: restaurants.length })
      },

      addRestaurant: (restaurant) => {
        set((state) => ({
          restaurants: [...state.restaurants, restaurant]
        }))
        
        logger.info('Restaurant added', { 
          restaurantId: restaurant.id, 
          name: restaurant.name 
        })
      },

      updateRestaurant: (id, updates) => {
        set((state) => ({
          restaurants: state.restaurants.map(restaurant =>
            restaurant.id === id ? { ...restaurant, ...updates } : restaurant
          ),
          currentRestaurant: state.currentRestaurant?.id === id
            ? { ...state.currentRestaurant, ...updates }
            : state.currentRestaurant
        }))
        
        logger.info('Restaurant updated', { 
          restaurantId: id, 
          updatedFields: Object.keys(updates) 
        })
      },

      removeRestaurant: (id) => {
        set((state) => ({
          restaurants: state.restaurants.filter(restaurant => restaurant.id !== id),
          currentRestaurant: state.currentRestaurant?.id === id 
            ? null 
            : state.currentRestaurant
        }))
        
        logger.info('Restaurant removed', { restaurantId: id })
      },

      setLoading: (loading) => {
        set({ loading })
      },
    }),
    {
      name: 'restaurant-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        // Solo persistir el restaurante actual para UX
        currentRestaurant: state.currentRestaurant,
      }),
    }
  )
)
