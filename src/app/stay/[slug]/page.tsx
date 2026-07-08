import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicPropertyView from '@/components/property/PublicPropertyView';

// Helper to fetch and securely scrub data
async function getPublicHotelData(slug: string) {
  // Extract ID from the slug (e.g., "142-ayodhya-grand" -> "142")
  const idStr = slug.split('-')[0];
  const hotelId = parseInt(idStr, 10);
  
  if (isNaN(hotelId)) return null;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    
    // Attempt to fetch from the explicit endpoint if it exists
    let response = await fetch(`${apiUrl}/hotels/${hotelId}/`, {
      next: { revalidate: 3600 } // Cache for 1 hour for fast public serving
    });

    let data;
    
    if (response.ok) {
      data = await response.json();
    } else {
      // Fallback: If explicit endpoint doesn't exist, use the search API
      // In production, the backend team should create a dedicated public endpoint
      response = await fetch(`${apiUrl}/b2b/search/?q=${slug}`, {
        next: { revalidate: 3600 }
      });
      if (!response.ok) return null;
      
      const searchData = await response.json();
      const results = searchData.results || searchData || [];
      data = results.find((h: { id: number }) => h.id === hotelId);
      
      if (!data) return null;
    }

    // ==========================================
    // CRITICAL SECURITY SCRUBBING
    // ==========================================
    // Ensure B2B pricing, ledgers, or any sensitive data NEVER leaves this server function
    
    const publicData = {
      id: data.id,
      name: data.name,
      address: data.address,
      description: data.description || '',
      star_rating: data.star_rating || 3,
      images: data.images || [],
      rooms: data.rooms || []
    };
    
    // Explicitly delete any known pricing fields just in case they slipped into rooms array
    publicData.rooms = publicData.rooms.map((room: { name?: string; description?: string; [key: string]: unknown }) => {
      const safeRoom = { ...room };
      delete safeRoom.b2b_pricing;
      delete safeRoom.b2c_pricing;
      delete safeRoom.base_rate;
      delete safeRoom.net_rate;
      delete safeRoom.tac;
      return safeRoom;
    });

    return publicData;

  } catch (error) {
    console.error("Failed to fetch public hotel data:", error);
    return null;
  }
}

// Generate SEO Metadata dynamically
export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const params = await props.params;
  const hotel = await getPublicHotelData(params.slug);

  if (!hotel) {
    return { title: 'Property Not Found' };
  }

  const primaryImage = hotel.images?.find((img: { is_primary: boolean; image: string }) => img.is_primary)?.image 
                    || hotel.images?.[0]?.image 
                    || '/placeholder-hotel.jpg';

  return {
    title: `${hotel.name} | ShamBit Collection`,
    description: hotel.description.substring(0, 160) + '...',
    openGraph: {
      title: hotel.name,
      description: hotel.description.substring(0, 160) + '...',
      images: [{ url: primaryImage }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: hotel.name,
      description: hotel.description.substring(0, 160) + '...',
      images: [primaryImage],
    },
  };
}

export default async function StayPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const hotel = await getPublicHotelData(params.slug);

  if (!hotel) {
    notFound();
  }

  const primaryImage = hotel.images?.find((img: { is_primary: boolean; image: string }) => img.is_primary)?.image 
                    || hotel.images?.[0]?.image 
                    || '';

  // JSON-LD Schema.org Data for Rich Search Results
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Hotel',
    name: hotel.name,
    image: primaryImage,
    description: hotel.description,
    address: {
      '@type': 'PostalAddress',
      streetAddress: hotel.address,
    },
    starRating: {
      '@type': 'Rating',
      ratingValue: hotel.star_rating.toString(),
      bestRating: '5',
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublicPropertyView hotel={hotel} />
    </>
  );
}
