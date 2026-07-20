"use client"

import { useState, useRef, useEffect, useMemo } from "react"
import { useForm, Controller, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, User as UserIcon, Mail, Building2, MapPin, MessageSquare, CheckCircle2, ShieldCheck, ChevronRight, ChevronLeft, FileText } from "lucide-react"
import Link from "next/link"
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile"
import { motion, AnimatePresence } from "framer-motion"

import PhoneInput from '../../components/common/PhoneInput'
import AuthPageShell from '../../components/auth/AuthPageShell'

const registerSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone_number: z.string().min(5, "Valid phone number is required"),
  agency_name: z.string().min(1, "Agency name is required"),
  gst_number: z.string().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/, "Invalid GST Number format").optional().or(z.literal("")),
  pan_number: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "Invalid PAN Number format"),
  aadhaar_number: z.string().regex(/^[2-9]{1}[0-9]{11}$/, "Invalid Aadhaar Number format"),
  kyc_consent: z.literal(true, { error: "KYC consent is required" }),
  address_line_1: z.string().min(1, "Address Line 1 is required"),
  address_line_2: z.string().optional(),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required"),
  pincode: z.string().regex(/^[1-9][0-9]{5}$/, "Invalid Indian PIN Code").refine(async (pin) => {
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
      const data = await res.json();
      return data && data[0] && data[0].Status === "Success";
    } catch {
      return false;
    }
  }, "PIN code does not exist"),
  message: z.string().optional(),
})

type RegisterFormValues = z.infer<typeof registerSchema>

const steps = [
  { id: 'personal', title: 'Personal Details', icon: UserIcon },
  { id: 'agency', title: 'Agency Details', icon: Building2 },
  { id: 'kyc', title: 'KYC & Address', icon: ShieldCheck }
]

