import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import AOSProvider from "./components/AOSProvider";
import HeaderContainer from "./components/HeaderContainer";
import FooterContainer from "./components/FooterContainer";
import PerformanceMonitor from "./components/PerformanceMonitor";
import GlobalLoader from "./components/GlobalLoader";
import "./globals.css";

import * as NextCache from "next/cache";
import AutoBanner from "./components/OfferBanner";
import { headers } from "next/headers";

export const metadata: Metadata = {
  title: "VGC Consulting - Business, Tax & Compliance Solutions",
  description:
    "VGC Consulting provides comprehensive business, tax, and compliance solutions tailored to empower MSMEs, corporates, and global ventures.",
  other: {
    "google-site-verification":
      "dQfS1gfzdBySBdAcoPTdOltneKPZB8gWMIeDBKf8G2I",
  },
};

export const revalidate = 0;
export const dynamic = "force-dynamic";

const noStoreCompat =
  (NextCache as any).noStore ??
  (NextCache as any).unstable_noStore ??
  (() => {});

async function fetchSettingsOnce() {
  noStoreCompat();

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  // In server runtime avoid fetching the local API route (which can cause
  // self-connection timeouts in some dev environments). Fetch the upstream
  // settings endpoint directly instead.
  const res = await fetch("https://vgc.psofttechnologies.in/api/v1/settings", { cache: "no-store" });
  if (!res.ok) throw new Error(`Settings fetch failed: ${res.status}`);

  return res.json();
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await fetchSettingsOnce();
  const tracking = settings?.tracking || {};
  const gaEnabled = tracking?.analytics?.enabled;
  const GA_ID = tracking?.analytics?.tracking_id;

  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0"
        />

        {/* Preconnect */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />

        {/* Fonts */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Lato:wght@100;300;400;700;900&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@100..700&display=swap"
        />

        {/* AOS + CSS */}
        <link
          href="https://unpkg.com/aos@2.3.1/dist/aos.css"
          rel="stylesheet"
        />
        <link
          href="https://maxcdn.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"
          rel="stylesheet"
        />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/css/bootstrap.min.css"
          rel="stylesheet"
        />

        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/assets/owl.carousel.min.css"
          rel="stylesheet"
        />

        <link href="/css/style.css" rel="stylesheet" />
        <link href="/images/fav.webp" rel="icon" />

        {/* ✅ GOOGLE ANALYTICS (Dynamic) */}
        {gaEnabled && GA_ID && (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />

            <Script id="ga4-config" strategy="afterInteractive">{`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}');
            `}</Script>
          </>
        )}
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AutoBanner />
        <GlobalLoader />

        <AOSProvider>
          <HeaderContainer initial={settings} />
          {children}
          <FooterContainer initial={settings} />
        </AOSProvider>

        <PerformanceMonitor />

        {/* jQuery */}
        <Script
          src="https://code.jquery.com/jquery-3.7.1.min.js"
          strategy="beforeInteractive"
        />

        {/* AOS JS */}
        <Script
          src="https://unpkg.com/aos@2.3.1/dist/aos.js"
          strategy="lazyOnload"
        />

        {/* Bootstrap JS */}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.1.3/js/bootstrap.min.js"
          strategy="lazyOnload"
        />

        {/* Other Libraries */}
        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/classie/1.0.1/classie.js"
          strategy="lazyOnload"
        />

        <Script
          src="https://cdnjs.cloudflare.com/ajax/libs/OwlCarousel2/2.3.4/owl.carousel.min.js"
          strategy="lazyOnload"
        />

        {/* Custom JS */}
        <Script src="/js/custom.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
