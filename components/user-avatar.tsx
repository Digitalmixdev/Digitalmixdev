import { cn } from '@/lib/utils'

interface UserAvatarProps {
  name?: string | null
  email?: string | null
  avatarData?: string | null
  className?: string
  imageClassName?: string
}

export function getUserInitials(name?: string | null, email?: string | null) {
  if (name?.trim()) {
    return name
      .trim()
      .split(' ')
      .filter(Boolean)
      .map((part) => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return email ? email.slice(0, 2).toUpperCase() : 'DM'
}

export function UserAvatar({
  name,
  email,
  avatarData,
  className,
  imageClassName,
}: UserAvatarProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold tracking-wider shadow-xs select-none',
        className,
      )}
    >
      {avatarData ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarData}
          alt=""
          className={cn('h-full w-full object-cover', imageClassName)}
        />
      ) : (
        getUserInitials(name, email)
      )}
    </div>
  )
}
