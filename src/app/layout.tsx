import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "CineBook — Luxury Cinema Ticket Booking Platform",
  description:
    "Reserve premium seats for the latest blockbuster releases in IMAX, Dolby Cinema, and VIP Lounges. Real-time seat maps, instant digital tickets, and seamless checkout.",
  keywords: [
    "cinema ticket booking",
    "movie tickets",
    "IMAX laser",
    "Dolby cinema",
    "VIP cinema seats",
  ],
  openGraph: {
    title: "CineBook — Production Cinema Booking Platform",
    description:
      "Reserve tickets with real-time seat locks, digital QR passes, and instant booking confirmations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen flex flex-col bg-cinema-950 text-slate-100 antialiased selection:bg-amber-500 selection:text-cinema-950">
        <Navbar />
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
