'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import type { SessionUser } from '@/lib/auth/jwt'
import { getSessionAction, logoutAction } from '@/actions/auth'

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
  const [user, setUser] = useState<SessionUser | null>(initialUser)
  const [isLoading, setIsLoading] = useState(!initialUser)
  const router = useRouter()

  const refreshSession = useCallback(async () => {
    try {
      const currentUser = await getSessionAction()
      setUser(currentUser)
    } catch {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialUser) {
      refreshSession()
    } else {
      setIsLoading(false)
    }
  }, [initialUser, refreshSession])

  const logout = useCallback(async () => {
    try {
      await logoutAction()
      setUser(null)
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }, [router])

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
