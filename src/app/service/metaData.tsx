import type { Metadata } from "next";
import ServicePage from "./page";

// Fetch CMS page data
async function getServicePage() {
  try {
    const res = await fetch(
      "https://vgc.psofttechnologies.in/api/v1/pages?slug=services",
      { next: { revalidate: 300 } }
    );

    if (!res.ok) return null;

    const json = await res.json();
    return json?.data?.[0] || null;
  } catch (e) {
    return null;
  }
}

// Dynamic SEO Metadata
export async function generateMetadata(): Promise<Metadata> {
  const page = await getServicePage();

  if (!page) {
    return {
      title: "Services - VGC Advisors",
      description: "Explore expert tax, compliance, and consulting services offered by VGC Advisors.",
      robots: "index, follow",
      alternates: { canonical: "https://vgcadvisors.com/services" },
    };
  }

  return {
    title: page.meta_title || page.title || "Services - VGC Advisors",
    description:
      page.meta_description ||
      "Explore professional services offered by VGC Advisors.",
    keywords: page.meta_keywords || "",
    robots: "index, follow",
    alternates: { canonical: "https://vgcadvisors.com/services" },
  };
}

// Render Page
export default function ServicePage() {
  return <ServicePage />;
}
