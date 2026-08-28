'use client'

import { useEffect, useState, useTransition, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  Bell,
  Check,
  KeyRound,
  Loader2,
  Mail,
  Moon,
  Shield,
  Sun,
  Trash2,
  Upload,
  User as UserIcon,
  XCircle,
  Languages,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  changePasswordAction,
  confirmAccountDeletionAction,
  requestAccountDeletionCodeAction,
  updatePreferencesAction,
  updateProfileAction,
} from '@/actions/settings'
import { PASSWORD_RULE_MESSAGE, isStrongPassword } from '@/lib/auth/password-rules'
import { useAuth } from '@/components/auth-provider'
import { useTheme } from '@/components/theme-provider'
import { useLanguage } from '@/lib/i18n/context'
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
  const { language, setLanguage, t } = useLanguage()
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
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ar'>(language)

  // Account Deletion States
  const [deletionStep, setDeletionStep] = useState<'idle' | 'code-sent'>('idle')
  const [deletionCode, setDeletionCode] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    setTheme(themePreference)
  }, [setTheme, themePreference])

  useEffect(() => {
    setSelectedLanguage(language)
  }, [language])

  const handleLanguageChange = (newLang: 'en' | 'ar') => {
    setSelectedLanguage(newLang)
    setLanguage(newLang)
    toast.success(newLang === 'ar' ? 'تم تغيير اللغة إلى العربية' : 'Language set to English')
  }

  const isProfileDirty = displayName !== (user.name || '') || avatarData !== (user.avatarData || null)
  const isPreferencesDirty =
    emailNotifications !== (user.emailNotifications ?? true) ||
    themePreference !== (user.themePreference || 'dark') ||
    selectedLanguage !== language

  const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024 // 2MB

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please choose a valid image file (PNG, JPG, WEBP)')
      return
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error('Avatar image size must be less than 2MB', {
        description: `Selected file is ${(file.size / (1024 * 1024)).toFixed(2)} MB. Maximum allowed is 2 MB.`,
      })
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : null
      if (!result) {
        toast.error('Failed to read image data')
        return
      }

      setAvatarData(result)
      toast.success('Avatar preview loaded', {
        description: `File size: ${(file.size / 1024).toFixed(1)} KB (under 2MB limit)`,
      })
    }
    reader.onerror = () => toast.error('Unable to preview that image')
    reader.readAsDataURL(file)
  }

  const handleProfileSave = () => {
    startTransition(async () => {
      const result = await updateProfileAction({ name: displayName, avatarData })

      if (!result.success) {
        toast.error(result.error || 'Failed to update profile')
        return
      }

      if (result.data?.user) {
        setUser(result.data.user)
      }

      toast.success('Profile updated successfully')
      router.refresh()
    })
  }

  const handlePasswordSave = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please complete all password fields')
      return
    }

    if (!isStrongPassword(newPassword)) {
      toast.error('Password requirements not met', { description: PASSWORD_RULE_MESSAGE })
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    startTransition(async () => {
      const result = await changePasswordAction({
        currentPassword,
        newPassword,
        confirmPassword,
      })

      if (!result.success) {
        toast.error(result.error || 'Failed to update password')
        return
      }

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password updated successfully')
      router.refresh()
    })
  }

  const handlePreferencesSave = () => {
    startTransition(async () => {
      const result = await updatePreferencesAction({
        emailNotifications,
        themePreference,
      })

      if (!result.success) {
        toast.error(result.error || 'Failed to update preferences')
        return
      }

      if (result.data?.user) {
        setUser(result.data.user)
      }

      toast.success('Preferences updated successfully')
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
    setThemePreference(user.themePreference === 'light' || user.themePreference === 'system' ? user.themePreference : 'dark')
    setDeletionStep('idle')
    setDeletionCode('')
  }

  // Account Deletion Handlers
  const handleRequestDeletionCode = async () => {
    setIsDeleting(true)
    try {
      const result = await requestAccountDeletionCodeAction()
      if (!result.success) {
        toast.error('Failed to request deletion code', { description: result.error })
        return
      }

      setDeletionStep('code-sent')
      toast.success('Confirmation code sent to your email', {
        description: `Please check your inbox at ${user.email}`,
      })
    } catch {
      toast.error('An error occurred while requesting deletion code')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleConfirmDeletion = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!deletionCode || deletionCode.trim().length < 6) {
      toast.error('Please enter the 6-digit confirmation code')
      return
    }

    setIsDeleting(true)
    try {
      const result = await confirmAccountDeletionAction({ code: deletionCode.trim() })
      if (!result.success) {
        toast.error('Account deletion failed', { description: result.error })
        return
      }

      setUser(null)
      try {
        localStorage.removeItem('digitalmix_auth_user')
      } catch {
        // ignore
      }
      toast.success('Account permanently deleted', {
        description: 'All your data has been removed from our database.',
      })
      window.location.href = '/'
    } catch {
      toast.error('An error occurred during account deletion')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Tabs defaultValue="profile" className="w-full space-y-6">
      <TabsList className="grid w-full grid-cols-4 bg-muted/60 p-1">
        <TabsTrigger value="profile" className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          <span className="hidden sm:inline">{t('settings.tab_profile', 'Profile')}</span>
        </TabsTrigger>
        <TabsTrigger value="password" className="flex items-center gap-2">
          <Shield className="h-4 w-4" />
          <span className="hidden sm:inline">{t('settings.tab_security', 'Security')}</span>
        </TabsTrigger>
        <TabsTrigger value="preferences" className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">{t('settings.tab_preferences', 'Preferences')}</span>
        </TabsTrigger>
        <TabsTrigger value="danger" className="flex items-center gap-2 text-destructive data-[state=active]:text-destructive">
          <AlertTriangle className="h-4 w-4" />
          <span className="hidden sm:inline">{t('settings.tab_danger', 'Delete Account')}</span>
        </TabsTrigger>
      </TabsList>

      {/* PROFILE TAB */}
      <TabsContent value="profile">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>Update the name shown across your DigitalMix account.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center p-4 rounded-xl bg-secondary/20 border border-border/60">
              <div className="relative group shrink-0">
                <UserAvatar
                  name={displayName}
                  email={user.email}
                  avatarData={avatarData}
                  className="h-24 w-24 text-2xl shrink-0 ring-2 ring-primary/20 ring-offset-2 ring-offset-background transition-all"
                />
                {avatarData && (
                  <div className="absolute -bottom-1.5 -right-1.5 rounded-full bg-primary p-1 text-primary-foreground shadow-md">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>

              <div className="space-y-2.5 flex-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="avatar" className="font-semibold text-foreground">
                    Profile Picture Preview
                  </Label>
                  <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    Max size: &lt; 2 MB
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports JPG, PNG, WEBP, or GIF. File size must be less than <strong>2 MB</strong>.
                </p>
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    onChange={handleAvatarChange}
                    className="bg-background/80 border-border file:mr-3 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAvatarData(null)}
                    disabled={!avatarData || isPending}
                    className="shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-1.5" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={user.email} disabled className="bg-muted/40 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Your email address is managed directly via authentication.</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="display-name">Display name</Label>
              <Input
                id="display-name"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Alex Smith"
                autoComplete="name"
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-3 border-t border-border/40 pt-4">
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending || !isProfileDirty}>
              Cancel
            </Button>
            <Button type="button" onClick={handleProfileSave} disabled={isPending || !isProfileDirty}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Save Profile
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* SECURITY TAB */}
      <TabsContent value="password">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Change Password</CardTitle>
            <CardDescription>Keep your account secure with a strong password containing letters and numbers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
                placeholder="Min. 6 characters, letters + numbers"
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
          <CardFooter className="justify-end gap-3 border-t border-border/40 pt-4">
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

      {/* PREFERENCES TAB */}
      <TabsContent value="preferences">
        <Card className="border-border">
          <CardHeader>
            <CardTitle>{t('settings.tab_preferences', 'Preferences')}</CardTitle>
            <CardDescription>{t('settings.subtitle', 'Choose how DigitalMix looks and when it can contact you.')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Language Selector */}
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-primary" />
                  <Label className="font-semibold text-foreground">{t('settings.pref_language', 'Display Language')}</Label>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('settings.pref_language_desc', 'Choose your preferred interface language (English or Arabic).')}
                </p>
              </div>
              <div className="inline-flex rounded-xl border border-border bg-muted/60 p-1">
                <Button
                  type="button"
                  variant={selectedLanguage === 'en' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleLanguageChange('en')}
                  aria-pressed={selectedLanguage === 'en'}
                  className="rounded-lg text-xs font-semibold"
                >
                  English
                </Button>
                <Button
                  type="button"
                  variant={selectedLanguage === 'ar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleLanguageChange('ar')}
                  aria-pressed={selectedLanguage === 'ar'}
                  className="rounded-lg text-xs font-semibold"
                >
                  العربية
                </Button>
              </div>
            </div>

            {/* Theme Selector */}
            <div className="flex flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Label className="font-semibold text-foreground">{t('settings.pref_theme', 'Theme Mode')}</Label>
                <p className="mt-1 text-sm text-muted-foreground">{t('settings.pref_theme_desc', 'Switch between light and dark mode.')}</p>
              </div>
              <div className="inline-flex rounded-xl border border-border bg-muted/60 p-1">
                <Button
                  type="button"
                  variant={themePreference === 'light' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setThemePreference('light')}
                  aria-pressed={themePreference === 'light'}
                  className="rounded-lg text-xs font-semibold"
                >
                  <Sun className="h-4 w-4 mr-1.5" />
                  {t('nav.light', 'Light')}
                </Button>
                <Button
                  type="button"
                  variant={themePreference === 'dark' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setThemePreference('dark')}
                  aria-pressed={themePreference === 'dark'}
                  className="rounded-lg text-xs font-semibold"
                >
                  <Moon className="h-4 w-4 mr-1.5" />
                  {t('nav.dark', 'Dark')}
                </Button>
              </div>
            </div>

            <label className="flex cursor-pointer flex-col gap-4 rounded-xl border border-border bg-background p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="text-xs font-semibold text-foreground">{t('settings.pref_notifications', 'Email notifications')}</span>
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('settings.pref_notifications_desc', 'Receive account and product updates by email.')}
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
          <CardFooter className="justify-end border-t border-border/40 pt-4">
            <Button type="button" onClick={handlePreferencesSave} disabled={isPending || !isPreferencesDirty}>
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {t('settings.save_preferences', 'Save Preferences')}
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      {/* DANGER ZONE: DELETE ACCOUNT */}
      <TabsContent value="danger">
        <Card className="border-destructive/30 bg-destructive/5">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              <CardTitle className="text-destructive">Delete Account</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Permanently delete your account, saved tools, custom configurations, and usage history from our database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-lg border border-destructive/20 bg-background/80 p-4 text-sm text-muted-foreground space-y-2">
              <p className="font-semibold text-foreground">⚠️ This action is permanent and cannot be undone:</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Your profile and login credentials will be removed.</li>
                <li>Your favorite tools list and workspace configurations will be deleted.</li>
                <li>To protect against accidental deletion, a 6-digit confirmation code must be verified.</li>
              </ul>
            </div>

            {deletionStep === 'idle' ? (
              <div className="pt-2">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleRequestDeletionCode}
                  disabled={isDeleting}
                  className="h-11 px-5 font-semibold shadow-sm"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending confirmation code...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Deletion Confirmation Code to {user.email}
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleConfirmDeletion} className="space-y-4 max-w-md">
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary shrink-0" />
                  <div>
                    A 6-digit confirmation code was sent to{' '}
                    <span className="font-semibold text-foreground">{user.email}</span>. Please check your inbox.
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deletionCode" className="text-sm font-semibold text-foreground">
                    Enter 6-Digit Deletion Code
                  </Label>
                  <div className="relative">
                    <Input
                      id="deletionCode"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="123456"
                      value={deletionCode}
                      onChange={(e) => setDeletionCode(e.target.value.replace(/\D/g, ''))}
                      disabled={isDeleting}
                      required
                      className="bg-background border-destructive/40 focus-visible:ring-destructive h-12 text-center text-xl font-mono tracking-widest text-destructive"
                    />
                    <KeyRound className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground/60" />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <Button
                    type="submit"
                    variant="destructive"
                    disabled={isDeleting || deletionCode.length < 6}
                    className="h-11 flex-1 font-semibold"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting Account...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Permanently Delete Account
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDeletionStep('idle')
                      setDeletionCode('')
                    }}
                    disabled={isDeleting}
                    className="h-11"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
