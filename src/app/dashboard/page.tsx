'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import styles from './dashboard.module.css';

interface DashboardData {
  agent_id: number;
  company_name: string;
  credit_limit: string;
  current_outstanding: string;
  available_credit: string;
  recent_transactions: Array<{
    id: number;
    transaction_type: string;
    amount: string;
    remarks: string;
    created_at: string;
  }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/v1/agent/dashboard/');
        setData(response.data);
      } catch {
        setError('Failed to load dashboard data. Please try logging in again.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <div className={styles.loading}>Loading Dashboard...</div>;
  if (error) return <div className={styles.error}>{error}</div>;
  if (!data) return null;

  return (
    <div className={styles.dashboardContainer}>
      <h1 className={styles.pageTitle}>Welcome, {data.company_name}</h1>
      
      <div className={styles.statsGrid}>
        <div className={`glass-panel ${styles.statCard}`}>
          <div className={styles.statLabel}>Total Credit Limit</div>
          <div className={styles.statValue}>₹{parseFloat(data.credit_limit).toLocaleString()}</div>
        </div>
        <div className={`glass-panel ${styles.statCard}`}>
          <div className={styles.statLabel}>Current Outstanding</div>
          <div className={`${styles.statValue} ${parseFloat(data.current_outstanding) > 0 ? styles.textDanger : ''}`}>
            ₹{parseFloat(data.current_outstanding).toLocaleString()}
          </div>
        </div>
        <div className={`glass-panel ${styles.statCard} ${styles.statHighlight}`}>
          <div className={styles.statLabel}>Available Credit</div>
          <div className={styles.statValue}>₹{parseFloat(data.available_credit).toLocaleString()}</div>
        </div>
      </div>

      <div className={`glass-panel ${styles.transactionsSection}`}>
        <h2 className={styles.sectionTitle}>Recent Ledger Transactions</h2>
        {data.recent_transactions.length === 0 ? (
          <p className={styles.emptyState}>No recent transactions found.</p>
        ) : (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_transactions.map(tx => (
                  <tr key={tx.id}>
                    <td>{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`${styles.badge} ${tx.transaction_type === 'CREDIT' ? styles.badgeSuccess : styles.badgeDanger}`}>
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td>₹{parseFloat(tx.amount).toLocaleString()}</td>
                    <td>{tx.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
