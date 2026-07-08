import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface AuthPageShellProps {
    eyebrow: string;
    title: string;
    description: string;
    children: React.ReactNode;
}

const highlights = [
    "Access exclusive wholesale inventory and negotiated B2B rates.",
    "Manage agency bookings, client itineraries, and credit limits.",
    "24/7 dedicated partner support and real-time ledger tracking.",
];

export default function AuthPageShell({
    eyebrow,
    title,
    description,
    children,
}: AuthPageShellProps) {
    return (
        <main className="min-h-screen flex flex-col bg-white">
            <header className="py-6 px-8 border-b border-orange-50 bg-white/50 backdrop-blur flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image src="/logo.svg" alt="ShamBit Logo" width={32} height={32} />
                <span className="font-playfair text-2xl font-bold text-slate-900 tracking-tight">
                  ShamBit <span className="text-orange-600">Agents</span>
                </span>
              </div>
              <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
                <Link href="#" className="hover:text-orange-600 transition-colors">Partner Support</Link>
                <Link href="#" className="hover:text-orange-600 transition-colors">Partner Registration</Link>
                <Link href="#" className="hover:text-orange-600 transition-colors">Agency Policies</Link>
              </nav>
            </header>

            <section className="relative flex-1 overflow-hidden bg-slate-50 flex flex-col justify-center">
                <div className="absolute inset-0 z-0">
                    <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-orange-400/20 blur-[100px]" />
                    <div className="absolute top-1/2 left-1/4 h-64 w-64 rounded-full bg-amber-400/20 blur-[80px]" />
                    <div className="absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-orange-500/10 blur-[90px]" />
                    <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay" />
                </div>

                <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:gap-12 lg:px-8 lg:py-12 relative z-10">
                    <aside className="hidden lg:flex flex-col justify-between rounded-[32px] border border-white/40 bg-white/40 p-10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] backdrop-blur-xl">
                        <div>
                            <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-700">
                                {eyebrow}
                            </div>
                            <h1 className="mt-6 font-playfair text-5xl leading-[1.1] text-slate-900 tracking-tight">{title}</h1>
                            <p className="mt-5 text-lg leading-relaxed text-slate-600 font-light">{description}</p>
                        </div>

                        <div className="mt-10 space-y-4">
                            {highlights.map((item, i) => (
                                <div key={i} className="group flex items-start gap-4 rounded-2xl bg-white/60 p-4 border border-white/50 transition-all hover:bg-white/80 hover:shadow-sm">
                                    <div className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-500 shadow-sm">
                                        <div className="h-2 w-2 rounded-full bg-white" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-700 leading-snug">{item}</p>
                                </div>
                            ))}
                        </div>
                    </aside>

                    <div className="flex items-center justify-center relative">
                        <div className="w-full max-w-xl">
                            <div className="mb-6 rounded-3xl border border-white/40 bg-white/60 p-6 backdrop-blur-xl shadow-sm lg:hidden">
                                <div className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-700">
                                    {eyebrow}
                                </div>
                                <h1 className="mt-4 font-playfair text-3xl leading-tight text-slate-900">{title}</h1>
                                <p className="mt-2 text-sm text-slate-600">{description}</p>
                            </div>
                            <div className="rounded-[32px] border border-white/50 bg-white/70 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-2xl sm:p-10">
                                {children}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="py-6 text-center text-sm text-slate-500 bg-white border-t border-slate-100">
              © {new Date().getFullYear()} ShamBit Technologies. All rights reserved.
            </footer>
        </main>
    );
}
