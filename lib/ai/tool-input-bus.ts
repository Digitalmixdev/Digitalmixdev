/**
 * Privacy-First Tool Input Bus
 * Enables explicit opt-in sharing of current tool input to the AI Assistant
 * without storing or exposing user data without permission.
 */

type InputGetter = () => string

const registeredGetters = new Map<string, InputGetter>()

export function registerToolInputGetter(toolSlug: string, getter: InputGetter): () => void {
  registeredGetters.set(toolSlug, getter)
  return () => {
    if (registeredGetters.get(toolSlug) === getter) {
      registeredGetters.delete(toolSlug)
    }
  }
}

export function getRegisteredToolInput(toolSlug?: string): string {
  if (typeof window === 'undefined') return ''

  // 1. Try explicitly registered getter
  if (toolSlug && registeredGetters.has(toolSlug)) {
    try {
      const getter = registeredGetters.get(toolSlug)
      if (getter) {
        const val = getter()
        if (typeof val === 'string' && val.trim().length > 0) {
          return val.trim()
        }
      }
    } catch {
      // ignore
    }
  }

  // Check any active registered getter
  for (const [, getter] of registeredGetters.entries()) {
    try {
      const val = getter()
      if (typeof val === 'string' && val.trim().length > 0) {
        return val.trim()
      }
    } catch {
      // ignore
    }
  }

  // 2. Fallback: inspect primary code/input textarea in the current tool view
  try {
    const textareas = Array.from(document.querySelectorAll('textarea'))
    for (const ta of textareas) {
      if (ta.value && ta.value.trim().length > 0 && !ta.classList.contains('ai-chat-input')) {
        return ta.value.trim()
      }
    }
  } catch {
    // ignore
  }

  return ''
}
