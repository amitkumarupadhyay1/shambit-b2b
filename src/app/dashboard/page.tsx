'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { useSession, signOut } from 'next-auth/react';
import { Loader2, LogOut } from 'lucide-react';

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
  const { status } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/login';
      return;
    }

    if (status === 'authenticated') {
      const fetchDashboard = async () => {
        try {
          const response = await api.get('/agent/dashboard/');
          setData(response.data);
        } catch {
          setError('Failed to load dashboard data. Please try logging in again.');
        } finally {
          setLoading(false);
        }
      };
      fetchDashboard();
    }
  }, [status]);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500 bg-red-50 p-4 rounded-xl border border-red-100">{error}</div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-playfair font-bold text-gray-900">Welcome, {data.company_name}</h1>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign out
          </button>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-1">Total Credit Limit</div>
            <div className="text-3xl font-bold text-gray-900">₹{parseFloat(data.credit_limit).toLocaleString()}</div>
          </div>
          <div className="bg-white/80 backdrop-blur-md p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="text-sm font-medium text-gray-500 mb-1">Current Outstanding</div>
            <div className={`text-3xl font-bold ${parseFloat(data.current_outstanding) > 0 ? 'text-red-600' : 'text-gray-900'}`}>
              ₹{parseFloat(data.current_outstanding).toLocaleString()}
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 p-6 rounded-2xl border border-orange-400 shadow-md text-white">
            <div className="text-sm font-medium text-orange-100 mb-1">Available Credit</div>
            <div className="text-3xl font-bold">₹{parseFloat(data.available_credit).toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-lg font-medium text-gray-900">Recent Ledger Transactions</h2>
          </div>
          {data.recent_transactions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No recent transactions found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.recent_transactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tx.transaction_type === 'CREDIT' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        ₹{parseFloat(tx.amount).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {tx.remarks}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
