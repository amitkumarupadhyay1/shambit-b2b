"use client"

import { useState, useRef, Suspense } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Lock, ArrowLeft, Key } from "lucide-react"
import Link from "next/link"
import axios from "axios"
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile"
import AuthPageShell from "@/components/auth/AuthPageShell"
import { useRouter, useSearchParams } from "next/navigation"

const resetPasswordSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits").regex(/^\d+$/, "OTP must contain only numbers"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  password_confirm: z.string(),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords do not match",
  path: ["password_confirm"],
})

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

function ResetPasswordFormContent() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)

  const [turnstileToken, setTurnstileToken] = useState<string>("")
  const [turnstileStatus, setTurnstileStatus] = useState<'solved' | 'error' | 'expired' | 'loading'>('loading')
  const turnstileRef = useRef<TurnstileInstance>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const phoneFromUrl = searchParams.get("phone") || ""
  const emailFromUrl = searchParams.get("email") || ""

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      otp: "",
      password: "",
      password_confirm: "",
    }
  })

  const onSubmit = async (data: ResetPasswordValues) => {
    if (!turnstileToken) {
      setError("Please complete the security verification.")
      return
    }

    if (!phoneFromUrl && !emailFromUrl) {
      setError("Invalid reset link. Please try again from the forgot password page.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const payload: Record<string, string> = {
        otp: data.otp,
        password: data.password,
        password_confirm: data.password_confirm,
        turnstile_token: turnstileToken,
        client_type: 'b2b'
      }

      if (phoneFromUrl) {
        payload.phone = phoneFromUrl
      } else if (emailFromUrl) {
        payload.email = emailFromUrl
      }

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/reset-password/`, payload)
      setSuccess(true)
      
      setTimeout(() => {
        router.push("/login?reset=success")
      }, 2000)
    } catch (e: unknown) {
      turnstileRef.current?.reset()
      setTurnstileToken('')
      setTurnstileStatus('loading')
      
      if (axios.isAxiosError(e)) {
        setError(e.response?.data?.error || "Failed to reset password. Please check your OTP and try again.")
      } else {
        setError("Failed to reset password. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageShell
      eyebrow="Account Recovery"
      title="Create New Password."
      description={`Enter the OTP sent to your ${emailFromUrl ? 'email' : 'WhatsApp'} and create a secure new password.`}
    >
      {success ? (
        <div className="text-center space-y-4">
          <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100">
            Password reset successfully! Redirecting to login...
          </div>
        </div>
      ) : (
        <>
          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); void handleSubmit(onSubmit)(e); }}>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 text-center">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-slate-700 ml-1">
                OTP Code
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Key className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  autoComplete="one-time-code"
                  suppressHydrationWarning
                  className={`block w-full pl-11 pr-4 py-3 border tracking-[0.5em] font-medium text-center ${
                    errors.otp ? "border-red-300 ring-red-300" : "border-slate-200"
                  } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-lg transition-all bg-white outline-none`}
                  placeholder="123456"
                  {...register("otp")}
                />
              </div>
              {errors.otp && (
                <p className="mt-2 text-sm text-red-600 ml-1">
                  {errors.otp.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 ml-1">
                New Password
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  suppressHydrationWarning
                  className={`block w-full pl-11 pr-10 py-3 border ${
                    errors.password ? "border-red-300 ring-red-300" : "border-slate-200"
                  } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-white outline-none`}
                  placeholder="••••••••"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 ml-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="password_confirm" className="block text-sm font-medium text-slate-700 ml-1">
                Confirm New Password
              </label>
              <div className="mt-2 relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password_confirm"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  suppressHydrationWarning
                  className={`block w-full pl-11 pr-4 py-3 border ${
                    errors.password_confirm ? "border-red-300 ring-red-300" : "border-slate-200"
                  } rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-white outline-none`}
                  placeholder="••••••••"
                  {...register("password_confirm")}
                />
              </div>
              {errors.password_confirm && (
                <p className="mt-2 text-sm text-red-600 ml-1">
                  {errors.password_confirm.message}
                </p>
              )}
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
                disabled={loading || turnstileStatus !== 'solved'}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Reset Password"
                )}
              </button>
            </div>

            <div className="text-center mt-6">
              <Link
                href="/forgot-password"
                className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to forgot password
              </Link>
            </div>
          </form>
        </>
      )}
    </AuthPageShell>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12 text-slate-500"><Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading Reset Password...</div>}>
      <ResetPasswordFormContent />
    </Suspense>
  )
}
