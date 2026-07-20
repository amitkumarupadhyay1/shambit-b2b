import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Providers } from '../components/Providers';

const devServiceWorkerReset = `
  (async function () {
    const resetKey = 'shambit-dev-service-worker-reset';
    const resetVersion = '2026-07-18-global-rate-card';
    if (!('serviceWorker' in navigator) || sessionStorage.getItem(resetKey) === resetVersion) return;

    const registrations = await navigator.serviceWorker.getRegistrations();
    const cacheNames = 'caches' in window ? await window.caches.keys() : [];
    const hasStaleWorker = registrations.length > 0 || navigator.serviceWorker.controller !== null;

    sessionStorage.setItem(resetKey, resetVersion);
    if (!hasStaleWorker && cacheNames.length === 0) return;

    await Promise.all(registrations.map((registration) => registration.unregister()));
    await Promise.all(cacheNames.map((cacheName) => window.caches.delete(cacheName)));
    window.location.reload();
  })();
`;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#FF9933",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "ShamBit B2B Agent Portal",
  description: "Premium portal for ShamBit travel agents to manage bookings and ledgers.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Agent Portal",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="font-sans antialiased bg-background text-foreground">
        {process.env.NODE_ENV === "development" && (
          <script
            id="dev-service-worker-reset"
            dangerouslySetInnerHTML={{ __html: devServiceWorkerReset }}
          />
        )}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
