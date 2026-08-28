'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { translations, type Language } from './translations'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
  t: (key: string, defaultText?: string) => string
  dir: 'ltr' | 'rtl'
  isRTL: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const STORAGE_KEY = 'digitalmix-language'

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // Default to English ('en') as requested, but restore user preference if saved
  const [language, setLanguageState] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  const applyLanguageToDom = useCallback((lang: Language) => {
    if (typeof document === 'undefined') return
    const isArabic = lang === 'ar'
    document.documentElement.lang = lang
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr'
    if (isArabic) {
      document.documentElement.classList.add('rtl-mode')
    } else {
      document.documentElement.classList.remove('rtl-mode')
    }
  }, [])

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem(STORAGE_KEY) as Language | null
      if (savedLang === 'ar' || savedLang === 'en') {
        setLanguageState(savedLang)
        applyLanguageToDom(savedLang)
      } else {
        applyLanguageToDom('en')
      }
    } catch {
      applyLanguageToDom('en')
    }
    setMounted(true)
  }, [applyLanguageToDom])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // ignore
    }
    applyLanguageToDom(lang)
  }, [applyLanguageToDom])

  const toggleLanguage = useCallback(() => {
    const nextLang: Language = language === 'en' ? 'ar' : 'en'
    setLanguage(nextLang)
  }, [language, setLanguage])

  const t = useCallback((key: string, defaultText?: string): string => {
    const langDict = translations[language] || translations.en
    if (langDict && langDict[key]) {
      return langDict[key]
    }
    // fallback to English
    if (translations.en[key]) {
      return translations.en[key]
    }
    return defaultText || key
  }, [language])

  const isRTL = language === 'ar'
  const dir: 'ltr' | 'rtl' = isRTL ? 'rtl' : 'ltr'

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t,
        dir,
        isRTL,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
