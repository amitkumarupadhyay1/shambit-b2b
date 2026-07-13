'use client';

import { useSession } from 'next-auth/react';
import { FileText } from 'lucide-react';
import useSWR from 'swr';

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

function DashboardSkeleton() {
  return (
    <div className="pb-12 animate-in fade-in duration-500">
      <div className="mb-8">
        <div className="h-8 bg-slate-200 rounded-lg w-1/3 mb-4 animate-pulse"></div>
        <div className="h-4 bg-slate-200 rounded w-1/4 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white/70 backdrop-blur-xl p-6 rounded-[24px] border border-white/60 shadow-sm h-32 animate-pulse"></div>
        ))}
      </div>
      <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-sm h-64 animate-pulse"></div>
    </div>
  );
}

export default function DashboardPage() {
  const { status } = useSession();
  
  // SWR automatically handles loading and error states globally via Providers
  const { data, error, isLoading } = useSWR<DashboardData>(
    status === 'authenticated' ? '/agent/dashboard/summary/' : null
  );

  if (isLoading || status === 'loading') {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-red-500 bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm">
          Failed to load dashboard data. Please try logging in again.
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600">
        Dashboard data is not available yet. Please refresh the page.
      </div>
    );
  }

  return (
    <div className="pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-playfair font-bold text-slate-900 tracking-tight">
          Welcome back, {data.company_name}
        </h2>
        <p className="text-slate-500 mt-2">Here is a summary of your agent account and recent activity.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl p-6 rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-16 h-16 text-slate-900" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
          </div>
          <div className="text-sm font-medium text-slate-500 mb-2">Total Credit Limit</div>
          <div className="text-4xl font-bold text-slate-900 font-playfair tracking-tight">₹{parseFloat(data.credit_limit).toLocaleString()}</div>
        </div>
        
        <div className="relative overflow-hidden bg-white/70 backdrop-blur-xl p-6 rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] group hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 24 24"><path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/></svg>
          </div>
          <div className="text-sm font-medium text-slate-500 mb-2">Current Outstanding</div>
          <div className={`text-4xl font-bold font-playfair tracking-tight ${parseFloat(data.current_outstanding) > 0 ? 'text-red-500' : 'text-slate-900'}`}>
            ₹{parseFloat(data.current_outstanding).toLocaleString()}
          </div>
        </div>
        
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-400 to-amber-500 p-6 rounded-[24px] border border-orange-300/50 shadow-[0_8px_30px_rgba(249,115,22,0.2)] text-white group hover:shadow-[0_8px_30px_rgba(249,115,22,0.3)] transition-all duration-300 transform hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
          </div>
          <div className="text-sm font-medium text-orange-50 mb-2 relative z-10">Available Credit</div>
          <div className="text-4xl font-bold font-playfair tracking-tight relative z-10">₹{parseFloat(data.available_credit).toLocaleString()}</div>
        </div>
      </div>

      <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-white/40 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 font-playfair">Recent Ledger Transactions</h2>
            <p className="text-sm text-slate-500 mt-1">Latest billing and payment history</p>
          </div>
        </div>
        
        {data.recent_transactions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-50 mb-4">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No transactions yet</h3>
            <p className="text-slate-500 mt-1">Your recent billing history will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Remarks</th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-slate-100/50">
                {data.recent_transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-white/60 transition-colors group">
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-600 font-medium group-hover:text-slate-900 transition-colors">
                      {new Date(tx.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold tracking-wide ${
                        tx.transaction_type === 'CREDIT' 
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}>
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-900">
                      ₹{parseFloat(tx.amount).toLocaleString()}
                    </td>
                    <td className="px-8 py-5 text-sm text-slate-500 group-hover:text-slate-700 transition-colors">
                      {tx.remarks}
                    </td>
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
