'use client';

import { useState } from 'react';
import api from '@/lib/api';

export default function BookingsPage() {
  const [bookingId, setBookingId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('AADHAAR');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !bookingId) return;

    setLoading(true);
    setMessage('');
    setError('');

    const formData = new FormData();
    formData.append('booking_id', bookingId);
    formData.append('document_type', documentType);
    formData.append('file', file);

    try {
      const response = await api.post('/v1/b2b/upload-document/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.status === 'success') {
        setMessage('Document uploaded successfully. It is now pending verification.');
        setFile(null);
        setBookingId('');
      } else {
        setError(response.data.message || 'Failed to upload document');
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'An error occurred during upload.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 font-playfair">My Bookings & KYC</h1>
      
      <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">Upload Traveller KYC / Aadhaar</h2>
        <p className="text-sm text-slate-600 mb-6">
          For VIP Darshan requests and standard compliance, please upload the primary guest&apos;s Aadhaar card. 
          The document will be securely stored and marked as pending verification by the admin.
        </p>

        {message && <div className="mb-6 p-4 rounded-xl bg-green-50 text-green-700 border border-green-100">{message}</div>}
        {error && <div className="mb-6 p-4 rounded-xl bg-red-50 text-red-700 border border-red-100">{error}</div>}

        <form onSubmit={handleUpload} className="space-y-5 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Booking ID</label>
            <input 
              type="text" 
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 outline-none" 
              value={bookingId}
              onChange={e => setBookingId(e.target.value)}
              placeholder="e.g. 1042"
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Document Type</label>
            <select 
              className="block w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm transition-all bg-slate-50 outline-none" 
              value={documentType}
              onChange={e => setDocumentType(e.target.value)}
              required
            >
              <option value="AADHAAR">Aadhaar Card</option>
              <option value="PASSPORT">Passport</option>
              <option value="PAN">PAN Card</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Upload File</label>
            <input 
              type="file" 
              className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-medium file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 transition-all border border-slate-200 rounded-xl bg-slate-50"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required 
            />
            <small className="mt-2 block text-xs text-slate-500">Supported formats: PDF, JPG, PNG. Max 5MB.</small>
          </div>

          <button 
            type="submit" 
            className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-orange-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed transform hover:-translate-y-0.5 mt-4" 
            disabled={loading || !file || !bookingId}
          >
            {loading ? 'Uploading Securely...' : 'Upload KYC Document'}
          </button>
        </form>
      </div>
    </div>
  );
}
