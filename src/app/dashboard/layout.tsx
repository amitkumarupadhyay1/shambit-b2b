'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { LogOut, Home, Search, Calendar, FileText, Menu, X, User, Settings } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden">
      {/* Mobile sidebar backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-20 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 transform bg-white/80 backdrop-blur-xl border-r border-white/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } flex flex-col`}>
        <div className="h-20 flex items-center px-6 border-b border-slate-100/50">
          <Image src="/logo.svg" alt="ShamBit Logo" width={36} height={36} className="mr-3" />
          <span className="font-playfair text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight">ShamBit <span className="text-orange-600">B2B</span></span>
          <button 
            className="ml-auto md:hidden text-slate-500 hover:text-slate-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
          {navItems.map((item) => {
            const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`group flex items-center px-3 py-3 text-sm font-medium rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 shadow-sm border border-orange-100/50'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <div className={`mr-3 p-1.5 rounded-xl transition-colors ${isActive ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700 group-hover:shadow-sm'}`}>
                  <item.icon className="h-4 w-4" />
                </div>
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 flex flex-col w-full h-full relative z-0">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />
        
        <header className="h-20 bg-white/70 backdrop-blur-lg border-b border-white/50 flex items-center justify-between px-6 lg:px-10 shadow-[0_4px_24px_rgba(0,0,0,0.02)] sticky top-0 z-10">
          <div className="flex items-center">
            <button 
              className="mr-4 md:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-slate-800 font-playfair capitalize">
              {pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center relative" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-semibold shadow-md border-2 border-white">
                A
              </div>
            </button>
            
            {isProfileOpen && (
              <div className="absolute right-0 top-14 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 animate-in fade-in slide-in-from-top-2">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-900">Agent Profile</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">agent@example.com</p>
                </div>
                <div className="py-1">
                  <Link href="/dashboard/profile" className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <User className="mr-3 h-4 w-4 text-slate-400" />
                    My Profile
                  </Link>
                  <Link href="/dashboard/settings" className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50">
                    <Settings className="mr-3 h-4 w-4 text-slate-400" />
                    Settings
                  </Link>
                </div>
                <div className="py-1 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="mr-3 h-4 w-4 text-red-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
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
