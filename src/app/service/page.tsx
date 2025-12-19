// src/app/services/page.tsx
import { Metadata } from 'next';
import ServicesClient from './ServicesClient'; 



// Helper to fetch the services page data
async function fetchServicesPage(): Promise< null> {
  try {
    const res = await fetch("https://vgc.psofttechnologies.in/api/v1/pages", {
      next: { revalidate: 300 }, // ISR: revalidate every 5 minutes
    });

    if (!res.ok) return null;

    const json = await res.json();
    const pages = Array.isArray(json?.data) ? json.data : [];

    // Adjust based on your actual API: common identifiers for services page
    return pages.find((page: any) => 
      page.type === 'services' || 
      page.slug === 'services' || 
      page.slug === 'service'
    ) ?? null;
  } catch (error) {
    console.error('Failed to fetch services page data:', error);
    return null;
  }
}

// Dynamic metadata from API
export async function generateMetadata(): Promise<Metadata> {
  const servicesPage = await fetchServicesPage();

  // Fallback metadata
  if (!servicesPage) {
    return {
      title: "Our Services | VGC Consulting",
      description: "Expert business registration, taxation, compliance, and advisory services for MSMEs, corporates, and global ventures.",
      alternates: { canonical: "https://vgcadvisors.com/services" },
      robots: "index, follow",
      other: {
        "google-site-verification": "dQfS1gfzdBySBdAcoPTdOltneKPZB8gWMIeDBKf8G2I",
      },
    };
  }

  return {
    title: servicesPage.meta_title || servicesPage.title || "Our Services | VGC Consulting",
    description: 
      servicesPage.meta_description || 
      "VGC Consulting offers comprehensive business, tax, compliance, and advisory services tailored for growth and clarity.",
    keywords: servicesPage.meta_keywords || "services, tax consulting, business registration, compliance, GST, VGC Consulting",
    alternates: {
      canonical: "https://vgcadvisors.com/services",
    },
    robots: "index, follow",
    openGraph: {
      title: servicesPage.meta_title || servicesPage.title || "Our Services | VGC Consulting",
      description: servicesPage.meta_description || "Expert financial and compliance solutions for your business.",
      url: "https://vgcadvisors.com/services",
      type: "website",
      // images: servicesPage.og_image ? [{ url: ensureUrl(servicesPage.og_image) }] : undefined,
    },
    other: {
      "google-site-verification": "dQfS1gfzdBySBdAcoPTdOltneKPZB8gWMIeDBKf8G2I",
    },
  };
}

export default async function ServicesPage() {
  const servicesData = await fetchServicesPage();

  // Graceful fallback if data fails to load
  if (!servicesData) {
    return (
      <div className="container text-center py-5">
        <h2>Failed to load services page data</h2>
        <p>Please try again later.</p>
      </div>
    );
  }

  // Pass data to client component (for any interactivity like tabs, modals, etc.)
  return <ServicesClient initialData={servicesData} />;
}