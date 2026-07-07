import React from 'react';

interface AuthPageShellProps {
    eyebrow: string;
    title: string;
    description: string;
    children: React.ReactNode;
}

const highlights = [
    "Secure, encrypted sign-in to protect your ledger data",
    "Manage your bookings, credit limit, and outstanding balances",
    "Exclusive B2B rates and dedicated agent support",
];

export default function AuthPageShell({
    eyebrow,
    title,
    description,
    children,
}: AuthPageShellProps) {
    return (
        <main className="min-h-screen flex flex-col bg-white">
            <header className="py-6 px-8 border-b border-orange-50 bg-white/50 backdrop-blur flex justify-center lg:justify-start">
              <span className="font-playfair text-2xl font-bold text-slate-900 tracking-tight">
                ShamBit <span className="text-orange-600">Agents</span>
              </span>
            </header>

            <section className="relative flex-1 overflow-hidden bg-[radial-gradient(circle_at_top_left,#fff7ed_0%,#fefce8_45%,#f8fafc_100%)] flex flex-col justify-center">
                <div className="pointer-events-none absolute -top-24 right-0 h-64 w-64 rounded-full bg-orange-200/40 blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 left-0 h-56 w-56 rounded-full bg-amber-200/30 blur-3xl" />

                <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:px-8 lg:py-12">
                    <aside className="hidden lg:flex flex-col justify-between rounded-[28px] border border-orange-100 bg-white/70 p-8 shadow-[0_20px_70px_-36px_rgba(15,23,42,0.45)] backdrop-blur-md">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-700">{eyebrow}</p>
                            <h1 className="mt-4 font-playfair text-4xl leading-tight text-slate-900">{title}</h1>
                            <p className="mt-4 text-base leading-relaxed text-slate-600">{description}</p>
                        </div>

                        <div className="mt-8 space-y-3">
                            {highlights.map((item) => (
                                <div key={item} className="flex items-start gap-3 rounded-xl bg-white/70 px-4 py-3 border border-slate-100">
                                    <span className="mt-1 h-2 w-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 flex-shrink-0" />
                                    <p className="text-sm text-slate-700">{item}</p>
                                </div>
                            ))}
                        </div>
                    </aside>

                    <div className="flex items-center justify-center relative z-10">
                        <div className="w-full max-w-xl">
                            <div className="mb-4 rounded-2xl border border-orange-100 bg-white/75 p-4 backdrop-blur-md lg:hidden">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-orange-700">{eyebrow}</p>
                                <h1 className="mt-1 font-playfair text-2xl leading-tight text-slate-900">{title}</h1>
                                <p className="mt-2 text-sm text-slate-600">{description}</p>
                            </div>
                            {children}
                        </div>
                    </div>
                </div>
            </section>

            <footer className="py-6 text-center text-sm text-slate-500 bg-white border-t border-slate-100">
              © {new Date().getFullYear()} ShamBit Travels. All rights reserved.
            </footer>
        </main>
    );
}
