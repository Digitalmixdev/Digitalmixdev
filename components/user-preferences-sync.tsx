'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/auth-provider'
import { useTheme } from '@/components/theme-provider'

export function UserPreferencesSync() {
  const { user } = useAuth()
  const { setTheme } = useTheme()

  useEffect(() => {
    const themePreference = user?.themePreference
    if (
      themePreference === 'light' ||
      themePreference === 'dark' ||
      themePreference === 'system'
    ) {
      setTheme(themePreference)
    }
  }, [setTheme, user?.themePreference])

  return null
}
