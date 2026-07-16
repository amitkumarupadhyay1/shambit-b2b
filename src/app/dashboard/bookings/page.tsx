'use client';

import { useEffect, useState } from 'react';
import api from '../../../lib/api';
import { useRazorpay } from '../../../components/common/RazorpayPaymentHandler';

interface B2BBooking {
  id: number;
  booking: number | null;
  hotel_booking: number | null;
  booking_reference: string | null;
  booking_status: string | null;
  b2b_selling_total: string;
  pending_amount: string;
  accumulated_payment: string;
  payment_mode: string;
}

export default function BookingsPage() {
  const [bookings, setBookings] = useState<B2BBooking[]>([]);
  const [bookingId, setBookingId] = useState('');
  const [travellerName, setTravellerName] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const { openRazorpay } = useRazorpay();

  const fetchBookings = async () => {
    try {
      setLoadingBookings(true);
      const response = await api.get('/b2b/bookings/');
      const data = response.data.results ?? response.data;
      setBookings(Array.isArray(data) ? data : []);
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

  const handlePayBalance = async (booking: B2BBooking) => {
    const bookingPk = booking.booking || booking.hotel_booking;
    if (!bookingPk) return;
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const initiateRes = await api.post(`/b2b-bookings/${bookingPk}/initiate-payment/`, {
        amount: Number(booking.pending_amount)
      });
      
      if (initiateRes.data.order_id) {
        openRazorpay({
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
          amount: initiateRes.data.amount,
          currency: initiateRes.data.currency,
          name: 'ShamBit Travels',
          description: `Balance Payment for ${booking.booking_reference || bookingPk}`,
          order_id: initiateRes.data.order_id,
          handler: () => {
            setMessage('Payment successful! Balance cleared.');
            fetchBookings();
          },
          modal: {
            ondismiss: () => {
              setError('Payment cancelled.');
              setLoading(false);
            }
          }
        });
      } else {
        setError('Failed to initiate payment.');
        setLoading(false);
      }
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setError(e.response?.data?.error || 'Failed to initiate payment.');
      setLoading(false);
    }
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file || !bookingId || !travellerName || !aadhaarNumber) return;

    setLoading(true);
    setMessage('');
    setError('');
    const selectedBooking = bookings.find((booking) => String(booking.id) === bookingId);
    if (!selectedBooking) {
      setError('Select one of your bookings before uploading a document.');
      setLoading(false);
      return;
    }

    const formData = new FormData();
    if (selectedBooking.booking) formData.append('booking_id', String(selectedBooking.booking));
    if (selectedBooking.hotel_booking) formData.append('hotel_booking_id', String(selectedBooking.hotel_booking));
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
        setBookingId('');
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
        {loadingBookings ? <div className="p-6 text-sm text-slate-500">Loading bookings…</div> : bookings.length === 0 ? <div className="p-6 text-sm text-slate-500">No B2B bookings yet.</div> : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-slate-500">
                <tr>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Payment Mode</th>
                  <th className="px-6 py-3 text-right">Total Amount</th>
                  <th className="px-6 py-3 text-right">Paid</th>
                  <th className="px-6 py-3 text-right">Pending</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bookings.map((booking) => (
                  <tr key={booking.id}>
                    <td className="px-6 py-4 font-medium text-slate-800">{booking.booking_reference || `Booking #${booking.id}`}</td>
                    <td className="px-6 py-4 text-slate-600">{booking.booking_status || '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{booking.payment_mode}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-800">₹{Number(booking.b2b_selling_total).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-slate-600">₹{Number(booking.accumulated_payment || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-orange-600 font-medium">₹{Number(booking.pending_amount || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      {Number(booking.pending_amount || 0) > 0 && booking.payment_mode === 'PARTIAL_PAYMENT' ? (
                        <button
                          onClick={() => handlePayBalance(booking)}
                          disabled={loading}
                          className="px-3 py-1.5 bg-orange-100 text-orange-700 hover:bg-orange-200 rounded-lg text-xs font-medium transition-colors"
                        >
                          Pay Balance
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">Settled</span>
                      )}
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
          <label className="block text-sm font-medium text-slate-700">Booking<select className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" value={bookingId} onChange={(event) => setBookingId(event.target.value)} required><option value="">Select a booking</option>{bookings.map((booking) => <option key={booking.id} value={booking.id}>{booking.booking_reference || `Booking #${booking.id}`}</option>)}</select></label>
          <label className="block text-sm font-medium text-slate-700">Traveller name<input className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" value={travellerName} onChange={(event) => setTravellerName(event.target.value)} required /></label>
          <label className="block text-sm font-medium text-slate-700">Aadhaar number<input inputMode="numeric" pattern="[0-9]{12}" maxLength={12} className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3" value={aadhaarNumber} onChange={(event) => setAadhaarNumber(event.target.value.replace(/\D/g, ''))} required /></label>
          <label className="block text-sm font-medium text-slate-700">Aadhaar front image<input type="file" className="mt-1 block w-full rounded-xl border border-slate-200 bg-slate-50 p-3" onChange={(event) => setFile(event.target.files?.[0] || null)} accept="image/jpeg,image/png" required /></label>
          <button type="submit" disabled={loading || !file || !bookingId} className="w-full rounded-xl bg-orange-500 px-4 py-3.5 font-medium text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70">{loading ? 'Uploading…' : 'Upload document'}</button>
        </form>
      </section>
    </div>
  );
}
