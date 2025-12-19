import type { Metadata } from "next";

const API_URL = "https://vgc.psofttechnologies.in/api/v1/pages";

async function getServicePage() {
  const res = await fetch(API_URL, {
    cache: "force-cache",
    next: { revalidate: 300 },
  });

  if (!res.ok) return null;

  const json = await res.json();
  return (
    json?.data?.find((p: any) => p.slug === "services") ||
    json?.data?.find((p: any) => p.type === "services") ||
    null
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const page = await getServicePage();

  return {
    title:
      page?.meta_title ||
      page?.title ||
      "Services | VGC Advisors",

    description:
      page?.meta_description ||
      "Explore expert tax, compliance, and consulting services offered by VGC Advisors.",

    keywords: page?.meta_keywords || "",

    robots: {
      index: true,
      follow: true,
    },

    alternates: {
      canonical: "https://vgcadvisors.com/service",
    },

    openGraph: {
      title:
        page?.meta_title ||
        "Professional Services | VGC Advisors",
      description:
        page?.meta_description ||
        "Comprehensive business, tax, and compliance solutions.",
      url: "https://vgcadvisors.com/service",
      siteName: "VGC Advisors",
      type: "website",
    },
  };
}
