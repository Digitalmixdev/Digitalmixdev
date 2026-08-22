'use client'

import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface DropdownContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const DropdownContext = React.createContext<DropdownContextValue | undefined>(undefined)

function useDropdown() {
  const context = React.useContext(DropdownContext)
  if (!context) {
    throw new Error('DropdownMenu components must be used within a <DropdownMenu>')
  }
  return context
}

interface DropdownMenuProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function DropdownMenu({
  open: controlledOpen,
  onOpenChange,
  children,
}: DropdownMenuProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen

  const setOpen = React.useCallback(
    (newOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(newOpen)
      }
      onOpenChange?.(newOpen)
    },
    [isControlled, onOpenChange],
  )

  return (
    <DropdownContext.Provider value={{ open, setOpen, triggerRef }}>
      <div className="relative inline-block text-left" data-slot="dropdown-menu">
        {children}
      </div>
    </DropdownContext.Provider>
  )
}

function DropdownMenuTrigger({
  children,
  asChild,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  const { open, setOpen, triggerRef } = useDropdown()

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    props.onClick?.(e)
    if (!e.defaultPrevented) {
      setOpen(!open)
    }
  }

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      ref: triggerRef,
      onClick: handleClick,
      'aria-expanded': open,
      'aria-haspopup': 'menu',
      className: cn((children.props as any).className, className),
    } as any)
  }

  return (
    <button
      ref={triggerRef}
      type="button"
      aria-expanded={open}
      aria-haspopup="menu"
      data-slot="dropdown-menu-trigger"
      onClick={handleClick}
      className={className}
      {...props}
    >
      {children}
    </button>
  )
}

interface DropdownMenuContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end'
  sideOffset?: number
}

function DropdownMenuContent({
  align = 'start',
  sideOffset = 6,
  className,
  children,
  ...props
}: DropdownMenuContentProps) {
  const { open, setOpen, triggerRef } = useDropdown()
  const menuRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (!open) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, setOpen, triggerRef])

  if (!open) return null

  const alignStyles = {
    start: 'left-0 origin-top-left',
    center: 'left-1/2 -translate-x-1/2 origin-top',
    end: 'right-0 origin-top-right',
  }[align]

  return (
    <div
      ref={menuRef}
      role="menu"
      data-slot="dropdown-menu-content"
      style={{ marginTop: sideOffset }}
      className={cn(
        'absolute z-50 min-w-48 rounded-xl border border-border/80 bg-popover/95 p-1.5 text-popover-foreground shadow-xl backdrop-blur-xl animate-in fade-in-0 zoom-in-95 duration-150 outline-none',
        alignStyles,
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface DropdownMenuItemProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean
  disabled?: boolean
}

function DropdownMenuItem({
  children,
  asChild,
  disabled,
  className,
  onClick,
  ...props
}: DropdownMenuItemProps) {
  const { setOpen } = useDropdown()

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled) {
      e.preventDefault()
      return
    }
    onClick?.(e)
    if (!e.defaultPrevented) {
      setOpen(false)
    }
  }

  const baseStyles = cn(
    'relative flex cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-medium outline-none transition-colors hover:bg-secondary hover:text-foreground focus:bg-secondary focus:text-foreground active:bg-secondary/80 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
    disabled && 'pointer-events-none opacity-50',
    className,
  )

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      role: 'menuitem',
      onClick: (e: React.MouseEvent<HTMLDivElement>) => {
        (children.props as any).onClick?.(e)
        handleClick(e)
      },
      className: cn((children.props as any).className, baseStyles),
    } as any)
  }

  return (
    <div
      role="menuitem"
      data-slot="dropdown-menu-item"
      onClick={handleClick}
      className={baseStyles}
      {...props}
    >
      {children}
    </div>
  )
}

function DropdownMenuLabel({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dropdown-menu-label"
      className={cn('px-2.5 py-1.5 text-xs font-semibold text-muted-foreground', className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="dropdown-menu-separator"
      className={cn('-mx-1 my-1 h-px bg-border/60', className)}
      {...props}
    />
  )
}

function DropdownMenuGroup({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="dropdown-menu-group" className={className} {...props} />
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
}
