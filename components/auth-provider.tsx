'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { SessionUser } from '@/lib/auth/jwt'
import { getSessionAction, logoutAction } from '@/actions/auth'
import { fetchUserHistoryAction } from '@/actions/history'
import { getLocalActivityHistory, syncHistoryWithServer } from '@/lib/history-service'

const STORAGE_KEY = 'digitalmix_auth_user'

interface AuthContextType {
  user: SessionUser | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: SessionUser | null) => void
  logout: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode
  initialUser?: SessionUser | null
}) {
  const [user, setUserState] = useState<SessionUser | null>(initialUser)
  const [isLoading, setIsLoading] = useState(!initialUser)
  const router = useRouter()

  const setUser = useCallback((newUser: SessionUser | null) => {
    setUserState(newUser)
    try {
      if (newUser) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // Ignore localStorage errors in private browsing
    }
  }, [])

  const refreshSession = useCallback(async () => {
    try {
      const currentUser = await getSessionAction()
      if (currentUser) {
        setUser(currentUser)
        // Background sync user activity history from PostgreSQL database to local device cache
        fetchUserHistoryAction(100)
          .then((serverItems) => {
            if (serverItems && Array.isArray(serverItems)) {
              syncHistoryWithServer(serverItems)
            }
          })
          .catch(() => {})
      } else {
        // Explicitly clear local state if server has no session (account deleted or logged out)
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [setUser])

  useEffect(() => {
    refreshSession()

    // Real-time cross-tab auth state synchronization
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || !e.key) {
        refreshSession()
      }
    }

    const handleFocus = () => {
      refreshSession()
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refreshSession])

  const logout = useCallback(async () => {
    try {
      setUser(null)
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
      await logoutAction()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Failed to log out:', error)
      setUser(null)
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        // ignore
      }
    }
  }, [router, setUser])

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        setUser,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

