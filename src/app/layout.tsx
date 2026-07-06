import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShamBit B2B Agent Portal",
  description: "Exclusive portal for ShamBit travel agents to manage bookings and ledgers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
