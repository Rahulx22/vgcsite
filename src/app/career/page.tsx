// src/app/career/page.tsx
import { Metadata } from 'next';
import CareerClient from './CareerClient';
import type { CareerApiResponse } from '../../types/pages';

// Helper to fetch the career page data (shared between metadata and page)
async function fetchCareerPage(): Promise<CareerApiResponse | null> {
  try {
    const res = await fetch("https://vgc.psofttechnologies.in/api/v1/pages", {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!res.ok) return null;

    const json = await res.json();
    const pages = Array.isArray(json?.data) ? json.data : [];

    // Find career page by type or slug
    return pages.find((page: any) => page.type === 'career' || page.slug === 'career') ?? null;
  } catch (error) {
    console.error('Failed to fetch career page for metadata:', error);
    return null;
  }
}

// Dynamic metadata based on API data
export async function generateMetadata(): Promise<Metadata> {
  const careerPage = await fetchCareerPage();
  console.log("Career Page Data for Metadata:", careerPage);  

  // Fallback if no data
  if (!careerPage) {
    return {
      title: "Careers at VGC Consulting - Join Our Team",
      description: "VGC Consulting provides comprehensive business, tax, and compliance solutions.",
      alternates: { canonical: "https://vgcadvisors.com/career" },
      robots: "index, follow",
      other: {
        "google-site-verification": "dQfS1gfzdBySBdAcoPTdOltneKPZB8gWMIeDBKf8G2I",
      },
    };
  }

  return {
    title: careerPage.meta_title || careerPage.title || "Careers at VGC Consulting",
    description: careerPage.meta_description || "Join our team at VGC Consulting – explore career opportunities.",
    keywords: careerPage.meta_keywords||"careers, jobs, VGC Consulting, join our team",
    alternates: {
      canonical: "https://vgcadvisors.com/career",
    },
    robots: "index, follow",
    openGraph: {
      title: careerPage.meta_title || careerPage.title,
      description: careerPage.meta_description,
      url: "https://vgcadvisors.com/career",
      type: "website",
      // Add images if your API provides og_image or similar
    },
    other: {
      "google-site-verification": "dQfS1gfzdBySBdAcoPTdOltneKPZB8gWMIeDBKf8G2I",
    },
  };
}

export default async function CareerPage() {
  const careerData = await fetchCareerPage();

  // Optional: handle no data gracefully (show error or fallback UI)
  if (!careerData) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '50px 0' }}>
        <h2>Failed to load career page data</h2>
      </div>
    );
  }

  // Pass the server-fetched data to the client component
  return <CareerClient initialData={careerData} />;
}