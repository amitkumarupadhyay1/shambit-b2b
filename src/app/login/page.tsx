"use client"

import { useState, useRef, Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { signIn } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile"
import AuthPageShell from "@/components/auth/AuthPageShell"

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

type LoginFormValues = z.infer<typeof loginSchema>

function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const [turnstileToken, setTurnstileToken] = useState<string>("")
  const [turnstileStatus, setTurnstileStatus] = useState<'solved' | 'error' | 'expired' | 'loading'>('loading')
  const turnstileRef = useRef<TurnstileInstance>(null)

  const returnUrl = searchParams.get('returnUrl') || '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginFormValues) => {
    if (!turnstileToken) {
      setError("Please complete the security verification.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
        turnstile_token: turnstileToken,
      })

      if (result?.error) {
        if (!result.error.includes("429")) {
          turnstileRef.current?.reset()
          setTurnstileToken('')
          setTurnstileStatus('loading')
        }

        if (result.error.includes("403") || result.error.includes("AccessDenied")) {
          setError("Security verification failed. Please refresh and try again.")
        } else if (result.error.includes("429")) {
          setError("Too many login attempts. Please try again later.")
        } else {
          setError("Invalid email or password")
        }
      } else {
        router.push(returnUrl)
        router.refresh()
      }
    } catch {
      setError("An unexpected error occurred")
      turnstileRef.current?.reset()
      setTurnstileToken('')
      setTurnstileStatus('loading')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageShell
      eyebrow="B2B Partner Portal"
      title="Welcome back."
      description="Sign in to your partner dashboard to manage your agency operations."
    >
      {/* eslint-disable-next-line react-hooks/refs */}
      <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 text-center">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-slate-700 ml-1">
            Email address
          </label>
          <div className="mt-2 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="email"
              type="email"
              autoComplete="email"
              suppressHydrationWarning
              className={`block w-full pl-11 pr-4 py-3 border ${
                errors.email ? "border-red-300 ring-red-300" : "border-slate-200"
              } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-white outline-none`}
              placeholder="agent@example.com"
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p className="mt-2 text-sm text-red-600 ml-1">
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-slate-700 ml-1">
            Password
          </label>
          <div className="mt-2 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              suppressHydrationWarning
              className={`block w-full pl-11 pr-12 py-3 border ${
                errors.password ? "border-red-300 ring-red-300" : "border-slate-200"
              } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-white outline-none`}
              placeholder="••••••••"
              {...register("password")}
            />
            <button
              type="button"
              suppressHydrationWarning
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Eye className="h-5 w-5" aria-hidden="true" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-2 text-sm text-red-600 ml-1">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 px-1">
          <div className="text-sm">
            <Link
              href="/forgot-password"
              className="font-medium text-orange-600 hover:text-orange-500 transition-colors"
            >
              Forgot your password?
            </Link>
          </div>
        </div>

        <div className="flex justify-center my-4 min-h-[65px]">
          <Turnstile
            ref={turnstileRef}
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
            onSuccess={(token) => {
              setTurnstileToken(token)
              setTurnstileStatus('solved')
              setError("")
            }}
            onError={() => {
              setTurnstileStatus('error')
              setError("Security check failed. Please try again.")
            }}
            onExpire={() => {
              setTurnstileStatus('expired')
              setTurnstileToken('')
              setError("Security check expired. Please verify again.")
            }}
            options={{
              theme: 'light',
              size: 'normal',
            }}
          />
        </div>

        <div>
          <button
            type="submit"
            suppressHydrationWarning
            disabled={loading || turnstileStatus !== 'solved'}
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Sign in securely"
            )}
          </button>
        </div>
      </form>
    </AuthPageShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12 text-slate-500"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading Login...</div>}>
      <LoginForm />
    </Suspense>
  )
}
