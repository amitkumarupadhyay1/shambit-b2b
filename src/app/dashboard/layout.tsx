'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { LogOut, Home, Search, Calendar, FileText } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Hotel Search', href: '/dashboard/search', icon: Search },
    { name: 'My Bookings', href: '/dashboard/bookings', icon: Calendar },
    { name: 'Ledger & Settlement', href: '/dashboard/ledger', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Image src="/logo.svg" alt="ShamBit Logo" width={32} height={32} className="mr-3" />
          <span className="font-playfair text-xl font-bold text-slate-900 tracking-tight">ShamBit B2B</span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                  isActive
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2.5 text-sm font-medium text-slate-600 rounded-xl hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-slate-400" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8">
          <div className="text-lg font-semibold text-slate-800 font-playfair capitalize">
            {pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
          </div>
          <div className="flex items-center">
            <div className="h-9 w-9 rounded-full bg-gradient-to-r from-orange-400 to-amber-500 flex items-center justify-center text-white font-semibold shadow-sm">
              A
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto bg-slate-50/50 p-6 lg:p-8">
          <div className="mx-auto max-w-6xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
