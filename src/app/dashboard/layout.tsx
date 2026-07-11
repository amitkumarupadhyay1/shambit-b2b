'use client';

import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { signOut } from 'next-auth/react';
import { LogOut, Home, Search, Calendar, FileText, Menu, X, User, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Load sidebar preference
  useEffect(() => {
    const savedState = localStorage.getItem('shambit_sidebar_collapsed');
    if (savedState) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsSidebarCollapsed(savedState === 'true');
    }
  }, []);

  const toggleSidebar = () => {
    const newState = !isSidebarCollapsed;
    setIsSidebarCollapsed(newState);
    localStorage.setItem('shambit_sidebar_collapsed', String(newState));
  };

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
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 transform bg-white/80 backdrop-blur-xl border-r border-white/50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] transition-all duration-300 ease-in-out md:relative md:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      } ${isSidebarCollapsed ? 'w-20' : 'w-64'} flex flex-col`}>
        
        <div className="h-20 flex items-center px-4 md:px-6 border-b border-slate-100/50 relative">
          <div className="flex items-center min-w-max">
            <Image src="/logo.svg" alt="ShamBit Logo" width={36} height={36} className="mr-3" />
            {!isSidebarCollapsed && (
              <span className="font-playfair text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent tracking-tight animate-in fade-in duration-300">
                ShamBit <span className="text-orange-600">B2B</span>
              </span>
            )}
          </div>
          
          <button 
            className="ml-auto md:hidden text-slate-500 hover:text-slate-700"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
          {navItems.map((item) => {
            const isActive = item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                title={isSidebarCollapsed ? item.name : undefined}
                className={`group flex items-center ${isSidebarCollapsed ? 'justify-center px-0' : 'px-3'} py-3 text-sm font-medium rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-orange-50 to-amber-50 text-orange-700 shadow-sm border border-orange-100/50'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 border border-transparent'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-slate-700 group-hover:shadow-sm'}`}>
                  <item.icon className="h-5 w-5" />
                </div>
                {!isSidebarCollapsed && (
                  <span className="ml-3 animate-in fade-in duration-300 whitespace-nowrap">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse Toggle Button (Desktop only) */}
        <div className="hidden md:flex items-center justify-center p-4 border-t border-slate-100/50">
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
            title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {isSidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col w-full h-full relative z-0 transition-all duration-300 bg-transparent">
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.05] mix-blend-overlay pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none mix-blend-screen" />
        
        <header className="h-20 bg-white/70 backdrop-blur-2xl border-b border-slate-200/50 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-[100] transition-all duration-300 shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-transparent pointer-events-none" />
          <div className="flex items-center relative z-10">
            <button 
              className="mr-4 md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 shadow-sm transition-all"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-slate-800 font-playfair capitalize tracking-wide drop-shadow-sm">
              {pathname.endsWith('/search') ? 'Find Premium B2B Inventory' : (pathname.split('/').pop()?.replace('-', ' ') || 'Dashboard')}
            </h1>
          </div>
          
          <div className="flex items-center relative z-10" ref={profileRef}>
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-slate-100 transition-all focus:outline-none focus:ring-2 focus:ring-orange-500/50"
            >
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 flex items-center justify-center text-white font-bold shadow-lg shadow-orange-500/40 border-2 border-white">
                A
              </div>
            </button>
            
            {isProfileOpen && (
              <div className="absolute right-0 top-14 w-56 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200 py-2 animate-in fade-in slide-in-from-top-2 z-[110]">
                <div className="px-4 py-3 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-transparent">
                  <p className="text-sm font-bold text-slate-800">Agent Profile</p>
                  <p className="text-xs text-slate-500 truncate mt-0.5">agent@example.com</p>
                </div>
                <div className="py-1">
                  <Link href="/dashboard/profile" className="flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                    <User className="mr-3 h-4 w-4 text-slate-400" />
                    My Profile
                  </Link>
                  <Link href="/dashboard/settings" className="flex items-center px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                    <Settings className="mr-3 h-4 w-4 text-slate-400" />
                    Settings
                  </Link>
                </div>
                <div className="py-1 border-t border-slate-100">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="mr-3 h-4 w-4 text-red-500" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6 lg:p-8 relative z-10">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
