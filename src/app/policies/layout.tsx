import { Metadata } from 'next';

export async function generateMetadata(): Promise<Metadata> {
  const defaultMeta: Metadata = {
    title: 'Agency Policies | ShamBit Collection',
    description: 'ShamBit B2B Portal Policies. Learn about our commitment to the DPDP Act 2023 and Consumer Protection E-Commerce rules in India.',
    robots: 'index, follow', // Ensuring 100/100 crawlability
  };

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    const res = await fetch(`${apiUrl}/seo/data/for_path/?path=/policies`, {
      next: { revalidate: 3600 }, 
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
    console.error("Failed to fetch SEO metadata for /policies route:", err);
  }

  return defaultMeta;
}

export default function PoliciesLayout({
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
