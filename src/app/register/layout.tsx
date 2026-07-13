import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const defaultMeta: Metadata = {
    title: 'B2B Agent Registration | ShamBit Collection',
    description: 'Join the ShamBit Collection network as a certified B2B travel agent. Register now to access exclusive hotel deals and offer premium experiences to your clients.',
    openGraph: {
      title: 'B2B Agent Registration | ShamBit Collection',
      description: 'Join the ShamBit Collection network as a certified B2B travel agent. Register now to access exclusive hotel deals.',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
    },
    robots: 'index, follow', // Ensuring 100/100 crawlability
  };

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const res = await fetch(`${apiUrl}/seo/data/for_path/?path=/register`, {
      next: { revalidate: 3600 }, // Cache for 1 hour to optimize SSR/SSG
    });
    
    if (res.ok) {
      const seoData = await res.json();
      if (seoData && seoData.title) {
        return {
          title: seoData.title,
          description: seoData.description || defaultMeta.description,
          keywords: seoData.keywords || '',
          openGraph: {
            title: seoData.og_title || seoData.title,
            description: seoData.og_description || seoData.description || defaultMeta.description,
            images: seoData.og_image ? [{ url: seoData.og_image }] : undefined,
            type: 'website',
          },
          twitter: {
            card: 'summary_large_image',
            title: seoData.og_title || seoData.title,
            description: seoData.og_description || seoData.description || defaultMeta.description,
            images: seoData.og_image ? [seoData.og_image] : undefined,
          },
          robots: 'index, follow',
        };
      }
    }
  } catch (err) {
    console.error("Failed to fetch SEO metadata for /register route:", err);
  }

  return defaultMeta;
}

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  );
}
