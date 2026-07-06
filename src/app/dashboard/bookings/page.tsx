'use client';

import { useState } from 'react';
import api from '@/lib/api';
import styles from './bookings.module.css';

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
    <div className={styles.bookingsContainer}>
      <h1 className={styles.pageTitle}>My Bookings & KYC</h1>
      
      <div className={`glass-panel ${styles.uploadPanel}`}>
        <h2 className={styles.sectionTitle}>Upload Traveller KYC / Aadhaar</h2>
        <p className={styles.description}>
          For VIP Darshan requests and standard compliance, please upload the primary guest&apos;s Aadhaar card. 
          The document will be securely stored and marked as pending verification by the admin.
        </p>

        {message && <div className={styles.successAlert}>{message}</div>}
        {error && <div className={styles.errorAlert}>{error}</div>}

        <form onSubmit={handleUpload} className={styles.uploadForm}>
          <div className={styles.inputGroup}>
            <label>Booking ID</label>
            <input 
              type="text" 
              className="input-field" 
              value={bookingId}
              onChange={e => setBookingId(e.target.value)}
              placeholder="e.g. 1042"
              required 
            />
          </div>

          <div className={styles.inputGroup}>
            <label>Document Type</label>
            <select 
              className="input-field" 
              value={documentType}
              onChange={e => setDocumentType(e.target.value)}
              required
            >
              <option value="AADHAAR">Aadhaar Card</option>
              <option value="PASSPORT">Passport</option>
              <option value="PAN">PAN Card</option>
            </select>
          </div>

          <div className={styles.inputGroup}>
            <label>Upload File</label>
            <input 
              type="file" 
              className={styles.fileInput}
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
              required 
            />
            <small className={styles.helpText}>Supported formats: PDF, JPG, PNG. Max 5MB.</small>
          </div>

          <button type="submit" className="btn-primary" disabled={loading || !file || !bookingId}>
            {loading ? 'Uploading Securely...' : 'Upload KYC Document'}
          </button>
        </form>
      </div>
    </div>
  );
}
