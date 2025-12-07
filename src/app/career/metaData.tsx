import type { Metadata } from "next";
import CareerPage from "./page";

// Fetch CMS page data
async function getCareerPage() {
  try {
    const res = await fetch(
      "https://vgc.psofttechnologies.in/api/v1/pages?slug=career",
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
  const page = await getCareerPage();

  if (!page) {
    return {
      title: "Career - VGC Advisors",
      description: "Join the VGC Advisors team and explore career opportunities.",
      robots: "index, follow",
      alternates: { canonical: "https://vgcadvisors.com/career" },
    };
  }

  return {
    title: page.meta_title || page.title || "Career - VGC Advisors",
    description:
      page.meta_description ||
      "Explore career opportunities and grow with VGC Advisors.",
    keywords: page.meta_keywords || "",
    robots: "index, follow",
    alternates: { canonical: "https://vgcadvisors.com/career" },
  };
}

// Render Page
export default function CareerPage() {
  return <CareerPage />;
}
