'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import api from '../../../lib/api';

interface B2BOrder {
  id: number;
  booking_reference: string;
  hotel_name: string;
  check_in: string;
  check_out: string;
  status: string;
  allocation_status?: string;
  payment_status?: string;
  booking_mode: string;
  total_rooms: number;
  b2b_selling_total: string;
}

export default function BookingsPage() {
  const [orders, setOrders] = useState<B2BOrder[]>([]);
  const [bookingRef, setBookingRef] = useState('');
  const [travellerName, setTravellerName] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const response = await api.get('/b2b/orders/');
      setOrders(response.data);
    } catch {
      setError('Unable to load bookings. Please refresh the page.');
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchBookings();
  }, []);

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !bookingRef || !travellerName || !aadhaarNumber) return;

    setLoading(true);
    setMessage('');
    setError('');
    
    const formData = new FormData();
    formData.append('order_reference', bookingRef);
    formData.append('traveller_name', travellerName);
    formData.append('aadhaar_number', aadhaarNumber);
    formData.append('aadhaar_front_image', file);

    try {
      const response = await api.post('/b2b/upload-document/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.status === 'success') {
        setMessage('Document uploaded successfully.');
        setFile(null);
        setBookingRef('');
        setTravellerName('');
        setAadhaarNumber('');
      } else {
        setError(response.data.error || 'Failed to upload document.');
      }
    } catch (err: unknown) {
      const response = (err as { response?: { data?: { error?: string } } }).response;
      setError(response?.data?.error || 'An error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 font-playfair">My Bookings & KYC</h1>
        <p className="mt-1 text-sm text-slate-600">Review your B2B bookings and upload the primary guest&apos;s Aadhaar when required.</p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4"><h2 className="font-semibold text-slate-800">Recent bookings</h2></div>
        {loadingBookings ? <div className="p-6 text-sm text-slate-500">Loading bookings…</div> : orders.length === 0 ? <div className="p-6 text-sm text-slate-500">No B2B bookings yet.</div> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3">Hotel</th>
                  <th className="px-6 py-3">Dates</th>
                  <th className="px-6 py-3">Mode</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Alloc. Status</th>
                  <th className="px-6 py-3">Payment</th>
                  <th className="px-6 py-3 text-right">Total Amount</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 font-medium text-slate-800">{order.booking_reference}</td>
                    <td className="px-6 py-4 text-slate-600">{order.hotel_name}</td>
                    <td className="px-6 py-4 text-slate-600">{order.check_in} to {order.check_out}</td>
                    <td className="px-6 py-4 text-slate-600">{order.booking_mode} ({order.total_rooms} Rooms)</td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${order.status === 'CONFIRMED' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="px-2 py-1 rounded text-xs font-bold bg-purple-100 text-purple-700">
                        {order.allocation_status || 'PENDING'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      <span className="px-2 py-1 rounded text-xs font-bold bg-amber-100 text-amber-700">
                        {order.payment_status || 'LEDGER_HOLD'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800">₹{parseFloat(order.b2b_selling_total).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/bookings/${order.booking_reference}`} className="text-orange-500 font-bold hover:underline">View details</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <h2 className="text-xl font-semibold text-slate-800">Upload traveller Aadhaar</h2>
        <p className="mb-6 mt-2 text-sm text-slate-600">Upload an image of the primary guest&apos;s Aadhaar card only when it is required for the booking.</p>
        {message && <div className="mb-6 rounded-xl border border-green-100 bg-green-50 p-4 text-green-700">{message}</div>}
        {error && <div className="mb-6 rounded-xl border border-red-100 bg-red-50 p-4 text-red-700">{error}</div>}
        <form onSubmit={handleUpload} className="max-w-lg space-y-5">
          <label className="block text-sm font-medium text-slate-700">Booking Reference<select className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" value={bookingRef} onChange={(event) => setBookingRef(event.target.value)} required><option value="">Select a booking</option>{orders.map((order) => <option key={order.booking_reference} value={order.booking_reference}>{order.booking_reference}</option>)}</select></label>
          <label className="block text-sm font-medium text-slate-700">Traveller name<input className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" value={travellerName} onChange={(event) => setTravellerName(event.target.value)} required /></label>
          <label className="block text-sm font-medium text-slate-700">Aadhaar number<input inputMode="numeric" pattern="[0-9]{12}" maxLength={12} className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" value={aadhaarNumber} onChange={(event) => setAadhaarNumber(event.target.value.replace(/\D/g, ''))} required /></label>
          <label className="block text-sm font-medium text-slate-700">Aadhaar front image<input type="file" className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 p-3" onChange={(event) => setFile(event.target.files?.[0] || null)} accept="image/jpeg,image/png" required /></label>
          <button type="submit" disabled={loading || !file || !bookingRef} className="w-full rounded-xl bg-orange-500 px-4 py-3.5 font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70">{loading ? 'Uploading…' : 'Upload document'}</button>
        </form>
      </section>
    </div>
  );
}
