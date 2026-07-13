import Link from "next/link";
import Image from "next/image";
import * as motion from "framer-motion/client";
import { ShieldCheck, TrendingUp, Clock, Headset, Lock, CheckCircle2 } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ShamBit B2B Agent Portal | India's Leading Travel Network",
  description: "Join ShamBit's exclusive B2B travel network. Access wholesale inventory, zero-markup fares, and real-time ledger tracking with India's fastest-growing platform.",
  keywords: "B2B travel portal, travel agent registration, ShamBit agents, wholesale travel inventory, India travel agents, b2b flights, b2b hotels",
};

export default function Home() {
  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_URL || "#";
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || "#";

  return (
    <div className="min-h-screen bg-slate-50 font-inter flex flex-col selection:bg-orange-100 selection:text-orange-900">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-30 bg-orange-200 blur-[120px] rounded-full mix-blend-multiply" />
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] opacity-20 bg-blue-300 blur-[100px] rounded-full mix-blend-multiply" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-white/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-orange-100 to-orange-50 p-2 border border-orange-200/50 group-hover:shadow-md transition-all">
              <Image src="/logo.svg" alt="ShamBit Logo" width={28} height={28} className="relative z-10" />
            </div>
            <span className="font-playfair text-2xl font-semibold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-blue-900">Sham</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Bit</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link 
              href="/login" 
              className="hidden sm:inline-flex px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-xl transition-all"
            >
              Sign In
            </Link>
            <Link 
              href="/register" 
              className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.98]"
            >
              Register as Agent
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 px-6 overflow-hidden">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="max-w-2xl"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100/80 border border-orange-200 text-orange-800 text-xs font-bold tracking-wide uppercase mb-8 shadow-sm backdrop-blur-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                  B2B Agent Portal
                </div>
                
                <h1 className="text-5xl lg:text-7xl font-playfair font-semibold text-slate-800 tracking-tight leading-[1.15] mb-6">
                  Empowering <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Travel Agents</span><br />
                  Everywhere.
                </h1>
                
                <p className="text-lg lg:text-xl text-slate-500 mb-10 leading-relaxed max-w-xl font-light">
                  Access exclusive wholesale inventory, zero-markup fares, and seamless ledger management. Built specifically for India&apos;s leading B2B travel agencies.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link 
                    href="/register" 
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 rounded-2xl shadow hover:shadow-md transition-all active:scale-[0.98] group"
                  >
                    Start Free KYC 
                    <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
                  </Link>
                  <Link 
                    href="/login" 
                    className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-2xl shadow-sm hover:shadow transition-all active:scale-[0.98]"
                  >
                    Agent Login
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                className="relative hidden lg:block"
              >
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-100/50 to-blue-50/50 rounded-[3rem] transform rotate-3 scale-105 -z-10 blur-xl" />
                <div className="bg-white/60 backdrop-blur-xl border border-white/40 shadow-2xl rounded-[3rem] p-8">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="bg-orange-50/70 border border-orange-100/50 rounded-3xl p-6 transform hover:-translate-y-1 transition-transform">
                        <TrendingUp className="w-7 h-7 text-orange-500 mb-4" />
                        <h3 className="font-semibold text-slate-800">Zero Markup</h3>
                        <p className="text-sm text-slate-500 mt-1 font-light">100% net fares directly to agents.</p>
                      </div>
                      <div className="bg-blue-50/70 border border-blue-100/50 rounded-3xl p-6 transform hover:-translate-y-1 transition-transform">
                        <ShieldCheck className="w-7 h-7 text-blue-500 mb-4" />
                        <h3 className="font-semibold text-slate-800">Secure KYC</h3>
                        <p className="text-sm text-slate-500 mt-1 font-light">Verified B2B access only.</p>
                      </div>
                    </div>
                    <div className="space-y-4 mt-8">
                      <div className="bg-emerald-50/70 border border-emerald-100/50 rounded-3xl p-6 transform hover:-translate-y-1 transition-transform">
                        <Clock className="w-7 h-7 text-emerald-500 mb-4" />
                        <h3 className="font-semibold text-slate-800">Live Ledger</h3>
                        <p className="text-sm text-slate-500 mt-1 font-light">Real-time credit tracking.</p>
                      </div>
                      <div className="bg-indigo-50/70 border border-indigo-100/50 rounded-3xl p-6 transform hover:-translate-y-1 transition-transform">
                        <Headset className="w-7 h-7 text-indigo-500 mb-4" />
                        <h3 className="font-semibold text-slate-800">24/7 Support</h3>
                        <p className="text-sm text-slate-500 mt-1 font-light">Priority agent assistance.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Trust Banner */}
        <section className="border-y border-slate-200/60 bg-white/40 backdrop-blur-md py-12 px-6">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Enterprise-Grade Security & Compliance</h3>
              <p className="text-slate-500 text-sm font-light">We strictly adhere to the Digital Personal Data Protection Act (DPDPA 2023) ensuring your agency&apos;s data is encrypted, localized, and completely secure.</p>
            </div>
            <div className="flex flex-wrap gap-6 items-center justify-center">
              <div className="flex items-center gap-2 text-slate-700 font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100">
                <Lock className="w-5 h-5 text-emerald-500" />
                256-bit SSL
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100">
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
                DPDPA Compliant
              </div>
              <div className="flex items-center gap-2 text-slate-700 font-medium bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-100">
                <ShieldCheck className="w-5 h-5 text-orange-500" />
                Strict KYC
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span className="font-playfair text-xl font-bold tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-blue-900">Sham</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Bit</span>
            </span>
            <span className="text-slate-400 text-sm ml-2">© {new Date().getFullYear()} All rights reserved.</span>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-600">
            <Link href="/policies/terms" className="hover:text-orange-600 transition-colors">Terms of Service</Link>
            <Link href="/policies/privacy" className="hover:text-orange-600 transition-colors">Privacy Policy</Link>
            <Link href="/policies/cancellation" className="hover:text-orange-600 transition-colors">Cancellation & Refund</Link>
            <Link href="/support" className="hover:text-orange-600 transition-colors">Grievance Redressal</Link>
          </div>

          <div className="flex items-center gap-4">
            <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>
            <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-full transition-all">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
