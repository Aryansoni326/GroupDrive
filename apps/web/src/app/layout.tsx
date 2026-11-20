import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CustomerAuthProvider } from "@/lib/auth-context";
import { CompareProvider } from "@/lib/compare-context";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { VehicleCompareTray } from "@/components/vehicle-compare-tray";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://groupdrive.in";

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "GROUPDRIVE - India's Premier Automotive Marketplace",
    template: "%s | GROUPDRIVE",
  },
  description:
    "Join forces with fellow verified car buyers to unlock institutional bulk discounts directly from authorized OEM automobile dealerships across India.",
  keywords: [
    "car buying India",
    "group buying cars",
    "automotive marketplace",
    "new car discount",
    "authorized car dealers",
    "compare cars",
    "car prices India",
    "DealerOS",
    "collective vehicle purchase",
  ],
  authors: [{ name: "GROUPDRIVE Technologies" }],
  creator: "GROUPDRIVE",
  publisher: "GROUPDRIVE",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: siteUrl,
    title: "GROUPDRIVE - India's Premier Automotive Marketplace",
    description:
      "Join collective buyer groups to unlock transparent, institutional group discounts on new cars directly from authorized OEM dealerships.",
    siteName: "GROUPDRIVE",
    images: [
      {
        url: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=630&fit=crop&q=80",
        width: 1200,
        height: 630,
        alt: "GROUPDRIVE Automotive Marketplace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GROUPDRIVE - India's Premier Automotive Marketplace",
    description:
      "Discover, compare, and join collective car buyer groups for verified OEM dealership discounts.",
    images: [
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=630&fit=crop&q=80",
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "GROUPDRIVE",
  url: siteUrl,
  logo: `${siteUrl}/images/logo.png`,
  description:
    "India's premier automotive technology marketplace connecting car buyers with authorized OEM dealerships through collective buying power.",
  sameAs: [
    "https://twitter.com/groupdrive_in",
    "https://linkedin.com/company/groupdrive-india",
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+91-800-476-8737",
    contactType: "customer service",
    areaServed: "IN",
    availableLanguage: ["en", "hi"],
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "GROUPDRIVE",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${siteUrl}/cars?q={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-600 selection:text-white">
        <a
          href="#main-content"
          style={{ position: "absolute", width: "1px", height: "1px", padding: 0, margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: 0 }}
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:font-semibold focus:rounded-md focus:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600"
        >
          Skip to main content
        </a>
        <CustomerAuthProvider>
          <CompareProvider>
            <Navbar />
            <main id="main-content" className="flex-1 focus:outline-none" tabIndex={-1}>
              {children}
            </main>
            <Footer />
            <VehicleCompareTray />
          </CompareProvider>
        </CustomerAuthProvider>
      </body>
    </html>
  );
}
