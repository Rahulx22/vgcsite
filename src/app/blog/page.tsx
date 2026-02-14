import InnerBanner from "../components/InnerBanner";
import BlogSlider from "./BlogSlider";
import { fetchWithTimeout, ensureUrl, stripHtml } from "../../lib/api";
// import BlogCard from "../components/BlogCard";
// import Link from "next/link";
import type { Metadata } from "next";

type PageSEO = {
  title?: string;
  description?: string;
  keywords?: string;
  banner?: string | null;
  alt?: string | null;
};

type ApiPage = {
  slug?: string;
  meta_title?: string | null;
  meta_description?: string | null;
  meta_keywords?: string | null;
  banner_image?: string | null;
  banner_alt?: string | null;
};

type ApiBlog = {
  id?: number | string;
  title?: string | null;
  short_description?: string | null;
  featured_image?: string | null;
  cover_image?: string | null;
  created_at?: string | null;
  slug?: string | null;
  status?: string | null;
};

type BlogCardData = {
  id: number | string;
  title: string;
  excerpt: string;
  image: string;
  date: string;
  slug: string;
};

// Note: we'll use `generateMetadata` (App Router) for per-page dynamic meta tags

// =============================
// Dynamic Settings
// =============================
export const dynamic = "force-dynamic";
export const revalidate = 300;

const PER_PAGE = 3;

// =============================
// Fetch Page SEO + Banner from API
// =============================
async function getPageSEO(): Promise<PageSEO | null> {
  try {
    const res = await fetchWithTimeout(
      "https://panel.vgcadvisors.com/api/v1/pages",
      { cache: "force-cache", next: { revalidate: 300 } }
    );

    if (!res.ok) return null;

    const json = await res.json();
    console.log("Fetched Pages Data:", json);
    const page = (json?.data as ApiPage[] | undefined)?.find((p) => p?.slug === "blog");

    if (!page) return null;

    return {
      title: page.meta_title || "Our Blog",
      description: page.meta_description || "",
      keywords: page.meta_keywords || "",
      banner: ensureUrl(page.banner_image),
      alt: page.banner_alt || "Blog Banner",
    };
  } catch {
    return null;
  }
}

// ----------------------------
// Next metadata generation
// ----------------------------
export async function generateMetadata(): Promise<Metadata> {
  const seo = await getPageSEO();
  if (!seo) return {};

  const siteUrl = "https://vgcadvisors.com/blog";

  return {
    title: seo.title || "Our Blog",
    description: seo.description || "",
    keywords: seo.keywords || "",
    alternates: { canonical: siteUrl },
    openGraph: {
      title: seo.title || "Our Blog",
      description: seo.description || "",
      url: siteUrl,
      images: seo.banner ? [{ url: seo.banner, alt: seo.alt || "Blog Banner" }] : undefined,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

// =============================
// Fetch Blogs
// =============================
async function getBlogs(): Promise<ApiBlog[]> {
  try {
    const res = await fetchWithTimeout(
      "https://panel.vgcadvisors.com/api/v1/blogs",
      { cache: "force-cache", next: { revalidate: 300 } }
    );
    if (!res.ok) return [];

    const json = await res.json();
    console.log(json);
    return (json?.data as ApiBlog[]) ?? [];
  } catch {
    return [];
  }
}

// =============================
// Format Date
// =============================
function formatDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// =============================
// PAGE COMPONENT
// =============================
export default async function BlogPage({ searchParams }: { searchParams?: { page?: string | number } }) {
  const rawPage = Array.isArray(searchParams?.page) ? searchParams?.page[0] : searchParams?.page;
  const page = Number(rawPage || 1);

  const pageSEO = await getPageSEO();
  const blogsData = await getBlogs();
  

  const allBlogs: BlogCardData[] = blogsData
    .filter((b) => !b.status || ["active", "Active", "ACTIVE"].includes((b.status || "").trim()))
    .map((b, i) => ({
      id: b.id ?? `${b.slug ?? 'blog'}-${i}`,
      title: b.title || "",
      excerpt: stripHtml(b.short_description || ""),
      image: ensureUrl(b.featured_image || b.cover_image),
      date: formatDate(b.created_at),
      slug: b.slug || "",
    }));

    console.log("Formatted Blogs for Slider:", allBlogs);
  const totalBlogs = allBlogs.length;
  const totalPages = Math.ceil(totalBlogs / PER_PAGE);
  const start = (page - 1) * PER_PAGE;
  const paginatedBlogs = allBlogs.slice(start, start + PER_PAGE);

  const breadcrumb = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
  ];



  return (
    <>
      {/* =============================
            BANNER FROM PAGE API (UI title fixed — metadata still generated for head)
        ============================= */}
      <InnerBanner
        title={stripHtml(allBlogs?.title || "Our Blog")}
        breadcrumb={breadcrumb}
        image={pageSEO?.banner || "/images/service-banner.webp"}
        alt={pageSEO?.alt || "Blog Banner"}
      />

      <div className="blog-sec dd">
        <h2 data-aos="fade-up" data-aos-duration="1200">{stripHtml(allBlogs?.title || "Our Blog")}</h2>

        <div className="container">
          <div className="row">
            {/* Render slider (client component) showing 3 items per slide */}
            <BlogSlider blogs={allBlogs} itemsPerSlide={3} />
          </div>

        </div>
      </div>
    </>
  );
}
