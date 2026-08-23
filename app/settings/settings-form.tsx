'use client'

import { useEffect, useState, useTransition, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, Loader2, Moon, Shield, Sun, Trash2, Upload, User as UserIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
  changePasswordAction,
  updatePreferencesAction,
  updateProfileAction,
} from '@/actions/settings'
import { PASSWORD_RULE_MESSAGE, isStrongPassword } from '@/lib/auth/password-rules'
import { useAuth } from '@/components/auth-provider'
import { useTheme } from '@/components/theme-provider'
import { UserAvatar } from '@/components/user-avatar'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { SessionUser } from '@/lib/auth/jwt'

type ThemePreference = 'light' | 'dark' | 'system'

interface SettingsFormProps {
  user: SessionUser
}

export function SettingsForm({ user }: SettingsFormProps) {
  const router = useRouter()
  const { setUser } = useAuth()
  const { setTheme } = useTheme()
  const [isPending, startTransition] = useTransition()

  const [displayName, setDisplayName] = useState(user.name || '')
  const [avatarData, setAvatarData] = useState<string | null>(user.avatarData || null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [emailNotifications, setEmailNotifications] = useState(user.emailNotifications ?? true)
  const [themePreference, setThemePreference] = useState<ThemePreference>(
    user.themePreference === 'light' || user.themePreference === 'system' ? user.themePreference : 'dark',
  )

  useEffect(() => {
    setTheme(themePreference)
  }, [setTheme, themePreference])

  const isProfileDirty = displayName !== (user.name || '') || avatarData !== (user.avatarData || null)
  const isPreferencesDirty =
    emailNotifications !== (user.emailNotifications ?? true) ||
    themePreference !== (user.themePreference || 'dark')

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null
      if (result && result.length > 750_000) {
        toast.error('Avatar image is too large')
        return
      }

      setAvatarData(result)
      toast.success('Avatar preview updated')
    }
    reader.onerror = () => toast.error('Unable to preview that image')
    reader.readAsDataURL(file)
  }

  const handleProfileSave = () => {
    startTransition(async () => {
      const result = await updateProfileAction({ name: displayName, avatarData })

      if (!result.success || !result.data?.user) {
        toast.error(result.error || 'Unable to save profile')
        return
      }

      setUser(result.data.user)
      setDisplayName(result.data.user.name || '')
      setAvatarData(result.data.user.avatarData || null)
      toast.success('Profile updated')
      router.refresh()
    })
  }

  const handlePasswordSave = () => {
    if (!isStrongPassword(newPassword)) {
      toast.error(PASSWORD_RULE_MESSAGE)
      return
    }

    if (currentPassword === newPassword) {
      toast.error('New password must be different from your current password')
      return
    }

    startTransition(async () => {
      const result = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      })

      if (!result.success) {
        toast.error(result.error || 'Unable to change password')
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password changed')
    })
  }

  const handlePreferencesSave = () => {
    startTransition(async () => {
      const result = await updatePreferencesAction({ emailNotifications, themePreference })

      if (!result.success || !result.data?.user) {
        toast.error(result.error || 'Unable to save preferences')
        return
      }

      setUser(result.data.user)
      toast.success('Preferences saved')
      router.refresh()
    })
  }

  const handleCancel = () => {
    setDisplayName(user.name || '')
    setAvatarData(user.avatarData || null)
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setEmailNotifications(user.emailNotifications ?? true)
    setThemePreference(
      user.themePreference === 'light' || user.themePreference === 'system'
        ? user.themePreference
        : 'dark',
    )
  }

  return (
    <Tabs defaultValue="profile" className="space-y-6">
      <TabsList className="grid h-auto w-full grid-cols-3">
        <TabsTrigger value="profile" className="gap-2">
          <UserIcon className="h-4 w-4" />
          Profile
        </TabsTrigger>
        <TabsTrigger value="security" className="gap-2">
          <Shield className="h-4 w-4" />
          Security
        </TabsTrigger>
        <TabsTrigger value="preferences" className="gap-2">
          <Bell className="h-4 w-4" />
          Preferences
        </TabsTrigger>
      </TabsList>

      <TabsContent value="profile">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>Update the name shown across your DigitalMix account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <UserAvatar
                name={displayName}
                email={user.email}
                avatarData={avatarData}
                className="h-20 w-20 text-xl shrink-0"
              />

              <div className="space-y-2">
                <Label htmlFor="avatar">Avatar preview</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarChange} />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAvatarData(null)}
                    disabled={!avatarData || isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Your display name"
                maxLength={80}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending || !isProfileDirty}>
              Cancel
            </Button>
            <Button type="button" onClick={handleProfileSave} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Save Profile
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="security">
        <Card>
          <CardHeader>
            <CardTitle>Security</CardTitle>
            <CardDescription>Change your password with your current credentials.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                autoComplete="current-password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="Letters and numbers, 6+ characters"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-3">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button type="button" onClick={handlePasswordSave} disabled={isPending}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />}
              Change Password
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="preferences">
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Choose how DigitalMix looks and when it can contact you.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label>Theme</Label>
                <p className="mt-1 text-sm text-muted-foreground">Switch between light and dark mode.</p>
              </div>
              <div className="inline-flex rounded-xl border border-border bg-muted/60 p-1">
                <Button
                  type="button"
                  variant={themePreference === 'light' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setThemePreference('light')}
                  aria-pressed={themePreference === 'light'}
                >
                  <Sun className="h-4 w-4" />
                  Light
                </Button>
                <Button
                  type="button"
                  variant={themePreference === 'dark' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setThemePreference('dark')}
                  aria-pressed={themePreference === 'dark'}
                >
                  <Moon className="h-4 w-4" />
                  Dark
                </Button>
              </div>
            </div>

            <label className="flex cursor-pointer flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-semibold text-foreground">Email notifications</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  Receive account and product updates by email.
                </p>
              </div>
              <span className="relative inline-flex h-7 w-12 shrink-0 items-center rounded-full bg-muted transition-colors has-[:checked]:bg-primary">
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={(event) => setEmailNotifications(event.target.checked)}
                  className="peer sr-only"
                />
                <span className="ml-1 h-5 w-5 rounded-full bg-background shadow transition-transform peer-checked:translate-x-5" />
              </span>
            </label>
          </CardContent>
          <CardFooter className="justify-end">
            <Button type="button" onClick={handlePreferencesSave} disabled={isPending || !isPreferencesDirty}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save Preferences
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
