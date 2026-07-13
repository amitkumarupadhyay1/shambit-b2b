"use client";

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PolicyPageShellProps {
    children: React.ReactNode;
}

export default function PolicyPageShell({ children }: PolicyPageShellProps) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <main className="min-h-screen flex flex-col bg-white">
            <header className="py-5 px-6 md:py-6 md:px-8 border-b border-orange-50 bg-white/50 backdrop-blur flex items-center justify-between relative z-50">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/logo.svg" alt="ShamBit Logo" width={32} height={32} />
                <span className="font-playfair text-2xl font-bold tracking-tight">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-blue-900">Sham</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Bit</span>
                </span>
              </Link>
              <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                <Link href="/login" className="hover:text-orange-600 transition-colors">Sign In</Link>
                <Link href="/register" className="hover:text-orange-600 transition-colors">Agent Registration</Link>
                <Link href="/support" className="hover:text-orange-600 transition-colors">Agent Support</Link>
                <Link href="/policies/terms" className="hover:text-orange-600 transition-colors">Policies</Link>
              </nav>
              
              <button 
                className="md:hidden p-2 text-slate-600 hover:text-orange-600 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </header>

            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="md:hidden absolute top-[73px] left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-orange-50 p-6 z-40 shadow-lg"
                    >
                        <nav className="flex flex-col gap-6 text-base font-medium text-slate-700">
                            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-orange-600 transition-colors flex items-center justify-between">
                                Sign In <span className="text-orange-400">→</span>
                            </Link>
                            <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-orange-600 transition-colors flex items-center justify-between">
                                Agent Registration <span className="text-orange-400">→</span>
                            </Link>
                            <Link href="/support" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-orange-600 transition-colors flex items-center justify-between">
                                Agent Support <span className="text-orange-400">→</span>
                            </Link>
                            <Link href="/policies/terms" onClick={() => setIsMobileMenuOpen(false)} className="hover:text-orange-600 transition-colors flex items-center justify-between">
                                Agency Policies <span className="text-orange-400">→</span>
                            </Link>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>

            <section className="relative flex-1 overflow-hidden bg-slate-50 flex flex-col items-center justify-center py-16">
                <div className="absolute inset-0 z-0 pointer-events-none">
                    <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-orange-400/20 blur-[100px]" />
                    <div className="absolute top-1/2 left-1/4 h-64 w-64 rounded-full bg-amber-400/20 blur-[80px]" />
                    <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-orange-500/10 blur-[90px]" />
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
                </div>

                <div className="w-full max-w-4xl relative z-10 px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </section>

            <footer className="py-6 bg-white border-t border-slate-100 flex flex-col items-center justify-center gap-3">
              <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                <Link href="/policies/privacy" className="hover:text-orange-600 transition-colors">Privacy Policy</Link>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <Link href="/policies/terms" className="hover:text-orange-600 transition-colors">Terms of Service</Link>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <Link href="/policies/cancellation" className="hover:text-orange-600 transition-colors">Cancellation Policy</Link>
                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                <Link href="/support" className="hover:text-orange-600 transition-colors">Grievance Officer</Link>
              </div>
              <p className="text-xs text-slate-400">© {new Date().getFullYear()} ShamBit Technologies. All rights reserved.</p>
            </footer>
        </main>
    );
}
