'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AccordionContextValue {
  openItems: string[]
  toggleItem: (value: string) => void
}

const AccordionContext = React.createContext<AccordionContextValue | undefined>(undefined)

const AccordionItemContext = React.createContext<{ value: string; isOpen: boolean } | undefined>(undefined)

interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple'
  collapsible?: boolean
  value?: string | string[]
  defaultValue?: string | string[]
  onValueChange?: (value: string | string[]) => void
}

function Accordion({
  type = 'single',
  collapsible = true,
  value: controlledValue,
  defaultValue,
  onValueChange,
  className,
  children,
  ...props
}: AccordionProps) {
  const getInitialOpen = (): string[] => {
    if (defaultValue) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue]
    }
    return []
  }

  const [uncontrolledOpen, setUncontrolledOpen] = React.useState<string[]>(getInitialOpen)
  const isControlled = controlledValue !== undefined

  const openItems = isControlled
    ? Array.isArray(controlledValue)
      ? controlledValue
      : controlledValue
        ? [controlledValue]
        : []
    : uncontrolledOpen

  const toggleItem = React.useCallback(
    (itemValue: string) => {
      let nextItems: string[]
      const isAlreadyOpen = openItems.includes(itemValue)

      if (type === 'single') {
        if (isAlreadyOpen) {
          nextItems = collapsible ? [] : [itemValue]
        } else {
          nextItems = [itemValue]
        }
      } else {
        if (isAlreadyOpen) {
          nextItems = openItems.filter((i) => i !== itemValue)
        } else {
          nextItems = [...openItems, itemValue]
        }
      }

      if (!isControlled) {
        setUncontrolledOpen(nextItems)
      }
      onValueChange?.(type === 'single' ? nextItems[0] || '' : nextItems)
    },
    [openItems, type, collapsible, isControlled, onValueChange],
  )

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem }}>
      <div data-slot="accordion" className={cn('w-full space-y-3', className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
}

interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

function AccordionItem({ value, className, children, ...props }: AccordionItemProps) {
  const context = React.useContext(AccordionContext)
  const isOpen = context ? context.openItems.includes(value) : false

  return (
    <AccordionItemContext.Provider value={{ value, isOpen }}>
      <div
        data-slot="accordion-item"
        data-state={isOpen ? 'open' : 'closed'}
        className={cn(
          'rounded-2xl border border-border/70 bg-card/60 overflow-hidden transition-colors hover:border-border duration-200',
          isOpen && 'bg-card border-primary/30 shadow-xs',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    </AccordionItemContext.Provider>
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const accordionContext = React.useContext(AccordionContext)
  const itemContext = React.useContext(AccordionItemContext)

  if (!accordionContext || !itemContext) {
    throw new Error('AccordionTrigger must be used inside AccordionItem')
  }

  const { isOpen, value } = itemContext

  return (
    <button
      type="button"
      aria-expanded={isOpen}
      data-state={isOpen ? 'open' : 'closed'}
      data-slot="accordion-trigger"
      onClick={() => accordionContext.toggleItem(value)}
      className={cn(
        'flex w-full items-center justify-between gap-4 p-5 text-left font-medium transition-all duration-200 outline-none hover:text-primary cursor-pointer select-none text-sm sm:text-base',
        className,
      )}
      {...props}
    >
      <span className="font-semibold text-foreground">{children}</span>
      <ChevronDown
        className={cn(
          'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-300 ease-out',
          isOpen && 'rotate-180 text-primary',
        )}
      />
    </button>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const itemContext = React.useContext(AccordionItemContext)
  if (!itemContext) {
    throw new Error('AccordionContent must be used inside AccordionItem')
  }

  const { isOpen } = itemContext

  return (
    <div
      data-state={isOpen ? 'open' : 'closed'}
      data-slot="accordion-content"
      className={cn(
        'grid transition-[grid-template-rows] duration-300 ease-out',
        isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
      )}
      {...props}
    >
      <div className="overflow-hidden">
        <div className={cn('px-5 pb-5 pt-0 text-xs sm:text-sm text-muted-foreground leading-relaxed', className)}>
          {children}
        </div>
      </div>
    </div>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
