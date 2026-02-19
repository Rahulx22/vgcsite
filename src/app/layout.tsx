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
  (() => { });

async function fetchSettingsOnce() {
  noStoreCompat();

  const h = await headers();
  const host = h.get("x-forwarded-host") || h.get("host");
  const proto = h.get("x-forwarded-proto") || "http";
  // In server runtime avoid fetching the local API route (which can cause
  // self-connection timeouts in some dev environments). Fetch the upstream
  // settings endpoint directly instead.
  const res = await fetch("https://panel.vgcadvisors.com/api/v1/settings", { cache: "no-store" });
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
  const tracking = settings?.data?.tracking || {};
  const gaEnabled = tracking?.analytics?.enabled;
  const GA_ID = tracking?.analytics?.tracking_id;
  const gtmEnabled = tracking?.gtm?.enabled;
  const GTM_ID = tracking?.gtm?.container_id;
  const fbEnabled = tracking?.facebook_pixel?.enabled;
  const FB_ID = tracking?.facebook_pixel?.pixel_id;
  const customScripts = tracking?.custom_scripts || {};


  // console.log("Settings loaded in RootLayout:", {
  //   tracking,
  //   gaEnabled,
  //   GA_ID,
  //   gtmEnabled,
  //   GTM_ID,
  //   fbEnabled,
  //   FB_ID,
  //   customScripts
  // }, tracking,settings);

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

        {/* Organization JSON-LD to help Google show site/company logo in search */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name:
                settings?.data?.company_name ||
                settings?.data?.site_name ||
                settings?.data?.title ||
                "VGC Advisors",
              url: settings?.data?.site_url || "https://vgcadvisors.com",
              logo:
                (settings?.data?.logo || settings?.data?.logo_url)
                  ? (String(settings?.data?.logo || settings?.data?.logo_url).startsWith("http")
                      ? String(settings?.data?.logo || settings?.data?.logo_url)
                      : `https://vgcadvisors.com${String(settings?.data?.logo || settings?.data?.logo_url)}`)
                  : "https://vgcadvisors.com/images/logo.webp",
              sameAs: settings?.data?.social_profiles || settings?.data?.social || [],
            }),
          }}
        />

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

        {/* Google Tag Manager */}
        {gtmEnabled && GTM_ID && (
          <Script id="gtm-inline" strategy="afterInteractive">{`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'? '&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','${GTM_ID}');`}</Script>
        )}

        {/* Facebook Pixel */}
        {fbEnabled && FB_ID && (
          <>
            <Script id="fb-pixel" strategy="afterInteractive">{`!function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
            n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
            (window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${FB_ID}'); fbq('track', 'PageView');`}</Script>
          </>
        )}

        {/* Custom scripts (e.g. JSON-LD) */}
        {Object.entries(customScripts).map(([name, code], idx) => {
          // If the stored value is a <script type="application/ld+json">...</script>
          const match = String(code).match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
          if (match) {
            const jsonLd = match[1];
            return (
              <script
                key={`custom-jsonld-${idx}`}
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: jsonLd }}
              />
            );
          }

          // If the value contains a raw <script>...</script>, extract inner content
          const genericMatch = String(code).match(/<script[^>]*>([\s\S]*?)<\/script>/i);
          const inner = genericMatch ? genericMatch[1] : String(code);
          return (
            <Script key={`custom-${idx}`} id={`custom-script-${idx}`} strategy="afterInteractive">
              {String(inner)}
            </Script>
          );
        })}
      </head>


      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {gtmEnabled && GTM_ID && (
          <noscript
            dangerouslySetInnerHTML={{
              __html: `<iframe src="https://www.googletagmanager.com/ns.html?id=${GTM_ID}" height="0" width="0" style="display:none;visibility:hidden"></iframe>`,
            }}
          />
        )}
        <AutoBanner />
        <GlobalLoader />

        <AOSProvider>
          <HeaderContainer initial={settings} />
          {children}
          <FooterContainer initial={settings} />
        </AOSProvider>

        <PerformanceMonitor />

        {/* noscript fallback for Facebook Pixel */}
        {fbEnabled && FB_ID && (
          <noscript
            dangerouslySetInnerHTML={{
              __html: `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${FB_ID}&ev=PageView&noscript=1" />`,
            }}
          />
        )}

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
