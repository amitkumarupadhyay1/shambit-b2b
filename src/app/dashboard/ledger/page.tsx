'use client';

import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { useState } from 'react';
import { FileText, ArrowUpRight, ArrowDownRight, Filter, ChevronLeft, ChevronRight, Download, Calendar, Info } from 'lucide-react';
import api from '@/lib/api';

interface LedgerTransaction {
  id: number;
  transaction_type: 'CREDIT' | 'DEBIT';
  category: string;
  status: string;
  amount: string;
  reference_id: string | null;
  base_amount: string | null;
  cgst_amount: string | null;
  sgst_amount: string | null;
  igst_amount: string | null;
  tds_amount: string | null;
  remarks: string;
  created_at: string;
  running_balance: string;
  idempotency_key: string | null;
  transaction_hash: string | null;
  booking: number | null;
  hotel_booking: number | null;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  opening_balance?: string;
  closing_balance?: string;
  results: LedgerTransaction[];
}

export default function LedgerPage() {
  const { status: sessionStatus } = useSession();
  
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Custom fetcher to preserve pagination metadata
  const fetcher = (url: string) => api.get(url).then(res => res.data);
  
  const queryParams = new URLSearchParams({ page: page.toString() });
  if (categoryFilter) queryParams.append('category', categoryFilter);
  if (startDate) queryParams.append('start_date', startDate);
  if (endDate) queryParams.append('end_date', endDate);

  const { data, error, isLoading } = useSWR<PaginatedResponse>(
    sessionStatus === 'authenticated' ? `/agent/dashboard/ledger/?${queryParams.toString()}` : null,
    fetcher
  );

  const handleExport = () => {
    const exportParams = new URLSearchParams();
    if (categoryFilter) exportParams.append('category', categoryFilter);
    if (startDate) exportParams.append('start_date', startDate);
    if (endDate) exportParams.append('end_date', endDate);
    
    api.get(`/agent/dashboard/export_ledger/?${exportParams.toString()}`, { responseType: 'blob' })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'ledger_export.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((err) => console.error('Export failed', err));
  };

  const handleDownloadInvoice = (txId: number) => {
    api.get(`/agent/dashboard/ledger/${txId}/download-invoice/`, { responseType: 'blob' })
      .then((response) => {
        // Extract filename from Content-Disposition header if available
        let filename = `invoice_${txId}.pdf`;
        const contentDisposition = response.headers['content-disposition'];
        if (contentDisposition && contentDisposition.includes('filename=')) {
          filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
        }

        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch((err) => console.error('Invoice download failed', err));
  };

  const transactions = data?.results || [];

  if (isLoading || sessionStatus === 'loading') {
    return (
      <div className="pb-12 animate-in fade-in duration-500">
        <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-sm h-[500px] animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-red-500 bg-red-50 p-6 rounded-2xl border border-red-100 shadow-sm">
          Failed to load ledger transactions. Please try again.
        </div>
      </div>
    );
  }

  return (
    <div className="pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/70 backdrop-blur-xl rounded-[24px] border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
        <div className="px-8 py-6 border-b border-slate-100 bg-white/40 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-900">Transaction History</h3>
            <p className="text-sm text-slate-500 mt-1">
              {data?.count ? `Showing ${transactions.length} of ${data.count} transactions` : 'No transactions found'}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm">
              <Calendar className="h-4 w-4 text-slate-400" />
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="bg-transparent text-sm text-slate-700 focus:outline-none"
              />
              <span className="text-slate-400">-</span>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="bg-transparent text-sm text-slate-700 focus:outline-none"
              />
            </div>
            
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="appearance-none bg-white border border-slate-200 text-slate-700 py-2 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all shadow-sm text-sm"
              >
                <option value="">All Categories</option>
                <option value="BOOKING">Booking</option>
                <option value="REFUND">Refund</option>
                <option value="TOPUP">Wallet Top-up</option>
                <option value="FEE">Fee/Tax</option>
                <option value="COMMISSION">Commission</option>
                <option value="OTHER">Other</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
                <Filter className="h-4 w-4" />
              </div>
            </div>

            <button 
              onClick={handleExport}
              className="flex items-center gap-2 bg-white border border-slate-200 text-slate-700 py-2 px-4 rounded-xl hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Balances Banner */}
        {data && (data.opening_balance !== undefined || data.closing_balance !== undefined) && (
          <div className="px-8 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            {data.opening_balance !== undefined && (
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Opening Balance</span>
                <span className="text-lg font-bold text-slate-700">₹{parseFloat(data.opening_balance).toLocaleString()}</span>
              </div>
            )}
            {data.closing_balance !== undefined && (
              <div className="flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Closing Balance</span>
                <span className="text-lg font-bold text-slate-700">₹{parseFloat(data.closing_balance).toLocaleString()}</span>
              </div>
            )}
          </div>
        )}

        {!transactions || transactions.length === 0 ? (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 mb-6">
              <FileText className="h-10 w-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-medium text-slate-900 mb-2">No transactions found</h3>
            <p className="text-slate-500 max-w-md mx-auto">
              Your ledger is currently empty for the selected filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Details</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Balance</th>
                  <th className="px-8 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status / Hash</th>
                </tr>
              </thead>
              <tbody className="bg-transparent divide-y divide-slate-100/50">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/60 transition-colors group">
                    <td className="px-8 py-5 whitespace-nowrap text-sm text-slate-600 font-medium">
                      <div className="flex flex-col">
                        <span>{new Date(tx.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        <span className="text-xs text-slate-400">{new Date(tx.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">{tx.remarks}</span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                            {tx.category}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          {tx.reference_id && (
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Ref: {tx.reference_id}</span>
                          )}
                          {tx.hotel_booking && (
                            <span>Booking ID: {tx.hotel_booking}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2" title={tx.base_amount ? `Base: ₹${tx.base_amount}\nCGST: ₹${tx.cgst_amount || 0}\nSGST: ₹${tx.sgst_amount || 0}\nIGST: ₹${tx.igst_amount || 0}\nTDS: ₹${tx.tds_amount || 0}` : 'No tax details available'}>
                        {tx.transaction_type === 'CREDIT' ? (
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-600">
                            <ArrowDownRight className="w-3 h-3" />
                          </div>
                        ) : (
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-600">
                            <ArrowUpRight className="w-3 h-3" />
                          </div>
                        )}
                        <span className={`font-bold ${tx.transaction_type === 'CREDIT' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          ₹{parseFloat(tx.amount).toLocaleString()}
                        </span>
                        {tx.base_amount && (
                          <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-slate-900">
                      ₹{parseFloat(tx.running_balance).toLocaleString()}
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap text-xs">
                      <div className="flex flex-col gap-1 font-mono">
                        <span className={`inline-flex w-fit items-center px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide ${
                          tx.status === 'RECONCILED' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          tx.status === 'FAILED' ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                          'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {tx.status}
                        </span>
                        {tx.transaction_hash ? (
                          <span className="text-slate-400 truncate max-w-[120px]" title={tx.transaction_hash}>
                            {tx.transaction_hash.substring(0, 16)}...
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Pending Hash</span>
                        )}
                        {(tx.category === 'FEE' || tx.category === 'COMMISSION') && (
                          <button
                            onClick={() => handleDownloadInvoice(tx.id)}
                            className="mt-1 flex items-center gap-1 w-fit text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-1 rounded transition-colors text-[10px] font-semibold"
                          >
                            <Download className="h-3 w-3" />
                            Invoice
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        {data && data.count > 0 && (
          <div className="px-8 py-4 border-t border-slate-100 bg-slate-50/30 flex items-center justify-between">
            <span className="text-sm text-slate-500">
              Page {page}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!data.previous}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!data.next}
                className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
