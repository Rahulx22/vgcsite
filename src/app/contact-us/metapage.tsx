import type { Metadata } from "next";
import ContactClient from "./page";

// Fetch CMS page data
async function getContactPage() {
  try {
    const res = await fetch(
      "https://vgc.psofttechnologies.in/api/v1/pages?slug=contact-us",
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
  const page = await getContactPage();

  if (!page) {
    console.warn("Contact page data not found for metadata generation.");
    return {
      title: "Contact Us - VGC Advisors",
      description: "Reach out to VGC Advisors for tax, compliance, and consulting.",
      robots: "index, follow",
      alternates: { canonical: "https://vgcadvisors.com/contact-us" },
    };
  }

  return {
    title: page.meta_title || page.title || "Contact Us - VGC Advisors",
    description:
      page.meta_description ||
      "Get in touch with VGC Advisors for expert consulting services.",
    keywords: page.meta_keywords || "",
    robots: "index, follow",
    alternates: { canonical: "https://vgcadvisors.com/contact-us" },
  };
}

// Render Page
export default function ContactPage() {
  return <ContactClient />;
}
