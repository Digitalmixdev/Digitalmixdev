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

