'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import styles from './search.module.css';

interface HotelResult {
  id: number;
  name: string;
  address: string;
  description: string;
  star_rating: number;
  images: Array<{ id: number; image: string; is_primary: boolean }>;
  rooms: Array<Record<string, unknown>>;
  b2b_pricing?: {
    contract_id: number;
    base_price: string;
    net_rate: string;
    tac_amount: string;
    commission_type: string;
  };
}

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [adults, setAdults] = useState(2);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<HotelResult[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await api.get('/v1/b2b/search/', {
        params: {
          q: query,
          check_in: checkIn,
          check_out: checkOut,
          adults: adults
        }
      });
      // The API returns { status: 'success', results: [...] } or just an array
      const hits = response.data.results || response.data || [];
      setResults(hits);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadImages = async (hotelName: string, images: Array<{ id: number; image: string; is_primary: boolean }>) => {
    // Simple implementation: trigger download for each image
    images.forEach(async (img) => {
      try {
        const response = await fetch(img.image);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${hotelName.replace(/\s+/g, '_')}_${img.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Failed to download image:', err);
      }
    });
  };

  const proceedToCheckout = (hotelId: number) => {
    router.push(`/dashboard/checkout?hotel_id=${hotelId}&check_in=${checkIn}&check_out=${checkOut}&adults=${adults}`);
  };

  return (
    <div className={styles.searchContainer}>
      <h1 className={styles.pageTitle}>B2B Hotel Search</h1>
      
      <div className={`glass-panel ${styles.searchBox}`}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.inputGroup}>
            <label>Destination / Hotel Name</label>
            <input 
              type="text" 
              className="input-field"
              placeholder="e.g., Ayodhya, Prayagraj"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Check In</label>
            <input 
              type="date" 
              className="input-field"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Check Out</label>
            <input 
              type="date" 
              className="input-field"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              required
            />
          </div>
          <div className={styles.inputGroup}>
            <label>Adults</label>
            <input 
              type="number" 
              min="1"
              className="input-field"
              value={adults}
              onChange={(e) => setAdults(Number(e.target.value))}
              required
            />
          </div>
          <div className={styles.buttonGroup}>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.resultsGrid}>
        {results.map((hotel) => {
          const primaryImage = hotel.images?.find(i => i.is_primary)?.image || hotel.images?.[0]?.image || '/placeholder-hotel.jpg';
          
          return (
            <div key={hotel.id} className={`glass-panel ${styles.hotelCard}`}>
              <div className={styles.imageWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={primaryImage} alt={hotel.name} className={styles.hotelImage} />
                <button 
                  onClick={() => handleDownloadImages(hotel.name, hotel.images)}
                  className={styles.downloadBtn}
                  title="Download all photos to share via WhatsApp"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Get Media
                </button>
              </div>
              <div className={styles.hotelDetails}>
                <h3 className={styles.hotelName}>{hotel.name}</h3>
                <p className={styles.hotelAddress}>{hotel.address}</p>
                <div className={styles.rating}>
                  {Array(hotel.star_rating).fill('⭐').join('')}
                </div>
                
                {hotel.b2b_pricing && (
                  <div className={styles.pricingBox}>
                    <div className={styles.priceRow}>
                      <span>Gross Rate:</span>
                      <span className={styles.strikeThrough}>₹{hotel.b2b_pricing.base_price}</span>
                    </div>
                    <div className={styles.priceRow}>
                      <span className={styles.netLabel}>B2B Net Rate:</span>
                      <span className={styles.netValue}>₹{hotel.b2b_pricing.net_rate}</span>
                    </div>
                    <div className={styles.tacRow}>
                      Your Commission (TAC): <span>₹{hotel.b2b_pricing.tac_amount}</span>
                    </div>
                  </div>
                )}
                
                <button 
                  onClick={() => proceedToCheckout(hotel.id)}
                  className={`btn-primary ${styles.bookBtn}`}
                >
                  Book Now
                </button>
              </div>
            </div>
          );
        })}
        
        {!loading && results.length === 0 && query && !error && (
          <div className={styles.emptyState}>
            No B2B inventory found for your search criteria.
          </div>
        )}
      </div>
    </div>
  );
}