export default function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")
  const [successData, setSuccessData] = useState<{ registration_number: string } | null>(null)

  const [turnstileToken, setTurnstileToken] = useState<string>("")
  const [turnstileStatus, setTurnstileStatus] = useState<'solved' | 'error' | 'expired' | 'loading'>('loading')
  const turnstileRef = useRef<TurnstileInstance>(null)


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [csc, setCsc] = useState<any>(null)

  useEffect(() => {
    import("country-state-city").then(setCsc)
  }, [])

  const {
    register,
    handleSubmit,
    control,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onTouched"
  })

  const selectedStateCode = useWatch({ control, name: "state" })

  const states: { isoCode: string; name: string }[] = useMemo(
    () => csc ? csc.State.getStatesOfCountry('IN') : [],
    [csc]
  )

  const cities: { name: string }[] = useMemo(
    () => csc && selectedStateCode ? csc.City.getCitiesOfState('IN', selectedStateCode) : [],
    [csc, selectedStateCode]
  )

  const nextStep = async () => {
    let fieldsToValidate: (keyof RegisterFormValues)[] = []
    if (currentStep === 0) {
      fieldsToValidate = ['first_name', 'last_name', 'email', 'phone_number']
    } else if (currentStep === 1) {
      fieldsToValidate = ['agency_name', 'message']
    }
    
    const isValid = await trigger(fieldsToValidate)
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length - 1))
    }
  }

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0))

  const onSubmit = async (data: RegisterFormValues) => {
    if (!turnstileToken) {
      setError("Please complete the security verification.")
      return
    }

    setLoading(true)
    setError("")

    try {
      const payload = { ...data, turnstile_token: turnstileToken }
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/agent/registration-requests/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        turnstileRef.current?.reset()
        setTurnstileToken('')
        setTurnstileStatus('loading')
        const errorData = await response.json()
        throw new Error(errorData.detail || errorData.error || errorData.email?.[0] || "Failed to submit registration request")
      }

      const responseData = await response.json()
      setSuccessData({ registration_number: responseData.registration_number })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      turnstileRef.current?.reset()
      setTurnstileToken('')
      setTurnstileStatus('loading')
    } finally {
      setLoading(false)
    }
  }

  if (successData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="sm:mx-auto sm:w-full sm:max-w-md"
        >
          <div className="bg-white py-12 px-4 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
            <div className="text-center space-y-6">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", bounce: 0.5, delay: 0.2 }}
                className="flex justify-center"
              >
                <div className="rounded-full bg-green-100 p-4 ring-8 ring-green-50">
                  <CheckCircle2 className="h-16 w-16 text-green-600" />
                </div>
              </motion.div>
              <div>
                <h3 className="text-3xl font-bold text-slate-900 mb-3 tracking-tight">Request Received</h3>
                <p className="text-slate-600 mb-8 leading-relaxed">
                  Thank you for your interest in registering as an agent with ShamBit. Our administrative team will review your KYC application and contact you shortly.
                </p>
                <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-8 max-w-sm mx-auto shadow-inner relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-amber-500"></div>
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-widest font-bold">Your Tracking Number</p>
                  <p className="text-4xl font-mono text-slate-900 tracking-widest font-bold">{successData.registration_number}</p>
                </div>
              </div>
              <div className="pt-6">
                <Link
                  href="/login"
                  className="inline-flex justify-center py-4 px-8 border border-transparent rounded-xl shadow-lg shadow-orange-500/20 text-base font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all hover:-translate-y-1"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <AuthPageShell
      eyebrow="B2B Agent Portal"
      title="Agent Registration"
      description="Complete your KYC to join India's fastest-growing B2B travel network."
    >
      <div className="flex-1 flex flex-col justify-center relative">
        <div className="mx-auto w-full max-w-xl">
          <div className="mb-10 relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-200 -translate-y-1/2 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-orange-500 to-amber-500"
                initial={{ width: '0%' }}
                animate={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              />
            </div>
            <div className="relative flex justify-between">
              {steps.map((step, index) => {
                const Icon = step.icon
                const isActive = index <= currentStep
                return (
                  <div key={step.id} className="flex flex-col items-center gap-2 bg-slate-50 px-2">
                    <motion.div 
                      className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${isActive ? 'bg-white border-orange-500 text-orange-500 shadow-sm shadow-orange-500/20' : 'bg-white border-slate-200 text-slate-400'}`}
                      animate={{
                        scale: isActive ? 1 : 0.9,
                        borderColor: isActive ? '#f97316' : '#e2e8f0',
                        color: isActive ? '#f97316' : '#94a3b8'
                      }}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>
                    <span className={`text-xs font-semibold ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>{step.title}</span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmit(onSubmit)(e); }} className="space-y-6">
              
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    className="p-4 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200 flex items-start gap-3"
                  >
                    <ShieldCheck className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
                    <div>{error}</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative overflow-visible min-h-[320px]">
                <AnimatePresence mode="wait">
                  
                  {currentStep === 0 && (
                    <motion.div
                      key="step1"
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -50, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">First Name</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <UserIcon className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            </div>
                            <input suppressHydrationWarning
                              type="text"
                              className={`block w-full pl-10 pr-4 py-3 border ${errors.first_name ? "border-red-300 ring-red-300" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 focus:bg-white outline-none`}
                              placeholder="Amit"
                              {...register("first_name")}
                            />
                          </div>
                          {errors.first_name && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-xs text-red-600 ml-1 font-medium">{errors.first_name.message}</motion.p>}
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Last Name</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <UserIcon className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            </div>
                            <input suppressHydrationWarning
                              type="text"
                              className={`block w-full pl-10 pr-4 py-3 border ${errors.last_name ? "border-red-300 ring-red-300" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 focus:bg-white outline-none`}
                              placeholder="Sharma"
                              {...register("last_name")}
                            />
                          </div>
                          {errors.last_name && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-xs text-red-600 ml-1 font-medium">{errors.last_name.message}</motion.p>}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Email Address</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                          </div>
                          <input suppressHydrationWarning
                            type="email"
                            className={`block w-full pl-10 pr-4 py-3 border ${errors.email ? "border-red-300 ring-red-300" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 focus:bg-white outline-none`}
                            placeholder="agent@shambit.com"
                            {...register("email")}
                          />
                        </div>
                        {errors.email && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-xs text-red-600 ml-1 font-medium">{errors.email.message}</motion.p>}
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Phone Number</label>
                        <Controller
                          name="phone_number"
                          control={control}
                          render={({ field }) => (
                            <PhoneInput
                              {...field}
                              error={errors.phone_number?.message}
                              className="bg-slate-50 focus-within:bg-white transition-colors rounded-xl"
                            />
                          )}
                        />
                        {errors.phone_number && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-xs text-red-600 ml-1 font-medium">{errors.phone_number.message}</motion.p>}
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 1 && (
                    <motion.div
                      key="step2"
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -50, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5"
                    >
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Agency Name</label>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Building2 className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                          </div>
                          <input suppressHydrationWarning
                            type="text"
                            className={`block w-full pl-10 pr-4 py-3 border ${errors.agency_name ? "border-red-300 ring-red-300" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 focus:bg-white outline-none`}
                            placeholder="ShamBit Travels LLC"
                            {...register("agency_name")}
                          />
                        </div>
                        {errors.agency_name && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-xs text-red-600 ml-1 font-medium">{errors.agency_name.message}</motion.p>}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Message (Optional)</label>
                        <div className="relative group">
                          <div className="absolute top-3.5 left-3.5 flex items-start pointer-events-none">
                            <MessageSquare className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                          </div>
                          <textarea suppressHydrationWarning
                            rows={4}
                            className={`block w-full pl-10 pr-4 py-3 border ${errors.message ? "border-red-300 ring-red-300" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 focus:bg-white outline-none resize-none`}
                            placeholder="Tell us about your agency's scale and target destinations..."
                            {...register("message")}
                          />
                        </div>
                        {errors.message && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-xs text-red-600 ml-1 font-medium">{errors.message.message}</motion.p>}
                      </div>
                    </motion.div>
                  )}

                  {currentStep === 2 && (
                    <motion.div
                      key="step3"
                      initial={{ x: 50, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -50, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-5"
                    >
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                         <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">PAN Number</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <FileText className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            </div>
                            <input suppressHydrationWarning
                              type="text"
                              className={`block w-full pl-10 pr-4 py-3 border ${errors.pan_number ? "border-red-300 ring-red-300" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 focus:bg-white outline-none uppercase`}
                              placeholder="ABCDE1234F"
                              {...register("pan_number", {
                                onChange: (e) => e.target.value = e.target.value.toUpperCase()
                              })}
                            />
                          </div>
                          {errors.pan_number && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-xs text-red-600 ml-1 font-medium">{errors.pan_number.message}</motion.p>}
                        </div>
                        
                        <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Aadhaar Number</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <ShieldCheck className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            </div>
                            <input suppressHydrationWarning
                              type="text"
                              className={`block w-full pl-10 pr-4 py-3 border ${errors.aadhaar_number ? "border-red-300 ring-red-300" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 focus:bg-white outline-none`}
                              placeholder="123456789012"
                              maxLength={12}
                              {...register("aadhaar_number")}
                            />
                          </div>
                          {errors.aadhaar_number && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-xs text-red-600 ml-1 font-medium">{errors.aadhaar_number.message}</motion.p>}
                        </div>
                      </div>

                      <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">GST Number (Optional)</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <FileText className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            </div>
                            <input suppressHydrationWarning
                              type="text"
                              className={`block w-full pl-10 pr-4 py-3 border ${errors.gst_number ? "border-red-300 ring-red-300" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 focus:bg-white outline-none uppercase`}
                              placeholder="22AAAAA0000A1Z5"
                              {...register("gst_number", {
                                onChange: (e) => e.target.value = e.target.value.toUpperCase()
                              })}
                            />
                          </div>
                          {errors.gst_number && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-xs text-red-600 ml-1 font-medium">{errors.gst_number.message}</motion.p>}
                      </div>

                      <div>
                         <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">Address Line 1</label>
                          <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                              <MapPin className="h-4 w-4 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                            </div>
                            <input suppressHydrationWarning
                              type="text"
                              className={`block w-full pl-10 pr-4 py-3 border ${errors.address_line_1 ? "border-red-300 ring-red-300" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 focus:bg-white outline-none`}
                              placeholder="Building, Street name"
                              {...register("address_line_1")}
                            />
                          </div>
                          {errors.address_line_1 && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-xs text-red-600 ml-1 font-medium">{errors.address_line_1.message}</motion.p>}
                      </div>

                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                         <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">State</label>
                          <select suppressHydrationWarning
                            className={`block w-full px-4 py-3 border ${errors.state ? "border-red-300 ring-red-300" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 focus:bg-white outline-none`}
                            {...register("state")}
                            onChange={(e) => {
                              register("state").onChange(e);
                              setValue("city", "");
                            }}
                          >
                            <option value="">Select State</option>
                            {states.map(state => (
                              <option key={state.isoCode} value={state.isoCode}>{state.name}</option>
                            ))}
                          </select>
                          {errors.state && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-xs text-red-600 ml-1 font-medium">{errors.state.message}</motion.p>}
                        </div>

                         <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">City</label>
                          <select suppressHydrationWarning
                            disabled={!selectedStateCode || cities.length === 0}
                            className={`block w-full px-4 py-3 border ${errors.city ? "border-red-300 ring-red-300" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 focus:bg-white outline-none disabled:opacity-50 disabled:bg-slate-100`}
                            {...register("city")}
                          >
                            <option value="">Select City</option>
                            {cities.map(city => (
                              <option key={city.name} value={city.name}>{city.name}</option>
                            ))}
                          </select>
                          {errors.city && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-xs text-red-600 ml-1 font-medium">{errors.city.message}</motion.p>}
                        </div>
                      </div>

                      <div>
                          <label className="block text-sm font-semibold text-slate-700 mb-1.5 ml-1">PIN Code</label>
                          <div className="relative group">
                            <input suppressHydrationWarning
                              type="text"
                              maxLength={6}
                              className={`block w-full px-4 py-3 border ${errors.pincode ? "border-red-300 ring-red-300" : "border-slate-200"} rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 focus:bg-white outline-none tracking-widest font-mono`}
                              placeholder="110001"
                              {...register("pincode")}
                            />
                          </div>
                          {errors.pincode && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-1.5 text-xs text-red-600 ml-1 font-medium">{errors.pincode.message}</motion.p>}
                      </div>

                      <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        <input type="checkbox" className="mt-1" {...register("kyc_consent")} />
                        <span>I consent to ShamBit processing my KYC details for agent verification. Aadhaar is encrypted at rest and only a masked value is displayed in the portal.</span>
                      </label>
                      {errors.kyc_consent && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-medium text-red-600">{errors.kyc_consent.message}</motion.p>}

                      <div className="flex justify-center my-4 min-h-[65px] bg-slate-50 rounded-xl p-2 border border-slate-100">
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="pt-6 border-t border-slate-100 flex gap-4">
                {currentStep > 0 && (
                  <button suppressHydrationWarning
                    type="button"
                    onClick={prevStep}
                    className="flex-1 flex justify-center items-center gap-2 py-3.5 px-4 border border-slate-200 rounded-xl shadow-sm text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-200 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                )}
                
                {currentStep < steps.length - 1 ? (
                  <button suppressHydrationWarning
                    type="button"
                    onClick={nextStep}
                    className="flex-[2] flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-slate-900/10 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 transition-all transform hover:-translate-y-0.5"
                  >
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button suppressHydrationWarning
                    type="submit"
                    disabled={loading || turnstileStatus !== 'solved'}
                    className="flex-[2] flex justify-center items-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-md shadow-orange-500/20 text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      "Submit KYC & Register"
                    )}
                  </button>
                )}
              </div>
              
              <div className="text-center text-sm text-slate-500 pt-4">
                Already an agent?{' '}
                <Link href="/login" className="font-semibold text-orange-600 hover:text-orange-500 transition-colors">
                  Sign in here
                </Link>
              </div>
            </form>
          </div>

        </div>
      </div>
    </AuthPageShell>
  )
}
