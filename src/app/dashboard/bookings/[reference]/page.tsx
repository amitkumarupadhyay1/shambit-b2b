'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import { FileText, ArrowLeft, Building, Users, Calendar, Download, XCircle } from 'lucide-react';
import Link from 'next/link';
import { use } from 'react';

interface OrderLine {
  id: number;
  quantity: number;
  room_type_name: string;
  line_type: string;
  total_amount: string;
}

interface OrderData {
  booking_reference: string;
  hotel_name: string;
  check_in: string;
  check_out: string;
  total_guests: number;
  total_rooms: number;
  booking_mode: string;
  status: string;
  allocation_status?: string;
  payment_status?: string;
  b2b_selling_total?: string;
  primary_guest_name?: string;
  contact_email?: string;
  contact_phone?: string;
  expires_at?: string | null;
  contract?: { id?: number; number?: string; version?: number };
  events?: Array<{
    event_type: string;
    from_status: string;
    to_status: string;
    reason: string;
    actor: string;
    created_at: string;
  }>;
  lines: OrderLine[];
}

export default function BookingDetailsPage(props: { params: Promise<{ reference: string }> }) {
  const params = use(props.params);
  const { reference } = params;
  const router = useRouter();

  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [downloading, setDownloading] = useState(false);

  const downloadVoucher = async () => {
    try {
      setDownloading(true);
      setError('');
      const response = await api.get(`/b2b/orders/${reference}/voucher/`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = `ShamBit-${reference}-voucher.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const responseError = err as { response?: { data?: { error?: string } } };
      setError(responseError.response?.data?.error || 'Unable to download the voucher.');
    } finally {
      setDownloading(false);
    }
  };

  const cancelBooking = async () => {
    const reason = cancellationReason.trim();
    if (!orderData) return;
    if (reason.length < 10) {
      setError('Enter a cancellation reason of at least 10 characters.');
      return;
    }
    if (!window.confirm('Submit this cancellation and release its inventory? This action is audited.')) return;
    try {
      setCancelling(true);
      setError('');
      await api.post(`/b2b/orders/${reference}/cancel/`, { reason });
      setOrderData({
        ...orderData,
        status: 'CANCELLED',
        payment_status: orderData.payment_status === 'LEDGER_HOLD' ? 'REFUNDED' : orderData.payment_status,
      });
    } catch (err: unknown) {
      const responseError = err as { response?: { data?: { error?: string } } };
      setError(responseError.response?.data?.error || 'Unable to cancel this booking.');
    } finally {
      setCancelling(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await api.get(`/b2b/orders/${reference}/`);
        setOrderData(res.data);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { error?: string } } };
        setError(error.response?.data?.error || 'Failed to load booking details.');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [reference]);

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Loading details...</div>;
  }

  if (!orderData) {
    return (
      <div className="p-8">
        <div className="p-4 rounded-xl bg-red-50 text-red-700">{error || 'Booking not found'}</div>
        <button onClick={() => router.back()} className="mt-4 text-orange-600 font-bold hover:underline">
          &larr; Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {error && <div className="p-4 rounded-xl bg-red-50 text-red-700">{error}</div>}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bookings" className="p-2 border border-slate-200 rounded-full hover:bg-slate-50 text-slate-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-playfair">Booking {orderData.booking_reference}</h1>
          <p className="text-sm text-slate-500">Status: <span className="font-bold text-slate-800">{orderData.status}</span></p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {orderData.status === 'CONFIRMED' && (
            <button onClick={downloadVoucher} disabled={downloading} className="flex items-center gap-2 px-4 py-2 border border-slate-300 bg-white text-slate-700 rounded-lg hover:bg-slate-50 disabled:opacity-60 font-medium text-sm">
              <Download className="w-4 h-4" /> {downloading ? 'Preparing…' : 'Download Voucher'}
            </button>
          )}
          {['DRAFT', 'CONFIRMED', 'PENDING_PAYMENT', 'PENDING_CONFIRMATION'].includes(orderData.status) && (
            <button onClick={() => setShowCancellation(current => !current)} disabled={cancelling} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60 font-medium text-sm">
              <XCircle className="w-4 h-4" /> {cancelling ? 'Cancelling…' : 'Cancel Booking'}
            </button>
          )}
        </div>
      </div>

      {showCancellation && ['DRAFT', 'CONFIRMED', 'PENDING_PAYMENT', 'PENDING_CONFIRMATION'].includes(orderData.status) && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <label className="block text-sm font-bold text-red-900">Cancellation reason</label>
          <p className="mt-1 text-xs text-red-700">The reason, actor, timestamp and financial release are retained in the booking audit history.</p>
          <textarea
            value={cancellationReason}
            onChange={(event) => setCancellationReason(event.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Explain why this booking is being cancelled."
            className="mt-3 w-full rounded-xl border border-red-200 bg-white p-3 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-100"
          />
          <div className="mt-3 flex justify-end gap-3">
            <button type="button" onClick={() => setShowCancellation(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Keep booking</button>
            <button type="button" onClick={cancelBooking} disabled={cancelling || cancellationReason.trim().length < 10} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
              {cancelling ? 'Cancelling…' : 'Confirm cancellation'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Booking Summary</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div>
                <p className="text-slate-500 flex items-center gap-2"><Building className="w-4 h-4"/> Hotel</p>
                <p className="font-bold text-slate-800 mt-1">{orderData.hotel_name}</p>
              </div>
              <div>
                <p className="text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4"/> Dates</p>
                <p className="font-bold text-slate-800 mt-1">{orderData.check_in} to {orderData.check_out}</p>
              </div>
              <div>
                <p className="text-slate-500 flex items-center gap-2"><Users className="w-4 h-4"/> Guests & Rooms</p>
                <p className="font-bold text-slate-800 mt-1">{orderData.total_guests} Guests, {orderData.total_rooms} Rooms</p>
              </div>
              <div>
                <p className="text-slate-500 flex items-center gap-2"><FileText className="w-4 h-4"/> Booking Mode</p>
                <p className="font-bold text-slate-800 mt-1">{orderData.booking_mode}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Room Allocations</h2>
            <div className="space-y-3">
              {orderData.lines.map((line) => (
                <div key={line.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                  <span className="font-medium text-slate-700">{line.quantity}x {line.room_type_name || (line.line_type === 'GLOBAL' ? 'Global Plan' : 'Allocation')}</span>
                  <span className="font-bold text-slate-800">₹{parseFloat(line.total_amount).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Guest Details</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-500">Primary Guest</p>
                <p className="font-bold text-slate-800">{orderData.primary_guest_name || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-slate-500">Contact Email</p>
                <p className="font-bold text-slate-800">{orderData.contact_email || 'Not provided'}</p>
              </div>
              <div>
                <p className="text-slate-500">Contact Phone</p>
                <p className="font-bold text-slate-800">{orderData.contact_phone || 'Not provided'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Status & Payment</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Allocation Status</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 font-bold rounded text-xs">{orderData.allocation_status || 'PENDING'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Payment Status</span>
                <span className="px-2 py-1 bg-amber-100 text-amber-700 font-bold rounded text-xs">{orderData.payment_status || 'LEDGER_HOLD'}</span>
              </div>
              <div className="border-t border-slate-100 pt-4 mt-4 flex justify-between items-center">
                <span className="font-bold text-slate-800">Total Amount</span>
                <span className="text-lg font-black text-slate-900">₹{parseFloat(orderData.b2b_selling_total || '0').toLocaleString()}</span>
              </div>
              {orderData.expires_at && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                  Action deadline: {new Date(orderData.expires_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-800 mb-4 border-b border-slate-100 pb-2">Contract & Audit History</h2>
            <p className="text-sm text-slate-600">
              Contract {orderData.contract?.number || `#${orderData.contract?.id || '—'}`} · Version {orderData.contract?.version || '—'}
            </p>
            <div className="mt-4 space-y-3">
              {(orderData.events || []).map((event, index) => (
                <div key={`${event.event_type}-${event.created_at}-${index}`} className="border-l-2 border-orange-300 pl-3 text-xs">
                  <p className="font-bold text-slate-800">{event.event_type.replaceAll('_', ' ')}</p>
                  <p className="text-slate-500">{event.actor} · {new Date(event.created_at).toLocaleString()}</p>
                  {event.reason && <p className="mt-1 text-slate-600">{event.reason}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
