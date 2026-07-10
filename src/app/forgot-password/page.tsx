"use client"

import { useState, useRef } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import axios from "axios"
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile"
import AuthPageShell from '../../components/auth/AuthPageShell'
import PhoneInput from "../../components/common/PhoneInput"
import { isValidPhoneNumber } from 'libphonenumber-js'
import { useRouter } from "next/navigation"

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional().refine((val) => !val || isValidPhoneNumber(val), {
    message: "Please enter a valid phone number",
  }),
}).refine((data) => data.email || data.phone, {
  message: "Either email or phone must be provided",
  path: ["email"],
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [resetMethod, setResetMethod] = useState<"email" | "phone">("email")

  const [turnstileToken, setTurnstileToken] = useState<string>("")
  const [turnstileStatus, setTurnstileStatus] = useState<'solved' | 'error' | 'expired' | 'loading'>('loading')
  const turnstileRef = useRef<TurnstileInstance>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    control,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
      phone: "",
    }
  })

  const onSubmit = async (data: ForgotPasswordValues) => {
    if (!turnstileToken) {
      setError("Please complete the security verification.")
      return
    }

    if (resetMethod === "email" && !data.email) {
      setError("Please enter your email address.")
      return
    }
    
    if (resetMethod === "phone" && !data.phone) {
      setError("Please enter your phone number.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const payload: Record<string, string> = { turnstile_token: turnstileToken, client_type: 'b2b' }
      if (resetMethod === "email") {
        payload.email = data.email || ""
      } else {
        payload.phone = data.phone || ""
      }

      await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/forgot-password/`, payload)
      setSuccess(true)
      
      if (resetMethod === "phone") {
         setTimeout(() => {
             router.push(`/reset-password?phone=${encodeURIComponent(data.phone || "")}`)
         }, 2000)
      } else {
         setTimeout(() => {
             router.push(`/reset-password?email=${encodeURIComponent(data.email || "")}`)
         }, 2000)
      }
    } catch (e: unknown) {
      turnstileRef.current?.reset()
      setTurnstileToken('')
      setTurnstileStatus('loading')
      
      if (axios.isAxiosError(e)) {
        setError(e.response?.data?.error || "Failed to send reset code. Please try again.")
      } else {
        setError("Failed to send reset code. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthPageShell
      eyebrow="Account Recovery"
      title="Forgot Password."
      description="Enter your email or phone to receive a secure password reset link or OTP for your B2B portal access."
    >
      {success ? (
        <div className="text-center space-y-4">
          <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100">
            {resetMethod === 'email' 
              ? "A password reset OTP has been sent to your email address. Redirecting to reset page..." 
              : "An OTP has been sent to your WhatsApp number. Redirecting to reset page..."}
          </div>
          <Link
            href="/login"
            className="inline-flex items-center justify-center font-medium text-orange-600 hover:text-orange-500 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to sign in
          </Link>
        </div>
      ) : (
        <>
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setResetMethod("email")
                setValue("phone", "")
                clearErrors()
                setError("")
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                resetMethod === "email"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Email
            </button>
            <button
              type="button"
              onClick={() => {
                setResetMethod("phone")
                setValue("email", "")
                clearErrors()
                setError("")
              }}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                resetMethod === "phone"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Phone Number
            </button>
          </div>

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); void handleSubmit(onSubmit)(e); }}>
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-xl border border-red-100 text-center">
                {error}
              </div>
            )}

            {resetMethod === "email" ? (
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
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 ml-1">
                  WhatsApp Number
                </label>
                <div className="mt-2">
                  <Controller
                      name="phone"
                      control={control}
                      render={({ field }) => (
                          <PhoneInput
                              value={field.value}
                              onChange={field.onChange}
                              error={errors.phone?.message}
                              placeholder="9876543210"
                              defaultCountry="IN"
                          />
                      )}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-2 text-sm text-red-600 ml-1">
                    {errors.phone.message}
                  </p>
                )}
              </div>
            )}

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
                  "Send OTP"
                )}
              </button>
            </div>

            <div className="text-center mt-6">
              <Link
                href="/login"
                className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" /> Back to sign in
              </Link>
            </div>
          </form>
        </>
      )}
    </AuthPageShell>
  )
}
