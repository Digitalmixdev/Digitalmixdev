'use client'

import React, { useState } from 'react'
import { Sparkles, MessageSquare, X } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/context'

interface FloatingAiButtonProps {
  isOpen: boolean
  onClick: () => void
  unreadCount?: number
  hasToolContext?: boolean
  toolName?: string
}

export function FloatingAiButton({
  isOpen,
  onClick,
  hasToolContext,
  toolName,
}: FloatingAiButtonProps) {
  const { t, isRTL } = useLanguage()
  const [isHovered, setIsHovered] = useState(false)

  const tooltipText = t('ai.ask_button_tooltip', 'Ask DigitalMix AI')

  return (
    <div
      className={`fixed bottom-5 ${
        isRTL ? 'left-5' : 'right-5'
      } z-50 flex items-center gap-2 group print:hidden`}
    >
      {/* Tooltip on hover (desktop) */}
      {!isOpen && (
        <div
          className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900/90 text-slate-100 dark:bg-slate-800/95 dark:text-slate-200 border border-slate-700/60 dark:border-slate-700 shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-200 pointer-events-none ${
            isHovered
              ? 'opacity-100 translate-x-0'
              : 'opacity-0 translate-x-2'
          }`}
          role="tooltip"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
          <span>{hasToolContext && toolName ? `${tooltipText} (${toolName})` : tooltipText}</span>
        </div>
      )}

      {/* Floating Button */}
      <button
        id="digitalmix-ai-trigger-btn"
        type="button"
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={isOpen ? t('ai.close', 'Close') : tooltipText}
        aria-expanded={isOpen}
        aria-controls="digitalmix-ai-chat-panel"
        className={`relative flex items-center justify-center w-12 h-12 md:w-13 md:h-13 rounded-full transition-all duration-200 shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-background active:scale-95 ${
          isOpen
            ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700 shadow-slate-950/40'
            : 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white hover:from-blue-500 hover:to-indigo-400 shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105'
        }`}
      >
        {/* Subtle Ambient Pulse Ring when closed */}
        {!isOpen && (
          <span className="absolute -inset-0.5 rounded-full bg-blue-500/30 blur-sm animate-pulse -z-10" />
        )}

        {isOpen ? (
          <X className="w-5 h-5 transition-transform duration-200 rotate-0 hover:rotate-90" />
        ) : (
          <div className="relative flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
            {hasToolContext && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 border-2 border-blue-600 rounded-full" />
            )}
          </div>
        )}
      </button>
    </div>
  )
}
