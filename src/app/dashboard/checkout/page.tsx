'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import styles from './checkout.module.css';

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hotelId = searchParams.get('hotel_id');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form State
  const [primaryGuest, setPrimaryGuest] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  
  // B2B specific requests
  const [vipDarshan, setVipDarshan] = useState(false);
  const [localTransport, setLocalTransport] = useState(false);
  const [preferredFloor, setPreferredFloor] = useState('any');

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const payload = {
        hotel_id: parseInt(hotelId as string),
        check_in: searchParams.get('check_in'),
        check_out: searchParams.get('check_out'),
        adults: parseInt(searchParams.get('adults') as string),
        primary_guest_name: primaryGuest,
        contact_email: contactEmail,
        contact_phone: contactPhone,
        special_requests: specialRequests,
        b2b_metadata: {
          vip_darshan_required: vipDarshan,
          local_transport_required: localTransport,
          preferred_floor: preferredFloor
        }
      };

      const response = await api.post('/v1/b2b/checkout/', payload);
      
      if (response.data.status === 'success') {
        setSuccess(`Booking confirmed! Ledger has been debited. Booking ID: ${response.data.booking_id}`);
        setTimeout(() => {
          router.push('/dashboard/bookings');
        }, 3000);
      } else {
        setError(response.data.message || 'Checkout failed');
      }
    } catch (err) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'An error occurred during checkout.');
    } finally {
      setLoading(false);
    }
  };

  if (!hotelId) {
    return <div className={styles.error}>No hotel selected for checkout.</div>;
  }

  return (
    <div className={styles.checkoutContainer}>
      <h1 className={styles.pageTitle}>Complete B2B Booking</h1>
      
      {success && <div className={styles.successAlert}>{success}</div>}
      {error && <div className={styles.errorAlert}>{error}</div>}
      
      <div className={styles.checkoutLayout}>
        <div className={styles.mainForm}>
          <form onSubmit={handleCheckout} className={`glass-panel ${styles.formPanel}`}>
            <h2 className={styles.sectionTitle}>Guest Information</h2>
            <div className={styles.grid2}>
              <div className={styles.inputGroup}>
                <label>Primary Guest Name</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={primaryGuest}
                  onChange={e => setPrimaryGuest(e.target.value)}
                  required 
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Contact Phone</label>
                <input 
                  type="tel" 
                  className="input-field" 
                  value={contactPhone}
                  onChange={e => setContactPhone(e.target.value)}
                  required 
                />
              </div>
              <div className={styles.inputGroup}>
                <label>Contact Email</label>
                <input 
                  type="email" 
                  className="input-field" 
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  required 
                />
              </div>
            </div>

            <h2 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Agent Preferences & Value Adds</h2>
            <div className={styles.b2bOptions}>
              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={vipDarshan}
                  onChange={e => setVipDarshan(e.target.checked)}
                />
                <span className={styles.checkboxText}>
                  <strong>VIP Darshan Arrangement</strong>
                  <small>Request priority access for the guests at key religious sites.</small>
                </span>
              </label>

              <label className={styles.checkboxLabel}>
                <input 
                  type="checkbox" 
                  checked={localTransport}
                  onChange={e => setLocalTransport(e.target.checked)}
                />
                <span className={styles.checkboxText}>
                  <strong>Local Transport Required</strong>
                  <small>Add local cab services to this package.</small>
                </span>
              </label>

              <div className={styles.inputGroup} style={{ marginTop: '1rem' }}>
                <label>Preferred Floor Mapping</label>
                <select 
                  className="input-field" 
                  value={preferredFloor}
                  onChange={e => setPreferredFloor(e.target.value)}
                >
                  <option value="any">No Preference</option>
                  <option value="ground">Ground Floor (Elderly/Accessible)</option>
                  <option value="high">High Floor (Better Views)</option>
                </select>
              </div>
            </div>

            <h2 className={styles.sectionTitle} style={{ marginTop: '2rem' }}>Additional Requests</h2>
            <div className={styles.inputGroup}>
              <textarea 
                className="input-field" 
                rows={4}
                value={specialRequests}
                onChange={e => setSpecialRequests(e.target.value)}
                placeholder="Dietary requirements, extra beds, etc."
              />
            </div>

            <div className={styles.formFooter}>
              <button type="submit" className="btn-primary" disabled={loading || !!success}>
                {loading ? 'Processing...' : 'Confirm Booking via Ledger'}
              </button>
            </div>
          </form>
        </div>
        
        <div className={styles.sidebar}>
          <div className={`glass-panel ${styles.summaryPanel}`}>
            <h3 className={styles.summaryTitle}>Booking Summary</h3>
            <div className={styles.summaryItem}>
              <span>Check In</span>
              <strong>{searchParams.get('check_in')}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>Check Out</span>
              <strong>{searchParams.get('check_out')}</strong>
            </div>
            <div className={styles.summaryItem}>
              <span>Guests</span>
              <strong>{searchParams.get('adults')} Adults</strong>
            </div>
            
            <hr className={styles.divider} />
            
            <div className={styles.ledgerWarning}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
              Payment will be automatically held against your B2B Ledger credit limit.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className={styles.loading}>Loading Checkout...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}
