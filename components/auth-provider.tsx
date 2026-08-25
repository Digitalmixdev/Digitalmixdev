'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { SessionUser } from '@/lib/auth/jwt'
import { getSessionAction, logoutAction } from '@/actions/auth'

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
      } else {
        // Check localStorage fallback for iframe resilience
        try {
          const cached = localStorage.getItem(STORAGE_KEY)
          if (cached) {
            const parsed = JSON.parse(cached) as SessionUser
            if (parsed && parsed.id && parsed.email) {
              setUserState(parsed)
            }
          }
        } catch {
          // ignore
        }
      }
    } catch {
      try {
        const cached = localStorage.getItem(STORAGE_KEY)
        if (cached) {
          const parsed = JSON.parse(cached) as SessionUser
          if (parsed && parsed.id && parsed.email) {
            setUserState(parsed)
          }
        }
      } catch {
        setUserState(null)
      }
    } finally {
      setIsLoading(false)
    }
  }, [setUser])

  useEffect(() => {
    // Check initial cached user immediately on mount to prevent flash of unauthenticated state
    try {
      const cached = localStorage.getItem(STORAGE_KEY)
      if (cached && !initialUser) {
        const parsed = JSON.parse(cached) as SessionUser
        if (parsed && parsed.id) {
          setUserState(parsed)
        }
      }
    } catch {
      // ignore
    }

    refreshSession()
  }, [initialUser, refreshSession])

  const logout = useCallback(async () => {
    try {
      setUser(null)
      await logoutAction()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Failed to log out:', error)
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

