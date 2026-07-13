import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import PublicPropertyView from '../../../components/property/PublicPropertyView';

// Helper to fetch and securely scrub data
async function getPublicHotelData(slug: string) {
  // Extract ID from the slug using regex (e.g., "142-ayodhya-grand" -> "142" or just "142")
  const match = slug.match(/^(\d+)(?:-|$)/);
  if (!match) return null;
  
  const hotelId = parseInt(match[1], 10);
  if (isNaN(hotelId)) return null;

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL environment variable is not set");
    
    // Attempt to fetch from the explicit endpoint if it exists
    const response = await fetch(`${apiUrl}/hotels/${hotelId}/`, {
      next: { revalidate: 3600 } // Cache for 1 hour for fast public serving
    });

    let data;
    
    if (response.ok) {
      data = await response.json();
    } else {
      // If the explicit endpoint doesn't exist, we do not fallback to search.
      // This prevents inefficient N+1 fetching or full-table scans.
      return null;
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

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) throw new Error("NEXT_PUBLIC_API_URL environment variable is not set");
    // Using content_type=inventory.hotel for standard hotel models
    const seoRes = await fetch(`${apiUrl}/seo/data/for_object/?content_type=inventory.hotel&object_id=${hotel.id}`);
    
    if (seoRes.ok) {
      const seoData = await seoRes.json();
      if (seoData && seoData.title) {
        return {
          title: seoData.title,
          description: seoData.description || hotel.description.substring(0, 160) + '...',
          keywords: seoData.keywords || '',
          openGraph: {
            title: seoData.og_title || seoData.title,
            description: seoData.og_description || seoData.description || hotel.description.substring(0, 160) + '...',
            images: [{ url: seoData.og_image || primaryImage }],
            type: 'website',
          },
          twitter: {
            card: 'summary_large_image',
            title: seoData.og_title || seoData.title,
            description: seoData.og_description || seoData.description || hotel.description.substring(0, 160) + '...',
            images: [seoData.og_image || primaryImage],
          },
        };
      }
    }
  } catch (err) {
    console.error("Failed to fetch SEO data:", err);
  }

  // Fallback to basic metadata
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
