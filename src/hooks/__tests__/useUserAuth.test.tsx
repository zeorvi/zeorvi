import { renderHook, act, waitFor } from '@testing-library/react'
import { useUserAuth } from '../useUserAuth'
import { auth } from '@/lib/firebase'
import { getUserByEmail, getUserByUsername } from '@/lib/userMapping'

// Mock Firebase auth
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
}))

// Mock user mapping
jest.mock('@/lib/userMapping', () => ({
  getUserByEmail: jest.fn(),
  getUserByUsername: jest.fn(),
}))

const mockAuth = auth as jest.Mocked<typeof auth>
const mockGetUserByEmail = getUserByEmail as jest.MockedFunction<typeof getUserByEmail>
const mockGetUserByUsername = getUserByUsername as jest.MockedFunction<typeof getUserByUsername>

describe('useUserAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with loading state', () => {
    const mockUnsubscribe = jest.fn()
    // Mock onAuthStateChanged to not call the callback immediately
    ;(mockAuth as any).onAuthStateChanged = jest.fn(() => mockUnsubscribe)

    const { result } = renderHook(() => useUserAuth())

    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBe(null)
    expect(result.current.userMapping).toBe(null)
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should handle successful authentication', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      metadata: {
        creationTime: '2023-01-01',
        lastSignInTime: '2023-01-02'
      }
    }

    const mockUserMapping = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'restaurant' as const,
      restaurantId: 'rest_123',
      restaurantName: 'Test Restaurant'
    }

    let authCallback: (user: any) => void = () => {}
    const mockUnsubscribe = jest.fn()
    
    ;(mockAuth as any).onAuthStateChanged = jest.fn((callback) => {
      authCallback = callback
      return mockUnsubscribe
    })

    mockGetUserByEmail.mockReturnValue(mockUserMapping)

    const { result } = renderHook(() => useUserAuth())

    // Simulate auth state change
    act(() => {
      authCallback(mockUser)
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.userMapping).toEqual(mockUserMapping)
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.isRestaurant).toBe(true)
    expect(result.current.isAdmin).toBe(false)
  })

  it('should handle admin user', async () => {
    const mockUser = {
      uid: 'admin-uid',
      email: 'admin@example.com',
      metadata: {
        creationTime: '2023-01-01',
        lastSignInTime: '2023-01-02'
      }
    }

    const mockAdminMapping = {
      id: '2',
      username: 'admin',
      email: 'admin@example.com',
      role: 'admin' as const
    }

    let authCallback: (user: any) => void = () => {}
    const mockUnsubscribe = jest.fn()
    
    ;(mockAuth as any).onAuthStateChanged = jest.fn((callback) => {
      authCallback = callback
      return mockUnsubscribe
    })

    mockGetUserByEmail.mockReturnValue(mockAdminMapping)

    const { result } = renderHook(() => useUserAuth())

    act(() => {
      authCallback(mockUser)
    })

    await waitFor(() => {
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isRestaurant).toBe(false)
    })
  })

  it('should handle login with username', async () => {
    const mockUserMapping = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      role: 'restaurant' as const,
      restaurantId: 'rest_123'
    }

    const mockUserCredential = {
      user: {
        uid: 'test-uid',
        email: 'test@example.com'
      }
    }

    mockGetUserByUsername.mockReturnValue(mockUserMapping)
    ;(mockAuth as any).signInWithEmailAndPassword = jest.fn().mockResolvedValue(mockUserCredential)

    const mockUnsubscribe = jest.fn()
    ;(mockAuth as any).onAuthStateChanged = jest.fn(() => mockUnsubscribe)

    const { result } = renderHook(() => useUserAuth())

    await act(async () => {
      const credential = await result.current.loginWithUsername('testuser', 'password123')
      expect(credential).toEqual(mockUserCredential)
    })

    expect(mockGetUserByUsername).toHaveBeenCalledWith('testuser')
    expect(mockAuth.signInWithEmailAndPassword).toHaveBeenCalledWith(
      mockAuth,
      'test@example.com',
      'password123'
    )
  })

  it('should handle login with invalid username', async () => {
    mockGetUserByUsername.mockReturnValue(null)

    const mockUnsubscribe = jest.fn()
    ;(mockAuth as any).onAuthStateChanged = jest.fn(() => mockUnsubscribe)

    const { result } = renderHook(() => useUserAuth())

    await expect(
      result.current.loginWithUsername('invaliduser', 'password123')
    ).rejects.toThrow('Usuario no encontrado')

    expect(mockAuth.signInWithEmailAndPassword).not.toHaveBeenCalled()
  })

  it('should handle logout', async () => {
    ;(mockAuth as any).signOut = jest.fn().mockResolvedValue(undefined)

    const mockUnsubscribe = jest.fn()
    ;(mockAuth as any).onAuthStateChanged = jest.fn(() => mockUnsubscribe)

    const { result } = renderHook(() => useUserAuth())

    await act(async () => {
      await result.current.logout()
    })

    expect(mockAuth.signOut).toHaveBeenCalled()
  })

  it('should handle logout error', async () => {
    const mockError = new Error('Logout failed')
    ;(mockAuth as any).signOut = jest.fn().mockRejectedValue(mockError)

    const mockUnsubscribe = jest.fn()
    ;(mockAuth as any).onAuthStateChanged = jest.fn(() => mockUnsubscribe)

    const { result } = renderHook(() => useUserAuth())

    await expect(result.current.logout()).rejects.toThrow('Logout failed')
  })

  it('should cleanup subscription on unmount', () => {
    const mockUnsubscribe = jest.fn()
    ;(mockAuth as any).onAuthStateChanged = jest.fn(() => mockUnsubscribe)

    const { unmount } = renderHook(() => useUserAuth())

    unmount()

    expect(mockUnsubscribe).toHaveBeenCalled()
  })
})
