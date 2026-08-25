'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Wrench, Eye, EyeOff, Loader2, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { loginAction } from '@/actions/auth'
import { useAuth } from '@/components/auth-provider'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const { setUser } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (!email || !password) {
      setErrorMessage('Please fill in all fields')
      return
    }

    setIsLoading(true)

    try {
      const result = await loginAction({ email, password })

      if (!result.success) {
        const errorText = result.error || 'Invalid email or password'
        setErrorMessage(errorText)
        toast.error('Authentication failed', { description: errorText })
        return
      }

      if (result.data?.user) {
        setUser(result.data.user)
      }

      toast.success('Welcome back!', { description: 'Signed in successfully.' })
      router.push(callbackUrl)
      router.refresh()
    } catch (err) {
      const errorMsg = 'An unexpected error occurred. Please try again.'
      setErrorMessage(errorMsg)
      toast.error('Error', { description: errorMsg })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <Button asChild variant="ghost" className="mb-3 gap-2 text-muted-foreground">
        <Link href="/"><ArrowLeft className="h-4 w-4" />Back to Home</Link>
      </Button>
      <Card className="w-full border-border/80 bg-card/95 shadow-2xl backdrop-blur-xl">
      <CardHeader className="space-y-3 text-center pb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
          <Wrench className="h-6 w-6 text-primary-foreground" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Enter your credentials to access your DigitalMix account
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
              {errorMessage}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-foreground">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className="bg-background/50 border-border focus-visible:ring-primary h-10"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                Password
              </Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
                className="bg-background/50 border-border focus-visible:ring-primary h-10 pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-all shadow-md shadow-primary/10 mt-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4 pt-2 border-t border-border/40 text-center text-sm text-muted-foreground">
        <div>
          Don&apos;t have an account?{' '}
          <Link
            href={callbackUrl !== '/dashboard' ? `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}` : '/signup'}
            className="font-semibold text-primary hover:underline"
          >
            Sign up for free
          </Link>
        </div>
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground/80">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>Secure HTTP-Only Session Auth</span>
        </div>
      </CardFooter>
      </Card>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-primary/10 blur-[120px] rounded-full pointer-events-none -z-10" />

      <Suspense fallback={
        <div className="w-full max-w-md h-100 rounded-xl bg-card/50 animate-pulse flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      }>
        <LoginForm />
      </Suspense>
    </div>
  )
}
