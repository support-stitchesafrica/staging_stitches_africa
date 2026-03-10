import { ThemeProvider } from '@/contexts/ThemeContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';
import type { Metadata } from "next";
import Script from "next/script";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import "./shops/globals.css";
import { Toaster } from "sonner";
import { WebsiteHitsTracker } from "@/components/WebsiteHitsTracker";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { MobileMenuProvider } from "@/contexts/MobileMenuContext";
import "@/lib/firebase-init"; // 🚀 Enable Firebase performance optimizations
import InstallPromptWrapper from '@/components/client/InstallPromptWrapper';

export const metadata: Metadata = {
  metadataBase: new URL("https://www.stitchesafrica.com"), // ✅ Required for OG/Twitter images
  title: "Stitches Africa - Explore Fashion",
  description:
    "Discover bespoke African fashion with Stitches Africa. Download our app and redefine your style.",
  keywords: ["Stitches Africa", "Fashion", "African Fashion", "Bespoke Fashion"],
  authors: [{ name: "Stitches Africa", url: "https://stitchesafrica.com" }],
  creator: "Stitches Africa",
  manifest: "/manifest.json",
  icons: {
    icon: "/Stitches Africa Logo-06.png",
    shortcut: "/Stitches Africa Logo-06.png",
    apple: "/Stitches Africa Logo-06.png",
  },
  openGraph: {
    title: "Stitches Africa - Explore Fashion",
    description:
      "Discover bespoke African fashion with Stitches Africa. Download our app and redefine your style.",
    url: "https://www.stitchesafrica.com",
    siteName: "Stitches Africa",
    images: [
      {
        url: "/stiches-africa-logo.png",
        width: 1200,
        height: 630,
        alt: "Stitches Africa Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Stitches Africa - Explore Fashion",
    description:
      "Discover bespoke African fashion with Stitches Africa. Download our app and redefine your style.",
    images: ["/stiches-africa-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>)
{
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* Preload critical resources */}
        <link rel="preload" href="/stiches-africa-logo.png" as="image" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        
        <style>{`
          html {
            font-family: ${GeistSans.style.fontFamily}, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            --font-sans: ${GeistSans.variable};
            --font-mono: ${GeistMono.variable};
          }
          
          /* Critical CSS for loading states */
          .loading-skeleton {
            background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
            background-size: 200% 100%;
            animation: loading 1.5s infinite;
          }
          
          @keyframes loading {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>

        {/* ✅ Google Ads Tag - Load after interactive */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17649108372"
          strategy="afterInteractive"
        />
        <Script id="google-ads-tag" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17649108372');
          `}
        </Script>
      </head>
      <body>
        <ThemeProvider>
          <CurrencyProvider>
            <AuthProvider>
              <CartProvider>
                <WishlistProvider>
                  <MobileMenuProvider>
                    <WebsiteHitsTracker />
                    <InstallPromptWrapper />
                    {children}
                  </MobileMenuProvider>
                </WishlistProvider>
              </CartProvider>
            </AuthProvider>
          </CurrencyProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
