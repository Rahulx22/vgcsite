// src/app/services/page.tsx

import { Metadata } from "next";
import ServicesClient from "./ServicesClient";

// Force dynamic rendering (remove after testing if not needed)
export const dynamic = "force-dynamic";

// Revalidate every 5 minutes (ISR)
export const revalidate = 300;

// -----------------------------
// Types
// -----------------------------
interface ServicesPageData {
  title?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  slug?: string;
  type?: string;
}

// -----------------------------
// Fetch Services Page Data
// -----------------------------
async function fetchServicesPage(): Promise<ServicesPageData | null> {
  try {
    const res = await fetch("https://panel.vgcadvisors.com/api/v1/pages", {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error("API Response Error:", res.status);
      return null;
    }

    const json = await res.json();
    const pages = Array.isArray(json?.data) ? json.data : [];

    const servicesPage =
      pages.find(
        (page: any) =>
          page.type === "services" ||
          page.slug === "services" ||
          page.slug === "service"
      ) || null;

    return servicesPage;
  } catch (error) {
    console.error("Failed to fetch services page data:", error);
    return null;
  }
}

// -----------------------------
// Dynamic Metadata
// -----------------------------
export async function generateMetadata(): Promise<Metadata> {
  const servicesPage = await fetchServicesPage();

  // Fallback metadata
  if (!servicesPage) {
    return {
      title: "Our Services | VGC Consulting",
      description:
        "Expert business registration, taxation, compliance, and advisory services for MSMEs, corporates, and global ventures.",
      alternates: {
        canonical: "https://vgcadvisors.com/services",
      },
      robots: {
        index: true,
        follow: true,
      },
      openGraph: {
        title: "Our Services | VGC Consulting",
        description:
          "Expert business registration, taxation, compliance, and advisory services for MSMEs, corporates, and global ventures.",
        url: "https://vgcadvisors.com/services",
        type: "website",
      },
      other: {
        "google-site-verification":
          "dQfS1gfzdBySBdAcoPTdOltneKPZB8gWMIeDBKf8G2I",
      },
    };
  }

  return {
    title:
      servicesPage.meta_title ||
      servicesPage.title ||
      "Our Services | VGC Consulting",

    description:
      servicesPage.meta_description ||
      "VGC Consulting offers comprehensive business, tax, compliance, and advisory services tailored for growth and clarity.",

    keywords:
      servicesPage.meta_keywords ||
      "services, tax consulting, business registration, compliance, GST, VGC Consulting",

    alternates: {
      canonical: "https://vgcadvisors.com/service",
    },

    robots: {
      index: true,
      follow: true,
    },

    openGraph: {
      title:  
        servicesPage.meta_title ||
        servicesPage.title ||
        "Our Services | VGC Consulting",

      description:
        servicesPage.meta_description ||
        "Expert financial and compliance solutions for your business.",

      url: "https://vgcadvisors.com/service",
      type: "website",
    },

    other: {
      "google-site-verification":
        "dQfS1gfzdBySBdAcoPTdOltneKPZB8gWMIeDBKf8G2I",
    },
  };
}

// -----------------------------
// Page Component
// -----------------------------
export default async function ServicesPage() {
  const servicesData = await fetchServicesPage();

  if (!servicesData) {
    return (
      <div className="container text-center py-5">
        <h2>Failed to load services page data</h2>
        <p>Please try again later.</p>
      </div>
    );
  }

  return <ServicesClient initialData={servicesData} />;
}
