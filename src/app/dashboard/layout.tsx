'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import styles from './dashboard.module.css';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('agent_token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('agent_token');
    router.push('/login');
  };

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.sidebarBrand}>
          <Image src="/logo.svg" alt="ShamBit Logo" width={32} height={32} />
          <span>ShamBit B2B</span>
        </div>
        <nav className={styles.sidebarNav}>
          <Link href="/dashboard" className={`${styles.navItem} ${pathname === '/dashboard' ? styles.active : ''}`}>
            Dashboard
          </Link>
          <Link href="/dashboard/search" className={`${styles.navItem} ${pathname.startsWith('/dashboard/search') ? styles.active : ''}`}>
            Hotel Search
          </Link>
          <Link href="/dashboard/bookings" className={`${styles.navItem} ${pathname.startsWith('/dashboard/bookings') ? styles.active : ''}`}>
            My Bookings
          </Link>
          <Link href="/dashboard/ledger" className={`${styles.navItem} ${pathname.startsWith('/dashboard/ledger') ? styles.active : ''}`}>
            Ledger & Settlement
          </Link>
        </nav>
        <div className={styles.sidebarFooter}>
          <button onClick={handleLogout} className={styles.logoutBtn}>
            Sign Out
          </button>
        </div>
      </aside>
      <main className={styles.mainContent}>
        <header className={styles.topHeader}>
          <div className={styles.headerTitle}>
            {pathname.split('/').pop()?.toUpperCase() || 'DASHBOARD'}
          </div>
          <div className={styles.agentProfile}>
            <div className={styles.avatar}>A</div>
          </div>
        </header>
        <div className={styles.contentArea}>
          {children}
        </div>
      </main>
    </div>
  );
}
