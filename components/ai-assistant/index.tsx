'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { usePathname } from 'next/navigation'
import { FloatingAiButton } from './floating-ai-button'
import { AiChatPanel } from './ai-chat-panel'
import { getToolKnowledge } from '@/lib/ai/tools-knowledge'

export function DigitalMixAiAssistant() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Identify current tool from active pathname
  const currentTool = useMemo(() => {
    if (!pathname) return undefined
    return getToolKnowledge(pathname)
  }, [pathname])

  // Handle ESC key to close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  if (!mounted) return null

  return (
    <>
      <FloatingAiButton
        isOpen={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        hasToolContext={Boolean(currentTool)}
        toolName={currentTool?.name}
      />
      <AiChatPanel
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        currentTool={currentTool}
      />
    </>
  )
}
