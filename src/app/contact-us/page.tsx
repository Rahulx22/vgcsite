// src/app/contact/page.tsx
import { Metadata } from 'next';
import ContactClient from './contact';

// Helper to fetch the contact page data (shared between metadata and page)
async function fetchContactPage(): Promise<null> {
  try {
    const res = await fetch("https://panel.vgcadvisors.com/api/v1/pages", {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) return null;

    const json = await res.json();
    const pages = Array.isArray(json?.data) ? json.data : [];

    // Find contact page by type or slug (adjust if your API uses different identifiers)
    return pages.find((page: any) => page.type === 'contact' || page.slug === 'contact') ?? null;
  } catch (error) {
    console.error('Failed to fetch contact page for metadata:', error);
    return null;
  }
}

// Dynamic metadata based on API data
export async function generateMetadata(): Promise<Metadata> {
  const contactPage = await fetchContactPage();
  console.log("Contact Page Data for Metadata:", contactPage);
  // Fallback if no data
  if (!contactPage) {
    return {
      title: "Contact Us | VGC Consulting",
      description: "Get in touch with VGC Consulting for business, tax, and compliance solutions.",
      alternates: { canonical: "https://vgcadvisors.com/contact" },
      robots: "index, follow",
      other: {
        "google-site-verification": "dQfS1gfzdBySBdAcoPTdOltneKPZB8gWMIeDBKf8G2I",
      },
    };
  }




  "Contact us at VGC Consulting for queries, support, or consultations. Our team is ready to assist MSMEs, corporates, and global ventures efficiently."
  return {
    title: contactPage.meta_title || contactPage.title || "Contact Us | VGC Consulting",
    description: contactPage.meta_description || "Contact VGC Consulting for expert advice and support.",
    keywords: contactPage.meta_keywords || "contact, VGC Consulting, inquiry, support",
    alternates: {
      canonical: "https://vgcadvisors.com/contact",
    },
    robots: "index, follow",
    openGraph: {
      title: contactPage.meta_title || contactPage.title,
      description: contactPage.meta_description,
      url: "https://vgcadvisors.com/contact",
      type: "website",
      // Add images if your API provides og_image or similar
    },
    other: {
      "google-site-verification": "dQfS1gfzdBySBdAcoPTdOltneKPZB8gWMIeDBKf8G2I",
    },
  };
}

export default async function ContactPage() {
  const contactData = await fetchContactPage();

  // Optional: handle no data gracefully (show error or fallback UI)
  if (!contactData) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '50px 0' }}>
        <h2>Failed to load contact page data</h2>
      </div>
    );
  }

  // Pass the server-fetched data to the client component
  return <ContactClient initialData={contactData} />;
}